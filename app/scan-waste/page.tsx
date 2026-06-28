"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  WasteDetectionResult,
  ScanResponse,
  LoadingState,
} from "../types/scan";
import { SCAN_API_BASE_URL } from "../constants/scan";
import {
  findNearestRecyclingCenters,
  openExternalNavigation,
  type NearestRecyclingCenter,
} from "../lib/recyclingCenters";
import { translateWasteType } from "../lib/wasteTranslations";
import { QrHeaderAction } from "../components/qr/QrHeaderAction";
import {
  getRecyclingPoints,
  type RecyclingPoint,
} from "../lib/recyclingPointsApi";

export default function ScanWastePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [scanResult, setScanResult] = useState<WasteDetectionResult | null>(
    null,
  );
  const [scanResponse, setScanResponse] = useState<ScanResponse | null>(null);
  const [nearestCenters, setNearestCenters] = useState<
    NearestRecyclingCenter[]
  >([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [recyclingPoints, setRecyclingPoints] = useState<RecyclingPoint[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { messages, language } = useLanguage();
  const { colors } = useTheme();

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchEndX.current - touchStartX.current;
    if (diff > 50 && touchStartX.current < 50) {
      setSidebarOpen(true);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    const loadRecyclingPoints = async () => {
      try {
        const data = await getRecyclingPoints();
        setRecyclingPoints(data.items);
      } catch (loadError) {
        console.error("Failed to load recycling points:", loadError);
      }
    };

    void loadRecyclingPoints();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        () => {
          setUserLocation(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      );
    }
  }, [router]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadPhoto = () => {
    fileInputRef.current?.click();
  };

  const mapScanError = (status: number, detail?: string) => {
    if (status === 400) {
      return detail || messages.scanWaste.invalidImage;
    }
    if (status === 504) {
      return messages.scanWaste.aiTimeout;
    }
    if (status === 503) {
      if (detail && detail.toLowerCase().includes("provider")) {
        return messages.scanWaste.providerQuota;
      }
      return detail || messages.scanWaste.aiUnavailable;
    }
    if (status === 404) {
      return messages.scanWaste.userNotFound;
    }
    return detail || messages.scanWaste.scanFailed;
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError(messages.scanWaste.selectImageFirst);
      return;
    }

    setLoadingState("uploading");
    setError(null);
    setScanResult(null);
    setScanResponse(null);
    setNearestCenters([]);

    try {
      const userId = localStorage.getItem("qaitaJanaru_user_id");
      if (!userId) {
        throw new Error(messages.scanWaste.userNotFound);
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      setLoadingState("analyzing");

      const requestUrl = `${SCAN_API_BASE_URL}/scan/${userId}?language=${language}`;
      const response = await fetch(requestUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(mapScanError(response.status, errorData.detail));
      }

      setLoadingState("generating");

      const data: ScanResponse = await response.json();
      const result: WasteDetectionResult = {
        waste_type: data.waste_type,
        category: data.category,
        recycling_category: data.recycling_category,
        confidence: data.confidence,
        eco_tip: data.eco_tip,
        recycling_advice: data.recycling_advice,
        preparation_steps: data.preparation_steps || [],
        recyclable: data.recyclable,
      };

      setScanResult(result);
      setScanResponse(data);
      setNearestCenters(
        findNearestRecyclingCenters(
          recyclingPoints,
          result.recycling_category || result.category,
          userLocation,
          3,
        ),
      );

      setLoadingState("complete");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : messages.scanWaste.scanFailed,
      );
      setLoadingState("error");
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setScanResult(null);
    setScanResponse(null);
    setNearestCenters([]);
    setError(null);
    setLoadingState("idle");
  };

  const getLoadingMessage = () => {
    switch (loadingState) {
      case "uploading":
        return messages.scanWaste.uploadingImage;
      case "analyzing":
        return messages.scanWaste.analyzingWasteImage;
      case "generating":
        return messages.scanWaste.generatingRecommendations;
      default:
        return "";
    }
  };

  const recyclableLabel = useMemo(() => {
    if (!scanResult) return "";
    return scanResult.recyclable
      ? messages.scanWaste.recyclableYes
      : messages.scanWaste.recyclableNo;
  }, [
    scanResult,
    messages.scanWaste.recyclableYes,
    messages.scanWaste.recyclableNo,
  ]);

  const translatedScanResult = useMemo(() => {
    if (!scanResult) return null;

    return {
      ...scanResult,
      waste_type: translateWasteType(scanResult.waste_type, language),
      category: translateWasteType(scanResult.category, language),
      recycling_category: translateWasteType(
        scanResult.recycling_category,
        language,
      ),
    };
  }, [scanResult, language]);

  const translatedNearestCenters = useMemo(() => {
    return nearestCenters.map((center) => ({
      ...center,
      waste_type: translateWasteType(center.waste_type, language),
    }));
  }, [nearestCenters, language]);

  return (
    <main
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: colors.bg }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
        style={{ background: `${colors.primary}10` }}
      ></div>
      <div
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse delay-1000"
        style={{ background: `${colors.accent}10` }}
      ></div>
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse delay-500"
        style={{ background: `${colors.primary}05` }}
      ></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl backdrop-blur-xl hover:scale-105 transition-all duration-300 shadow-lg group flex-shrink-0"
            style={{
              background: colors.cardBg,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke={colors.textSecondary}
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => (e.currentTarget.style.stroke = colors.text)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.stroke = colors.textSecondary)
              }
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">♻️</span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {messages.scanWaste.title}
            </h1>
          </div>

          <QrHeaderAction />
        </header>

        <div className="flex-1 px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
              📸 {messages.scanWaste.title}
            </h2>
            <p
              className="text-sm md:text-base"
              style={{ color: colors.textSecondary }}
            >
              {messages.scanWaste.subtitle}
            </p>
          </div>

          {!selectedImage && loadingState === "idle" && !scanResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleTakePhoto}
                  className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-8 hover:scale-105 transition-all duration-300 shadow-lg group"
                  style={{
                    borderColor: `${colors.primary}30`,
                    borderWidth: 1,
                    background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)`,
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: `${colors.primary}20` }}
                    >
                      <span className="text-3xl">📷</span>
                    </div>
                    <div className="text-center">
                      <h3
                        className="text-lg font-semibold mb-1"
                        style={{ color: colors.text }}
                      >
                        {messages.scanWaste.takePhoto}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.takePhotoDescription}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleUploadPhoto}
                  className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-8 hover:scale-105 transition-all duration-300 shadow-lg group"
                  style={{
                    borderColor: `${colors.primary}30`,
                    borderWidth: 1,
                    background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)`,
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: `${colors.primary}20` }}
                    >
                      <span className="text-3xl">📁</span>
                    </div>
                    <div className="text-center">
                      <h3
                        className="text-lg font-semibold mb-1"
                        style={{ color: colors.text }}
                      >
                        {messages.scanWaste.uploadPhoto}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.uploadPhotoDescription}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          )}

          {selectedImage && loadingState === "idle" && !scanResult && (
            <div className="space-y-4">
              <div
                className="relative rounded-3xl overflow-hidden backdrop-blur-xl"
                style={{
                  borderColor: `${colors.primary}30`,
                  borderWidth: 1,
                  background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)`,
                }}
              >
                <img
                  src={selectedImage}
                  alt={messages.scanWaste.title}
                  className="w-full h-64 md:h-96 object-contain"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleScan}
                  className="flex-1 px-6 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg text-white font-semibold"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                  }}
                >
                  {messages.scanWaste.scanButton}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-4 rounded-2xl backdrop-blur-xl transition-all duration-300 font-semibold"
                  style={{
                    background: colors.cardBg,
                    borderColor: colors.border,
                    borderWidth: 1,
                    color: colors.textSecondary,
                  }}
                >
                  {messages.scanWaste.cancelButton}
                </button>
              </div>
            </div>
          )}

          {loadingState !== "idle" &&
            loadingState !== "complete" &&
            loadingState !== "error" && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative w-32 h-32 mb-8">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      borderColor: `${colors.primary}20`,
                      borderWidth: 4,
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-t-transparent animate-spin"
                    style={{ borderColor: colors.primary, borderWidth: 4 }}
                  ></div>
                  <div
                    className="absolute inset-4 rounded-full flex items-center justify-center"
                    style={{ background: `${colors.primary}10` }}
                  >
                    <span className="text-4xl">♻️</span>
                  </div>
                </div>
                <p
                  className="text-xl font-semibold mb-2"
                  style={{ color: colors.text }}
                >
                  {getLoadingMessage()}
                </p>
              </div>
            )}

          {translatedScanResult && loadingState === "complete" && (
            <div className="space-y-4">
              <div
                className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-6"
                style={{
                  borderColor: `${colors.primary}30`,
                  borderWidth: 1,
                  background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)`,
                }}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `${colors.primary}20` }}
                    >
                      <span className="text-2xl">♻️</span>
                    </div>
                    <div>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: colors.text }}
                      >
                        {messages.scanWaste.wasteDetected}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.aiAnalysisComplete}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.wasteType}
                      </p>
                      <p
                        className="text-lg font-semibold"
                        style={{ color: colors.text }}
                      >
                        {translatedScanResult.waste_type}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p
                          className="text-xs uppercase tracking-wider mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          {messages.scanWaste.category}
                        </p>
                        <div
                          className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            background: `${colors.primary}20`,
                            color: colors.text,
                          }}
                        >
                          {translatedScanResult.recycling_category}
                        </div>
                      </div>
                      <div>
                        <p
                          className="text-xs uppercase tracking-wider mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          {messages.scanWaste.confidence}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: colors.textSecondary }}
                        >
                          {(translatedScanResult.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-xs uppercase tracking-wider mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          {messages.scanWaste.recyclable}
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: colors.text }}
                        >
                          {recyclableLabel}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p
                        className="text-xs uppercase tracking-wider mb-2"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.preparation}
                      </p>
                      <ul className="space-y-1">
                        {translatedScanResult.preparation_steps.map(
                          (step, index) => (
                            <li
                              key={index}
                              className="text-sm flex items-start gap-2"
                              style={{ color: colors.text }}
                            >
                              <span style={{ color: colors.primary }}>•</span>
                              <span>{step}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div>
                      <p
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.recyclingInstructions}
                      </p>
                      <p className="text-sm" style={{ color: colors.text }}>
                        {translatedScanResult.recycling_advice}
                      </p>
                    </div>

                    <div>
                      <p
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.ecoTip}
                      </p>
                      <p className="text-sm" style={{ color: colors.text }}>
                        {translatedScanResult.eco_tip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {scanResponse && (
                <div
                  className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-6"
                  style={{
                    borderColor: `${colors.primary}30`,
                    borderWidth: 1,
                    background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="text-sm mb-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.pointsEarned}
                      </p>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: colors.text }}
                      >
                        +{scanResponse.total_reward}
                      </p>
                      <div
                        className="mt-3 space-y-1 text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        <div>
                          {messages.scanWaste.scanReward}: +
                          {scanResponse.scan_reward}
                        </div>
                        <div>
                          {messages.scanWaste.taskRewards}: +
                          {scanResponse.task_rewards}
                        </div>
                        {scanResponse.daily_task_rewards > 0 && (
                          <div>
                            {messages.scanWaste.dailyTaskRewards}: +
                            {scanResponse.daily_task_rewards}
                          </div>
                        )}
                        {scanResponse.weekly_task_rewards > 0 && (
                          <div>
                            {messages.scanWaste.weeklyTaskRewards}: +
                            {scanResponse.weekly_task_rewards}
                          </div>
                        )}
                        {scanResponse.auto_claimed_task_ids.length > 0 && (
                          <div>
                            {messages.scanWaste.autoBonuses}:{" "}
                            {scanResponse.auto_claimed_task_ids.length}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm mb-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.totalPoints}
                      </p>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: colors.text }}
                      >
                        {scanResponse.new_total_points}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div
                className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-6"
                style={{
                  borderColor: `${colors.accent}30`,
                  borderWidth: 1,
                  background: `linear-gradient(to bottom right, ${colors.accent}10, ${colors.primary}10, ${colors.accent}10)`,
                }}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `${colors.accent}20` }}
                    >
                      <span className="text-2xl">📍</span>
                    </div>
                    <div>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: colors.text }}
                      >
                        {messages.scanWaste.nearestRecyclingCenter}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {messages.scanWaste.recyclingCenterSubtitle}
                      </p>
                    </div>
                  </div>

                  {translatedNearestCenters.length === 0 ? (
                    <div style={{ color: colors.text }}>
                      {messages.recyclingMap.noCenterFound}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {translatedNearestCenters.map((center) => (
                        <div
                          key={center.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-black/20 p-3 rounded-lg"
                        >
                          <div>
                            <div
                              className="font-semibold"
                              style={{ color: colors.text }}
                            >
                              {center.name}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: colors.textSecondary }}
                            >
                              {center.address}, {center.city}
                            </div>
                            <div
                              className="text-xs mt-1"
                              style={{ color: colors.textSecondary }}
                            >
                              {messages.recyclingMap.acceptedMaterials}:{" "}
                              {center.waste_type}
                            </div>
                            {Number.isFinite(center.distanceKm) && (
                              <div
                                className="text-xs mt-1"
                                style={{ color: colors.accent }}
                              >
                                {center.distanceKm.toFixed(1)} km{" "}
                                {messages.scanWaste.distanceAway}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              openExternalNavigation(
                                center.latitude,
                                center.longitude,
                              )
                            }
                            className="inline-flex justify-center px-4 py-2 rounded-lg text-white text-sm font-semibold hover:scale-105 transition-all"
                            style={{
                              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                            }}
                          >
                            {messages.scanWaste.buildRoute}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg text-white font-semibold"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                  }}
                >
                  {messages.scanWaste.scanAnother}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              className="relative rounded-3xl overflow-hidden backdrop-blur-xl p-6"
              style={{
                borderColor: `${colors.danger}30`,
                borderWidth: 1,
                background: `linear-gradient(to bottom right, ${colors.danger}10, ${colors.danger}15, ${colors.danger}10)`,
              }}
            >
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${colors.danger}20` }}
                >
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <p
                    className="text-lg font-semibold mb-1"
                    style={{ color: colors.text }}
                  >
                    {messages.scanWaste.error}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    {error}
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="mt-4 w-full px-4 py-3 rounded-2xl backdrop-blur-xl transition-all duration-300 font-semibold"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.border,
                  borderWidth: 1,
                  color: colors.danger,
                }}
              >
                {messages.scanWaste.tryAgain}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
