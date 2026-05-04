import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";
import { uploadsApi } from "@/lib/uploadsApi";

interface UpdateProfileInput {
	name: string;
	bio: string;
	avatarFile?: File | null;
}

interface ChangePasswordInput {
	currentPassword: string;
	newPassword: string;
}

export function useUpdateProfile() {
	const setUser = useAuthStore((s) => s.setUser);
	const currentUser = useAuthStore((s) => s.user);

	return useMutation({
		mutationFn: async ({ name, bio, avatarFile }: UpdateProfileInput) => {
			let avatarUrl: string | null | undefined = undefined;

			if (avatarFile) {
				const { url } = await uploadsApi.uploadImage(avatarFile);
				avatarUrl = url;
			}

			const payload: Record<string, unknown> = { name, bio: bio || null };
			if (avatarUrl !== undefined) payload.avatarUrl = avatarUrl;

			const { data } = await api.patch<AuthUser>("/auth/me", payload);
			setUser(currentUser ? { ...currentUser, ...data } : data);
			return data;
		},
	});
}

export function useChangePassword() {
	return useMutation({
		mutationFn: async ({ currentPassword, newPassword }: ChangePasswordInput) => {
			await api.post("/auth/change-password", { currentPassword, newPassword });
		},
	});
}
