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

export default function RewardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { messages } = useLanguage();
  const { colors } = useTheme();

  const rewardId = params.rewardId as string;
  const reward = SAMPLE_REWARDS.find(r => r.id === rewardId);

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

  if (!reward) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center">
          <p className="text-lg mb-4">Reward not found</p>
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

  const rewardPartners = getRewardPartners(reward);
  const partnerLocations = rewardPartners.flatMap(p => 
    profile?.city 
      ? p.locations.filter(loc => loc.city === profile.city) 
      : p.locations
  );

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
              <div className="text-7xl mb-6">{reward.image}</div>
              <h1 className="text-3xl font-bold mb-4">{reward.title}</h1>
              <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
                {reward.description}
              </p>
              <div
                className="inline-flex items-center gap-1 px-4 py-3 rounded-2xl text-lg font-bold"
                style={{
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary,
                }}
              >
                {reward.ecoPointsRequired} {messages.tasks.points}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">{messages.rewards.whereToRedeem}</h2>
              <div className="space-y-4">
                {partnerLocations.map((location) => {
                  const partner = rewardPartners.find(p => 
                    p.locations.some(l => l.id === location.id)
                  )!;
                  return (
                    <div
                      key={location.id}
                      className="rounded-3xl p-6 backdrop-blur-xl border shadow-lg"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{partner.logo}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{partner.name}</h3>
                          <p className="mb-2" style={{ color: colors.textSecondary }}>
                            {location.address}
                          </p>
                          {location.distance && (
                            <p className="text-sm mb-4" style={{ color: colors.primary }}>
                              {location.distance.toFixed(1)} km away
                            </p>
                          )}
                          <button
                            className="px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                            style={{
                              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                              color: colors.buttonText,
                            }}
                          >
                            {messages.rewards.route}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
