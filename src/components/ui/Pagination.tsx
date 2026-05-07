import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

function getPageList(current: number, total: number): (number | "…")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

	const pages: (number | "…")[] = [1];
	const start = Math.max(2, current - 1);
	const end = Math.min(total - 1, current + 1);

	if (start > 2) pages.push("…");
	for (let i = start; i <= end; i++) pages.push(i);
	if (end < total - 1) pages.push("…");
	pages.push(total);

	return pages;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
	if (totalPages <= 1) return null;

	const pages = getPageList(page, totalPages);

	return (
		<nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
			<button
				onClick={() => onPageChange(page - 1)}
				disabled={page <= 1}
				aria-label="Previous page"
				className="border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>

			{pages.map((p, i) =>
				p === "…" ? (
					<span key={`gap-${i}`} className="text-brand-mid px-2 text-sm">
						…
					</span>
				) : (
					<button
						key={p}
						onClick={() => onPageChange(p)}
						aria-current={p === page ? "page" : undefined}
						className={
							p === page
								? "bg-brand-dark flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium text-white"
								: "border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm transition-colors"
						}
					>
						{p}
					</button>
				),
			)}

			<button
				onClick={() => onPageChange(page + 1)}
				disabled={page >= totalPages}
				aria-label="Next page"
				className="border-brand-border text-brand-mid hover:bg-brand-hero hover:text-brand-dark flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
			>
				<ChevronRight className="h-4 w-4" />
			</button>
		</nav>
	);
}
