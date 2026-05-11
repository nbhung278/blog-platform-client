import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useRegister, useVerifySignupOtp, useResendOtp } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import AuthLayout from "@/components/layout/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import GoogleButton from "@/components/auth/GoogleButton";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/password-rules";
import { formatApiError } from "@/lib/apiErrors";

type Step = { kind: "form" } | { kind: "otp"; otpToken: string; email: string; devCode?: string };

export default function RegisterPage() {
	const [form, setForm] = useState({ email: "", password: "", name: "", username: "" });
	const [showRules, setShowRules] = useState(false);
	const [step, setStep] = useState<Step>({ kind: "form" });
	const [code, setCode] = useState("");
	const [resentToast, setResentToast] = useState(false);
	const register = useRegister();
	const verify = useVerifySignupOtp();
	const resend = useResendOtp();
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
			const res = await register.mutateAsync(form);
			setStep({ kind: "otp", otpToken: res.otpToken, email: res.email, devCode: res.devCode });
			setCode("");
		} catch {
			// surfaced via register.error
		}
	};

	const handleVerify = async () => {
		if (step.kind !== "otp" || code.length !== 6) return;
		if (verify.isPending) return; // belt-and-braces: avoid overlapping submits
		try {
			await verify.mutateAsync({ otpToken: step.otpToken, code });
			navigate({ to: "/" });
		} catch {
			// surfaced via verify.error
		}
	};

	const handleResend = async () => {
		if (step.kind !== "otp") return;
		try {
			const res = await resend.mutateAsync({ otpToken: step.otpToken, purpose: "signup" });
			setStep({ kind: "otp", otpToken: res.otpToken, email: res.email, devCode: res.devCode });
			setCode("");
			setResentToast(true);
			setTimeout(() => setResentToast(false), 3000);
		} catch {
			// surfaced via resend.error
		}
	};

	const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((prev) => ({ ...prev, [field]: e.target.value }));

	const inputClass =
		"w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-mid outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

	if (step.kind === "otp") {
		return (
			<AuthLayout
				title="Check your email"
				subtitle={`We sent a 6-digit code to ${step.email}`}
				footer={
					<p>
						Wrong email?{" "}
						<button
							type="button"
							onClick={() => setStep({ kind: "form" })}
							className="text-brand-dark font-medium underline"
						>
							Start over
						</button>
					</p>
				}
			>
				<div className="space-y-6">
					{verify.error && (
						<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
							{formatApiError(verify.error, "Invalid or expired code")}
						</p>
					)}
					{step.devCode && (
						<p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
							Dev mode — code: <span className="font-mono">{step.devCode}</span>
						</p>
					)}
					<OtpInput value={code} onChange={setCode} disabled={verify.isPending} autoFocus />
					<button
						type="button"
						onClick={handleVerify}
						disabled={verify.isPending || code.length !== 6}
						className="bg-brand-dark hover:bg-brand-mid w-full rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
					>
						{verify.isPending ? "Verifying..." : "Verify and continue"}
					</button>
					<div className="text-brand-mid text-center text-xs">
						Didn&apos;t get it?{" "}
						<button
							type="button"
							onClick={handleResend}
							disabled={resend.isPending}
							className="text-brand-dark underline disabled:opacity-60"
						>
							{resend.isPending ? "Sending..." : "Resend code"}
						</button>
						{resentToast && <span className="text-green-600"> — sent ✓</span>}
					</div>
				</div>
			</AuthLayout>
		);
	}

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
			<div className="space-y-4">
				<GoogleButton label="Sign up with Google" disabled={register.isPending} />
				<div className="flex items-center gap-3">
					<div className="border-brand-border h-px flex-1 border-t" />
					<span className="text-brand-mid text-xs">or</span>
					<div className="border-brand-border h-px flex-1 border-t" />
				</div>

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
						{register.isPending ? "Sending code..." : "Sign Up"}
					</button>
				</form>
			</div>
		</AuthLayout>
	);
}
