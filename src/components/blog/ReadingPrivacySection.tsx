import { useState } from "react";
import {
	isReadingTrackDisabled,
	setReadingTrackDisabled,
	useClearReadingHistory,
} from "@/hooks/useReadingProgress";
import { notify } from "@/lib/notify";

export default function ReadingPrivacySection() {
	// Read the persisted toggle once on mount and mirror it in state. The
	// setter writes back to localStorage so the next page load sees the same
	// value.
	const [tracking, setTracking] = useState(() => !isReadingTrackDisabled());
	const [confirming, setConfirming] = useState(false);
	const clear = useClearReadingHistory();

	function toggle() {
		const next = !tracking;
		setTracking(next);
		setReadingTrackDisabled(!next);
	}

	async function handleClear() {
		try {
			const result = await clear.mutateAsync();
			notify.success(`Cleared ${result?.deleted ?? ""}`.trim() || "Reading history cleared");
		} catch {
			notify.error("Failed to clear reading history");
		} finally {
			setConfirming(false);
		}
	}

	return (
		<section className="bg-brand-surface border-brand-border border p-8">
			<h2 className="text-brand-dark mb-2 font-serif text-xl font-bold">Reading privacy</h2>
			<p className="text-brand-mid mb-6 text-sm">
				The home page surfaces a "Continue reading" rail using your scroll position on posts you've
				started. Manage that data here.
			</p>

			<div className="space-y-5">
				<label className="flex items-start gap-3">
					<input
						type="checkbox"
						checked={tracking}
						onChange={toggle}
						className="accent-brand-dark mt-1 h-4 w-4"
					/>
					<div>
						<p className="text-brand-dark text-sm font-medium">Track my reading progress</p>
						<p className="text-brand-mid text-xs">
							When off, this device stops recording scroll position and the resume banner is hidden.
							Already-saved history is kept until you clear it below.
						</p>
					</div>
				</label>

				<div className="border-brand-border border-t pt-5">
					{!confirming ? (
						<button
							type="button"
							onClick={() => setConfirming(true)}
							className="border-brand-border text-brand-dark hover:bg-brand-hero rounded-lg border bg-white px-4 py-2 text-sm transition-colors"
						>
							Clear reading history
						</button>
					) : (
						<div className="flex flex-wrap items-center gap-3">
							<p className="text-brand-dark text-sm">
								This deletes every saved scroll position. Sure?
							</p>
							<button
								type="button"
								onClick={handleClear}
								disabled={clear.isPending}
								className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-60"
							>
								{clear.isPending ? "Clearing…" : "Yes, clear"}
							</button>
							<button
								type="button"
								onClick={() => setConfirming(false)}
								className="text-brand-mid hover:text-brand-dark text-sm"
							>
								Cancel
							</button>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
