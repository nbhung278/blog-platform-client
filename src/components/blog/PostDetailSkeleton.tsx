import { Skeleton } from "@/components/ui/Skeleton";

export default function PostDetailSkeleton() {
	return (
		<div role="status" aria-label="Loading article">
			{/* Cover image — full width like real page */}
			<div className="mx-auto max-w-7xl px-5 pt-10 md:px-6">
				<Skeleton className="aspect-video w-full rounded md:aspect-21/9" />
			</div>

			{/* Content + Sidebar — same grid as real layout */}
			<div className="mx-auto max-w-7xl px-5 py-12 md:px-6">
				<div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,720px)_300px] lg:justify-between">
					{/* Article column */}
					<article className="flex min-h-[60vh] w-full min-w-0 flex-col">
						{/* Tags */}
						<div className="mb-6 flex flex-wrap gap-2">
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-6 w-20 rounded-full" />
							<Skeleton className="h-6 w-14 rounded-full" />
						</div>

						{/* Title */}
						<Skeleton className="h-10 w-11/12 rounded md:h-14" />
						<Skeleton className="mt-3 h-10 w-3/4 rounded md:h-14" />

						{/* Author meta */}
						<div className="mt-6 flex items-center gap-3">
							<Skeleton className="h-12 w-12 shrink-0 rounded-full" />
							<div className="flex flex-1 flex-col gap-2">
								<Skeleton className="h-4 w-40 rounded" />
								<Skeleton className="h-3 w-28 rounded" />
							</div>
							<Skeleton className="h-9 w-20 rounded-full" />
						</div>

						{/* Body paragraphs */}
						<div className="mt-12 space-y-3">
							<Skeleton className="h-4 w-full rounded" />
							<Skeleton className="h-4 w-11/12 rounded" />
							<Skeleton className="h-4 w-full rounded" />
							<Skeleton className="h-4 w-5/6 rounded" />
							<Skeleton className="h-4 w-4/6 rounded" />
						</div>

						<div className="mt-8 space-y-3">
							<Skeleton className="h-4 w-full rounded" />
							<Skeleton className="h-4 w-10/12 rounded" />
							<Skeleton className="h-4 w-full rounded" />
							<Skeleton className="h-4 w-3/4 rounded" />
						</div>

						<div className="mt-8 space-y-3">
							<Skeleton className="h-4 w-11/12 rounded" />
							<Skeleton className="h-4 w-full rounded" />
							<Skeleton className="h-4 w-2/3 rounded" />
						</div>
					</article>

					{/* Sidebar column */}
					<aside className="hidden flex-col gap-10 lg:flex">
						<div>
							<Skeleton className="mb-4 h-3 w-24 rounded" />
							<div className="flex flex-col gap-5">
								{Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex gap-3">
										<Skeleton className="h-16 w-20 shrink-0 rounded" />
										<div className="flex flex-1 flex-col gap-2">
											<Skeleton className="h-4 w-full rounded" />
											<Skeleton className="h-4 w-3/4 rounded" />
											<Skeleton className="mt-1 h-3 w-20 rounded" />
										</div>
									</div>
								))}
							</div>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
}
