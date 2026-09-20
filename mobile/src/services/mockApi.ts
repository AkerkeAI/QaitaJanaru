import { Achievement, Challenge, mockAchievements, mockChallenges, mockProfile, mockRankings, mockRewards, mockScanHistory, Profile, RankingItem, RewardItem } from './mockData';

export const mockApi = {
  getProfile: async (): Promise<Profile> => mockProfile,
  getChallenges: async (): Promise<Challenge[]> => mockChallenges,
  getRewards: async (): Promise<RewardItem[]> => mockRewards,
  getRankings: async (): Promise<RankingItem[]> => mockRankings,
  getAchievements: async (): Promise<Achievement[]> => mockAchievements,
  getScanHistory: async () => mockScanHistory,
};
