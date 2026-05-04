import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Category, Post, PostInput, PostsPage } from "@/types";

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
		refetchInterval: 60_000,
		refetchIntervalInBackground: false,
	});
}

export function usePublicPosts(username: string) {
	return useQuery({
		queryKey: ["public-posts", username],
		queryFn: async () => {
			const res = await api.get<Post[]>(`/posts/public/${username}`);
			return res.data;
		},
		// Match staleTime to the poll cadence: navigating back to a recently
		// viewed profile reuses the cache for up to 30s, then the interval
		// keeps it fresh while the page is in the foreground.
		staleTime: 30_000,
		refetchOnWindowFocus: true,
		refetchInterval: 30_000,
		refetchIntervalInBackground: false,
	});
}

export function usePost(slug: string) {
	return useQuery({
		queryKey: ["post", slug],
		queryFn: async () => {
			const res = await api.get<Post>(`/posts/${slug}`);
			return res.data;
		},
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

export function useSearchPosts(q: string) {
	return useQuery({
		queryKey: ["search", q],
		queryFn: async () => {
			const res = await api.get<{ items: Post[]; total: number }>(
				`/posts/search?q=${encodeURIComponent(q)}`,
			);
			return res.data;
		},
		enabled: !!q.trim(),
	});
}

export function usePostsByCategory(slug: string) {
	return useQuery({
		queryKey: ["posts-by-category", slug],
		queryFn: async () => {
			const res = await api.get<{ items: Post[]; total: number }>(
				`/posts/search?category=${encodeURIComponent(slug)}`,
			);
			return res.data;
		},
		enabled: !!slug.trim(),
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
