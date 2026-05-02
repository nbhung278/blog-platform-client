import RequireAuth from "@/components/RequireAuth";
import SiteHeader from "@/components/layout/SiteHeader";
import ConversationList from "@/components/chat/ConversationList";

export default function ChatPage() {
	return (
		<RequireAuth>
			<div className="flex h-screen flex-col">
				<SiteHeader />
				<div className="flex min-h-0 flex-1">
					{/* Sidebar: full width on mobile, fixed width on desktop */}
					<div className="w-full md:w-80 lg:w-96">
						<ConversationList />
					</div>

					{/* Empty state on desktop */}
					<div className="hidden flex-1 items-center justify-center md:flex">
						<div className="text-center">
							<svg
								className="text-brand-border mx-auto mb-4 h-14 w-14"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/>
							</svg>
							<p className="text-brand-mid text-sm">Select a conversation or start a new one</p>
						</div>
					</div>
				</div>
			</div>
		</RequireAuth>
	);
}
