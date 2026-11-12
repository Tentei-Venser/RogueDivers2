import { useEffect, useState } from "react";

// "system" follows the OS light/dark preference; "light" and "dark" force one.
export type Theme = "system" | "light" | "dark";

// Also read by the inline script in index.html, which applies the saved theme before first paint.
const THEME_KEY = "Roguedivers2Theme";

function loadTheme(): Theme {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        return saved === "light" || saved === "dark" ? saved : "system";
    }
    catch {
        return "system";
    }
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(loadTheme);

    // index.css switches every colour on data-theme; no attribute means follow the OS.
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "system") root.removeAttribute("data-theme");
        else root.setAttribute("data-theme", theme);
        try {
            localStorage.setItem(THEME_KEY, theme);
        }
        catch {
            // Storage unavailable (e.g. private browsing) - the theme still applies for this visit.
        }
    }, [theme]);

    return { theme, setTheme };
}
