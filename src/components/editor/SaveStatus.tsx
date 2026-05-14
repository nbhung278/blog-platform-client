import { useEffect, useState } from "react";
import { Check, CloudOff, Loader2 } from "lucide-react";
import type { AutoSaveStatus } from "@/hooks/useAutoSave";

function formatRelativeTime(date: Date, now: Date): string {
	const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
	if (diffSec < 5) return "just now";
	if (diffSec < 60) return `${diffSec}s ago`;
	const minutes = Math.floor(diffSec / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return date.toLocaleDateString();
}

export default function SaveStatus({
	status,
	lastSavedAt,
}: {
	status: AutoSaveStatus;
	lastSavedAt: Date | null;
}) {
	// Re-render every 15s so "Saved 30s ago" stays accurate without flooding
	// React. The interval pauses when nothing was ever saved.
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		if (!lastSavedAt) return;
		const id = setInterval(() => setNow(new Date()), 15_000);
		return () => clearInterval(id);
	}, [lastSavedAt]);

	if (status === "saving") {
		return (
			<span className="text-brand-mid flex items-center gap-1.5 text-xs">
				<Loader2 className="h-3.5 w-3.5 animate-spin" />
				Saving…
			</span>
		);
	}

	if (status === "error") {
		return (
			<span className="flex items-center gap-1.5 text-xs text-red-600">
				<CloudOff className="h-3.5 w-3.5" />
				Save failed — will retry
			</span>
		);
	}

	if (status === "dirty") {
		return <span className="text-brand-mid text-xs">Unsaved changes</span>;
	}

	if (status === "saved" && lastSavedAt) {
		return (
			<span className="text-brand-mid flex items-center gap-1.5 text-xs">
				<Check className="h-3.5 w-3.5" />
				Saved {formatRelativeTime(lastSavedAt, now)}
			</span>
		);
	}

	return null;
}
