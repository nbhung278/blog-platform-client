import { Link } from "@tanstack/react-router";
import { Pencil, ArrowRight } from "lucide-react";
import { useMyDrafts, type DraftSummary } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";

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
	// Don't issue an auth-required request if the user is logged out — the
	// /my-drafts endpoint would just 401 and clutter the network log.
	const { data: drafts, isLoading } = useMyDrafts(limit, !!user);

	if (!user) return null;
	if (isLoading) return null;
	if (!drafts || drafts.length === 0) return null;

	return (
		<section>
			<div className="border-brand-border mb-6 flex items-baseline justify-between border-b pb-3">
				<h2 className="text-brand-dark flex items-center gap-2 font-serif text-xl font-bold">
					<Pencil className="h-5 w-5" />
					Continue writing
				</h2>
				<Link
					to="/editor/new"
					className="text-brand-mid hover:text-brand-dark flex items-center gap-1 text-sm font-medium transition-colors"
				>
					New post
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{drafts.map((d) => (
					<DraftCard key={d.id} draft={d} />
				))}
			</div>
		</section>
	);
}

function DraftCard({ draft }: { draft: DraftSummary }) {
	const title = draft.title.trim() || "Untitled draft";
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
				<span className="text-brand-mid shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
					Draft
				</span>
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
