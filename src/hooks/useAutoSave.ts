import { useEffect, useRef, useState } from "react";
import { useAutosavePost, type AutosavePayload } from "./usePosts";

type AutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
	postId: string | undefined;
	enabled: boolean;
	payload: AutosavePayload;
	debounceMs?: number;
	// Called after a successful save with the server's new version. The
	// editor uses this to keep its local `version` ref in sync so the next
	// manual save's optimistic-concurrency check matches the server.
	onSaved?: (version: number) => void;
}

interface UseAutoSaveResult {
	status: AutoSaveStatus;
	lastSavedAt: Date | null;
	saveNow: () => Promise<void>;
}

// Coordinated autosave loop:
//   - watches `payload`; on any change, marks state dirty and (re)arms a timer
//   - timer flushes a PATCH /autosave when no new changes for `debounceMs`
//   - also flushes on blur/visibility-hidden so a user closing the tab doesn't
//     lose the last few keystrokes
//   - exposes `saveNow()` so callers (eg the manual "Save changes" button)
//     can await the latest content reaching the server before submitting
//
// IMPORTANT: only enable once a `postId` exists. The "create draft on first
// keystroke" step is handled by the caller (it needs to navigate the route
// after create).
export function useAutoSave({
	postId,
	enabled,
	payload,
	debounceMs = 10_000,
	onSaved,
}: UseAutoSaveOptions): UseAutoSaveResult {
	const autosave = useAutosavePost();
	const [status, setStatus] = useState<AutoSaveStatus>("idle");
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

	// Refs so handlers always see the latest payload/enabled/postId without
	// having to depend on them in effect lists.
	const payloadRef = useRef(payload);
	const postIdRef = useRef(postId);
	const enabledRef = useRef(enabled);
	const onSavedRef = useRef(onSaved);

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Promise of the in-flight save; null when none is running. `saveNow`
	// callers can await this directly so a manual save waits for the latest
	// autosave's version bump before issuing its PATCH.
	const inflightRef = useRef<Promise<void> | null>(null);
	// True when a save was requested while another was in flight. The single
	// follow-up flushes whatever's in payloadRef at the moment it actually
	// runs — so we don't queue a fixed snapshot, we always send "latest".
	const pendingFlushRef = useRef(false);

	useEffect(() => {
		payloadRef.current = payload;
		postIdRef.current = postId;
		enabledRef.current = enabled;
		onSavedRef.current = onSaved;
	}, [payload, postId, enabled, onSaved]);

	// `flush` itself is held in a ref so its identity is stable across
	// renders. The event-listener effect below relies on add+remove receiving
	// the same function reference; without this, the cleanup would fail to
	// detach the listener and we'd leak handlers on every re-render.
	const flushRef = useRef<() => Promise<void>>(async () => {});
	flushRef.current = async function flush() {
		const id = postIdRef.current;
		if (!enabledRef.current || !id) return;

		// If something is in flight, mark "another save needed" and await the
		// chain instead of returning immediately. This makes saveNow() callers
		// actually wait for the latest content to land — required for the
		// editor's manual "Save changes" path to avoid a 409.
		if (inflightRef.current) {
			pendingFlushRef.current = true;
			await inflightRef.current;
			return;
		}

		const snapshot = payloadRef.current;
		setStatus("saving");

		const run = (async () => {
			try {
				const result = await autosave.mutateAsync({ id, ...snapshot });
				setLastSavedAt(new Date());
				setStatus("saved");
				onSavedRef.current?.(result.version);
			} catch {
				// Autosave failures are noisy and the user didn't ask for a
				// save — don't toast. The timer effect will re-arm on the next
				// keystroke, naturally retrying.
				setStatus("error");
			} finally {
				inflightRef.current = null;
				if (pendingFlushRef.current) {
					pendingFlushRef.current = false;
					// Re-enter to send whatever's in payloadRef now (which
					// may have changed during the previous request).
					void flushRef.current();
				}
			}
		})();

		inflightRef.current = run;
		await run;
	};

	// Stable function that always delegates to the latest flush impl.
	const stableFlushRef = useRef(() => flushRef.current());

	// (Re)arm timer whenever payload changes.
	useEffect(() => {
		if (!enabled || !postId) return;

		setStatus((prev) => (prev === "saving" ? prev : "dirty"));

		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			void flushRef.current();
		}, debounceMs);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [payload, enabled, postId, debounceMs]);

	// Flush on tab hide + blur. Both events are best-effort: browsers may kill
	// the tab before the request lands, but a normal user closing/switching
	// tabs has 100s of ms of grace.
	useEffect(() => {
		if (!enabled) return;
		const onBlur = () => {
			void flushRef.current();
		};
		const onVisibility = () => {
			if (document.visibilityState === "hidden") void flushRef.current();
		};
		window.addEventListener("blur", onBlur);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			window.removeEventListener("blur", onBlur);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [enabled]);

	// Flush on unmount. SPA navigation (TanStack Router link click,
	// back/forward, `navigate(...)`) does NOT fire blur or visibilitychange
	// — the window keeps focus, the tab stays visible. Without this, a
	// debounce timer still ticking when the user clicks "Back" would never
	// fire, and the last few keystrokes would be lost. The hook deliberately
	// fires once at teardown with whatever's in payloadRef.
	useEffect(() => {
		return () => {
			if (enabledRef.current && postIdRef.current) {
				void flushRef.current();
			}
		};
		// Intentionally empty deps: this cleanup must run only on true
		// unmount, not on every payload re-render. The refs read inside the
		// cleanup always reflect the latest state.
	}, []);

	return { status, lastSavedAt, saveNow: stableFlushRef.current };
}

export type { AutoSaveStatus };
