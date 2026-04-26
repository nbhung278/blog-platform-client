import { useMemo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { usePost } from "@/hooks/usePosts";
import AIChatWidget from "@/components/chat/AIChatWidget";
import TableOfContents from "@/components/blog/TableOfContents";
import { sanitizeHtml } from "@/lib/sanitize";

export default function BlogPostPage() {
	const { username, slug } = useParams({ strict: false }) as {
		username: string;
		slug: string;
	};
	const { data: post, isLoading, isError } = usePost(slug);

	const cleanHtml = useMemo(() => (post ? sanitizeHtml(post.contentHtml) : ""), [post]);

	if (isLoading) {
		return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">Loading...</div>;
	}
	if (isError || !post) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-16 text-center">
				<p className="text-lg text-gray-600">Post not found.</p>
				<Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
					← Back to home
				</Link>
			</div>
		);
	}

	const date = post.publishedAt ?? post.updatedAt;

	return (
		<div className="min-h-screen bg-white">
			<header className="border-b">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm">
					<Link to="/" className="font-semibold">
						Blog Platform
					</Link>
					<Link
						to="/blog/$username"
						params={{ username }}
						className="text-gray-600 hover:text-gray-900"
					>
						More from @{username}
					</Link>
				</div>
			</header>

			<article className="mx-auto max-w-3xl px-4 py-12">
				{post.coverUrl && (
					<img
						src={post.coverUrl}
						alt=""
						className="mb-10 aspect-video w-full rounded-lg object-cover"
					/>
				)}

				<div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
					<Link
						to="/blog/$username"
						params={{ username }}
						className="text-gray-700 hover:underline"
					>
						@{username}
					</Link>
					<span>·</span>
					<time>{new Date(date).toLocaleDateString()}</time>
					<span>·</span>
					<span>{post.readingTime} min read</span>
					<span>·</span>
					<span>{post.viewCount} views</span>
				</div>

				<h1 className="mb-4 text-4xl leading-tight font-bold text-gray-900">{post.title}</h1>

				{post.excerpt && (
					<p className="mb-8 text-lg leading-relaxed text-gray-600">{post.excerpt}</p>
				)}

				{post.tags.length > 0 && (
					<div className="mb-10 flex flex-wrap gap-2">
						{post.tags.map((tag) => (
							<span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
								#{tag}
							</span>
						))}
					</div>
				)}

				<TableOfContents content={post.contentMd} />

				<div className="post-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
			</article>

			<AIChatWidget />
		</div>
	);
}
