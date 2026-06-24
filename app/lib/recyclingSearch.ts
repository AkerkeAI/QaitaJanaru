import { recyclingPoints, type RecyclingPoint } from "../data/recyclingPoints";

// Create a mapping of material keywords (multi-language) to canonical waste types
const materialKeywords: Record<string, string[]> = {
  "Plastic": ["plastic", "plastik", "пластик", "пластик", "пластик", 
              "pet", "pet bottle", "pet-bottle", "пэт", "пэт бутылка",
              "water bottle", "plastic bottle", "пластиковая бутылка",
              "пластиковая бутылка", "пластик bottle"],
  "Paper": ["paper", "paper", "бумага", "бумага", "қағаз"],
  "Cardboard": ["cardboard", "carton", "картон", "картон", "картон",
                "cardboard box", "картонная коробка"],
  "Glass": ["glass", "glas", "стекло", "стекло", "шыны",
            "glass bottle", "стеклянная бутылка"],
  "Metal": ["metal", "metall", "металл", "металл", "металл"],
  "Aluminum": ["aluminum", "aluminium", "алюминий", "алюминий", "алюминий",
               "aluminum can", "алюминиевая банка", "алюминиевые банки"],
  "Organic Waste": ["organic", "organik", "органические отходы", "органические отходы", "органикалық қалдықтар",
                    "food waste", "пищевые отходы"],
  "E-waste": ["e-waste", "electronic", "electronics", "электроника", "электроника", "электроника",
              "laptop", "laptops", "ноутбук", "ноутбуки",
              "phone", "phones", "телефон", "телефоны", "мобильный телефон",
              "tv", "tvs", "телевизор", "телевизоры",
              "computer", "computers", "компьютер", "компьютеры",
              "electronics", "бытовая техника", "электроника"],
  "Batteries": ["batteries", "battery", "батарейки", "батарейки", "батареялар",
                "аккумуляторы", "accumulators"],
  "Textile": ["textile", "textil", "текстиль", "текстиль", "тоқыма",
              "clothes", "одежда", "одежа"],
  "Hazardous": ["hazardous", "danger", "опасные", "опасные", "қауіпті",
                "mercury", "ртутные лампы", "ртуть"],
  "Rubber": ["rubber", "tires", "резина", "шины", "резина", "шины",
             "tyres"],
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
