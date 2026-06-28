"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getQrPoints,
  QrPointItem,
  RecyclingSubmissionQuantities,
  submitQrRecycling,
  SubmitQrRecyclingResponse,
} from "../../lib/qrApi";

const INITIAL_QUANTITIES: RecyclingSubmissionQuantities = {
  plastic_bottles: 0,
  glass: 0,
  paper: 0,
  metal_cans: 0,
  batteries: 0,
  electronics: 0,
  cardboard: 0,
  other_recyclable: 0,
};

export default function QrPointPage() {
  const params = useParams<{ pointId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { messages } = useLanguage();

  const [point, setPoint] = useState<QrPointItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [quantities, setQuantities] =
    useState<RecyclingSubmissionQuantities>(INITIAL_QUANTITIES);
  const [result, setResult] = useState<SubmitQrRecyclingResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      const userId = localStorage.getItem("qaitaJanaru_user_id");
      if (!userId) {
        router.push("/login");
        return;
      }

      try {
        const data = await getQrPoints();
        const matchedPoint = data.items.find(
          (item) => String(item.id) === params.pointId,
        );
        if (!matchedPoint) {
          setErrorMessage(messages.qr.pointNotFound);
          return;
        }

        setPoint(matchedPoint);
      } catch (error) {
        console.error(error);
        setErrorMessage(messages.qr.processingError);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [
    messages.qr.pointNotFound,
    messages.qr.processingError,
    params.pointId,
    router,
  ]);

  const quantityItems = useMemo(
    () =>
      [
        { key: "plastic_bottles", label: messages.qr.plasticBottles },
        { key: "glass", label: messages.qr.glass },
        { key: "paper", label: messages.qr.paper },
        { key: "metal_cans", label: messages.qr.metalCans },
        { key: "batteries", label: messages.qr.batteries },
        { key: "electronics", label: messages.qr.electronics },
        { key: "cardboard", label: messages.qr.cardboard },
        { key: "other_recyclable", label: messages.qr.otherRecyclable },
      ] as const,
    [messages.qr],
  );

  const totalItems = Object.values(quantities).reduce(
    (sum, value) => sum + value,
    0,
  );

  const updateQuantity = (
    key: keyof RecyclingSubmissionQuantities,
    delta: number,
  ) => {
    setErrorMessage("");
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const handleConfirm = async () => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    if (!point) {
      setErrorMessage(messages.qr.pointNotFound);
      return;
    }

    if (totalItems <= 0) {
      setErrorMessage(messages.qr.addAtLeastOneItem);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await submitQrRecycling(
        userId,
        point.qr_identifier,
        quantities,
      );
      if (!response.success) {
        if (
          response.message ===
          "You already submitted recycling for this location today."
        ) {
          setErrorMessage(messages.qr.alreadySubmittedToday);
        } else if (response.message === "Add at least one recycled item.") {
          setErrorMessage(messages.qr.addAtLeastOneItem);
        } else {
          setErrorMessage(response.message || messages.qr.processingError);
        }
        return;
      }

      localStorage.setItem(
        "qaitaJanaru_eco_points",
        String(response.eco_points),
      );
      setResult(response);
    } catch (error) {
      console.error(error);
      setErrorMessage(messages.qr.processingError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div
          className="w-full max-w-lg rounded-3xl p-8 border shadow-2xl"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <p className="text-base">{messages.qr.loading}</p>
        </div>
      </main>
    );
  }

  if (!point) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div
          className="w-full max-w-lg rounded-3xl p-8 border shadow-2xl space-y-4"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <h1 className="text-2xl font-bold">{messages.qr.title}</h1>
          <p style={{ color: colors.textSecondary }}>
            {errorMessage || messages.qr.pointNotFound}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-2xl font-semibold"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            {messages.qr.returnHome}
          </button>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6 py-10"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div
          className="w-full max-w-xl rounded-3xl p-8 border shadow-2xl space-y-6"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <div className="flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                color: colors.buttonText,
              }}
            >
              ✅
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{messages.qr.successTitle}</h1>
            <p style={{ color: colors.textSecondary }}>{point.name}</p>
          </div>

          <div
            className="rounded-3xl p-6 border text-center space-y-2"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
          >
            <div
              className="text-sm font-medium uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {messages.qr.youEarned}
            </div>
            <div
              className="text-4xl font-bold"
              style={{ color: colors.primary }}
            >
              +{result.total_reward}
            </div>
            <div className="text-lg font-semibold">
              {messages.qr.ecoPointsSuffix}
            </div>
          </div>

          <div className="grid gap-3">
            {[
              messages.qr.tasksUpdated,
              messages.qr.achievementsUpdated,
              messages.qr.chaptersProgressUpdated,
              messages.qr.statsUpdated,
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <span style={{ color: colors.primary }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full px-6 py-4 rounded-2xl font-semibold"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            {messages.qr.returnHome}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-6 py-8"
      style={{ background: colors.bg, color: colors.text }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div
          className="rounded-3xl p-8 border shadow-2xl space-y-6"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-3xl"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                color: colors.buttonText,
              }}
            >
              ♻️
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                {messages.qr.thankYouTitle}
              </h1>
              <p style={{ color: colors.textSecondary }}>
                {messages.qr.thankYouMessage}
              </p>
            </div>
          </div>

          <div
            className="rounded-3xl p-5 border space-y-4"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
          >
            <div
              className="text-sm font-medium uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {messages.qr.pointInformation}
            </div>
            <div className="text-2xl font-semibold">{point.name}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div
                className="flex items-start gap-3 rounded-2xl p-4 border"
                style={{ borderColor: colors.border }}
              >
                <span
                  className="mt-0.5 shrink-0"
                  style={{ color: colors.primary }}
                >
                  📍
                </span>
                <div>
                  <div
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    {messages.qr.address}
                  </div>
                  <div>{point.address}</div>
                </div>
              </div>
              <div
                className="flex items-start gap-3 rounded-2xl p-4 border"
                style={{ borderColor: colors.border }}
              >
                <span
                  className="mt-0.5 shrink-0"
                  style={{ color: colors.primary }}
                >
                  🏙️
                </span>
                <div>
                  <div
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    {messages.qr.city}
                  </div>
                  <div>{point.city}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl p-8 border shadow-2xl space-y-6"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <div>
            <h2 className="text-2xl font-bold">
              {messages.qr.whatDidYouRecycle}
            </h2>
          </div>

          <div className="grid gap-4">
            {quantityItems.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border px-4 py-4 flex items-center justify-between gap-4"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <span className="font-medium">{item.label}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.key, -1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center border"
                    style={{ borderColor: colors.border, color: colors.text }}
                    aria-label={`Decrease ${item.label}`}
                  >
                    −
                  </button>
                  <div className="min-w-10 text-center text-xl font-bold">
                    {quantities[item.key]}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.key, 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center border"
                    style={{ borderColor: colors.border, color: colors.text }}
                    aria-label={`Increase ${item.label}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

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

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full px-6 py-4 rounded-2xl font-semibold disabled:opacity-70"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            {submitting ? messages.qr.submitting : messages.qr.confirmRecycling}
          </button>
        </div>
      </div>
    </main>
  );
}
