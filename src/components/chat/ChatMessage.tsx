import MDEditor from "@uiw/react-md-editor";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
	message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
	const isUser = message.role === "user";

	return (
		<div className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
					isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
				}`}
			>
				{isUser ? (
					<p>{message.content}</p>
				) : (
					<div data-color-mode="light">
						<MDEditor.Markdown source={message.content} />
					</div>
				)}
			</div>
		</div>
	);
}
