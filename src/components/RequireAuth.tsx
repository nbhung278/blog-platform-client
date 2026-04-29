import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";

interface RequireAuthProps {
	children: ReactNode;
	fallback?: ReactNode;
}

export default function RequireAuth({ children, fallback }: RequireAuthProps) {
	const user = useAuthStore((s) => s.user);
	const initialized = useAuthStore((s) => s.initialized);
	const navigate = useNavigate();

	useEffect(() => {
		if (initialized && !user) {
			navigate({ to: "/login" });
		}
	}, [initialized, user, navigate]);

	if (!initialized) {
		return (
			fallback ?? (
				<div className="flex min-h-screen items-center justify-center text-gray-400">Loading…</div>
			)
		);
	}

	if (!user) return null;
	return <>{children}</>;
}
