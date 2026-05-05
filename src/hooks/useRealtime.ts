import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import type { NotificationItem } from "@/hooks/useNotifications";
import type { Conversation, DirectMessage, MessageReaction } from "@/types";

function deriveWsUrl(): string {
	if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
	const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
	if (!/\/api\/?$/.test(apiUrl)) {
		// VITE_API_URL doesn't end in /api, so the derived ws URL won't strip
		// anything. Surface this so we don't silently connect to a wrong host.
		console.warn(
			"[realtime] VITE_API_URL does not end in /api; set VITE_WS_URL explicitly",
			apiUrl,
		);
	}
	return apiUrl.replace(/^http/, "ws").replace(/\/api\/?$/, "") + "/ws";
}

const WS_URL = deriveWsUrl();

type Message =
	| { kind: "ready" }
	| { kind: "notification"; data: NotificationItem }
	| { kind: "unread_count"; count: number }
	| { kind: "chat_message"; data: DirectMessage & { conversationId: string } }
	| {
			kind: "message_reaction";
			data: { messageId: string; conversationId: string; reactions: MessageReaction[] };
	  }
	| {
			kind: "message_edit";
			data: {
				messageId: string;
				conversationId: string;
				content: string | null;
				editedAt: string | null;
			};
	  }
	| { kind: "message_delete"; data: { messageId: string; conversationId: string } };

type MessagesCache = {
	pages: { items: DirectMessage[]; nextCursor: string | null }[];
	pageParams: unknown[];
};

export function useRealtime() {
	const userId = useAuthStore((s) => s.user?.id);
	const initialized = useAuthStore((s) => s.initialized);
	const qc = useQueryClient();

	useEffect(() => {
		if (!initialized || !userId) return;

		let ws: WebSocket | null = null;
		let retry = 0;
		let pingTimer: ReturnType<typeof setInterval> | null = null;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let stopped = false;

		const connect = () => {
			if (stopped) return;
			ws = new WebSocket(WS_URL);

			ws.onopen = () => {
				retry = 0;
				pingTimer = setInterval(() => ws?.send("ping"), 25_000);
			};

			ws.onmessage = (ev) => {
				if (typeof ev.data !== "string" || ev.data === "pong") return;
				let msg: Message;
				try {
					msg = JSON.parse(ev.data);
				} catch {
					return;
				}

				if (msg.kind === "notification") {
					qc.setQueryData<number>(["notifications", "unread-count"], (prev) => (prev ?? 0) + 1);
					qc.setQueryData<NotificationItem[] | undefined>(["notifications", "recent"], (prev) =>
						prev ? [msg.data, ...prev].slice(0, 10) : [msg.data],
					);
					qc.invalidateQueries({ queryKey: ["notifications", "all"] });
				} else if (msg.kind === "unread_count") {
					qc.setQueryData(["notifications", "unread-count"], msg.count);
				} else if (msg.kind === "chat_message") {
					const { conversationId } = msg.data;
					const message: DirectMessage = { ...msg.data };
					const isFromMe = message.senderId === userId;

					// Own messages are already added by useSendMessage.onSuccess — skip to avoid duplicates
					if (!isFromMe) {
						qc.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) => {
							if (!old || old.pages.length === 0) return old;
							const newestPage = old.pages[0];
							if (newestPage.items.some((m) => m.id === message.id)) return old;
							const pages = [...old.pages];
							pages[0] = { ...newestPage, items: [...newestPage.items, message] };
							return { ...old, pages };
						});
					}

					qc.setQueryData(["conversations"], (old: Conversation[] | undefined) => {
						if (!old) return old;
						return old.map((conv) => {
							if (conv.id !== conversationId) return conv;
							return {
								...conv,
								lastMessage: message,
								unreadCount: isFromMe ? conv.unreadCount : conv.unreadCount + 1,
								updatedAt: message.createdAt,
							};
						});
					});
				} else if (msg.kind === "message_reaction") {
					const { messageId, conversationId, reactions } = msg.data;
					qc.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) => {
						if (!old) return old;
						return {
							...old,
							pages: old.pages.map((page) => ({
								...page,
								items: page.items.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
							})),
						};
					});
				} else if (msg.kind === "message_edit") {
					const { messageId, conversationId, content, editedAt } = msg.data;
					qc.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) => {
						if (!old) return old;
						return {
							...old,
							pages: old.pages.map((page) => ({
								...page,
								items: page.items.map((m) =>
									m.id === messageId ? { ...m, content, editedAt } : m,
								),
							})),
						};
					});
				} else if (msg.kind === "message_delete") {
					const { messageId, conversationId } = msg.data;
					qc.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) => {
						if (!old) return old;
						return {
							...old,
							pages: old.pages.map((page) => ({
								...page,
								items: page.items.filter((m) => m.id !== messageId),
							})),
						};
					});
				}
			};

			ws.onclose = () => {
				if (pingTimer) clearInterval(pingTimer);
				pingTimer = null;
				if (stopped) return;
				const delay = Math.min(30_000, 1000 * 2 ** retry);
				retry += 1;
				reconnectTimer = setTimeout(connect, delay);
			};
		};

		connect();

		// Close socket on pagehide so the page is eligible for the back/forward
		// cache. Reopen on pageshow when the tab is revived from bfcache.
		const onPageHide = () => {
			if (pingTimer) clearInterval(pingTimer);
			pingTimer = null;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			reconnectTimer = null;
			if (ws) {
				// Detach onclose first so the close below doesn't schedule a reconnect
				// while the tab is being parked into bfcache.
				ws.onclose = null;
				ws.close();
				ws = null;
			}
		};
		const onPageShow = (e: PageTransitionEvent) => {
			if (e.persisted && !stopped) {
				retry = 0;
				connect();
			}
		};
		window.addEventListener("pagehide", onPageHide);
		window.addEventListener("pageshow", onPageShow);

		return () => {
			stopped = true;
			window.removeEventListener("pagehide", onPageHide);
			window.removeEventListener("pageshow", onPageShow);
			if (pingTimer) clearInterval(pingTimer);
			if (reconnectTimer) clearTimeout(reconnectTimer);
			ws?.close();
		};
	}, [userId, initialized, qc]);
}
