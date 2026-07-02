"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type {
  MapContainer as MapContainerType,
  TileLayer as TileLayerType,
  Marker as MarkerType,
  Popup as PopupType,
} from "react-leaflet";
import {
  getRecyclingPoints,
  type RecyclingPoint,
} from "../lib/recyclingPointsApi";
import {
  translateWasteType,
  translateFacilityType,
} from "../lib/wasteTranslations";
import { HelpCard } from "../components/HelpCard";
import { QrHeaderAction } from "../components/qr/QrHeaderAction";
import { buildRoute } from "../lib/recyclingSearch";
import { UserStatusHeader } from "../components/UserStatusHeader";
import { getStatusHeaderValues } from "../lib/profileHelpers";
import { getProfile, ProfileResponse } from "../lib/api";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () =>
    import("react-leaflet").then((mod) => ({
      default: mod.MapContainer as any,
    })),
  { ssr: false },
) as any as typeof MapContainerType;
const TileLayer = dynamic(
  () =>
    import("react-leaflet").then((mod) => ({ default: mod.TileLayer as any })),
  { ssr: false },
) as any as typeof TileLayerType;
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Marker as any })),
  { ssr: false },
) as any as typeof MarkerType;
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Popup as any })),
  { ssr: false },
) as any as typeof PopupType;

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Facility type colors
const facilityTypeColors = {
  "Collection Point": "#3b82f6", // Blue
  "Sorting Station": "#f97316", // Orange
  "Recycling Plant": "#10b981", // Green
  "Hazardous Disposal": "#ef4444", // Red
};

export default function RecyclingMapPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [recyclingPoints, setRecyclingPoints] = useState<RecyclingPoint[]>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<any>(null);
  const { messages, language } = useLanguage();
  const { theme, colors } = useTheme();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams ? searchParams.get("category") : null;

  // Swipe gesture refs
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

  const requestUserLocation = () => {
    setLoadingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [
            position.coords.latitude,
            position.coords.longitude,
          ] as [number, number];
          setUserLocation(location);
          setLoadingLocation(false);

          if (mapRef.current) {
            mapRef.current.flyTo(location, 13, { duration: 1.5 });
          }
        },
        () => {
          setLoadingLocation(false);
          if (mapRef.current) {
            mapRef.current.flyTo([48.0196, 66.9237], 5, { duration: 1 });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      setLoadingLocation(false);
      if (mapRef.current) {
        mapRef.current.flyTo([48.0196, 66.9237], 5, { duration: 1 });
      }
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    void getProfile(userId)
      .then(setProfile)
      .catch((error) => console.error("Failed to load profile header:", error));

    const loadRecyclingPoints = async () => {
      try {
        const data = await getRecyclingPoints();
        setRecyclingPoints(data.items);
      } catch (error) {
        console.error("Failed to load recycling points:", error);
      }
    };

    void loadRecyclingPoints();
    setTimeout(() => {
      requestUserLocation();
    }, 0);
  }, [router]);

  // Prepare filtered points by category for performance
  const filteredPoints = useMemo(() => {
    const c = categoryFilter
      ? categoryFilter.replace(/\W/g, "").toLowerCase()
      : null;
    const matchesCategory = (point: RecyclingPoint) => {
      if (!c) return true;
      const tokens = (point.waste_type || "")
        .split(",")
        .map((t) => t.replace(/\W/g, "").toLowerCase());
      return (
        tokens.includes(c) ||
        (c === "paper" && tokens.includes("cardboard")) ||
        (c === "cardboard" && tokens.includes("paper"))
      );
    };
    return recyclingPoints.filter(matchesCategory);
  }, [categoryFilter, recyclingPoints]);

  const handleFindLocation = () => {
    requestUserLocation();
  };

  // Custom glowing marker icon for user location
  const userLocationIcon = useMemo(
    () =>
      L.divIcon({
        className: "custom-marker",
        html: `
      <div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, ${colors.primary}, ${colors.accent});
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 20px ${colors.primary}cc, 0 0 40px ${colors.primary}66;
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      </style>
    `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [colors.primary, colors.accent],
  );

  // Create custom marker icon for recycling locations
  const createRecyclingMarkerIcon = useMemo(
    () => (facilityType: string) => {
      const color =
        facilityTypeColors[facilityType as keyof typeof facilityTypeColors] ||
        colors.primary;
      return L.divIcon({
        className: "recycling-marker",
        html: `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, ${color}, ${color}dd);
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 15px ${color}80, 0 0 30px ${color}40;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        ">♻️</div>
      `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    },
    [colors.primary],
  );

  const handleBuildRoute = buildRoute;

  // Prepare translated points
  const translatedPoints = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return filteredPoints
      .map((point) => ({
        ...point,
        waste_type_translated: translateWasteType(point.waste_type, language),
        facility_type_translated: translateFacilityType(
          point.facility_type,
          language,
        ),
      }))
      .filter((point) => {
        if (!normalizedQuery) return true;

        const searchableText = [
          point.name,
          point.address,
          point.city,
          point.waste_type,
          point.waste_type_translated,
          point.facility_type,
          point.facility_type_translated,
          point.description,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      });
  }, [filteredPoints, language, searchQuery]);

  return (
    <main
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{ background: colors.bg }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background orbs */}
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
        {/* Header */}
        <header className="flex items-center justify-between gap-3 p-4 md:p-6 lg:p-8 flex-shrink-0">
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

          <UserStatusHeader {...getStatusHeaderValues(profile)} />

          <QrHeaderAction />
        </header>

        {/* Content Area */}
        <div className="flex-1 px-3 sm:px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8 min-w-0">
          <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 min-w-0">
            <HelpCard
              title={messages.help.howToUse}
              body={messages.help.recyclingMap}
            />

            <div
              className="rounded-2xl border backdrop-blur-xl shadow-lg min-w-0"
            style={{
              background: colors.cardBg,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                style={{ color: colors.textSecondary }}
              >
                <path d="m21 21-4.35-4.35" />
                <circle cx="11" cy="11" r="6" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={messages.recyclingMap.searchPlaceholder}
                className="w-full bg-transparent outline-none text-sm md:text-base placeholder:opacity-100"
                style={{
                  color: colors.text,
                }}
              />
            </div>
          </div>

          {/* Map Container - Integrated into page */}
          <div
            className="relative rounded-3xl overflow-hidden backdrop-blur-xl min-w-0"
            style={{
              height: "min(52vh, calc(100dvh - 280px))",
              minHeight: "280px",
              maxHeight: "560px",
              borderColor: `${colors.primary}30`,
              borderWidth: 1,
              background: `linear-gradient(to bottom right, ${colors.primary}10, ${colors.primaryDark}10, ${colors.accent}10)`,
            }}
          >
            {/* Theme glow effect */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: `linear-gradient(to right, ${colors.primary}10, ${colors.accent}10, ${colors.primary}10)`,
              }}
            ></div>
            {/* Map */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              {typeof window !== "undefined" && (
                <MapContainer
                  ref={mapRef}
                  center={[48.0196, 66.9237]}
                  zoom={5}
                  minZoom={5}
                  maxZoom={18}
                  maxBounds={[
                    [40, 46],
                    [56, 88],
                  ]}
                  maxBoundsViscosity={1.0}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    // Dark themed basemap for eco look
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {userLocation && (
                    <Marker position={userLocation} icon={userLocationIcon}>
                      <Popup className="custom-popup">
                        <div
                          className="font-semibold"
                          style={{ color: colors.text }}
                        >
                          {messages.recyclingMap.yourLocation}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Filtering by category/search */}
                  {translatedPoints.length === 0 && (
                    <div className="absolute inset-0 z-[1001] flex items-center justify-center pointer-events-none">
                      <div
                        className="bg-black/60 px-6 py-4 rounded-xl"
                        style={{ color: colors.text }}
                      >
                        {searchQuery.trim()
                          ? messages.recyclingMap.noSearchResults
                          : messages.recyclingMap.noCenterFound}
                      </div>
                    </div>
                  )}

                  {translatedPoints.map((point) => (
                    <Marker
                      key={point.id}
                      position={[point.latitude, point.longitude]}
                      icon={createRecyclingMarkerIcon(point.facility_type)}
                    >
                      <Popup
                        className="custom-popup"
                        position={[point.latitude, point.longitude]}
                      >
                        <div className="recycling-popup-card">
                          <div
                            className="text-lg font-bold mb-1"
                            style={{ color: colors.text }}
                          >
                            {point.name}
                          </div>
                          <div
                            className="text-xs mb-1"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.recyclingMap.address}:
                          </div>
                          <div
                            className="text-sm mb-1"
                            style={{ color: colors.text }}
                          >
                            {point.address}
                          </div>
                          <div
                            className="text-xs mb-1"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.recyclingMap.city}:
                          </div>
                          <div
                            className="text-sm mb-1"
                            style={{ color: colors.text }}
                          >
                            {point.city}
                          </div>
                          <div
                            className="text-xs mb-2"
                            style={{ color: colors.textSecondary }}
                          >
                            <div className="font-semibold mb-1">
                              {messages.recyclingMap.facilityType}:
                            </div>
                            <div
                              className="px-2 py-1 rounded-full text-xs font-medium text-white inline-block"
                              style={{
                                backgroundColor:
                                  facilityTypeColors[
                                    point.facility_type as keyof typeof facilityTypeColors
                                  ] || colors.primary,
                              }}
                            >
                              {translateFacilityType(
                                point.facility_type,
                                language,
                              )}
                            </div>
                          </div>
                          <div
                            className="text-xs mb-2"
                            style={{ color: colors.textSecondary }}
                          >
                            <div className="font-semibold mb-1">
                              {messages.recyclingMap.wasteType}:
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: colors.text }}
                            >
                              {point.waste_type_translated}
                            </div>
                          </div>
                          <div
                            className="text-xs mb-3"
                            style={{ color: colors.textSecondary }}
                          >
                            <div className="font-semibold mb-1">
                              {messages.recyclingMap.description}:
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: colors.text }}
                            >
                              {point.description}
                            </div>
                          </div>
                          {userLocation ? (
                            (() => {
                              // compute distance (km) and estimated time (driving)
                              const toRad = (v: number) => (v * Math.PI) / 180;
                              const R = 6371; // km
                              const dLat = toRad(
                                point.latitude - userLocation[0],
                              );
                              const dLon = toRad(
                                point.longitude - userLocation[1],
                              );
                              const a =
                                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                Math.cos(toRad(userLocation[0])) *
                                  Math.cos(toRad(point.latitude)) *
                                  Math.sin(dLon / 2) *
                                  Math.sin(dLon / 2);
                              const c =
                                2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                              const distKm = R * c;
                              const avgSpeedKmh = 50; // driving
                              const estMinutes = Math.max(
                                1,
                                Math.round((distKm / avgSpeedKmh) * 60),
                              );

                              return (
                                <div
                                  className="text-xs mb-3"
                                  style={{ color: colors.textSecondary }}
                                >
                                  <div className="font-semibold mb-1">
                                    {messages.recyclingMap.estimatedDistance}:
                                  </div>
                                  <div
                                    className="text-xs"
                                    style={{ color: colors.text }}
                                  >
                                    {distKm.toFixed(1)} km
                                  </div>
                                  <div className="font-semibold mt-2 mb-1">
                                    {messages.recyclingMap.estimatedTime}:
                                  </div>
                                  <div
                                    className="text-xs"
                                    style={{ color: colors.text }}
                                  >
                                    {estMinutes} min (approx)
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div
                              className="text-xs mb-3"
                              style={{ color: colors.textSecondary }}
                            >
                              {messages.recyclingMap.loadingMap}
                            </div>
                          )}
                          <button
                            className="w-full px-3 py-2 rounded-lg text-white text-sm font-semibold transition-all duration-200"
                            style={{
                              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                            }}
                            onClick={() => handleBuildRoute(point)}
                          >
                            {messages.recyclingMap.buildRoute}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>

            {/* Find My Location Button */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-[1000] pb-[env(safe-area-inset-bottom,0px)]">
              <button
                onClick={handleFindLocation}
                disabled={loadingLocation}
                className="p-3 sm:p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})`,
                }}
                aria-label={messages.recyclingMap.findLocation}
              >
                {loadingLocation ? (
                  <svg
                    className="w-6 h-6 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Glass overlay for futuristic effect */}
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl"
              style={{ borderColor: colors.border, borderWidth: 1 }}
            ></div>
          </div>
          </div>
        </div>
      </div>

      {/* Custom styles for Leaflet */}
      <style jsx global>{`
        .custom-marker {
          filter: drop-shadow(0 0 10px ${colors.primary}cc);
        }
        .recycling-marker {
          filter: drop-shadow(0 0 8px ${colors.primary}99);
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: ${colors.cardBg};
          backdrop-filter: blur(16px);
          border: 1px solid ${colors.border};
          border-radius: 16px;
          color: ${colors.text};
          padding: 0;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .custom-popup .leaflet-popup-tip {
          background: ${colors.cardBg};
          border: 1px solid ${colors.border};
        }
        .recycling-popup-card {
          padding: 12px;
          min-width: 0;
          max-width: min(280px, calc(100vw - 48px));
          max-height: min(60vh, 420px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .leaflet-container {
          background: transparent;
        }
        .leaflet-bottom.leaflet-right {
          margin-bottom: 4.5rem;
          margin-right: 0.5rem;
        }
        .leaflet-bottom.leaflet-left {
          margin-bottom: 1rem;
          margin-left: 0.5rem;
        }
        .leaflet-top.leaflet-left,
        .leaflet-top.leaflet-right {
          margin-top: 0.5rem;
        }
        .leaflet-control-zoom {
          border: none !important;
        }
        .leaflet-control-attribution {
          background: ${colors.cardBg}cc !important;
          backdrop-filter: blur(8px);
          color: ${colors.textSecondary} !important;
          font-size: 10px;
        }
        .leaflet-control-attribution a {
          color: ${colors.primary} !important;
        }
        .leaflet-popup-close-button {
          color: ${colors.textSecondary} !important;
          font-size: 20px !important;
        }
        .leaflet-popup-close-button:hover {
          color: ${colors.primary} !important;
        }
      `}</style>
    </main>
  );
}
