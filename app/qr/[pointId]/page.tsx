"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { claimQrReward, getQrPoints, QrPointItem } from "../../lib/qrApi";

export default function QrPointPage() {
  const params = useParams<{ pointId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { messages } = useLanguage();
  const [point, setPoint] = useState<QrPointItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const userId = localStorage.getItem("qaitaJanaru_user_id");
      if (!userId) {
        router.push("/login");
        return;
      }

      try {
        const data = await getQrPoints();
        const matchedPoint = data.items.find((item) => String(item.id) === params.pointId);
        if (!matchedPoint) {
          setMessage("QR point not found");
          setLoading(false);
          return;
        }

        setPoint(matchedPoint);
        const claimResult = await claimQrReward(userId, matchedPoint.qr_identifier);
        setClaimed(claimResult.success);
        setMessage(claimResult.success ? `+${claimResult.total_reward} Eco Points` : claimResult.message);

        if (claimResult.success) {
          localStorage.setItem("qaitaJanaru_eco_points", String(claimResult.eco_points));
        }
      } catch (error) {
        console.error(error);
        setMessage("Failed to process QR code");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [params.pointId, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: colors.bg, color: colors.text }}>
      <div className="w-full max-w-lg rounded-3xl p-8 border shadow-2xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
        <h1 className="text-3xl font-bold mb-4">QR</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold">{point?.name || "Unknown point"}</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>{point?.address}</div>
            </div>
            <div className="text-xl font-bold" style={{ color: claimed ? colors.primary : colors.text }}>{message}</div>
            <button
              type="button"
              onClick={() => router.push("/recycling-map")}
              className="px-6 py-3 rounded-2xl font-semibold"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`, color: colors.buttonText }}
            >
              {messages.recyclingMap.title}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
