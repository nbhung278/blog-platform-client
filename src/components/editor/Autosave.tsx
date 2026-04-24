import { useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor.store";
import { useUpdatePost } from "@/hooks/usePosts";

interface AutosaveProps {
	postId: string;
	version: number;
	onVersionUpdate: (version: number) => void;
}

export default function Autosave({ postId, version, onVersionUpdate }: AutosaveProps) {
	const { isDirty, isSaving, hasConflict, lastSavedAt, markSaved, setSaving, setConflict } =
		useEditorStore();
	const updatePost = useUpdatePost();
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		intervalRef.current = setInterval(async () => {
			const state = useEditorStore.getState();
			if (!state.isDirty || state.isSaving || state.hasConflict) return;

			setSaving(true);
			try {
				const updated = await updatePost.mutateAsync({
					id: postId,
					content: state.draftContent,
					version,
				});
				onVersionUpdate(updated.version);
				markSaved(state.draftContent);
			} catch (err: unknown) {
				if (err && typeof err === "object" && "response" in err) {
					const axiosErr = err as { response?: { status?: number } };
					if (axiosErr.response?.status === 409) {
						setConflict(true);
					}
				}
				setSaving(false);
			}
		}, 30_000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [postId, version]);

	return (
		<div className="mb-4 text-sm text-gray-500">
			{hasConflict ? (
				<span className="font-medium text-red-500">
					Xung dot! Bai da duoc chinh sua o noi khac.
				</span>
			) : isSaving ? (
				<span>Dang luu...</span>
			) : lastSavedAt ? (
				<span>Da luu luc {lastSavedAt.toLocaleTimeString()}</span>
			) : isDirty ? (
				<span>Chua luu</span>
			) : null}
		</div>
	);
}
