import { Link } from "@tanstack/react-router";

export default function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center">
			<h1 className="mb-4 text-5xl font-bold">Blog Platform</h1>
			<p className="mb-8 text-lg text-gray-600">
				Create your blog with an AI assistant trained on your content.
			</p>
			<div className="flex gap-4">
				<Link to="/login" className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
					Login
				</Link>
				<Link
					to="/register"
					className="rounded-lg border border-blue-600 px-6 py-3 text-blue-600 hover:bg-blue-50"
				>
					Register
				</Link>
			</div>
		</div>
	);
}
