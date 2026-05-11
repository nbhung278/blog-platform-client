import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLogin, useResendOtp, useVerifyLoginOtp, isOtpChallenge } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import AuthLayout from "@/components/layout/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import GoogleButton from "@/components/auth/GoogleButton";
import { formatApiError } from "@/lib/apiErrors";

type Step =
	| { kind: "credentials" }
	| { kind: "otp"; otpToken: string; email: string; devCode?: string };

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [step, setStep] = useState<Step>({ kind: "credentials" });
	const [code, setCode] = useState("");
	const [trustDevice, setTrustDevice] = useState(true);
	const [resentToast, setResentToast] = useState(false);
	const login = useLogin();
	const verify = useVerifyLoginOtp();
	const resend = useResendOtp();
	const navigate = useNavigate();
	const user = useAuthStore((s) => s.user);

	useEffect(() => {
		if (user) navigate({ to: "/" });
	}, [user, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await login.mutateAsync({ email, password });
			if (isOtpChallenge(res)) {
				setStep({ kind: "otp", otpToken: res.otpToken, email: res.email, devCode: res.devCode });
				setCode("");
			} else {
				navigate({ to: "/" });
			}
		} catch {
			// surfaced via login.error
		}
	};

	const handleVerify = async () => {
		if (step.kind !== "otp" || code.length !== 6) return;
		if (verify.isPending) return; // belt-and-braces: avoid overlapping submits
		try {
			await verify.mutateAsync({ otpToken: step.otpToken, code, trustDevice });
			navigate({ to: "/" });
		} catch {
			// surfaced via verify.error
		}
	};

	const handleResend = async () => {
		if (step.kind !== "otp") return;
		try {
			const res = await resend.mutateAsync({ otpToken: step.otpToken, purpose: "login" });
			setStep({ kind: "otp", otpToken: res.otpToken, email: res.email, devCode: res.devCode });
			setCode("");
			setResentToast(true);
			setTimeout(() => setResentToast(false), 3000);
		} catch {
			// surfaced via resend.error
		}
	};

	const inputClass =
		"w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-mid outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

	if (step.kind === "otp") {
		return (
			<AuthLayout
				title="One more step"
				subtitle={`We sent a code to ${step.email} to confirm this device`}
				footer={
					<p>
						Not your device?{" "}
						<button
							type="button"
							onClick={() => setStep({ kind: "credentials" })}
							className="text-brand-dark font-medium underline"
						>
							Back to sign in
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
					<label className="text-brand-mid flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={trustDevice}
							onChange={(e) => setTrustDevice(e.target.checked)}
							className="text-brand h-4 w-4 rounded"
						/>
						Trust this device — skip codes on future sign-ins
					</label>
					<button
						type="button"
						onClick={handleVerify}
						disabled={verify.isPending || code.length !== 6}
						className="bg-brand-dark hover:bg-brand-mid w-full rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
					>
						{verify.isPending ? "Verifying..." : "Verify and sign in"}
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
			<div className="space-y-4">
				<GoogleButton label="Sign in with Google" disabled={login.isPending} />
				<div className="flex items-center gap-3">
					<div className="border-brand-border h-px flex-1 border-t" />
					<span className="text-brand-mid text-xs">or</span>
					<div className="border-brand-border h-px flex-1 border-t" />
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{login.error && (
						<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
							{formatApiError(login.error, "Invalid credentials")}
						</p>
					)}

					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className={inputClass}
						autoComplete="email"
						required
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className={inputClass}
						autoComplete="current-password"
						required
					/>
					<div className="flex justify-end">
						<Link
							to="/forgot-password"
							className="text-brand-mid hover:text-brand-dark text-xs underline-offset-4 hover:underline"
						>
							Forgot password?
						</Link>
					</div>
					<button
						type="submit"
						disabled={login.isPending}
						className="bg-brand-dark hover:bg-brand-mid w-full rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
					>
						{login.isPending ? "Signing in..." : "Login"}
					</button>
				</form>
			</div>
		</AuthLayout>
	);
}
