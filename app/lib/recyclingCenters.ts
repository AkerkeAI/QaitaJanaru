import { recyclingPoints, type RecyclingPoint } from "../data/recyclingPoints";
import { emitTaskEvent } from "./taskEvents";

export interface NearestRecyclingCenter {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  waste_type: string;
  distanceKm: number;
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  plastic: ["plastic"],
  glass: ["glass"],
  paper: ["paper", "cardboard"],
  cardboard: ["cardboard", "paper"],
  metal: ["metal", "aluminum"],
  aluminum: ["aluminum", "metal"],
  organic: ["organic"],
  ewaste: [
    "ewaste",
    "electronics",
    "ewaste",
    "battery",
    "batteries",
    "hazardous",
  ],
  battery: ["hazardous", "battery", "batteries"],
  mixed: ["plastic", "paper", "cardboard", "metal", "glass"],
  unknown: [],
};

function normalizeToken(value: string): string {
  return value.replace(/\W/g, "").toLowerCase();
}

function categoryTokens(category: string): string[] {
  const normalized = normalizeToken(category);
  return CATEGORY_ALIASES[normalized] ?? [normalized];
}

function pointAcceptsCategory(
  point: RecyclingPoint,
  category: string,
): boolean {
  const wanted = categoryTokens(category);
  if (wanted.length === 0) {
    return true;
  }

  const accepted = (point.waste_type || "")
    .split(",")
    .map((token) => normalizeToken(token));

  return wanted.some((token) => accepted.includes(token));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function findNearestRecyclingCenters(
  category: string,
  userLocation: [number, number] | null,
  limit = 3,
): NearestRecyclingCenter[] {
  const filtered = recyclingPoints.filter((point) =>
    pointAcceptsCategory(point, category),
  );

  const withDistance = filtered.map((point) => ({
    id: point.id,
    name: point.name,
    address: point.address,
    city: point.city,
    latitude: point.latitude,
    longitude: point.longitude,
    waste_type: point.waste_type,
    distanceKm: userLocation
      ? calculateDistanceKm(
          userLocation[0],
          userLocation[1],
          point.latitude,
          point.longitude,
        )
      : Number.POSITIVE_INFINITY,
  }));

  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  return withDistance.slice(0, limit);
}

export function openExternalNavigation(
  latitude: number,
  longitude: number,
): void {
  emitTaskEvent("map_visit");
  emitTaskEvent("route_open");

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const twoGisUrl = `https://2gis.kz/search/${latitude},${longitude}`;
  const navigationWindow = window.open(
    googleMapsUrl,
    "_blank",
    "noopener,noreferrer",
  );

  if (!navigationWindow) {
    window.location.href = twoGisUrl;
  }
}
