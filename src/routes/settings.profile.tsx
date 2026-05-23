import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";
import { useUpdateProfile, useChangePassword } from "@/hooks/useUpdateProfile";
import { useSetPassword } from "@/hooks/useAuth";
import { formatApiError } from "@/lib/apiErrors";
import { safeImageUrl } from "@/lib/sanitize";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import RequireAuth from "@/components/RequireAuth";
import ReadingPrivacySection from "@/components/blog/ReadingPrivacySection";

const INPUT_CLASS =
	"w-full rounded-xl border border-brand-border bg-white dark:bg-brand-hero px-4 py-3 text-sm text-brand-dark placeholder:text-brand-mid outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50";

function getInitials(name: string) {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
	return (first + last).toUpperCase() || "?";
}

export default function SettingsProfilePage() {
	return (
		<RequireAuth>
			<ProfileSettings />
		</RequireAuth>
	);
}

function ProfileSettings() {
	const user = useAuthStore((s) => s.user)!;
	const updateProfile = useUpdateProfile();
	const changePassword = useChangePassword();

	const [name, setName] = useState(user.name);
	const [bio, setBio] = useState(user.bio ?? "");
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [profileSuccess, setProfileSuccess] = useState(false);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [pwSuccess, setPwSuccess] = useState(false);
	const [pwError, setPwError] = useState("");

	const fileInputRef = useRef<HTMLInputElement>(null);

	function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setAvatarFile(file);
		setAvatarPreview(URL.createObjectURL(file));
	}

	async function handleProfileSubmit(e: React.FormEvent) {
		e.preventDefault();
		setProfileSuccess(false);
		await updateProfile.mutateAsync({ name, bio, avatarFile });
		setAvatarFile(null);
		setProfileSuccess(true);
	}

	async function handlePasswordSubmit(e: React.FormEvent) {
		e.preventDefault();
		setPwError("");
		setPwSuccess(false);

		if (newPassword !== confirmPassword) {
			setPwError("Passwords do not match");
			return;
		}

		try {
			await changePassword.mutateAsync({ currentPassword, newPassword });
			setPwSuccess(true);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (err) {
			setPwError(formatApiError(err, "Password change failed"));
		}
	}

	const displayAvatar = avatarPreview ?? safeImageUrl(user.avatarUrl);
	const initial = getInitials(user.name);

	const passwordRules = [
		{ label: "12+ characters", met: newPassword.length >= 12 },
		{ label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
		{ label: "Lowercase letter", met: /[a-z]/.test(newPassword) },
		{ label: "Number", met: /[0-9]/.test(newPassword) },
	];

	return (
		<div className="bg-brand-surface flex min-h-screen flex-col font-sans">
			<SiteHeader
				navContent={
					<Link
						to="/blog/$username"
						params={{ username: user.username }}
						className="text-brand-mid hover:text-brand-dark text-sm transition-colors"
					>
						← Back to profile
					</Link>
				}
			/>

			<div className="bg-brand-hero border-brand-border border-b">
				<div className="mx-auto max-w-2xl px-6 py-10">
					<p className="text-brand-mid font-serif text-sm tracking-widest uppercase">Account</p>
					<h1 className="text-brand-dark mt-1 font-serif text-4xl font-bold">Edit profile</h1>
				</div>
			</div>

			<div className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-6 py-12">
				{/* Profile form */}
				<section className="bg-brand-surface border-brand-border border p-8">
					<h2 className="text-brand-dark mb-6 font-serif text-xl font-bold">Profile information</h2>

					<form onSubmit={handleProfileSubmit} className="space-y-6">
						{/* Avatar */}
						<div className="flex items-center gap-5">
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="group relative shrink-0"
								aria-label="Change avatar"
							>
								{displayAvatar ? (
									<img
										src={displayAvatar}
										alt={user.name}
										className="border-brand-border h-20 w-20 rounded-full border-2 object-cover"
									/>
								) : (
									<div className="bg-brand-dark dark:text-brand-cream flex h-20 w-20 items-center justify-center rounded-full font-serif text-2xl font-bold text-white">
										{initial}
									</div>
								)}
								<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
									<svg
										className="h-5 w-5 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
										/>
									</svg>
								</div>
							</button>
							<div>
								<p className="text-brand-dark text-sm font-medium">Profile photo</p>
								<p className="text-brand-mid mt-0.5 text-xs">JPG, PNG or WebP · max 5MB</p>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="text-brand mt-1.5 text-xs underline underline-offset-2"
								>
									{displayAvatar ? "Change photo" : "Upload photo"}
								</button>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								className="hidden"
								onChange={handleAvatarChange}
							/>
						</div>

						{/* Read-only fields */}
						<div className="space-y-1">
							<label className="text-brand-mid text-xs font-medium tracking-wide uppercase">
								Username
							</label>
							<input type="text" value={user.username} disabled className={INPUT_CLASS} />
							<p className="text-brand-mid text-xs">Username cannot be changed.</p>
						</div>

						<div className="space-y-1">
							<label className="text-brand-mid text-xs font-medium tracking-wide uppercase">
								Email
							</label>
							<input type="email" value={user.email} disabled className={INPUT_CLASS} />
							<p className="text-brand-mid text-xs">Email cannot be changed.</p>
						</div>

						{/* Editable fields */}
						<div className="space-y-1">
							<label
								htmlFor="name"
								className="text-brand-mid text-xs font-medium tracking-wide uppercase"
							>
								Full name
							</label>
							<input
								id="name"
								type="text"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setProfileSuccess(false);
								}}
								className={INPUT_CLASS}
								required
								maxLength={100}
							/>
						</div>

						<div className="space-y-1">
							<label
								htmlFor="bio"
								className="text-brand-mid text-xs font-medium tracking-wide uppercase"
							>
								Bio
							</label>
							<textarea
								id="bio"
								value={bio}
								onChange={(e) => {
									setBio(e.target.value);
									setProfileSuccess(false);
								}}
								rows={4}
								maxLength={500}
								placeholder="Tell readers a little about yourself…"
								className={`${INPUT_CLASS} resize-none`}
							/>
							<p className="text-brand-mid text-right text-xs">{bio.length}/500</p>
						</div>

						{updateProfile.isError && (
							<p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
								{formatApiError(updateProfile.error, "Update failed")}
							</p>
						)}

						{profileSuccess && (
							<p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
								Profile updated successfully.
							</p>
						)}

						<button
							type="submit"
							disabled={updateProfile.isPending}
							className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream w-full py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
						>
							{updateProfile.isPending ? "Saving…" : "Save changes"}
						</button>
					</form>
				</section>

				<ReadingPrivacySection />

				{/* Password form — show "Set password" for Google-only accounts,
				    "Change password" for accounts that already have one. */}
				{user.hasPassword === false ? <SetPasswordSection /> : null}
				<section
					className="bg-brand-surface border-brand-border border p-8"
					hidden={user.hasPassword === false}
				>
					<h2 className="text-brand-dark mb-6 font-serif text-xl font-bold">Change password</h2>

					<form onSubmit={handlePasswordSubmit} className="space-y-5">
						<div className="space-y-1">
							<label
								htmlFor="current-password"
								className="text-brand-mid text-xs font-medium tracking-wide uppercase"
							>
								Current password
							</label>
							<input
								id="current-password"
								type="password"
								value={currentPassword}
								onChange={(e) => {
									setCurrentPassword(e.target.value);
									setPwError("");
									setPwSuccess(false);
								}}
								className={INPUT_CLASS}
								required
								autoComplete="current-password"
							/>
						</div>

						<div className="space-y-1">
							<label
								htmlFor="new-password"
								className="text-brand-mid text-xs font-medium tracking-wide uppercase"
							>
								New password
							</label>
							<input
								id="new-password"
								type="password"
								value={newPassword}
								onChange={(e) => {
									setNewPassword(e.target.value);
									setPwError("");
									setPwSuccess(false);
								}}
								className={INPUT_CLASS}
								required
								autoComplete="new-password"
							/>
							{newPassword.length > 0 && (
								<ul className="mt-2 space-y-1">
									{passwordRules.map((r) => (
										<li key={r.label} className="flex items-center gap-2 text-xs">
											<span className={r.met ? "text-green-600" : "text-brand-mid"}>
												{r.met ? "✓" : "○"}
											</span>
											<span className={r.met ? "text-green-700" : "text-brand-mid"}>{r.label}</span>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="space-y-1">
							<label
								htmlFor="confirm-password"
								className="text-brand-mid text-xs font-medium tracking-wide uppercase"
							>
								Confirm new password
							</label>
							<input
								id="confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(e) => {
									setConfirmPassword(e.target.value);
									setPwError("");
									setPwSuccess(false);
								}}
								className={INPUT_CLASS}
								required
								autoComplete="new-password"
							/>
						</div>

						{pwError && (
							<p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pwError}</p>
						)}

						{pwSuccess && (
							<p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
								Password changed. You'll need to log in again on other devices.
							</p>
						)}

						<button
							type="submit"
							disabled={changePassword.isPending}
							className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream w-full py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
						>
							{changePassword.isPending ? "Updating…" : "Update password"}
						</button>
					</form>
				</section>
			</div>

			<SiteFooter />
		</div>
	);
}

function SetPasswordSection() {
	const setPassword = useSetPassword();
	const [newPassword, setNewPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");
	const refresh = useAuthStore((s) => s.loadMe);

	const rules = [
		{ label: "12+ characters", met: newPassword.length >= 12 },
		{ label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
		{ label: "Lowercase letter", met: /[a-z]/.test(newPassword) },
		{ label: "Number", met: /[0-9]/.test(newPassword) },
	];
	const passwordOk = rules.every((r) => r.met);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		if (newPassword !== confirm) {
			setError("Passwords do not match");
			return;
		}
		try {
			await setPassword.mutateAsync({ newPassword });
			setSuccess(true);
			setNewPassword("");
			setConfirm("");
			// Refresh /me so `hasPassword` flips to true and the section swaps
			// to "Change password" on the next render.
			void refresh();
		} catch (err) {
			setError(formatApiError(err, "Could not set password"));
		}
	}

	return (
		<section className="bg-brand-surface border-brand-border border p-8">
			<h2 className="text-brand-dark mb-2 font-serif text-xl font-bold">Set a password</h2>
			<p className="text-brand-mid mb-6 text-sm">
				You signed in with Google. Adding a password lets you also sign in with email — useful if
				you lose access to your Google account.
			</p>

			<form onSubmit={handleSubmit} className="space-y-5">
				<div className="space-y-1">
					<label
						htmlFor="set-new-password"
						className="text-brand-mid text-xs font-medium tracking-wide uppercase"
					>
						New password
					</label>
					<input
						id="set-new-password"
						type="password"
						value={newPassword}
						onChange={(e) => {
							setNewPassword(e.target.value);
							setError("");
							setSuccess(false);
						}}
						className={INPUT_CLASS}
						required
						autoComplete="new-password"
					/>
					{newPassword.length > 0 && (
						<ul className="mt-2 space-y-1">
							{rules.map((r) => (
								<li key={r.label} className="flex items-center gap-2 text-xs">
									<span className={r.met ? "text-green-600" : "text-brand-mid"}>
										{r.met ? "✓" : "○"}
									</span>
									<span className={r.met ? "text-green-700" : "text-brand-mid"}>{r.label}</span>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="space-y-1">
					<label
						htmlFor="set-confirm-password"
						className="text-brand-mid text-xs font-medium tracking-wide uppercase"
					>
						Confirm password
					</label>
					<input
						id="set-confirm-password"
						type="password"
						value={confirm}
						onChange={(e) => {
							setConfirm(e.target.value);
							setError("");
							setSuccess(false);
						}}
						className={INPUT_CLASS}
						required
						autoComplete="new-password"
					/>
				</div>

				{error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
				{success && (
					<p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
						Password set. You can now sign in with email + password too.
					</p>
				)}

				<button
					type="submit"
					disabled={setPassword.isPending || !passwordOk}
					className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream w-full py-3 text-sm font-medium text-white transition-colors disabled:opacity-60"
				>
					{setPassword.isPending ? "Setting…" : "Set password"}
				</button>
			</form>
		</section>
	);
}
