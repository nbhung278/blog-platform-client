import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface FollowState {
	following: boolean;
	emailEnabled?: boolean;
	since?: string;
}

export interface FollowStats {
	followers: number;
	following: number;
}

export function useFollowState(username: string | undefined, enabled: boolean) {
	return useQuery({
		queryKey: ["follow-state", username],
		queryFn: async () => {
			const res = await api.get<FollowState>(`/follows/${username}/me`);
			return res.data;
		},
		enabled: enabled && !!username,
	});
}

export function useFollowStats(username: string | undefined) {
	return useQuery({
		queryKey: ["follow-stats", username],
		queryFn: async () => {
			const res = await api.get<FollowStats>(`/follows/${username}/stats`);
			return res.data;
		},
		enabled: !!username,
	});
}

export function useFollow(username: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const res = await api.post<FollowState>(`/follows/${username}`);
			return res.data;
		},
		onSuccess: (data) => {
			qc.setQueryData(["follow-state", username], data);
			qc.invalidateQueries({ queryKey: ["follow-stats", username] });
		},
	});
}

export function useUnfollow(username: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const res = await api.delete<FollowState>(`/follows/${username}`);
			return res.data;
		},
		onSuccess: (data) => {
			qc.setQueryData(["follow-state", username], data);
			qc.invalidateQueries({ queryKey: ["follow-stats", username] });
		},
	});
}

export function useUpdateFollow(username: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (emailEnabled: boolean) => {
			const res = await api.patch<FollowState>(`/follows/${username}`, { emailEnabled });
			return res.data;
		},
		onSuccess: (data) => {
			qc.setQueryData(["follow-state", username], data);
		},
	});
}
