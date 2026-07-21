"use client";

import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface HelpCardProps {
  title: string;
  body: string;
}

export function HelpCard({ title, body }: HelpCardProps) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();

  return (
    <div
      className="rounded-2xl border min-w-0 w-full"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left min-w-0"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm break-words" style={{ color: colors.text }}>{title}</span>
        <span
          className="flex-shrink-0 text-sm"
          style={{ color: colors.textSecondary }}
          aria-hidden="true"
        >
          {open ? "↑" : "↓"}
        </span>
      </button>
      {open ? (
        <div
          className="px-4 pb-4 text-sm whitespace-pre-line break-words"
          style={{ color: colors.textSecondary }}
        >
          {body}
        </div>
      ) : null}
    </div>
  );
}
