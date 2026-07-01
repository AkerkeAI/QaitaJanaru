"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { UserStatusHeader } from "@/app/components/UserStatusHeader";
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

export default function PartnerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { messages } = useLanguage();
  const { colors } = useTheme();

  const partnerId = params.partnerId as string;
  const partner = SAMPLE_PARTNERS.find(p => p.id === partnerId);

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

  const getPartnerRewards = (partner: Partner) => {
    return SAMPLE_REWARDS.filter((reward) => reward.partnerIds.includes(partner.id));
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

  if (!partner) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center">
          <p className="text-lg mb-4">Partner not found</p>
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

  const partnerRewards = getPartnerRewards(partner);
  const filteredLocations = profile?.city
    ? partner.locations.filter(loc => loc.city === profile.city)
    : partner.locations;

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
        <header className="flex items-center gap-3 p-4 md:p-6 lg:p-8 flex-shrink-0">
          <button
            onClick={() => router.push("/rewards")}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
            aria-label="Go back"
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

          {profile && <div className="ml-auto"><UserStatusHeader {...{ ecoPoints: profile.eco_points, streak: profile.streak, level: profile.level }} /></div>}
        </header>

        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div
              className="rounded-3xl p-8 backdrop-blur-xl border shadow-lg"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-start gap-6">
                <div className="text-7xl">{partner.logo}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{partner.name}</h1>
                    <div
                      className="px-3 py-1 rounded-full text-sm font-bold"
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
                  </div>
                  <p className="mb-4" style={{ color: colors.textSecondary }}>
                    {messages.rewards.officialPartner}
                  </p>
                  {partner.stats && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{partner.stats.monthlyVisitors}</div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          {messages.rewards.monthlyVisitors}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{partner.stats.rewardsRedeemedThisMonth}</div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          {messages.rewards.rewardsRedeemedThisMonth}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{partner.stats.profileViews}</div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          {messages.rewards.profileViews}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4">
                    {partner.phone && (
                      <div className="flex items-center gap-2">
                        <span>📞</span>
                        <span>{partner.phone}</span>
                      </div>
                    )}
                    {partner.website && (
                      <div className="flex items-center gap-2">
                        <span>🌐</span>
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
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
              <div>
                <h2 className="text-2xl font-bold mb-6">{messages.rewards.availableRewards}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerRewards.map((reward) => (
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
                      <h3 className="text-xl font-bold mb-2">{reward.title}</h3>
                      <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                        {reward.description}
                      </p>
                      <div
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: `${colors.primary}20`,
                          color: colors.primary,
                        }}
                      >
                        {reward.ecoPointsRequired} {messages.tasks.points}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold mb-6">{messages.rewards.branches}</h2>
              <div className="space-y-4">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-3xl p-6 backdrop-blur-xl border shadow-lg"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium mb-1">{location.address}</p>
                        {location.distance && (
                          <p className="text-sm" style={{ color: colors.primary }}>
                            {location.distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                      <button
                        className="px-4 py-2 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                          background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                          color: colors.buttonText,
                        }}
                      >
                        {messages.rewards.route}
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
