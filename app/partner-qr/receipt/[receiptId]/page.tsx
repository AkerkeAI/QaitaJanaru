"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  getPartnerQrReceipt,
  PartnerQrReceiptResponse,
} from "../../../lib/partnerQrApi";

function parseServerUtcTimestamp(value: string): Date {
  const normalizedValue =
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  return new Date(normalizedValue);
}

export default function PartnerQrReceiptPage() {
  const params = useParams<{ receiptId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { messages, language } = useLanguage();

  const [receipt, setReceipt] = useState<PartnerQrReceiptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      const userId = localStorage.getItem("qaitaJanaru_user_id");
      if (!userId) {
        router.push(`/login?next=/partner-qr/receipt/${params.receiptId}`);
        return;
      }

      try {
        const response = await getPartnerQrReceipt(params.receiptId, userId);
        setReceipt(response);
      } catch (error) {
        console.error(error);
        setErrorMessage(messages.partnerQr.processingError);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [messages.partnerQr.processingError, params.receiptId, router]);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(
        language === "ru" ? "ru-RU" : language === "kz" ? "kk-KZ" : "en-US",
        {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      ),
    [language],
  );

  const statusLabel = receipt?.is_used
    ? messages.partnerQr.receiptUsed
    : receipt?.is_expired
      ? messages.partnerQr.receiptExpired
      : messages.partnerQr.receiptValid;

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

  if (!receipt) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div
          className="w-full max-w-xl rounded-3xl p-8 border shadow-2xl space-y-4"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <h1 className="text-2xl font-bold">{messages.partnerQr.receiptTitle}</h1>
          <p style={{ color: colors.textSecondary }}>
            {errorMessage || messages.partnerQr.processingError}
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
            {messages.partnerQr.backToProfile}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: colors.bg, color: colors.text }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl p-8 border shadow-2xl space-y-6"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
      >
        <div className="text-center space-y-3">
          <div
            className="inline-flex w-20 h-20 rounded-full items-center justify-center text-4xl"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            🎟️
          </div>
          <h1 className="text-3xl font-bold">{messages.partnerQr.receiptTitle}</h1>
          <div
            className="inline-flex px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: receipt.is_valid
                ? `${colors.primary}18`
                : "rgba(239,68,68,0.12)",
              color: receipt.is_valid ? colors.primary : "#ef4444",
            }}
          >
            {statusLabel}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: colors.border }}
          >
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {messages.adminQr.partnerName}
            </div>
            <div className="mt-1 font-semibold">{receipt.partner_name}</div>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: colors.border }}
          >
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {messages.partnerQr.branch}
            </div>
            <div className="mt-1 font-semibold">{receipt.branch_name}</div>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: colors.border }}
          >
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {messages.rewards.title}
            </div>
            <div className="mt-1 font-semibold">{receipt.reward_title}</div>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: colors.border }}
          >
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {messages.partnerQr.ecoPointsPrice}
            </div>
            <div className="mt-1 font-semibold">
              {receipt.price_eco_points} {messages.partnerQr.ecoPointsPrice}
            </div>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: colors.border }}
          >
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {messages.partnerQr.issueDate}
            </div>
            <div className="mt-1 font-semibold">
              {formatter.format(parseServerUtcTimestamp(receipt.issued_at))}
            </div>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{ borderColor: colors.border }}
          >
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {messages.partnerQr.expirationTime}
            </div>
            <div className="mt-1 font-semibold">
              {formatter.format(parseServerUtcTimestamp(receipt.expires_at))}
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl p-6 border text-center text-lg font-semibold"
          style={{
            borderColor: receipt.is_valid ? colors.primary : "rgba(239,68,68,0.35)",
            color: receipt.is_valid ? colors.primary : "#ef4444",
          }}
        >
          {messages.partnerQr.receiptDescription}
        </div>

        <div
          className="rounded-2xl p-4 border"
          style={{ borderColor: colors.border }}
        >
          <div
            className="text-xs uppercase tracking-wide"
            style={{ color: colors.textSecondary }}
          >
            {messages.partnerQr.ecoPointsBalanceLabel}
          </div>
          <div className="mt-1 font-semibold">
            {receipt.eco_points_balance} {messages.partnerQr.ecoPointsPrice}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="w-full px-6 py-4 rounded-2xl font-semibold border"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            color: colors.text,
          }}
        >
          {messages.partnerQr.backToProfile}
        </button>
      </div>
    </main>
  );
}
