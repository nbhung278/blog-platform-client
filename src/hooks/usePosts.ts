import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Post } from "@/types";

export function useMyPosts() {
	return useQuery({
		queryKey: ["my-posts"],
		queryFn: async () => {
			const res = await api.get<Post[]>("/posts");
			return res.data;
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
	});
}

export function usePublicPosts(username: string) {
	return useQuery({
		queryKey: ["public-posts", username],
		queryFn: async () => {
			const res = await api.get<Post[]>(`/posts/public/${username}`);
			return res.data;
		},
		refetchInterval: 60_000,
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

export function useCreatePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			title: string;
			contentMd: string;
			contentHtml: string;
			status?: string;
			tags?: string[];
		}) => {
			const res = await api.post<Post>("/posts", data);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-posts"] });
		},
	});
}

export function useUpdatePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...data
		}: {
			id: string;
			version: number;
			[key: string]: unknown;
		}) => {
			const res = await api.patch<Post>(`/posts/${id}`, data);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-posts"] });
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

export function useDeletePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/posts/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-posts"] });
		},
	});
}
