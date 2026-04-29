import { useSearch } from "@tanstack/react-router";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import FeaturedCard from "@/components/blog/FeaturedCard";
import { useSearchPosts } from "@/hooks/usePosts";

export default function SearchPage() {
	const { q } = useSearch({ from: "/search" });

	const { data, isLoading, isError } = useSearchPosts(q ?? "");
	const results = data?.items ?? [];

	return (
		<div className="flex min-h-screen flex-col bg-white font-sans">
			<SiteHeader />

			{/* Banner */}
			<div className="bg-brand-hero px-6 py-16 text-center">
				{q && (
					<p className="text-brand-mid mb-2 text-sm">
						{isLoading
							? "Searching…"
							: `${results.length} result${results.length !== 1 ? "s" : ""} for`}
					</p>
				)}
				<h1 className="text-brand-dark font-serif text-5xl font-bold">{q || "Search"}</h1>
			</div>

			{/* Results */}
			<main className="mx-auto max-w-7xl px-6 py-12">
				{isError && <p className="py-10 text-center text-red-500">Failed to load results.</p>}
				{!isLoading && !isError && results.length === 0 && q && (
					<p className="text-brand-mid py-10 text-center">
						No posts found for "{q}". Try a different title, tag, or author name.
					</p>
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
