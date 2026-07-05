"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { UserStatusHeader } from "@/app/components/UserStatusHeader";
import { QrHeaderAction } from "@/app/components/qr/QrHeaderAction";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { getProfile, ProfileResponse } from "@/app/lib/api";
import {
  normalizeCity,
  rewardPartners,
  rewards,
} from "@/app/lib/rewardsData";
import {
  formatEcoPointsPrice,
  getLocalizedAddress,
  getLocalizedCityName,
  getLocalizedLocationName,
  getLocalizedPartnerDescription,
  getLocalizedPartnerName,
  getLocalizedReward,
  getPartnerLevelBadge,
} from "@/app/lib/rewardsLocalization";
import { useUserLocation } from "@/app/hooks/useUserLocation";
import { calculateDistanceKm, formatDistanceLabel } from "@/app/lib/geoUtils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function PartnerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{ qrScans: number; pageVisits: number; routeRequests: number } | null>(null);
  const { messages } = useLanguage();
  const { colors } = useTheme();
  const { location: userLocation, permissionGranted } = useUserLocation({ requestOnMount: true });

  const partnerId = params.partnerId as string;
  const partner = rewardPartners.find((item) => item.id === partnerId);

  const partnerRewards = useMemo(
    () =>
      partner
        ? rewards.filter((reward) => reward.partnerIds.includes(partner.id))
        : [],
    [partner],
  );

  const loadData = useCallback(async () => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");

    if (!userId) {
      router.push("/login");
      return;
    }

    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);

      // Track page visit and fetch analytics
      if (partnerId) {
        await fetch(`${API_URL}/api/partner-qr/track-page-visit/${partnerId}`, {
          method: "POST",
        });

        const analyticsResponse = await fetch(`${API_URL}/api/partner-qr/analytics/${partnerId}`);
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router, partnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLocations = useMemo(() => {
    if (!partner) {
      return [];
    }

    if (!profile?.city) {
      return partner.locations;
    }

    return partner.locations.filter(
      (location) =>
        normalizeCity(location.city) === normalizeCity(profile.city),
    );
  }, [partner, profile?.city]);

  const handleOpenRoute = async (lat?: number, lng?: number) => {
    if (typeof lat === "number" && typeof lng === "number") {
      // Track route request
      if (partner) {
        await fetch(`${API_URL}/api/partner-qr/track-route-request/${partnerId}`, {
          method: "POST",
        });
      }
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
  };

  if (loading) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center px-4">
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

  if (!partner) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-4"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center space-y-4">
          <p className="text-lg">{messages.rewards.partnerNotFound}</p>
          <button
            onClick={() => router.push("/rewards")}
            className="px-6 py-3 rounded-xl font-bold"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            {messages.common.back}
          </button>
        </div>
      </main>
    );
  }

  const levelBadge = getPartnerLevelBadge(partner.level, messages);
  const partnerName = getLocalizedPartnerName(partner, messages);
  const partnerDescription = getLocalizedPartnerDescription(partner, messages);

  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
      <div
        className="fixed top-0 right-0 w-[500px] max-w-[100vw] h-[500px] rounded-full blur-[120px] animate-pulse pointer-events-none"
        style={{ backgroundColor: `${colors.primary}20` }}
      ></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between gap-2 sm:gap-3 p-4 md:p-6 lg:p-8 flex-shrink-0 min-w-0">
          <button
            onClick={() => router.push("/rewards")}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group flex-shrink-0"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
            aria-label={messages.common.back}
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
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {profile && (
            <div className="min-w-0 flex-shrink">
              <UserStatusHeader
                {...{
                  ecoPoints: profile.eco_points,
                  streak: profile.streak,
                  level: profile.level,
                }}
              />
            </div>
          )}

          <QrHeaderAction />
        </header>

        <div className="flex-1 px-3 sm:px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 md:space-y-8 min-w-0">
            <div
              className="rounded-3xl p-5 sm:p-8 backdrop-blur-xl border shadow-lg min-w-0"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 min-w-0">
                <div className="text-5xl sm:text-6xl md:text-7xl flex-shrink-0">
                  {partner.logo}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">
                      {partnerName}
                    </h1>
                    <div
                      className="self-start px-3 py-1 rounded-full text-sm font-bold break-words"
                      style={{
                        backgroundColor: levelBadge.backgroundColor,
                        color: levelBadge.color,
                      }}
                    >
                      {levelBadge.label}
                    </div>
                  </div>
                  <p
                    className="mb-2 font-semibold break-words"
                    style={{ color: colors.primary }}
                  >
                    {messages.rewards.officialPartner}
                  </p>
                  <p
                    className="mb-4 break-words"
                    style={{ color: colors.textSecondary }}
                  >
                    {partnerDescription}
                  </p>

                  {analytics && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                      <div className="text-center rounded-2xl p-3 border min-w-0" style={{ borderColor: colors.border }}>
                        <div className="text-xl sm:text-2xl font-bold">
                          {analytics.qrScans}
                        </div>
                        <div
                          className="text-xs sm:text-sm break-words"
                          style={{ color: colors.textSecondary }}
                        >
                          {messages.rewards.qrScans}
                        </div>
                      </div>
                      <div className="text-center rounded-2xl p-3 border min-w-0" style={{ borderColor: colors.border }}>
                        <div className="text-xl sm:text-2xl font-bold">
                          {analytics.pageVisits}
                        </div>
                        <div
                          className="text-xs sm:text-sm break-words"
                          style={{ color: colors.textSecondary }}
                        >
                          {messages.rewards.pageVisits}
                        </div>
                      </div>
                      <div className="text-center rounded-2xl p-3 border min-w-0" style={{ borderColor: colors.border }}>
                        <div className="text-xl sm:text-2xl font-bold">
                          {analytics.routeRequests}
                        </div>
                        <div
                          className="text-xs sm:text-sm break-words"
                          style={{ color: colors.textSecondary }}
                        >
                          {messages.rewards.routeRequests}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 min-w-0">
                    {partner.phone && (
                      <div className="flex items-start gap-2 min-w-0 break-words">
                        <span className="flex-shrink-0">📞</span>
                        <span className="break-all">{partner.phone}</span>
                      </div>
                    )}
                    {partner.website && (
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="flex-shrink-0">🌐</span>
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline break-all"
                          style={{ color: colors.primary }}
                        >
                          {partner.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {partnerRewards.length > 0 && (
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 break-words">
                  {messages.rewards.availableRewards}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerRewards.map((reward) => {
                    const localizedReward = getLocalizedReward(reward, messages);
                    return (
                      <div
                        key={reward.id}
                        className="group relative rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:scale-[1.01] backdrop-blur-xl border shadow-lg cursor-pointer min-w-0"
                        style={{
                          backgroundColor: colors.cardBg,
                          borderColor: colors.border,
                        }}
                        onClick={() => router.push(`/rewards/${reward.id}`)}
                      >
                        <div className="text-5xl mb-4">{reward.image}</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 break-words">
                          {localizedReward.title}
                        </h3>
                        <p
                          className="text-sm mb-4 break-words"
                          style={{ color: colors.textSecondary }}
                        >
                          {localizedReward.description}
                        </p>
                        <div
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold break-words"
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
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 break-words">
                {messages.rewards.branches}
              </h2>
              <div className="space-y-4">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-3xl p-5 sm:p-6 backdrop-blur-xl border shadow-lg min-w-0"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-lg break-words mb-1">
                          {getLocalizedLocationName(location, messages)}
                        </p>
                        <p className="break-words mb-1">
                          {getLocalizedAddress(location, messages)}
                        </p>
                        <p
                          className="text-sm break-words"
                          style={{ color: colors.textSecondary }}
                        >
                          {getLocalizedCityName(location.city, messages)}
                        </p>
                        {location.workingHours && (
                          <p
                            className="text-sm mt-2 break-words"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.rewards.workingHours}: {location.workingHours}
                          </p>
                        )}
                        {permissionGranted && userLocation && location.lat && location.lng && (
                          (() => {
                            const distance = calculateDistanceKm(
                              userLocation.lat,
                              userLocation.lng,
                              location.lat,
                              location.lng
                            );
                            return (
                              <p
                                className="text-sm mt-1 break-words"
                                style={{ color: colors.primary }}
                              >
                                {formatDistanceLabel(distance)}
                              </p>
                            );
                          })()
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleOpenRoute(location.lat, location.lng)
                        }
                        className="w-full sm:w-auto sm:flex-shrink-0 min-w-[10rem] px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                          background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                          color: colors.buttonText,
                        }}
                      >
                        {messages.rewards.buildRoute}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
