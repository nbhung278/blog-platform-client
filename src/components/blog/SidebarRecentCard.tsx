import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Post } from "@/types";
import { formatReadingTime } from "@/lib/formatReadingTime";

const SidebarRecentCard = memo(function SidebarRecentCard({ post }: { post: Post }) {
	const reading = formatReadingTime(post.readingTime);
	return (
		<Link
			to="/blog/$username/$slug"
			params={{ username: post.user?.username ?? "", slug: post.slug }}
			className="group flex flex-col"
		>
			{post.coverUrl ? (
				<img
					src={post.thumbnailUrl ?? post.coverUrl}
					alt={post.title}
					width={400}
					height={225}
					loading="lazy"
					decoding="async"
					className="aspect-video w-full rounded object-cover"
				/>
			) : (
				<div className="bg-brand-hero flex aspect-video w-full items-center justify-center rounded">
					<span className="text-brand-border font-serif text-4xl font-bold">{post.title[0]}</span>
				</div>
			)}
			<div className="mt-3">
				<p className="dark:text-brand-mid text-xs text-gray-400">
					By {post.user?.name ?? "Unknown"}
					{reading && (
						<>
							<span aria-hidden> · </span>
							<span>{reading}</span>
						</>
					)}
				</p>
				<h3 className="dark:text-brand-dark mt-1 line-clamp-2 font-serif text-sm leading-snug font-bold text-gray-800 group-hover:underline">
					{post.title}
				</h3>
				{post.excerpt && (
					<p className="dark:text-brand-mid mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
						{post.excerpt}
					</p>
				)}
			</div>
		</Link>
	);
});

export default SidebarRecentCard;
