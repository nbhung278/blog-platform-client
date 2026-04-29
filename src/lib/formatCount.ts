// Compact display for large counts: 999 → "999", 1500 → "1.5K", 1_500_000 → "1.5M".
// Used by clap counts, comment counts, etc. Lives outside ClapButton.tsx so
// shared imports don't break Vite's fast-refresh boundary.
export function formatCount(n: number): string {
	if (n < 1000) return String(n);
	if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
	if (n < 1_000_000) return `${Math.floor(n / 1000)}K`;
	return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}
