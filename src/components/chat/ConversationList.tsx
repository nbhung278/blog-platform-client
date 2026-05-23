import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useConversations, useStartConversation } from "@/hooks/useChat";
import { useSearchUsers } from "@/hooks/useUsers";
import { EmptyState, ChatBubbleIcon } from "@/components/ui/EmptyState";
import ConversationItemSkeleton from "@/components/chat/ConversationItemSkeleton";
import type { Conversation } from "@/types";

function formatRelativeTime(iso: string) {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "now";
	if (mins < 60) return `${mins}m`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h`;
	return `${Math.floor(hrs / 24)}d`;
}

function Avatar({
	name,
	avatarUrl,
	size = "md",
}: {
	name: string;
	avatarUrl: string | null;
	size?: "sm" | "md";
}) {
	const cls = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
	return (
		<div className={`${cls} shrink-0 overflow-hidden rounded-full`}>
			{avatarUrl ? (
				<img
					src={avatarUrl}
					alt={name}
					width={size === "sm" ? 32 : 40}
					height={size === "sm" ? 32 : 40}
					loading="lazy"
					decoding="async"
					className="h-full w-full object-cover"
				/>
			) : (
				<div className="bg-brand-hero text-brand flex h-full w-full items-center justify-center font-semibold">
					{name[0]?.toUpperCase()}
				</div>
			)}
		</div>
	);
}

function NewChatModal({ onClose }: { onClose: () => void }) {
	const [q, setQ] = useState("");
	const navigate = useNavigate();
	const { data: users = [], isLoading } = useSearchUsers(q);
	const start = useStartConversation();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	async function handleSelect(userId: string) {
		const conv = await start.mutateAsync(userId);
		onClose();
		navigate({ to: "/chat/$conversationId", params: { conversationId: conv.id } });
	}

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
			<div
				className="bg-brand-surface border-brand-border w-full max-w-sm overflow-hidden rounded-xl border shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="border-brand-border border-b px-4 py-3">
					<p className="text-brand-dark mb-2 text-sm font-semibold">New conversation</p>
					<input
						ref={inputRef}
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search by name or username…"
						className="text-brand-dark placeholder:text-brand-mid w-full bg-transparent text-sm outline-none"
					/>
				</div>

				<div className="max-h-64 overflow-y-auto py-1">
					{q.trim().length > 0 && isLoading && (
						<p className="text-brand-mid px-4 py-3 text-sm">Searching…</p>
					)}
					{q.trim().length > 0 && !isLoading && users.length === 0 && (
						<p className="text-brand-mid px-4 py-3 text-sm">No users found</p>
					)}
					{users.map((user) => (
						<button
							key={user.id}
							type="button"
							onClick={() => handleSelect(user.id)}
							disabled={start.isPending}
							className="hover:bg-brand-hero flex w-full items-center gap-3 px-4 py-2.5 transition-colors"
						>
							<Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
							<div className="min-w-0 text-left">
								<p className="text-brand-dark truncate text-sm font-medium">{user.name}</p>
								<p className="text-brand-mid truncate text-xs">@{user.username}</p>
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

function ConversationItem({ conv, active }: { conv: Conversation; active: boolean }) {
	const other = conv.other;
	if (!other) return null;

	const lastMsgPreview = conv.lastMessage?.content
		? conv.lastMessage.content.slice(0, 40) + (conv.lastMessage.content.length > 40 ? "…" : "")
		: conv.lastMessage?.imageUrl
			? "📷 Image"
			: "No messages yet";

	return (
		<Link
			to="/chat/$conversationId"
			params={{ conversationId: conv.id }}
			className={`flex items-center gap-3 px-4 py-3 transition-colors ${
				active ? "bg-brand-hero" : "hover:bg-brand-hero"
			}`}
		>
			<div className="relative shrink-0">
				<Avatar name={other.name} avatarUrl={other.avatarUrl} />
				{conv.unreadCount > 0 && (
					<span className="bg-brand absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
						{conv.unreadCount > 9 ? "9+" : conv.unreadCount}
					</span>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-1">
					<span
						className={`truncate text-sm font-medium ${conv.unreadCount > 0 ? "text-brand-dark" : "text-brand-dark"}`}
					>
						{other.name}
					</span>
					<span className="text-brand-mid shrink-0 text-[11px]">
						{conv.lastMessage ? formatRelativeTime(conv.lastMessage.createdAt) : ""}
					</span>
				</div>
				<p
					className={`truncate text-xs ${conv.unreadCount > 0 ? "text-brand-dark font-medium" : "text-brand-mid"}`}
				>
					{lastMsgPreview}
				</p>
			</div>
		</Link>
	);
}

interface Props {
	activeConversationId?: string;
}

export default function ConversationList({ activeConversationId }: Props) {
	const [showNewChat, setShowNewChat] = useState(false);
	const { data: conversations = [], isLoading } = useConversations();

	return (
		<>
			<div className="border-brand-border flex h-full flex-col border-r">
				{/* Header */}
				<div className="border-brand-border flex items-center justify-between border-b px-4 py-4">
					<h2 className="text-brand-dark font-serif text-lg font-semibold">Messages</h2>
					<button
						type="button"
						onClick={() => setShowNewChat(true)}
						className="text-brand-mid hover:text-brand transition-colors"
						aria-label="New conversation"
					>
						<svg
							className="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
					</button>
				</div>

				{/* List */}
				<div className="flex-1 overflow-y-auto">
					{isLoading && (
						<div role="status" aria-label="Loading conversations">
							{Array.from({ length: 5 }).map((_, i) => (
								<ConversationItemSkeleton key={i} />
							))}
						</div>
					)}
					{!isLoading && conversations.length === 0 && (
						<EmptyState
							className="px-6 py-12"
							icon={<ChatBubbleIcon />}
							title="No conversations yet"
							description="Start a chat with someone you follow."
							action={
								<button
									type="button"
									onClick={() => setShowNewChat(true)}
									className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream rounded-full px-4 py-2 text-sm font-medium text-white transition-colors"
								>
									Find people
								</button>
							}
						/>
					)}
					{conversations.map((conv) => (
						<ConversationItem key={conv.id} conv={conv} active={conv.id === activeConversationId} />
					))}
				</div>
			</div>

			{showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
		</>
	);
}
