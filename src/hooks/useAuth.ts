import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, invalidateCsrfCache } from "@/api/client";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthResponse } from "@/types";

// Server returns either a finished session (AuthResponse with cookies set) or
// a step-up challenge that the client must complete via /verify-*-otp. The
// shapes are mutually exclusive on the wire, so we union them here and let
// the consumer narrow.
export type OtpChallenge = {
	requiresOtp: true;
	otpToken: string;
	email: string;
	devCode?: string;
};

export type LoginResult = AuthResponse | OtpChallenge;

export function isOtpChallenge(r: LoginResult): r is OtpChallenge {
	return (r as OtpChallenge).requiresOtp === true;
}

export function useLogin() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: { email: string; password: string }): Promise<LoginResult> => {
			const res = await api.post<LoginResult>("/auth/login", data);
			if (!isOtpChallenge(res.data)) {
				// Finished — cookies already set by the server. Mirror state.
				invalidateCsrfCache();
				useAuthStore.getState().setUser(res.data.user);
				qc.clear();
			}
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
		}): Promise<OtpChallenge> => {
			// /register always returns an OTP challenge now — successful account
			// creation only persists the row; cookies are issued by
			// /verify-signup-otp once the email is confirmed.
			const res = await api.post<OtpChallenge>("/auth/register", data);
			return res.data;
		},
	});
}

export function useVerifySignupOtp() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: { otpToken: string; code: string }) => {
			const res = await api.post<AuthResponse>("/auth/verify-signup-otp", data);
			invalidateCsrfCache();
			useAuthStore.getState().setUser(res.data.user);
			qc.clear();
			return res.data;
		},
	});
}

export function useVerifyLoginOtp() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (data: { otpToken: string; code: string; trustDevice: boolean }) => {
			const res = await api.post<AuthResponse>("/auth/verify-login-otp", data);
			invalidateCsrfCache();
			useAuthStore.getState().setUser(res.data.user);
			qc.clear();
			return res.data;
		},
	});
}

export function useResendOtp() {
	return useMutation({
		mutationFn: async (data: { otpToken: string; purpose: "signup" | "login" | "forgot" }) => {
			const res = await api.post<{ otpToken: string; email: string; devCode?: string }>(
				"/auth/resend-otp",
				data,
			);
			return res.data;
		},
	});
}

export function useForgotPassword() {
	return useMutation({
		mutationFn: async (data: { email: string }) => {
			const res = await api.post<{ ok: true; otpToken: string; devCode?: string }>(
				"/auth/forgot-password",
				data,
			);
			return res.data;
		},
	});
}

export function useResetPassword() {
	return useMutation({
		mutationFn: async (data: { otpToken: string; code: string; newPassword: string }) => {
			const res = await api.post<{ ok: true }>("/auth/reset-password", data);
			return res.data;
		},
	});
}

export function useSetPassword() {
	return useMutation({
		mutationFn: async (data: { newPassword: string }) => {
			const res = await api.post<{ ok: true }>("/auth/set-password", data);
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
