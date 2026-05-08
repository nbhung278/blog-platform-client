import { Skeleton } from "@/components/ui/Skeleton";

export default function ConversationItemSkeleton() {
	return (
		<div className="flex items-center gap-3 px-4 py-3">
			<Skeleton className="h-10 w-10 shrink-0 rounded-full" />
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<Skeleton className="h-4 w-24 rounded" />
					<Skeleton className="h-3 w-10 rounded" />
				</div>
				<Skeleton className="mt-2 h-3 w-3/4 rounded" />
			</div>
		</div>
	);
}
