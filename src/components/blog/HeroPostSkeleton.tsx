import { Skeleton } from "@/components/ui/Skeleton";

export default function HeroPostSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading featured post"
			className="relative z-10 mx-auto -mt-20 max-w-7xl px-5 md:-mt-28 md:px-6"
		>
			<div className="bg-brand-surface border-brand-border grid grid-cols-1 overflow-hidden border shadow-lg md:grid-cols-2">
				<div className="flex flex-col justify-center p-6 md:p-14">
					<Skeleton className="h-8 w-11/12 rounded md:h-12" />
					<Skeleton className="mt-3 h-8 w-3/4 rounded md:h-12" />
					<Skeleton className="mt-6 h-4 w-full rounded" />
					<Skeleton className="mt-2 h-4 w-5/6 rounded" />
					<div className="mt-7 flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<Skeleton className="h-4 w-32 rounded" />
					</div>
				</div>
				<Skeleton className="h-64 w-full md:h-auto" />
			</div>
		</div>
	);
}
