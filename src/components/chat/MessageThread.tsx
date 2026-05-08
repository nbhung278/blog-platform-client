import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import {
	useMessages,
	useSendMessage,
	useMarkRead,
	useReactToMessage,
	useEditMessage,
	useDeleteMessage,
} from "@/hooks/useChat";
import MessageBubble from "./MessageBubble";
import MessageBubbleSkeleton from "./MessageBubbleSkeleton";
import MessageInput from "./MessageInput";
import { EmptyState, ChatBubbleIcon } from "@/components/ui/EmptyState";
import type { DirectMessage, ReactionEmoji } from "@/types";

const GROUP_GAP_MS = 5 * 60 * 1000; // 5 minutes

function getGroupPosition(msgs: DirectMessage[], i: number) {
	const msg = msgs[i];
	const prev = msgs[i - 1];
	const next = msgs[i + 1];
	const samePrev =
		prev &&
		prev.senderId === msg.senderId &&
		new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS;
	const sameNext =
		next &&
		next.senderId === msg.senderId &&
		new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime() < GROUP_GAP_MS;
	if (!samePrev && !sameNext) return "single";
	if (!samePrev && sameNext) return "first";
	if (samePrev && sameNext) return "middle";
	return "last";
}

function formatSeparatorTime(iso: string): string {
	const date = new Date(iso);
	const now = new Date();
	const isToday = date.toDateString() === now.toDateString();
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	const isYesterday = date.toDateString() === yesterday.toDateString();
	const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	if (isToday) return time;
	if (isYesterday) return `Yesterday ${time}`;
	return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
}

interface Props {
	conversationId: string;
	otherName: string;
}

export default function MessageThread({ conversationId, otherName }: Props) {
	const userId = useAuthStore((s) => s.user?.id);
	const sendingRef = useRef(false);

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useMessages(conversationId);
	const send = useSendMessage(conversationId);
	const markRead = useMarkRead(conversationId);
	const react = useReactToMessage(conversationId);
	const editMsg = useEditMessage(conversationId);
	const deleteMsg = useDeleteMessage(conversationId);

	const [replyTo, setReplyTo] = useState<DirectMessage | null>(null);
	const [editingMessage, setEditingMessage] = useState<DirectMessage | null>(null);

	// ── Scroll management refs ──
	const scrollRef = useRef<HTMLDivElement>(null);
	// True when the user is within ~120px of the bottom
	const isNearBottomRef = useRef(true);
	// scrollHeight captured just before fetchNextPage() so we can restore position after prepend
	const savedScrollHeightRef = useRef(0);
	// The ID of the last message we already scrolled to, to detect new arrivals
	const lastScrolledMsgIdRef = useRef("");
	// IntersectionObserver sentinel at the top of the list
	const topSentinelRef = useRef<HTMLDivElement>(null);

	// ── Flatten pages (oldest → newest) ──
	const allMessages = useMemo<DirectMessage[]>(() => {
		const out: DirectMessage[] = [];
		const seen = new Set<string>();
		for (const page of (data?.pages ?? []).slice().reverse()) {
			for (const msg of page.items) {
				if (!seen.has(msg.id)) {
					seen.add(msg.id);
					out.push(msg);
				}
			}
		}
		return out;
	}, [data]);
	const lastMsgId = allMessages[allMessages.length - 1]?.id ?? "";

	// ── Reset scroll state when conversation changes ──
	useEffect(() => {
		isNearBottomRef.current = true;
		savedScrollHeightRef.current = 0;
		lastScrolledMsgIdRef.current = "";
		setReplyTo(null);
		setEditingMessage(null);
	}, [conversationId]);

	// ── Mark read on open ──
	// `markRead.mutate` is stable across renders (TanStack Query guarantee), so
	// adding it to deps doesn't cause a re-fire — only conversationId changes do.
	const markReadFn = markRead.mutate;
	useEffect(() => {
		markReadFn();
	}, [conversationId, markReadFn]);

	// ── IntersectionObserver: trigger fetchNextPage when top sentinel is visible ──
	useEffect(() => {
		const sentinel = topSentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
					savedScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0;
					fetchNextPage();
				}
			},
			{ threshold: 0 },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	// ── Restore scroll position after an older page is prepended ──
	useLayoutEffect(() => {
		const el = scrollRef.current;
		if (!el || isFetchingNextPage || savedScrollHeightRef.current === 0) return;
		// New content was added above — nudge scrollTop so the view stays put
		el.scrollTop = el.scrollHeight - savedScrollHeightRef.current;
		savedScrollHeightRef.current = 0;
	}, [isFetchingNextPage]);

	// ── Scroll to bottom: on initial load and when a new message arrives ──
	useLayoutEffect(() => {
		const el = scrollRef.current;
		if (!el || !lastMsgId) return;

		// If the last message ID changed, a new message arrived (sent or received)
		if (lastMsgId !== lastScrolledMsgIdRef.current) {
			lastScrolledMsgIdRef.current = lastMsgId;

			// Scroll to bottom if: first load OR user is already near bottom
			if (isNearBottomRef.current) {
				el.scrollTop = el.scrollHeight;
			}
		}
	}, [lastMsgId]);

	function handleScroll() {
		const el = scrollRef.current;
		if (!el) return;
		isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
	}

	function handleSend(payload: { content?: string; imageUrl?: string; replyToId?: string }) {
		if (sendingRef.current) return;
		sendingRef.current = true;
		// When the user sends, always scroll to bottom on next paint
		isNearBottomRef.current = true;
		send.mutate(payload, {
			onSettled: () => {
				sendingRef.current = false;
			},
		});
		setReplyTo(null);
	}

	function handleEditSubmit(content: string) {
		if (!editingMessage) return;
		editMsg.mutate({ messageId: editingMessage.id, content });
		setEditingMessage(null);
	}

	const reactFn = react.mutate;
	const deleteFn = deleteMsg.mutate;
	const handleReact = useCallback(
		(messageId: string, emoji: ReactionEmoji) => {
			reactFn({ messageId, emoji });
		},
		[reactFn],
	);

	const handleDelete = useCallback(
		(messageId: string, scope: "me" | "all") => {
			deleteFn({ messageId, scope });
		},
		[deleteFn],
	);

	return (
		<div className="flex h-full flex-col">
			<div className="border-brand-border bg-brand-cream hidden items-center gap-3 border-b px-4 py-3 md:flex">
				<span className="text-brand-dark font-serif font-semibold">{otherName}</span>
			</div>

			{/* Messages */}
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
			>
				{/* Sentinel: becomes visible when user scrolls to top → triggers older-page fetch */}
				<div ref={topSentinelRef} className="shrink-0">
					{isFetchingNextPage && (
						<div className="flex justify-center py-2">
							<span className="text-brand-mid text-xs">Loading…</span>
						</div>
					)}
				</div>

				{isLoading && <MessageBubbleSkeleton />}

				{!isLoading && allMessages.length === 0 && (
					<div className="flex flex-1 items-center justify-center px-6">
						<EmptyState
							icon={<ChatBubbleIcon />}
							title={`Say hi to ${otherName}`}
							description="This is the start of your conversation. Write a message below to break the ice."
						/>
					</div>
				)}

				{allMessages.map((msg, i) => {
					const prev = allMessages[i - 1];
					const showSeparator =
						!prev ||
						new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() >=
							30 * 60 * 1000;
					const groupPosition = getGroupPosition(allMessages, i);
					const isCompact = groupPosition === "middle" || groupPosition === "last";
					return (
						<div key={msg.id} className={isCompact ? "mt-1" : "mt-3"}>
							{showSeparator && (
								<div className="flex items-center gap-3 py-1">
									<div className="bg-brand-border h-px flex-1" />
									<span className="text-brand-mid shrink-0 text-[11px]">
										{formatSeparatorTime(msg.createdAt)}
									</span>
									<div className="bg-brand-border h-px flex-1" />
								</div>
							)}
							<MessageBubble
								message={msg}
								isOwn={msg.senderId === userId}
								groupPosition={groupPosition}
								onReply={setReplyTo}
								onReact={handleReact}
								onEdit={setEditingMessage}
								onDelete={handleDelete}
							/>
						</div>
					);
				})}
			</div>

			<MessageInput
				onSend={handleSend}
				onEditSubmit={handleEditSubmit}
				onCancelEdit={() => setEditingMessage(null)}
				disabled={send.isPending}
				replyTo={replyTo}
				onCancelReply={() => setReplyTo(null)}
				editingMessage={editingMessage}
			/>
		</div>
	);
}
