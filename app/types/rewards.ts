export type PartnerLevel = "Gold" | "Silver" | "Eco";

export interface PartnerLocation {
  id: string;
  address: string;
  city: string;
  distance?: number; // in km
  lat?: number;
  lng?: number;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  level: PartnerLevel;
  description?: string;
  locations: PartnerLocation[];
  phone?: string;
  website?: string;
  instagram?: string;
  stats?: {
    monthlyVisitors: number;
    rewardsRedeemedThisMonth: number;
    profileViews: number;
  };
}

export interface RewardCategory {
  id: string;
  icon: string;
  nameKey: string; // translation key
}

export interface Reward {
  id: string;
  titleKey: string; // translation key
  descriptionKey: string; // translation key
  ecoPointsRequired: number;
  image: string;
  categoryId: string;
  partnerIds: string[];
}
