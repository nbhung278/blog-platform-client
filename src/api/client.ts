import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.store";
import { APP_HEADER, APP_KIND_WEB, CSRF_COOKIE_NAME, CSRF_HEADER } from "@/lib/authConstants";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);

let csrfCache: string | null = null;

function readCookie(name: string): string | null {
	const row = document.cookie.split("; ").find((r) => r.startsWith(`${name}=`));
	return row ? decodeURIComponent(row.slice(name.length + 1)) : null;
}

function getCsrf(): string | null {
	if (csrfCache) return csrfCache;
	csrfCache = readCookie(CSRF_COOKIE_NAME);
	return csrfCache;
}

export function invalidateCsrfCache() {
	csrfCache = null;
}

export const api = axios.create({
	baseURL: API_URL,
	headers: { "Content-Type": "application/json", [APP_HEADER]: APP_KIND_WEB },
	timeout: 30_000,
	withCredentials: true,
});

api.interceptors.request.use((config) => {
	config.headers[APP_HEADER] = APP_KIND_WEB;
	if (UNSAFE_METHODS.has(config.method?.toLowerCase() ?? "")) {
		const csrf = getCsrf();
		if (csrf) {
			config.headers[CSRF_HEADER] = csrf;
		}
	}
	return config;
});

let refreshing: Promise<boolean> | null = null;
let onAuthLost: (() => void) | null = null;

export function registerOnAuthLost(cb: () => void) {
	onAuthLost = cb;
}

async function performRefresh(): Promise<boolean> {
	try {
		await axios.post(
			`${API_URL}/auth/refresh`,
			{},
			{ withCredentials: true, headers: { [APP_HEADER]: APP_KIND_WEB } },
		);
		invalidateCsrfCache();
		return true;
	} catch {
		return false;
	}
}

const NO_RETRY_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

function pathOf(url: string): string {
	if (url.startsWith("http")) {
		try {
			return new URL(url).pathname.replace(/^\/api/, "");
		} catch {
			return url;
		}
	}
	return url;
}

function isNoRetryPath(url: string | undefined): boolean {
	if (!url) return false;
	const p = pathOf(url);
	return NO_RETRY_PATHS.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

api.interceptors.response.use(
	(response) => response,
	async (err: AxiosError) => {
		const original = err.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
		const status = err.response?.status;

		if (status === 403 && err.response?.data) {
			const data = err.response.data as { error?: string };
			if (data.error?.toLowerCase().includes("csrf")) {
				invalidateCsrfCache();
			}
		}

		if (status === 401 && original && !original._retried && !isNoRetryPath(original.url)) {
			original._retried = true;
			refreshing ??= performRefresh().finally(() => {
				refreshing = null;
			});
			const ok = await refreshing;
			if (ok) {
				return api.request(original);
			}
			useAuthStore.getState().logout();
			onAuthLost?.();
		}

		return Promise.reject(err);
	},
);

export async function* streamChat(
	message: string,
	sessionId?: string,
): AsyncGenerator<{ type: "token" | "session_id"; data: string }> {
	const csrf = getCsrf();
	const response = await fetch(`${API_URL}/ai/chat`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			[APP_HEADER]: APP_KIND_WEB,
			...(csrf ? { [CSRF_HEADER]: csrf } : {}),
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
