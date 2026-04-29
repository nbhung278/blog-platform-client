import type { NotificationItem } from "@/hooks/useNotifications";

// Single source of truth for human-readable notification text. Both the
// header popover and the /notifications page render through here so the
// wording stays consistent.
export function describeNotification(n: NotificationItem): React.ReactNode {
	const name = n.actor?.name ?? "Someone";
	const postTitle = n.post?.title ?? "a post";
	switch (n.type) {
		case "follow":
			return (
				<>
					<strong>{name}</strong> started following you
				</>
			);
		case "post_published":
			return (
				<>
					<strong>{name}</strong> published <em>{postTitle}</em>
				</>
			);
		case "post_updated":
			return (
				<>
					<strong>{name}</strong> updated <em>{postTitle}</em>
				</>
			);
		case "comment_reply":
			return (
				<>
					<strong>{name}</strong> replied to your comment on <em>{postTitle}</em>
				</>
			);
		default:
			return name;
	}
}
