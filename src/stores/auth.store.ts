import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
	token: string | null;
	user: Pick<User, "id" | "email" | "name" | "username"> | null;
	setAuth: (token: string, user: AuthState["user"]) => void;
	logout: () => void;
	isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			user: null,
			setAuth: (token, user) => set({ token, user }),
			logout: () => set({ token: null, user: null }),
			isAuthenticated: () => !!get().token,
		}),
		{ name: "auth-storage" },
	),
);
