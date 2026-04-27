import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";

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

export default function SiteHeader({ navContent }: SiteHeaderProps) {
	const user = useAuthStore((s) => s.user);
	const navigate = useNavigate();
	const [mobileOpen, setMobileOpen] = useState(false);

	function handleSearch(q: string) {
		setMobileOpen(false);
		navigate({ to: "/search", search: { q } });
	}

	return (
		<header className="bg-brand-cream border-brand-border sticky top-0 z-50 border-b">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
				{/* Logo */}
				<Link to="/" className="flex shrink-0 items-end gap-2.5">
					<div className="bg-brand flex h-9 items-center justify-center px-2.5">
						<span className="font-serif text-lg font-bold tracking-wide text-white">
							<span className="text-2xl">S</span>trix
						</span>
					</div>
					<span className="text-brand-dark font-serif text-lg font-semibold">Code as Craft</span>
				</Link>

				{/* Desktop nav */}
				{navContent ?? (
					<nav className="hidden items-center gap-7 md:flex">
						{user ? (
							<>
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
							</>
						) : (
							<>
								<Link
									to="/login"
									className="text-brand-mid hover:text-brand-dark text-sm transition-colors"
								>
									Login
								</Link>
								<Link
									to="/register"
									className="bg-brand rounded px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
								>
									Register
								</Link>
							</>
						)}
						<SearchBar onSubmit={handleSearch} />
					</nav>
				)}

				{/* Mobile hamburger */}
				{!navContent && (
					<button
						className="text-brand-mid p-1 md:hidden"
						onClick={() => setMobileOpen((o) => !o)}
						aria-label="Toggle menu"
					>
						<MenuIcon open={mobileOpen} />
					</button>
				)}
			</div>

			{/* Mobile menu */}
			{!navContent && mobileOpen && (
				<div className="border-brand-border bg-brand-cream flex flex-col gap-4 border-t px-6 py-4 md:hidden">
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
						<>
							<Link
								to="/login"
								className="text-brand-mid text-sm"
								onClick={() => setMobileOpen(false)}
							>
								Login
							</Link>
							<Link
								to="/register"
								className="text-brand-mid text-sm"
								onClick={() => setMobileOpen(false)}
							>
								Register
							</Link>
						</>
					)}
					<SearchBar onSubmit={handleSearch} className="w-full" />
				</div>
			)}
		</header>
	);
}
