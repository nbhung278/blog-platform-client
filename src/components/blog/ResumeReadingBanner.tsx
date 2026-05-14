import { BookOpen, X } from "lucide-react";

export default function ResumeReadingBanner({
	progress,
	onResume,
	onDismiss,
}: {
	progress: number;
	onResume: () => void;
	onDismiss: () => void;
}) {
	const pct = Math.round(progress * 100);
	return (
		<div
			role="region"
			aria-label="Resume reading"
			className="border-brand-border bg-brand-cream flex items-center gap-3 rounded-lg border p-3 sm:p-4"
		>
			<BookOpen className="text-brand-dark h-5 w-5 shrink-0" />
			<div className="min-w-0 flex-1">
				<p className="text-brand-dark text-sm font-medium">You're {pct}% through this article</p>
				<div className="bg-brand-border/50 mt-2 h-1 w-full overflow-hidden rounded-full">
					<div className="bg-brand-dark h-full rounded-full" style={{ width: `${pct}%` }} />
				</div>
			</div>
			<button
				type="button"
				onClick={onResume}
				className="bg-brand-dark hover:bg-brand-mid shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors sm:text-sm"
			>
				Resume
			</button>
			<button
				type="button"
				onClick={onDismiss}
				aria-label="Dismiss"
				className="text-brand-mid hover:text-brand-dark shrink-0 rounded p-1"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}
