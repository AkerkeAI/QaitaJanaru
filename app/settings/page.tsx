"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { languageNames, Language } from "../lib/language";
import { useLanguage } from "../contexts/LanguageContext";

export default function SettingsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { language, messages, setLanguage } = useLanguage();

  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }
  }, [router]);

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setShowLanguageModal(false);
  };

  return (
    <main className="min-h-screen text-white relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-cyan-950">
      {/* Animated background orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse delay-1000"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-green-500/5 blur-[80px] animate-pulse delay-500"></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 shadow-lg group flex-shrink-0"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 text-emerald-300 group-hover:text-white transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">♻️</span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{messages.common.appName}</h1>
          </div>

          <div className="w-12 flex-shrink-0"></div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-2xl mx-auto">
            
            {/* Page Title */}
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">⚙️ {messages.settings.title}</h2>
              <p className="text-emerald-300 text-sm md:text-base">{messages.settings.subtitle}</p>
            </div>

            {/* Settings List */}
            <div className="space-y-3">
              
              {/* Language Row */}
              <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setShowLanguageModal(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors h-16"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-base shadow-lg flex-shrink-0">
                      🌍
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm truncate">{messages.settings.language}</div>
                      <div className="text-xs text-emerald-300 truncate">{messages.settings.languageDescription}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                    <span className="text-xs text-emerald-300">{languageNames[language]}</span>
                    <svg
                      className="w-4 h-4 text-emerald-300"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Account Information Row */}
              <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
                <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors h-16">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-base shadow-lg flex-shrink-0">
                      👤
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm truncate">{messages.settings.accountInformation}</div>
                      <div className="text-xs text-emerald-300 truncate">{messages.settings.accountInformationDescription}</div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 pl-2">
                    <svg
                      className="w-4 h-4 text-emerald-300"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Delete Account Row */}
              <div className="rounded-xl bg-red-500/5 backdrop-blur-xl border border-red-500/30 overflow-hidden">
                <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-red-500/10 transition-colors h-16">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-base shadow-lg flex-shrink-0">
                      🗑️
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm text-red-300 truncate">{messages.settings.deleteAccount}</div>
                      <div className="text-xs text-red-200 truncate">{messages.settings.deleteAccountDescription}</div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 pl-2">
                    <svg
                      className="w-4 h-4 text-red-300"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLanguageModal(false)}></div>
          <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-emerald-950 to-green-900 border border-white/10 shadow-2xl overflow-hidden z-10">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-xl font-bold tracking-tight">⚙️ {messages.settings.language}</h3>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {Object.keys(languageNames).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang as Language)}
                  className={`w-full px-4 py-3 flex items-center justify-between rounded-xl transition-colors text-sm font-medium ${
                    language === lang 
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-white" 
                      : "hover:bg-white/5 text-emerald-100"
                  }`}
                >
                  <span>{languageNames[lang as Language]}</span>
                  {language === lang && (
                    <span className="text-emerald-400 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
