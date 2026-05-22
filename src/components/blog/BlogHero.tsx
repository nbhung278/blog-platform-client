import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";

// Placeholder labels rendered while /api/categories is in flight. They give
// Chrome an immediate LCP candidate (oversized text exists in the DOM on
// first paint, not 4-5s later) and reserve the right layout dimensions.
const FALLBACK_CATEGORIES = ["Engineering", "Design", "Product", "Stories"];

// Hero block at the top of the home page. Layout mirrors claude.com/blog:
// a small "Blog" label + tagline + CTA on the left, then up to four
// category headlines on the right rendered as oversized serif links.
export default function BlogHero() {
	const { data: categories = [] } = useCategories();
	const topFour = categories.slice(0, 4);
	const user = useAuthStore((s) => s.user);

	// Hovering or keyboard-focusing any one category dims the others, same
	// focus-on-one behavior as the post carousel below.
	const [activeId, setActiveId] = useState<string | null>(null);

	return (
		<section className="bg-brand-cream border-b border-black/10">
			<div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-16 md:grid-cols-[1fr_2fr] md:gap-16 md:px-6 md:py-24">
				{/* Left column — small label + tagline + CTA. Kept narrow so the
				    eye lands on the categories first, the same hierarchy the
				    Claude blog uses. */}
				<div className="flex flex-col">
					<p className="text-base font-semibold text-black">Blog</p>
					<p className="mt-12 max-w-xs text-sm leading-relaxed text-black/70 md:mt-16">
						Stories and lessons from developers building real things — the craft behind the code.
					</p>
					<div className="mt-6">
						{/* Logged-in users go straight to the editor; visitors get
						    the register flow that will route them back here later. */}
						{user ? (
							<Link
								to="/editor/$postId"
								params={{ postId: "new" }}
								className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80"
							>
								Start writing
							</Link>
						) : (
							<Link
								to="/register"
								className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80"
							>
								Start writing
							</Link>
						)}
					</div>
				</div>

				{/* Right column — oversized serif category links. Each one
				    deep-links to /category/<slug>. We render a static fallback
				    list while the API request is in flight so:
				      - Chrome has an LCP candidate immediately (no 4-5s wait
				        for /api/categories before any large text exists)
				      - the box dimensions are stable when real categories
				        arrive, so there's no CLS
				    The fallback labels are intentionally generic — they get
				    replaced atomically by the real list. */}
				<div
					className="flex flex-col gap-2 md:gap-4"
					onMouseLeave={() => setActiveId(null)}
					onBlur={(e) => {
						// Clear the dim effect when focus leaves the whole group
						// (Tab past the last category). relatedTarget being inside
						// currentTarget means focus is just moving to a sibling.
						if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
							setActiveId(null);
						}
					}}
				>
					{topFour.length === 0
						? FALLBACK_CATEGORIES.map((label) => (
								<div
									key={label}
									aria-hidden
									className="inline-flex items-center gap-3 font-serif text-4xl leading-tight font-semibold text-black/30 md:text-6xl"
								>
									<span>{label}</span>
									<ArrowUpRight className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.5} aria-hidden />
								</div>
							))
						: topFour.map((cat) => {
								const dim = activeId !== null && activeId !== cat.id;
								const activate = () => setActiveId(cat.id);
								return (
									<Link
										key={cat.id}
										to="/category/$name"
										params={{ name: cat.slug }}
										onMouseEnter={activate}
										onFocus={activate}
										style={{
											opacity: dim ? 0.3 : 1,
											transition: "opacity 300ms ease, color 200ms ease",
										}}
										className="group inline-flex items-center gap-3 font-serif text-4xl leading-tight font-semibold text-black md:text-6xl"
									>
										<span className="capitalize">{cat.name}</span>
										{/* Arrow weight matches the headline so it reads as
										    part of the word, not a tacked-on icon. */}
										<ArrowUpRight
											className="h-8 w-8 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 md:h-10 md:w-10"
											strokeWidth={1.5}
											aria-hidden
										/>
									</Link>
								);
							})}
				</div>
			</div>
		</section>
	);
}
