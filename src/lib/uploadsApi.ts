import { api } from "@/api/client";

export const uploadsApi = {
	uploadImage: async (file: File): Promise<{ url: string }> => {
		const form = new FormData();
		form.append("file", file);
		const { data } = await api.post<{ url: string }>("/uploads/image", form);
		return data;
	},
};
