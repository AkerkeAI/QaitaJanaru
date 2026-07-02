export const FREE_DAILY_SCAN_LIMIT = 3;
export const FREE_DAILY_ASSISTANT_LIMIT = 10;

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface DailyUsageCounts {
  scans_used_today: number;
  assistant_messages_today: number;
  last_limit_reset_date: string | null;
}

export function hasReachedScanLimit(counts: DailyUsageCounts): boolean {
  return counts.scans_used_today >= FREE_DAILY_SCAN_LIMIT;
}

export function hasReachedAssistantLimit(counts: DailyUsageCounts): boolean {
  return counts.assistant_messages_today >= FREE_DAILY_ASSISTANT_LIMIT;
}

export function getDailyUsageFromProfile(profile: {
  scans_used_today?: number;
  assistant_messages_today?: number;
  last_limit_reset_date?: string | null;
}): DailyUsageCounts {
  return {
    scans_used_today: profile.scans_used_today ?? 0,
    assistant_messages_today: profile.assistant_messages_today ?? 0,
    last_limit_reset_date: profile.last_limit_reset_date ?? null,
  };
}
