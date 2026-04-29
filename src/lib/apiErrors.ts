// Shape of axios errors thrown by our typed `api` client. The body's `error`
// field can be either a plain string ({ error: "Forbidden" }) or a Zod-style
// validation object ({ error: { issues: [{ path, message }] } }).
export interface ApiError {
	response?: {
		status?: number;
		data?: { error?: unknown };
	};
}

interface ZodErrorBody {
	issues?: { path?: (string | number)[]; message?: string }[];
}

export function formatApiError(err: ApiError | unknown, fallback = "Save failed"): string {
	const e = (err as ApiError | null)?.response?.data?.error;
	if (typeof e === "string") return e;
	if (e && typeof e === "object" && "issues" in e) {
		const issues = (e as ZodErrorBody).issues;
		if (Array.isArray(issues) && issues.length > 0) {
			return issues
				.map((i) => `${(i.path ?? []).join(".") || "field"}: ${i.message ?? "invalid"}`)
				.join("; ");
		}
	}
	return fallback;
}
