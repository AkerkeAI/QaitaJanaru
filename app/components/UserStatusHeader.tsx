"use client";

import { useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

interface UserStatusHeaderProps {
  ecoPoints?: number;
  streak?: number;
  level?: number;
}

export function UserStatusHeader({ ecoPoints = 0, streak = 0, level = 1 }: UserStatusHeaderProps) {
  const { messages } = useLanguage();
  const { colors } = useTheme();

  const streakLabel = useMemo(() => {
    if (streak === 1) {
      return messages.statusBar.dayStreak;
    }
    return messages.statusBar.daysStreak.replace("{count}", String(streak));
  }, [messages.statusBar.dayStreak, messages.statusBar.daysStreak, streak]);

  return (
    <div
      className="flex-1 min-w-0 max-w-[70vw] md:max-w-none"
      aria-label="user status"
    >
      <div
        className="rounded-2xl border backdrop-blur-xl px-3 py-2 md:px-4 md:py-3"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:gap-x-4 text-sm md:text-base">
          <span className="font-semibold" style={{ color: colors.text }}>
            🌱 {messages.statusBar.ecoPoints}: {ecoPoints}
          </span>
          <span style={{ color: colors.textSecondary }}>
            🔥 {streakLabel}
          </span>
          <span className="hidden sm:inline" style={{ color: colors.textSecondary }}>
            ⭐ {messages.statusBar.level}: {level}
          </span>
        </div>
      </div>
    </div>
  );
}
