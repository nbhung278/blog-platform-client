import { create } from "zustand";

interface EditorState {
	draftContent: string;
	lastSaved: string;
	isDirty: boolean;
	isSaving: boolean;
	hasConflict: boolean;
	lastSavedAt: Date | null;

	setDraftContent: (content: string) => void;
	markSaved: (content: string) => void;
	setSaving: (saving: boolean) => void;
	setConflict: (conflict: boolean) => void;
	reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
	draftContent: "",
	lastSaved: "",
	isDirty: false,
	isSaving: false,
	hasConflict: false,
	lastSavedAt: null,

	setDraftContent: (content) =>
		set({
			draftContent: content,
			isDirty: content !== get().lastSaved,
		}),

	markSaved: (content) =>
		set({
			lastSaved: content,
			isDirty: false,
			isSaving: false,
			lastSavedAt: new Date(),
		}),

	setSaving: (saving) => set({ isSaving: saving }),
	setConflict: (conflict) => set({ hasConflict: conflict }),

	reset: () =>
		set({
			draftContent: "",
			lastSaved: "",
			isDirty: false,
			isSaving: false,
			hasConflict: false,
			lastSavedAt: null,
		}),
}));
