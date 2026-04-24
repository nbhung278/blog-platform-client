import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useRegister } from "@/hooks/useAuth";

export default function RegisterPage() {
	const [form, setForm] = useState({
		email: "",
		password: "",
		name: "",
		username: "",
	});
	const register = useRegister();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await register.mutateAsync(form);
			navigate({ to: "/dashboard" });
		} catch {
			// error is handled by register.error state
		}
	};

	const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((prev) => ({ ...prev, [field]: e.target.value }));

	return (
		<div className="flex min-h-screen items-center justify-center">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-md"
			>
				<h2 className="text-2xl font-bold">Register</h2>

				{register.error && <p className="text-sm text-red-500">Registration failed</p>}

				<input
					type="text"
					placeholder="Full name"
					value={form.name}
					onChange={update("name")}
					className="w-full rounded border px-4 py-2"
					required
				/>
				<input
					type="text"
					placeholder="Username (a-z, 0-9, -)"
					value={form.username}
					onChange={update("username")}
					className="w-full rounded border px-4 py-2"
					required
					pattern="^[a-z0-9-]+$"
				/>
				<input
					type="email"
					placeholder="Email"
					value={form.email}
					onChange={update("email")}
					className="w-full rounded border px-4 py-2"
					required
				/>
				<input
					type="password"
					placeholder="Password (min 8 chars)"
					value={form.password}
					onChange={update("password")}
					className="w-full rounded border px-4 py-2"
					required
					minLength={8}
				/>
				<button
					type="submit"
					disabled={register.isPending}
					className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{register.isPending ? "Creating account..." : "Register"}
				</button>

				<p className="text-center text-sm text-gray-500">
					Already have an account?{" "}
					<Link to="/login" className="text-blue-600 hover:underline">
						Login
					</Link>
				</p>
			</form>
		</div>
	);
}
