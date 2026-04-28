import { Suspense } from "react";
import { Outlet } from "@tanstack/react-router";

export default function App() {
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
		</div>
	);
}
