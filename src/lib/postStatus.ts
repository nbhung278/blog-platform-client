import type { PostStatus } from "@/types";

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
	draft: "Draft",
	pending: "Pending review",
	published: "Published",
	rejected: "Rejected",
};

// Subtle pastel chips, used inline (e.g. in editor toolbar pill).
export const POST_STATUS_PILL_CLASS: Record<PostStatus, string> = {
	draft: "bg-gray-100 text-gray-700",
	pending: "bg-amber-100 text-amber-800",
	published: "bg-green-100 text-green-800",
	rejected: "bg-red-100 text-red-700",
};

// Bolder, semi-opaque overlays for use on top of cover images.
export const POST_STATUS_OVERLAY_CLASS: Record<PostStatus, string> = {
	draft: "bg-gray-900/80 text-white",
	pending: "bg-amber-500/90 text-white",
	published: "bg-green-600/90 text-white",
	rejected: "bg-red-600/90 text-white",
};
