import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import AuthLayout from "@/components/layout/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import { useResetPassword, useResendOtp } from "@/hooks/useAuth";
import { formatApiError } from "@/lib/apiErrors";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/password-rules";

export default function ResetPasswordPage() {
	const search = useSearch({ from: "/reset-password" }) as {
		token: string;
		email: string;
		dev?: string;
	};
	const [token, setToken] = useState(search.token);
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [showRules, setShowRules] = useState(false);
	const [resentToast, setResentToast] = useState(false);
	const reset = useResetPassword();
	const resend = useResendOtp();
	const navigate = useNavigate();

	const passwordOk = isPasswordValid(newPassword);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!passwordOk || code.length !== 6) {
			setShowRules(true);
			return;
		}
		try {
			await reset.mutateAsync({ otpToken: token, code, newPassword });
			navigate({ to: "/login" });
		} catch {
			// surfaced via reset.error
		}
	};

	const handleResend = async () => {
		try {
			const res = await resend.mutateAsync({ otpToken: token, purpose: "forgot" });
			setToken(res.otpToken);
			setCode("");
			setResentToast(true);
			setTimeout(() => setResentToast(false), 3000);
		} catch {
			// surfaced via resend.error
		}
	};

	const inputClass =
		"w-full rounded-xl border border-brand-border bg-white dark:bg-brand-hero px-4 py-3 text-sm text-brand-dark placeholder:text-brand-mid outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

	return (
		<AuthLayout
			title="Set a new password"
			subtitle={`Enter the code we sent to ${search.email}`}
			footer={
				<p>
					Wrong email?{" "}
					<Link to="/forgot-password" className="text-brand-dark font-medium underline">
						Start over
					</Link>
				</p>
			}
		>
			<form onSubmit={handleSubmit} className="space-y-6">
				{reset.error && (
					<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
						{formatApiError(reset.error, "Invalid or expired code")}
					</p>
				)}
				{search.dev && (
					<p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
						Dev mode — code: <span className="font-mono">{search.dev}</span>
					</p>
				)}
				<OtpInput value={code} onChange={setCode} disabled={reset.isPending} autoFocus />
				<input
					type="password"
					placeholder="New password"
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
					onFocus={() => setShowRules(true)}
					className={inputClass}
					autoComplete="new-password"
					minLength={12}
					required
				/>
				{showRules && (
					<ul className="space-y-1 text-xs">
						{PASSWORD_RULES.map((rule) => {
							const ok = rule.test(newPassword);
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
					disabled={reset.isPending || !passwordOk || code.length !== 6}
					className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream w-full rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
				>
					{reset.isPending ? "Updating..." : "Set new password"}
				</button>
				<div className="text-brand-mid text-center text-xs">
					Didn&apos;t get a code?{" "}
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
			</form>
		</AuthLayout>
	);
}
