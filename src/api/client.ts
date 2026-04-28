import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
	baseURL: API_URL,
	headers: { "Content-Type": "application/json" },
	timeout: 30_000,
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Handle 401 responses (don't logout on auth endpoints)
api.interceptors.response.use(
	(response) => response,
	(error) => {
		const isAuthEndpoint = error.config?.url?.includes("/auth/");
		if (error.response?.status === 401 && !isAuthEndpoint) {
			useAuthStore.getState().logout();
		}
		return Promise.reject(error);
	},
);

/**
 * SSE streaming helper for AI chat.
 * Yields tokens as they arrive.
 */
export async function* streamChat(
	message: string,
	sessionId?: string,
): AsyncGenerator<{ type: "token" | "session_id"; data: string }> {
	const token = useAuthStore.getState().token;

	const response = await fetch(`${API_URL}/ai/chat`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ message, sessionId }),
	});

	if (!response.ok) {
		throw new Error(`Chat request failed: ${response.status}`);
	}

	const reader = response.body?.getReader();
	if (!reader) throw new Error("No response body");

	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (let i = 0; i < lines.length; i++) {
			if (lines[i].startsWith("event: ")) {
				const event = lines[i].slice(7).trim();
				const nextLine = lines[i + 1];
				if (nextLine?.startsWith("data: ")) {
					const data = nextLine.slice(6);
					yield { type: event as "token" | "session_id", data };
				}
			}
		}
	}
}
