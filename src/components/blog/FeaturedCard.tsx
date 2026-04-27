import { Link } from "@tanstack/react-router";
import type { Post } from "@/types";
import PostMeta from "./PostMeta";

export default function FeaturedCard({ post }: { post: Post }) {
	return (
		<Link
			to="/blog/$username/$slug"
			params={{ username: post.user?.username ?? "", slug: post.slug }}
			className="group border-brand-border bg-brand-surface flex flex-col overflow-hidden border transition-shadow hover:shadow-md"
		>
			{post.coverUrl ? (
				<img src={post.coverUrl} alt={post.title} className="aspect-video w-full object-cover" />
			) : (
				<div className="bg-brand-hero flex aspect-video w-full items-center justify-center">
					<span className="text-brand-border font-serif text-5xl font-bold">{post.title[0]}</span>
				</div>
			)}
			<div className="flex flex-1 flex-col p-6">
				<h3 className="text-brand-dark font-serif text-xl leading-snug font-bold group-hover:underline">
					{post.title}
				</h3>
				{post.excerpt && (
					<p className="text-brand-mid mt-3 line-clamp-3 text-sm leading-relaxed">{post.excerpt}</p>
				)}
				<div className="mt-auto pt-5">
					<PostMeta post={post} />
				</div>
			</div>
		</Link>
	);
}
