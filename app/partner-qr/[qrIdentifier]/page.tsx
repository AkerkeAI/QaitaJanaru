"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  exchangePartnerQrReward,
  getPartnerQrBranch,
  PartnerQrBranchResponse,
} from "../../lib/partnerQrApi";

export default function PartnerQrPage() {
  const params = useParams<{ qrIdentifier: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { messages } = useLanguage();

  const [branch, setBranch] = useState<PartnerQrBranchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [exchangingRewardId, setExchangingRewardId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const run = async () => {
      try {
        const response = await getPartnerQrBranch(params.qrIdentifier);
        setBranch(response);
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error && error.message === "PARTNER_QR_NOT_FOUND"
            ? messages.partnerQr.notFound
            : messages.partnerQr.processingError;
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [
    messages.partnerQr.notFound,
    messages.partnerQr.processingError,
    params.qrIdentifier,
  ]);

  const routeUrl = useMemo(() => {
    if (!branch?.lat || !branch?.lng) {
      return null;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
  }, [branch?.lat, branch?.lng]);

  const handleExchange = async (rewardId: string) => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push(`/login?next=/partner-qr/${params.qrIdentifier}`);
      return;
    }

    setErrorMessage("");
    setExchangingRewardId(rewardId);

    try {
      const receipt = await exchangePartnerQrReward(
        userId,
        params.qrIdentifier,
        rewardId,
      );
      localStorage.setItem(
        "qaitaJanaru_eco_points",
        String(receipt.eco_points_balance),
      );
      router.push(`/partner-qr/receipt/${receipt.receipt_id}`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        if (error.message === "INSUFFICIENT_ECO_POINTS") {
          setErrorMessage(messages.partnerQr.insufficientEcoPoints);
        } else if (error.message === "USER_NOT_FOUND") {
          setErrorMessage(messages.partnerQr.loginRequired);
        } else if (error.message === "PARTNER_QR_NOT_FOUND") {
          setErrorMessage(messages.partnerQr.notFound);
        } else {
          setErrorMessage(messages.partnerQr.processingError);
        }
      } else {
        setErrorMessage(messages.partnerQr.processingError);
      }
    } finally {
      setExchangingRewardId(null);
    }
  };

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div
          className="w-full max-w-xl rounded-3xl p-8 border shadow-2xl"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <p>{messages.partnerQr.loading}</p>
        </div>
      </main>
    );
  }

  if (!branch) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div
          className="w-full max-w-xl rounded-3xl p-8 border shadow-2xl space-y-4"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <h1 className="text-2xl font-bold">{messages.partnerQr.title}</h1>
          <p style={{ color: colors.textSecondary }}>
            {errorMessage || messages.partnerQr.notFound}
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="px-6 py-3 rounded-2xl font-semibold"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            {messages.common.back}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-6 md:py-8"
      style={{ background: colors.bg, color: colors.text }}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        <div
          className="rounded-3xl p-6 border shadow-2xl space-y-4"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                color: colors.buttonText,
              }}
            >
              🎁
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{branch.partner_name}</h1>
              <p style={{ color: colors.textSecondary }}>
                {messages.partnerQr.branch}: {branch.branch_name}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div
              className="rounded-2xl p-4 border"
              style={{ borderColor: colors.border }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                {messages.adminQr.address}
              </div>
              <div className="mt-1">{branch.city}</div>
              <div>{branch.address}</div>
            </div>
            <div
              className="rounded-2xl p-4 border"
              style={{ borderColor: colors.border }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                {messages.partnerQr.workingHours}
              </div>
              <div className="mt-1">
                {branch.working_hours || messages.common.unknown}
              </div>
              <div style={{ color: colors.textSecondary }}>
                {messages.partnerQr.instagram}:{" "}
                {branch.instagram || messages.common.unknown}
              </div>
            </div>
          </div>

          {routeUrl ? (
            <a
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex px-5 py-3 rounded-2xl font-semibold"
              style={{
                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                color: colors.buttonText,
              }}
            >
              {messages.partnerQr.route}
            </a>
          ) : null}
        </div>

        <div
          className="rounded-3xl p-6 border shadow-2xl space-y-4"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <h2 className="text-xl font-bold">{messages.partnerQr.availableRewards}</h2>

          {errorMessage ? (
            <div
              className="rounded-2xl px-4 py-3 border"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: "rgba(239,68,68,0.35)",
                color: "#f87171",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4">
            {branch.rewards.map((reward) => (
              <div
                key={reward.id}
                className="rounded-3xl p-5 border flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl leading-none">{reward.image}</div>
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">{reward.title}</div>
                    <div style={{ color: colors.textSecondary }}>
                      {reward.description}
                    </div>
                    <div className="font-medium">
                      {reward.eco_points_required} {messages.partnerQr.ecoPointsPrice}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleExchange(reward.id)}
                  disabled={exchangingRewardId === reward.id}
                  className="px-6 py-3 rounded-2xl font-semibold disabled:opacity-70"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                    color: colors.buttonText,
                  }}
                >
                  {exchangingRewardId === reward.id
                    ? messages.partnerQr.exchanging
                    : messages.partnerQr.exchange}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
