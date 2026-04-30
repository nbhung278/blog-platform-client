import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import {
	type CommentItem,
	type CommentSort,
	type CommentThread,
	useCommentClap,
	useComments,
	useCreateComment,
	useDeleteComment,
	useUpdateComment,
} from "@/hooks/useComments";
import { notify } from "@/lib/notify";
import { safeImageUrl } from "@/lib/sanitize";
import ClapButton from "./ClapButton";

const INITIAL_REPLIES = 3;

interface Props {
	postId: string;
	open: boolean;
	onClose: () => void;
}

export default function CommentDrawer({ postId, open, onClose }: Props) {
	const [sort, setSort] = useState<CommentSort>("new");
	const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useComments(
		postId,
		open ? sort : sort,
	);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	const flashedHashRef = useRef<string | null>(null);
	const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
	const total = data?.pages[0]?.total ?? 0;

	useEffect(() => {
		if (!open) {
			flashedHashRef.current = null;
			return;
		}
		if (!allItems.length) return;
		const hash = window.location.hash;
		if (!hash.startsWith("#comment-")) return;
		if (flashedHashRef.current === hash) return;
		const id = hash.slice("#comment-".length);
		const el = document.getElementById(`drawer-comment-${id}`);
		if (!el) return;
		flashedHashRef.current = hash;
		el.scrollIntoView({ behavior: "smooth", block: "center" });
		el.classList.add("comment-flash");
		const t = setTimeout(() => el.classList.remove("comment-flash"), 2000);
		return () => clearTimeout(t);
	}, [open, allItems]);

	return (
		<aside
			className={`fixed top-[77px] right-0 z-40 flex h-[calc(100vh-77px)] w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-[500px] sm:border-l sm:border-gray-100 ${
				open ? "translate-x-0" : "translate-x-full"
			}`}
			aria-hidden={!open}
		>
			{/* Header */}
			<header className="flex items-center justify-between px-6 py-4">
				<div>
					<h2 className="text-base font-bold text-gray-900">Responses</h2>
					{total > 0 && (
						<p className="text-xs text-gray-400">
							{total} comment{total !== 1 ? "s" : ""}
						</p>
					)}
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close comments"
					className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
				>
					<X className="h-4 w-4" />
				</button>
			</header>

			{/* Composer */}
			<div className="border-y border-gray-100 bg-gray-50/50 px-6 py-4">
				<NewCommentForm postId={postId} sort={sort} />
			</div>

			{/* Sort tabs */}
			<div className="flex gap-6 border-b border-gray-100 px-6">
				<SortTab active={sort === "new"} onClick={() => setSort("new")}>
					Newest
				</SortTab>
				<SortTab active={sort === "top"} onClick={() => setSort("top")}>
					Top
				</SortTab>
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto">
				{isLoading && <CommentSkeleton />}

				{!isLoading && allItems.length === 0 && (
					<div className="flex flex-col items-center px-6 py-16 text-center">
						<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">
							💬
						</div>
						<p className="text-sm font-medium text-gray-700">No responses yet</p>
						<p className="mt-1 text-xs text-gray-400">Be the first to share your thoughts.</p>
					</div>
				)}

				{allItems.length > 0 && (
					<div className="divide-y divide-gray-100">
						{allItems.map((thread) => (
							<CommentThreadView key={thread.id} thread={thread} postId={postId} sort={sort} />
						))}
					</div>
				)}

				{hasNextPage && (
					<div className="px-6 py-4">
						<button
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
							className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-700 disabled:opacity-50"
						>
							<ChevronDown className="h-3.5 w-3.5" />
							{isFetchingNextPage ? "Loading…" : "Show more comments"}
						</button>
					</div>
				)}

				{!hasNextPage && allItems.length > 0 && (
					<p className="py-6 text-center text-xs text-gray-300">· end of responses ·</p>
				)}
			</div>
		</aside>
	);
}

function SortTab({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			className={`relative py-3 text-sm font-medium transition-colors ${
				active ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
			}`}
		>
			{children}
			{active && (
				<span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-gray-900" />
			)}
		</button>
	);
}

function UserAvatar({
	user,
	size = "md",
}: {
	user: { name: string; avatarUrl?: string | null } | null | undefined;
	size?: "sm" | "md";
}) {
	const src = safeImageUrl(user?.avatarUrl);
	const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
	const letter = (user?.name ?? "?")[0]?.toUpperCase() ?? "?";
	if (src) {
		return (
			<img
				src={src}
				alt={user?.name ?? ""}
				className={`${dim} shrink-0 rounded-full object-cover`}
			/>
		);
	}
	return (
		<div
			className={`bg-brand-hero text-brand-dark ${dim} flex shrink-0 items-center justify-center rounded-full font-semibold`}
		>
			{letter}
		</div>
	);
}

function NewCommentForm({
	postId,
	sort,
	parentId,
	onCancel,
	autoFocus,
	mentionUsername,
}: {
	postId: string;
	sort: CommentSort;
	parentId?: string;
	onCancel?: () => void;
	autoFocus?: boolean;
	mentionUsername?: string;
}) {
	const me = useAuthStore((s) => s.user);
	const navigate = useNavigate();
	const create = useCreateComment(postId, sort);
	const [text, setText] = useState(mentionUsername ? `@${mentionUsername} ` : "");
	const [focused, setFocused] = useState(!!autoFocus);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (!autoFocus || !textareaRef.current) return;
		const el = textareaRef.current;
		el.focus();
		const len = el.value.length;
		el.setSelectionRange(len, len);
	}, [autoFocus]);

	if (!me) {
		return (
			<div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 px-4 py-3">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
					<svg
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
						/>
					</svg>
				</div>
				<p className="text-sm text-gray-500">
					<button
						onClick={() => navigate({ to: "/login" })}
						className="font-semibold text-gray-800 hover:underline"
					>
						Sign in
					</button>{" "}
					to join the conversation
				</p>
			</div>
		);
	}

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed) return;
		create.mutate(
			{ content: trimmed, parentId },
			{
				onSuccess: () => {
					setText("");
					setFocused(false);
					onCancel?.();
				},
				onError: () => notify.error("Failed to post comment"),
			},
		);
	};

	return (
		<form onSubmit={submit}>
			<div className="flex gap-3">
				{!parentId && <UserAvatar user={me} />}
				<div className="flex-1">
					<textarea
						ref={textareaRef}
						value={text}
						onChange={(e) => setText(e.target.value)}
						onFocus={() => setFocused(true)}
						placeholder={parentId ? "Write a reply…" : "Add a response…"}
						rows={focused || text ? (parentId ? 2 : 3) : 1}
						maxLength={5000}
						className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 transition-all outline-none placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
					/>
					{(focused || text) && (
						<div className="mt-2 flex items-center justify-end gap-2">
							{(onCancel || (!parentId && focused && !text)) && (
								<button
									type="button"
									onClick={() => {
										setFocused(false);
										setText("");
										onCancel?.();
									}}
									className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
								>
									Cancel
								</button>
							)}
							<button
								type="submit"
								disabled={create.isPending || !text.trim()}
								className="bg-brand-dark hover:bg-brand-mid rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
							>
								{create.isPending ? "Posting…" : parentId ? "Reply" : "Respond"}
							</button>
						</div>
					)}
				</div>
			</div>
		</form>
	);
}

function CommentThreadView({
	thread,
	postId,
	sort,
}: {
	thread: CommentThread;
	postId: string;
	sort: CommentSort;
}) {
	const [expanded, setExpanded] = useState(false);

	if (thread.isDeleted) return null;

	const visibleReplies = thread.replies.filter((r) => !r.isDeleted);
	const hiddenCount = visibleReplies.length - INITIAL_REPLIES;
	const displayedReplies =
		expanded || visibleReplies.length <= INITIAL_REPLIES
			? visibleReplies
			: visibleReplies.slice(0, INITIAL_REPLIES);

	return (
		<div className="px-6 py-4">
			<CommentRow comment={thread} postId={postId} sort={sort} />

			{visibleReplies.length > 0 && (
				<div className="mt-3 ml-[18px] border-l-2 border-gray-100 pl-4">
					<div className="flex flex-col gap-4">
						{displayedReplies.map((reply) => (
							<CommentRow key={reply.id} comment={reply} postId={postId} sort={sort} isReply />
						))}
					</div>

					{!expanded && hiddenCount > 0 && (
						<button
							onClick={() => setExpanded(true)}
							className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-700"
						>
							<ChevronDown className="h-3.5 w-3.5" />
							View {hiddenCount} more repl{hiddenCount === 1 ? "y" : "ies"}
						</button>
					)}

					{expanded && visibleReplies.length > INITIAL_REPLIES && (
						<button
							onClick={() => setExpanded(false)}
							className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-700"
						>
							<ChevronUp className="h-3.5 w-3.5" />
							Hide replies
						</button>
					)}
				</div>
			)}
		</div>
	);
}

function CommentRow({
	comment,
	postId,
	sort,
	isReply,
}: {
	comment: CommentItem;
	postId: string;
	sort: CommentSort;
	isReply?: boolean;
}) {
	const me = useAuthStore((s) => s.user);
	const navigate = useNavigate();
	const clap = useCommentClap(postId, sort);
	const update = useUpdateComment(postId, sort);
	const del = useDeleteComment(postId, sort);

	const [showReply, setShowReply] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editText, setEditText] = useState(comment.content);
	const [menuOpen, setMenuOpen] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const isOwner = me?.id === comment.user?.id;

	useEffect(() => {
		if (!menuOpen) return;
		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [menuOpen]);

	const requireAuth = () => {
		if (!me) {
			navigate({ to: "/login" });
			return true;
		}
		return false;
	};

	const submitEdit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = editText.trim();
		if (!trimmed) return;
		update.mutate(
			{ id: comment.id, content: trimmed },
			{
				onSuccess: () => setEditing(false),
				onError: () => notify.error("Failed to update comment"),
			},
		);
	};

	const onDelete = () => {
		setMenuOpen(false);
		setConfirmDelete(true);
	};

	const confirmDoDelete = () => {
		setConfirmDelete(false);
		del.mutate(comment.id, { onError: () => notify.error("Failed to delete comment") });
	};

	return (
		<>
			{confirmDelete && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
					<div className="w-80 rounded-2xl bg-white p-6 shadow-xl">
						<h3 className="text-sm font-semibold text-gray-900">Delete comment?</h3>
						<p className="mt-1 text-xs text-gray-500">This action cannot be undone.</p>
						<div className="mt-5 flex justify-end gap-2">
							<button
								onClick={() => setConfirmDelete(false)}
								className="rounded-lg px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
							>
								Cancel
							</button>
							<button
								onClick={confirmDoDelete}
								disabled={del.isPending}
								className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
							>
								{del.isPending ? "Deleting…" : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
			<div id={`drawer-comment-${comment.id}`} className="group flex scroll-mt-24 gap-3">
				<UserAvatar user={comment.user} size={isReply ? "sm" : "md"} />

				<div className="min-w-0 flex-1">
					{/* Meta row */}
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1.5 text-sm">
							{comment.user ? (
								<Link
									to="/blog/$username"
									params={{ username: comment.user.username }}
									className="font-semibold text-gray-900 hover:underline"
								>
									{comment.user.name}
								</Link>
							) : (
								<span className="font-semibold text-gray-400">[deleted]</span>
							)}
							<span className="text-gray-300">·</span>
							<span className="text-xs text-gray-400">{formatRelative(comment.createdAt)}</span>
							{comment.isEdited && !comment.isDeleted && (
								<span className="text-xs text-gray-300 italic">· edited</span>
							)}
						</div>

						{isOwner && !comment.isDeleted && !editing && (
							<div ref={menuRef} className="relative">
								<button
									onClick={() => setMenuOpen((o) => !o)}
									className="flex h-6 w-6 items-center justify-center rounded-full text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600"
								>
									<MoreHorizontal className="h-3.5 w-3.5" />
								</button>
								{menuOpen && (
									<div className="absolute top-7 right-0 z-10 min-w-[120px] overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
										<button
											onClick={() => {
												setEditing(true);
												setMenuOpen(false);
											}}
											className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
										>
											<Pencil className="h-3 w-3" /> Edit
										</button>
										<button
											onClick={onDelete}
											className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
										>
											<Trash2 className="h-3 w-3" /> Delete
										</button>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Content */}
					{editing ? (
						<form onSubmit={submitEdit} className="mt-2 flex flex-col gap-2">
							<textarea
								value={editText}
								onChange={(e) => setEditText(e.target.value)}
								rows={3}
								maxLength={5000}
								autoFocus
								className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
							/>
							<div className="flex justify-end gap-2">
								<button
									type="button"
									onClick={() => {
										setEditing(false);
										setEditText(comment.content);
									}}
									className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={update.isPending || !editText.trim()}
									className="bg-brand-dark rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
								>
									Save
								</button>
							</div>
						</form>
					) : (
						<p
							className={`mt-1 text-sm leading-relaxed wrap-break-word ${
								comment.isDeleted ? "text-gray-400 italic" : "text-gray-700"
							}`}
						>
							{comment.isDeleted ? "This comment was deleted." : comment.content}
						</p>
					)}

					{/* Actions */}
					{!comment.isDeleted && !editing && (
						<div className="mt-2 flex items-center gap-4">
							<ClapButton
								size="sm"
								count={comment.clapCount}
								myCount={comment.myClaps}
								max={50}
								onClap={() => clap(comment.id)}
								requireAuth={requireAuth}
							/>
							<button
								onClick={() => setShowReply((v) => !v)}
								className={`text-xs font-medium transition-colors ${
									showReply ? "text-gray-800" : "text-gray-400 hover:text-gray-700"
								}`}
							>
								{showReply ? "Cancel" : "Reply"}
							</button>
						</div>
					)}

					{/* Reply form */}
					{showReply && (
						<div className="mt-3">
							<NewCommentForm
								postId={postId}
								sort={sort}
								parentId={comment.id}
								mentionUsername={isReply ? comment.user?.username : undefined}
								onCancel={() => setShowReply(false)}
								autoFocus
							/>
						</div>
					)}
				</div>
			</div>
		</>
	);
}

function CommentSkeleton() {
	return (
		<div className="divide-y divide-gray-100">
			{[1, 2, 3].map((i) => (
				<div key={i} className="flex gap-3 px-6 py-4">
					<div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
					<div className="flex-1 space-y-2 pt-1">
						<div className="flex gap-2">
							<div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
							<div className="h-3 w-12 animate-pulse rounded bg-gray-100" />
						</div>
						<div className="h-3 w-full animate-pulse rounded bg-gray-100" />
						<div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
					</div>
				</div>
			))}
		</div>
	);
}

function formatRelative(iso: string): string {
	const diffMs = Date.now() - new Date(iso).getTime();
	const m = Math.floor(diffMs / 60_000);
	if (m < 1) return "just now";
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.floor(h / 24);
	if (d < 7) return `${d}d ago`;
	return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
