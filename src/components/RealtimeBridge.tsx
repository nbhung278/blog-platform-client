import { useRealtime } from "@/hooks/useRealtime";

// Wrapper component so `useRealtime` can be lazy-loaded by App.tsx.
// Mounting only happens after a user is authenticated, so the WebSocket
// connection logic stays out of the first-paint bundle for visitors.
export default function RealtimeBridge() {
	useRealtime();
	return null;
}
