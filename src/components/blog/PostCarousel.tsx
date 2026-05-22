import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Post } from "@/types";
import { formatReadingTime } from "@/lib/formatReadingTime";

// Approx pixels each card consumes (w-80 = 320px + gap-6 = 24px). Used to
// compute marquee duration so the row scrolls at a constant speed regardless
// of how many posts are in the feed.
const CARD_FULL_WIDTH = 344;
// Pixels per second of marquee travel. Slow enough to read titles in passing.
const SPEED_PX_PER_SEC = 60;

function formatDate(iso: string | null | undefined): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

interface PostCarouselProps {
	posts: Post[];
}

// Right-to-left auto-scrolling carousel of post cards, modeled on the row
// under the Claude blog hero.
//
// Performance + accessibility notes:
// - Animation is pure transform → composited on the GPU, no main-thread cost.
// - IntersectionObserver pauses the animation while the carousel is out of
//   the viewport. Keeps idle CPU/battery low on mobile and avoids burning
//   frames Lighthouse counts against TBT.
// - prefers-reduced-motion users get a static, non-scrolling strip.
// - Pause + dim on hover/focus uses React state so keyboard users see the
//   same behavior as mouse users.
export default function PostCarousel({ posts }: PostCarouselProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [inView, setInView] = useState(true);
	const [reduceMotion, setReduceMotion] = useState(false);

	// Stable across renders — only recomputed when the post list changes,
	// not on every hover state flip.
	const doubled = useMemo(() => [...posts, ...posts], [posts]);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduceMotion(mq.matches);
		const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	useEffect(() => {
		const el = wrapperRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry) setInView(entry.isIntersecting);
			},
			// 0px margin + tiny threshold: pause the instant the strip leaves
			// the viewport, resume the instant any part of it is visible.
			{ threshold: 0 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	// Render a fixed-height placeholder when the feed is still loading so
	// the carousel reserves layout space immediately. Without this the
	// most-viewed section below jumps when posts arrive, which Lighthouse
	// flagged as the main CLS contributor on the home page. Placed AFTER
	// the hooks to satisfy the rules-of-hooks lint rule.
	if (posts.length === 0) {
		return (
			<div className="bg-brand-cream relative overflow-hidden border-b border-black/10 py-12">
				<div className="h-44" aria-hidden />
			</div>
		);
	}

	const isActive = activeId !== null;

	const oneSetWidth = posts.length * CARD_FULL_WIDTH;
	const durationSec = Math.max(30, Math.round(oneSetWidth / SPEED_PX_PER_SEC));

	// When reduce-motion is on, render the strip statically: drop w-max,
	// allow wrap, no animation, and don't bother with the dim/pause state
	// — the row is now a normal grid, not a marquee.
	const trackStyle: React.CSSProperties = reduceMotion
		? {}
		: {
				animation: `carousel-scroll ${durationSec}s linear infinite`,
				animationPlayState: isActive || !inView ? "paused" : "running",
			};

	return (
		<div
			ref={wrapperRef}
			className="bg-brand-cream relative overflow-hidden border-b border-black/10 py-12"
			onMouseLeave={() => setActiveId(null)}
		>
			<div
				className={
					reduceMotion
						? "mx-auto flex max-w-7xl flex-wrap justify-center gap-6 px-5 md:px-6"
						: "flex w-max gap-6 will-change-transform"
				}
				style={trackStyle}
			>
				{doubled.map((post, i) => (
					<CarouselCard
						key={`${post.id}-${i}`}
						post={post}
						dim={!reduceMotion && isActive && activeId !== post.id}
						onActivate={reduceMotion ? undefined : () => setActiveId(post.id)}
					/>
				))}
			</div>
		</div>
	);
}

interface CardProps {
	post: Post;
	dim: boolean;
	// Undefined when reduce-motion is on — saves attaching no-op handlers
	// to every card.
	onActivate?: () => void;
}

function CarouselCard({ post, dim, onActivate }: CardProps) {
	const reading = formatReadingTime(post.readingTime);
	return (
		<Link
			to="/blog/$username/$slug"
			params={{ username: post.user?.username ?? "", slug: post.slug }}
			onMouseEnter={onActivate}
			onFocus={onActivate}
			style={{
				opacity: dim ? 0.35 : 1,
				transition: "opacity 300ms ease, border-color 200ms ease",
			}}
			className="flex h-44 w-80 shrink-0 flex-col justify-between rounded-lg border border-black/10 bg-white p-5 hover:border-black/30 focus-visible:border-black/40"
		>
			<h3 className="line-clamp-3 font-serif text-lg leading-snug font-semibold text-black">
				{post.title}
			</h3>
			{/* text-black/70 keeps WCAG AA contrast (~9:1) on the white card;
			    text-black/50 was ~3:1 and failed accessibility audits. */}
			<p className="text-xs text-black/70">
				{formatDate(post.publishedAt ?? post.createdAt)}
				{reading && (
					<>
						<span aria-hidden> · </span>
						<span>{reading}</span>
					</>
				)}
			</p>
		</Link>
	);
}
