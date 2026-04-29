import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2, X } from "lucide-react";
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
import ClapButton from "./ClapButton";

interface Props {
	postId: string;
	open: boolean;
	onClose: () => void;
}

// Right-side drawer (Medium-style). Body scroll is *not* locked — readers
// can keep reading the post with the drawer open. Drawer has its own scroll.
// We render the panel always (with an `open` class) so the slide-in/out
// animation works in both directions.
export default function CommentDrawer({ postId, open, onClose }: Props) {
	const [sort, setSort] = useState<CommentSort>("new");
	const { data, isLoading } = useComments(postId, open ? sort : sort);

	// Esc to close. We intentionally don't trap focus or close on outside click,
	// because the user is allowed to interact with the post body while the
	// drawer is open.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	// Deep-link scroll: when the drawer opens via a notification with #comment-X,
	// scroll the matching row into view inside the drawer (not the page).
	// Run once per (open ⇒ true) transition — re-running on every `data`
	// change would re-flash the comment every time the user claps, since
	// query mutations replace the data reference.
	const flashedHashRef = useRef<string | null>(null);
	useEffect(() => {
		if (!open) {
			flashedHashRef.current = null;
			return;
		}
		if (!data?.items.length) return;
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
	}, [open, data]);

	return (
		<aside
			className={`fixed top-0 right-0 z-40 flex h-screen w-full flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out sm:w-[480px] ${
				open ? "translate-x-0" : "translate-x-full"
			}`}
			aria-hidden={!open}
		>
			<header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
				<h2 className="text-base font-semibold text-gray-800">Responses ({data?.total ?? 0})</h2>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close comments"
					className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
				>
					<X className="h-4 w-4" />
				</button>
			</header>

			<div className="border-b border-gray-200 px-5 py-4">
				<NewCommentForm postId={postId} sort={sort} />
			</div>

			<div className="flex items-center gap-1 border-b border-gray-200 px-5 py-3 text-sm">
				<SortBtn active={sort === "new"} onClick={() => setSort("new")}>
					Newest
				</SortBtn>
				<SortBtn active={sort === "top"} onClick={() => setSort("top")}>
					Most clapped
				</SortBtn>
			</div>

			<div className="flex-1 overflow-y-auto px-5 py-4">
				{isLoading && <div className="text-sm text-gray-400">Loading comments…</div>}
				{!isLoading && (data?.items.length ?? 0) === 0 && (
					<div className="rounded border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
						No comments yet. Share your thoughts.
					</div>
				)}
				<div className="flex flex-col gap-6">
					{data?.items.map((thread) => (
						<CommentThreadView key={thread.id} thread={thread} postId={postId} sort={sort} />
					))}
				</div>
			</div>
		</aside>
	);
}

function SortBtn({
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
			className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
				active ? "bg-brand-mid text-white" : "text-gray-500 hover:text-gray-800"
			}`}
		>
			{children}
		</button>
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

	if (!me) {
		return (
			<div className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-600">
				<button
					onClick={() => navigate({ to: "/login" })}
					className="text-brand-mid font-semibold hover:underline"
				>
					Sign in
				</button>{" "}
				to join the conversation.
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
					onCancel?.();
				},
				onError: () => notify.error("Failed to post comment"),
			},
		);
	};

	return (
		<form onSubmit={submit} className="flex flex-col gap-2">
			<textarea
				autoFocus={autoFocus}
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder={parentId ? "Write a reply…" : "What are your thoughts?"}
				rows={parentId ? 2 : 3}
				maxLength={5000}
				className="focus:border-brand-mid focus:ring-brand-mid/20 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2"
			/>
			<div className="flex items-center justify-end gap-2">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="rounded-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800"
					>
						Cancel
					</button>
				)}
				<button
					type="submit"
					disabled={create.isPending || !text.trim()}
					className="bg-brand-dark hover:bg-brand-mid rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60"
				>
					{create.isPending ? "Posting…" : parentId ? "Reply" : "Comment"}
				</button>
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
	return (
		<div className="flex flex-col gap-4">
			<CommentRow comment={thread} postId={postId} sort={sort} />
			{thread.replies.length > 0 && (
				<div className="border-l-2 border-gray-100 pl-4">
					<div className="flex flex-col gap-4">
						{thread.replies.map((reply) => (
							<CommentRow key={reply.id} comment={reply} postId={postId} sort={sort} isReply />
						))}
					</div>
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

	const isOwner = me?.id === comment.user?.id;

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
		if (!confirm("Delete this comment?")) return;
		del.mutate(comment.id, { onError: () => notify.error("Failed to delete comment") });
	};

	return (
		<div id={`drawer-comment-${comment.id}`} className="flex scroll-mt-24 gap-3">
			<Avatar user={comment.user} />
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2 text-sm">
					{comment.user ? (
						<Link
							to="/blog/$username"
							params={{ username: comment.user.username }}
							className="font-semibold text-gray-800 hover:underline"
						>
							{comment.user.name}
						</Link>
					) : (
						<span className="font-semibold text-gray-500">[deleted]</span>
					)}
					<span className="text-xs text-gray-400">{formatRelative(comment.createdAt)}</span>
					{comment.isEdited && !comment.isDeleted && (
						<span className="text-xs text-gray-400 italic">(edited)</span>
					)}
				</div>

				{editing ? (
					<form onSubmit={submitEdit} className="mt-2 flex flex-col gap-2">
						<textarea
							value={editText}
							onChange={(e) => setEditText(e.target.value)}
							rows={3}
							maxLength={5000}
							className="focus:border-brand-mid focus:ring-brand-mid/20 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2"
						/>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setEditing(false);
									setEditText(comment.content);
								}}
								className="rounded-full px-3 py-1 text-xs text-gray-500 hover:text-gray-800"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={update.isPending || !editText.trim()}
								className="bg-brand-dark rounded-full px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
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
						{comment.isDeleted ? "[deleted]" : comment.content}
					</p>
				)}

				{!comment.isDeleted && !editing && (
					<div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
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
							className="font-medium hover:text-gray-800"
						>
							{showReply ? (
								<>
									<X className="mr-1 inline h-3 w-3" />
									Cancel
								</>
							) : (
								"Reply"
							)}
						</button>
						{isOwner && (
							<>
								<button
									onClick={() => setEditing(true)}
									className="inline-flex items-center gap-1 hover:text-gray-800"
								>
									<Pencil className="h-3 w-3" /> Edit
								</button>
								<button
									onClick={onDelete}
									className="inline-flex items-center gap-1 hover:text-red-600"
								>
									<Trash2 className="h-3 w-3" /> Delete
								</button>
							</>
						)}
					</div>
				)}

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
	);
}

function Avatar({ user }: { user: CommentItem["user"] }) {
	if (user?.avatarUrl) {
		return (
			<img
				src={user.avatarUrl}
				alt={user.name}
				className="h-8 w-8 shrink-0 rounded-full object-cover"
			/>
		);
	}
	const letter = (user?.name ?? "?")[0]?.toUpperCase() ?? "?";
	return (
		<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-500">
			{letter}
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
	return new Date(iso).toLocaleDateString();
}
