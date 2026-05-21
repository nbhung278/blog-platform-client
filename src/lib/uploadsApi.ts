import { api } from "@/api/client";

export const uploadsApi = {
	uploadImage: async (file: File): Promise<{ url: string; thumbnailUrl: string | null }> => {
		const form = new FormData();
		form.append("file", file);
		const { data } = await api.post<{ url: string; thumbnailUrl: string | null }>(
			"/uploads/image",
			form,
		);
		return data;
	},
	uploadFromUrl: async (url: string): Promise<{ url: string; thumbnailUrl: string | null }> => {
		const { data } = await api.post<{ url: string; thumbnailUrl: string | null }>(
			"/uploads/from-url",
			{ url },
		);
		return data;
	},
};
