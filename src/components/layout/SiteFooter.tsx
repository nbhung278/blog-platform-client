import { Link } from "@tanstack/react-router";
import { useCategories } from "@/hooks/usePosts";

export default function SiteFooter() {
	const { data: categories = [] } = useCategories();
	const topCategories = categories.slice(0, 6);
	const year = new Date().getFullYear();

	return (
		<footer className="bg-brand-cream border-brand-border mt-auto border-t">
			<div className="mx-auto max-w-7xl px-5 py-12 md:px-6">
				<div className="grid grid-cols-2 gap-10 md:grid-cols-5">
					<div className="col-span-2 md:col-span-2">
						<Link to="/" className="flex items-end gap-2.5">
							<div className="bg-brand flex h-9 items-center justify-center px-2.5">
								<span className="font-serif text-lg font-bold tracking-wide text-white">
									<span className="text-2xl">S</span>trix
								</span>
							</div>
							<span className="text-brand-dark font-serif text-lg font-semibold">
								Code as Craft
							</span>
						</Link>
						<p className="text-brand-mid mt-4 max-w-md text-sm leading-relaxed">
							A community of developers and writers sharing the craft behind the code — deep dives,
							lessons learned, and stories from the build.
						</p>
					</div>

					<div>
						<h3 className="text-brand-dark font-serif text-sm font-semibold tracking-wide uppercase">
							Explore
						</h3>
						<ul className="mt-4 space-y-2 text-sm">
							<li>
								<Link to="/" className="text-brand-mid hover:text-brand-dark transition-colors">
									Home
								</Link>
							</li>
							<li>
								<Link
									to="/search"
									search={{ q: "" }}
									className="text-brand-mid hover:text-brand-dark transition-colors"
								>
									Search
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-brand-dark font-serif text-sm font-semibold tracking-wide uppercase">
							Categories
						</h3>
						<ul className="mt-4 space-y-2 text-sm">
							{topCategories.length === 0 ? (
								<li className="text-brand-mid">—</li>
							) : (
								topCategories.map((cat) => (
									<li key={cat.id}>
										<Link
											to="/category/$name"
											params={{ name: cat.slug }}
											className="text-brand-mid hover:text-brand-dark transition-colors"
										>
											{cat.name}
										</Link>
									</li>
								))
							)}
						</ul>
					</div>

					<div>
						<h3 className="text-brand-dark font-serif text-sm font-semibold tracking-wide uppercase">
							Company
						</h3>
						<ul className="mt-4 space-y-2 text-sm">
							<li>
								<Link
									to="/about"
									className="text-brand-mid hover:text-brand-dark transition-colors"
								>
									About
								</Link>
							</li>
							<li>
								<Link
									to="/contact"
									className="text-brand-mid hover:text-brand-dark transition-colors"
								>
									Contact
								</Link>
							</li>
							<li>
								<Link
									to="/privacy"
									className="text-brand-mid hover:text-brand-dark transition-colors"
								>
									Privacy
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-brand-border mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 sm:flex-row sm:items-center">
					<p className="text-brand-mid text-xs">© {year} Strix. All rights reserved.</p>
					<p className="text-brand-mid text-xs">Built with care for writers and readers.</p>
				</div>
			</div>
		</footer>
	);
}
