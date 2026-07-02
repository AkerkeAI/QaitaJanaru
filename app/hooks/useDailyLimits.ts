"use client";

import { useCallback, useEffect, useState } from "react";
import { consumeAssistantUsage, getProfile, ProfileResponse } from "../lib/api";
import {
  FREE_DAILY_ASSISTANT_LIMIT,
  FREE_DAILY_SCAN_LIMIT,
  getDailyUsageFromProfile,
  getLocalDateString,
  hasReachedAssistantLimit,
  hasReachedScanLimit,
} from "../lib/dailyLimits";

export function useDailyLimits(userId: string | null) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await getProfile(userId, getLocalDateString());
      setProfile(data);
    } catch (error) {
      console.error("Failed to load daily usage limits:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const usage = getDailyUsageFromProfile(profile ?? {});

  return {
    profile,
    loading,
    usage,
    refresh,
    canScan: !hasReachedScanLimit(usage),
    canSendAssistantMessage: !hasReachedAssistantLimit(usage),
    scanLimit: FREE_DAILY_SCAN_LIMIT,
    assistantLimit: FREE_DAILY_ASSISTANT_LIMIT,
    consumeAssistantMessage: async () => {
      if (!userId) {
        throw new Error("USER_NOT_FOUND");
      }

      const result = await consumeAssistantUsage(userId, getLocalDateString());
      setProfile((current) =>
        current
          ? {
              ...current,
              scans_used_today: result.scans_used_today,
              assistant_messages_today: result.assistant_messages_today,
              last_limit_reset_date: result.last_limit_reset_date,
            }
          : current,
      );
      return result;
    },
  };
}
