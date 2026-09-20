export type RewardItem = {
  id: string;
  title: string;
  points: number;
  category: string;
  partner: string;
  titleKey?: string;
};

export type RankingItem = {
  id: string;
  name: string;
  city: string;
  points: number;
  rank: number;
  badge: string;
};

export type Profile = {
  name: string;
  avatar: null;
  city: string | null;
  profession: string | null;
  institution: string | null;
  ecoPoints: number;
  level: string | null;
  rank: number | null;
  achievements: string[];
  impact: {
    itemsRecycled: number;
    kilogramsRecycled: number;
    co2ImpactKg: number;
  };
};

export type Challenge = {
  id: string;
  title: string;
  progress: number;
  total: number;
  reward: number;
  titleKey?: string;
};

export type Achievement = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: 'scan-outline' | 'leaf-outline' | 'repeat-outline' | 'flame-outline' | 'flag-outline' | 'compass-outline' | 'star-outline';
  unlocked: boolean;
  progress?: string;
};

export const mockProfile: Profile = {
  name: 'Akerke',
  avatar: null,
  city: null,
  profession: null,
  institution: null,
  ecoPoints: 1240,
  level: 'Eco Explorer',
  rank: 14,
  achievements: [],
  impact: { itemsRecycled: 18, kilogramsRecycled: 6.4, co2ImpactKg: 11.2 },
};

export const mockAchievements: Achievement[] = [
  { id: 'first-scan', titleKey: 'achievements.firstScan', descriptionKey: 'achievements.firstScanDescription', icon: 'scan-outline', unlocked: true },
  { id: 'recycling-rookie', titleKey: 'achievements.rookie', descriptionKey: 'achievements.rookieDescription', icon: 'leaf-outline', unlocked: true },
  { id: 'ten-items', titleKey: 'achievements.tenItems', descriptionKey: 'achievements.tenItemsDescription', icon: 'repeat-outline', unlocked: true },
  { id: 'weekly-streak', titleKey: 'achievements.weekly', descriptionKey: 'achievements.weeklyDescription', icon: 'flame-outline', unlocked: false, progress: '3/7 days' },
  { id: 'challenge-finisher', titleKey: 'achievements.finisher', descriptionKey: 'achievements.finisherDescription', icon: 'flag-outline', unlocked: false, progress: '1/3 challenges' },
  { id: 'eco-explorer', titleKey: 'achievements.explorer', descriptionKey: 'achievements.explorerDescription', icon: 'compass-outline', unlocked: false, progress: '1,240/1,500 pts' },
  { id: 'thousand-points', titleKey: 'achievements.thousand', descriptionKey: 'achievements.thousandDescription', icon: 'star-outline', unlocked: true },
];

export const mockChallenges: Challenge[] = [
  { id: '1', title: 'Scan 5 items this week', titleKey: 'home.challengeScan', progress: 3, total: 5, reward: 150 },
  { id: '2', title: 'Recycle 2 plastic bottles', titleKey: 'home.challengeBottles', progress: 1, total: 2, reward: 100 },
  { id: '3', title: 'Visit a sorting point', titleKey: 'home.challengePoint', progress: 0, total: 1, reward: 200 },
];

export const mockRewards: RewardItem[] = [
  { id: '1', title: 'Eco coffee voucher', titleKey: 'rewards.coffee', points: 250, category: 'Food', partner: 'Green Cafe' },
  { id: '2', title: 'Public transport bonus', titleKey: 'rewards.transport', points: 400, category: 'Transport', partner: 'City Transit' },
  { id: '3', title: 'Reusable bottle', titleKey: 'rewards.bottle', points: 600, category: 'Goods', partner: 'Eco Market' },
  { id: '4', title: 'Bookstore discount', titleKey: 'rewards.bookstore', points: 350, category: 'Education', partner: 'ReadHub' },
];

export const mockRankings: RankingItem[] = [
  { id: '1', name: 'Aidana', city: 'Astana', points: 2400, rank: 1, badge: '1' },
  { id: '2', name: 'Maksat', city: 'Almaty', points: 2280, rank: 2, badge: '2' },
  { id: '3', name: 'Akerke', city: 'Astana', points: 1240, rank: 14, badge: '14' },
  { id: '4', name: 'Temir', city: 'Karaganda', points: 1100, rank: 18, badge: '18' },
];

export const mockScanHistory = [
  { id: '1', label: 'Plastic bottle', time: 'Today, 15:20', points: 40 },
  { id: '2', label: 'Cardboard box', time: 'Yesterday, 19:10', points: 35 },
  { id: '3', label: 'Glass jar', time: 'Mon, 10:30', points: 50 },
];
