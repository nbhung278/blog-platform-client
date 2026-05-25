import { useNavigate } from "@tanstack/react-router";
import RequireAuth from "@/components/RequireAuth";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import NotificationItemSkeleton from "@/components/layout/NotificationItemSkeleton";
import {
	useAllNotifications,
	useDeleteNotification,
	useDeleteReadNotifications,
	useMarkAllRead,
	useMarkRead,
	type NotificationItem,
} from "@/hooks/useNotifications";
import { safeImageUrl } from "@/lib/sanitize";
import { describeNotification } from "@/lib/notificationDescribe";

export default function NotificationsPage() {
	return (
		<RequireAuth>
			<NotificationsScreen />
		</RequireAuth>
	);
}

function NotificationsScreen() {
	const navigate = useNavigate();
	const query = useAllNotifications(true);
	const markRead = useMarkRead();
	const markAllRead = useMarkAllRead();
	const deleteOne = useDeleteNotification();
	const deleteRead = useDeleteReadNotifications();

	const items = query.data?.pages.flatMap((p) => p.items) ?? [];
	const hasUnread = items.some((n) => !n.isRead);
	const hasRead = items.some((n) => n.isRead);

	const handleNavigate = (n: NotificationItem) => {
		if (!n.isRead) markRead.mutate([n.id]);
		if (n.type === "follow" && n.actor) {
			navigate({ to: "/blog/$username", params: { username: n.actor.username } });
		} else if (n.post) {
			navigate({
				to: "/blog/$username/$slug",
				params: { username: n.post.user.username, slug: n.post.slug },
				hash: n.commentId ? `comment-${n.commentId}` : undefined,
			});
		}
	};

	return (
		<div className="bg-brand-surface flex min-h-screen flex-col font-sans">
			<SiteHeader />

			<main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
				<div className="mb-8 flex items-center justify-between gap-3">
					<h1 className="text-brand-dark font-serif text-3xl font-bold">Notifications</h1>
					<div className="flex items-center gap-5">
						{hasRead && (
							<button
								onClick={() => deleteRead.mutate()}
								disabled={deleteRead.isPending}
								className="text-brand-mid hover:text-brand-dark text-xs transition-colors hover:underline disabled:opacity-60"
							>
								Clear read notifications
							</button>
						)}
						{hasUnread && (
							<button
								onClick={() => markAllRead.mutate()}
								disabled={markAllRead.isPending}
								className="text-brand-mid hover:text-brand-dark text-xs transition-colors hover:underline disabled:opacity-60"
							>
								Mark all as read
							</button>
						)}
					</div>
				</div>

				{query.isLoading ? (
					<div
						role="status"
						aria-label="Loading notifications"
						className="border-brand-border divide-brand-border bg-brand-surface divide-y rounded-lg border"
					>
						{Array.from({ length: 5 }).map((_, i) => (
							<NotificationItemSkeleton key={i} />
						))}
					</div>
				) : items.length === 0 ? (
					<p className="text-brand-mid py-20 text-center">No notifications yet.</p>
				) : (
					<div className="border-brand-border divide-brand-border bg-brand-surface divide-y rounded-lg border">
						{items.map((n) => (
							<div
								key={n.id}
								className={`group hover:bg-brand-hero flex items-start gap-3 px-5 py-4 transition-colors ${
									!n.isRead ? "bg-brand-hero/40" : ""
								}`}
							>
								<button
									onClick={() => handleNavigate(n)}
									className="flex flex-1 items-start gap-3 text-left"
								>
									<Avatar item={n} />
									<div className="min-w-0 flex-1">
										<p className="text-brand-dark text-sm leading-snug">
											{describeNotification(n)}
										</p>
										<p className="text-brand-mid mt-0.5 text-xs">{formatRelative(n.createdAt)}</p>
									</div>
									{!n.isRead && <span className="bg-brand mt-1.5 h-2 w-2 shrink-0 rounded-full" />}
								</button>
								<button
									type="button"
									onClick={() => deleteOne.mutate(n.id)}
									className="text-brand-mid hover:text-brand-dark ml-2 shrink-0 self-center text-xs opacity-0 transition-all group-hover:opacity-100 hover:underline focus-visible:opacity-100"
								>
									Delete
								</button>
							</div>
						))}
					</div>
				)}

				{query.hasNextPage && (
					<div className="mt-6 text-center">
						<button
							onClick={() => query.fetchNextPage()}
							disabled={query.isFetchingNextPage}
							className="border-brand-border text-brand-dark hover:bg-brand-hero dark:bg-brand-surface rounded-full border bg-white px-5 py-2 text-sm transition-colors disabled:opacity-60"
						>
							{query.isFetchingNextPage ? "Loading…" : "Load more"}
						</button>
					</div>
				)}
			</main>

			<SiteFooter />
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
				className="h-10 w-10 shrink-0 rounded-full object-cover"
			/>
		);
	}
	const initial = (actor?.name ?? "?").charAt(0).toUpperCase();
	return (
		<div className="bg-brand-hero text-brand-dark flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium">
			{initial}
		</div>
	);
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
