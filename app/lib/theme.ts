export type Theme =
  | "emerald"
  | "violet"
  | "ocean"
  | "cyan"
  | "sunset"
  | "light"
  | "dark";

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  bg: string;
  bgGradient: string;
  cardBg: string;
  text: string;
  textSecondary: string;
  border: string;
  buttonText: string;
  danger: string;
  dangerLight: string;
  success: string;
  warning: string;
  shadow: string;
}

export const themeNames: Record<Theme, string> = {
  emerald: "Emerald",
  violet: "Violet",
  ocean: "Ocean",
  cyan: "Cyan",
  sunset: "Sunset",
  light: "Light",
  dark: "Dark",
};

export const themeColors: Record<Theme, ThemeColors> = {
  emerald: {
    primary: "#10b981",
    primaryLight: "#34d399",
    primaryDark: "#047857",
    accent: "#06b6d4",
    bg: "linear-gradient(to bottom right, #064e3b, #065f46, #164e63)",
    bgGradient: "from-emerald-950 via-green-900 to-cyan-950",
    cardBg: "rgba(255, 255, 255, 0.05)",
    text: "#ffffff",
    textSecondary: "#a7f3d0",
    border: "rgba(255, 255, 255, 0.1)",
    buttonText: "#ffffff",
    danger: "#ef4444",
    dangerLight: "rgba(239, 68, 68, 0.05)",
    success: "#10b981",
    warning: "#f59e0b",
    shadow: "rgba(16, 185, 129, 0.25)",
  },
  violet: {
    primary: "#8b5cf6",
    primaryLight: "#a78bfa",
    primaryDark: "#6d28d9",
    accent: "#ec4899",
    bg: "linear-gradient(to bottom right, #1e1b4b, #312e81, #581c87)",
    bgGradient: "from-violet-950 via-indigo-900 to-purple-950",
    cardBg: "rgba(255, 255, 255, 0.05)",
    text: "#ffffff",
    textSecondary: "#ddd6fe",
    border: "rgba(255, 255, 255, 0.1)",
    buttonText: "#ffffff",
    danger: "#ef4444",
    dangerLight: "rgba(239, 68, 68, 0.05)",
    success: "#10b981",
    warning: "#f59e0b",
    shadow: "rgba(139, 92, 246, 0.25)",
  },
  ocean: {
    primary: "#0ea5e9",
    primaryLight: "#38bdf8",
    primaryDark: "#0369a1",
    accent: "#06b6d4",
    bg: "linear-gradient(to bottom right, #0f172a, #1e3a5f, #0f172a)",
    bgGradient: "from-slate-950 via-blue-900 to-slate-950",
    cardBg: "rgba(255, 255, 255, 0.05)",
    text: "#ffffff",
    textSecondary: "#93c5fd",
    border: "rgba(255, 255, 255, 0.1)",
    buttonText: "#ffffff",
    danger: "#ef4444",
    dangerLight: "rgba(239, 68, 68, 0.05)",
    success: "#10b981",
    warning: "#f59e0b",
    shadow: "rgba(14, 165, 233, 0.25)",
  },
  cyan: {
    primary: "#06b6d4",
    primaryLight: "#22d3ee",
    primaryDark: "#0891b2",
    accent: "#14b8a6",
    bg: "linear-gradient(to bottom right, #083344, #0f172a, #164e63)",
    bgGradient: "from-cyan-950 via-slate-900 to-cyan-950",
    cardBg: "rgba(255, 255, 255, 0.05)",
    text: "#ffffff",
    textSecondary: "#67e8f9",
    border: "rgba(255, 255, 255, 0.1)",
    buttonText: "#ffffff",
    danger: "#ef4444",
    dangerLight: "rgba(239, 68, 68, 0.05)",
    success: "#10b981",
    warning: "#f59e0b",
    shadow: "rgba(6, 182, 212, 0.25)",
  },
  sunset: {
    primary: "#f97316",
    primaryLight: "#fb923c",
    primaryDark: "#c2410c",
    accent: "#f43f5e",
    bg: "linear-gradient(to bottom right, #1c1917, #431407, #1c1917)",
    bgGradient: "from-stone-950 via-orange-900 to-stone-950",
    cardBg: "rgba(255, 255, 255, 0.05)",
    text: "#ffffff",
    textSecondary: "#fed7aa",
    border: "rgba(255, 255, 255, 0.1)",
    buttonText: "#ffffff",
    danger: "#ef4444",
    dangerLight: "rgba(239, 68, 68, 0.05)",
    success: "#10b981",
    warning: "#f59e0b",
    shadow: "rgba(249, 115, 22, 0.25)",
  },
  light: {
    primary: "#10b981",
    primaryLight: "#34d399",
    primaryDark: "#059669",
    accent: "#06b6d4",
    bg: "linear-gradient(to bottom right, #f0fdf4, #ecfdf5, #f0fdfa)",
    bgGradient: "from-green-50 via-emerald-50 to-cyan-50",
    cardBg: "rgba(255, 255, 255, 0.7)",
    text: "#1f2937",
    textSecondary: "#4b5563",
    border: "rgba(0, 0, 0, 0.1)",
    buttonText: "#ffffff",
    danger: "#ef4444",
    dangerLight: "rgba(239, 68, 68, 0.05)",
    success: "#10b981",
    warning: "#f59e0b",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    primary: "#10b981",
    primaryLight: "#34d399",
    primaryDark: "#047857",
    accent: "#06b6d4",
    bg: "linear-gradient(to bottom right, #030712, #0f172a, #030712)",
    bgGradient: "from-slate-950 via-slate-900 to-slate-950",
    cardBg: "rgba(255, 255, 255, 0.05)",
    text: "#ffffff",
    textSecondary: "#94a3b8",
    border: "rgba(255, 255, 255, 0.1)",
    buttonText: "#ffffff",
    danger: "#ef4444",
    dangerLight: "rgba(239, 68, 68, 0.05)",
    success: "#10b981",
    warning: "#f59e0b",
    shadow: "rgba(0, 0, 0, 0.25)",
  },
};

export const getTheme = (): Theme => {
  if (typeof window === "undefined") return "emerald";
  const savedTheme = localStorage.getItem("theme") as Theme;
  if (savedTheme && Object.keys(themeColors).includes(savedTheme)) {
    return savedTheme;
  }
  return "emerald";
};

export const setTheme = (theme: Theme) => {
  localStorage.setItem("theme", theme);
};
