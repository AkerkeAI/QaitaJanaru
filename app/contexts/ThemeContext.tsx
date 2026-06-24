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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>("emerald");
  const [colors, setColors] = useState<ThemeColors>(themeColors.emerald);

  useEffect(() => {
    const currentTheme = getTheme();
    setThemeState(currentTheme);
    setColors(themeColors[currentTheme]);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeUtil(newTheme);
    setThemeState(newTheme);
    setColors(themeColors[newTheme]);
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
