"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getTheme, setTheme as setThemeUtil, Theme, themeColors, ThemeColors } from "../lib/theme";

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeCssVars = (colors: ThemeColors) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--app-card-bg", colors.cardBg);
  root.style.setProperty("--app-card-border", colors.border);
  root.style.setProperty(
    "--app-card-shadow",
    `0 6px 18px ${colors.primary}12`,
  );
  root.style.setProperty("--app-card-blur", "blur(20px)");
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>("emerald");
  const [colors, setColors] = useState<ThemeColors>(themeColors.emerald);

  useEffect(() => {
    const currentTheme = getTheme();
    const currentColors = themeColors[currentTheme];
    setThemeState(currentTheme);
    setColors(currentColors);
    applyThemeCssVars(currentColors);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeUtil(newTheme);
    const newColors = themeColors[newTheme];
    setThemeState(newTheme);
    setColors(newColors);
    applyThemeCssVars(newColors);
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
