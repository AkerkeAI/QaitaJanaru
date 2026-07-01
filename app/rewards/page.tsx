"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { UserStatusHeader } from "@/app/components/UserStatusHeader";
import { QrHeaderAction } from "@/app/components/qr/QrHeaderAction";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { getProfile, ProfileResponse } from "@/app/lib/api";
import { Reward, Partner } from "@/app/types/rewards";

const SAMPLE_PARTNERS: Partner[] = [
  {
    id: "partner-1",
    name: "GreenCafé",
    logo: "☕",
    level: "Gold",
    locations: [
      { id: "loc-1", address: "123 Green St, Almaty", city: "almaty", distance: 1.2 },
      { id: "loc-2", address: "45 Eco Ave, Astana", city: "astana", distance: 0.8 },
    ],
    phone: "+7 (701) 123-4567",
    website: "https://greencafe.kz",
    stats: {
      monthlyVisitors: 1240,
      rewardsRedeemedThisMonth: 342,
      profileViews: 892,
    },
  },
  {
    id: "partner-2",
    name: "EcoShop",
    logo: "🛒",
    level: "Silver",
    locations: [
      { id: "loc-3", address: "789 Zero Waste Rd, Shymkent", city: "shymkent", distance: 2.1 },
    ],
    phone: "+7 (725) 987-6543",
    website: "https://ecoshop.kz",
    stats: {
      monthlyVisitors: 856,
      rewardsRedeemedThisMonth: 210,
      profileViews: 543,
    },
  },
  {
    id: "partner-3",
    name: "NatureGym",
    logo: "🏋️",
    level: "Eco",
    locations: [
      { id: "loc-4", address: "56 Workout Blvd, Almaty", city: "almaty", distance: 1.5 },
    ],
    phone: "+7 (701) 555-1234",
    website: "https://naturegym.kz",
    stats: {
      monthlyVisitors: 678,
      rewardsRedeemedThisMonth: 156,
      profileViews: 432,
    },
  },
];

const SAMPLE_REWARDS: Reward[] = [
  {
    id: "reward-1",
    title: "Free Americano",
    description: "Get a free americano at any GreenCafé location",
    ecoPointsRequired: 700,
    image: "☕",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-2",
    title: "10% Off Purchase",
    description: "Get 10% off your next purchase at EcoShop",
    ecoPointsRequired: 500,
    image: "🛍️",
    partnerIds: ["partner-2"],
  },
  {
    id: "reward-3",
    title: "Free Day Pass",
    description: "One free day pass to NatureGym",
    ecoPointsRequired: 1000,
    image: "💪",
    partnerIds: ["partner-3"],
  },
  {
    id: "reward-4",
    title: "Free Pastry",
    description: "Choose any free pastry at GreenCafé",
    ecoPointsRequired: 400,
    image: "🥐",
    partnerIds: ["partner-1"],
  },
];

export default function RewardsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rewards" | "partners">("rewards");
  const { messages } = useLanguage();
  const { colors } = useTheme();

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

  const filteredRewards = profile?.city
    ? SAMPLE_REWARDS.filter((reward) => {
        const rewardPartners = SAMPLE_PARTNERS.filter((p) =>
          reward.partnerIds.includes(p.id)
        );
        return rewardPartners.some((p) =>
          p.locations.some((loc) => loc.city === profile.city)
        );
      })
    : SAMPLE_REWARDS;

  const filteredPartners = profile?.city
    ? SAMPLE_PARTNERS.filter((partner) =>
        partner.locations.some((loc) => loc.city === profile.city)
      )
    : SAMPLE_PARTNERS;

  const getRewardPartners = (reward: Reward) => {
    return SAMPLE_PARTNERS.filter((p) => reward.partnerIds.includes(p.id));
  };

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
            <h1 className="text-3xl font-bold">{messages.rewards.title}</h1>

            <div className="flex gap-2 p-1 rounded-2xl" style={{ backgroundColor: `${colors.text}10` }}>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "rewards" ? "shadow-lg" : ""
                }`}
                style={{
                  backgroundColor: activeTab === "rewards" ? colors.cardBg : "transparent",
                  color: activeTab === "rewards" ? colors.primary : colors.textSecondary,
                }}
              >
                {messages.rewards.tabRewards}
              </button>
              <button
                onClick={() => setActiveTab("partners")}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === "partners" ? "shadow-lg" : ""
                }`}
                style={{
                  backgroundColor: activeTab === "partners" ? colors.cardBg : "transparent",
                  color: activeTab === "partners" ? colors.primary : colors.textSecondary,
                }}
              >
                {messages.rewards.tabPartners}
              </button>
            </div>

            {activeTab === "rewards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRewards.length === 0 ? (
                  <div
                    className="col-span-full rounded-3xl p-8 text-center backdrop-blur-xl border"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="text-5xl mb-4">🎁</div>
                    <p style={{ color: colors.textSecondary }}>{messages.rewards.noRewardsAvailable}</p>
                  </div>
                ) : (
                  filteredRewards.map((reward) => {
                    const rewardPartners = getRewardPartners(reward);
                    return (
                      <div
                        key={reward.id}
                        className="group relative rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] backdrop-blur-xl border shadow-lg"
                        style={{
                          backgroundColor: colors.cardBg,
                          borderColor: colors.border,
                        }}
                      >
                        <div className="text-5xl mb-4">{reward.image}</div>
                        <h3 className="text-xl font-bold mb-2">{reward.title}</h3>
                        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                          {reward.description}
                        </p>
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold"
                            style={{
                              backgroundColor: `${colors.primary}20`,
                              color: colors.primary,
                            }}
                          >
                            {reward.ecoPointsRequired} {messages.tasks.points}
                          </div>
                          <div className="text-sm" style={{ color: colors.textSecondary }}>
                            {messages.rewards.partnerLocationsAvailable} {rewardPartners.length} {messages.rewards.branches}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/rewards/${reward.id}`)}
                          className="w-full py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                          style={{
                            background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                            color: colors.buttonText,
                          }}
                        >
                          {messages.rewards.viewReward}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "partners" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPartners.length === 0 ? (
                  <div
                    className="col-span-full rounded-3xl p-8 text-center backdrop-blur-xl border"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="text-5xl mb-4">🤝</div>
                    <p style={{ color: colors.textSecondary }}>{messages.rewards.noPartnersAvailable}</p>
                  </div>
                ) : (
                  filteredPartners.map((partner) => (
                    <div
                      key={partner.id}
                      className="group relative rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] backdrop-blur-xl border shadow-lg cursor-pointer"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      }}
                      onClick={() => router.push(`/rewards/partner/${partner.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-5xl">{partner.logo}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{partner.name}</h3>
                          <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                            {messages.rewards.officialPartner}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <div
                              className="px-3 py-1 rounded-full text-xs font-bold"
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
                            </div>
                            <div
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${colors.text}10`,
                                color: colors.textSecondary,
                              }}
                            >
                              {partner.locations.length} {messages.rewards.branches}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
