import { Skeleton } from "@/components/ui/Skeleton";

export default function NotificationItemSkeleton() {
	return (
		<div className="flex w-full items-start gap-3 px-5 py-4">
			<Skeleton className="h-10 w-10 shrink-0 rounded-full" />
			<div className="min-w-0 flex-1">
				<Skeleton className="h-4 w-5/6 rounded" />
				<Skeleton className="mt-2 h-3 w-20 rounded" />
			</div>
		</div>
	);
}
