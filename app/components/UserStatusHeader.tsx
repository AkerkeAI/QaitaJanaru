"use client";

import { useTheme } from "../contexts/ThemeContext";

interface UserStatusHeaderProps {
  ecoPoints?: number;
  streak?: number;
  level?: number;
}

export function UserStatusHeader({
  ecoPoints = 0,
  streak = 0,
  level = 1,
}: UserStatusHeaderProps) {
  const { colors } = useTheme();

  return (
    <div
      className="flex-1 min-w-0 max-w-[70vw] md:max-w-none"
      aria-label="user status"
    >
      <div
        className="rounded-2xl border backdrop-blur-xl px-4 py-3 md:px-5 md:py-4"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:gap-x-5 text-sm md:text-base lg:text-lg font-semibold">
          <span style={{ color: colors.text }}>🌱 {ecoPoints}</span>
          <span style={{ color: colors.textSecondary }}>🔥 {streak}</span>
          <span style={{ color: colors.textSecondary }}>
            ⭐ {level}
          </span>
        </div>
      </div>
    </div>
  );
}
