import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { CSRF_COOKIE_NAME, CSRF_HEADER, APP_HEADER, APP_KIND_WEB } from "@/lib/authConstants";
import type { ClapState } from "@/hooks/useClap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface CommentUser {
	id: string;
	name: string;
	username: string;
	avatarUrl: string | null;
}

export interface CommentItem {
	id: string;
	postId: string;
	parentId: string | null;
	content: string;
	isDeleted: boolean;
	isEdited: boolean;
	clapCount: number;
	myClaps: number;
	createdAt: string;
	updatedAt: string;
	user: CommentUser | null;
}

export interface CommentThread extends CommentItem {
	replies: CommentItem[];
}

export interface CommentsPage {
	items: CommentThread[];
	nextCursor: string | null;
	total: number;
}

export type CommentSort = "new" | "top";

export const commentsKey = (postId: string, sort: CommentSort) =>
	["comments", postId, sort] as const;

export function useComments(postId: string | undefined, sort: CommentSort = "new") {
	return useQuery({
		queryKey: commentsKey(postId ?? "", sort),
		queryFn: async () => {
			const res = await api.get<CommentsPage>(`/comments/posts/${postId}?sort=${sort}`);
			return res.data;
		},
		enabled: !!postId,
		staleTime: 30_000,
		// Comments are not realtime-broadcast — refetch when the user comes back to
		// the tab so they see new comments without us holding a WS room per post.
		refetchOnWindowFocus: true,
	});
}

interface CreateInput {
	content: string;
	parentId?: string;
}

export function useCreateComment(postId: string, sort: CommentSort = "new") {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (input: CreateInput) => {
			const res = await api.post<CommentItem>(`/comments/posts/${postId}`, input);
			return res.data;
		},
		onSuccess: (created) => {
			qc.setQueryData<CommentsPage>(commentsKey(postId, sort), (prev) => {
				if (!prev) return prev;
				if (created.parentId) {
					return {
						...prev,
						total: prev.total + 1,
						items: prev.items.map((t) =>
							t.id === created.parentId ? { ...t, replies: [...t.replies, created] } : t,
						),
					};
				}
				return {
					...prev,
					total: prev.total + 1,
					items: [{ ...created, replies: [] }, ...prev.items],
				};
			});
		},
	});
}

export function useUpdateComment(postId: string, sort: CommentSort = "new") {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (input: { id: string; content: string }) => {
			const res = await api.patch<CommentItem>(`/comments/${input.id}`, {
				content: input.content,
			});
			return res.data;
		},
		onSuccess: (updated) => {
			qc.setQueryData<CommentsPage>(commentsKey(postId, sort), (prev) => {
				if (!prev) return prev;
				return {
					...prev,
					items: prev.items.map((t) => {
						if (t.id === updated.id)
							return { ...t, content: updated.content, updatedAt: updated.updatedAt };
						if (t.replies.some((r) => r.id === updated.id)) {
							return {
								...t,
								replies: t.replies.map((r) =>
									r.id === updated.id
										? { ...r, content: updated.content, updatedAt: updated.updatedAt }
										: r,
								),
							};
						}
						return t;
					}),
				};
			});
		},
	});
}

export function useDeleteComment(postId: string, sort: CommentSort = "new") {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/comments/${id}`);
			return id;
		},
		onSuccess: (id) => {
			qc.setQueryData<CommentsPage>(commentsKey(postId, sort), (prev) => {
				if (!prev) return prev;
				return {
					...prev,
					total: Math.max(0, prev.total - 1),
					items: prev.items.map((t) => {
						if (t.id === id) return { ...t, content: "", isDeleted: true };
						if (t.replies.some((r) => r.id === id)) {
							return {
								...t,
								replies: t.replies.map((r) =>
									r.id === id ? { ...r, content: "", isDeleted: true } : r,
								),
							};
						}
						return t;
					}),
				};
			});
		},
	});
}

const COMMENT_FLUSH_DELAY_MS = 1500;

function readCsrfCookie(): string | null {
	const row = document.cookie.split("; ").find((r) => r.startsWith(`${CSRF_COOKIE_NAME}=`));
	return row ? decodeURIComponent(row.slice(CSRF_COOKIE_NAME.length + 1)) : null;
}

// Comment claps share the post-comment cache so we don't need a separate
// query per comment. The hook batches clicks per comment id and flushes the
// delta. Optimistic patches mutate the cached page; the server response
// reconciles `clapCount`/`myClaps` on the right comment by id.
export function useCommentClap(postId: string, sort: CommentSort = "new") {
	const qc = useQueryClient();
	const queryKey = commentsKey(postId, sort);

	// One pending counter per comment id. We can't reuse the post hook's refs
	// because the user may clap many comments concurrently in the drawer.
	const pendingMap = useRef(new Map<string, number>());
	const timerMap = useRef(new Map<string, ReturnType<typeof setTimeout>>());
	const inFlightMap = useRef(new Set<string>());

	const flush = useCallback(
		async (id: string) => {
			const t = timerMap.current.get(id);
			if (t) {
				clearTimeout(t);
				timerMap.current.delete(id);
			}
			const delta = pendingMap.current.get(id) ?? 0;
			if (delta <= 0 || inFlightMap.current.has(id)) return;
			pendingMap.current.set(id, 0);
			inFlightMap.current.add(id);
			try {
				const res = await api.post<ClapState>(`/claps/comments/${id}`, { count: delta });
				qc.setQueryData<CommentsPage>(queryKey, (prev) => {
					if (!prev) return prev;
					const apply = (c: CommentItem): CommentItem =>
						c.id === id ? { ...c, clapCount: res.data.total, myClaps: res.data.myCount } : c;
					return {
						...prev,
						items: prev.items.map((t) => ({ ...apply(t), replies: t.replies.map(apply) })),
					};
				});
			} catch {
				qc.invalidateQueries({ queryKey });
			} finally {
				inFlightMap.current.delete(id);
				const stillPending = pendingMap.current.get(id) ?? 0;
				if (stillPending > 0) {
					timerMap.current.set(
						id,
						setTimeout(() => {
							void flush(id);
						}, COMMENT_FLUSH_DELAY_MS),
					);
				}
			}
		},
		[qc, queryKey],
	);

	const clap = useCallback(
		(id: string) => {
			const page = qc.getQueryData<CommentsPage>(queryKey);
			if (!page) return;

			const find = (): CommentItem | null => {
				for (const t of page.items) {
					if (t.id === id) return t;
					const reply = t.replies.find((r) => r.id === id);
					if (reply) return reply;
				}
				return null;
			};
			const current = find();
			if (!current) return;
			// Cap mirror — server enforces 50 too, but stop counting locally so the
			// UI doesn't keep ticking after the cap.
			const MAX = 50;
			if (current.myClaps >= MAX) return;

			pendingMap.current.set(id, (pendingMap.current.get(id) ?? 0) + 1);

			qc.setQueryData<CommentsPage>(queryKey, (prev) => {
				if (!prev) return prev;
				const apply = (c: CommentItem): CommentItem =>
					c.id === id
						? { ...c, clapCount: c.clapCount + 1, myClaps: Math.min(MAX, c.myClaps + 1) }
						: c;
				return {
					...prev,
					items: prev.items.map((t) => ({ ...apply(t), replies: t.replies.map(apply) })),
				};
			});

			const prev = timerMap.current.get(id);
			if (prev) clearTimeout(prev);
			timerMap.current.set(
				id,
				setTimeout(() => {
					void flush(id);
				}, COMMENT_FLUSH_DELAY_MS),
			);
		},
		[qc, queryKey, flush],
	);

	// Page-hide flush for any pending comment claps. Same beacon strategy as
	// the post hook — fetch with keepalive so cookies/CSRF are attached.
	useEffect(() => {
		// Snapshot the refs so the cleanup function below uses the same
		// instances we registered the listeners with — React Hooks rule.
		const pending = pendingMap.current;
		const onHide = () => {
			const csrf = readCsrfCookie();
			for (const [id, delta] of pending.entries()) {
				if (delta <= 0) continue;
				pending.set(id, 0);
				const url = `${API_URL}/claps/comments/${id}`;
				const body = JSON.stringify({ count: delta });
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
						body,
					});
				} catch {
					// Best-effort — there's nothing more to do if the browser is
					// already tearing the page down.
				}
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
			// Flush every pending counter on unmount (route change).
			const ids = Array.from(pending.keys());
			for (const id of ids) void flush(id);
		};
	}, [flush]);

	return clap;
}
