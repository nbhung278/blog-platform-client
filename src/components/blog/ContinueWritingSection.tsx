import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, ArrowRight, Trash2 } from "lucide-react";
import { useMyDrafts, useDeletePost, type DraftSummary } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

function formatRelative(iso: string): string {
	const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
	if (diffSec < 60) return "just now";
	const m = Math.floor(diffSec / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.floor(h / 24);
	if (d < 30) return `${d}d ago`;
	return new Date(iso).toLocaleDateString();
}

// Section rendered on the owner's profile page (/blog/$username) listing
// in-progress drafts with autosave-aware metadata (word count + last edited).
// Distinct from the generic "Drafts" PostSection elsewhere because it uses
// /posts/my-drafts which projects word count for the card UI.
export default function ContinueWritingSection({ limit = 6 }: { limit?: number }) {
	const user = useAuthStore((s) => s.user);
	const { data: drafts, isLoading } = useMyDrafts(limit, !!user);
	const deletePost = useDeletePost();
	const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

	if (!user) return null;
	if (isLoading) return <ContinueWritingSkeleton />;
	if (!drafts || drafts.length === 0) return null;

	return (
		<section>
			<div className="border-brand-border mb-6 flex items-baseline justify-between border-b pb-3">
				<h2 className="text-brand-dark flex items-center gap-2 font-serif text-xl font-bold">
					<Pencil className="h-5 w-5" />
					Continue writing
				</h2>
				<Link
					to="/editor/$postId"
					params={{ postId: "new" }}
					className="text-brand-mid hover:text-brand-dark flex items-center gap-1 text-sm font-medium transition-colors"
				>
					New post
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{drafts.map((d) => (
					<DraftCard
						key={d.id}
						draft={d}
						onRequestDelete={(id, title) => setPendingDelete({ id, title })}
					/>
				))}
			</div>

			<ConfirmDialog
				open={!!pendingDelete}
				title={`Delete "${pendingDelete?.title}"?`}
				description="This cannot be undone."
				onConfirm={() => {
					if (pendingDelete) deletePost.mutate(pendingDelete.id);
					setPendingDelete(null);
				}}
				onCancel={() => setPendingDelete(null)}
				loading={deletePost.isPending}
			/>
		</section>
	);
}

function ContinueWritingSkeleton() {
	return (
		<section>
			<div className="border-brand-border mb-6 flex items-baseline justify-between border-b pb-3">
				<div className="bg-brand-border h-6 w-40 animate-pulse rounded" />
				<div className="bg-brand-border h-4 w-16 animate-pulse rounded" />
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{Array.from({ length: 2 }).map((_, i) => (
					<div
						key={i}
						className="border-brand-border bg-brand-cream flex flex-col gap-3 rounded-lg border p-4"
					>
						<div className="bg-brand-border h-5 w-3/4 animate-pulse rounded" />
						<div className="bg-brand-border h-4 w-full animate-pulse rounded" />
						<div className="bg-brand-border h-3 w-1/2 animate-pulse rounded" />
					</div>
				))}
			</div>
		</section>
	);
}

function DraftCard({
	draft,
	onRequestDelete,
}: {
	draft: DraftSummary;
	onRequestDelete: (id: string, title: string) => void;
}) {
	const title = draft.title.trim() || "Untitled draft";

	function handleDelete(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		onRequestDelete(draft.id, title);
	}

	return (
		<Link
			to="/editor/$postId"
			params={{ postId: draft.id }}
			className="group border-brand-border bg-brand-cream hover:border-brand-dark flex flex-col gap-3 rounded-lg border p-4 transition-colors"
		>
			<div className="flex items-start justify-between gap-3">
				<h3 className="text-brand-dark line-clamp-2 flex-1 font-serif text-lg font-semibold group-hover:underline">
					{title}
				</h3>
				<div className="flex shrink-0 items-center gap-1.5">
					<button
						type="button"
						onClick={handleDelete}
						aria-label="Delete draft"
						className="text-brand-mid p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
					<span className="text-brand-mid rounded-full bg-white px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
						Draft
					</span>
				</div>
			</div>
			{draft.excerpt && (
				<p className="text-brand-mid line-clamp-2 text-sm leading-relaxed">{draft.excerpt}</p>
			)}
			<div className="text-brand-mid mt-auto flex items-center justify-between gap-2 text-xs">
				<span>
					{draft.wordCount} {draft.wordCount === 1 ? "word" : "words"}
				</span>
				<span>Edited {formatRelative(draft.updatedAt)}</span>
			</div>
		</Link>
	);
}
