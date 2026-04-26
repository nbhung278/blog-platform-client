import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { useEditorStore } from "@/stores/editor.store";
import { useCreatePost } from "@/hooks/usePosts";
import { useNavigate, useParams } from "@tanstack/react-router";
import { api } from "@/api/client";
import type { Post } from "@/types";
import Autosave from "@/components/editor/Autosave";

export default function EditorPage() {
	const [title, setTitle] = useState("");
	const [postId, setPostId] = useState<string | null>(null);
	const [version, setVersion] = useState(1);
	const { draftContent, setDraftContent, reset } = useEditorStore();
	const createPost = useCreatePost();
	const navigate = useNavigate();

	// Load existing post if editing
	const params = useParams({ strict: false });
	const paramPostId = (params as Record<string, string>).postId;

	useEffect(() => {
		if (paramPostId && paramPostId !== "new") {
			api.get<Post[]>(`/posts`).then((res) => {
				const post = res.data.find((p: Post) => p.id === paramPostId);
				if (post) {
					setTitle(post.title);
					setDraftContent(post.contentMd);
					setPostId(post.id);
					setVersion(post.version);
				}
			});
		} else {
			reset();
			setTitle("");
			setPostId(null);
		}
	}, [paramPostId]);

	const handleCreate = async () => {
		const post = await createPost.mutateAsync({
			title,
			contentMd: draftContent,
			contentHtml: draftContent,
			status: "draft",
		});
		setPostId(post.id);
		setVersion(post.version);
		navigate({ to: "/editor/$postId", params: { postId: post.id } });
	};

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<div className="mb-4 flex items-center justify-between">
				<input
					type="text"
					placeholder="Post title..."
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full text-3xl font-bold outline-none"
				/>
				{!postId && (
					<button
						onClick={handleCreate}
						disabled={!title || createPost.isPending}
						className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
					>
						Create
					</button>
				)}
			</div>

			{postId && <Autosave postId={postId} version={version} onVersionUpdate={setVersion} />}

			<MDEditor value={draftContent} onChange={(val) => setDraftContent(val || "")} height={600} />
		</div>
	);
}
