import { useParams } from "@tanstack/react-router";
import { usePublicPosts } from "@/hooks/usePosts";
import PostCard from "@/components/blog/PostCard";

export default function BlogUserPage() {
	const { username } = useParams({ strict: false }) as { username: string };
	const { data: posts, isLoading } = usePublicPosts(username);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<h1 className="mb-8 text-3xl font-bold">@{username}</h1>

			{isLoading ? (
				<p className="text-gray-500">Loading...</p>
			) : posts?.length === 0 ? (
				<p className="text-gray-500">No posts yet.</p>
			) : (
				<div className="space-y-6">
					{posts?.map((post) => (
						<PostCard key={post.id} post={post} username={username} />
					))}
				</div>
			)}
		</div>
	);
}
