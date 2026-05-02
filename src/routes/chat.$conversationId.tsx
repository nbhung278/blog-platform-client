import { Link } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import RequireAuth from "@/components/RequireAuth";
import SiteHeader from "@/components/layout/SiteHeader";
import ConversationList from "@/components/chat/ConversationList";
import MessageThread from "@/components/chat/MessageThread";
import { useConversations } from "@/hooks/useChat";

export default function ChatConversationPage() {
	const { conversationId } = useParams({ from: "/chat/$conversationId" });
	const { data: conversations = [] } = useConversations();
	const conv = conversations.find((c) => c.id === conversationId);
	const otherName = conv?.other?.name ?? "Chat";

	return (
		<RequireAuth>
			<div className="flex h-screen flex-col">
				<SiteHeader />
				<div className="flex min-h-0 flex-1">
					{/* Sidebar: hidden on mobile when inside a conversation */}
					<div className="hidden md:block md:w-80 lg:w-96">
						<ConversationList activeConversationId={conversationId} />
					</div>

					{/* Conversation thread */}
					<div className="flex min-w-0 flex-1 flex-col">
						{/* Mobile back button */}
						<div className="border-brand-border flex items-center gap-2 border-b px-3 py-2 md:hidden">
							<Link to="/chat" className="text-brand-mid hover:text-brand p-1">
								<svg
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
								</svg>
							</Link>
							<span className="text-brand-dark font-medium">{otherName}</span>
						</div>

						<MessageThread conversationId={conversationId} otherName={otherName} />
					</div>
				</div>
			</div>
		</RequireAuth>
	);
}
