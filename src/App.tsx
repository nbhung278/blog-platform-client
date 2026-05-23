import { Suspense, lazy, useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import Notify from "@/components/Notify";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";

// Realtime hook is only useful for logged-in users; mount it lazily so its
// WebSocket + react-query plumbing isn't part of the first-load critical path
// for unauthenticated visitors (the most common landing case).
const RealtimeBridge = lazy(() => import("@/components/RealtimeBridge"));

export default function App() {
	const loadMe = useAuthStore((s) => s.loadMe);
	const userId = useAuthStore((s) => s.user?.id);
	const theme = useThemeStore((s) => s.theme);

	useEffect(() => {
		loadMe();
	}, [loadMe]);

	useEffect(() => {
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [theme]);

	return (
		<div className="bg-brand-cream min-h-screen">
			<ErrorBoundary>
				{/*
					<main> landmark for screen readers. Route components render their
					own <SiteHeader> (a <header>) inside this <main>, which the HTML
					spec permits — `header` outside a section/article is a banner role,
					but inside a `main` it's just a section header. The skip-link and
					ARIA "skip to main" patterns rely on this landmark being present,
					which Lighthouse flags when missing.
				*/}
				<main>
					<Suspense
						fallback={
							<div className="flex min-h-screen items-center justify-center text-gray-400">
								Loading…
							</div>
						}
					>
						<Outlet />
					</Suspense>
				</main>
				{userId && (
					<Suspense fallback={null}>
						<RealtimeBridge />
					</Suspense>
				)}
				<Notify />
			</ErrorBoundary>
		</div>
	);
}
