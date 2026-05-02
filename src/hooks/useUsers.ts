import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { UserSearchResult } from "@/types";

export function useSearchUsers(q: string) {
	return useQuery({
		queryKey: ["users", "search", q],
		queryFn: async () => {
			const res = await api.get<UserSearchResult[]>(
				`/conversations/users/search?q=${encodeURIComponent(q)}`,
			);
			return res.data;
		},
		enabled: q.trim().length > 0,
	});
}
