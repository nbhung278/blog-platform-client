import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import AuthLayout from "@/components/layout/AuthLayout";
import { useForgotPassword } from "@/hooks/useAuth";
import { formatApiError } from "@/lib/apiErrors";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const forgot = useForgotPassword();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await forgot.mutateAsync({ email });
			// Server always returns an otpToken (real or decoy) to keep response
			// time / shape uniform — that's account-enumeration protection. Hand
			// it to the reset page; if it's a decoy the verify step will fail.
			navigate({
				to: "/reset-password",
				search: { token: res.otpToken, email, ...(res.devCode ? { dev: res.devCode } : {}) },
			});
		} catch {
			// surfaced via forgot.error
		}
	};

	const inputClass =
		"w-full rounded-xl border border-brand-border bg-white dark:bg-brand-hero px-4 py-3 text-sm text-brand-dark placeholder:text-brand-mid outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

	return (
		<AuthLayout
			title="Forgot password?"
			subtitle="Enter your email and we'll send you a code to reset it"
			footer={
				<p>
					Remembered it?{" "}
					<Link to="/login" className="text-brand-dark font-medium underline">
						Back to sign in
					</Link>
				</p>
			}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				{forgot.error && (
					<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
						{formatApiError(forgot.error, "Something went wrong")}
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
				<button
					type="submit"
					disabled={forgot.isPending}
					className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream w-full rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
				>
					{forgot.isPending ? "Sending code..." : "Send reset code"}
				</button>
			</form>
		</AuthLayout>
	);
}
