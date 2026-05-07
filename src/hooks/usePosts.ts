import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
	CategorySection,
	Category,
	PaginatedPosts,
	Post,
	PostInput,
	PostsPage,
} from "@/types";

export const MIN_SEARCH_QUERY_LENGTH = 3;

export function useMyPosts() {
	return useQuery({
		queryKey: ["my-posts"],
		queryFn: async () => {
			const res = await api.get<PostsPage>("/posts");
			return res.data.data;
		},
	});
}

export function useFeed(limit = 20) {
	return useQuery({
		queryKey: ["feed", limit],
		queryFn: async () => {
			const res = await api.get<{ items: Post[]; nextCursor: string | null }>(
				`/posts/feed?limit=${limit}`,
			);
			return res.data;
		},
		// No polling — feed refreshes when the user navigates back or refocuses
		// the tab. Constant background fetches were burning API quota and
		// battery for negligible UX gain on a blog feed.
		staleTime: 60_000,
		refetchOnWindowFocus: true,
	});
}

export function usePublicPosts(username: string) {
	return useQuery({
		queryKey: ["public-posts", username],
		queryFn: async () => {
			const res = await api.get<Post[]>(`/posts/public/${username}`);
			return res.data;
		},
		staleTime: 60_000,
		refetchOnWindowFocus: true,
	});
}

export function usePost(slug: string) {
	return useQuery({
		queryKey: ["post", slug],
		queryFn: async () => {
			const res = await api.get<Post>(`/posts/${slug}`);
			return res.data;
		},
		staleTime: 60_000,
		refetchOnWindowFocus: false,
	});
}

// Get post by ID — for editing flow. Includes contentMd/contentHtml + categories.
export function usePostById(id: string | undefined) {
	return useQuery({
		queryKey: ["post-by-id", id],
		queryFn: async () => {
			const res = await api.get<Post>(`/posts/id/${id}`);
			return res.data;
		},
		enabled: !!id,
	});
}

export function useCreatePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: PostInput) => {
			const res = await api.post<Post>("/posts", data);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-posts"] });
			queryClient.invalidateQueries({ queryKey: ["public-posts"] });
		},
	});
}

export function useUpdatePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...data
		}: Partial<PostInput> & {
			id: string;
			version: number;
		}) => {
			const res = await api.patch<Post>(`/posts/${id}`, data);
			return res.data;
		},
		onSuccess: (post) => {
			queryClient.invalidateQueries({ queryKey: ["my-posts"] });
			queryClient.invalidateQueries({ queryKey: ["public-posts"] });
			queryClient.invalidateQueries({ queryKey: ["post-by-id", post.id] });
		},
	});
}

export function useSearchPosts(q: string, page = 1, limit = 12) {
	const trimmed = q.trim();
	const longEnough = trimmed.length >= MIN_SEARCH_QUERY_LENGTH;
	return useQuery({
		queryKey: ["search", trimmed, page, limit],
		queryFn: async () => {
			const res = await api.get<PaginatedPosts>(
				`/posts/search?q=${encodeURIComponent(trimmed)}&page=${page}&limit=${limit}`,
			);
			return res.data;
		},
		enabled: longEnough,
	});
}

export function usePostsByCategory(slug: string, page = 1, limit = 12) {
	return useQuery({
		queryKey: ["posts-by-category", slug, page, limit],
		queryFn: async () => {
			const res = await api.get<PaginatedPosts>(
				`/posts/search?category=${encodeURIComponent(slug)}&page=${page}&limit=${limit}`,
			);
			return res.data;
		},
		enabled: !!slug.trim(),
		placeholderData: (prev) => prev,
	});
}

export function usePostsByCategories(
	perCategory = 4,
	maxCategories = 6,
	sort: "popular" | "recent" = "popular",
) {
	return useQuery({
		queryKey: ["posts-by-categories", perCategory, maxCategories, sort],
		queryFn: async () => {
			const res = await api.get<{ sections: CategorySection[] }>(
				`/posts/by-categories?perCategory=${perCategory}&maxCategories=${maxCategories}&sort=${sort}`,
			);
			return res.data;
		},
		staleTime: 60_000,
	});
}

export function useMostViewedPosts(limit = 4) {
	return useQuery({
		queryKey: ["most-viewed", limit],
		queryFn: async () => {
			const res = await api.get<{ items: Post[] }>(`/posts/most-viewed?limit=${limit}`);
			return res.data;
		},
		staleTime: 60_000,
	});
}

export function useCategories() {
	return useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const res = await api.get<Category[]>("/categories");
			return res.data;
		},
		staleTime: Infinity,
	});
}

export function useDeletePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/posts/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-posts"] });
			queryClient.invalidateQueries({ queryKey: ["public-posts"] });
		},
	});
}
