import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { usePost, useFeed } from "@/hooks/usePosts";
import { sanitizeHtml, safeImageUrl } from "@/lib/sanitize";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SidebarRecentCard from "@/components/blog/SidebarRecentCard";
import FollowButton from "@/components/blog/FollowButton";
import PostActionBar from "@/components/blog/PostActionBar";
import CommentDrawer from "@/components/blog/CommentDrawer";
import ShareModal from "@/components/blog/ShareModal";
import PostDetailSkeleton from "@/components/blog/PostDetailSkeleton";
import { useComments } from "@/hooks/useComments";

function setMeta(nameOrProp: string, content: string) {
	const isOg = nameOrProp.startsWith("og:") || nameOrProp.startsWith("article:");
	const attr = isOg ? "property" : "name";
	let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProp}"]`);
	if (!el) {
		el = document.createElement("meta");
		el.setAttribute(attr, nameOrProp);
		document.head.appendChild(el);
	}
	el.content = content;
}

function removeMeta(nameOrProp: string) {
	const attr =
		nameOrProp.startsWith("og:") || nameOrProp.startsWith("article:") ? "property" : "name";
	document.querySelector(`meta[${attr}="${nameOrProp}"]`)?.remove();
}

function setCanonical(href: string) {
	let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
	if (!link) {
		link = document.createElement("link");
		link.rel = "canonical";
		document.head.appendChild(link);
	}
	link.href = href;
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<div className="mb-4 flex items-center gap-3">
				<div className="h-px flex-1 bg-gray-200" />
				<h3 className="text-xs font-semibold tracking-widest text-gray-400 uppercase">{title}</h3>
				<div className="h-px flex-1 bg-gray-200" />
			</div>
			{children}
		</div>
	);
}

export default function BlogPostPage() {
	const { username, slug } = useParams({ strict: false }) as {
		username: string;
		slug: string;
	};
	const { data: post, isLoading, isError } = usePost(slug);
	const { data: feedData } = useFeed(6);
	const [email, setEmail] = useState("");
	const [subscribed, setSubscribed] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);

	// Prefetch comment count alongside the post so the action bar shows the
	// real number before the drawer is opened. The drawer reuses this query.
	const { data: commentsData } = useComments(post?.id);
	const commentTotal = commentsData?.pages[0]?.total ?? 0;

	// If the URL has #comment-X (notification deep link), open the drawer so
	// the highlight scroll inside it can find its target.
	useEffect(() => {
		if (window.location.hash.startsWith("#comment-")) {
			setDrawerOpen(true);
		}
	}, []);

	const cleanHtml = useMemo(() => sanitizeHtml(post?.contentHtml ?? ""), [post?.contentHtml]);

	useEffect(() => {
		if (!post) return;
		const description = post.excerpt ?? post.title;
		const canonical = `${window.location.origin}/blog/${post.user?.username ?? username}/${post.slug}`;
		const safeCover = safeImageUrl(post.coverUrl);

		document.title = `${post.title} | Strix`;
		setMeta("description", description);
		setMeta("og:type", "article");
		setMeta("og:title", post.title);
		setMeta("og:description", description);
		if (safeCover) setMeta("og:image", safeCover);
		setMeta("twitter:title", post.title);
		setMeta("twitter:description", description);
		if (safeCover) setMeta("twitter:image", safeCover);
		setCanonical(canonical);

		return () => {
			document.title = "Strix — Code as Craft";
			removeMeta("description");
			removeMeta("og:type");
			removeMeta("og:title");
			removeMeta("og:description");
			removeMeta("og:image");
			removeMeta("twitter:title");
			removeMeta("twitter:description");
			removeMeta("twitter:image");
			document.querySelector('link[rel="canonical"]')?.remove();
		};
	}, [post, username]);

	const recentPosts = (feedData?.items ?? []).filter((p) => p.slug !== slug).slice(0, 3);

	const canonicalUrl = typeof window !== "undefined" ? window.location.href : "";

	// Backend share-preview URL — social crawlers can't see the SPA's
	// runtime-set OG tags, so they fetch this instead. VITE_API_URL ends in
	// /api; strip that to get the backend origin where /share/:user/:slug
	// is mounted. Encode path segments since usernames can in theory contain
	// reserved URL characters even though the slug is always safe.
	const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
	const backendOrigin = apiUrl.replace(/\/api\/?$/, "");
	const previewUrl = post
		? `${backendOrigin}/share/${encodeURIComponent(post.user?.username ?? username)}/${encodeURIComponent(post.slug)}`
		: "";

	if (isLoading) {
		return (
			<div className="flex min-h-screen flex-col bg-white font-sans">
				<SiteHeader />
				<PostDetailSkeleton />
				<SiteFooter />
			</div>
		);
	}
	if (isError || !post) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 font-sans">
				<p className="font-serif text-2xl text-gray-600">Post not found.</p>
				<Link to="/" className="text-brand text-sm underline underline-offset-2">
					← Back to home
				</Link>
			</div>
		);
	}

	const date = post.publishedAt ?? post.updatedAt;
	const authorAvatar = safeImageUrl(post.user?.avatarUrl);
	const safeCoverUrl = safeImageUrl(post.coverUrl);

	return (
		<div className="flex min-h-screen flex-col bg-white font-sans">
			<SiteHeader
				navContent={
					<Link
						to="/blog/$username"
						params={{ username }}
						className="text-brand-mid hover:text-brand-dark hidden text-sm transition-colors md:inline"
					>
						More from @{username} →
					</Link>
				}
			/>

			{/* Cover image */}
			{safeCoverUrl && (
				<div className="mx-auto max-w-7xl px-5 pt-10 md:px-6">
					<img
						src={safeCoverUrl}
						alt=""
						loading="eager"
						decoding="async"
						fetchPriority="high"
						className="aspect-video w-full rounded object-cover md:aspect-21/9"
					/>
				</div>
			)}

			{/* Content + Sidebar */}
			<div className="mx-auto max-w-7xl px-5 py-12 md:px-6">
				<div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,720px)_300px] lg:justify-between">
					{/* Article */}
					<article className="flex min-h-[60vh] w-full min-w-0 flex-col">
						{post.tags.length > 0 && (
							<div className="mb-6 flex flex-wrap gap-2">
								{post.tags.map((tag) => (
									<span
										key={tag}
										className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium tracking-wide text-gray-500 uppercase"
									>
										{tag}
									</span>
								))}
							</div>
						)}

						<h1 className="post-title text-4xl leading-tight font-bold wrap-break-word text-[#1a1a1a] md:text-5xl">
							{post.title}
						</h1>

						<div className="mt-6 flex items-center gap-3">
							<Link
								to="/blog/$username"
								params={{ username }}
								className="group flex min-w-0 flex-1 items-center gap-3"
							>
								{authorAvatar ? (
									<img
										src={authorAvatar}
										alt={post.user?.name ?? ""}
										className="h-10 w-10 shrink-0 rounded-full object-cover"
									/>
								) : (
									<div className="bg-brand-hero text-brand-dark flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold">
										{(post.user?.name ?? "?")[0].toUpperCase()}
									</div>
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-gray-800 group-hover:underline">
										By {post.user?.name ?? username}
									</p>
									<p className="text-xs text-gray-400">{formatDate(date)}</p>
								</div>
							</Link>
							<FollowButton username={username} />
						</div>

						<div className="mt-6">
							<PostActionBar
								postId={post.id}
								commentCount={commentTotal}
								onOpenComments={() => setDrawerOpen(true)}
								onOpenShare={() => setShareOpen(true)}
							/>
						</div>

						{post.excerpt && (
							<p className="mt-6 text-lg leading-relaxed text-gray-500">{post.excerpt}</p>
						)}

						<div
							className="post-content mt-8 min-w-0 wrap-break-word"
							dangerouslySetInnerHTML={{ __html: cleanHtml }}
						/>
					</article>

					<aside className="hidden flex-col gap-8 lg:sticky lg:top-24 lg:flex lg:self-start">
						{post.tags.length > 0 && (
							<SidebarSection title="Category">
								<div className="flex flex-wrap gap-2">
									{post.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
										>
											{tag}
										</span>
									))}
								</div>
							</SidebarSection>
						)}

						<SidebarSection title="Share">
							<button
								type="button"
								onClick={() => setShareOpen(true)}
								className="border-brand-border text-brand-dark hover:bg-brand-hero w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium transition-colors"
							>
								Share this post
							</button>
						</SidebarSection>

						<SidebarSection title="Sign up for Updates">
							{subscribed ? (
								<p className="text-sm text-gray-600">Thanks for subscribing! We’ll be in touch.</p>
							) : (
								<form
									onSubmit={(e) => {
										e.preventDefault();
										if (email) setSubscribed(true);
									}}
									className="flex overflow-hidden rounded border border-gray-200"
								>
									<input
										type="email"
										name="email"
										autoComplete="email"
										placeholder="Enter your email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="flex-1 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none"
									/>
									<button
										type="submit"
										className="bg-brand-mid px-3 py-2 text-xs font-semibold tracking-wide text-white transition-opacity hover:opacity-80"
									>
										Subscribe
									</button>
								</form>
							)}
						</SidebarSection>

						{recentPosts.length > 0 && (
							<SidebarSection title="Recent Articles">
								<div className="flex flex-col gap-6">
									{recentPosts.map((p) => (
										<SidebarRecentCard key={p.id} post={p} />
									))}
								</div>
							</SidebarSection>
						)}
					</aside>
				</div>

				{/* Mobile-only recent articles — surfaces follow-up reading without
				    cramming the desktop sidebar into the reading column. */}
				{recentPosts.length > 0 && (
					<section className="border-brand-border mt-12 border-t pt-8 lg:hidden">
						<h2 className="text-brand-dark mb-5 font-serif text-xl font-bold">Recent articles</h2>
						<div className="flex flex-col gap-6">
							{recentPosts.map((p) => (
								<SidebarRecentCard key={p.id} post={p} />
							))}
						</div>
					</section>
				)}
			</div>

			<SiteFooter />

			<CommentDrawer postId={post.id} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

			<ShareModal
				open={shareOpen}
				onClose={() => setShareOpen(false)}
				url={canonicalUrl}
				shareUrl={previewUrl}
				title={post.title}
			/>
		</div>
	);
}
