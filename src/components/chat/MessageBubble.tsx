import type { DirectMessage } from "@/types";

function formatTime(iso: string) {
	return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Props {
	message: DirectMessage;
	isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
	return (
		<div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
			{!isOwn && (
				<div className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
					{message.sender.avatarUrl ? (
						<img
							src={message.sender.avatarUrl}
							alt={message.sender.name}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="bg-brand-hero text-brand flex h-full w-full items-center justify-center text-xs font-semibold">
							{message.sender.name[0]?.toUpperCase()}
						</div>
					)}
				</div>
			)}

			<div className={`flex max-w-[70%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
				{message.imageUrl && (
					<a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
						<img
							src={message.imageUrl}
							alt="attachment"
							className="max-h-60 max-w-xs rounded-xl object-cover shadow-sm"
						/>
					</a>
				)}
				{message.content && (
					<div
						className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
							isOwn
								? "bg-brand rounded-br-sm text-white"
								: "bg-brand-hero text-brand-dark rounded-bl-sm"
						}`}
					>
						{message.content}
					</div>
				)}
				<span className="text-brand-mid px-1 text-[11px]">{formatTime(message.createdAt)}</span>
			</div>
		</div>
	);
}
