import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";

// Landing page after a successful Google OAuth callback. The backend has
// already set the auth cookies and redirected here; our job is to refresh
// the in-memory user state, then bounce to the home page.
//
// Why not redirect straight to "/" from the backend: the SPA's auth store
// hydrates on mount via loadMe(). If we land on "/" first, the page renders
// in the logged-out state briefly before the store catches up. A dedicated
// transition page gives loadMe() a moment to complete without showing
// stale UI.
export default function GoogleSuccessPage() {
	const navigate = useNavigate();
	const loadMe = useAuthStore((s) => s.loadMe);
	const user = useAuthStore((s) => s.user);
	const initialized = useAuthStore((s) => s.initialized);

	useEffect(() => {
		void loadMe();
	}, [loadMe]);

	useEffect(() => {
		if (!initialized) return;
		// loadMe finished — go home whether or not it surfaced a user. If the
		// cookies didn't make it (rare: cross-site cookie blocked), bounce to
		// login with an error param so the user knows.
		if (user) {
			navigate({ to: "/" });
		} else {
			navigate({ to: "/login", search: { error: "session_lost" } as never });
		}
	}, [initialized, user, navigate]);

	return (
		<div className="bg-brand-hero flex min-h-screen items-center justify-center">
			<div className="text-brand-mid text-sm">Signing you in…</div>
		</div>
	);
}
