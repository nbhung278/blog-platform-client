import { Skeleton } from "@/components/ui/Skeleton";

export default function SavedPostCardSkeleton() {
	return (
		<div className="border-brand-border dark:bg-brand-surface flex gap-5 overflow-hidden rounded-lg border bg-white p-5">
			<Skeleton className="h-32 w-48 shrink-0 rounded" />
			<div className="min-w-0 flex-1">
				<Skeleton className="h-5 w-3/4 rounded" />
				<Skeleton className="mt-3 h-4 w-full rounded" />
				<Skeleton className="mt-2 h-4 w-2/3 rounded" />
				<div className="mt-4 flex gap-3">
					<Skeleton className="h-3 w-20 rounded" />
					<Skeleton className="h-3 w-16 rounded" />
					<Skeleton className="h-3 w-24 rounded" />
				</div>
			</div>
		</div>
	);
}
