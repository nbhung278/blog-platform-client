import { useEffect, useRef, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Mail, MoreHorizontal, UserPlus, UserRound } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import FeaturedCard from "@/components/blog/FeaturedCard";
import PostCardSkeleton from "@/components/blog/PostCardSkeleton";
import { useSearchPosts, MIN_SEARCH_QUERY_LENGTH } from "@/hooks/usePosts";
import Pagination from "@/components/ui/Pagination";
import { usePaginationNav } from "@/hooks/usePaginationNav";
import { useSearchUsers } from "@/hooks/useUsers";
import { useStartConversation } from "@/hooks/useChat";
import { useFollow, useFollowState } from "@/hooks/useFollows";
import { useAuthStore } from "@/stores/auth.store";
import type { UserSearchResult } from "@/types";

function UserCard({ user }: { user: UserSearchResult }) {
	const navigate = useNavigate();
	const currentUser = useAuthStore((s) => s.user);
	const initialized = useAuthStore((s) => s.initialized);
	const start = useStartConversation();

	const isSelf = currentUser?.id === user.id;
	const canAct = !!currentUser && !isSelf && initialized;

	const followState = useFollowState(user.username, canAct);
	const follow = useFollow(user.username);
	const isFollowing = followState.data?.following ?? false;

	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("mousedown", handleClick);
			document.removeEventListener("keydown", handleKey);
		};
	}, [open]);

	async function handleMessage() {
		setOpen(false);
		const conv = await start.mutateAsync(user.id);
		navigate({ to: "/chat/$conversationId", params: { conversationId: conv.id } });
	}

	function handleViewProfile() {
		setOpen(false);
		navigate({ to: "/blog/$username", params: { username: user.username } });
	}

	function handleFollow() {
		setOpen(false);
		if (!isFollowing) follow.mutate();
	}

	return (
		<div className="border-brand-border bg-brand-surface hover:border-brand-mid/40 flex items-center gap-4 rounded-xl border p-4 transition-colors">
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

			{canAct && (
				<div ref={ref} className="relative shrink-0">
					<button
						onClick={() => setOpen((o) => !o)}
						aria-label="More actions"
						aria-haspopup="menu"
						aria-expanded={open}
						className="border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
					>
						<MoreHorizontal className="h-4 w-4" />
					</button>

					{open && (
						<div
							role="menu"
							className="bg-brand-surface border-brand-border absolute top-full right-0 z-50 mt-2 min-w-[180px] overflow-hidden rounded-lg border shadow-xl"
						>
							<MenuItem
								icon={<UserRound className="h-4 w-4" />}
								label="View profile"
								onClick={handleViewProfile}
							/>
							<MenuItem
								icon={<Mail className="h-4 w-4" />}
								label="Message"
								onClick={handleMessage}
								disabled={start.isPending}
							/>
							{!isFollowing && (
								<MenuItem
									icon={<UserPlus className="h-4 w-4" />}
									label="Follow"
									onClick={handleFollow}
									disabled={follow.isPending || followState.isLoading}
								/>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function MenuItem({
	icon,
	label,
	onClick,
	disabled,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			role="menuitem"
			onClick={onClick}
			disabled={disabled}
			className="text-brand-dark hover:bg-brand-hero flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors disabled:opacity-50"
		>
			{icon}
			{label}
		</button>
	);
}

const SEARCH_PAGE_LIMIT = 12;

export default function SearchPage() {
	const search = useSearch({ from: "/search" });
	const q = search.q;
	const page = search.page ?? 1;
	const navigate = useNavigate({ from: "/search" });
	const trimmedQ = (q ?? "").trim();
	const queryTooShort = trimmedQ.length > 0 && trimmedQ.length < MIN_SEARCH_QUERY_LENGTH;

	const {
		data: postsData,
		isLoading: postsLoading,
		isError: postsError,
	} = useSearchPosts(trimmedQ, page, SEARCH_PAGE_LIMIT);
	// Users search has its own min-length floor inside the hook (currently 2 chars).
	const { data: users = [], isLoading: usersLoading } = useSearchUsers(trimmedQ);
	const posts = postsData?.items ?? [];
	const totalPosts = postsData?.total ?? 0;
	const totalPages = postsData?.totalPages ?? 0;

	const isLoading = postsLoading || usersLoading;
	const totalResults = totalPosts + users.length;

	const changePage = usePaginationNav((next) =>
		navigate({ search: (prev) => ({ ...prev, page: next }) }),
	);

	return (
		<div className="dark:bg-brand-cream flex min-h-screen flex-col bg-white font-sans">
			<SiteHeader />

			{/* Banner */}
			<div className="bg-brand-hero px-5 py-12 text-center md:px-6 md:py-16">
				{trimmedQ && !queryTooShort && (
					<p className="text-brand-mid mb-2 text-sm">
						{isLoading
							? "Searching…"
							: `${totalResults} result${totalResults !== 1 ? "s" : ""} for`}
					</p>
				)}
				<h1 className="text-brand-dark font-serif text-3xl font-bold md:text-5xl">
					{trimmedQ || "Search"}
				</h1>
			</div>

			<main className="mx-auto w-full max-w-7xl px-5 py-12 md:px-6">
				{queryTooShort && (
					<p className="text-brand-mid py-10 text-center">
						Type at least {MIN_SEARCH_QUERY_LENGTH} characters to search posts.
					</p>
				)}

				{postsError && !queryTooShort && (
					<p className="py-10 text-center text-red-500">Failed to load results.</p>
				)}

				{!queryTooShort && !isLoading && totalResults === 0 && trimmedQ && (
					<p className="text-brand-mid py-10 text-center">
						No results for "{trimmedQ}". Try a different name, title, or tag.
					</p>
				)}

				{/* Loading skeleton — only when first searching with no prior results */}
				{!queryTooShort && isLoading && totalResults === 0 && trimmedQ && (
					<section role="status" aria-label="Searching">
						<div className="bg-brand-border/40 mb-4 h-6 w-20 animate-pulse rounded" />
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<PostCardSkeleton key={i} />
							))}
						</div>
					</section>
				)}

				{/* People */}
				{!queryTooShort && users.length > 0 && (
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
				{!queryTooShort && posts.length > 0 && (
					<section>
						<h2 className="text-brand-dark mb-4 font-serif text-xl font-semibold">
							Posts{" "}
							{totalPosts > 0 && <span className="text-brand-mid font-normal">· {totalPosts}</span>}
						</h2>
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{posts.map((post) => (
								<FeaturedCard key={post.id} post={post} />
							))}
						</div>
						<Pagination page={page} totalPages={totalPages} onPageChange={changePage} />
					</section>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
