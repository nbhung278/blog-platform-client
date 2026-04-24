import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthResponse } from "@/types";

export function useLogin() {
	return useMutation({
		mutationFn: async (data: { email: string; password: string }) => {
			const res = await api.post<AuthResponse>("/auth/login", data);
			console.log("[auth] Login success, setting token...");
			useAuthStore.getState().setAuth(res.data.token, res.data.user);
			console.log("[auth] Token set:", !!useAuthStore.getState().token);
			return res.data;
		},
	});
}

export function useRegister() {
	return useMutation({
		mutationFn: async (data: {
			email: string;
			password: string;
			name: string;
			username: string;
		}) => {
			const res = await api.post<AuthResponse>("/auth/register", data);
			useAuthStore.getState().setAuth(res.data.token, res.data.user);
			return res.data;
		},
	});
}
