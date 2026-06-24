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
    </main>
  );
}