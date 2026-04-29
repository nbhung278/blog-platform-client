import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface NotificationItem {
	id: string;
	type: "follow" | "post_published" | "post_updated";
	isRead: boolean;
	createdAt: string;
	actor: { id: string; name: string; username: string; avatarUrl: string | null } | null;
	post: {
		id: string;
		slug: string;
		title: string;
		user: { username: string };
	} | null;
}

interface ListResponse {
	items: NotificationItem[];
	nextCursor: string | null;
}

export function useUnreadCount(enabled: boolean) {
	return useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: async () => {
			const res = await api.get<{ count: number }>("/notifications/unread-count");
			return res.data.count;
		},
		enabled,
		staleTime: 30_000,
	});
}

// Recent notifications for the header popover (single page).
export function useRecentNotifications(enabled: boolean) {
	return useQuery({
		queryKey: ["notifications", "recent"],
		queryFn: async () => {
			const res = await api.get<ListResponse>("/notifications", { params: { limit: 10 } });
			return res.data.items;
		},
		enabled,
	});
}

// Paginated list for the /notifications page.
export function useAllNotifications(enabled: boolean) {
	return useInfiniteQuery({
		queryKey: ["notifications", "all"],
		queryFn: async ({ pageParam }) => {
			const res = await api.get<ListResponse>("/notifications", {
				params: { limit: 20, ...(pageParam ? { cursor: pageParam } : {}) },
			});
			return res.data;
		},
		initialPageParam: null as string | null,
		getNextPageParam: (last) => last.nextCursor,
		enabled,
	});
}

export function useMarkRead() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (ids: string[]) => {
			if (ids.length === 0) return;
			await api.post("/notifications/mark-read", { ids });
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}

export function useMarkAllRead() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			await api.post("/notifications/mark-all-read");
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}
