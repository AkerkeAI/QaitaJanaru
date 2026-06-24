import { recyclingPoints, type RecyclingPoint } from "../data/recyclingPoints";

// Create a mapping of material keywords (multi-language) to canonical waste types
const materialKeywords: Record<string, string[]> = {
  "Plastic": ["plastic", "plastik", "пластик", "пластик", "пластик"],
  "Paper": ["paper", "paper", "бумага", "бумага", "қағаз"],
  "Cardboard": ["cardboard", "carton", "картон", "картон", "картон"],
  "Glass": ["glass", "glas", "стекло", "стекло", "шыны"],
  "Metal": ["metal", "metall", "металл", "металл", "металл"],
  "Aluminum": ["aluminum", "aluminium", "алюминий", "алюминий", "алюминий"],
  "Organic Waste": ["organic", "organik", "органические отходы", "органические отходы", "органикалық қалдықтар"],
  "E-waste": ["e-waste", "electronic", "electronics", "электроника", "электроника", "электроника"],
  "Batteries": ["batteries", "battery", "батарейки", "батарейки", "батареялар"],
  "Textile": ["textile", "textil", "текстиль", "текстиль", "тоқыма"],
  "Hazardous": ["hazardous", "danger", "опасные", "опасные", "қауіпті"],
  "Rubber": ["rubber", "tires", "резина", "шины", "резина", "шины"],
  "Tetra Pak": ["tetra pak", "tetrapak", "тетра пак", "тетра пак", "тетра пак"],
  "Wood": ["wood", "wood", "дерево", "дерево", "ағаш"],
};

export function searchRecyclingPoints(query: string): RecyclingPoint[] {
  const normalizedQuery = query.toLowerCase();

  // Find which materials are being searched for
  const searchedMaterials: string[] = [];
  for (const [canonical, keywords] of Object.entries(materialKeywords)) {
    if (keywords.some(keyword => normalizedQuery.includes(keyword))) {
      searchedMaterials.push(canonical);
    }
  }

  // If no specific material is mentioned, return first 10 points
  if (searchedMaterials.length === 0) {
    return recyclingPoints.slice(0, 10);
  }

  // Find points that accept at least one of the searched materials
  const matchingPoints = recyclingPoints.filter(point => {
    const wasteTypes = point.waste_type.toLowerCase().split(",").map(t => t.trim());
    return searchedMaterials.some(material => {
      const materialLower = material.toLowerCase();
      return wasteTypes.some(wasteType => wasteType.includes(materialLower));
    });
  });

  return matchingPoints;
}

export function buildRoute(point: RecyclingPoint) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
  const twoGisUrl = `https://2gis.kz/search/${point.latitude},${point.longitude}`;

  const navigationWindow = window.open(googleMapsUrl, "_blank", "noopener,noreferrer");

  if (!navigationWindow) {
    window.location.href = twoGisUrl;
  }
}
