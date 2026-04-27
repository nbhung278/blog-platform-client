import type { Post } from "@/types";

function Avatar({ post, size = "sm" }: { post: Post; size?: "sm" | "md" }) {
	const dim = size === "md" ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs";
	if (post.user?.avatarUrl) {
		return (
			<img
				src={post.user.avatarUrl}
				alt={post.user.name}
				className={`${dim} rounded-full object-cover`}
			/>
		);
	}
	return (
		<div
			className={`${dim} bg-brand-border text-brand-mid flex items-center justify-center rounded-full font-semibold`}
		>
			{(post.user?.name ?? "?")[0].toUpperCase()}
		</div>
	);
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export default function PostMeta({ post, size = "sm" }: { post: Post; size?: "sm" | "md" }) {
	return (
		<div className="flex items-center gap-2.5">
			<Avatar post={post} size={size} />
			<div>
				<p className="text-brand-dark text-sm font-medium">{post.user?.name ?? "Unknown"}</p>
				{post.publishedAt && (
					<p className="text-brand-mid text-xs">{formatDate(post.publishedAt)}</p>
				)}
			</div>
		</div>
	);
}
