import { Link } from "@tanstack/react-router";

export default function NotFoundPage() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
			<p className="dark:text-brand-mid text-sm font-medium text-gray-400">404</p>
			<h1 className="dark:text-brand-dark text-2xl font-semibold text-gray-900">Page not found</h1>
			<p className="dark:text-brand-mid max-w-md text-sm text-gray-500">
				The page you're looking for doesn't exist or has been moved.
			</p>
			<Link
				to="/"
				className="dark:bg-brand-surface dark:text-brand-dark dark:hover:bg-brand-hero rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
			>
				Back to home
			</Link>
		</div>
	);
}
