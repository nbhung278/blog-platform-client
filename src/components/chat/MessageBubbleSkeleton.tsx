import { Skeleton } from "@/components/ui/Skeleton";

export default function MessageBubbleSkeleton() {
	return (
		<div role="status" aria-label="Loading messages" className="flex flex-col gap-3 py-2">
			<div className="flex justify-start">
				<Skeleton className="h-9 w-48 rounded-2xl" />
			</div>
			<div className="flex justify-end">
				<Skeleton className="h-9 w-32 rounded-2xl" />
			</div>
			<div className="flex justify-start">
				<Skeleton className="h-9 w-56 rounded-2xl" />
			</div>
			<div className="flex justify-end">
				<Skeleton className="h-9 w-40 rounded-2xl" />
			</div>
			<div className="flex justify-start">
				<Skeleton className="h-9 w-44 rounded-2xl" />
			</div>
		</div>
	);
}
