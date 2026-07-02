"use client";

import { useTheme } from "../contexts/ThemeContext";

interface DailyLimitNoticeProps {
  title: string;
  body: string;
  footer: string;
  backLabel: string;
  onBack: () => void;
}

export function DailyLimitNotice({
  title,
  body,
  footer,
  backLabel,
  onBack,
}: DailyLimitNoticeProps) {
  const { colors } = useTheme();

  return (
    <div
      className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-8 space-y-5 text-center"
      style={{
        borderColor: `${colors.primary}30`,
        borderWidth: 1,
        background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)`,
      }}
    >
      <div
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{ background: `${colors.primary}20` }}
      >
        ⏳
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
          {title}
        </h2>
        <p className="text-base" style={{ color: colors.textSecondary }}>
          {body}
        </p>
        <p className="text-base" style={{ color: colors.textSecondary }}>
          {footer}
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="w-full px-6 py-4 rounded-2xl font-semibold transition-all duration-300"
        style={{
          background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
          color: colors.buttonText,
        }}
      >
        {backLabel}
      </button>
    </div>
  );
}
