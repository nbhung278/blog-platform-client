import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Post } from "@/types";
import PostMeta from "./PostMeta";

interface Props {
	post: Post;
	priority?: boolean;
}

const FeaturedCard = memo(function FeaturedCard({ post, priority = false }: Props) {
	return (
		<Link
			to="/blog/$username/$slug"
			params={{ username: post.user?.username ?? "", slug: post.slug }}
			className="group border-brand-border bg-brand-surface flex flex-col overflow-hidden border transition-shadow hover:shadow-md"
		>
			{post.coverUrl ? (
				<img
					src={post.coverUrl}
					alt={post.title}
					width={1200}
					height={675}
					loading={priority ? "eager" : "lazy"}
					decoding="async"
					fetchPriority={priority ? "high" : "auto"}
					className="aspect-video w-full object-cover"
				/>
			) : (
				<div className="bg-brand-hero flex aspect-video w-full items-center justify-center">
					<span className="text-brand-border font-serif text-5xl font-bold">{post.title[0]}</span>
				</div>
			)}
			<div className="flex flex-1 flex-col p-5 md:p-6">
				<h3 className="text-brand-dark font-serif text-xl leading-tight font-bold group-hover:underline md:leading-snug">
					{post.title}
				</h3>
				{post.excerpt && (
					<p className="text-brand-mid mt-3 line-clamp-2 text-base leading-relaxed md:line-clamp-3 md:text-sm">
						{post.excerpt}
					</p>
				)}
				<div className="mt-auto pt-4 md:pt-5">
					<PostMeta post={post} />
				</div>
			</div>
		</Link>
	);
});

export default FeaturedCard;
