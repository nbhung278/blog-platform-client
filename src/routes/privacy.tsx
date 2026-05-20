import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

const EFFECTIVE_DATE = "May 20, 2026";

export default function PrivacyPage() {
	return (
		<div className="bg-brand-surface flex min-h-screen flex-col font-sans">
			<SiteHeader />

			<main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
				<header className="mb-10">
					<p className="text-brand-mid mb-3 text-sm font-medium tracking-wide uppercase">Legal</p>
					<h1 className="text-brand-dark font-serif text-4xl leading-tight font-bold md:text-5xl">
						Privacy Policy
					</h1>
					<p className="text-brand-mid mt-3 text-sm">Effective {EFFECTIVE_DATE}</p>
				</header>

				<div className="prose prose-stone max-w-none">
					<p className="text-brand-dark leading-relaxed">
						This Privacy Policy explains what information Strix collects when you use the site, how
						we use it, and the choices you have. We've tried to keep it short and in plain English.
						If anything is unclear, please reach out via the contact page.
					</p>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">
						1. What we collect
					</h2>
					<p className="text-brand-dark leading-relaxed">
						We collect the minimum we need to operate the service:
					</p>
					<ul className="text-brand-dark space-y-2 leading-relaxed">
						<li>
							<strong>Account data</strong> — your email address, display name, username, and (if
							you set one) password hash. If you sign in with Google, we also receive your Google
							account ID and profile picture URL.
						</li>
						<li>
							<strong>Content you create</strong> — posts, drafts, comments, reactions, follows,
							bookmarks, and reading progress.
						</li>
						<li>
							<strong>Operational logs</strong> — IP address, user-agent, and timestamps of sign-in
							attempts, used for rate limiting, abuse prevention, and debugging.
						</li>
						<li>
							<strong>Cookies</strong> — a session cookie to keep you signed in, and a CSRF token
							cookie. No third-party advertising cookies.
						</li>
					</ul>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">
						2. How we use it
					</h2>
					<ul className="text-brand-dark space-y-2 leading-relaxed">
						<li>
							To run the site — show your content, deliver notifications you opted into, and let
							other readers find your posts.
						</li>
						<li>To keep the site safe — detect abuse, prevent spam, and rate-limit attacks.</li>
						<li>
							To send transactional email — sign-in codes, password resets, and replies to your
							contact requests. We use Resend as our email delivery provider.
						</li>
						<li>
							To improve the service — anonymous aggregate analytics about which posts get read,
							which features are used. We do not sell or share individual reading habits.
						</li>
					</ul>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">
						3. What we don't do
					</h2>
					<ul className="text-brand-dark space-y-2 leading-relaxed">
						<li>We do not sell your personal data.</li>
						<li>We do not run third-party advertising on the site.</li>
						<li>We do not embed third-party tracking pixels or fingerprinting scripts.</li>
						<li>We do not share your email with other users.</li>
					</ul>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">
						4. Third-party services we rely on
					</h2>
					<p className="text-brand-dark leading-relaxed">
						We use a small set of providers to run the site. Each is contractually bound to process
						data only on our behalf:
					</p>
					<ul className="text-brand-dark space-y-2 leading-relaxed">
						<li>
							<strong>Resend</strong> — transactional email delivery (sign-in codes, password
							resets, contact replies).
						</li>
						<li>
							<strong>Google</strong> — optional sign-in via OAuth. We receive your Google account
							ID, email, name, and profile picture URL when you choose to sign in this way.
						</li>
						<li>
							<strong>Cloudflare</strong> — CDN, DDoS protection, and edge rendering for social
							share previews. Cloudflare may log IP addresses as part of its security service.
						</li>
						<li>
							<strong>S3-compatible storage</strong> — hosting for images you upload.
						</li>
					</ul>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">
						5. Your rights
					</h2>
					<p className="text-brand-dark leading-relaxed">You can:</p>
					<ul className="text-brand-dark space-y-2 leading-relaxed">
						<li>
							<strong>Edit or delete your account.</strong> Settings → Profile lets you change your
							information. Account deletion removes your profile and posts from the public site.
						</li>
						<li>
							<strong>Export your content.</strong> Reach out via the contact page and we'll send a
							copy of everything we hold for you.
						</li>
						<li>
							<strong>Opt out of email.</strong> All non-essential email has an unsubscribe link.
							Security email (sign-in codes, password reset) cannot be turned off because the
							service relies on it.
						</li>
						<li>
							<strong>Object or restrict processing.</strong> If you are in the EU or UK, GDPR
							applies — contact us and we'll act on any valid request within 30 days.
						</li>
					</ul>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">6. Retention</h2>
					<p className="text-brand-dark leading-relaxed">
						We keep account data and content for as long as your account is active. Operational logs
						are kept for 30 days, then deleted. Suppression list entries (bounced or complained
						email addresses) are kept indefinitely so we don't repeatedly mail addresses that don't
						accept us.
					</p>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">7. Children</h2>
					<p className="text-brand-dark leading-relaxed">
						Strix is not directed at children under 13. We do not knowingly collect personal data
						from anyone under 13. If you believe a child has registered, please contact us and we'll
						remove the account.
					</p>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">
						8. Changes to this policy
					</h2>
					<p className="text-brand-dark leading-relaxed">
						If we make a material change, we'll update the effective date at the top of this page
						and, where appropriate, send a notice. Continued use of the site after a change means
						you accept the new policy.
					</p>

					<h2 className="text-brand-dark mt-10 font-serif text-2xl font-semibold">9. Contact</h2>
					<p className="text-brand-dark leading-relaxed">
						For any privacy-related question — data access, deletion, complaints — email{" "}
						<a
							href="mailto:support@strix-blog.uk"
							className="text-brand-dark underline hover:no-underline"
						>
							support@strix-blog.uk
						</a>{" "}
						and we'll respond promptly.
					</p>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
