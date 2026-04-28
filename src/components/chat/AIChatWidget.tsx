import { useState, useRef, useEffect } from "react";
import { streamChat } from "@/api/client";
import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types";

export default function AIChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessageType[]>([]);
	const [input, setInput] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);
	const [sessionId, setSessionId] = useState<string | undefined>();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSend = async () => {
		if (!input.trim() || isStreaming) return;

		const userMessage = input.trim();
		const assistantId = crypto.randomUUID();
		setInput("");
		setMessages((prev) => [
			...prev,
			{ id: crypto.randomUUID(), role: "user", content: userMessage },
		]);
		setIsStreaming(true);

		let assistantContent = "";
		setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

		try {
			for await (const event of streamChat(userMessage, sessionId)) {
				if (event.type === "token") {
					assistantContent += event.data;
					setMessages((prev) => {
						const updated = [...prev];
						updated[updated.length - 1] = {
							...updated[updated.length - 1],
							content: assistantContent,
						};
						return updated;
					});
				} else if (event.type === "session_id") {
					setSessionId(event.data);
				}
			}
		} catch {
			setMessages((prev) => {
				const updated = [...prev];
				updated[updated.length - 1] = {
					...updated[updated.length - 1],
					content: "Sorry, something went wrong.",
				};
				return updated;
			});
		}

		setIsStreaming(false);
	};

	return (
		<>
			{/* Chat toggle button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
			>
				{isOpen ? "X" : "AI"}
			</button>

			{/* Chat panel */}
			{isOpen && (
				<div className="fixed right-6 bottom-24 z-50 flex h-[500px] w-[380px] flex-col rounded-lg border bg-white shadow-xl">
					<div className="border-b px-4 py-3">
						<h3 className="font-semibold">AI Assistant</h3>
						<p className="text-xs text-gray-500">Ask about this blog's content</p>
					</div>

					<div className="flex-1 overflow-y-auto p-4">
						{messages.length === 0 && (
							<p className="text-center text-sm text-gray-400">
								Ask a question about the blog content
							</p>
						)}
						{messages.map((msg) => (
							<ChatMessage key={msg.id} message={msg} />
						))}
						<div ref={messagesEndRef} />
					</div>

					<div className="border-t p-3">
						<div className="flex gap-2">
							<input
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSend()}
								placeholder="Type a message..."
								className="flex-1 rounded border px-3 py-2 text-sm"
								disabled={isStreaming}
							/>
							<button
								onClick={handleSend}
								disabled={isStreaming || !input.trim()}
								className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
							>
								Send
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
