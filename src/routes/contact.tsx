import { useState, type FormEvent } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { AxiosError } from "axios";
import { useSearch } from "@tanstack/react-router";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { api } from "@/api/client";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
	// `strict: false` lets us read the optional ?email= without coupling the
	// component to the route id — the footer CTA deep-links here with the
	// visitor's address prefilled.
	const search = useSearch({ strict: false }) as { email?: string };
	const [name, setName] = useState("");
	const [email, setEmail] = useState(search.email ?? "");
	const [message, setMessage] = useState("");
	// Honeypot field. Must stay empty; bots tend to auto-fill anything with a
	// recognisable name. Kept off-screen with CSS instead of `type=hidden` so
	// naive crawlers still see it.
	const [website, setWebsite] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const trimmedName = name.trim();
	const trimmedEmail = email.trim();
	const trimmedMessage = message.trim();
	const canSubmit =
		trimmedName.length >= 1 &&
		trimmedEmail.length > 0 &&
		trimmedMessage.length >= 10 &&
		status !== "submitting";

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		setStatus("submitting");
		setErrorMsg(null);
		try {
			await api.post("/contact", {
				name: trimmedName,
				email: trimmedEmail,
				message: trimmedMessage,
				website,
			});
			setStatus("success");
			setName("");
			setEmail("");
			setMessage("");
			setWebsite("");
		} catch (err) {
			setStatus("error");
			if (err instanceof AxiosError) {
				if (err.response?.status === 429) {
					setErrorMsg(
						"You've sent too many messages recently. Please try again in a little while.",
					);
				} else if (err.response?.status === 400) {
					// zValidator returns `{ success: false, error: ZodError }` rather
					// than our usual `{ error: string }` shape, so surface a generic
					// message instead of leaking the validator payload.
					setErrorMsg("Please double-check your name, email, and message.");
				} else {
					const data = err.response?.data as { error?: string } | undefined;
					setErrorMsg(data?.error ?? "Something went wrong. Please try again.");
				}
			} else {
				setErrorMsg("Something went wrong. Please try again.");
			}
		}
	};

	return (
		<div className="bg-brand-surface flex min-h-screen flex-col font-sans">
			<SiteHeader />

			<main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
				<header className="mb-10">
					<p className="text-brand-mid mb-3 text-sm font-medium tracking-wide uppercase">
						Get in touch
					</p>
					<h1 className="text-brand-dark font-serif text-4xl leading-tight font-bold md:text-5xl">
						Contact us
					</h1>
					<p className="text-brand-mid mt-4 text-base leading-relaxed">
						Questions, feedback, partnership ideas, or a bug to report — drop us a line. We read
						everything and reply to most messages within a few days.
					</p>
				</header>

				<div className="border-brand-border dark:bg-brand-hero mb-8 flex items-start gap-3 rounded-lg border bg-white p-4">
					<Mail className="text-brand-mid mt-0.5 h-5 w-5 shrink-0" aria-hidden />
					<div className="text-sm">
						<p className="text-brand-dark font-medium">Prefer email?</p>
						<p className="text-brand-mid mt-1">
							Write to{" "}
							<a
								href="mailto:support@strix-blog.uk"
								className="text-brand-dark underline hover:no-underline"
							>
								support@strix-blog.uk
							</a>{" "}
							directly.
						</p>
					</div>
				</div>

				{status === "success" ? (
					<div className="border-brand-border dark:bg-brand-hero rounded-lg border bg-white p-8 text-center">
						<CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" aria-hidden />
						<h2 className="text-brand-dark font-serif text-xl font-semibold">Message sent</h2>
						<p className="text-brand-mid mx-auto mt-2 max-w-md text-sm leading-relaxed">
							Thanks for reaching out. We've received your message and will get back to you at the
							email address you provided.
						</p>
						<button
							type="button"
							onClick={() => setStatus("idle")}
							className="text-brand-dark mt-5 text-sm underline-offset-2 hover:underline"
						>
							Send another message
						</button>
					</div>
				) : (
					<form
						onSubmit={onSubmit}
						className="border-brand-border dark:bg-brand-hero space-y-5 rounded-lg border bg-white p-6"
						noValidate
					>
						<div>
							<label
								htmlFor="contact-name"
								className="text-brand-dark mb-1.5 block text-sm font-medium"
							>
								Your name
							</label>
							<input
								id="contact-name"
								type="text"
								required
								maxLength={120}
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={status === "submitting"}
								className="border-brand-border focus:border-brand-dark dark:bg-brand-surface text-brand-dark w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors outline-none disabled:opacity-60"
								autoComplete="name"
							/>
						</div>

						<div>
							<label
								htmlFor="contact-email"
								className="text-brand-dark mb-1.5 block text-sm font-medium"
							>
								Email address
							</label>
							<input
								id="contact-email"
								type="email"
								required
								maxLength={254}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={status === "submitting"}
								className="border-brand-border focus:border-brand-dark dark:bg-brand-surface text-brand-dark w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors outline-none disabled:opacity-60"
								autoComplete="email"
							/>
						</div>

						<div>
							<label
								htmlFor="contact-message"
								className="text-brand-dark mb-1.5 block text-sm font-medium"
							>
								Message
							</label>
							<textarea
								id="contact-message"
								required
								rows={7}
								maxLength={5000}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								disabled={status === "submitting"}
								className="border-brand-border focus:border-brand-dark dark:bg-brand-surface text-brand-dark w-full resize-y rounded-md border bg-white px-3 py-2 text-sm leading-relaxed transition-colors outline-none disabled:opacity-60"
							/>
							<p className="text-brand-mid mt-1 text-xs">
								{trimmedMessage.length < 10
									? `At least ${10 - trimmedMessage.length} more character${
											10 - trimmedMessage.length === 1 ? "" : "s"
										} needed`
									: `${message.length} / 5000 characters`}
							</p>
						</div>

						{/* Honeypot. aria-hidden + tabIndex=-1 keep it away from assistive tech and keyboards. */}
						<div
							aria-hidden
							style={{
								position: "absolute",
								left: "-9999px",
								top: "auto",
								width: "1px",
								height: "1px",
								overflow: "hidden",
							}}
						>
							<label htmlFor="contact-website">Website (leave blank)</label>
							<input
								id="contact-website"
								type="text"
								tabIndex={-1}
								autoComplete="off"
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
							/>
						</div>

						{errorMsg && (
							<div
								role="alert"
								className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400"
							>
								{errorMsg}
							</div>
						)}

						<div className="flex items-center justify-end">
							<button
								type="submit"
								disabled={!canSubmit}
								className="bg-brand-dark hover:bg-brand-mid dark:text-brand-cream inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
							>
								<Send className="h-4 w-4" aria-hidden />
								{status === "submitting" ? "Sending…" : "Send message"}
							</button>
						</div>
					</form>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
