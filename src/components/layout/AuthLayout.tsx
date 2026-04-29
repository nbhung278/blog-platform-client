import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface AuthLayoutProps {
	title: string;
	subtitle: string;
	children: ReactNode;
	footer: ReactNode;
}

const HERO_IMAGE = "/images/270.jpg";

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
	return (
		<div className="bg-brand-hero flex min-h-screen items-center justify-center p-4 sm:p-8">
			<div className="bg-brand-cream w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl sm:rounded-3xl">
				<div className="grid md:grid-cols-2">
					<div className="relative flex flex-col px-6 py-8 sm:px-10 sm:py-12 md:px-12">
						<div className="flex items-center justify-between">
							<Link to="/" className="flex items-center gap-1.5" aria-label="Strix home">
								<span className="text-brand-dark font-serif text-2xl font-bold">S</span>
								<span className="text-brand text-lg" aria-hidden="true">
									✦
								</span>
							</Link>
							<Link
								to="/"
								className="text-brand-mid hover:text-brand-dark text-xs underline-offset-4 hover:underline sm:text-sm"
							>
								Continue as guest →
							</Link>
						</div>

						<div className="mt-12 sm:mt-16">
							<h1 className="text-brand-dark font-serif text-3xl font-bold sm:text-4xl">{title}</h1>
							<p className="text-brand-mid mt-2 text-sm">{subtitle}</p>
						</div>

						<div className="mt-8">{children}</div>

						<div className="text-brand-mid mt-8 space-y-3 text-xs sm:text-sm">{footer}</div>
					</div>

					<div className="relative hidden md:block">
						<img
							src={HERO_IMAGE}
							alt=""
							loading="eager"
							decoding="async"
							fetchPriority="high"
							className="absolute inset-0 h-full w-full rounded-r-3xl object-cover p-3"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
