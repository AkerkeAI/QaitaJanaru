"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { messages } = useLanguage();

  const menuItems = [
    { icon: "👤", label: messages.sidebar.profile, href: "/profile" },
    { icon: "📸", label: messages.sidebar.scan, href: "/scan-waste" },
    { icon: "🏆", label: messages.sidebar.leaderboard, href: "/leaderboard" },
    { icon: "🗺️", label: messages.sidebar.recyclingMap, href: "/recycling-map" },
    { icon: "🤖", label: messages.sidebar.ecoAssistant, href: "/eco-assistant" },
    { icon: "⚙️", label: messages.sidebar.settings, href: "/settings" },
  ];

  return (
    <>
      {/* Overlay with smooth fade */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar with smooth slide-in animation */}
      <div
        className={`fixed top-0 left-0 h-full w-80 md:w-96 bg-gradient-to-b from-emerald-950/98 to-green-950/98 backdrop-blur-2xl z-50 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          boxShadow: isOpen ? "8px 0 32px rgba(0, 0, 0, 0.4)" : "none",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-emerald-800/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              ♻️ {messages.common.appName}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 hover:text-white transition-all duration-200 flex items-center justify-center"
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
              className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl text-emerald-100 hover:bg-white/10 hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              }}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
