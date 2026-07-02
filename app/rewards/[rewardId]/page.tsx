"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { UserStatusHeader } from "@/app/components/UserStatusHeader";
import { QrHeaderAction } from "@/app/components/qr/QrHeaderAction";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { getProfile, ProfileResponse } from "@/app/lib/api";
import { getRewardProviderLocations, rewards } from "@/app/lib/rewardsData";
import {
  formatByPartner,
  formatEcoPointsPrice,
  getLocalizedAddress,
  getLocalizedCityName,
  getLocalizedLocationName,
  getLocalizedPartnerName,
  getLocalizedReward,
  getPartnerLevelBadge,
} from "@/app/lib/rewardsLocalization";

export default function RewardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { messages } = useLanguage();
  const { colors } = useTheme();

  const rewardId = params.rewardId as string;
  const reward = rewards.find((item) => item.id === rewardId);

  const providerLocations = useMemo(
    () => (reward ? getRewardProviderLocations(reward, profile?.city) : []),
    [profile?.city, reward],
  );

  const localizedReward = reward
    ? getLocalizedReward(reward, messages)
    : null;

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

  const handleOpenRoute = useCallback((lat?: number, lng?: number) => {
    if (typeof lat !== "number" || typeof lng !== "number") {
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

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

  if (!reward || !localizedReward) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-4"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{messages.rewards.rewardNotFound}</h2>
          <button
            onClick={() => router.push("/rewards")}
            className="px-6 py-3 rounded-xl font-semibold"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            {messages.rewards.backToRewards}
          </button>
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
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group flex-shrink-0"
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

          {profile && (
            <UserStatusHeader
              {...{
                ecoPoints: profile.eco_points,
                streak: profile.streak,
                level: profile.level,
              }}
            />
          )}

          <QrHeaderAction />
        </header>

        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 min-w-0">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                color: colors.textSecondary,
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {messages.common.back}
            </button>

            <div className="flex flex-col sm:flex-row items-start gap-4 min-w-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}40, ${colors.accent}40)`,
                }}
              >
                {reward.image}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold break-words">
                  {localizedReward.title}
                </h1>
                <p
                  className="break-words"
                  style={{ color: colors.textSecondary }}
                >
                  {localizedReward.description}
                </p>
              </div>
            </div>

            <div
              className="inline-flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl border max-w-full"
              style={{
                backgroundColor: `${colors.primary}20`,
                borderColor: colors.border,
              }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: colors.textSecondary }}
              >
                {messages.rewards.priceLabel}
              </span>
              <span className="text-lg font-bold break-words" style={{ color: colors.primary }}>
                {formatEcoPointsPrice(reward.ecoPointsRequired, messages)}
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold">
                {messages.rewards.availablePartners}
              </h2>

              {providerLocations.length === 0 ? (
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
                providerLocations.map(({ partner, location }) => {
                  const levelBadge = getPartnerLevelBadge(
                    partner.level,
                    messages,
                  );
                  const branchName = getLocalizedLocationName(
                    location,
                    messages,
                  );
                  const partnerName = getLocalizedPartnerName(
                    partner,
                    messages,
                  );

                  return (
                    <div
                      key={`${partner.id}-${location.id}`}
                      className="rounded-3xl p-5 sm:p-6 backdrop-blur-xl border shadow-lg min-w-0"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4 mb-4 min-w-0">
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}20)`,
                          }}
                        >
                          {partner.logo}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl sm:text-2xl font-bold break-words">
                            {branchName}
                          </h3>
                          <p
                            className="text-sm sm:text-base break-words"
                            style={{ color: colors.textSecondary }}
                          >
                            {formatByPartner(partnerName, messages)}
                          </p>
                          <span
                            className="inline-block px-2 py-1 rounded-full text-xs font-bold mt-2 break-words"
                            style={{
                              backgroundColor: levelBadge.backgroundColor,
                              color: levelBadge.color,
                            }}
                          >
                            {levelBadge.label}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4 min-w-0">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: colors.textSecondary }}
                        >
                          {messages.rewards.address}
                        </span>
                        <p className="break-words">
                          {getLocalizedAddress(location, messages)}
                        </p>
                        <p
                          className="text-sm break-words"
                          style={{ color: colors.textSecondary }}
                        >
                          {getLocalizedCityName(location.city, messages)}
                        </p>
                      </div>

                      {partner.instagram && (
                        <div className="mb-4 min-w-0">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.rewards.instagram}
                          </span>
                          <p className="text-lg break-words">{partner.instagram}</p>
                        </div>
                      )}

                      {location.workingHours && (
                        <div className="mb-4 min-w-0">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.rewards.workingHours}
                          </span>
                          <p className="break-words">{location.workingHours}</p>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          handleOpenRoute(location.lat, location.lng)
                        }
                        className="w-full sm:w-auto min-w-[10rem] py-3 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                          background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                          color: colors.buttonText,
                        }}
                      >
                        {messages.rewards.buildRoute}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
