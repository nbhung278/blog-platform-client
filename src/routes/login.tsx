import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import AuthLayout from "@/components/layout/AuthLayout";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const login = useLogin();
	const navigate = useNavigate();
	const user = useAuthStore((s) => s.user);

	useEffect(() => {
		if (user) navigate({ to: "/" });
	}, [user, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login.mutateAsync({ email, password });
			navigate({ to: "/" });
		} catch {
			// error is handled by login.error state
		}
	};

	return (
		<AuthLayout
			title="Welcome back"
			subtitle="Sign in to continue your story"
			footer={
				<p>
					Don&apos;t have an account?{" "}
					<Link to="/register" className="text-brand-dark font-medium underline">
						Sign Up
					</Link>
				</p>
			}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				{login.error && (
					<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Invalid credentials</p>
				)}

				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="border-brand-border text-brand-dark placeholder:text-brand-mid focus:border-brand focus:ring-brand/20 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
					autoComplete="email"
					required
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="border-brand-border text-brand-dark placeholder:text-brand-mid focus:border-brand focus:ring-brand/20 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
					autoComplete="current-password"
					required
				/>
				<button
					type="submit"
					disabled={login.isPending}
					className="bg-brand-dark hover:bg-brand-mid w-full rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
				>
					{login.isPending ? "Signing in..." : "Login"}
				</button>
			</form>
		</AuthLayout>
	);
}
