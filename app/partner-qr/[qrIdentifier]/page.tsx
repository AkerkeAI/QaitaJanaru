"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  exchangePartnerQrReward,
  getPartnerQrBranch,
  PartnerQrBranchResponse,
  PartnerQrRewardItem,
} from "../../lib/partnerQrApi";
import {
  findCatalogRewardByPartnerQrId,
  formatEcoPointsPrice,
  getCatalogRewardImage,
  getLocalizedCityName,
  getLocalizedPartnerQrBranch,
  getLocalizedPartnerQrReward,
  getLocalizedReward,
} from "../../lib/rewardsLocalization";
import { useUserLocation } from "../../hooks/useUserLocation";
import { calculateDistanceKm, formatDistanceLabel } from "../../lib/geoUtils";

export default function PartnerQrPage() {
  const params = useParams<{ qrIdentifier: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { messages } = useLanguage();
  const { location: userLocation, permissionGranted } = useUserLocation({ requestOnMount: true });

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

  const branchDisplay = useMemo(() => {
    if (!branch) {
      return null;
    }

    return getLocalizedPartnerQrBranch(
      branch.partner_name,
      branch.branch_name,
      branch.address,
      messages,
    );
  }, [branch, messages]);

  const distanceToBranch = useMemo(() => {
    if (!branch?.lat || !branch?.lng || !permissionGranted || !userLocation) {
      return null;
    }
    const dist = calculateDistanceKm(
      userLocation.lat,
      userLocation.lng,
      branch.lat,
      branch.lng
    );
    return formatDistanceLabel(dist);
  }, [branch?.lat, branch?.lng, permissionGranted, userLocation]);

  const routeUrl = useMemo(() => {
    if (!branch?.lat || !branch?.lng) {
      return null;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
  }, [branch?.lat, branch?.lng]);

  const getDisplayReward = (reward: PartnerQrRewardItem) => {
    const catalogReward = findCatalogRewardByPartnerQrId(reward.id);
    const localized = getLocalizedPartnerQrReward(
      reward.id,
      reward.title,
      reward.description,
      messages,
    );
    const image =
      catalogReward?.image ||
      getCatalogRewardImage(reward.id) ||
      reward.image;
    const ecoPointsRequired =
      catalogReward?.ecoPointsRequired ?? reward.eco_points_required;

    // If catalog reward exists, use its title/description instead of the API's
    if (catalogReward) {
      const catalogLocalized = getLocalizedReward(catalogReward, messages);
      return {
        title: catalogLocalized.title,
        description: catalogLocalized.description,
        image,
        ecoPointsRequired,
      };
    }

    return {
      ...localized,
      image,
      ecoPointsRequired,
    };
  };

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
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-x-hidden"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div
          className="w-full max-w-xl rounded-3xl p-6 sm:p-8 border shadow-2xl min-w-0"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <p>{messages.partnerQr.loading}</p>
        </div>
      </main>
    );
  }

  if (!branch || !branchDisplay) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-x-hidden"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div
          className="w-full max-w-xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-4 min-w-0"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <h1 className="text-xl sm:text-2xl font-bold break-words">
            {messages.partnerQr.title}
          </h1>
          <p className="break-words" style={{ color: colors.textSecondary }}>
            {errorMessage || messages.partnerQr.notFound}
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-semibold"
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
      className="min-h-screen px-3 sm:px-4 py-5 sm:py-8 overflow-x-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
      <div className="max-w-4xl mx-auto space-y-4 min-w-0">
        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-2xl space-y-4 min-w-0"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                color: colors.buttonText,
              }}
            >
              🎁
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold break-words">
                {branchDisplay.branchTitle}
              </h1>
              <p
                className="text-sm sm:text-base break-words"
                style={{ color: colors.textSecondary }}
              >
                {branchDisplay.partnerLabel}
              </p>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 min-w-0">
              <div
                className="rounded-2xl p-4 border min-w-0"
                style={{ borderColor: colors.border }}
              >
                <div
                  className="text-xs uppercase tracking-wide"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.adminQr.address}
                </div>
                <div className="mt-1 break-words">
                  {getLocalizedCityName(branch.city, messages)}
                </div>
                <div className="break-words">{branchDisplay.address}</div>
                {distanceToBranch && (
                  <div className="mt-2 font-semibold" style={{ color: colors.primary }}>
                    {distanceToBranch}
                  </div>
                )}
              </div>
              <div
                className="rounded-2xl p-4 border min-w-0"
                style={{ borderColor: colors.border }}
              >
                <div
                  className="text-xs uppercase tracking-wide"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.partnerQr.workingHours}
                </div>
                <div className="mt-1 break-words">
                  {branch.working_hours || messages.common.unknown}
                </div>
                {branch.instagram ? (
                  <div className="break-words">
                    <a 
                      href={`https://instagram.com/${branch.instagram.replace('@', '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: colors.primary }}
                    >
                      @{branch.instagram.replace('@', '')}
                    </a>
                  </div>
                ) : null}
                {branch.phone ? (
                  <div className="break-words">
                    <a 
                      href={`tel:${branch.phone}`} 
                      style={{ color: colors.primary }}
                    >
                      {branch.phone}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

          {routeUrl ? (
            <a
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full sm:w-auto justify-center px-5 py-3 rounded-2xl font-semibold text-center"
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
          className="rounded-3xl p-5 sm:p-6 border shadow-2xl space-y-4 min-w-0"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <h2 className="text-lg sm:text-xl font-bold break-words">
            {messages.partnerQr.availableRewards}
          </h2>

          {errorMessage ? (
            <div
              className="rounded-2xl px-4 py-3 border break-words"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: "rgba(239,68,68,0.35)",
                color: "#f87171",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 min-w-0">
            {branch.rewards.map((reward) => {
              const displayReward = getDisplayReward(reward);

              return (
                <div
                  key={reward.id}
                  className="rounded-3xl p-4 sm:p-5 border flex flex-col gap-4 min-w-0"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="text-3xl sm:text-4xl leading-none flex-shrink-0">
                      {displayReward.image}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-base sm:text-lg font-semibold break-words">
                        {displayReward.title}
                      </div>
                      <div
                        className="break-words text-sm sm:text-base"
                        style={{ color: colors.textSecondary }}
                      >
                        {displayReward.description}
                      </div>
                      <div className="font-medium break-words">
                        {formatEcoPointsPrice(
                          displayReward.ecoPointsRequired,
                          messages,
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleExchange(reward.id)}
                    disabled={exchangingRewardId === reward.id}
                    className="w-full sm:w-auto sm:self-end min-w-[10rem] px-6 py-3 rounded-2xl font-semibold disabled:opacity-70"
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
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-semibold border"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            {messages.partnerQr.backToProfile}
          </button>
        </div>
      </div>
    </main>
  );
}
