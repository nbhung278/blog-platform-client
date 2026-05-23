import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
	theme: Theme;
	toggle: () => void;
}

const getStored = (): Theme => {
	try {
		return (localStorage.getItem("theme") as Theme | null) ?? "light";
	} catch {
		return "light";
	}
};

export const useThemeStore = create<ThemeState>((set) => ({
	theme: getStored(),
	toggle: () =>
		set((s) => {
			const next = s.theme === "light" ? "dark" : "light";
			try {
				localStorage.setItem("theme", next);
			} catch {
				// localStorage unavailable in private browsing or restricted contexts
			}
			return { theme: next };
		}),
}));
