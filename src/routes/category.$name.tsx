import { useParams } from "@tanstack/react-router";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import FeaturedCard from "@/components/blog/FeaturedCard";
import { usePostsByCategory } from "@/hooks/usePosts";

export default function CategoryPage() {
	const { name } = useParams({ from: "/category/$name" });
	const { data, isLoading, isError } = usePostsByCategory(name ?? "");
	const results = data?.items ?? [];

	return (
		<div className="flex min-h-screen flex-col bg-white font-sans">
			<SiteHeader />

			<div className="bg-brand-hero px-6 py-16 text-center">
				<p className="text-brand-mid mb-2 text-sm">Category</p>
				<h1 className="text-brand-dark font-serif text-5xl font-bold">{name}</h1>
			</div>

			<main className="mx-auto max-w-7xl px-6 py-12">
				{isError && <p className="py-10 text-center text-red-500">Failed to load posts.</p>}
				{!isLoading && !isError && results.length === 0 && (
					<p className="text-brand-mid py-10 text-center">No posts in this category.</p>
				)}
				{results.length > 0 && (
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{results.map((post) => (
							<FeaturedCard key={post.id} post={post} />
						))}
					</div>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
