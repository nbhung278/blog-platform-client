import { Link, useParams } from "@tanstack/react-router";
import { usePublicPosts } from "@/hooks/usePosts";
import PostCard from "@/components/blog/PostCard";

export default function BlogUserPage() {
	const { username } = useParams({ strict: false }) as { username: string };
	const { data: posts, isLoading, isError } = usePublicPosts(username);

	const author = posts?.[0]?.user;

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b bg-white">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm">
					<Link to="/" className="font-semibold">
						Blog Platform
					</Link>
				</div>
			</header>

			<div className="bg-white">
				<div className="mx-auto max-w-3xl px-4 py-10">
					<div className="flex items-start gap-4">
						{author?.avatarUrl ? (
							<img
								src={author.avatarUrl}
								alt={author.name}
								className="h-16 w-16 rounded-full object-cover"
							/>
						) : (
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-xl font-semibold text-gray-600">
								{(author?.name ?? username).charAt(0).toUpperCase()}
							</div>
						)}
						<div className="min-w-0">
							<h1 className="text-3xl font-bold">{author?.name ?? `@${username}`}</h1>
							<p className="text-gray-500">@{username}</p>
							{posts && (
								<p className="mt-2 text-sm text-gray-500">
									{posts.length} {posts.length === 1 ? "post" : "posts"} published
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			<main className="mx-auto max-w-3xl px-4 py-10">
				{isLoading && <p className="text-gray-500">Loading...</p>}
				{isError && <p className="text-red-600">Failed to load posts.</p>}
				{posts && posts.length === 0 && <p className="text-gray-500">No posts published yet.</p>}
				<div className="space-y-6">
					{posts?.map((post) => (
						<PostCard key={post.id} post={post} username={username} />
					))}
				</div>
			</main>
		</div>
	);
}
