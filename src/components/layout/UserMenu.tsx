import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useLogout } from "@/hooks/useAuth";
import { safeImageUrl } from "@/lib/sanitize";

interface UserMenuProps {
	user: { name: string; username: string; avatarUrl?: string | null };
}

function UserIcon() {
	return (
		<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
			/>
		</svg>
	);
}

function ProfileIcon() {
	return (
		<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
			/>
		</svg>
	);
}

function EditIcon() {
	return (
		<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
			/>
		</svg>
	);
}

function UploadIcon() {
	return (
		<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
			<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0-12l-4 4m4-4l4 4M4 20h16" />
		</svg>
	);
}

function LogoutIcon() {
	return (
		<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M15 12H3m0 0l4-4m-4 4l4 4m6-12h4a2 2 0 012 2v12a2 2 0 01-2 2h-4"
			/>
		</svg>
	);
}

function getInitials(name: string) {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
	return (first + last).toUpperCase() || "?";
}

export default function UserMenu({ user }: UserMenuProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const logout = useLogout();
	const navigate = useNavigate();

	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
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

	async function handleLogout() {
		setOpen(false);
		await logout.mutateAsync();
		navigate({ to: "/" });
	}

	const itemClass =
		"text-brand-dark hover:bg-brand-hero flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors";

	const avatarUrl = safeImageUrl(user.avatarUrl);

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((o) => !o)}
				aria-label="Open user menu"
				aria-expanded={open}
				aria-haspopup="menu"
				className="border-brand-border hover:border-brand flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition-colors"
			>
				<span className="sr-only">{user.name}</span>
				{avatarUrl ? (
					<img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
				) : (
					<span
						aria-hidden="true"
						className="bg-brand-hero text-brand-dark flex h-full w-full items-center justify-center text-sm font-medium"
					>
						{getInitials(user.name)}
					</span>
				)}
			</button>

			{open && (
				<div
					role="menu"
					className="bg-brand-surface border-brand-border absolute top-full right-0 z-50 mt-2 min-w-[220px] overflow-hidden rounded-lg border shadow-xl"
				>
					<div className="border-brand-border border-b px-4 py-3">
						<p className="text-brand-dark truncate text-sm font-medium">{user.name}</p>
						<p className="text-brand-mid truncate text-xs">@{user.username}</p>
					</div>

					<div className="py-1.5">
						<Link
							to="/blog/$username"
							params={{ username: user.username }}
							onClick={() => setOpen(false)}
							role="menuitem"
							className={itemClass}
						>
							<ProfileIcon />
							Profile
						</Link>
						<Link
							to="/settings/profile"
							onClick={() => setOpen(false)}
							role="menuitem"
							className={itemClass}
						>
							<EditIcon />
							Edit profile
						</Link>
						<Link to="/saved" onClick={() => setOpen(false)} role="menuitem" className={itemClass}>
							<Bookmark className="h-4 w-4" />
							Saved posts
						</Link>
						<Link
							to="/editor/new"
							onClick={() => setOpen(false)}
							role="menuitem"
							className={itemClass}
						>
							<UploadIcon />
							Write a post
						</Link>
						<button
							onClick={handleLogout}
							role="menuitem"
							className={`${itemClass} border-brand-border border-t`}
						>
							<LogoutIcon />
							Logout
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export { UserIcon };
