"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { updateProfile, getProfile } from "../lib/api";

export default function SelectCityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") || "/profile";
  const { messages } = useLanguage();
  const { colors } = useTheme();

  const [selectedCity, setSelectedCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const cities = Object.entries(messages.cities).map(([key, label]) => ({
    value: key,
    label,
  }));

  const handleContinue = async () => {
    if (!selectedCity) return;
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("qaitaJanaru_user_id");
      if (!userId) {
        router.push("/login");
        return;
      }
      await updateProfile(userId, { city: selectedCity });
      const profile = await getProfile(userId);
      localStorage.setItem("qaitaJanaru_city", profile.city || "Unknown");
      router.push(nextPath);
    } catch (err) {
      console.error("Failed to update city:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(to bottom right, #064e3b, #166534, #0f766e)" }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-[130px]"
          style={{ background: "#10b981", opacity: 0.38, animation: "glowPulse 6s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full blur-[110px]"
          style={{ background: "#0d9488", opacity: 0.28, animation: "glowPulse 8s ease-in-out infinite 2s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div
          className="rounded-3xl p-8 border shadow-2xl"
          style={{
            background: "rgba(5, 46, 35, 0.58)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderColor: "rgba(52, 211, 153, 0.22)",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              <span className="text-3xl" role="img" aria-label="city">
                🏙️
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{messages.selectCity.title}</h1>
            <p className="text-sm" style={{ color: "#6ee7b7" }}>{messages.selectCity.subtitle}</p>
          </div>

          <div className="space-y-3 mb-8">
            {cities.map((city) => (
              <button
                key={city.value}
                type="button"
                onClick={() => setSelectedCity(city.value)}
                className="w-full px-4 py-3 rounded-xl border text-left font-medium transition-all duration-200"
                style={{
                  background: selectedCity === city.value ? "rgba(16, 185, 129, 0.2)" : "rgba(6, 78, 59, 0.7)",
                  borderColor: selectedCity === city.value ? "#10b981" : "rgba(52, 211, 153, 0.35)",
                  color: "#ffffff",
                }}
              >
                {city.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedCity || isLoading}
            className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.97] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 55%, #0d9488 100%)",
              color: "#ffffff",
            }}
          >
            {isLoading ? messages.selectCity.loading : messages.selectCity.continue}
          </button>
        </div>
      </div>
    </main>
  );
}
