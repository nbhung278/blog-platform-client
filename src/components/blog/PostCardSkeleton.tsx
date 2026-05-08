import { Skeleton } from "@/components/ui/Skeleton";

export default function PostCardSkeleton() {
	return (
		<div className="border-brand-border bg-brand-surface flex flex-col overflow-hidden border">
			<Skeleton className="aspect-video w-full" />
			<div className="flex flex-1 flex-col p-5 md:p-6">
				<Skeleton className="h-6 w-5/6 rounded" />
				<Skeleton className="mt-3 h-4 w-full rounded" />
				<Skeleton className="mt-2 h-4 w-2/3 rounded" />
				<div className="mt-auto flex items-center gap-3 pt-4 md:pt-5">
					<Skeleton className="h-8 w-8 rounded-full" />
					<Skeleton className="h-4 w-24 rounded" />
				</div>
			</div>
		</div>
	);
}
