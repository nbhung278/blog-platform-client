import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkX } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useBookmarks, useToggleBookmark } from "@/hooks/useBookmark";

export default function SavedPage() {
	return (
		<RequireAuth>
			<SavedScreen />
		</RequireAuth>
	);
}

function SavedScreen() {
	const { data, isLoading } = useBookmarks();
	const items = data?.items ?? [];

	return (
		<div className="bg-brand-surface flex min-h-screen flex-col font-sans">
			<SiteHeader />

			<main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
				<div className="mb-8 flex items-center gap-3">
					<Bookmark className="text-brand-mid h-6 w-6" />
					<h1 className="text-brand-dark font-serif text-3xl font-bold">Saved posts</h1>
				</div>

				{isLoading && <p className="text-brand-mid py-10 text-center">Loading…</p>}

				{!isLoading && items.length === 0 && (
					<div className="border-brand-border rounded-lg border border-dashed bg-white px-6 py-16 text-center">
						<Bookmark className="mx-auto mb-4 h-10 w-10 text-gray-300" />
						<p className="text-brand-mid">You haven’t saved any posts yet.</p>
						<Link
							to="/"
							className="text-brand-mid hover:text-brand-dark mt-3 inline-block text-sm underline-offset-2 hover:underline"
						>
							Browse the feed
						</Link>
					</div>
				)}

				<div className="flex flex-col gap-6">
					{items.map((p) => (
						<SavedPostCard key={p.id} post={p} />
					))}
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}

interface SavedPost {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	coverUrl: string | null;
	publishedAt: string | null;
	readingTime: number;
	tags: string[];
	user: { name: string; username: string; avatarUrl: string | null };
	savedAt: string;
}

function SavedPostCard({ post }: { post: SavedPost }) {
	const toggle = useToggleBookmark(post.id);
	const date = post.publishedAt ?? post.savedAt;

	const onUnsave = (e: React.MouseEvent) => {
		e.preventDefault();
		toggle.mutate(false);
	};

	return (
		<article className="border-brand-border group relative flex gap-5 overflow-hidden rounded-lg border bg-white p-5 transition hover:shadow-md">
			{post.coverUrl && (
				<Link
					to="/blog/$username/$slug"
					params={{ username: post.user.username, slug: post.slug }}
					className="shrink-0"
				>
					<img
						src={post.coverUrl}
						alt=""
						loading="lazy"
						className="h-32 w-48 rounded object-cover"
					/>
				</Link>
			)}
			<div className="min-w-0 flex-1">
				<Link
					to="/blog/$username/$slug"
					params={{ username: post.user.username, slug: post.slug }}
					className="block"
				>
					<h2 className="text-brand-dark group-hover:text-brand-mid text-lg font-semibold transition-colors">
						{post.title}
					</h2>
					{post.excerpt && (
						<p className="mt-2 line-clamp-2 text-sm text-gray-600">{post.excerpt}</p>
					)}
				</Link>
				<div className="text-brand-mid mt-3 flex flex-wrap items-center gap-2 text-xs">
					<Link
						to="/blog/$username"
						params={{ username: post.user.username }}
						className="hover:text-brand-dark"
					>
						@{post.user.username}
					</Link>
					<span>·</span>
					<time>{new Date(date).toLocaleDateString()}</time>
					<span>·</span>
					<span>{post.readingTime} min read</span>
					<span>·</span>
					<span>Saved {new Date(post.savedAt).toLocaleDateString()}</span>
				</div>
			</div>
			<button
				onClick={onUnsave}
				disabled={toggle.isPending}
				aria-label="Remove from saved"
				className="self-start rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
			>
				<BookmarkX className="h-4 w-4" />
			</button>
		</article>
	);
}
