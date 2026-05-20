import { Link } from "@tanstack/react-router";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export default function AboutPage() {
	return (
		<div className="bg-brand-surface flex min-h-screen flex-col font-sans">
			<SiteHeader />

			<main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
				<header className="mb-12">
					<p className="text-brand-mid mb-3 text-sm font-medium tracking-wide uppercase">
						About Strix
					</p>
					<h1 className="text-brand-dark font-serif text-4xl leading-tight font-bold md:text-5xl">
						Code as Craft — written by the people who build it.
					</h1>
				</header>

				<div className="prose prose-stone max-w-none">
					<p className="text-brand-dark text-lg leading-relaxed">
						Strix is a writing platform for developers and people who think about software for a
						living. It is a place to publish the things that don't fit anywhere else — the deep
						dives, the postmortems, the messy lessons, the half-formed ideas you wish someone had
						told you when you were starting out.
					</p>

					<h2 className="text-brand-dark mt-12 font-serif text-2xl font-semibold">Why we exist</h2>
					<p className="text-brand-dark leading-relaxed">
						Most engineering writing lives in two places: scattered across personal blogs no one can
						find, or trapped inside corporate engineering blogs written for recruiting. We wanted
						somewhere in between — a calm, readable home for craft-focused writing, where the reader
						comes first and the algorithm doesn't decide what gets seen.
					</p>

					<h2 className="text-brand-dark mt-12 font-serif text-2xl font-semibold">
						What we believe
					</h2>
					<ul className="text-brand-dark space-y-3 leading-relaxed">
						<li>
							<strong>Writing is thinking.</strong> The best engineers are the ones who can explain
							what they did and why. Writing makes that practice public.
						</li>
						<li>
							<strong>Readers over engagement.</strong> No infinite scroll, no rage-bait, no
							recommendations tuned to keep you scrolling. Just posts you chose to read.
						</li>
						<li>
							<strong>Authors own their work.</strong> Your posts, your followers, your reading
							list. Exportable, portable, yours.
						</li>
						<li>
							<strong>Quiet by default.</strong> Notifications you ask for, emails you opted into,
							no growth-hack tactics dressed up as features.
						</li>
					</ul>

					<h2 className="text-brand-dark mt-12 font-serif text-2xl font-semibold">
						Who's behind this
					</h2>
					<p className="text-brand-dark leading-relaxed">
						Strix is a small independent project, built and maintained by a tiny team that also
						writes here. We are not VC-funded, we are not trying to be a unicorn, and we are not
						planning to sell your reading habits to anyone. If you'd like to know more, or if you
						have feedback, the{" "}
						<Link to="/contact" className="text-brand-dark underline hover:no-underline">
							contact page
						</Link>{" "}
						is the fastest way to reach us.
					</p>

					<h2 className="text-brand-dark mt-12 font-serif text-2xl font-semibold">Start writing</h2>
					<p className="text-brand-dark leading-relaxed">
						If you already have an account, the editor is one click away. If you don't, signup takes
						about thirty seconds and asks for an email and nothing else. We'd love to read what you
						publish.
					</p>

					<div className="mt-8 flex flex-wrap gap-3">
						<Link
							to="/register"
							className="bg-brand-dark hover:bg-brand-mid inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors"
						>
							Create an account
						</Link>
						<Link
							to="/"
							className="border-brand-border text-brand-dark hover:bg-brand-cream inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-medium transition-colors"
						>
							Read the latest posts
						</Link>
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
