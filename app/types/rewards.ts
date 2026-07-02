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
  name: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  ecoPointsRequired: number;
  image: string;
  partnerIds: string[];
  categoryId: string;
}
