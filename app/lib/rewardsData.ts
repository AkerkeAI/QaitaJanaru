"use client";

import { Partner, PartnerLocation, Reward, RewardCategory } from "@/app/types/rewards";

export interface RewardProviderLocation {
  partner: Partner;
  location: PartnerLocation;
}

export const normalizeCity = (value?: string | null) => value?.trim().toLowerCase() || "";

export const rewardCategories: RewardCategory[] = [
  { id: "drinks", icon: "☕", name: "Drinks" },
  { id: "desserts", icon: "🍦", name: "Desserts" },
  { id: "food", icon: "🍔", name: "Food" },
  { id: "books", icon: "📚", name: "Books" },
  { id: "stationery", icon: "✏️", name: "Stationery" },
  { id: "eco-products", icon: "🌿", name: "Eco products" },
  { id: "clothing", icon: "👕", name: "Clothing" },
  { id: "entertainment", icon: "🎉", name: "Entertainment" },
];

export const rewardPartners: Partner[] = [
  {
    id: "partner-1",
    name: "GreenCafé",
    logo: "☕",
    level: "Gold",
    locations: [
      {
        id: "loc-1",
        name: "GreenCafé Downtown",
        address: "123 Green St, Almaty",
        city: "almaty",
        workingHours: "08:00 - 22:00",
        distance: 1.2,
        lat: 43.2383,
        lng: 76.9459,
      },
      {
        id: "loc-2",
        name: "GreenCafé Riverside",
        address: "45 Eco Ave, Astana",
        city: "astana",
        workingHours: "09:00 - 22:00",
        distance: 0.8,
        lat: 51.1282,
        lng: 71.4304,
      },
    ],
    phone: "+7 (701) 123-4567",
    website: "https://greencafe.kz",
    instagram: "@greencafe.kz",
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
      {
        id: "loc-3",
        name: "EcoShop Central",
        address: "789 Zero Waste Rd, Shymkent",
        city: "shymkent",
        workingHours: "10:00 - 21:00",
        distance: 2.1,
        lat: 42.3154,
        lng: 69.5901,
      },
    ],
    phone: "+7 (725) 987-6543",
    website: "https://ecoshop.kz",
    instagram: "@ecoshop.kz",
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
      {
        id: "loc-4",
        name: "NatureGym Fitness Hub",
        address: "56 Workout Blvd, Almaty",
        city: "almaty",
        workingHours: "06:00 - 23:00",
        distance: 1.5,
        lat: 43.222,
        lng: 76.9043,
      },
    ],
    phone: "+7 (701) 555-1234",
    website: "https://naturegym.kz",
    instagram: "@naturegym.kz",
    stats: {
      monthlyVisitors: 678,
      rewardsRedeemedThisMonth: 156,
      profileViews: 432,
    },
  },
  {
    id: "partner-nagi",
    name: "Nagi Coffee & Nagimoko Ice",
    logo: "☕",
    level: "Gold",
    description:
      "This partner supports environmental initiatives and rewards users for recycling through Qaita Janaru.",
    instagram: "@nagicoffee",
    locations: [
      {
        id: "loc-nagi-1",
        name: "Nagi Coffee Bar",
        address: "33-181, Inside Dina Hypermarket, Aktau",
        city: "aktau",
        workingHours: "09:00 - 23:00",
        distance: 0.6,
        lat: 43.6522,
        lng: 51.1577,
      },
      {
        id: "loc-nagi-2",
        name: "Nagimoko Ice",
        address: "Shopping Center Astana, 14th Microdistrict, Kiosk, Aktau",
        city: "aktau",
        workingHours: "10:00 - 22:00",
        distance: 1.1,
        lat: 43.6418,
        lng: 51.1805,
      },
    ],
  },
];

export const rewards: Reward[] = [
  {
    id: "reward-1",
    title: "Free Americano",
    description: "Get a free americano at any GreenCafé location",
    ecoPointsRequired: 700,
    image: "☕",
    categoryId: "drinks",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-2",
    title: "10% Off Purchase",
    description: "Get 10% off your next purchase at EcoShop",
    ecoPointsRequired: 500,
    image: "🛍️",
    categoryId: "eco-products",
    partnerIds: ["partner-2"],
  },
  {
    id: "reward-3",
    title: "Free Day Pass",
    description: "One free day pass to NatureGym",
    ecoPointsRequired: 1000,
    image: "💪",
    categoryId: "entertainment",
    partnerIds: ["partner-3"],
  },
  {
    id: "reward-4",
    title: "Free Pastry",
    description: "Choose any free pastry at GreenCafé",
    ecoPointsRequired: 400,
    image: "🥐",
    categoryId: "desserts",
    partnerIds: ["partner-1"],
  },
  {
    id: "reward-coffee",
    title: "10% off Coffee",
    description: "Get 10% off your coffee purchase",
    ecoPointsRequired: 300,
    image: "☕",
    categoryId: "drinks",
    partnerIds: ["partner-nagi"],
  },
  {
    id: "reward-lemonade",
    title: "10% off Lemonade",
    description: "Get 10% off your lemonade purchase",
    ecoPointsRequired: 300,
    image: "🍋",
    categoryId: "drinks",
    partnerIds: ["partner-nagi"],
  },
  {
    id: "reward-bubble-tea",
    title: "10% off Bubble Tea",
    description: "Get 10% off your bubble tea purchase",
    ecoPointsRequired: 300,
    image: "🧋",
    categoryId: "drinks",
    partnerIds: ["partner-nagi"],
  },
  {
    id: "reward-cocktails",
    title: "10% off Cocktail",
    description: "Get 10% off your cocktail purchase",
    ecoPointsRequired: 300,
    image: "🍸",
    categoryId: "drinks",
    partnerIds: ["partner-nagi"],
  },
  {
    id: "reward-ice-cream",
    title: "10% off Ice Cream",
    description: "Get 10% off your ice cream purchase",
    ecoPointsRequired: 300,
    image: "🍦",
    categoryId: "desserts",
    partnerIds: ["partner-nagi"],
  },
];

export const getRewardPartners = (reward: Reward): Partner[] =>
  reward.partnerIds
    .map((partnerId) => rewardPartners.find((partner) => partner.id === partnerId))
    .filter((partner): partner is Partner => Boolean(partner));

export const getRewardsForCity = (city?: string | null): Reward[] =>
  rewards.filter((reward) => {
    if (!city) {
      return true;
    }

    return getRewardPartners(reward).some((partner) =>
      partner.locations.some(
        (location) => normalizeCity(location.city) === normalizeCity(city),
      ),
    );
  });

export const getPartnersForCity = (city?: string | null): Partner[] => {
  if (!city) {
    return rewardPartners;
  }

  return rewardPartners.filter((partner) =>
    partner.locations.some(
      (location) => normalizeCity(location.city) === normalizeCity(city),
    ),
  );
};

export const getRewardProviderLocations = (
  reward: Reward,
  city?: string | null,
): RewardProviderLocation[] =>
  getRewardPartners(reward).flatMap((partner) =>
    partner.locations
      .filter((location) =>
        city ? normalizeCity(location.city) === normalizeCity(city) : true,
      )
      .map((location) => ({
        partner,
        location,
      })),
  );
