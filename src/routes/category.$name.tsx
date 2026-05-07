import { useEffect } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import FeaturedCard from "@/components/blog/FeaturedCard";
import Pagination from "@/components/ui/Pagination";
import { usePostsByCategory } from "@/hooks/usePosts";
import { usePaginationNav } from "@/hooks/usePaginationNav";

const PAGE_LIMIT = 12;

export default function CategoryPage() {
	const { name } = useParams({ from: "/category/$name" });
	const search = useSearch({ from: "/category/$name" });
	const page = search.page ?? 1;
	const navigate = useNavigate({ from: "/category/$name" });

	const { data, isLoading, isError } = usePostsByCategory(name ?? "", page, PAGE_LIMIT);
	const results = data?.items ?? [];
	const totalPages = data?.totalPages ?? 0;

	// If user lands on a page beyond range (stale URL), bounce back to page 1.
	useEffect(() => {
		if (data && totalPages > 0 && page > totalPages) {
			navigate({ search: { page: 1 }, replace: true });
		}
	}, [data, totalPages, page, navigate]);

	const changePage = usePaginationNav((next) => navigate({ search: { page: next } }));

	return (
		<div className="flex min-h-screen flex-col bg-white font-sans">
			<SiteHeader />

			<div className="bg-brand-hero px-6 py-16 text-center">
				<p className="text-brand-mid mb-2 text-sm">Category</p>
				<h1 className="text-brand-dark font-serif text-5xl font-bold capitalize">{name}</h1>
				{data && data.total > 0 && (
					<p className="text-brand-mid mt-3 text-sm">
						{data.total} {data.total === 1 ? "post" : "posts"}
					</p>
				)}
			</div>

			<main className="mx-auto w-full max-w-7xl px-6 py-12">
				{isError && <p className="py-10 text-center text-red-500">Failed to load posts.</p>}

				{isLoading && !data && (
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: PAGE_LIMIT }).map((_, i) => (
							<div key={i} className="border-brand-border bg-brand-surface animate-pulse border">
								<div className="bg-brand-hero aspect-video w-full" />
								<div className="space-y-3 p-6">
									<div className="bg-brand-hero h-4 w-3/4 rounded" />
									<div className="bg-brand-hero h-3 w-full rounded" />
								</div>
							</div>
						))}
					</div>
				)}

				{!isLoading && !isError && results.length === 0 && (
					<p className="text-brand-mid py-10 text-center">No posts in this category.</p>
				)}

				{results.length > 0 && (
					<>
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{results.map((post) => (
								<FeaturedCard key={post.id} post={post} />
							))}
						</div>
						<Pagination page={page} totalPages={totalPages} onPageChange={changePage} />
					</>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
