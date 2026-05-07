import { useCallback } from "react";

/**
 * Returns a `changePage(next)` callback that calls `applyPage(next)` then
 * smooth-scrolls the window to the top — the same paginate-and-jump behavior
 * we want everywhere paginated lists appear (search results, category browse, …).
 *
 * The caller owns the navigate wiring because TanStack Router's `navigate` is
 * typed against the specific route it was instantiated from, and a generic
 * hook can't pass a search reducer through without losing that route-specific
 * search-shape narrowing. Callers stay one line: pass a closure that does the
 * route-specific navigate({ search: … }) and the hook handles the rest.
 */
export function usePaginationNav(applyPage: (next: number) => void) {
	return useCallback(
		(next: number) => {
			applyPage(next);
			window.scrollTo({ top: 0, behavior: "smooth" });
		},
		[applyPage],
	);
}
