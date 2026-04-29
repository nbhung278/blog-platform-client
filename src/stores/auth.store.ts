import { create } from "zustand";
import { AxiosError } from "axios";
import { api, invalidateCsrfCache, registerOnAuthLost } from "@/api/client";
import type { User } from "@/types";

export type AuthUser = Pick<User, "id" | "email" | "name" | "username">;

interface AuthState {
	user: AuthUser | null;
	loading: boolean;
	initialized: boolean;
	setUser: (user: AuthUser | null) => void;
	logout: () => void;
	loadMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	loading: false,
	initialized: false,

	setUser: (user) => set({ user, initialized: true }),

	logout: () => {
		invalidateCsrfCache();
		set({ user: null, initialized: true });
	},

	async loadMe() {
		set({ loading: true });
		try {
			const { data } = await api.get<AuthUser>("/auth/me");
			set({ user: data, initialized: true });
		} catch (err) {
			const status = err instanceof AxiosError ? err.response?.status : undefined;
			if (status === 401) {
				set({ user: null, initialized: true });
			} else {
				set({ initialized: true });
			}
		} finally {
			set({ loading: false });
		}
	},
}));

registerOnAuthLost(() => {
	invalidateCsrfCache();
	useAuthStore.setState({ user: null, initialized: true });
});
