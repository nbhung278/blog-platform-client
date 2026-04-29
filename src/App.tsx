import { Suspense, useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import Notify from "@/components/Notify";
import { useAuthStore } from "@/stores/auth.store";
import { useRealtime } from "@/hooks/useRealtime";

export default function App() {
	const loadMe = useAuthStore((s) => s.loadMe);
	useRealtime();

	useEffect(() => {
		loadMe();
	}, [loadMe]);

	return (
		<div className="min-h-screen bg-gray-50">
			<Suspense
				fallback={
					<div className="flex min-h-screen items-center justify-center text-gray-400">
						Loading…
					</div>
				}
			>
				<Outlet />
			</Suspense>
			<Notify />
		</div>
	);
}
