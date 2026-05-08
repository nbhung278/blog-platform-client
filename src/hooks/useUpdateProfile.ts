import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";
import { uploadsApi } from "@/lib/uploadsApi";

async function compressAvatar(file: File, maxPx = 800, quality = 0.85): Promise<File> {
	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.onload = () => {
			URL.revokeObjectURL(url);
			const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(img.width * scale);
			canvas.height = Math.round(img.height * scale);
			canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
			canvas.toBlob(
				(blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
				"image/jpeg",
				quality,
			);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(file);
		};
		img.src = url;
	});
}

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
				const compressed = await compressAvatar(avatarFile);
				const { url } = await uploadsApi.uploadImage(compressed);
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
