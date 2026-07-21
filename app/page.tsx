"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "./contexts/LanguageContext";
import { languageNames, Language } from "./lib/language";

export default function Home() {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { language, messages, setLanguage } = useLanguage();

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowLanguageMenu(false);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-cyan-900 text-white">

      <div className="absolute top-10 right-10 h-48 w-48 md:h-64 md:w-64 lg:h-96 lg:w-96 lg:top-20 lg:right-20 rounded-full bg-green-400/20 blur-3xl"></div>
      <div className="absolute bottom-10 left-10 h-36 w-36 md:h-48 md:w-48 lg:h-72 lg:w-72 lg:bottom-20 lg:left-20 rounded-full bg-cyan-400/20 blur-3xl"></div>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16 lg:py-24">

        <nav className="flex items-center justify-between mb-12 md:mb-16 lg:mb-24">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
            ♻️ {messages.common.appName}
          </h1>

          <div className="flex items-center gap-3">
            {/* Compact language selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="rounded-xl bg-white/10 px-3 py-2 md:px-4 md:py-2 backdrop-blur-md border border-white/20 hover:bg-white/20 transition text-sm md:text-base"
              >
                🌍 {languageNames[language]}
              </button>

              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 rounded-xl border overflow-hidden z-50 shadow-xl bg-emerald-950/95 backdrop-blur-xl border-emerald-500/20">
                  {(["en", "ru", "kz"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`block px-4 py-2 text-left text-sm transition-colors ${
                        language === lang
                          ? "bg-emerald-500/20"
                          : "hover:bg-white/5"
                      } text-white`}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/login"
              className="rounded-xl bg-white/10 px-4 py-2 md:px-5 md:py-2 backdrop-blur-md border border-white/20 hover:bg-white/20 transition text-sm md:text-base"
            >
              {messages.home.signIn}
            </Link>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">

          <div>
            <div className="inline-block rounded-full border border-green-300/30 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 backdrop-blur-md mb-4 md:mb-6 text-sm md:text-base">
              {messages.home.aiEcology}
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold leading-tight mb-6 md:mb-8">
              {messages.home.title}
              <span className="block text-green-300">
                {messages.home.subtitle}
              </span>
            </h2>

            <p className="text-base md:text-lg lg:text-xl text-green-50/80 mb-8 md:mb-10 leading-relaxed">
              {messages.home.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/register"
                className="rounded-2xl bg-green-400 px-6 py-3 md:px-8 md:py-4 text-black font-bold hover:scale-105 transition text-center text-sm md:text-base"
              >
                {messages.home.start}
              </Link>

              <a className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 md:px-8 md:py-4 backdrop-blur-md text-center text-sm md:text-base"
                href="https://qaitajanaru.tilda.ws/qaitajanaru"
                target="_blank"
                rel="noopener noreferrer"
              >
                {messages.home.aboutUs}
              </a>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-xl p-4 md:p-6 lg:p-8 shadow-2xl">

            <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">
              {messages.home.featuresTitle}
            </h3>

            <div className="space-y-3 md:space-y-4 lg:space-y-5">
              <div className="rounded-2xl bg-white/10 p-3 md:p-4 text-sm md:text-base">
                {messages.home.feature1}
              </div>

              <div className="rounded-2xl bg-white/10 p-3 md:p-4 text-sm md:text-base">
                {messages.home.feature2}
              </div>

              <div className="rounded-2xl bg-white/10 p-3 md:p-4 text-sm md:text-base">
                {messages.home.feature3}
              </div>

              <div className="rounded-2xl bg-white/10 p-3 md:p-4 text-sm md:text-base">
                {messages.home.feature4}
              </div>

              <div className="rounded-2xl bg-white/10 p-3 md:p-4 text-sm md:text-base">
                {messages.home.feature5}
              </div>
            </div>

          </div>

        </div>
      </section>

      <footer className="relative z-10 py-8 text-center">
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://www.instagram.com/qaita.janaru?igsh=MW9vNDJ5ZWU0NW0ycA=="
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Instagram"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@qaitajanaru?_r=1&_t=ZS-98CpJv3RBh7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white transition-colors"
            aria-label="TikTok"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}