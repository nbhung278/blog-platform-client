import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useMessages, useSendMessage, useMarkRead } from "@/hooks/useChat";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import type { DirectMessage } from "@/types";

interface Props {
	conversationId: string;
	otherName: string;
}

export default function MessageThread({ conversationId, otherName }: Props) {
	const userId = useAuthStore((s) => s.user?.id);
	const bottomRef = useRef<HTMLDivElement>(null);
	// Synchronous gate — prevents double-send when Enter fires twice before re-render
	const sendingRef = useRef(false);
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useMessages(conversationId);
	const send = useSendMessage(conversationId);
	const markRead = useMarkRead(conversationId);

	// All messages: older pages first, newest page last, items within each page oldest-first.
	// Dedup by ID as a safety net against cache races between onSuccess and WebSocket.
	const allMessages: DirectMessage[] = [];
	const seen = new Set<string>();
	for (const page of (data?.pages ?? []).slice().reverse()) {
		for (const msg of page.items) {
			if (!seen.has(msg.id)) {
				seen.add(msg.id);
				allMessages.push(msg);
			}
		}
	}

	// Scroll to bottom on initial load and new messages
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [allMessages.length]);

	// Mark as read when conversation is opened
	useEffect(() => {
		markRead.mutate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conversationId]);

	function handleSend(data: { content?: string; imageUrl?: string }) {
		if (sendingRef.current) return;
		sendingRef.current = true;
		send.mutate(data, {
			onSettled: () => {
				sendingRef.current = false;
			},
		});
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-brand-border bg-brand-cream flex items-center gap-3 border-b px-4 py-3">
				<span className="text-brand-dark font-serif font-semibold">{otherName}</span>
			</div>

			{/* Messages */}
			<div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
				{hasNextPage && (
					<button
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
						className="text-brand-mid hover:text-brand self-center text-xs transition-colors"
					>
						{isFetchingNextPage ? "Loading…" : "Load older messages"}
					</button>
				)}

				{isLoading && (
					<div className="flex flex-1 items-center justify-center">
						<span className="text-brand-mid text-sm">Loading messages…</span>
					</div>
				)}

				{!isLoading && allMessages.length === 0 && (
					<div className="flex flex-1 items-center justify-center">
						<p className="text-brand-mid text-sm">Say hi to {otherName}!</p>
					</div>
				)}

				{allMessages.map((msg) => (
					<MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === userId} />
				))}

				<div ref={bottomRef} />
			</div>

			<MessageInput onSend={handleSend} disabled={send.isPending} />
		</div>
	);
}
