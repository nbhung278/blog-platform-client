import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { CSRF_COOKIE_NAME, CSRF_HEADER } from "@/lib/authConstants";
import type { Post } from "@/types";

export interface ContinueReadingItem {
	progress: number;
	scrollY: number;
	updatedAt: string;
	post: Pick<
		Post,
		"id" | "title" | "slug" | "excerpt" | "coverUrl" | "thumbnailUrl" | "readingTime"
	> & {
		user: { name: string; username: string; avatarUrl: string | null };
	};
}

interface ProgressSnapshot {
	progress: number;
	scrollY: number;
	updatedAt: string | null;
}

const READ_TRACK_DISABLED_KEY = "strix:reading-progress-disabled";

// Local-only opt-out — when set, the hook never POSTs nor reads progress.
// Synced from the settings toggle. Stored client-side because it's a UX
// preference, not a security boundary; the server gladly accepts writes
// regardless.
export function isReadingTrackDisabled(): boolean {
	try {
		return localStorage.getItem(READ_TRACK_DISABLED_KEY) === "1";
	} catch {
		return false;
	}
}

export function setReadingTrackDisabled(disabled: boolean) {
	try {
		if (disabled) localStorage.setItem(READ_TRACK_DISABLED_KEY, "1");
		else localStorage.removeItem(READ_TRACK_DISABLED_KEY);
	} catch {
		// localStorage can throw in private mode; preference just won't persist.
	}
}

// Look up the saved progress for a single post (for the resume banner).
export function usePostReadingProgress(postId: string | undefined, enabled: boolean) {
	return useQuery({
		queryKey: ["reading-progress", postId],
		queryFn: async () => {
			const res = await api.get<ProgressSnapshot>(`/reading-progress/${postId}`);
			return res.data;
		},
		enabled: enabled && !!postId,
		// Fetch on mount so a user who left at 50% and returned later sees
		// the DB's current value (which the previous session wrote on its
		// way out), not a stale snapshot from before they navigated away.
		//
		// We DO suppress window-focus and reconnect refetches: once mounted,
		// the scroll listener on this page is the only writer for this row,
		// so refetching mid-session would either return the same number we
		// just wrote or — worse — overwrite the local "session high" with a
		// stale value that hasn't reached the server yet.
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		staleTime: 60_000,
	});
}

// List endpoint for the "Continue reading" rail on home.
export function useContinueReading(limit = 4, enabled = true) {
	return useQuery({
		queryKey: ["continue-reading", limit],
		queryFn: async () => {
			const res = await api.get<{ items: ContinueReadingItem[] }>(
				`/reading-progress?limit=${limit}`,
			);
			return res.data.items;
		},
		enabled,
		staleTime: 30_000,
	});
}

export function useClearReadingHistory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const res = await api.delete<{ deleted: number }>("/reading-progress");
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["continue-reading"] });
			queryClient.invalidateQueries({ queryKey: ["reading-progress"] });
		},
	});
}

export function useDismissReadingItem() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (postId: string) => {
			await api.delete(`/reading-progress/${postId}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["continue-reading"] });
		},
	});
}

interface TrackOptions {
	postId: string | undefined;
	// Total content height in px. The hook needs it to compute progress; the
	// post-detail page already measures the article ref, so we accept it from
	// outside instead of querying the DOM here.
	getContentHeight: () => number;
	// Optional override — when missing, the hook reads window scroll. The
	// post-detail page uses window-level scroll so the default works.
	enabled?: boolean;
}

// Track scroll + viewport size and POST a delta-throttled snapshot.
//
// Send rules (matters for rate-limit + DB write load):
//   - first send waits until the user has actually scrolled meaningfully
//     (>5% progress) — drive-by opens shouldn't create rows
//   - subsequent sends require >=5% change OR >=15s since the last send
//   - one final flush on unmount via sendBeacon so closing the tab still
//     records the last position
export function useTrackReadingProgress({
	postId,
	getContentHeight,
	enabled = true,
}: TrackOptions) {
	const user = useAuthStore((s) => s.user);
	const active = !!user && !!postId && enabled && !isReadingTrackDisabled();

	const lastSentProgressRef = useRef(0);
	const lastSentAtRef = useRef(0);
	// Tracks whether the user's max progress so far has crossed the
	// "meaningful" floor. Once true it stays true — we don't want a user who
	// reached 60% then scrolled back to top to suddenly disappear from
	// "Continue reading", and we don't want to keep treating a returning
	// reader as a drive-by either.
	const reachedFloorRef = useRef(false);
	const latestRef = useRef<{ progress: number; scrollY: number }>({ progress: 0, scrollY: 0 });
	const postIdRef = useRef(postId);

	useEffect(() => {
		postIdRef.current = postId;
	}, [postId]);

	useEffect(() => {
		if (!active) return;

		let rafId: number | null = null;

		function compute() {
			rafId = null;
			const contentHeight = getContentHeight();
			if (contentHeight <= 0) return;
			const viewport = window.innerHeight;
			const scrollY = window.scrollY;
			// Progress = how far the bottom of the viewport has reached into
			// the content. Clamp to [0, 1] to handle short articles where
			// scrollY can briefly exceed contentHeight from overscroll.
			const raw = (scrollY + viewport) / contentHeight;
			const progress = Math.max(0, Math.min(1, raw));
			latestRef.current = { progress, scrollY };

			const now = Date.now();
			const progressDelta = Math.abs(progress - lastSentProgressRef.current);
			const timeDelta = now - lastSentAtRef.current;

			// Drive-by guard: until the user has scrolled past the 5% floor at
			// least once on this page view, we record nothing. After that we
			// faithfully record whatever they're at (including 0 if they
			// scroll back to top — the resume banner / list filters handle
			// low-progress posts at read time).
			if (!reachedFloorRef.current) {
				if (progress < 0.05) return;
				reachedFloorRef.current = true;
			}

			// Throttle: only send when BOTH the progress moved meaningfully
			// (≥5%) AND at least 15s elapsed since the last send. Logical OR
			// here would fire on every scroll event the moment progress
			// crossed 5% — `(false && false)` skips, but `(true || false)`
			// would not. The AND in the skip-condition means we require both
			// reasons-to-skip to be missing before firing.
			if (progressDelta < 0.05 || timeDelta < 15_000) return;

			lastSentProgressRef.current = progress;
			lastSentAtRef.current = now;
			void send({ postId: postIdRef.current!, progress, scrollY });
		}

		function onScroll() {
			if (rafId !== null) return;
			rafId = window.requestAnimationFrame(compute);
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (rafId !== null) cancelAnimationFrame(rafId);

			// Final flush via sendBeacon — survives tab close. Only fires if
			// the user actually crossed the noise floor at some point during
			// the session AND the latest position differs from the last one
			// we've already sent (avoids a duplicate write on a clean close).
			const { progress, scrollY } = latestRef.current;
			const pid = postIdRef.current;
			if (pid && reachedFloorRef.current && progress !== lastSentProgressRef.current) {
				sendBeacon({ postId: pid, progress, scrollY });
			}
		};
	}, [active, getContentHeight]);
}

async function send(body: { postId: string; progress: number; scrollY: number }) {
	try {
		await api.post("/reading-progress", body);
	} catch {
		// Silent fail — this is best-effort telemetry. We don't want a toast
		// every time the user's offline.
	}
}

function sendBeacon(body: { postId: string; progress: number; scrollY: number }) {
	try {
		// Beacon doesn't support custom headers (so no CSRF token) — fall back
		// to a regular fetch with keepalive instead. Browsers grant keepalive
		// fetches a short grace period after unload, similar to beacon.
		const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
		const cookiePrefix = `${CSRF_COOKIE_NAME}=`;
		const csrfMatch = document.cookie.split("; ").find((c) => c.startsWith(cookiePrefix));
		const csrf = csrfMatch ? decodeURIComponent(csrfMatch.slice(cookiePrefix.length)) : "";
		fetch(`${apiUrl}/reading-progress`, {
			method: "POST",
			credentials: "include",
			keepalive: true,
			headers: {
				"Content-Type": "application/json",
				...(csrf ? { [CSRF_HEADER]: csrf } : {}),
			},
			body: JSON.stringify(body),
		}).catch(() => {
			// keepalive fetch failures are silent — the user has already left
		});
	} catch {
		// Last-ditch — nothing useful to do here
	}
}

// Convenience hook for the resume banner: fetches the saved progress once,
// then exposes a `resume()` that smooth-scrolls to it.
export function useResumeBanner(postId: string | undefined) {
	const user = useAuthStore((s) => s.user);
	const enabled = !!user && !!postId && !isReadingTrackDisabled();
	const query = usePostReadingProgress(postId, enabled);
	const [dismissed, setDismissed] = useState(false);

	const progress = query.data?.progress ?? 0;
	const scrollY = query.data?.scrollY ?? 0;
	const show = enabled && !dismissed && progress >= 0.1 && progress < 0.95;

	function resume() {
		setDismissed(true);
		window.scrollTo({ top: scrollY, behavior: "smooth" });
	}

	function dismiss() {
		setDismissed(true);
	}

	return { show, progress, resume, dismiss, loading: query.isLoading };
}

export { READ_TRACK_DISABLED_KEY };
