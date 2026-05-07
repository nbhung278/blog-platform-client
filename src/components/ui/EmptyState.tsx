import type { ReactNode } from "react";

/**
 * Centered empty-state block: brand-hero circle with an icon, a title, an
 * optional secondary line, and an optional CTA. Used by chat (no
 * conversations / first message) and any other "nothing here yet" surface.
 *
 * The icon is passed as a node so each callsite can speak to its own context
 * (chat bubble for messaging, bookmark for saved posts, etc.) — the wrapper
 * only owns the layout and the brand-tinted bubble around it.
 */
interface EmptyStateProps {
	icon: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
	return (
		<div className={`flex flex-col items-center text-center ${className}`}>
			<div className="bg-brand-hero text-brand mb-4 flex h-14 w-14 items-center justify-center rounded-full">
				{icon}
			</div>
			<p className="text-brand-dark font-serif text-base font-semibold">{title}</p>
			{description && <p className="text-brand-mid mt-1 max-w-xs text-sm">{description}</p>}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

/** Speech-bubble glyph used for chat-related empty states. */
export function ChatBubbleIcon() {
	return (
		<svg
			className="h-7 w-7"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={1.5}
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
			/>
		</svg>
	);
}
