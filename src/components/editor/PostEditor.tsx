import MDEditor from "@uiw/react-md-editor";
import { useEditorStore } from "@/stores/editor.store";

export default function PostEditor() {
	const { draftContent, setDraftContent } = useEditorStore();

	return (
		<div data-color-mode="light">
			<MDEditor
				value={draftContent}
				onChange={(val) => setDraftContent(val || "")}
				height={600}
				preview="live"
			/>
		</div>
	);
}
