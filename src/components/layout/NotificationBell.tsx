import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import {
	useMarkRead,
	useRecentNotifications,
	useUnreadCount,
	type NotificationItem,
} from "@/hooks/useNotifications";
import { safeImageUrl } from "@/lib/sanitize";

export default function NotificationBell() {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	const { data: unread = 0 } = useUnreadCount(true);
	const { data: items = [], isLoading } = useRecentNotifications(open);
	const markRead = useMarkRead();

	useEffect(() => {
		if (!open) return;
		function handle(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [open]);

	const handleClick = (n: NotificationItem) => {
		setOpen(false);
		if (!n.isRead) markRead.mutate([n.id]);
		if (n.type === "follow" && n.actor) {
			navigate({ to: "/blog/$username", params: { username: n.actor.username } });
		} else if (n.post) {
			navigate({
				to: "/blog/$username/$slug",
				params: { username: n.post.user.username, slug: n.post.slug },
			});
		}
	};

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((o) => !o)}
				className="text-brand-mid hover:text-brand-dark relative p-1.5 transition-colors"
				aria-label="Notifications"
			>
				<Bell className="h-5 w-5" />
				{unread > 0 && (
					<span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
						{unread > 99 ? "99+" : unread}
					</span>
				)}
			</button>

			{open && (
				<div className="bg-brand-surface border-brand-border absolute top-full right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-lg border shadow-xl">
					<div className="border-brand-border flex items-center justify-between border-b px-4 py-3">
						<h3 className="text-brand-dark font-serif text-base font-semibold">Notifications</h3>
						{unread > 0 && <span className="text-brand-mid text-xs">{unread} unread</span>}
					</div>

					<div className="max-h-[400px] overflow-y-auto">
						{isLoading && <p className="text-brand-mid px-4 py-6 text-center text-sm">Loading…</p>}
						{!isLoading && items.length === 0 && (
							<p className="text-brand-mid px-4 py-6 text-center text-sm">No notifications yet</p>
						)}
						{items.map((n) => (
							<button
								key={n.id}
								onClick={() => handleClick(n)}
								className={`hover:bg-brand-hero flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
									!n.isRead ? "bg-brand-hero/40" : ""
								}`}
							>
								<Avatar item={n} />
								<div className="min-w-0 flex-1">
									<p className="text-brand-dark text-sm leading-snug">{describe(n)}</p>
									<p className="text-brand-mid mt-0.5 text-xs">{formatRelative(n.createdAt)}</p>
								</div>
								{!n.isRead && <span className="bg-brand mt-1.5 h-2 w-2 shrink-0 rounded-full" />}
							</button>
						))}
					</div>

					<Link
						to="/notifications"
						onClick={() => setOpen(false)}
						className="border-brand-border text-brand-dark hover:bg-brand-hero block border-t px-4 py-3 text-center text-sm font-medium transition-colors"
					>
						View all notifications
					</Link>
				</div>
			)}
		</div>
	);
}

function Avatar({ item }: { item: NotificationItem }) {
	const actor = item.actor;
	const src = safeImageUrl(actor?.avatarUrl);
	if (src) {
		return (
			<img
				src={src}
				alt={actor?.name ?? ""}
				className="h-9 w-9 shrink-0 rounded-full object-cover"
			/>
		);
	}
	const initial = (actor?.name ?? "?").charAt(0).toUpperCase();
	return (
		<div className="bg-brand-hero text-brand-dark flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium">
			{initial}
		</div>
	);
}

function describe(n: NotificationItem): React.ReactNode {
	const name = n.actor?.name ?? "Someone";
	if (n.type === "follow") {
		return (
			<>
				<strong>{name}</strong> started following you
			</>
		);
	}
	if (n.type === "post_published") {
		return (
			<>
				<strong>{name}</strong> published <em>{n.post?.title ?? "a new post"}</em>
			</>
		);
	}
	if (n.type === "post_updated") {
		return (
			<>
				<strong>{name}</strong> updated <em>{n.post?.title ?? "a post"}</em>
			</>
		);
	}
	return name;
}

function formatRelative(iso: string) {
	const d = new Date(iso);
	const diffMs = Date.now() - d.getTime();
	const min = Math.floor(diffMs / 60000);
	if (min < 1) return "just now";
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	if (day < 7) return `${day}d ago`;
	return d.toLocaleDateString();
}
