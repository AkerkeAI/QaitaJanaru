"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { getProfile, updateProfile } from "../lib/api";

interface DropdownOption {
  value: string;
  label: string;
}

export default function SelectCityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") || "/profile";
  const { messages } = useLanguage();
  const { colors } = useTheme();

  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const CITIES: DropdownOption[] = [
    { value: "astana", label: messages.cities.astana },
    { value: "almaty", label: messages.cities.almaty },
    { value: "shymkent", label: messages.cities.shymkent },
    { value: "aktobe", label: messages.cities.aktobe },
    { value: "atyrau", label: messages.cities.atyrau },
    { value: "aktau", label: messages.cities.aktau },
    { value: "karaganda", label: messages.cities.karaganda },
    { value: "kostanay", label: messages.cities.kostanay },
    { value: "kokshetau", label: messages.cities.kokshetau },
    { value: "kyzylorda", label: messages.cities.kyzylorda },
    { value: "pavlodar", label: messages.cities.pavlodar },
    { value: "petropavl", label: messages.cities.petropavl },
    { value: "semey", label: messages.cities.semey },
    { value: "taraz", label: messages.cities.taraz },
    { value: "taldykorgan", label: messages.cities.taldykorgan },
    { value: "turkistan", label: messages.cities.turkistan },
    { value: "uralsk", label: messages.cities.uralsk },
    { value: "ust-kamenogorsk", label: messages.cities["ust-kamenogorsk"] },
    { value: "zhezkazgan", label: messages.cities.zhezkazgan },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const storedUserId = localStorage.getItem("qaitaJanaru_user_id");
      if (!storedUserId) {
        router.push("/login");
        return;
      }
      setUserId(storedUserId);
      try {
        const profile = await getProfile(storedUserId);
        if (profile.city && profile.city !== "unknown") {
          router.push(nextPath);
          return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, nextPath]);

  const handleSave = async () => {
    if (!city || !userId) return;
    setIsSaving(true);
    setError("");
    try {
      await updateProfile(userId, { city });
      localStorage.setItem("qaitaJanaru_city", city);
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save city");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mb-6"
            style={{
              borderColor: `${colors.primary} ${colors.primary} ${colors.primary} transparent`,
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(to bottom right, #064e3b, #166534, #0f766e)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="w-full max-w-lg">
        <div
          className="relative w-full rounded-3xl border shadow-2xl overflow-hidden"
          style={{
            background: "rgba(5, 46, 35, 0.58)",
            backdropFilter: "blur(24px)",
            borderColor: "rgba(52, 211, 153, 0.22)",
          }}
        >
          <div className="px-6 sm:px-8 pt-8 pb-8">
            <div className="text-center mb-7">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
                style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
              >
                <span className="text-2xl">📍</span>
              </div>
              <h1
                className="text-3xl font-black tracking-tight mb-2"
                style={{ color: "#ffffff" }}
              >
                {messages.register.city}
              </h1>
              <p className="text-sm font-medium" style={{ color: "#6ee7b7" }}>
                {messages.register.selectCityRequired}
              </p>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 mb-4"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <p className="text-xs font-medium" style={{ color: "#fca5a5" }}>
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="max-h-80 overflow-y-auto rounded-xl border" style={{ borderColor: colors.border }}>
                {CITIES.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCity(opt.value)}
                    className="w-full px-4 py-3 text-left text-sm font-medium transition-all hover:bg-white/5 touch-manipulation"
                    style={{
                      background: city === opt.value ? "rgba(52,211,153,0.15)" : "transparent",
                      color: "#ffffff",
                      borderBottom: "1px solid rgba(52,211,153,0.1)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={!city || isSaving}
                className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.97] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 55%, #0d9488 100%)",
                  color: "#ffffff",
                }}
              >
                {isSaving ? "Saving..." : messages.profile.save || "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
