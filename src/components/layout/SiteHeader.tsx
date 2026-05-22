import { type ReactNode, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/usePosts";
import { useConversations } from "@/hooks/useChat";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import { StrixLogo } from "./StrixLogo";

interface SiteHeaderProps {
	navContent?: ReactNode;
}

const MOBILE_NAV_LINK_CLASS =
	"text-black hover:bg-brand-hero w-full px-6 py-3 text-base font-medium transition-colors";

// Shared style for top-level nav buttons/links — keep weight medium (Claude-
// style: dark text but not bold) so the row reads as quiet nav, not headlines.
const DESKTOP_NAV_LINK_CLASS =
	"text-black/80 hover:text-black flex items-center gap-1 text-sm font-medium transition-colors";

function SearchIcon() {
	return (
		<svg
			className="h-4 w-4 shrink-0 text-black/60"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
	);
}

function MenuIcon({ open }: { open: boolean }) {
	return open ? (
		<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
			<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
		</svg>
	) : (
		<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
			<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
		</svg>
	);
}

function ChatIcon() {
	const { data: conversations = [] } = useConversations();
	const unread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

	return (
		<Link
			to="/chat"
			className="relative text-black/80 transition-colors hover:text-black"
			aria-label="Messages"
		>
			<svg
				className="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
			{unread > 0 && (
				<span className="bg-brand absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
					{unread > 9 ? "9+" : unread}
				</span>
			)}
		</Link>
	);
}

function ChevronDownIcon() {
	return (
		<svg
			className="h-3.5 w-3.5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
		>
			<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	);
}

function SearchBar({
	onSubmit,
	variant = "pill",
}: {
	onSubmit: (q: string) => void;
	variant?: "pill" | "block";
}) {
	const [value, setValue] = useState("");
	const isBlock = variant === "block";
	return (
		<form
			className={
				isBlock
					? "bg-brand-surface flex w-full items-center gap-2 rounded-md border border-black/15 px-3 py-2.5"
					: "flex items-center gap-2 rounded-full border border-black/15 px-4 py-2"
			}
			onSubmit={(e) => {
				e.preventDefault();
				if (value.trim()) onSubmit(value.trim());
			}}
		>
			{isBlock && <SearchIcon />}
			<input
				type="search"
				name="q"
				placeholder="Search Strix…"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className={`bg-transparent text-sm text-black outline-none placeholder:text-black/40 ${
					isBlock ? "min-w-0 flex-1" : "w-36"
				}`}
			/>
			{!isBlock && (
				<button type="submit" aria-label="Submit search" className="flex items-center">
					<SearchIcon />
				</button>
			)}
		</form>
	);
}

interface CategoryItem {
	id: string;
	name: string;
	slug: string;
}

function CategoriesDropdown({ categories }: { categories: CategoryItem[] }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (!open) return;
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	function handleSelect(slug: string) {
		setOpen(false);
		navigate({ to: "/category/$name", params: { name: slug } });
	}

	return (
		<div ref={ref} className="relative">
			<button onClick={() => setOpen((o) => !o)} className={DESKTOP_NAV_LINK_CLASS}>
				Categories
				<ChevronDownIcon />
			</button>

			{open && (
				<div className="bg-brand-surface absolute top-full left-0 z-50 mt-3 min-w-[220px] overflow-hidden rounded-lg border border-black/10 shadow-xl">
					{categories.length === 0 ? (
						<p className="text-brand-mid px-4 py-3 text-sm">No categories yet</p>
					) : (
						<div className="py-1.5">
							{categories.map((cat) => (
								<button
									key={cat.id}
									onClick={() => handleSelect(cat.slug)}
									className="text-brand-dark hover:bg-brand-hero hover:text-brand group flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors"
								>
									<span className="bg-brand group-hover:bg-brand h-1.5 w-1.5 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100" />
									{cat.name}
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default function SiteHeader({ navContent }: SiteHeaderProps) {
	const user = useAuthStore((s) => s.user);
	const navigate = useNavigate();
	const [mobileOpen, setMobileOpen] = useState(false);
	const { data: categories = [] } = useCategories();
	const logout = useLogout();

	function handleSearch(q: string) {
		setMobileOpen(false);
		navigate({ to: "/search", search: { q } });
	}

	return (
		<header className="bg-brand-cream sticky top-0 z-50 border-b border-black/10">
			<div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-5 py-3 md:px-6 md:py-5">
				<Link
					to="/"
					className="flex shrink-0 items-center gap-3"
					aria-label="Strix — Code as Craft"
				>
					{/* Wordmark renders at the header's content height. text-brand
					    drives the SVG color through currentColor. */}
					<StrixLogo className="text-brand h-10 w-auto md:h-12" />
				</Link>

				<div className="flex-1" />

				{/* Desktop: either custom nav slot (e.g. "More from @user" on a post
				    page) or the default nav with categories, search, user menu. */}
				<div className="hidden items-center gap-3 md:flex">
					{navContent ?? (
						<>
							<CategoriesDropdown categories={categories} />
							<SearchBar onSubmit={handleSearch} />
							{user ? (
								<div className="flex items-center gap-2">
									<ChatIcon />
									<NotificationBell />
									<UserMenu user={user} />
								</div>
							) : (
								<Link
									to="/login"
									className="text-sm font-medium text-black/80 transition-colors hover:text-black"
									aria-label="Login"
								>
									Login
								</Link>
							)}
						</>
					)}
				</div>

				<div className="flex justify-end md:hidden">
					<button
						className="p-1 text-black/80"
						onClick={() => setMobileOpen((o) => !o)}
						aria-label="Toggle menu"
					>
						<MenuIcon open={mobileOpen} />
					</button>
				</div>
			</div>

			{mobileOpen && (
				<div className="bg-brand-cream flex flex-col border-t border-black/10 md:hidden">
					{user && (
						<div className="flex items-center gap-3 border-b border-black/5 px-6 py-4">
							{user.avatarUrl ? (
								<img
									src={user.avatarUrl}
									alt={user.name}
									width={40}
									height={40}
									decoding="async"
									className="h-10 w-10 rounded-full object-cover"
								/>
							) : (
								<div className="bg-brand-dark flex h-10 w-10 items-center justify-center rounded-full font-serif text-base font-semibold text-white">
									{user.name[0]?.toUpperCase()}
								</div>
							)}
							<div className="min-w-0">
								<p className="text-brand-dark truncate text-sm font-semibold">{user.name}</p>
								<p className="text-brand-mid truncate text-xs">@{user.username}</p>
							</div>
						</div>
					)}

					<div className="px-6 py-3">
						<SearchBar onSubmit={handleSearch} variant="block" />
					</div>

					{categories.length > 0 && (
						<div className="border-t border-black/5 px-6 py-3">
							<p className="text-brand-mid mb-2 text-[11px] font-semibold tracking-widest uppercase">
								Categories
							</p>
							<div className="grid grid-cols-2 gap-x-4">
								{categories.map((cat) => (
									<Link
										key={cat.id}
										to="/category/$name"
										params={{ name: cat.slug }}
										className="text-brand-dark hover:text-brand py-2.5 text-sm transition-colors"
										onClick={() => setMobileOpen(false)}
									>
										{cat.name}
									</Link>
								))}
							</div>
						</div>
					)}

					<div className="flex flex-col border-t border-black/5 py-1">
						{user ? (
							<>
								<Link
									to="/blog/$username"
									params={{ username: user.username }}
									className={MOBILE_NAV_LINK_CLASS}
									onClick={() => setMobileOpen(false)}
								>
									Profile
								</Link>
								<Link
									to="/chat"
									className={MOBILE_NAV_LINK_CLASS}
									onClick={() => setMobileOpen(false)}
								>
									Messages
								</Link>
								<Link
									to="/editor/$postId"
									params={{ postId: "new" }}
									className={MOBILE_NAV_LINK_CLASS}
									onClick={() => setMobileOpen(false)}
								>
									Write a post
								</Link>
								<button
									onClick={async () => {
										setMobileOpen(false);
										await logout.mutateAsync();
										navigate({ to: "/" });
									}}
									className="hover:bg-brand-hero w-full px-6 py-3 text-left text-base font-medium text-red-700 transition-colors"
								>
									Logout
								</button>
							</>
						) : (
							<Link
								to="/login"
								className={MOBILE_NAV_LINK_CLASS}
								onClick={() => setMobileOpen(false)}
							>
								Login
							</Link>
						)}
					</div>
				</div>
			)}
		</header>
	);
}
