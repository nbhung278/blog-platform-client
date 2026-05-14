import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Post } from "@/types";
import PostMeta from "./PostMeta";

const RecentCard = memo(function RecentCard({ post }: { post: Post }) {
	return (
		<Link
			to="/blog/$username/$slug"
			params={{ username: post.user?.username ?? "", slug: post.slug }}
			className="group border-brand-border flex gap-4 border-b py-5"
		>
			<div className="flex-1">
				<h3 className="text-brand-dark font-serif text-lg leading-snug font-bold group-hover:underline">
					{post.title}
				</h3>
				{post.excerpt && <p className="text-brand-mid mt-1 line-clamp-2 text-sm">{post.excerpt}</p>}
				<div className="mt-3">
					<PostMeta post={post} />
				</div>
			</div>
			{post.coverUrl && (
				<img
					src={post.coverUrl}
					alt={post.title}
					width={128}
					height={96}
					loading="lazy"
					className="h-24 w-32 shrink-0 rounded object-cover"
				/>
			)}
		</Link>
	);
});

export default RecentCard;
