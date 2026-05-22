// Format Post.readingTime (minutes, integer from backend calcReadingTime) into
// a human label. Long-form pieces shouldn't show "120 min read" — past an hour
// we switch to rounded hours so the meta line stays scannable on small cards.
//
//   < 60 min  → "5 min read"
//   60-89 min → "1 hr read"  (don't promote to 2 hr until we're closer)
//   90+ min   → rounded to nearest hour ("2 hr read", "3 hr read")
//
// Returns null when the post has no real content (readingTime <= 0) so callers
// can omit the label entirely instead of showing "0 min read".
export function formatReadingTime(minutes: number): string | null {
	if (!Number.isFinite(minutes) || minutes <= 0) return null;
	if (minutes < 60) return `${minutes} min read`;
	const hours = Math.round(minutes / 60);
	return `${hours} hr read`;
}
