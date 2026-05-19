import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { usePublicPosts } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";
import FeaturedCard from "@/components/blog/FeaturedCard";
import PostCardSkeleton from "@/components/blog/PostCardSkeleton";
import OwnerCard from "@/components/blog/OwnerCard";
import FollowButton from "@/components/blog/FollowButton";
import ContinueWritingSection from "@/components/blog/ContinueWritingSection";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useFollowStats } from "@/hooks/useFollows";
import { useStartConversation } from "@/hooks/useChat";
import { safeImageUrl } from "@/lib/sanitize";

export default function BlogUserPage() {
	const { username } = useParams({ strict: false }) as { username: string };
	const { data: posts, isLoading, isError } = usePublicPosts(username);
	const me = useAuthStore((s) => s.user);
	const navigate = useNavigate();
	const startConversation = useStartConversation();
	const isOwner = !!me && me.username === username;
	const authorId = posts?.[0]?.user?.id;
	const canMessage = !!me && !isOwner && !!authorId;

	async function handleMessage() {
		if (!authorId) return;
		const conv = await startConversation.mutateAsync(authorId);
		navigate({ to: "/chat/$conversationId", params: { conversationId: conv.id } });
	}

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
					<Link
						to="/"
						className="text-brand-mid hover:text-brand-dark hidden text-sm transition-colors md:inline"
					>
						← Back to Strix
					</Link>
				}
			/>

			<div className="bg-brand-hero border-brand-border border-b">
				<div className="mx-auto max-w-7xl px-5 py-10 md:px-6">
					<p className="text-brand-mid font-serif text-sm tracking-widest uppercase">Author</p>
					<h1 className="text-brand-dark mt-1 font-serif text-3xl font-bold md:text-4xl">
						{displayName}
					</h1>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-5 py-12 md:px-6">
				<div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[280px_minmax(0,900px)] lg:justify-between">
					<aside className="lg:sticky lg:top-28 lg:self-start">
						<div className="bg-brand-surface border-brand-border rounded-2xl border p-6 shadow-sm">
							<div className="flex justify-center">
								{displayAvatar ? (
									<img
										src={displayAvatar}
										alt={displayName}
										className="ring-brand-hero h-24 w-24 rounded-full object-cover ring-4 ring-offset-2 ring-offset-white"
									/>
								) : (
									<div className="bg-brand-dark ring-brand-hero flex h-24 w-24 items-center justify-center rounded-full font-serif text-3xl font-bold text-white ring-4 ring-offset-2 ring-offset-white">
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

							<div className="bg-brand-hero divide-brand-border/60 mt-5 grid grid-cols-3 divide-x overflow-hidden rounded-xl">
								<StatCell label="Posts" value={published.length} />
								<StatCell label="Followers" value={stats?.followers ?? 0} />
								<StatCell label="Following" value={stats?.following ?? 0} />
							</div>

							{isOwner && (pending.length > 0 || drafts.length > 0) && (
								<div className="text-brand-mid mt-3 flex justify-center gap-4 text-xs">
									{pending.length > 0 && <span>{pending.length} pending</span>}
									{drafts.length > 0 && <span>{drafts.length} drafts</span>}
								</div>
							)}

							{isOwner ? (
								<div className="mt-5 space-y-2">
									<Link
										to="/editor/$postId"
										params={{ postId: "new" }}
										className="bg-brand-dark hover:bg-brand-mid block w-full rounded-full py-2 text-center text-sm font-medium text-white transition-colors"
									>
										+ New post
									</Link>
									<Link
										to="/settings/profile"
										className="border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark block w-full rounded-full border py-2 text-center text-sm transition-colors"
									>
										Edit profile
									</Link>
								</div>
							) : (
								<div className="mt-5 flex items-center justify-center gap-2">
									<FollowButton username={username} />
									{canMessage && (
										<button
											onClick={handleMessage}
											disabled={startConversation.isPending}
											aria-label="Send message"
											title="Send message"
											className="border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark flex h-9 w-9 items-center justify-center rounded-full border bg-white transition-colors disabled:opacity-60"
										>
											<Mail className="h-4 w-4" />
										</button>
									)}
								</div>
							)}

							{!isOwner && (
								<Link
									to="/"
									className="text-brand-mid hover:text-brand-dark mt-5 flex items-center justify-center gap-1.5 text-xs transition-colors"
								>
									<ArrowLeft className="h-3 w-3" />
									Explore all posts
								</Link>
							)}
						</div>
					</aside>

					<main className="min-h-[60vh] w-full min-w-0 space-y-12">
						{isError && <p className="py-10 text-center text-red-500">Failed to load posts.</p>}

						{isLoading && (
							<div
								role="status"
								aria-label="Loading posts"
								className="grid grid-cols-1 gap-6 sm:grid-cols-2"
							>
								{Array.from({ length: 4 }).map((_, i) => (
									<PostCardSkeleton key={i} />
								))}
							</div>
						)}

						{!isLoading && !isError && posts && posts.length === 0 && (
							<div className="py-24 text-center">
								<p className="text-brand-mid font-serif text-2xl">
									{isOwner ? "You haven’t written any posts yet" : "No posts yet"}
								</p>
								{isOwner && (
									<Link
										to="/editor/$postId"
										params={{ postId: "new" }}
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

						{isOwner && <ContinueWritingSection />}
					</main>
				</div>
			</div>

			<SiteFooter />
		</div>
	);
}

function StatCell({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col items-center px-2 py-3">
			<span className="text-brand-dark font-serif text-2xl font-bold tabular-nums">{value}</span>
			<span className="text-brand-mid mt-1 text-xs">{label}</span>
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
