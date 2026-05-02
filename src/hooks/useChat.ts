import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Conversation, DirectMessage } from "@/types";

export function useConversations() {
	return useQuery({
		queryKey: ["conversations"],
		queryFn: async () => {
			const res = await api.get<Conversation[]>("/conversations");
			return res.data;
		},
	});
}

export function useMessages(conversationId: string) {
	return useInfiniteQuery({
		queryKey: ["messages", conversationId],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "30" });
			if (pageParam) params.set("cursor", pageParam);
			const res = await api.get<{ items: DirectMessage[]; nextCursor: string | null }>(
				`/conversations/${conversationId}/messages?${params}`,
			);
			return res.data;
		},
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});
}

export function useSendMessage(conversationId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: { content?: string; imageUrl?: string }) => {
			const res = await api.post<DirectMessage>(`/conversations/${conversationId}/messages`, data);
			return res.data;
		},
		onSuccess: (msg) => {
			qc.setQueryData(
				["messages", conversationId],
				(
					old:
						| {
								pages: { items: DirectMessage[]; nextCursor: string | null }[];
								pageParams: unknown[];
						  }
						| undefined,
				) => {
					if (!old || old.pages.length === 0) return old;
					// Guard: message may already be present if WS arrived first
					if (old.pages[0].items.some((m) => m.id === msg.id)) return old;
					const pages = [...old.pages];
					pages[0] = { ...pages[0], items: [...pages[0].items, msg] };
					return { ...old, pages };
				},
			);
			qc.invalidateQueries({ queryKey: ["conversations"] });
		},
	});
}

export function useStartConversation() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (userId: string) => {
			const res = await api.post<Conversation>("/conversations", { userId });
			return res.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["conversations"] });
		},
	});
}

export function useMarkRead(conversationId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			await api.post(`/conversations/${conversationId}/read`);
		},
		onSuccess: () => {
			qc.setQueryData(["conversations"], (old: Conversation[] | undefined) =>
				old?.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
			);
		},
	});
}
