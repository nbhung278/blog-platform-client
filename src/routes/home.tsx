import { Link } from "@tanstack/react-router";
import { useFeed } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";

export default function HomePage() {
	const { data, isLoading, isError } = useFeed();
	const user = useAuthStore((s) => s.user);

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b bg-white">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
					<Link to="/" className="text-xl font-bold">
						Blog Platform
					</Link>
					<nav className="flex items-center gap-3 text-sm">
						{user ? (
							<>
								<Link to="/dashboard" className="text-gray-700 hover:text-gray-900">
									Dashboard
								</Link>
								<Link
									to="/blog/$username"
									params={{ username: user.username }}
									className="text-gray-700 hover:text-gray-900"
								>
									My blog
								</Link>
							</>
						) : (
							<>
								<Link to="/login" className="text-gray-700 hover:text-gray-900">
									Login
								</Link>
								<Link
									to="/register"
									className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
								>
									Register
								</Link>
							</>
						)}
					</nav>
				</div>
			</header>

			<main className="mx-auto max-w-3xl px-4 py-10">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Latest posts</h1>
					<p className="mt-1 text-sm text-gray-500">Discover writing from the community.</p>
				</div>

				{isLoading && <p className="text-gray-500">Loading...</p>}
				{isError && <p className="text-red-600">Failed to load posts.</p>}
				{data && data.items.length === 0 && (
					<p className="text-gray-500">No posts published yet.</p>
				)}

				<div className="space-y-6">
					{data?.items.map((post) => (
						<Link
							key={post.id}
							to="/blog/$username/$slug"
							params={{
								username: post.user?.username ?? "",
								slug: post.slug,
							}}
							className="block rounded-lg border bg-white p-6 transition hover:shadow-md"
						>
							<div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
								{post.user?.avatarUrl && (
									<img
										src={post.user.avatarUrl}
										alt={post.user.name}
										className="h-5 w-5 rounded-full"
									/>
								)}
								<span className="font-medium text-gray-700">{post.user?.name ?? "Unknown"}</span>
								<span>·</span>
								<span>@{post.user?.username}</span>
								{post.publishedAt && (
									<>
										<span>·</span>
										<span>{new Date(post.publishedAt).toLocaleDateString()}</span>
									</>
								)}
							</div>
							<h2 className="text-xl font-semibold">{post.title}</h2>
							{post.excerpt && <p className="mt-2 line-clamp-2 text-gray-600">{post.excerpt}</p>}
							<div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
								<span>{post.readingTime} min read</span>
								<span>·</span>
								<span>{post.viewCount} views</span>
								{post.tags.map((tag) => (
									<span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
										{tag}
									</span>
								))}
							</div>
						</Link>
					))}
				</div>
			</main>
		</div>
	);
}
