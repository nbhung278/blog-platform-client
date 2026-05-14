// Inline SVG wordmark for the site header. Hand-drawn brush feel modelled on
// the Gemini-generated brand image, but vectorized so it scales sharply at any
// header height and pulls its color from `currentColor` (so the same component
// can drop into a dark hero, a light header, or a footer without re-export).
//
// viewBox is wider than tall (200×80) so we can sit on a single text baseline
// alongside the "Code as Craft" tagline without forcing the parent to give us
// a square slot.

type Props = {
	className?: string;
	title?: string;
};

export function StrixLogo({ className, title = "Strix" }: Props) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 200 80"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-label={title}
			className={className}
		>
			<title>{title}</title>
			{/* Letterforms are drawn as filled paths (not strokes) so the chunky
			    hand-painted weight survives at small sizes. Each glyph is a
			    closed polygon with subtle wobble to mimic a brush stroke. */}
			<g fill="currentColor" stroke="none">
				{/* S */}
				<path d="M14 22 C 14 17, 19 14, 26 14 C 31 14, 35 16, 36 18 L 33 22 C 31 20, 28 19, 26 19 C 22 19, 20 21, 20 23 C 20 25, 22 26, 27 28 C 34 30, 38 33, 38 39 C 38 45, 33 49, 25 49 C 19 49, 14 47, 12 44 L 16 40 C 18 42, 22 44, 25 44 C 30 44, 33 42, 33 39 C 33 36, 30 35, 25 33 C 18 31, 14 28, 14 22 Z" />
				{/* T */}
				<path d="M42 14 L 70 14 L 70 19 L 59 19 L 59 49 L 53 49 L 53 19 L 42 19 Z" />
				{/* R */}
				<path d="M76 14 L 92 14 C 99 14, 103 18, 103 24 C 103 28, 100 31, 96 33 L 105 49 L 99 49 L 91 34 L 82 34 L 82 49 L 76 49 Z M 82 19 L 82 29 L 91 29 C 95 29, 97 27, 97 24 C 97 21, 95 19, 91 19 Z" />
				{/* I */}
				<path d="M110 14 L 116 14 L 116 49 L 110 49 Z" />
				{/* X */}
				<path d="M122 14 L 129 14 L 137 26 L 145 14 L 152 14 L 141 31 L 153 49 L 146 49 L 137 36 L 128 49 L 121 49 L 133 31 Z" />
			</g>

			{/* The signature underline — a single brushy curve sweeping under
			    the wordmark. Stroke (not fill) so it picks up currentColor cleanly. */}
			<path d="M 10 62 C 50 58, 110 60, 165 58" strokeWidth="3.5" />
		</svg>
	);
}
