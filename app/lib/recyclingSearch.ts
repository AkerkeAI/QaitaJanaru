import type { RecyclingPoint } from "./recyclingPointsApi";
import { emitTaskEvent } from "./taskEvents";

const materialKeywords: Record<string, string[]> = {
  Plastic: [
    "plastic",
    "plastik",
    "пластик",
    "пэт",
    "pet",
    "pet bottle",
    "pet-bottle",
    "пэт бутылка",
    "water bottle",
    "plastic bottle",
    "пластиковая бутылка",
  ],
  Paper: ["paper", "бумага", "қағаз"],
  Cardboard: [
    "cardboard",
    "carton",
    "картон",
    "cardboard box",
    "картонная коробка",
  ],
  Glass: [
    "glass",
    "glas",
    "стекло",
    "шыны",
    "glass bottle",
    "стеклянная бутылка",
  ],
  Metal: ["metal", "metall", "металл"],
  Aluminum: [
    "aluminum",
    "aluminium",
    "алюминий",
    "aluminum can",
    "алюминиевая банка",
    "алюминиевые банки",
  ],
  "Organic Waste": [
    "organic",
    "organik",
    "органические отходы",
    "органикалық қалдықтар",
    "food waste",
    "пищевые отходы",
  ],
  "E-waste": [
    "e-waste",
    "electronic",
    "electronics",
    "электроника",
    "laptop",
    "laptops",
    "ноутбук",
    "ноутбуки",
    "phone",
    "phones",
    "телефон",
    "телефоны",
    "мобильный телефон",
    "tv",
    "tvs",
    "телевизор",
    "телевизоры",
    "computer",
    "computers",
    "компьютер",
    "компьютеры",
    "бытовая техника",
  ],
  Batteries: [
    "batteries",
    "battery",
    "батарейки",
    "батареялар",
    "аккумуляторы",
    "accumulators",
  ],
  Textile: ["textile", "textil", "текстиль", "тоқыма", "clothes", "одежда"],
  Hazardous: [
    "hazardous",
    "danger",
    "опасные",
    "қауіпті",
    "mercury",
    "ртутные лампы",
    "ртуть",
  ],
  Rubber: ["rubber", "tires", "резина", "шины", "tyres"],
  "Tetra Pak": ["tetra pak", "tetrapak", "тетра пак"],
  Wood: ["wood", "дерево", "ағаш"],
};

export function searchRecyclingPoints(
  query: string,
  points: RecyclingPoint[],
): RecyclingPoint[] {
  const normalizedQuery = query.toLowerCase();

  const searchedMaterials: string[] = [];
  for (const [canonical, keywords] of Object.entries(materialKeywords)) {
    if (keywords.some((keyword) => normalizedQuery.includes(keyword))) {
      searchedMaterials.push(canonical);
    }
  }

  if (searchedMaterials.length === 0) {
    return points.slice(0, 10);
  }

  return points.filter((point) => {
    const wasteTypes = point.waste_type
      .toLowerCase()
      .split(",")
      .map((t) => t.trim());

    return searchedMaterials.some((material) => {
      const materialLower = material.toLowerCase();
      return wasteTypes.some((wasteType) => wasteType.includes(materialLower));
    });
  });
}

export function buildRoute(point: RecyclingPoint) {
  emitTaskEvent("map_visit");
  emitTaskEvent("route_open");

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
  const twoGisUrl = `https://2gis.kz/search/${point.latitude},${point.longitude}`;

  const navigationWindow = window.open(
    googleMapsUrl,
    "_blank",
    "noopener,noreferrer",
  );

  if (!navigationWindow) {
    window.location.href = twoGisUrl;
  }
}
