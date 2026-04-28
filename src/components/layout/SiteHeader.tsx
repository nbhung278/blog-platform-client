import { type ReactNode, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";
import { useCategories } from "@/hooks/usePosts";

interface SiteHeaderProps {
	navContent?: ReactNode;
}

function SearchIcon() {
	return (
		<svg
			className="text-brand-mid h-4 w-4 shrink-0"
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

function LoginIcon() {
	return (
		<svg
			className="text-brand-mid h-5 w-5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
			/>
		</svg>
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
	className = "",
}: {
	onSubmit: (q: string) => void;
	className?: string;
}) {
	const [value, setValue] = useState("");
	return (
		<form
			className={`border-brand-border flex items-center gap-2 rounded-full border px-4 py-2 ${className}`}
			onSubmit={(e) => {
				e.preventDefault();
				if (value.trim()) onSubmit(value.trim());
			}}
		>
			<input
				placeholder="Search Strix…"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className="text-brand-dark placeholder:text-brand-mid w-36 bg-transparent text-sm outline-none"
			/>
			<button type="submit" className="flex items-center">
				<SearchIcon />
			</button>
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
			<button
				onClick={() => setOpen((o) => !o)}
				className="text-brand-mid hover:text-brand-dark flex items-center gap-1 text-sm transition-colors hover:underline"
			>
				Categories
				<ChevronDownIcon />
			</button>

			{open && (
				<div className="bg-brand-surface border-brand-border absolute top-full left-0 z-50 mt-3 min-w-[220px] overflow-hidden rounded-lg border shadow-xl">
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

	function handleSearch(q: string) {
		setMobileOpen(false);
		navigate({ to: "/search", search: { q } });
	}

	return (
		<header className="bg-brand-cream border-brand-border sticky top-0 z-50 border-b">
			<div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-5">
				<Link to="/" className="flex shrink-0 items-end gap-2.5">
					<div className="bg-brand flex h-9 items-center justify-center px-2.5">
						<span className="font-serif text-lg font-bold tracking-wide text-white">
							<span className="text-2xl">S</span>trix
						</span>
					</div>
					<span className="text-brand-dark font-serif text-lg font-semibold">Code as Craft</span>
				</Link>

				{navContent ?? (
					<>
						{user && (
							<nav className="hidden items-center gap-6 md:flex">
								<Link
									to="/dashboard"
									className="text-brand-mid hover:text-brand-dark text-sm transition-colors"
								>
									Dashboard
								</Link>
								<Link
									to="/blog/$username"
									params={{ username: user.username }}
									className="text-brand-mid hover:text-brand-dark text-sm transition-colors"
								>
									My blog
								</Link>
							</nav>
						)}

						<div className="flex-1" />

						<div className="hidden items-center gap-3 md:flex">
							<CategoriesDropdown categories={categories} />
							<SearchBar onSubmit={handleSearch} />
							{!user && (
								<Link
									to="/login"
									className="text-brand-mid hover:text-brand-dark transition-colors"
									aria-label="Login"
								>
									<LoginIcon />
								</Link>
							)}
						</div>

						<div className="flex flex-1 justify-end md:hidden">
							<button
								className="text-brand-mid p-1"
								onClick={() => setMobileOpen((o) => !o)}
								aria-label="Toggle menu"
							>
								<MenuIcon open={mobileOpen} />
							</button>
						</div>
					</>
				)}
			</div>

			{!navContent && mobileOpen && (
				<div className="border-brand-border bg-brand-cream flex flex-col gap-4 border-t px-6 py-4 md:hidden">
					{categories.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-brand-mid text-xs font-medium tracking-wide uppercase">
								Categories
							</p>
							{categories.map((cat) => (
								<Link
									key={cat.id}
									to="/category/$name"
									params={{ name: cat.slug }}
									className="text-brand-mid text-sm"
									onClick={() => setMobileOpen(false)}
								>
									{cat.name}
								</Link>
							))}
						</div>
					)}
					{user ? (
						<>
							<Link
								to="/dashboard"
								className="text-brand-mid text-sm"
								onClick={() => setMobileOpen(false)}
							>
								Dashboard
							</Link>
							<Link
								to="/blog/$username"
								params={{ username: user.username }}
								className="text-brand-mid text-sm"
								onClick={() => setMobileOpen(false)}
							>
								My blog
							</Link>
						</>
					) : (
						<Link
							to="/login"
							className="text-brand-mid text-sm"
							onClick={() => setMobileOpen(false)}
						>
							Login
						</Link>
					)}
					<SearchBar onSubmit={handleSearch} className="w-full" />
				</div>
			)}
		</header>
	);
}
