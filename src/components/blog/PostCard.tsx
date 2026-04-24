import { Link } from "@tanstack/react-router";
import type { Post } from "@/types";

interface PostCardProps {
	post: Post;
	username: string;
}

export default function PostCard({ post, username }: PostCardProps) {
	return (
		<Link
			to="/blog/$username/$slug"
			params={{ username, slug: post.slug }}
			className="block rounded-lg border bg-white p-6 transition hover:shadow-md"
		>
			<h2 className="text-xl font-semibold">{post.title}</h2>
			{post.excerpt && <p className="mt-2 text-gray-600">{post.excerpt}</p>}
			<div className="mt-3 flex gap-3 text-sm text-gray-500">
				<span>{post.readingTime} min read</span>
				<span>{post.viewCount} views</span>
				{post.tags.map((tag) => (
					<span key={tag} className="rounded bg-gray-100 px-2 py-0.5">
						{tag}
					</span>
				))}
			</div>
		</Link>
	);
}
