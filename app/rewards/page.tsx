"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HelpCard } from "@/app/components/HelpCard";
import { Sidebar } from "@/app/components/Sidebar";
import { UserStatusHeader } from "@/app/components/UserStatusHeader";
import { QrHeaderAction } from "@/app/components/qr/QrHeaderAction";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { getProfile, ProfileResponse } from "@/app/lib/api";
import {
  getPartnersForCity,
  getRewardProviderLocations,
  getRewardsForCity,
  rewardCategories,
} from "@/app/lib/rewardsData";
import {
  formatEcoPointsPrice,
  getLocalizedPartnerName,
  getLocalizedReward,
  getPartnerLevelBadge,
} from "@/app/lib/rewardsLocalization";

const getCategoryLabel = (categoryId: string, fallbackName: string, messages: ReturnType<typeof useLanguage>["messages"]) => {
  const labels: Record<string, string> = {
    drinks: messages.rewards.categoryDrinks,
    desserts: messages.rewards.categoryDesserts,
    food: messages.rewards.categoryFood,
    books: messages.rewards.categoryBooks,
    stationery: messages.rewards.categoryStationery,
    "eco-products": messages.rewards.categoryEcoProducts,
    clothing: messages.rewards.categoryClothing,
    entertainment: messages.rewards.categoryEntertainment,
  };

  return labels[categoryId] || fallbackName;
};

export default function RewardsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rewards" | "partners">("rewards");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
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

  const cityRewards = useMemo(
    () => getRewardsForCity(profile?.city),
    [profile?.city],
  );

  const availableCategories = useMemo(
    () =>
      rewardCategories.filter((category) =>
        cityRewards.some((reward) => reward.categoryId === category.id),
      ),
    [cityRewards],
  );

  useEffect(() => {
    if (!availableCategories.length) {
      setSelectedCategoryId("");
      return;
    }

    if (!availableCategories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, selectedCategoryId]);

  const filteredRewards = useMemo(() => {
    if (!selectedCategoryId) {
      return cityRewards;
    }

    return cityRewards.filter((reward) => reward.categoryId === selectedCategoryId);
  }, [cityRewards, selectedCategoryId]);

  const filteredPartners = useMemo(
    () => getPartnersForCity(profile?.city),
    [profile?.city],
  );

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
            {messages.rewards.loading}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
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
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 min-w-0">
            <h1 className="text-3xl font-bold break-words">{messages.rewards.title}</h1>

            <HelpCard
              title={messages.help.howToUse}
              body={messages.help.rewards}
            />

            <div className="flex gap-2 p-1 rounded-2xl min-w-0" style={{ backgroundColor: `${colors.text}10` }}>
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
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 ${
                      selectedCategoryId === category.id ? "shadow-lg" : ""
                    }`}
                    style={{
                      backgroundColor: selectedCategoryId === category.id
                        ? colors.cardBg
                        : "transparent",
                      color: selectedCategoryId === category.id
                        ? colors.primary
                        : colors.textSecondary,
                    }}
                  >
                    {getCategoryLabel(category.id, `${category.icon} ${category.name}`, messages)}
                  </button>
                ))}
              </div>
            )}

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
                    const providerLocations = getRewardProviderLocations(
                      reward,
                      profile?.city,
                    );
                    const localizedReward = getLocalizedReward(reward, messages);
                    return (
                      <div
                        key={reward.id}
                        className="group relative rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] backdrop-blur-xl border shadow-lg cursor-pointer"
                        style={{
                          backgroundColor: colors.cardBg,
                          borderColor: colors.border,
                        }}
                        onClick={() => router.push(`/rewards/${reward.id}`)}
                      >
                        <div className="text-5xl mb-4">{reward.image}</div>
                        <h3 className="text-xl font-bold mb-2 break-words">
                          {localizedReward.title}
                        </h3>
                        <p
                          className="text-sm mb-4 break-words"
                          style={{ color: colors.textSecondary }}
                        >
                          {localizedReward.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <div
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold"
                            style={{
                              backgroundColor: `${colors.primary}20`,
                              color: colors.primary,
                            }}
                          >
                            {formatEcoPointsPrice(
                              reward.ecoPointsRequired,
                              messages,
                            )}
                          </div>
                          <div className="text-sm" style={{ color: colors.textSecondary }}>
                            {messages.rewards.partnerLocationsAvailable} {providerLocations.length} {messages.rewards.branches}
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
                  filteredPartners.map((partner) => {
                    const levelBadge = getPartnerLevelBadge(
                      partner.level,
                      messages,
                    );
                    return (
                    <div
                      key={partner.id}
                      className="group relative rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] backdrop-blur-xl border shadow-lg cursor-pointer min-w-0"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      }}
                      onClick={() => router.push(`/rewards/partner/${partner.id}`)}
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="text-5xl flex-shrink-0">{partner.logo}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold mb-1 break-words">
                            {getLocalizedPartnerName(partner, messages)}
                          </h3>
                          <p className="text-sm mb-3 break-words" style={{ color: colors.textSecondary }}>
                            {messages.rewards.officialPartner}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <div
                              className="px-3 py-1 rounded-full text-xs font-bold break-words"
                              style={{
                                backgroundColor: levelBadge.backgroundColor,
                                color: levelBadge.color,
                              }}
                            >
                              {levelBadge.label}
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
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
