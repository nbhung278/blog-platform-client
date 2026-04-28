import { Link, useParams } from "@tanstack/react-router";
import { usePublicPosts } from "@/hooks/usePosts";
import FeaturedCard from "@/components/blog/FeaturedCard";
import SiteHeader from "@/components/layout/SiteHeader";

export default function BlogUserPage() {
	const { username } = useParams({ strict: false }) as { username: string };
	const { data: posts, isLoading, isError } = usePublicPosts(username);

	const author = posts?.[0]?.user;
	const initial = (author?.name ?? username).charAt(0).toUpperCase();

	return (
		<div className="bg-brand-surface min-h-screen font-sans">
			<SiteHeader
				navContent={
					<Link to="/" className="text-brand-mid hover:text-brand-dark text-sm transition-colors">
						← Back to Strix
					</Link>
				}
			/>

			{/* Cream banner */}
			<div className="bg-brand-hero border-brand-border border-b">
				<div className="mx-auto max-w-7xl px-6 py-10">
					<p className="text-brand-mid font-serif text-sm tracking-widest uppercase">Author</p>
					<h1 className="text-brand-dark mt-1 font-serif text-4xl font-bold">
						{author?.name ?? `@${username}`}
					</h1>
				</div>
			</div>

			{/* Body */}
			<div className="mx-auto max-w-7xl px-6 py-12">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
					{/* ── Left: profile card ── */}
					<aside className="lg:sticky lg:top-28 lg:self-start">
						<div className="bg-brand-surface border-brand-border border p-6">
							{/* Avatar */}
							<div className="flex justify-center">
								{author?.avatarUrl ? (
									<img
										src={author.avatarUrl}
										alt={author.name}
										className="border-brand-border h-24 w-24 rounded-full border-2 object-cover"
									/>
								) : (
									<div className="bg-brand-dark flex h-24 w-24 items-center justify-center rounded-full font-serif text-3xl font-bold text-white">
										{initial}
									</div>
								)}
							</div>

							{/* Name & handle */}
							<div className="mt-4 text-center">
								<p className="text-brand-dark font-serif text-xl font-bold">
									{author?.name ?? `@${username}`}
								</p>
								<p className="text-brand-mid mt-0.5 text-sm">@{username}</p>
							</div>

							{/* Divider */}
							<div className="border-brand-border my-5 border-t" />

							{/* Stats */}
							<div className="space-y-3">
								<div className="flex items-baseline justify-between">
									<span className="text-brand-mid text-xs tracking-widest uppercase">
										Posts published
									</span>
									<span className="text-brand-dark font-serif text-2xl font-bold">
										{posts?.length ?? (isLoading ? "—" : 0)}
									</span>
								</div>
							</div>

							{/* Divider */}
							<div className="border-brand-border my-5 border-t" />

							{/* CTA */}
							<Link
								to="/"
								className="border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark block w-full border py-2 text-center text-sm transition-colors"
							>
								Explore all posts
							</Link>
						</div>
					</aside>

					{/* ── Right: posts ── */}
					<main>
						<div className="border-brand-border mb-6 flex items-baseline justify-between border-b pb-4">
							<h2 className="text-brand-dark font-serif text-2xl font-bold">
								{isLoading
									? "Loading…"
									: `${posts?.length ?? 0} post${posts?.length !== 1 ? "s" : ""}`}
							</h2>
						</div>

						{isError && <p className="py-10 text-center text-red-500">Failed to load posts.</p>}

						{!isLoading && !isError && posts?.length === 0 && (
							<div className="py-24 text-center">
								<p className="text-brand-mid font-serif text-2xl">No posts published yet.</p>
							</div>
						)}

						{isLoading && (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<div
										key={i}
										className="border-brand-border bg-brand-surface animate-pulse border"
									>
										<div className="bg-brand-hero aspect-video w-full" />
										<div className="space-y-3 p-6">
											<div className="bg-brand-hero h-4 w-3/4 rounded" />
											<div className="bg-brand-hero h-3 w-full rounded" />
											<div className="bg-brand-hero h-3 w-2/3 rounded" />
										</div>
									</div>
								))}
							</div>
						)}

						{posts && posts.length > 0 && (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
								{posts.map((post) => (
									<FeaturedCard key={post.id} post={post} />
								))}
							</div>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}
