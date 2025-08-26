import { createContext, useState, useEffect, ReactNode, useContext } from "react";

const THEME_STORAGE_KEY = "reline_theme";
const DEFAULT_THEME = "light";

export type Theme = "light" | "dark";

export const ThemeContext = createContext<Theme>("light");
export const SetThemeContext = createContext<(theme: Theme) => void>(() => {});

export function useTheme() {
    return useContext(ThemeContext);
}

export function useSetTheme() {
    return useContext(SetThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        return (saved as Theme) || DEFAULT_THEME;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={theme}>
            <SetThemeContext.Provider value={setTheme}>
                {children}
            </SetThemeContext.Provider>
        </ThemeContext.Provider>
    );
}