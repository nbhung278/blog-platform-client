import { useSearch, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import FeaturedCard from "@/components/blog/FeaturedCard";
import { useSearchPosts } from "@/hooks/usePosts";
import { useSearchUsers } from "@/hooks/useUsers";
import { useStartConversation } from "@/hooks/useChat";
import { useAuthStore } from "@/stores/auth.store";
import type { UserSearchResult } from "@/types";

function UserCard({ user }: { user: UserSearchResult }) {
	const navigate = useNavigate();
	const currentUser = useAuthStore((s) => s.user);
	const start = useStartConversation();

	async function handleMessage() {
		const conv = await start.mutateAsync(user.id);
		navigate({ to: "/chat/$conversationId", params: { conversationId: conv.id } });
	}

	return (
		<div className="border-brand-border bg-brand-surface flex items-center gap-4 rounded-xl border p-4">
			<Link to="/blog/$username" params={{ username: user.username }} className="shrink-0">
				<div className="h-12 w-12 overflow-hidden rounded-full">
					{user.avatarUrl ? (
						<img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
					) : (
						<div className="bg-brand-hero text-brand flex h-full w-full items-center justify-center font-semibold">
							{user.name[0]?.toUpperCase()}
						</div>
					)}
				</div>
			</Link>

			<div className="min-w-0 flex-1">
				<Link to="/blog/$username" params={{ username: user.username }}>
					<p className="text-brand-dark font-semibold hover:underline">{user.name}</p>
				</Link>
				<p className="text-brand-mid text-sm">@{user.username}</p>
				{user.bio && <p className="text-brand-mid mt-0.5 truncate text-sm">{user.bio}</p>}
			</div>

			{currentUser && currentUser.id !== user.id && (
				<button
					onClick={handleMessage}
					disabled={start.isPending}
					className="border-brand-border text-brand-mid hover:bg-brand hover:border-brand shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:text-white disabled:opacity-50"
				>
					Message
				</button>
			)}
		</div>
	);
}

export default function SearchPage() {
	const { q } = useSearch({ from: "/search" });

	const { data: postsData, isLoading: postsLoading, isError: postsError } = useSearchPosts(q ?? "");
	const { data: users = [], isLoading: usersLoading } = useSearchUsers(q ?? "");
	const posts = postsData?.items ?? [];

	const isLoading = postsLoading || usersLoading;
	const totalResults = posts.length + users.length;

	return (
		<div className="flex min-h-screen flex-col bg-white font-sans">
			<SiteHeader />

			{/* Banner */}
			<div className="bg-brand-hero px-6 py-16 text-center">
				{q && (
					<p className="text-brand-mid mb-2 text-sm">
						{isLoading
							? "Searching…"
							: `${totalResults} result${totalResults !== 1 ? "s" : ""} for`}
					</p>
				)}
				<h1 className="text-brand-dark font-serif text-5xl font-bold">{q || "Search"}</h1>
			</div>

			<main className="mx-auto w-full max-w-7xl px-6 py-12">
				{postsError && <p className="py-10 text-center text-red-500">Failed to load results.</p>}

				{!isLoading && totalResults === 0 && q && (
					<p className="text-brand-mid py-10 text-center">
						No results for "{q}". Try a different name, title, or tag.
					</p>
				)}

				{/* People */}
				{users.length > 0 && (
					<section className="mb-12">
						<h2 className="text-brand-dark mb-4 font-serif text-xl font-semibold">People</h2>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{users.map((user) => (
								<UserCard key={user.id} user={user} />
							))}
						</div>
					</section>
				)}

				{/* Posts */}
				{posts.length > 0 && (
					<section>
						<h2 className="text-brand-dark mb-4 font-serif text-xl font-semibold">Posts</h2>
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{posts.map((post) => (
								<FeaturedCard key={post.id} post={post} />
							))}
						</div>
					</section>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
