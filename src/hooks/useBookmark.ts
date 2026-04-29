import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

interface BookmarkState {
	saved: boolean;
	savedAt: string | null;
}

export const bookmarkKey = (postId: string) => ["bookmark", postId] as const;

export function useBookmarkState(postId: string | undefined, enabled: boolean) {
	return useQuery({
		queryKey: bookmarkKey(postId ?? ""),
		queryFn: async () => {
			const res = await api.get<BookmarkState>(`/bookmarks/posts/${postId}`);
			return res.data;
		},
		enabled: enabled && !!postId,
		staleTime: 30_000,
	});
}

export function useToggleBookmark(postId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (next: boolean) => {
			if (next) {
				const res = await api.post<BookmarkState>(`/bookmarks/posts/${postId}`);
				return res.data;
			}
			const res = await api.delete<BookmarkState>(`/bookmarks/posts/${postId}`);
			return res.data;
		},
		onMutate: async (next) => {
			await qc.cancelQueries({ queryKey: bookmarkKey(postId) });
			const prev = qc.getQueryData<BookmarkState>(bookmarkKey(postId));
			qc.setQueryData<BookmarkState>(bookmarkKey(postId), {
				saved: next,
				savedAt: next ? new Date().toISOString() : null,
			});
			return { prev };
		},
		onError: (_err, _next, ctx) => {
			if (ctx?.prev) qc.setQueryData(bookmarkKey(postId), ctx.prev);
		},
		onSuccess: (data) => {
			qc.setQueryData(bookmarkKey(postId), data);
			qc.invalidateQueries({ queryKey: ["bookmarks", "list"] });
		},
	});
}

interface BookmarkedPost {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	coverUrl: string | null;
	publishedAt: string | null;
	readingTime: number;
	tags: string[];
	user: { name: string; username: string; avatarUrl: string | null };
	savedAt: string;
}

interface BookmarkListPage {
	items: BookmarkedPost[];
	nextCursor: string | null;
}

export function useBookmarks() {
	return useQuery({
		queryKey: ["bookmarks", "list"],
		queryFn: async () => {
			const res = await api.get<BookmarkListPage>("/bookmarks");
			return res.data;
		},
	});
}
