import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useRegister } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import AuthLayout from "@/components/layout/AuthLayout";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/password-rules";
import { formatApiError } from "@/lib/apiErrors";

export default function RegisterPage() {
	const [form, setForm] = useState({
		email: "",
		password: "",
		name: "",
		username: "",
	});
	const [showRules, setShowRules] = useState(false);
	const register = useRegister();
	const navigate = useNavigate();
	const user = useAuthStore((s) => s.user);

	useEffect(() => {
		if (user) navigate({ to: "/" });
	}, [user, navigate]);

	const passwordOk = isPasswordValid(form.password);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!passwordOk) {
			setShowRules(true);
			return;
		}
		try {
			await register.mutateAsync(form);
			navigate({ to: "/" });
		} catch {
			// error is handled by register.error state
		}
	};

	const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((prev) => ({ ...prev, [field]: e.target.value }));

	const inputClass =
		"w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-mid outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

	return (
		<AuthLayout
			title="Welcome"
			subtitle="Let's create your new account"
			footer={
				<p>
					Already have an account?{" "}
					<Link to="/login" className="text-brand-dark font-medium underline">
						Sign In
					</Link>
				</p>
			}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				{register.error && (
					<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
						{formatApiError(register.error, "Registration failed")}
					</p>
				)}

				<input
					type="text"
					placeholder="Full name"
					value={form.name}
					onChange={update("name")}
					className={inputClass}
					autoComplete="name"
					required
				/>
				<input
					type="text"
					placeholder="Username (a-z, 0-9, -)"
					value={form.username}
					onChange={update("username")}
					className={inputClass}
					autoComplete="username"
					pattern="^[a-z0-9-]+$"
					minLength={3}
					maxLength={30}
					required
				/>
				<input
					type="email"
					placeholder="Email"
					value={form.email}
					onChange={update("email")}
					className={inputClass}
					autoComplete="email"
					required
				/>
				<input
					type="password"
					placeholder="Password"
					value={form.password}
					onChange={update("password")}
					onFocus={() => setShowRules(true)}
					className={inputClass}
					autoComplete="new-password"
					minLength={12}
					required
				/>
				{showRules && (
					<ul className="space-y-1 text-xs">
						{PASSWORD_RULES.map((rule) => {
							const ok = rule.test(form.password);
							return (
								<li key={rule.label} className={ok ? "text-green-600" : "text-brand-mid"}>
									{ok ? "✓" : "○"} {rule.label}
								</li>
							);
						})}
					</ul>
				)}
				<button
					type="submit"
					disabled={register.isPending || !passwordOk}
					className="bg-brand-dark hover:bg-brand-mid w-full rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
				>
					{register.isPending ? "Creating account..." : "Sign Up"}
				</button>
			</form>
		</AuthLayout>
	);
}
