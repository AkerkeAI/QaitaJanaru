export interface BasicProfileLike {
  eco_points?: number;
  level?: number;
  streak?: number;
}

export function deriveLevel(ecoPoints: number | undefined, fallbackLevel?: number): number {
  if (typeof ecoPoints === "number") {
    return Math.max(1, Math.floor(ecoPoints / 100) + 1);
  }
  return fallbackLevel || 1;
}

export function getStatusHeaderValues(profile: BasicProfileLike | null) {
  const ecoPoints = profile?.eco_points || 0;
  const streak = profile?.streak || 0;
  const level = deriveLevel(profile?.eco_points, profile?.level);

  return { ecoPoints, streak, level };
}
