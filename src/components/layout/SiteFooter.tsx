import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, ArrowRight } from "lucide-react";

// Brand icons are kept as inline SVGs because the project's lucide-react
// version pre-dates brand support (and lucide is moving brand glyphs out
// anyway). Sized via `currentColor` so they inherit from the parent <a>.
function GithubIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
			<path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.03 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.74.12 3.03.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
		</svg>
	);
}

function LinkedinIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
			<path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
		</svg>
	);
}
import { useCategories } from "@/hooks/usePosts";

// External profile links — keep here rather than in env because they're public
// branding, not deployment-dependent secrets.
const GITHUB_URL = "https://github.com/nbhung278";
const LINKEDIN_URL = "https://www.linkedin.com/in/hưng-nguyễn-334b13253/?skipRedirect=true";

export default function SiteFooter() {
	const { data: categories = [] } = useCategories();
	const topCategories = categories.slice(0, 6);
	const year = new Date().getFullYear();
	const navigate = useNavigate();

	const [email, setEmail] = useState("");

	function onContactSubmit(e: FormEvent) {
		e.preventDefault();
		const trimmed = email.trim();
		// Pass the email through query string; the contact page reads it via
		// validateSearch and prefills the form so the visitor only has to add
		// their name and message.
		void navigate({
			to: "/contact",
			search: trimmed ? { email: trimmed } : undefined,
		});
	}

	return (
		<footer className="mt-auto bg-black text-white">
			{/* CTA card — sits at the top of the footer like Claude's
			    "Get the developer newsletter" block. Two columns on desktop:
			    headline on the left, contact form on the right. */}
			<div className="mx-auto max-w-7xl px-5 py-16 md:px-6 md:py-20">
				<div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
					<div>
						<h2 className="font-serif text-3xl leading-tight font-semibold md:text-4xl">
							Have a question or an idea?
						</h2>
						<p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 md:text-base">
							Drop us a line — feedback, partnership ideas, or just to say hi. We read everything
							and reply to most messages within a few days.
						</p>
					</div>

					<div className="rounded-2xl border border-white/10 bg-white/3 p-6 md:p-8">
						<div className="mb-5 flex items-center gap-3">
							<Mail className="h-5 w-5 text-white/60" aria-hidden />
							<h3 className="font-serif text-lg font-semibold">Get in touch</h3>
						</div>
						<p className="mb-5 text-sm leading-relaxed text-white/60">
							Enter your email and we'll take you to the contact form with it ready to go.
						</p>

						<form onSubmit={onContactSubmit} className="flex items-center gap-2" noValidate>
							<label htmlFor="footer-email" className="sr-only">
								Email address
							</label>
							<input
								id="footer-email"
								type="email"
								required
								maxLength={254}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								autoComplete="email"
								className="flex-1 rounded-md border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/40 transition-colors outline-none focus:border-white/40"
							/>
							<button
								type="submit"
								aria-label="Continue to contact form"
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-black transition-colors hover:bg-white/80"
							>
								<ArrowRight className="h-4 w-4" aria-hidden />
							</button>
						</form>
					</div>
				</div>
			</div>

			{/* Divider between CTA card and link columns. */}
			<div className="border-t border-white/10" />

			{/* Link columns + brand. */}
			<div className="mx-auto max-w-7xl px-5 py-12 md:px-6">
				<div className="grid grid-cols-2 gap-10 md:grid-cols-5">
					<div className="col-span-2 md:col-span-2">
						<Link to="/" className="flex items-end gap-2.5">
							<div className="bg-white px-2.5 py-1.5">
								<span className="font-serif text-lg font-bold tracking-wide text-black">
									<span className="text-2xl">S</span>trix
								</span>
							</div>
							<span className="font-serif text-lg font-semibold text-white">Code as Craft</span>
						</Link>
						<p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
							A community of developers and writers sharing the craft behind the code — deep dives,
							lessons learned, and stories from the build.
						</p>
					</div>

					<div>
						<h3 className="font-serif text-sm font-semibold tracking-wide text-white/50 uppercase">
							Explore
						</h3>
						<ul className="mt-4 space-y-2.5 text-sm">
							<li>
								<Link to="/" className="text-white/80 transition-colors hover:text-white">
									Home
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="font-serif text-sm font-semibold tracking-wide text-white/50 uppercase">
							Categories
						</h3>
						<ul className="mt-4 space-y-2.5 text-sm">
							{topCategories.length === 0 ? (
								<li className="text-white/40">—</li>
							) : (
								topCategories.map((cat) => (
									<li key={cat.id}>
										<Link
											to="/category/$name"
											params={{ name: cat.slug }}
											className="text-white/80 transition-colors hover:text-white"
										>
											{cat.name}
										</Link>
									</li>
								))
							)}
						</ul>
					</div>

					<div>
						<h3 className="font-serif text-sm font-semibold tracking-wide text-white/50 uppercase">
							Company
						</h3>
						<ul className="mt-4 space-y-2.5 text-sm">
							<li>
								<Link to="/about" className="text-white/80 transition-colors hover:text-white">
									About
								</Link>
							</li>
							<li>
								<Link to="/contact" className="text-white/80 transition-colors hover:text-white">
									Contact
								</Link>
							</li>
							<li>
								<Link to="/privacy" className="text-white/80 transition-colors hover:text-white">
									Privacy
								</Link>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Bottom bar: copyright + social icons. */}
			<div className="border-t border-white/10">
				<div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-6 sm:flex-row sm:items-center md:px-6">
					<p className="text-xs text-white/50">© {year} Strix. All rights reserved.</p>
					<div className="flex items-center gap-4">
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="GitHub"
							className="text-white/60 transition-colors hover:text-white"
						>
							<GithubIcon className="h-5 w-5" />
						</a>
						<a
							href={LINKEDIN_URL}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="LinkedIn"
							className="text-white/60 transition-colors hover:text-white"
						>
							<LinkedinIcon className="h-5 w-5" />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
