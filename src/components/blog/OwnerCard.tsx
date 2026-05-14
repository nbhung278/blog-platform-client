import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import type { Post } from "@/types";
import { useDeletePost } from "@/hooks/usePosts";
import { POST_STATUS_LABEL, POST_STATUS_OVERLAY_CLASS } from "@/lib/postStatus";

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

const OwnerCard = memo(function OwnerCard({ post }: { post: Post }) {
	const deletePost = useDeletePost();

	// preventDefault stops the wrapping <Link> from navigating when the user
	// clicks the delete affordance. stopPropagation isn't needed — there's no
	// outer click handler — but the Link is the "default action" we want to
	// suppress.
	function handleDelete(e: React.MouseEvent) {
		e.preventDefault();
		if (window.confirm("Delete this post? This cannot be undone.")) {
			deletePost.mutate(post.id);
		}
	}

	return (
		<Link
			to="/editor/$postId"
			params={{ postId: post.id }}
			className="group border-brand-border bg-brand-surface relative flex flex-col overflow-hidden border transition-shadow hover:shadow-md"
		>
			{post.coverUrl ? (
				<img
					src={post.coverUrl}
					alt={post.title}
					width={1200}
					height={675}
					loading="lazy"
					className="aspect-video w-full object-cover"
				/>
			) : (
				<div className="bg-brand-hero flex aspect-video w-full items-center justify-center">
					<span className="text-brand-border font-serif text-5xl font-bold">{post.title[0]}</span>
				</div>
			)}

			<span
				className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${POST_STATUS_OVERLAY_CLASS[post.status]}`}
			>
				{POST_STATUS_LABEL[post.status]}
			</span>

			<button
				type="button"
				onClick={handleDelete}
				disabled={deletePost.isPending}
				className="absolute top-3 right-3 rounded-full bg-white/95 p-1.5 text-red-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-50 disabled:opacity-50"
				title="Delete"
			>
				<Trash2 className="h-3.5 w-3.5" />
			</button>

			<div className="flex flex-1 flex-col p-6">
				<h3 className="text-brand-dark font-serif text-xl leading-snug font-bold group-hover:underline">
					{post.title}
				</h3>
				{post.excerpt && (
					<p className="text-brand-mid mt-3 line-clamp-3 text-sm leading-relaxed">{post.excerpt}</p>
				)}
				<p className="text-brand-mid mt-auto pt-5 text-xs">Updated {formatDate(post.updatedAt)}</p>
			</div>
		</Link>
	);
});

export default OwnerCard;
