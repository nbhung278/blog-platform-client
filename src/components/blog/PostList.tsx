import type { Post } from "@/types";
import PostCard from "./PostCard";

interface PostListProps {
	posts: Post[];
	username: string;
}

export default function PostList({ posts, username }: PostListProps) {
	if (posts.length === 0) {
		return <p className="text-gray-500">No posts yet.</p>;
	}

	return (
		<div className="space-y-6">
			{posts.map((post) => (
				<PostCard key={post.id} post={post} username={username} />
			))}
		</div>
	);
}
