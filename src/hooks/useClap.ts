import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { CSRF_COOKIE_NAME, CSRF_HEADER, APP_HEADER, APP_KIND_WEB } from "@/lib/authConstants";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface ClapState {
	total: number;
	myCount: number;
	max: number;
}

export const postClapKey = (postId: string) => ["clap", "post", postId] as const;
export const commentClapKey = (id: string) => ["clap", "comment", id] as const;

export function usePostClapState(postId: string | undefined) {
	return useQuery({
		queryKey: postClapKey(postId ?? ""),
		queryFn: async () => {
			const res = await api.get<ClapState>(`/claps/posts/${postId}`);
			return res.data;
		},
		enabled: !!postId,
		staleTime: 30_000,
	});
}

// How long to wait after the last click before flushing the pending delta to
// the server. Medium uses ~1.5s; that feels responsive without batching too
// little. Tabs that close before the timer fires flush via sendBeacon.
const FLUSH_DELAY_MS = 1500;

interface ClappableTarget {
	kind: "post" | "comment";
	id: string;
}

function readCsrfCookie(): string | null {
	const row = document.cookie.split("; ").find((r) => r.startsWith(`${CSRF_COOKIE_NAME}=`));
	return row ? decodeURIComponent(row.slice(CSRF_COOKIE_NAME.length + 1)) : null;
}

// Hook: provides `clap()` (call to register one click) for a post or comment.
//
// Mechanics:
// - Each call bumps the optimistic local state immediately so the UI animates
//   in real time, regardless of network.
// - A debounced timer flushes the accumulated delta to the server. While the
//   user keeps clapping, the timer keeps resetting — only one HTTP request
//   per burst.
// - On unmount or page hide we flush via fetch+keepalive so claps from a
//   closed tab still land on the server.
// - Server response is the source of truth; we reconcile on success and
//   re-fetch on error rather than locally retrying (a retry could double
//   count if the server applied the original request just before the
//   network blip).
//
// Concurrency: pendingRef is mutated synchronously inside React event
// handlers, so two clicks can never observe a torn value. inFlightRef is a
// boolean serialization point — at most one HTTP request per target is in
// flight at a time, with later clicks queued via the post-flush timer.
export function useClap(target: ClappableTarget) {
	const qc = useQueryClient();
	const { kind, id } = target;
	const queryKey = useMemo(
		() => (kind === "post" ? postClapKey(id) : commentClapKey(id)),
		[kind, id],
	);

	const pendingRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inFlightRef = useRef(false);

	const flush = useCallback(async () => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		const delta = pendingRef.current;
		if (delta <= 0 || inFlightRef.current) return;

		pendingRef.current = 0;
		inFlightRef.current = true;
		try {
			const url = kind === "post" ? `/claps/posts/${id}` : `/claps/comments/${id}`;
			const res = await api.post<ClapState>(url, { count: delta });
			qc.setQueryData(queryKey, res.data);
		} catch {
			qc.invalidateQueries({ queryKey });
		} finally {
			inFlightRef.current = false;
			if (pendingRef.current > 0) {
				timerRef.current = setTimeout(() => {
					void flush();
				}, FLUSH_DELAY_MS);
			}
		}
	}, [qc, queryKey, kind, id]);

	const clap = useCallback(() => {
		const current = qc.getQueryData<ClapState>(queryKey);
		if (current && current.myCount >= current.max) return;

		pendingRef.current += 1;

		qc.setQueryData<ClapState>(queryKey, (prev) =>
			prev
				? {
						...prev,
						total: prev.total + 1,
						myCount: Math.min(prev.max, prev.myCount + 1),
					}
				: prev,
		);

		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			void flush();
		}, FLUSH_DELAY_MS);
	}, [qc, queryKey, flush]);

	// Page-hide / unload / SPA-navigation: ship pending deltas with
	// fetch + keepalive so a closed tab doesn't lose claps. We use fetch
	// instead of navigator.sendBeacon because we need to attach the CSRF
	// header (beacon's API doesn't allow custom headers).
	useEffect(() => {
		const onHide = () => {
			const delta = pendingRef.current;
			if (delta <= 0) return;
			pendingRef.current = 0;
			const csrf = readCsrfCookie();
			const url = `${API_URL}` + (kind === "post" ? `/claps/posts/${id}` : `/claps/comments/${id}`);
			try {
				void fetch(url, {
					method: "POST",
					credentials: "include",
					keepalive: true,
					headers: {
						"Content-Type": "application/json",
						[APP_HEADER]: APP_KIND_WEB,
						...(csrf ? { [CSRF_HEADER]: csrf } : {}),
					},
					body: JSON.stringify({ count: delta }),
				});
			} catch {
				// Best-effort — there's nothing more to do if the browser is
				// already tearing the page down.
			}
		};

		const onVisibility = () => {
			if (document.visibilityState === "hidden") onHide();
		};

		window.addEventListener("pagehide", onHide);
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			window.removeEventListener("pagehide", onHide);
			document.removeEventListener("visibilitychange", onVisibility);
			// Flush on unmount as well — covers SPA navigation.
			void flush();
		};
	}, [flush, kind, id]);

	return { clap, flush };
}
