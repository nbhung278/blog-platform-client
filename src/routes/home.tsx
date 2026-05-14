import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useFeed, useMostViewedPosts, usePostsByCategories } from "@/hooks/usePosts";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import FeaturedCard from "@/components/blog/FeaturedCard";
import HeroPostSkeleton from "@/components/blog/HeroPostSkeleton";
import PostCardSkeleton from "@/components/blog/PostCardSkeleton";
import PostMeta from "@/components/blog/PostMeta";
import type { CategorySection, Post } from "@/types";

export default function HomePage() {
	const { data: feed, isLoading: feedLoading, isError: feedError } = useFeed(1);
	const { data: mostViewed } = useMostViewedPosts(4);
	const { data: byCats, isLoading: catsLoading } = usePostsByCategories(4, 6, "popular");

	const heroPost = feed?.items?.[0];
	const popularPosts = mostViewed?.items ?? [];
	const sections = byCats?.sections ?? [];

	return (
		<div className="flex min-h-screen flex-col font-sans">
			<SiteHeader />

			{/* Hero — cream section with stamp logo */}
			<section className="bg-brand-hero flex min-h-[260px] items-center justify-center pt-10 pb-32 md:min-h-[420px] md:pt-16 md:pb-44">
				<div className="bg-brand-dark relative flex h-32 w-32 items-center justify-center rounded-full md:h-40 md:w-40">
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

			{feedLoading && !heroPost && <HeroPostSkeleton />}
			{feedError && (
				<div className="flex items-center justify-center py-20 text-red-500">
					Failed to load posts.
				</div>
			)}

			{/* Hero post — overlaps cream hero with negative margin */}
			{heroPost && (
				<div className="relative z-10 mx-auto -mt-20 max-w-7xl px-5 md:-mt-28 md:px-6">
					<Link
						to="/blog/$username/$slug"
						params={{ username: heroPost.user?.username ?? "", slug: heroPost.slug }}
						className="group bg-brand-surface border-brand-border grid grid-cols-1 overflow-hidden border shadow-lg transition-shadow hover:shadow-xl md:grid-cols-2"
					>
						<div className="flex flex-col justify-center p-6 md:p-14">
							<h2 className="text-brand-dark font-serif text-2xl leading-tight font-bold group-hover:underline md:text-4xl">
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
								width={1200}
								height={600}
								// Hero is above the fold on the landing page → eager-load so
								// it competes for LCP rather than waiting for the lazy queue.
								loading="eager"
								fetchPriority="high"
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

			<div className="mx-auto w-full max-w-7xl px-5 pt-12 pb-24 md:px-6">
				{/* Most viewed */}
				{popularPosts.length > 0 && <MostViewedSection posts={popularPosts} />}

				{/* Categories */}
				{catsLoading && !byCats && <CategorySectionSkeleton />}

				{sections.map((section) => (
					<CategorySectionBlock key={section.category.id} section={section} />
				))}

				{!feedLoading &&
					!feedError &&
					!heroPost &&
					popularPosts.length === 0 &&
					sections.length === 0 && (
						<div className="py-24 text-center">
							<p className="text-brand-mid font-serif text-2xl">No posts published yet.</p>
						</div>
					)}
			</div>

			<SiteFooter />
		</div>
	);
}

function SectionHeader({ title, viewAllTo }: { title: string; viewAllTo?: { name: string } }) {
	return (
		<div className="border-brand-border mb-6 flex items-baseline justify-between border-b pb-3">
			<h2 className="text-brand-dark font-serif text-2xl font-bold capitalize">{title}</h2>
			{viewAllTo && (
				<Link
					to="/category/$name"
					params={{ name: viewAllTo.name }}
					className="text-brand-mid hover:text-brand-dark flex items-center gap-1 text-sm font-medium transition-colors"
				>
					View all
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			)}
		</div>
	);
}

function MostViewedSection({ posts }: { posts: Post[] }) {
	return (
		<section className="mt-4 first:mt-0">
			<SectionHeader title="Most viewed" />
			<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{posts.map((post) => (
					<FeaturedCard key={post.id} post={post} />
				))}
			</div>
		</section>
	);
}

function CategorySectionBlock({ section }: { section: CategorySection }) {
	return (
		<section className="mt-12">
			<SectionHeader title={section.category.name} viewAllTo={{ name: section.category.slug }} />
			<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{section.posts.map((post) => (
					<FeaturedCard key={post.id} post={post} />
				))}
			</div>
		</section>
	);
}

function CategorySectionSkeleton() {
	return (
		<section role="status" aria-label="Loading posts" className="mt-12">
			<div className="border-brand-border mb-6 border-b pb-3">
				<div className="bg-brand-border/40 h-8 w-40 animate-pulse rounded" />
			</div>
			<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<PostCardSkeleton key={i} />
				))}
			</div>
		</section>
	);
}
