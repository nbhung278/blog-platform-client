import { Link, useParams } from "@tanstack/react-router";
import { usePublicPosts } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";
import FeaturedCard from "@/components/blog/FeaturedCard";
import OwnerCard from "@/components/blog/OwnerCard";
import FollowButton from "@/components/blog/FollowButton";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useFollowStats } from "@/hooks/useFollows";
import { safeImageUrl } from "@/lib/sanitize";

export default function BlogUserPage() {
	const { username } = useParams({ strict: false }) as { username: string };
	const { data: posts, isLoading, isError } = usePublicPosts(username);
	const me = useAuthStore((s) => s.user);
	const isOwner = !!me && me.username === username;

	// For the owner we use the auth store (always up to date after edits).
	// For visitors we fall back to the post author field or fetch a public profile.
	const ownerProfile = isOwner ? me : null;
	const author = posts?.[0]?.user;

	const displayName = ownerProfile?.name ?? author?.name ?? `@${username}`;
	const displayBio = ownerProfile?.bio ?? null;
	const displayAvatar = safeImageUrl(ownerProfile?.avatarUrl ?? author?.avatarUrl);
	const initial = displayName.charAt(0).toUpperCase();

	const published = posts?.filter((p) => p.status === "published") ?? [];
	const pending = posts?.filter((p) => p.status === "pending") ?? [];
	const drafts = posts?.filter((p) => p.status === "draft") ?? [];
	const rejected = posts?.filter((p) => p.status === "rejected") ?? [];

	const { data: stats } = useFollowStats(username);

	return (
		<div className="bg-brand-surface flex min-h-screen flex-col font-sans">
			<SiteHeader
				navContent={
					<Link to="/" className="text-brand-mid hover:text-brand-dark text-sm transition-colors">
						← Back to Strix
					</Link>
				}
			/>

			<div className="bg-brand-hero border-brand-border border-b">
				<div className="mx-auto max-w-7xl px-6 py-10">
					<p className="text-brand-mid font-serif text-sm tracking-widest uppercase">Author</p>
					<h1 className="text-brand-dark mt-1 font-serif text-4xl font-bold">{displayName}</h1>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-6 py-12">
				<div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[280px_minmax(0,900px)] lg:justify-between">
					<aside className="lg:sticky lg:top-28 lg:self-start">
						<div className="bg-brand-surface border-brand-border border p-6">
							<div className="flex justify-center">
								{displayAvatar ? (
									<img
										src={displayAvatar}
										alt={displayName}
										className="border-brand-border h-24 w-24 rounded-full border-2 object-cover"
									/>
								) : (
									<div className="bg-brand-dark flex h-24 w-24 items-center justify-center rounded-full font-serif text-3xl font-bold text-white">
										{initial}
									</div>
								)}
							</div>

							<div className="mt-4 text-center">
								<p className="text-brand-dark font-serif text-xl font-bold">{displayName}</p>
								<p className="text-brand-mid mt-0.5 text-sm">@{username}</p>
							</div>

							{displayBio && (
								<p className="text-brand-mid mt-3 text-center text-sm leading-relaxed">
									{displayBio}
								</p>
							)}

							<div className="border-brand-border my-5 border-t" />

							<div className="space-y-3">
								<Stat label="Published" value={published.length} />
								{stats && <Stat label="Followers" value={stats.followers} />}
								{stats && <Stat label="Following" value={stats.following} />}
								{isOwner && pending.length > 0 && <Stat label="Pending" value={pending.length} />}
								{isOwner && drafts.length > 0 && <Stat label="Drafts" value={drafts.length} />}
							</div>

							{!isOwner && (
								<div className="mt-5 flex justify-center">
									<FollowButton username={username} />
								</div>
							)}

							<div className="border-brand-border my-5 border-t" />

							{isOwner ? (
								<div className="space-y-2">
									<Link
										to="/editor/new"
										className="bg-brand-dark hover:bg-brand-mid block w-full py-2 text-center text-sm text-white transition-colors"
									>
										+ New post
									</Link>
									<Link
										to="/settings/profile"
										className="border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark block w-full border py-2 text-center text-sm transition-colors"
									>
										Edit profile
									</Link>
								</div>
							) : (
								<Link
									to="/"
									className="border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark block w-full border py-2 text-center text-sm transition-colors"
								>
									Explore all posts
								</Link>
							)}
						</div>
					</aside>

					<main className="min-h-[60vh] w-full min-w-0 space-y-12">
						{isError && <p className="py-10 text-center text-red-500">Failed to load posts.</p>}

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

						{!isLoading && !isError && posts && posts.length === 0 && (
							<div className="py-24 text-center">
								<p className="text-brand-mid font-serif text-2xl">
									{isOwner ? "You haven't written any posts yet" : "No posts yet"}
								</p>
								{isOwner && (
									<Link
										to="/editor/new"
										className="bg-brand-dark hover:bg-brand-mid mt-6 inline-block px-6 py-2 text-sm text-white transition-colors"
									>
										Write your first post
									</Link>
								)}
							</div>
						)}

						{published.length > 0 && (
							<PostSection
								title={`${published.length} published post${published.length === 1 ? "" : "s"}`}
							>
								<PostGrid>
									{published.map((post) =>
										isOwner ? (
											<OwnerCard key={post.id} post={post} />
										) : (
											<FeaturedCard key={post.id} post={post} />
										),
									)}
								</PostGrid>
							</PostSection>
						)}

						{isOwner && pending.length > 0 && (
							<PostSection title="Pending review" subtitle="Only you can see these">
								<PostGrid>
									{pending.map((post) => (
										<OwnerCard key={post.id} post={post} />
									))}
								</PostGrid>
							</PostSection>
						)}

						{isOwner && rejected.length > 0 && (
							<PostSection title="Rejected" subtitle="Edit and resubmit">
								<PostGrid>
									{rejected.map((post) => (
										<OwnerCard key={post.id} post={post} />
									))}
								</PostGrid>
							</PostSection>
						)}

						{isOwner && drafts.length > 0 && (
							<PostSection title="Drafts">
								<PostGrid>
									{drafts.map((post) => (
										<OwnerCard key={post.id} post={post} />
									))}
								</PostGrid>
							</PostSection>
						)}
					</main>
				</div>
			</div>

			<SiteFooter />
		</div>
	);
}

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex items-baseline justify-between">
			<span className="text-brand-mid text-xs tracking-widest uppercase">{label}</span>
			<span className="text-brand-dark font-serif text-2xl font-bold">{value}</span>
		</div>
	);
}

function PostSection({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<div className="border-brand-border mb-6 flex items-baseline justify-between border-b pb-3">
				<h2 className="text-brand-dark font-serif text-xl font-bold">{title}</h2>
				{subtitle && <p className="text-brand-mid text-xs">{subtitle}</p>}
			</div>
			{children}
		</section>
	);
}

function PostGrid({ children }: { children: React.ReactNode }) {
	return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">{children}</div>;
}
