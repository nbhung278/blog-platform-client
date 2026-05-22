import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useFeed, useMostViewedPosts, usePostsByCategories } from "@/hooks/usePosts";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import FeaturedCard from "@/components/blog/FeaturedCard";
import PostCardSkeleton from "@/components/blog/PostCardSkeleton";
import ContinueReadingSection from "@/components/blog/ContinueReadingSection";
import BlogHero from "@/components/blog/BlogHero";
import PostCarousel from "@/components/blog/PostCarousel";
import type { CategorySection, Post } from "@/types";

export default function HomePage() {
	// Pull 10 latest posts to feed the marquee carousel below the hero — the
	// row reads as "what's new" rather than a single hero post.
	const { data: feed, isLoading: feedLoading, isError: feedError } = useFeed(10);
	const { data: mostViewed } = useMostViewedPosts(4);
	const { data: byCats, isLoading: catsLoading } = usePostsByCategories(4, 6, "popular");

	const carouselPosts = feed?.items ?? [];
	const popularPosts = mostViewed?.items ?? [];
	const sections = byCats?.sections ?? [];

	return (
		<div className="flex min-h-screen flex-col font-sans">
			<SiteHeader />

			<BlogHero />

			{feedError && (
				<div className="flex items-center justify-center py-20 text-red-500">
					Failed to load posts.
				</div>
			)}

			{/* Latest-posts marquee. Always renders to reserve layout space —
			    the component shows a placeholder while the feed is loading so
			    the rest of the page doesn't shift when posts arrive. */}
			<PostCarousel posts={carouselPosts} />

			<div className="mx-auto w-full max-w-7xl px-5 pt-12 pb-24 md:px-6">
				{/* Continue reading — only renders for logged-in users with started posts */}
				<ContinueReadingSection />

				{/* Most viewed */}
				{popularPosts.length > 0 && <MostViewedSection posts={popularPosts} />}

				{/* Categories */}
				{catsLoading && !byCats && <CategorySectionSkeleton />}

				{sections.map((section) => (
					<CategorySectionBlock key={section.category.id} section={section} />
				))}

				{!feedLoading &&
					!feedError &&
					carouselPosts.length === 0 &&
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
