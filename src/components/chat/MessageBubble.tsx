import { useState, useRef, useEffect, memo } from "react";
import type { DirectMessage, ReactionEmoji } from "@/types";

const REACTION_EMOJIS: { emoji: ReactionEmoji; label: string; icon: string }[] = [
	{ emoji: "love", label: "Love", icon: "❤️" },
	{ emoji: "like", label: "Like", icon: "👍" },
	{ emoji: "haha", label: "Haha", icon: "😂" },
	{ emoji: "sad", label: "Sad", icon: "😢" },
	{ emoji: "angry", label: "Angry", icon: "😡" },
];

function formatTime(iso: string) {
	return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type GroupPosition = "single" | "first" | "middle" | "last";

interface Props {
	message: DirectMessage;
	isOwn: boolean;
	groupPosition: GroupPosition;
	onReply: (message: DirectMessage) => void;
	onReact: (messageId: string, emoji: ReactionEmoji) => void;
	onEdit: (message: DirectMessage) => void;
	onDelete: (messageId: string, scope: "me" | "all") => void;
}

function MessageBubble({
	message,
	isOwn,
	groupPosition,
	onReply,
	onReact,
	onEdit,
	onDelete,
}: Props) {
	const [showActions, setShowActions] = useState(false);
	const [showReactionPicker, setShowReactionPicker] = useState(false);
	const [showDeleteMenu, setShowDeleteMenu] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!showActions && !showReactionPicker && !showDeleteMenu) return;
		function handleClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setShowActions(false);
				setShowReactionPicker(false);
				setShowDeleteMenu(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [showActions, showReactionPicker, showDeleteMenu]);

	const hasText = !!message.content;
	const hasImage = !!message.imageUrl;
	const hasReply = !!message.replyTo;

	const bubbleBg = isOwn ? "bg-brand text-white" : "bg-brand-hero text-brand-dark";
	const replyBorder = isOwn ? "border-white/60" : "border-brand";
	const replyTextColor = isOwn ? "text-white/65" : "text-brand-dark/65";

	const bubbleRound = isOwn
		? {
				single: "rounded-2xl rounded-br-sm",
				first: "rounded-2xl rounded-br-md",
				middle: "rounded-tl-2xl rounded-tr-md rounded-bl-2xl rounded-br-md",
				last: "rounded-tl-2xl rounded-tr-md rounded-bl-2xl rounded-br-2xl",
			}[groupPosition]
		: {
				single: "rounded-2xl rounded-bl-sm",
				first: "rounded-2xl rounded-bl-md",
				middle: "rounded-tl-md rounded-tr-2xl rounded-bl-md rounded-br-2xl",
				last: "rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl",
			}[groupPosition];

	const showAvatar = !isOwn && (groupPosition === "single" || groupPosition === "last");

	const actionButtons = (
		<div className="flex flex-row items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
			<span className="text-brand-mid px-1 text-[11px] whitespace-nowrap">
				{formatTime(message.createdAt)}
				{message.editedAt && <span className="italic"> · edited</span>}
			</span>

			<button
				type="button"
				onClick={() => {
					setShowReactionPicker((v) => !v);
					setShowActions(false);
					setShowDeleteMenu(false);
				}}
				className="text-brand-mid hover:text-brand rounded-full p-1 text-sm leading-none transition-colors"
				aria-label="React"
			>
				😊
			</button>

			<button
				type="button"
				onClick={() => onReply(message)}
				className="text-brand-mid hover:text-brand rounded-full p-1 transition-colors"
				aria-label="Reply"
			>
				<svg
					className="h-3.5 w-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
					/>
				</svg>
			</button>

			<button
				type="button"
				onClick={() => {
					setShowActions((v) => !v);
					setShowReactionPicker(false);
					setShowDeleteMenu(false);
				}}
				className="text-brand-mid hover:text-brand rounded-full p-1 transition-colors"
				aria-label="More actions"
			>
				<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
					<circle cx="10" cy="4" r="1.5" />
					<circle cx="10" cy="10" r="1.5" />
					<circle cx="10" cy="16" r="1.5" />
				</svg>
			</button>
		</div>
	);

	return (
		<div
			className={`group flex items-center gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
			ref={containerRef}
		>
			{/* Avatar (received only, last/single in group) */}
			{!isOwn && (
				<div className="h-7 w-7 shrink-0 self-end overflow-hidden rounded-full">
					{showAvatar ? (
						message.sender.avatarUrl ? (
							<img
								src={message.sender.avatarUrl}
								alt={message.sender.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="bg-brand-hero text-brand flex h-full w-full items-center justify-center text-xs font-semibold">
								{message.sender.name[0]?.toUpperCase()}
							</div>
						)
					) : null}
				</div>
			)}

			{/* Outer column: bubble + popups + hover time */}
			<div
				className={`relative flex max-w-[70%] flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
			>
				{/* Absolute popups */}
				{showReactionPicker && (
					<div
						className={`border-brand-border bg-brand-cream absolute bottom-full z-10 mb-1 flex gap-1 rounded-full border px-2 py-1 shadow-md ${isOwn ? "right-0" : "left-0"}`}
					>
						{REACTION_EMOJIS.map(({ emoji, label, icon }) => (
							<button
								key={emoji}
								type="button"
								title={label}
								onClick={() => {
									onReact(message.id, emoji);
									setShowReactionPicker(false);
								}}
								className="text-lg leading-none transition-transform hover:scale-125"
							>
								{icon}
							</button>
						))}
					</div>
				)}

				{showActions && (
					<div
						className={`border-brand-border bg-brand-cream absolute bottom-full z-10 mb-1 min-w-[120px] rounded-xl border py-1 shadow-md ${isOwn ? "right-0" : "left-0"}`}
					>
						{isOwn && hasText && (
							<button
								type="button"
								className="text-brand-dark hover:bg-brand-hero w-full px-3 py-1.5 text-left text-sm"
								onClick={() => {
									onEdit(message);
									setShowActions(false);
								}}
							>
								Edit
							</button>
						)}
						<button
							type="button"
							className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50"
							onClick={() => {
								setShowActions(false);
								setShowDeleteMenu(true);
							}}
						>
							Delete
						</button>
					</div>
				)}

				{showDeleteMenu && (
					<div
						className={`border-brand-border bg-brand-cream absolute bottom-full z-10 mb-1 min-w-[160px] rounded-xl border py-1 shadow-md ${isOwn ? "right-0" : "left-0"}`}
					>
						<button
							type="button"
							className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50"
							onClick={() => {
								onDelete(message.id, "me");
								setShowDeleteMenu(false);
							}}
						>
							Delete for me
						</button>
						{isOwn && (
							<button
								type="button"
								className="w-full px-3 py-1.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
								onClick={() => {
									onDelete(message.id, "all");
									setShowDeleteMenu(false);
								}}
							>
								Delete for everyone
							</button>
						)}
					</div>
				)}

				{/* Bubble row: action buttons beside bubble, centered vertically */}
				<div className={`flex items-center gap-1.5 ${isOwn ? "flex-row" : "flex-row-reverse"}`}>
					{actionButtons}

					{/* Bubble + reactions overlaid at bottom-right corner */}
					<div className="relative">
						{hasReply ? (
							<>
								{hasImage && (
									<a href={message.imageUrl!} target="_blank" rel="noopener noreferrer">
										<img
											src={message.imageUrl!}
											alt="attachment"
											className="max-h-72 max-w-xs rounded-xl object-cover shadow-sm"
										/>
									</a>
								)}
								{message.replyTo!.imageUrl && !message.replyTo!.content ? (
									<div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
										<img
											src={message.replyTo!.imageUrl}
											alt="reply"
											className="block max-h-60 max-w-xs rounded-2xl object-cover"
										/>
										{hasText && (
											<div
												className={`relative z-10 -mt-5 w-fit px-4 py-2 text-sm leading-relaxed ${bubbleBg} ${bubbleRound}`}
											>
												{message.content}
											</div>
										)}
									</div>
								) : (
									<div
										className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${hasImage ? "mt-1" : ""}`}
									>
										<div className={`w-fit max-w-xs rounded-2xl px-3 py-2 opacity-75 ${bubbleBg}`}>
											<div className={`${replyBorder} flex items-center gap-1.5 pl-1`}>
												{message.replyTo!.imageUrl && (
													<img
														src={message.replyTo!.imageUrl}
														alt="reply"
														className="h-8 w-8 shrink-0 rounded object-cover"
													/>
												)}
												{message.replyTo!.content && (
													<p className={`text-sm leading-snug ${replyTextColor}`}>
														{message.replyTo!.content}
													</p>
												)}
											</div>
										</div>
										{hasText && (
											<div
												className={`relative z-10 -mt-2 w-fit px-4 py-2 text-sm leading-relaxed wrap-break-word ${bubbleBg} ${bubbleRound}`}
											>
												{message.content}
											</div>
										)}
										{!hasText && <div className="pb-1" />}
									</div>
								)}
							</>
						) : (
							<>
								{hasImage && (
									<a href={message.imageUrl!} target="_blank" rel="noopener noreferrer">
										<img
											src={message.imageUrl!}
											alt="attachment"
											className="max-h-60 max-w-xs rounded-xl object-cover shadow-sm"
										/>
									</a>
								)}
								{hasText && (
									<div className={`px-4 py-2 text-sm leading-relaxed ${bubbleBg} ${bubbleRound}`}>
										{message.content}
									</div>
								)}
							</>
						)}

						{message.reactions.length > 0 && (
							<div
								className={`relative z-10 -mt-2.5 flex ${isOwn ? "justify-end" : "justify-start"}`}
							>
								<div className="border-brand-border flex items-center gap-0.5 rounded-full border bg-white px-1 py-0.5 shadow-sm">
									{message.reactions.map((r) => {
										const def = REACTION_EMOJIS.find((e) => e.emoji === r.emoji);
										return (
											<button
												key={r.emoji}
												type="button"
												onClick={() => onReact(message.id, r.emoji)}
												className="flex items-center gap-0.5 text-xs leading-none transition-transform hover:scale-110"
												title={def?.label}
											>
												<span>{def?.icon}</span>
												{r.count > 1 && <span className="text-brand-mid">{r.count}</span>}
											</button>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default memo(MessageBubble);
