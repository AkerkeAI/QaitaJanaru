"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { WasteDetectionResult, ScanResponse, LoadingState } from "../types/scan";
import { SCAN_API_BASE_URL } from "../constants/scan";
import {
  findNearestRecyclingCenters,
  openExternalNavigation,
  type NearestRecyclingCenter,
} from "../lib/recyclingCenters";
import { translateWasteType } from "../lib/wasteTranslations";

export default function ScanWastePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [scanResult, setScanResult] = useState<WasteDetectionResult | null>(null);
  const [scanResponse, setScanResponse] = useState<ScanResponse | null>(null);
  const [nearestCenters, setNearestCenters] = useState<NearestRecyclingCenter[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { messages, language } = useLanguage();

  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setUserLocation(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
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
      return "User not found";
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
        throw new Error("User not found");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      setLoadingState("analyzing");

      const requestUrl = `${SCAN_API_BASE_URL}/scan/${userId}?language=${language}`;
      console.log("SCAN REQUEST URL:", requestUrl);
      console.log("SCAN REQUEST PAYLOAD (file):", selectedFile.name, selectedFile.size, selectedFile.type);

      const response = await fetch(requestUrl, {
        method: "POST",
        body: formData,
      });

      console.log("SCAN RESPONSE STATUS:", response.status, response.statusText);

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
        findNearestRecyclingCenters(result.recycling_category || result.category, userLocation, 3)
      );

      localStorage.setItem("qaitaJanaru_eco_points", data.new_total_points.toString());
      localStorage.setItem(
        "qaitaJanaru_total_scans",
        (parseInt(localStorage.getItem("qaitaJanaru_total_scans") || "0", 10) + 1).toString()
      );

      setLoadingState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : messages.scanWaste.scanFailed);
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
    return scanResult.recyclable ? messages.scanWaste.recyclableYes : messages.scanWaste.recyclableNo;
  }, [scanResult, messages.scanWaste.recyclableYes, messages.scanWaste.recyclableNo]);

  const translatedScanResult = useMemo(() => {
    if (!scanResult) return null;
    
    // Translate waste types
    const translatedWasteType = translateWasteType(scanResult.waste_type, language);
    const translatedCategory = translateWasteType(scanResult.category, language);
    const translatedRecyclingCategory = translateWasteType(scanResult.recycling_category, language);
    
    // Translate fallback messages
    const translatedEcoTip = scanResult.eco_tip === "Uncertain material. Check local recycling rules or dispose safely."
      ? messages.scanWaste.uncertainMaterial
      : scanResult.eco_tip;
      
    const translatedRecyclingAdvice = scanResult.recycling_advice === "Check local recycling rules before disposal."
      ? messages.scanWaste.checkLocalRulesBeforeDisposal
      : scanResult.recycling_advice;
      
    const translatedPreparationSteps = scanResult.preparation_steps.map(step => {
      if (step === "Check local recycling rules") return messages.scanWaste.checkLocalRules;
      if (step === "Keep the item clean and dry") return messages.scanWaste.keepCleanDry;
      if (step === "Ask staff at a recycling center") return messages.scanWaste.askStaff;
      return step;
    });
    
    return {
      ...scanResult,
      waste_type: translatedWasteType,
      category: translatedCategory,
      recycling_category: translatedRecyclingCategory,
      eco_tip: translatedEcoTip,
      recycling_advice: translatedRecyclingAdvice,
      preparation_steps: translatedPreparationSteps,
    };
  }, [scanResult, language, messages.scanWaste]);

  const translatedNearestCenters = useMemo(() => {
    return nearestCenters.map(center => ({
      ...center,
      waste_type: translateWasteType(center.waste_type, language),
    }));
  }, [nearestCenters, language]);

  return (
    <main className="min-h-screen text-white relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-cyan-950">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse delay-1000"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-green-500/5 blur-[80px] animate-pulse delay-500"></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 shadow-lg group flex-shrink-0"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 text-emerald-300 group-hover:text-white transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">♻️</span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{messages.scanWaste.title}</h1>
          </div>

          <div className="w-12 flex-shrink-0"></div>
        </header>

        <div className="flex-1 px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">📸 {messages.scanWaste.title}</h2>
            <p className="text-emerald-300 text-sm md:text-base">{messages.scanWaste.subtitle}</p>
          </div>

          {!selectedImage && loadingState === "idle" && !scanResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleTakePhoto}
                  className="relative rounded-3xl overflow-hidden border border-emerald-500/30 backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-green-900/70 to-cyan-950/80 p-8 hover:scale-105 transition-all duration-300 shadow-lg group"
                >
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                      <span className="text-3xl">📷</span>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-emerald-100 mb-1">{messages.scanWaste.takePhoto}</h3>
                      <p className="text-sm text-emerald-300">{messages.scanWaste.takePhotoDescription}</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleUploadPhoto}
                  className="relative rounded-3xl overflow-hidden border border-emerald-500/30 backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-green-900/70 to-cyan-950/80 p-8 hover:scale-105 transition-all duration-300 shadow-lg group"
                >
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                      <span className="text-3xl">📁</span>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-emerald-100 mb-1">{messages.scanWaste.uploadPhoto}</h3>
                      <p className="text-sm text-emerald-300">{messages.scanWaste.uploadPhotoDescription}</p>
                    </div>
                  </div>
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
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
              <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-green-900/70 to-cyan-950/80">
                <img src={selectedImage} alt="Selected waste" className="w-full h-64 md:h-96 object-contain" />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleScan}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 text-white font-semibold"
                >
                  {messages.scanWaste.scanButton}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 text-emerald-300 font-semibold"
                >
                  {messages.scanWaste.cancelButton}
                </button>
              </div>
            </div>
          )}

          {loadingState !== "idle" && loadingState !== "complete" && loadingState !== "error" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                <div className="absolute inset-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-4xl">♻️</span>
                </div>
              </div>
              <p className="text-xl font-semibold text-emerald-100 mb-2">{getLoadingMessage()}</p>
            </div>
          )}

          {translatedScanResult && loadingState === "complete" && (
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-green-900/70 to-cyan-950/80 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-2xl">♻️</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-emerald-100">{messages.scanWaste.wasteDetected}</h3>
                      <p className="text-sm text-emerald-300">{messages.scanWaste.aiAnalysisComplete}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">{messages.scanWaste.wasteType}</p>
                      <p className="text-lg font-semibold text-emerald-100">{translatedScanResult.waste_type}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">{messages.scanWaste.category}</p>
                        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-sm font-medium">
                          {translatedScanResult.recycling_category}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">{messages.scanWaste.confidence}</p>
                        <p className="text-sm text-emerald-200">{(translatedScanResult.confidence * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">{messages.scanWaste.recyclable}</p>
                        <p className="text-sm font-semibold text-emerald-100">{recyclableLabel}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-emerald-300 uppercase tracking-wider mb-2">{messages.scanWaste.preparation}</p>
                      <ul className="space-y-1">
                        {translatedScanResult.preparation_steps.map((step, index) => (
                          <li key={index} className="text-sm text-emerald-200 flex items-start gap-2">
                            <span className="text-emerald-400">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">{messages.scanWaste.recyclingInstructions}</p>
                      <p className="text-sm text-emerald-200">{translatedScanResult.recycling_advice}</p>
                    </div>

                    <div>
                      <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1">{messages.scanWaste.ecoTip}</p>
                      <p className="text-sm text-emerald-200">{translatedScanResult.eco_tip}</p>
                    </div>
                  </div>
                </div>
              </div>

              {scanResponse && (
                <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-green-900/70 to-cyan-950/80 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-300 mb-1">{messages.scanWaste.pointsEarned}</p>
                      <p className="text-2xl font-bold text-emerald-100">+{scanResponse.earned_points}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-emerald-300 mb-1">{messages.scanWaste.totalPoints}</p>
                      <p className="text-2xl font-bold text-emerald-100">{scanResponse.new_total_points}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 backdrop-blur-xl bg-gradient-to-br from-cyan-950/80 via-blue-900/70 to-cyan-950/80 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-2xl">📍</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-emerald-100">{messages.scanWaste.nearestRecyclingCenter}</h3>
                      <p className="text-sm text-emerald-300">{messages.scanWaste.recyclingCenterSubtitle}</p>
                    </div>
                  </div>

                  {translatedNearestCenters.length === 0 ? (
                    <div className="text-emerald-200">{messages.recyclingMap.noCenterFound}</div>
                  ) : (
                    <div className="space-y-3">
                      {translatedNearestCenters.map((center) => (
                        <div key={center.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-black/10 p-4 rounded-lg">
                          <div>
                            <div className="font-semibold text-emerald-100">{center.name}</div>
                            <div className="text-sm text-emerald-300">{center.address}, {center.city}</div>
                            <div className="text-xs text-emerald-300 mt-1">
                              {messages.recyclingMap.acceptedMaterials}: {center.waste_type}
                            </div>
                            {Number.isFinite(center.distanceKm) && (
                              <div className="text-xs text-cyan-200 mt-1">
                                {center.distanceKm.toFixed(1)} km {messages.scanWaste.distanceAway}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => openExternalNavigation(center.latitude, center.longitude)}
                            className="inline-flex justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all"
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
                  className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 text-white font-semibold"
                >
                  {messages.scanWaste.scanAnother}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="relative rounded-3xl overflow-hidden border border-red-500/30 backdrop-blur-xl bg-gradient-to-br from-red-950/80 via-red-900/70 to-red-950/80 p-6">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-100 mb-1">{messages.scanWaste.error}</p>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="mt-4 w-full px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 text-red-300 font-semibold"
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
