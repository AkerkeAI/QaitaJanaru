"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { UserStatusHeader } from "@/app/components/UserStatusHeader";
import { QrHeaderAction } from "@/app/components/qr/QrHeaderAction";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { getProfile, ProfileResponse } from "@/app/lib/api";
import {
  Reward,
  Partner,
  PartnerLocation,
} from "@/app/types/rewards";

// Sample data
const SAMPLE_PARTNERS: Partner[] = [
  {
    id: "partner-1",
    name: "Nagi Coffee Bar",
    logo: "☕",
    level: "Gold",
    locations: [
      {
        id: "loc-1",
        address: "33-181\nInside Dina Hypermarket",
        city: "Aktau",
      },
    ],
    instagram: "@nagicoffee",
  },
  {
    id: "partner-2",
    name: "Nagimoko Ice",
    logo: "🍦",
    level: "Silver",
    locations: [
      {
        id: "loc-2",
        address: "Shopping Center Astana\n14th Microdistrict\nKiosk",
        city: "Aktau",
      },
    ],
    instagram: "@nagimokoice",
  },
];

const SAMPLE_REWARDS: Reward[] = [
  {
    id: "reward-coffee",
    titleKey: "rewardCoffee",
    descriptionKey: "rewardCoffeeDesc",
    ecoPointsRequired: 300,
    image: "☕",
    categoryId: "drinks",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-lemonade",
    titleKey: "rewardLemonade",
    descriptionKey: "rewardLemonadeDesc",
    ecoPointsRequired: 300,
    image: "🍋",
    categoryId: "drinks",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-bubbletea",
    titleKey: "rewardBubbleTea",
    descriptionKey: "rewardBubbleTeaDesc",
    ecoPointsRequired: 300,
    image: "🧋",
    categoryId: "drinks",
    partnerIds: ["partner-2"],
  },
  {
    id: "reward-cocktails",
    titleKey: "rewardCocktails",
    descriptionKey: "rewardCocktailsDesc",
    ecoPointsRequired: 300,
    image: "🍸",
    categoryId: "drinks",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-icecream",
    titleKey: "rewardIceCream",
    descriptionKey: "rewardIceCreamDesc",
    ecoPointsRequired: 300,
    image: "🍦",
    categoryId: "desserts",
    partnerIds: ["partner-2"],
  },
];

export default function RewardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { messages } = useLanguage();
  const { colors } = useTheme();

  const rewardId = params.rewardId as string;
  const reward = SAMPLE_REWARDS.find((r) => r.id === rewardId);

  const partners = reward
    ? reward.partnerIds
        .map((pid) => SAMPLE_PARTNERS.find((p) => p.id === pid))
        .filter((p): p is Partner => p !== undefined)
    : [];

  // Filter partners to show only those with locations in user's city
  const availablePartners = profile?.city
    ? partners.filter((partner) =>
        partner.locations.some((loc) => loc.city === profile.city)
      )
    : partners;

  // Helper to get translated text
  const getMessage = (key: string) => {
    return (messages.rewards as any)[key] || key;
  };

  const loadData = useCallback(async () => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");

    if (!userId) {
      router.push("/login");
      return;
    }

    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
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
          ></div>
          <p className="text-lg" style={{ color: colors.textSecondary }}>
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!reward) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Reward not found</h2>
          <button
            onClick={() => router.push("/rewards")}
            className="px-6 py-3 rounded-xl font-semibold"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            Back to rewards
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
        style={{ backgroundColor: `${colors.primary}20` }}
      ></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between gap-3 p-4 md:p-6 lg:p-8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 group-hover:text-white transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke={colors.textSecondary}
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {profile && <UserStatusHeader {...{ ecoPoints: profile.eco_points, streak: profile.streak, level: profile.level }} />}

          <QrHeaderAction />
        </header>

        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                color: colors.textSecondary,
              }}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>

            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-6xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}40, ${colors.accent}40)`,
                }}
              >
                {reward.image}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getMessage(reward.titleKey)}</h1>
                <p style={{ color: colors.textSecondary }}>
                  {getMessage(reward.descriptionKey)}
                </p>
              </div>
            </div>

            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border"
              style={{
                backgroundColor: `${colors.primary}20`,
                borderColor: colors.border,
              }}
            >
              <span className="text-lg font-bold" style={{ color: colors.primary }}>
                {reward.ecoPointsRequired} {messages.tasks.points}
              </span>
              <span style={{ color: colors.textSecondary }}>{messages.rewards.cost}</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold">{messages.rewards.availablePartners}</h2>

              {availablePartners.length === 0 ? (
                <div
                  className="rounded-3xl p-8 text-center backdrop-blur-xl border"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  }}
                >
                  <p style={{ color: colors.textSecondary }}>
                    {messages.rewards.noPartnersForReward}
                  </p>
                </div>
              ) : (
                availablePartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="rounded-3xl p-6 backdrop-blur-xl border shadow-lg"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}20)`,
                        }}
                      >
                        {partner.logo}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{partner.name}</h3>
                        <span
                          className="inline-block px-2 py-1 rounded-full text-xs font-bold mt-1"
                          style={{
                            backgroundColor:
                              partner.level === "Gold"
                                ? "#fbbf2420"
                                : partner.level === "Silver"
                                ? "#9ca3af20"
                                : `${colors.primary}20`,
                            color:
                              partner.level === "Gold"
                                ? "#fbbf24"
                                : partner.level === "Silver"
                                ? "#9ca3af"
                                : colors.primary,
                          }}
                        >
                          {partner.level}
                        </span>
                      </div>
                    </div>

                    {partner.locations.map((location) => (
                      <div
                        key={location.id}
                        className="mb-4"
                      >
                        <div className="mb-2">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.rewards.address}
                          </span>
                          <p className="whitespace-pre-line">{location.address}</p>
                        </div>
                        {location.city && (
                          <div className="mb-4">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: colors.textSecondary }}
                            >
                              City
                            </span>
                            <p>{location.city}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {partner.instagram && (
                      <div className="mb-4">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: colors.textSecondary }}
                        >
                          {messages.rewards.instagram}
                        </span>
                        <p className="text-lg">{partner.instagram}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        className="flex-1 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                          background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                          color: colors.buttonText,
                        }}
                      >
                        {messages.rewards.buildRoute}
                      </button>
                      <button
                        className="flex-1 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 border"
                        style={{
                          borderColor: colors.border,
                          color: colors.primary,
                        }}
                      >
                        {messages.rewards.redeemReward}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
