import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Save, Send, Trash2, Upload, X } from "lucide-react";
import PostEditor from "@/components/editor/PostEditor";
import RequireAuth from "@/components/RequireAuth";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SaveStatus from "@/components/editor/SaveStatus";
import {
	useCategories,
	useCreatePost,
	useDeletePost,
	usePostById,
	useUpdatePost,
} from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";
import { useAutoSave } from "@/hooks/useAutoSave";
import { uploadsApi } from "@/lib/uploadsApi";
import { htmlToMarkdown } from "@/lib/markdown";
import { POST_STATUS_LABEL, POST_STATUS_PILL_CLASS } from "@/lib/postStatus";
import { ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { formatApiError, type ApiError } from "@/lib/apiErrors";
import { notify } from "@/lib/notify";
import type { PostStatus } from "@/types";

const INPUT_CLASS =
	"w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-brand-mid outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

// Mirrors the backend caps; keep in sync.
const MAX_CATEGORIES = 3;
const MAX_COVER_BYTES = 10 * 1024 * 1024; // 10 MB

export default function EditorPage() {
	const params = useParams({ strict: false }) as Record<string, string>;
	const paramPostId = params.postId;
	const isNew = !paramPostId || paramPostId === "new";

	return (
		<RequireAuth>
			<EditorScreen mode={isNew ? "new" : "edit"} postId={isNew ? undefined : paramPostId} />
		</RequireAuth>
	);
}

function EditorScreen({ postId: initialPostId }: { mode: "new" | "edit"; postId?: string }) {
	const navigate = useNavigate();
	const user = useAuthStore((s) => s.user);

	// `postId` can be assigned mid-session: when the user first types into a
	// brand-new editor, we eagerly create a draft so autosave has something to
	// patch against. After that, we replaceState the URL so a refresh lands
	// back on /editor/$postId instead of /editor/new.
	const [postId, setPostId] = useState<string | undefined>(initialPostId);
	const effectiveMode: "new" | "edit" = postId ? "edit" : "new";

	const postQuery = usePostById(postId);
	const categoriesQuery = useCategories();
	const createPost = useCreatePost();
	const createPostAsync = createPost.mutateAsync;
	const updatePost = useUpdatePost();
	const deletePost = useDeletePost();

	const [title, setTitle] = useState("");
	const [excerpt, setExcerpt] = useState("");
	const [coverUrl, setCoverUrl] = useState("");
	const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
	const [tagsInput, setTagsInput] = useState("");
	const [contentHtml, setContentHtml] = useState("");
	const [status, setStatus] = useState<PostStatus>("draft");
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	// Tracks server version for optimistic-concurrency checks. A ref (not state)
	// so async flows (autoSave.saveNow → manual PATCH) always read the latest
	// value without waiting for a React re-render.
	const versionRef = useRef(1);
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
	const [pendingCover, setPendingCover] = useState<{ file: File; preview: string } | null>(null);
	const [uploadingCover, setUploadingCover] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const hasLoadedRef = useRef(false);
	// Guards against double-creating a draft while the first eager-create is
	// still in flight. A second keystroke arriving 50ms after the first must
	// not fire a second POST /posts.
	const eagerCreateInflightRef = useRef(false);
	// Stops the eager-create effect from retrying forever after a failure.
	// Without this, a 400 from validation would re-fire on every keystroke
	// (state still "meaningful", no postId, inflight=false) and spam the
	// server. The user has to refresh or change something material to retry.
	const eagerCreateFailedRef = useRef(false);

	useEffect(() => {
		const preview = pendingCover?.preview;
		return () => {
			if (preview) URL.revokeObjectURL(preview);
		};
	}, [pendingCover]);

	useEffect(() => {
		if (postQuery.data && !hasLoadedRef.current) {
			hasLoadedRef.current = true;
			const p = postQuery.data;
			setTitle(p.title);
			setExcerpt(p.excerpt ?? "");
			setCoverUrl(p.coverUrl ?? "");
			setThumbnailUrl(p.thumbnailUrl ?? null);
			setTagsInput(p.tags.join(", "));
			setContentHtml(p.contentHtml);
			setStatus(p.status);
			versionRef.current = p.version;
			setSelectedCategoryIds((p.categories ?? []).map((c) => c.category.id));
		}
	}, [postQuery.data]);

	// Autosave is enabled only while:
	//   - the user is the post author (admin edits go through manual save —
	//     the server rejects with 403 otherwise, which would render a noisy
	//     "save failed" toast every 30s)
	//   - the post is still a draft (server enforces this too with 409)
	//   - there's actually a postId (i.e. we've eagerly created the draft row)
	const isAuthor = !postQuery.data || (!!user && postQuery.data.user?.username === user.username);
	const autosaveEnabled = !!postId && status === "draft" && isAuthor;

	// Memoize the payload so useAutoSave's effect doesn't see a "new" reference
	// on every render. tags is joined → split each save; kept simple because
	// the editor isn't on a hot render path.
	const autosavePayload = useMemo(() => {
		// Skip contentMd in autosave — converting HTML→MD on every keystroke is
		// expensive. Backend re-derives reading_time from contentMd only when
		// it's provided; for autosave the slightly stale readingTime is fine,
		// and the final manual save sends the real contentMd.
		return {
			title: title.trim() || "Untitled",
			contentHtml,
			excerpt: excerpt.trim() || null,
			tags: tagsInput
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean),
		};
	}, [title, contentHtml, excerpt, tagsInput]);

	const autoSave = useAutoSave({
		postId,
		enabled: autosaveEnabled,
		payload: autosavePayload,
		// Keep local version in sync with server: each autosave bumps version
		// server-side, and a stale local value would make the next manual
		// "Save draft" 409 on the optimistic-concurrency check.
		onSaved: (nextVersion) => {
			versionRef.current = nextVersion;
		},
	});

	// Eager-create a draft on the very first meaningful keystroke in "new"
	// mode. We need a postId before autosave can fire; doing it here (instead
	// of on /editor/new mount) avoids littering the DB with empty drafts from
	// users who clicked "New post" and bounced.
	useEffect(() => {
		if (postId || eagerCreateInflightRef.current || eagerCreateFailedRef.current || !user) return;
		const hasMeaningfulContent =
			title.trim().length > 0 || (contentHtml.trim().length > 0 && contentHtml !== "<p></p>");
		if (!hasMeaningfulContent) return;

		// Categories are required by POST /posts. For an eager draft we don't
		// have a category yet, so defer creation until the user picks one. This
		// keeps the create-post contract simple and gives the user a clear
		// reason their content isn't being saved yet.
		if (selectedCategoryIds.length === 0) return;

		eagerCreateInflightRef.current = true;
		(async () => {
			try {
				let contentMd: string;
				try {
					contentMd = htmlToMarkdown(contentHtml);
				} catch {
					contentMd = "";
				}
				const created = await createPostAsync({
					title: title.trim() || "Untitled",
					contentHtml,
					contentMd,
					excerpt: excerpt.trim() || undefined,
					coverUrl: null,
					status: "draft",
					tags: tagsInput
						.split(",")
						.map((t) => t.trim())
						.filter(Boolean),
					categoryIds: selectedCategoryIds,
				});
				// Mark "already loaded" BEFORE setting postId. Otherwise the
				// usePostById(postId) hook fires a GET as soon as setPostId
				// commits, and when its response arrives the load effect (line
				// ~90) would treat this fresh in-memory state as "uninitialized"
				// and overwrite title/contentHtml/coverUrl/selectedCategoryIds
				// with the server snapshot — which is necessarily a subset of
				// what the user just typed (and `coverUrl: null` because eager
				// create posts without an uploaded cover). That overwrite is
				// the visible "flash" the user reports.
				hasLoadedRef.current = true;
				setPostId(created.id);
				versionRef.current = created.version;
				setStatus(created.status);
				// Replace the URL so refresh-during-editing lands on /editor/$id
				// instead of /editor/new. Use the router (not replaceState) so
				// TanStack Router re-renders in-place instead of unmounting.
				navigate({ to: "/editor/$postId", params: { postId: created.id }, replace: true });
			} catch (err) {
				// Latch on failure so the effect doesn't spam POST /posts on
				// every subsequent keystroke. The user has to manually click
				// "Submit for review" later (which uses the same payload
				// validated by the same schema) to retry — at that point the
				// underlying problem is probably fixed.
				eagerCreateFailedRef.current = true;
				notify.error(formatApiError(err as ApiError, "Failed to start draft"));
			} finally {
				eagerCreateInflightRef.current = false;
			}
		})();
	}, [
		postId,
		user,
		title,
		contentHtml,
		excerpt,
		tagsInput,
		selectedCategoryIds,
		createPostAsync,
		navigate,
	]);

	function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const preview = URL.createObjectURL(file);
		setPendingCover({ file, preview });
		setCoverUrl("");
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	const coverTooLarge = !!pendingCover && pendingCover.file.size > MAX_COVER_BYTES;
	const coverPreview = pendingCover?.preview || coverUrl;

	const titleInvalid = title.trim().length === 0;
	const categoryInvalid =
		selectedCategoryIds.length === 0 || selectedCategoryIds.length > MAX_CATEGORIES;
	const contentInvalid = contentHtml.trim().length === 0 || contentHtml === "<p></p>";
	const formInvalid = titleInvalid || categoryInvalid || contentInvalid || coverTooLarge;
	const submitting = createPost.isPending || updatePost.isPending || uploadingCover;

	async function confirmDeleteDraft() {
		if (!postId || !user) return;
		try {
			await deletePost.mutateAsync(postId);
			navigate({ to: "/blog/$username", params: { username: user.username } });
		} catch {
			notify.error("Failed to delete draft");
		} finally {
			setConfirmDeleteOpen(false);
		}
	}

	async function save(nextStatus: PostStatus) {
		if (formInvalid || !user) return;

		// Flush any pending autosave first so we don't race the manual save's
		// version bump. The autosave hook serializes its own flushes, so this
		// is safe even if a debounce timer is mid-flight.
		await autoSave.saveNow();

		let contentMd: string;
		try {
			contentMd = htmlToMarkdown(contentHtml);
		} catch {
			notify.error("Failed to convert content. Please try again.");
			return;
		}

		let finalCoverUrl: string | null = null;

		if (pendingCover) {
			setUploadingCover(true);
			try {
				const { url, thumbnailUrl: thumb } = await uploadsApi.uploadImage(pendingCover.file);
				finalCoverUrl = url;
				setCoverUrl(url);
				setThumbnailUrl(thumb);
				setPendingCover(null);
			} catch (err) {
				notify.error(formatApiError(err as ApiError, "Failed to upload cover image"));
				setUploadingCover(false);
				return;
			}
			setUploadingCover(false);
		} else {
			// External URL → rehost onto our S3 so the backend allowlist accepts it.
			// Backend short-circuits when the URL is already on-host.
			finalCoverUrl = coverUrl.trim() || null;
			if (finalCoverUrl) {
				try {
					const { url, thumbnailUrl: thumb } = await uploadsApi.uploadFromUrl(finalCoverUrl);
					finalCoverUrl = url;
					if (url !== coverUrl.trim()) {
						setCoverUrl(url);
						setThumbnailUrl(thumb);
					}
				} catch (err) {
					notify.error(formatApiError(err as ApiError, "Failed to fetch cover image"));
					return;
				}
			}
		}

		const payload = {
			title: title.trim(),
			contentHtml,
			contentMd,
			excerpt: excerpt.trim() || undefined,
			coverUrl: finalCoverUrl,
			thumbnailUrl: finalCoverUrl ? thumbnailUrl : null,
			status: nextStatus,
			tags: tagsInput
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean),
			categoryIds: selectedCategoryIds,
		};

		try {
			if (effectiveMode === "new") {
				const created = await createPost.mutateAsync(payload);
				navigate({ to: "/blog/$username", params: { username: user.username } });
				return created;
			}
			// Read version from the ref, not the closure: autoSave.saveNow()
			// above may have bumped it via onSaved, but the closure was created
			// at render time and still holds the pre-flush value.
			const updated = await updatePost.mutateAsync({
				id: postId!,
				version: versionRef.current,
				...payload,
			});
			versionRef.current = updated.version;
			setStatus(updated.status);
			// If the user pressed "Save draft", stay on the editor and surface
			// the updated state. If they submitted for review / published, take
			// them to their profile so they can see the post in its new status.
			if (nextStatus !== "draft") {
				navigate({ to: "/blog/$username", params: { username: user.username } });
			}
		} catch (err) {
			const apiErr = err as ApiError;
			const code = apiErr.response?.status;
			if (code === 409) {
				notify.error(
					"This post was modified elsewhere. Reload the page to get the latest version before saving.",
				);
				return;
			}
			if (code === 401 || code === 403) return;
			notify.error(formatApiError(apiErr));
		}
	}

	// `RequireAuth` gates rendering on a logged-in user, but on the brief commit
	// window after a logout-while-mounted the store has cleared `user` before
	// RequireAuth's effect navigates away. Bail rather than asserting non-null.
	if (!user) return null;

	// Only block render for the initial load of an existing post. After an
	// eager-create, hasLoadedRef is already true so we skip the loading screen
	// — showing it would unmount the form and lose TipTap + cover state.
	if (effectiveMode === "edit" && postQuery.isLoading && !hasLoadedRef.current) {
		return (
			<div className="bg-brand-surface flex min-h-screen items-center justify-center">
				<p className="text-brand-mid">Loading...</p>
			</div>
		);
	}

	if (effectiveMode === "edit" && postQuery.isError) {
		return (
			<div className="bg-brand-surface flex min-h-screen flex-col items-center justify-center gap-3">
				<p className="text-red-600">Failed to load post</p>
				<button onClick={() => navigate({ to: "/" })} className="text-brand-mid text-sm underline">
					Back to home
				</button>
			</div>
		);
	}

	return (
		<div className="bg-brand-surface min-h-screen">
			<div className="border-brand-border bg-brand-cream sticky top-0 z-30 border-b">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => navigate({ to: "/" })}
							className="text-brand-mid hover:text-brand-dark p-1"
							aria-label="Back to home"
						>
							<ArrowLeft className="h-5 w-5" />
						</button>
						<div>
							<h1 className="text-brand-dark font-serif text-xl font-bold sm:text-2xl">
								{effectiveMode === "new" ? "New post" : "Edit post"}
							</h1>
							<div className="mt-0.5 flex items-center gap-2 text-xs">
								{effectiveMode === "edit" && (
									<p className="text-brand-mid">
										Status: <StatusBadge status={status} />
									</p>
								)}
								{autosaveEnabled && (
									<SaveStatus status={autoSave.status} lastSavedAt={autoSave.lastSavedAt} />
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{effectiveMode === "edit" && status === "draft" && (
							<button
								type="button"
								onClick={() => setConfirmDeleteOpen(true)}
								disabled={submitting || deletePost.isPending}
								className="text-brand-mid p-2 transition-colors hover:text-red-600 disabled:opacity-60"
								aria-label="Delete draft"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						)}
						{/* Drafts are continuously autosaved — no manual "Save draft"
						    button needed. For posts that have already been published or
						    sent for review we still expose a manual "Save changes" so
						    the author has an explicit moment to commit edits (autosave
						    is intentionally disabled for non-drafts). */}
						{effectiveMode === "edit" && status !== "draft" && (
							<button
								type="button"
								onClick={() => save(status)}
								disabled={submitting || formInvalid}
								className="border-brand-border text-brand-dark hover:bg-brand-hero flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm transition-colors disabled:opacity-60"
							>
								<Save className="h-4 w-4" />
								<span className="hidden sm:inline">Save changes</span>
							</button>
						)}
						{status === "draft" && (
							<button
								type="button"
								onClick={() => save("pending")}
								disabled={submitting || formInvalid}
								className="bg-brand-dark hover:bg-brand-mid flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white transition-colors disabled:opacity-60"
							>
								<Send className="h-4 w-4" />
								<span className="hidden sm:inline">Submit for review</span>
							</button>
						)}
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
				<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
					<div className="space-y-5">
						<div>
							<label htmlFor="title" className="text-brand-dark mb-1.5 block text-sm font-medium">
								Title
							</label>
							<input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="An engaging headline..."
								className={`${INPUT_CLASS} font-serif text-xl`}
							/>
						</div>

						<div>
							<label className="text-brand-dark mb-1.5 block text-sm font-medium">Content</label>
							<PostEditor value={contentHtml} onChange={setContentHtml} />
						</div>
					</div>

					<aside className="space-y-5">
						<section className="border-brand-border bg-brand-cream space-y-3 rounded-xl border p-4">
							<h2 className="text-brand-dark font-serif text-lg font-semibold">Details</h2>

							<div>
								<label htmlFor="excerpt" className="text-brand-dark mb-1.5 block text-sm">
									Excerpt
								</label>
								<textarea
									id="excerpt"
									value={excerpt}
									onChange={(e) => setExcerpt(e.target.value)}
									rows={3}
									placeholder="Short summary shown on the feed"
									className={`${INPUT_CLASS} resize-none`}
								/>
							</div>

							<div>
								<label className="text-brand-dark mb-1.5 block text-sm">Cover image</label>
								{coverPreview && (
									<div className="relative mb-2">
										<img
											src={coverPreview}
											alt="Cover preview"
											className="aspect-video w-full rounded-lg object-cover"
										/>
										<button
											type="button"
											onClick={() => {
												setCoverUrl("");
												setPendingCover(null);
											}}
											className="absolute top-1.5 right-1.5 rounded-full bg-black/55 p-1 text-white hover:bg-black/75"
											aria-label="Remove cover image"
										>
											<X className="h-3.5 w-3.5" />
										</button>
									</div>
								)}
								<div className="flex gap-2">
									<input
										value={coverUrl}
										onChange={(e) => {
											setCoverUrl(e.target.value);
											if (pendingCover) setPendingCover(null);
										}}
										placeholder="https://..."
										className={`${INPUT_CLASS} flex-1 text-xs`}
									/>
									<button
										type="button"
										disabled={submitting}
										onClick={() => fileInputRef.current?.click()}
										className="border-brand-border text-brand-dark hover:bg-brand-hero flex items-center gap-1 rounded-lg border bg-white px-2.5 py-2 text-xs transition-colors disabled:opacity-60"
									>
										<Upload className="h-3.5 w-3.5" />
										Upload
									</button>
								</div>
								<input
									ref={fileInputRef}
									type="file"
									accept={ALLOWED_IMAGE_TYPES}
									className="hidden"
									onChange={handleCoverFileChange}
								/>
								{coverTooLarge ? (
									<p className="mt-1 text-xs text-red-600">File exceeds 10 MB limit.</p>
								) : (
									<p className="text-brand-mid mt-1 text-xs">
										JPEG · PNG · WebP · GIF &nbsp;·&nbsp; max 10 MB
									</p>
								)}
							</div>

							<div>
								<label htmlFor="tags" className="text-brand-dark mb-1.5 block text-sm">
									Tags
								</label>
								<input
									id="tags"
									value={tagsInput}
									onChange={(e) => setTagsInput(e.target.value)}
									placeholder="rust, databases"
									className={INPUT_CLASS}
								/>
								<p className="text-brand-mid mt-1 text-xs">Comma separated</p>
							</div>
						</section>

						<section className="border-brand-border bg-brand-cream space-y-2 rounded-xl border p-4">
							<div className="flex items-baseline justify-between gap-2">
								<h2 className="text-brand-dark font-serif text-lg font-semibold">
									Categories <span className="text-red-600">*</span>
								</h2>
								<span className="text-brand-mid text-xs">
									{selectedCategoryIds.length}/{MAX_CATEGORIES}
								</span>
							</div>
							<p className="text-brand-mid text-xs">Pick up to {MAX_CATEGORIES}.</p>
							{categoriesQuery.isLoading && <p className="text-brand-mid text-xs">Loading...</p>}
							{categoriesQuery.data?.length === 0 && (
								<p className="text-brand-mid text-xs">No categories yet</p>
							)}
							<div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
								{categoriesQuery.data?.map((cat) => {
									const checked = selectedCategoryIds.includes(cat.id);
									const atLimit = selectedCategoryIds.length >= MAX_CATEGORIES;
									const disabled = !checked && atLimit;
									return (
										<label
											key={cat.id}
											className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
												disabled
													? "cursor-not-allowed opacity-50"
													: "hover:bg-brand-hero/60 cursor-pointer"
											}`}
										>
											<input
												type="checkbox"
												checked={checked}
												disabled={disabled}
												onChange={() =>
													setSelectedCategoryIds((prev) =>
														checked ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
													)
												}
												className="accent-brand-dark h-4 w-4"
											/>
											<span className="text-brand-dark">{cat.name}</span>
										</label>
									);
								})}
							</div>
							{selectedCategoryIds.length === 0 && (
								<p className="text-xs text-red-600">Pick at least one category.</p>
							)}
							{selectedCategoryIds.length > MAX_CATEGORIES && (
								<p className="text-xs text-red-600">Pick at most {MAX_CATEGORIES} categories.</p>
							)}
						</section>

						{effectiveMode === "edit" && status === "rejected" && (
							<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
								This post was rejected. Edit it and resubmit for review.
							</div>
						)}
					</aside>
				</div>
			</div>
			<ConfirmDialog
				open={confirmDeleteOpen}
				title="Delete this draft?"
				description="This cannot be undone."
				onConfirm={confirmDeleteDraft}
				onCancel={() => setConfirmDeleteOpen(false)}
				loading={deletePost.isPending}
			/>
		</div>
	);
}

function StatusBadge({ status }: { status: PostStatus }) {
	return (
		<span
			className={`rounded-full px-2 py-0.5 text-xs font-medium ${POST_STATUS_PILL_CLASS[status]}`}
		>
			{POST_STATUS_LABEL[status]}
		</span>
	);
}
