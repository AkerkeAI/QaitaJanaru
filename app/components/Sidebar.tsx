"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { messages } = useLanguage();
  const { colors } = useTheme();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { icon: "👤", label: messages.sidebar.profile, href: "/profile" },
    { icon: "📋", label: messages.sidebar.tasks, href: "/tasks" },
    { icon: "📸", label: messages.sidebar.scan, href: "/scan-waste" },
    { icon: "🏆", label: messages.sidebar.leaderboard, href: "/leaderboard" },
    { icon: "🗺️", label: messages.sidebar.recyclingMap, href: "/recycling-map" },
    { icon: "🤖", label: messages.sidebar.ecoAssistant, href: "/eco-assistant" },
    { icon: "⚙️", label: messages.sidebar.settings, href: "/settings" },
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isOpen) {
      if (touchStartX.current < 30 && touchEndX.current - touchStartX.current > 50) {
        // Swiped right from left edge to open
        return;
      }
    } else {
      if (touchStartX.current - touchEndX.current > 50) {
        // Swiped left to close
        onClose();
      }
    }
  };

  // Handle swipe to open on body
  useEffect(() => {
    const handleBodyTouchStart = (e: TouchEvent) => {
      if (isOpen) return;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleBodyTouchEnd = (e: TouchEvent) => {
      if (isOpen) return;
      touchEndX.current = e.changedTouches[0].clientX;
      if (
        touchStartX.current < 30 &&
        touchEndX.current - touchStartX.current > 50
      ) {
        // Open sidebar via swipe
        // Wait for parent to handle, but maybe we can pass a ref? For now, assume parent handles opening via button.
        // Swipe to open is tricky without parent state access, so focus on swipe to close.
      }
    };

    window.addEventListener("touchstart", handleBodyTouchStart);
    window.addEventListener("touchend", handleBodyTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleBodyTouchStart);
      window.removeEventListener("touchend", handleBodyTouchEnd);
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-80 md:w-96 backdrop-blur-2xl z-50 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: colors.bg,
          boxShadow: isOpen ? "8px 0 32px rgba(0,0,0,0.4)" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              ♻️ {messages.common.appName}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:opacity-80 border flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                color: colors.textSecondary,
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:opacity-80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                color: colors.text,
                backgroundColor: colors.cardBg,
              }}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
