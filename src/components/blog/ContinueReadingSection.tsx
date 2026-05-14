import { Link } from "@tanstack/react-router";
import { BookOpen, X } from "lucide-react";
import {
	useContinueReading,
	useDismissReadingItem,
	type ContinueReadingItem,
} from "@/hooks/useReadingProgress";
import { useAuthStore } from "@/stores/auth.store";
import { safeImageUrl } from "@/lib/sanitize";

export default function ContinueReadingSection() {
	const user = useAuthStore((s) => s.user);
	const { data: items, isLoading } = useContinueReading(4, !!user);

	if (!user) return null;
	if (isLoading) return null;
	if (!items || items.length === 0) return null;

	return (
		<section className="mt-12 first:mt-0">
			<div className="border-brand-border mb-6 flex items-baseline justify-between border-b pb-3">
				<h2 className="text-brand-dark flex items-center gap-2 font-serif text-2xl font-bold">
					<BookOpen className="h-5 w-5" />
					Continue reading
				</h2>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{items.map((item) => (
					<ContinueReadingCard key={item.post.id} item={item} />
				))}
			</div>
		</section>
	);
}

function ContinueReadingCard({ item }: { item: ContinueReadingItem }) {
	const dismiss = useDismissReadingItem();
	const pct = Math.round(item.progress * 100);
	const cover = safeImageUrl(item.post.coverUrl);

	return (
		<div className="group border-brand-border bg-brand-cream relative flex flex-col overflow-hidden rounded-lg border transition-colors">
			<Link
				to="/blog/$username/$slug"
				params={{
					username: item.post.user.username,
					slug: item.post.slug,
				}}
				className="flex flex-1 flex-col"
			>
				{cover ? (
					<img src={cover} alt="" loading="lazy" className="aspect-video w-full object-cover" />
				) : (
					<div className="bg-brand-hero flex aspect-video w-full items-center justify-center">
						<span className="text-brand-border font-serif text-3xl font-bold">
							{item.post.title[0]?.toUpperCase()}
						</span>
					</div>
				)}
				<div className="flex flex-1 flex-col gap-2 p-3">
					<h3 className="text-brand-dark line-clamp-2 font-serif text-base font-semibold group-hover:underline">
						{item.post.title}
					</h3>
					<p className="text-brand-mid line-clamp-1 text-xs">By {item.post.user.name}</p>
					<div className="mt-auto">
						<div className="text-brand-mid mb-1 flex items-baseline justify-between text-[11px]">
							<span>{pct}% read</span>
							<span>{item.post.readingTime} min</span>
						</div>
						<div className="bg-brand-border/50 h-1 w-full overflow-hidden rounded-full">
							<div className="bg-brand-dark h-full rounded-full" style={{ width: `${pct}%` }} />
						</div>
					</div>
				</div>
			</Link>
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					dismiss.mutate(item.post.id);
				}}
				aria-label="Remove from continue reading"
				className="text-brand-mid hover:bg-brand-dark absolute top-2 right-2 rounded-full bg-white/80 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
			>
				<X className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}
