import { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Save, Send, Upload, X } from "lucide-react";
import PostEditor from "@/components/editor/PostEditor";
import RequireAuth from "@/components/RequireAuth";
import { useCategories, useCreatePost, usePostById, useUpdatePost } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";
import { uploadsApi } from "@/lib/uploadsApi";
import { htmlToMarkdown } from "@/lib/markdown";
import { POST_STATUS_LABEL, POST_STATUS_PILL_CLASS } from "@/lib/postStatus";
import { ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { formatApiError, type ApiError } from "@/lib/apiErrors";
import { notify } from "@/lib/notify";
import type { PostStatus } from "@/types";

const INPUT_CLASS =
	"w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-brand-mid outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

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

function EditorScreen({ mode, postId }: { mode: "new" | "edit"; postId?: string }) {
	const navigate = useNavigate();
	const user = useAuthStore((s) => s.user);

	const postQuery = usePostById(mode === "edit" ? postId : undefined);
	const categoriesQuery = useCategories();
	const createPost = useCreatePost();
	const updatePost = useUpdatePost();

	const [title, setTitle] = useState("");
	const [excerpt, setExcerpt] = useState("");
	const [coverUrl, setCoverUrl] = useState("");
	const [tagsInput, setTagsInput] = useState("");
	const [contentHtml, setContentHtml] = useState("");
	const [status, setStatus] = useState<PostStatus>("draft");
	const [version, setVersion] = useState(1);
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
	const [uploadingCover, setUploadingCover] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (mode === "edit" && postQuery.data) {
			const p = postQuery.data;
			setTitle(p.title);
			setExcerpt(p.excerpt ?? "");
			setCoverUrl(p.coverUrl ?? "");
			setTagsInput(p.tags.join(", "));
			setContentHtml(p.contentHtml);
			setStatus(p.status);
			setVersion(p.version);
			setSelectedCategoryIds((p.categories ?? []).map((c) => c.category.id));
		}
	}, [mode, postQuery.data]);

	async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingCover(true);
		try {
			const { url } = await uploadsApi.uploadImage(file);
			setCoverUrl(url);
		} catch {
			notify.error("Failed to upload cover image");
		} finally {
			setUploadingCover(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	const titleInvalid = title.trim().length === 0;
	const categoryInvalid = selectedCategoryIds.length === 0;
	const contentInvalid = contentHtml.trim().length === 0 || contentHtml === "<p></p>";
	const formInvalid = titleInvalid || categoryInvalid || contentInvalid;
	const submitting = createPost.isPending || updatePost.isPending;

	async function save(nextStatus: PostStatus) {
		if (formInvalid || !user) return;

		let contentMd: string;
		try {
			contentMd = htmlToMarkdown(contentHtml);
		} catch {
			notify.error("Failed to convert content. Please try again.");
			return;
		}

		// External URL → rehost onto our S3 so the backend allowlist accepts it.
		// Backend short-circuits when the URL is already on-host.
		let finalCoverUrl = coverUrl.trim() || null;
		if (finalCoverUrl) {
			try {
				const { url } = await uploadsApi.uploadFromUrl(finalCoverUrl);
				finalCoverUrl = url;
				if (url !== coverUrl.trim()) setCoverUrl(url);
			} catch (err) {
				notify.error(formatApiError(err as ApiError, "Failed to fetch cover image"));
				return;
			}
		}

		const payload = {
			title: title.trim(),
			contentHtml,
			contentMd,
			excerpt: excerpt.trim() || undefined,
			coverUrl: finalCoverUrl,
			status: nextStatus,
			tags: tagsInput
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean),
			categoryIds: selectedCategoryIds,
		};

		try {
			if (mode === "new") {
				const created = await createPost.mutateAsync(payload);
				navigate({ to: "/blog/$username", params: { username: user.username } });
				return created;
			}
			const updated = await updatePost.mutateAsync({ id: postId!, version, ...payload });
			setVersion(updated.version);
			setStatus(updated.status);
		} catch (err) {
			const apiErr = err as ApiError;
			const code = apiErr.response?.status;
			if (code === 409 || code === 401 || code === 403) return;
			notify.error(formatApiError(apiErr));
		}
	}

	// `RequireAuth` gates rendering on a logged-in user, but on the brief commit
	// window after a logout-while-mounted the store has cleared `user` before
	// RequireAuth's effect navigates away. Bail rather than asserting non-null.
	if (!user) return null;

	if (mode === "edit" && postQuery.isLoading) {
		return (
			<div className="bg-brand-surface flex min-h-screen items-center justify-center">
				<p className="text-brand-mid">Loading...</p>
			</div>
		);
	}

	if (mode === "edit" && postQuery.isError) {
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
								{mode === "new" ? "New post" : "Edit post"}
							</h1>
							{mode === "edit" && (
								<p className="text-brand-mid mt-0.5 text-xs">
									Status: <StatusBadge status={status} />
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => save("draft")}
							disabled={submitting}
							className="border-brand-border text-brand-dark hover:bg-brand-hero flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm transition-colors disabled:opacity-60"
						>
							<Save className="h-4 w-4" />
							<span className="hidden sm:inline">Save draft</span>
						</button>
						<button
							type="button"
							onClick={() => save("pending")}
							disabled={submitting}
							className="bg-brand-dark hover:bg-brand-mid flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white transition-colors disabled:opacity-60"
						>
							<Send className="h-4 w-4" />
							<span className="hidden sm:inline">Submit for review</span>
						</button>
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
								{coverUrl && (
									<div className="relative mb-2">
										<img
											src={coverUrl}
											alt="Cover preview"
											className="aspect-video w-full rounded-lg object-cover"
										/>
										<button
											type="button"
											onClick={() => setCoverUrl("")}
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
										onChange={(e) => setCoverUrl(e.target.value)}
										placeholder="https://..."
										className={`${INPUT_CLASS} flex-1 text-xs`}
									/>
									<button
										type="button"
										disabled={uploadingCover}
										onClick={() => fileInputRef.current?.click()}
										className="border-brand-border text-brand-dark hover:bg-brand-hero flex items-center gap-1 rounded-lg border bg-white px-2.5 py-2 text-xs transition-colors disabled:opacity-60"
									>
										<Upload className="h-3.5 w-3.5" />
										{uploadingCover ? "..." : "Upload"}
									</button>
								</div>
								<input
									ref={fileInputRef}
									type="file"
									accept={ALLOWED_IMAGE_TYPES}
									className="hidden"
									onChange={handleCoverFileChange}
								/>
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
							<h2 className="text-brand-dark font-serif text-lg font-semibold">
								Categories <span className="text-red-600">*</span>
							</h2>
							{categoriesQuery.isLoading && <p className="text-brand-mid text-xs">Loading...</p>}
							{categoriesQuery.data?.length === 0 && (
								<p className="text-brand-mid text-xs">No categories yet</p>
							)}
							<div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
								{categoriesQuery.data?.map((cat) => {
									const checked = selectedCategoryIds.includes(cat.id);
									return (
										<label
											key={cat.id}
											className="hover:bg-brand-hero/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
										>
											<input
												type="checkbox"
												checked={checked}
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
							{categoryInvalid && (
								<p className="text-xs text-red-600">Pick at least one category.</p>
							)}
						</section>

						{mode === "edit" && status === "rejected" && (
							<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
								This post was rejected. Edit it and resubmit for review.
							</div>
						)}
					</aside>
				</div>
			</div>
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
