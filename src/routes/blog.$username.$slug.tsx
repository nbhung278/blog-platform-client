import { useParams } from "@tanstack/react-router";
import { usePost } from "@/hooks/usePosts";
import AIChatWidget from "@/components/chat/AIChatWidget";
import TableOfContents from "@/components/blog/TableOfContents";
import MDEditor from "@uiw/react-md-editor";

export default function BlogPostPage() {
	const { slug } = useParams({ strict: false }) as { slug: string };
	const { data: post, isLoading } = usePost(slug);

	if (isLoading) return <p className="p-8 text-gray-500">Loading...</p>;
	if (!post) return <p className="p-8 text-red-500">Post not found</p>;

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<article>
				<h1 className="mb-2 text-4xl font-bold">{post.title}</h1>
				<div className="mb-8 flex gap-3 text-sm text-gray-500">
					<span>{post.readingTime} min read</span>
					<span>{post.viewCount} views</span>
					{post.tags.map((tag) => (
						<span key={tag} className="rounded bg-gray-100 px-2 py-0.5">
							{tag}
						</span>
					))}
				</div>

				<TableOfContents content={post.content} />

				<div data-color-mode="light">
					<MDEditor.Markdown source={post.content} />
				</div>
			</article>

			<AIChatWidget />
		</div>
	);
}
