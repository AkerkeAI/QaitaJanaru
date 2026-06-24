"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { MapContainer as MapContainerType, TileLayer as TileLayerType, Marker as MarkerType, Popup as PopupType } from "react-leaflet";
import { recyclingPoints, type RecyclingPoint } from "../data/recyclingPoints";
import { translateWasteType, translateFacilityType } from "../lib/wasteTranslations";
import { buildRoute } from "../lib/recyclingSearch";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.MapContainer as any })),
  { ssr: false }
) as any as typeof MapContainerType;
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.TileLayer as any })),
  { ssr: false }
) as any as typeof TileLayerType;
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Marker as any })),
  { ssr: false }
) as any as typeof MarkerType;
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Popup as any })),
  { ssr: false }
) as any as typeof PopupType;

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const mapRef = useRef<any>(null);
  const { messages, language } = useLanguage();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams ? searchParams.get("category") : null;

  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    // Automatically request location on component mount
    requestUserLocation();
  }, [router]);

  const requestUserLocation = () => {
    setLoadingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude] as [number, number];
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
          maximumAge: 0
        }
      );
    } else {
      setLoadingLocation(false);
      if (mapRef.current) {
        mapRef.current.flyTo([48.0196, 66.9237], 5, { duration: 1 });
      }
    }
  };

  // Prepare filtered points by category for performance
  const filteredPoints = useMemo(() => {
    const c = categoryFilter ? categoryFilter.replace(/\W/g, "").toLowerCase() : null;
    const matchesCategory = (point: RecyclingPoint) => {
      if (!c) return true;
      const tokens = (point.waste_type || "").split(",").map((t) => t.replace(/\W/g, "").toLowerCase());
      return tokens.includes(c) || (c === "paper" && tokens.includes("cardboard")) || (c === "cardboard" && tokens.includes("paper"));
    };
    return recyclingPoints.filter(matchesCategory);
  }, [categoryFilter]);


  const handleFindLocation = () => {
    requestUserLocation();
  };

  // Custom glowing marker icon for user location
  const userLocationIcon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #10b981, #0d9488);
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.4);
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
  });

  // Create custom marker icon for recycling locations
  const createRecyclingMarkerIcon = (facilityType: string) => {
    const color = facilityTypeColors[facilityType as keyof typeof facilityTypeColors] || "#10b981";
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
  };

  const handleBuildRoute = buildRoute;

  // Prepare translated points
  const translatedPoints = useMemo(() => {
  return filteredPoints.map(point => ({
    ...point,
    waste_type_translated: translateWasteType(
      point.waste_type,
      language
    ),
    facility_type_translated: translateFacilityType(
      point.facility_type,
      language
    )
  }));
}, [filteredPoints, language]);

  return (
    <main className="min-h-screen text-white relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-cyan-950">
      {/* Animated background orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse delay-1000"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-green-500/5 blur-[80px] animate-pulse delay-500"></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{messages.common.appName}</h1>
          </div>

          <div className="w-12 flex-shrink-0"></div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
          
          {/* Page Title */}
          <div className="mb-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">🗺️ {messages.recyclingMap.title}</h2>
            <p className="text-emerald-300 text-sm md:text-base">{messages.recyclingMap.subtitle}</p>
          </div>

          {/* Map Container - Integrated into page */}
          <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-green-900/70 to-cyan-950/80" style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}>
            {/* Emerald glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 pointer-events-none"></div>
            {/* Map */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              {typeof window !== "undefined" && (
                <MapContainer
                  ref={mapRef}
                  center={[48.0196, 66.9237]}
                  zoom={5}
                  minZoom={5}
                  maxZoom={18}
                  maxBounds={[[40, 46], [56, 88]]}
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
                          <div className="text-emerald-100 font-semibold">
                            {messages.recyclingMap.yourLocation}
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Filtering by category (from query param) */}
                    {categoryFilter && filteredPoints.length === 0 && (
                      <div className="absolute inset-0 z-[1001] flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 text-emerald-100 px-6 py-4 rounded-xl">
                          {messages.recyclingMap.noCenterFound}
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
                            <div className="text-lg font-bold text-emerald-100 mb-1">
                              {point.name}
                            </div>
                            <div className="text-xs text-emerald-300 mb-1">
                              {messages.recyclingMap.address}:
                            </div>
                            <div className="text-sm text-emerald-200 mb-1">
                              {point.address}
                            </div>
                            <div className="text-xs text-emerald-300 mb-1">
                              {messages.recyclingMap.city}:
                            </div>
                            <div className="text-sm text-emerald-200 mb-1">
                              {point.city}
                            </div>
                            <div className="text-xs text-emerald-300 mb-2">
                              <div className="font-semibold mb-1">
                                {messages.recyclingMap.facilityType}:
                              </div>
                              <div className="px-2 py-1 rounded-full text-xs font-medium text-white inline-block" style={{
                                backgroundColor: facilityTypeColors[point.facility_type as keyof typeof facilityTypeColors] || "#10b981",
                              }}>
                                {translateFacilityType(point.facility_type, language)}
                              </div>
                            </div>
                            <div className="text-xs text-emerald-300 mb-2">
                              <div className="font-semibold mb-1">
                                {messages.recyclingMap.wasteType}:
                              </div>
                              <div className="text-xs text-emerald-100">
                                {point.waste_type_translated}
                              </div>
                            </div>
                            <div className="text-xs text-emerald-300 mb-3">
                              <div className="font-semibold mb-1">
                                {messages.recyclingMap.description}:
                              </div>
                              <div className="text-xs text-emerald-100">
                                {point.description}
                              </div>
                            </div>
                            {userLocation ? (
                              (() => {
                                // compute distance (km) and estimated time (driving)
                                const toRad = (v: number) => (v * Math.PI) / 180;
                                const R = 6371; // km
                                const dLat = toRad(point.latitude - userLocation[0]);
                                const dLon = toRad(point.longitude - userLocation[1]);
                                const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(userLocation[0])) * Math.cos(toRad(point.latitude)) * Math.sin(dLon/2) * Math.sin(dLon/2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                const distKm = R * c;
                                const avgSpeedKmh = 50; // driving
                                const estMinutes = Math.max(1, Math.round((distKm / avgSpeedKmh) * 60));

                                return (
                                  <div className="text-xs text-emerald-300 mb-3">
                                    <div className="font-semibold mb-1">{messages.recyclingMap.estimatedDistance}:</div>
                                    <div className="text-xs text-emerald-100">{distKm.toFixed(1)} km</div>
                                    <div className="font-semibold mt-2 mb-1">{messages.recyclingMap.estimatedTime}:</div>
                                    <div className="text-xs text-emerald-100">{estMinutes} min (approx)</div>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="text-xs text-emerald-300 mb-3">{messages.recyclingMap.loadingMap}</div>
                            )}
                            <button
                              className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all duration-200"
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
              <div className="absolute bottom-6 right-6 z-[1000]">
                <button
                  onClick={handleFindLocation}
                  disabled={loadingLocation}
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="absolute inset-0 pointer-events-none rounded-3xl border border-white/10 shadow-inner"></div>
            </div>
        </div>
      </div>

      {/* Custom styles for Leaflet */}
      <style jsx global>{`
        .custom-marker {
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.8));
        }
        .recycling-marker {
          filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.6));
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(5, 46, 35, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 16px;
          color: #ecfdf5;
          padding: 0;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .custom-popup .leaflet-popup-tip {
          background: rgba(5, 46, 35, 0.95);
          border: 1px solid rgba(16, 185, 129, 0.4);
        }
        .recycling-popup-card {
          padding: 16px;
          min-width: 200px;
        }
        .leaflet-container {
          background: transparent;
        }
        .leaflet-control-attribution {
          background: rgba(5, 46, 35, 0.8) !important;
          backdrop-filter: blur(8px);
          color: #6ee7b7 !important;
          font-size: 10px;
        }
        .leaflet-control-attribution a {
          color: #34d399 !important;
        }
        .leaflet-popup-close-button {
          color: #6ee7b7 !important;
          font-size: 20px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #34d399 !important;
        }
      `}</style>
    </main>
  );
}
