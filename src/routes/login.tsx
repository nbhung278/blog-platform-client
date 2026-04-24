import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLogin } from "@/hooks/useAuth";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const login = useLogin();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login.mutateAsync({ email, password });
			navigate({ to: "/dashboard" });
		} catch {
			// error is handled by login.error state
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-md"
			>
				<h2 className="text-2xl font-bold">Login</h2>

				{login.error && <p className="text-sm text-red-500">Invalid credentials</p>}

				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full rounded border px-4 py-2"
					required
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full rounded border px-4 py-2"
					required
				/>
				<button
					type="submit"
					disabled={login.isPending}
					className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{login.isPending ? "Logging in..." : "Login"}
				</button>

				<p className="text-center text-sm text-gray-500">
					Don't have an account?{" "}
					<Link to="/register" className="text-blue-600 hover:underline">
						Register
					</Link>
				</p>
			</form>
		</div>
	);
}
