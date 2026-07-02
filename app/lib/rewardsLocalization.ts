import { Messages } from "@/app/types/messages";
import { Partner, PartnerLevel, PartnerLocation, Reward } from "@/app/types/rewards";
import { rewards } from "@/app/lib/rewardsData";

const PARTNER_QR_TO_CATALOG_REWARD_ID: Record<string, string> = {
  "partner-reward-coffee": "reward-coffee",
  "partner-reward-lemonade": "reward-lemonade",
  "partner-reward-limonade": "reward-lemonade",
  "partner-reward-bubble-tea": "reward-bubble-tea",
  "partner-reward-cocktail": "reward-cocktails",
  "partner-reward-ice-cream": "reward-ice-cream",
};

const REWARD_MESSAGE_KEYS: Record<
  string,
  { title: keyof Messages["rewards"]; description: keyof Messages["rewards"] }
> = {
  "reward-1": { title: "rewardAmericano", description: "rewardAmericanoDesc" },
  "reward-2": {
    title: "rewardEcoShopDiscount",
    description: "rewardEcoShopDiscountDesc",
  },
  "reward-3": { title: "rewardDayPass", description: "rewardDayPassDesc" },
  "reward-4": { title: "rewardPastry", description: "rewardPastryDesc" },
  "reward-coffee": { title: "rewardCoffee", description: "rewardCoffeeDesc" },
  "reward-lemonade": {
    title: "rewardLemonade",
    description: "rewardLemonadeDesc",
  },
  "reward-bubble-tea": {
    title: "rewardBubbleTea",
    description: "rewardBubbleTeaDesc",
  },
  "reward-cocktails": {
    title: "rewardCocktails",
    description: "rewardCocktailsDesc",
  },
  "reward-ice-cream": {
    title: "rewardIceCream",
    description: "rewardIceCreamDesc",
  },
};

const PARTNER_MESSAGE_KEYS: Record<
  string,
  { name: keyof Messages["rewards"]; description?: keyof Messages["rewards"] }
> = {
  "partner-1": { name: "partnerGreenCafe" },
  "partner-2": { name: "partnerEcoShop" },
  "partner-3": { name: "partnerNatureGym" },
  "partner-nagi": {
    name: "partnerNagi",
    description: "partnerNagiDesc",
  },
};

const LOCATION_MESSAGE_KEYS: Record<
  string,
  { name: keyof Messages["rewards"]; address: keyof Messages["rewards"] }
> = {
  "loc-1": {
    name: "locationGreenCafeDowntown",
    address: "addressGreenCafeDowntown",
  },
  "loc-2": {
    name: "locationGreenCafeRiverside",
    address: "addressGreenCafeRiverside",
  },
  "loc-3": {
    name: "locationEcoShopCentral",
    address: "addressEcoShopCentral",
  },
  "loc-4": {
    name: "locationNatureGymHub",
    address: "addressNatureGymHub",
  },
  "loc-nagi-1": {
    name: "locationNagiCoffeeBar",
    address: "addressNagiCoffeeBar",
  },
  "loc-nagi-2": {
    name: "locationNagimokoIce",
    address: "addressNagimokoIce",
  },
};

const PARTNER_QR_BRANCH_KEYS: Record<
  string,
  {
    branchTitle: keyof Messages["rewards"];
    partnerName: keyof Messages["rewards"];
    address: keyof Messages["rewards"];
  }
> = {
  "nagi-coffee-bar": {
    branchTitle: "locationNagiCoffeeBar",
    partnerName: "partnerNagiCoffeeBar",
    address: "addressNagiCoffeeBar",
  },
  "nagimoko-ice": {
    branchTitle: "locationNagimokoIce",
    partnerName: "partnerNagimokoIce",
    address: "addressNagimokoIce",
  },
};

export interface LocalizedText {
  title: string;
  description: string;
}

export interface PartnerLevelBadge {
  label: string;
  backgroundColor: string;
  color: string;
}

export function getCatalogRewardIdFromPartnerQr(
  partnerQrRewardId: string,
): string | null {
  return PARTNER_QR_TO_CATALOG_REWARD_ID[partnerQrRewardId] ?? null;
}

export function findCatalogRewardByPartnerQrId(
  partnerQrRewardId: string,
): Reward | undefined {
  const catalogId = getCatalogRewardIdFromPartnerQr(partnerQrRewardId);
  if (!catalogId) {
    return undefined;
  }
  return rewards.find((reward) => reward.id === catalogId);
}

export function resolvePartnerQrBranchKey(
  partnerName: string,
  branchName: string,
): string | null {
  const normalizedPartner = partnerName.trim().toLowerCase();
  const normalizedBranch = branchName.trim().toLowerCase();

  if (normalizedPartner.includes("nagi coffee")) {
    return "nagi-coffee-bar";
  }

  if (normalizedPartner.includes("nagimoko")) {
    return "nagimoko-ice";
  }

  if (
    normalizedBranch.includes("dina") ||
    normalizedBranch.includes("hypermarket")
  ) {
    return "nagi-coffee-bar";
  }

  if (
    normalizedBranch.includes("astana") ||
    normalizedBranch.includes("15th")
  ) {
    return "nagimoko-ice";
  }

  return null;
}

export function getLocalizedReward(
  reward: Pick<Reward, "id" | "title" | "description">,
  messages: Messages,
): LocalizedText {
  const keys = REWARD_MESSAGE_KEYS[reward.id];
  if (!keys) {
    return { title: reward.title, description: reward.description };
  }

  return {
    title: messages.rewards[keys.title],
    description: messages.rewards[keys.description],
  };
}

export function getLocalizedPartnerQrReward(
  partnerQrRewardId: string,
  fallbackTitle: string,
  fallbackDescription: string,
  messages: Messages,
): LocalizedText {
  const catalogReward = findCatalogRewardByPartnerQrId(partnerQrRewardId);
  if (catalogReward) {
    return getLocalizedReward(catalogReward, messages);
  }

  const catalogId = getCatalogRewardIdFromPartnerQr(partnerQrRewardId);
  if (catalogId) {
    return getLocalizedReward(
      { id: catalogId, title: fallbackTitle, description: fallbackDescription },
      messages,
    );
  }

  return { title: fallbackTitle, description: fallbackDescription };
}

export function getLocalizedPartnerName(
  partner: Pick<Partner, "id" | "name">,
  messages: Messages,
): string {
  const keys = PARTNER_MESSAGE_KEYS[partner.id];
  return keys ? messages.rewards[keys.name] : partner.name;
}

export function getLocalizedPartnerDescription(
  partner: Pick<Partner, "id" | "description">,
  messages: Messages,
): string {
  const keys = PARTNER_MESSAGE_KEYS[partner.id];
  if (keys?.description) {
    return messages.rewards[keys.description];
  }
  return partner.description || messages.rewards.defaultPartnerDescription;
}

export function getLocalizedLocationName(
  location: Pick<PartnerLocation, "id" | "name" | "address">,
  messages: Messages,
): string {
  const keys = LOCATION_MESSAGE_KEYS[location.id];
  if (keys) {
    return messages.rewards[keys.name];
  }
  return location.name || location.address;
}

export function getLocalizedAddress(
  location: Pick<PartnerLocation, "id" | "address">,
  messages: Messages,
): string {
  const keys = LOCATION_MESSAGE_KEYS[location.id];
  if (keys) {
    return messages.rewards[keys.address];
  }
  return location.address;
}

export function getLocalizedCityName(
  cityKey: string | undefined,
  messages: Messages,
): string {
  if (!cityKey) {
    return messages.common.unknown;
  }

  const normalized = cityKey.trim().toLowerCase();
  const cityMessages = messages.cities as Record<string, string>;
  return cityMessages[normalized] || cityKey;
}

export function getPartnerLevelBadge(
  level: PartnerLevel,
  messages: Messages,
): PartnerLevelBadge {
  if (level === "Gold") {
    return {
      label: messages.rewards.levelGold,
      backgroundColor: "#fbbf2420",
      color: "#fbbf24",
    };
  }

  if (level === "Silver") {
    return {
      label: messages.rewards.levelSilver,
      backgroundColor: "#9ca3af20",
      color: "#9ca3af",
    };
  }

  return {
    label: messages.rewards.levelEco,
    backgroundColor: "#10b98120",
    color: "#10b981",
  };
}

export function formatByPartner(partnerName: string, messages: Messages): string {
  return messages.rewards.byPartner.replace("{name}", partnerName);
}

export function formatDistanceAway(
  distanceKm: number,
  messages: Messages,
): string {
  return messages.rewards.distanceAway.replace(
    "{distance}",
    distanceKm.toFixed(1),
  );
}

export function formatEcoPointsPrice(
  points: number,
  messages: Messages,
): string {
  return `${points} ${messages.rewards.ecoPoints}`;
}

export function getLocalizedPartnerQrBranch(
  partnerName: string,
  branchName: string,
  fallbackAddress: string,
  messages: Messages,
): {
  branchTitle: string;
  partnerLabel: string;
  address: string;
} {
  const branchKey = resolvePartnerQrBranchKey(partnerName, branchName);
  if (!branchKey) {
    return {
      branchTitle: branchName,
      partnerLabel: formatByPartner(partnerName, messages),
      address: fallbackAddress,
    };
  }

  const keys = PARTNER_QR_BRANCH_KEYS[branchKey];
  return {
    branchTitle: messages.rewards[keys.branchTitle],
    partnerLabel: formatByPartner(messages.rewards[keys.partnerName], messages),
    address: messages.rewards[keys.address],
  };
}

export function getCatalogRewardImage(partnerQrRewardId: string): string | null {
  const catalogReward = findCatalogRewardByPartnerQrId(partnerQrRewardId);
  return catalogReward?.image ?? null;
}
