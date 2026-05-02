import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import type { NotificationItem } from "@/hooks/useNotifications";
import type { Conversation, DirectMessage } from "@/types";

const WS_URL =
	import.meta.env.VITE_WS_URL ||
	(import.meta.env.VITE_API_URL ?? "http://localhost:3000/api")
		.replace(/^http/, "ws")
		.replace(/\/api\/?$/, "") + "/ws";

type Message =
	| { kind: "ready" }
	| { kind: "notification"; data: NotificationItem }
	| { kind: "unread_count"; count: number }
	| { kind: "chat_message"; data: DirectMessage & { conversationId: string } };

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
					const { conversationId, ...message } = msg.data;
					const isFromMe = message.senderId === userId;

					// Own messages are already added by useSendMessage.onSuccess — skip cache write
					// to avoid duplicates (WebSocket push arrives before the HTTP response resolves).
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

					// Always update the conversations sidebar (last message + unread count)
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

		return () => {
			stopped = true;
			if (pingTimer) clearInterval(pingTimer);
			if (reconnectTimer) clearTimeout(reconnectTimer);
			ws?.close();
		};
	}, [userId, initialized, qc]);
}
