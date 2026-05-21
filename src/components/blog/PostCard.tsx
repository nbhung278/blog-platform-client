import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Post } from "@/types";

interface PostCardProps {
	post: Post;
	username: string;
}

const PostCard = memo(function PostCard({ post, username }: PostCardProps) {
	const date = post.publishedAt ?? post.updatedAt;
	return (
		<Link
			to="/blog/$username/$slug"
			params={{ username, slug: post.slug }}
			className="group block overflow-hidden rounded-lg border bg-white transition hover:shadow-md"
		>
			{post.coverUrl && (
				<img
					src={post.thumbnailUrl ?? post.coverUrl}
					alt=""
					width={1200}
					height={600}
					loading="lazy"
					decoding="async"
					className="aspect-2/1 w-full object-cover transition group-hover:opacity-95"
				/>
			)}
			<div className="p-6">
				<h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-700">
					{post.title}
				</h2>
				{post.excerpt && <p className="mt-2 line-clamp-2 text-gray-600">{post.excerpt}</p>}
				<div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
					<time>{new Date(date).toLocaleDateString()}</time>
					<span>·</span>
					<span>{post.readingTime} min read</span>
					<span>·</span>
					<span>{post.viewCount} views</span>
					{post.tags.slice(0, 3).map((tag) => (
						<span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
							#{tag}
						</span>
					))}
				</div>
			</div>
		</Link>
	);
});

export default PostCard;
