import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, invalidateCsrfCache } from "@/api/client";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthResponse } from "@/types";

export function useLogin() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: { email: string; password: string }) => {
			const res = await api.post<AuthResponse>("/auth/login", data);
			invalidateCsrfCache();
			useAuthStore.getState().setUser(res.data.user);
			qc.clear();
			return res.data;
		},
	});
}

export function useRegister() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			email: string;
			password: string;
			name: string;
			username: string;
		}) => {
			const res = await api.post<AuthResponse>("/auth/register", data);
			invalidateCsrfCache();
			useAuthStore.getState().setUser(res.data.user);
			qc.clear();
			return res.data;
		},
	});
}

export function useLogout() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			try {
				await api.post("/auth/logout");
			} finally {
				useAuthStore.getState().logout();
				qc.clear();
			}
		},
	});
}
