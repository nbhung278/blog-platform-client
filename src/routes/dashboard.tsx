import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMyPosts, useDeletePost } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/auth.store";

export default function DashboardPage() {
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const navigate = useNavigate();

	useEffect(() => {
		if (!user) {
			navigate({ to: "/login" });
		}
	}, [user, navigate]);

	if (!user) return null;

	return <DashboardContent user={user} logout={logout} navigate={navigate} />;
}

function DashboardContent({
	user,
	logout,
	navigate,
}: {
	user: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>;
	logout: () => void;
	navigate: ReturnType<typeof useNavigate>;
}) {
	const { data: posts, isLoading } = useMyPosts();
	const deletePost = useDeletePost();

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Dashboard</h1>
					<p className="text-gray-500">Welcome, {user.name}</p>
				</div>
				<div className="flex gap-3">
					<Link
						to="/editor/new"
						className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						New Post
					</Link>
					<button
						onClick={() => {
							logout();
							navigate({ to: "/" });
						}}
						className="rounded-lg border px-4 py-2 hover:bg-gray-50"
					>
						Logout
					</button>
				</div>
			</div>

			{isLoading ? (
				<p className="text-gray-500">Loading posts...</p>
			) : posts?.length === 0 ? (
				<p className="text-gray-500">No posts yet. Create your first one!</p>
			) : (
				<div className="space-y-4">
					{posts?.map((post) => (
						<div
							key={post.id}
							className="flex items-center justify-between rounded-lg border bg-white p-4"
						>
							<div>
								<h3 className="font-semibold">{post.title}</h3>
								<div className="mt-1 flex gap-3 text-sm text-gray-500">
									<span
										className={`rounded px-2 py-0.5 text-xs ${
											post.status === "published"
												? "bg-green-100 text-green-700"
												: "bg-yellow-100 text-yellow-700"
										}`}
									>
										{post.status}
									</span>
									<span>{post.viewCount} views</span>
									<span>{post.readingTime} min read</span>
								</div>
							</div>
							<div className="flex gap-2">
								<Link
									to="/editor/$postId"
									params={{ postId: post.id }}
									className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
								>
									Edit
								</Link>
								<button
									onClick={() => deletePost.mutate(post.id)}
									className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
