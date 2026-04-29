import { useEffect, useRef, useState } from "react";
import { formatCount } from "@/lib/formatCount";

interface ClapButtonProps {
	count: number;
	myCount: number;
	max: number;
	onClap: () => void;
	disabled?: boolean;
	requireAuth?: () => boolean;
	size?: "sm" | "md";
}

interface FloatingDigit {
	id: number;
	value: number;
}

// Medium-style clap button: hold/click to add claps; each click triggers
// a brief scale + a small "+N" floating up. We keep a single floating digit
// element in flight at a time and just bump its value, so spamming clicks
// stays smooth (no DOM thrash with 50 spawned animations).
export default function ClapButton({
	count,
	myCount,
	max,
	onClap,
	disabled,
	requireAuth,
	size = "md",
}: ClapButtonProps) {
	const [floats, setFloats] = useState<FloatingDigit[]>([]);
	const idRef = useRef(0);
	const lastClickRef = useRef(0);

	// Cleanup floats after their animation finishes (matches CSS keyframe duration).
	useEffect(() => {
		if (floats.length === 0) return;
		const t = setTimeout(() => {
			setFloats((prev) => prev.slice(1));
		}, 800);
		return () => clearTimeout(t);
	}, [floats]);

	const atMax = myCount >= max;
	const isPending = disabled || atMax;

	const handleClick = () => {
		if (requireAuth && requireAuth()) return;
		if (isPending) return;

		onClap();

		// Coalesce floating "+N" while user clicks rapidly. If two clicks land
		// within 350ms we update the last float's value rather than stack a new
		// element — keeps the visual readable for fast clappers.
		const now = performance.now();
		const isBurst = now - lastClickRef.current < 350;
		lastClickRef.current = now;

		setFloats((prev) => {
			if (isBurst && prev.length > 0) {
				const last = prev[prev.length - 1];
				return [...prev.slice(0, -1), { ...last, value: last.value + 1 }];
			}
			idRef.current += 1;
			return [...prev, { id: idRef.current, value: 1 }];
		});
	};

	const buttonSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
	const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
	const textSize = size === "sm" ? "text-xs" : "text-sm";

	return (
		<div className="relative flex items-center gap-2">
			<button
				type="button"
				onClick={handleClick}
				disabled={isPending}
				aria-label={atMax ? "Max claps reached" : "Clap"}
				className={`group relative flex ${buttonSize} items-center justify-center rounded-full border transition-all ${
					myCount > 0
						? "border-brand-mid bg-brand-mid/10 text-brand-mid"
						: "hover:border-brand-mid hover:text-brand-mid border-gray-200 text-gray-500"
				} ${isPending && atMax ? "cursor-not-allowed opacity-60" : ""} ${
					!isPending ? "active:scale-90" : ""
				}`}
			>
				<ClapIcon className={`${iconSize} transition-transform group-active:scale-125`} />
				{floats.map((f) => (
					<span
						key={f.id}
						className="clap-float text-brand-mid pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-semibold"
					>
						+{f.value}
					</span>
				))}
			</button>
			<span className={`${textSize} font-medium text-gray-700 tabular-nums`}>
				{formatCount(count)}
			</span>
		</div>
	);
}

function ClapIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.8}
				d="M11.05 4.96a1.04 1.04 0 0 1 2.08 0v5.05M9.06 6.95a1.04 1.04 0 0 1 2.08 0v3.06M7.06 8.94a1.04 1.04 0 0 1 2.08 0v3.06M5.06 11.92a1.04 1.04 0 0 1 2.08 0v.99M14.95 10.01V6.95a1.04 1.04 0 0 1 2.08 0v6.92c0 3.42-2.08 5.5-5 5.5-2.5 0-3.93-1.42-5.42-2.91L4.65 14.5a1.04 1.04 0 0 1 1.47-1.47l1.72 1.72"
			/>
		</svg>
	);
}
