import { Link } from "@tanstack/react-router";
import { useFeed } from "@/hooks/usePosts";
import type { Post } from "@/types";
import SiteHeader from "@/components/layout/SiteHeader";
import FeaturedCard from "@/components/blog/FeaturedCard";
import PostMeta from "@/components/blog/PostMeta";

function RecentCard({ post }: { post: Post }) {
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
					className="h-24 w-32 shrink-0 rounded object-cover"
				/>
			)}
		</Link>
	);
}

export default function HomePage() {
	const { data, isLoading, isError } = useFeed(20);

	const posts = data?.items ?? [];
	const heroPost = posts[0];
	const featuredPosts = posts.slice(1, 4);
	const morePosts = posts.slice(4);

	return (
		<div className="min-h-screen font-sans">
			<SiteHeader />

			{/* Hero — cream section with stamp logo */}
			<section className="bg-brand-hero flex min-h-[420px] items-center justify-center pt-16 pb-44">
				<div className="bg-brand-dark relative flex h-40 w-40 items-center justify-center rounded-full">
					<svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 160" fill="none">
						<circle
							cx="80"
							cy="80"
							r="77"
							stroke="rgba(255,255,255,0.3)"
							strokeWidth="1.5"
							strokeDasharray="4 3.5"
						/>
						<circle cx="80" cy="80" r="68" stroke="rgba(255,255,255,0.15)" strokeWidth="0.75" />
					</svg>
					<div className="text-center">
						<div className="font-serif text-xl font-bold tracking-[0.12em] text-white">STRIX</div>
						<div className="mt-1 text-[7px] tracking-[0.2em] text-white/50 uppercase">
							Code as Craft
						</div>
					</div>
				</div>
			</section>

			{isLoading && (
				<div className="text-brand-mid flex items-center justify-center py-20">Loading…</div>
			)}
			{isError && (
				<div className="flex items-center justify-center py-20 text-red-500">
					Failed to load posts.
				</div>
			)}

			{/* Hero post — overlaps cream hero with negative margin */}
			{heroPost && (
				<div className="relative z-10 mx-auto -mt-28 max-w-7xl px-6">
					<Link
						to="/blog/$username/$slug"
						params={{ username: heroPost.user?.username ?? "", slug: heroPost.slug }}
						className="group bg-brand-surface border-brand-border grid grid-cols-1 overflow-hidden border shadow-lg transition-shadow hover:shadow-xl md:grid-cols-2"
					>
						<div className="flex flex-col justify-center p-10 md:p-14">
							<h2 className="text-brand-dark font-serif text-3xl leading-tight font-bold group-hover:underline md:text-4xl">
								{heroPost.title}
							</h2>
							{heroPost.excerpt && (
								<p className="text-brand-mid mt-4 text-base leading-relaxed">{heroPost.excerpt}</p>
							)}
							<div className="mt-7">
								<PostMeta post={heroPost} size="md" />
							</div>
						</div>
						{heroPost.coverUrl ? (
							<img
								src={heroPost.coverUrl}
								alt={heroPost.title}
								className="h-64 w-full object-cover md:h-auto"
							/>
						) : (
							<div className="bg-brand-hero flex h-64 items-center justify-center md:h-auto">
								<span className="text-brand-border font-serif text-8xl font-bold">
									{heroPost.title[0]}
								</span>
							</div>
						)}
					</Link>
				</div>
			)}

			{/* Featured */}
			{featuredPosts.length > 0 && (
				<section className="mx-auto max-w-7xl px-6 pt-12 pb-16">
					<h2 className="text-brand-dark mb-8 font-serif text-3xl font-bold">Featured</h2>
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
						{featuredPosts.map((post) => (
							<FeaturedCard key={post.id} post={post} />
						))}
					</div>
				</section>
			)}

			{/* Recent */}
			{morePosts.length > 0 && (
				<section className="mx-auto max-w-7xl px-6 pb-24">
					<div className="border-brand-border flex items-baseline justify-between border-b pb-4">
						<h2 className="text-brand-dark font-serif text-3xl font-bold">Recent</h2>
					</div>
					<div className="mt-2">
						{morePosts.map((post) => (
							<RecentCard key={post.id} post={post} />
						))}
					</div>
				</section>
			)}

			{!isLoading && posts.length === 0 && (
				<div className="mx-auto max-w-7xl px-6 py-24 text-center">
					<p className="text-brand-mid font-serif text-2xl">No posts published yet.</p>
				</div>
			)}
		</div>
	);
}
