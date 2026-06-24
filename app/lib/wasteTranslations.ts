import { Language } from "./language";

export interface WasteTranslations {
  [key: string]: {
    en: string;
    ru: string;
    kz: string;
  };
}

export const wasteTypeTranslations: WasteTranslations = {
  "Plastic": { en: "Plastic", ru: "Пластик", kz: "Пластик" },
  "Paper": { en: "Paper", ru: "Бумага", kz: "Қағаз" },
  "Cardboard": { en: "Cardboard", ru: "Картон", kz: "Картон" },
  "Glass": { en: "Glass", ru: "Стекло", kz: "Шыны" },
  "Metal": { en: "Metal", ru: "Металл", kz: "Металл" },
  "Aluminum": { en: "Aluminum", ru: "Алюминий", kz: "Алюминий" },
  "Organic Waste": { en: "Organic Waste", ru: "Органические отходы", kz: "Органикалық қалдықтар" },
  "Electronics": { en: "Electronics", ru: "Электроника", kz: "Электроника" },
  "Batteries": { en: "Batteries", ru: "Батарейки", kz: "Батареялар" },
  "Textile": { en: "Textile", ru: "Текстиль", kz: "Тоқыма" },
  "E-waste": { en: "E-Waste", ru: "Э-отходы", kz: "Э-қалдықтар" },
  "Rubber (Tires)": { en: "Rubber (Tires)", ru: "Резина (Шины)", kz: "Резина (Шиналар)" },
  "Organic (Used cooking oil)": { en: "Organic (Used cooking oil)", ru: "Органические (Отработанное масло)", kz: "Органикалық (Қолданылған май)" },
  "Textile (Clothes)": { en: "Textile (Clothes)", ru: "Текстиль (Одежда)", kz: "Тоқыма (Кейімдер)" },
  "Hazardous (Mercury lamps)": { en: "Hazardous (Mercury lamps)", ru: "Опасные (Ртутные лампы)", kz: "Қауіпті (Суретті лампалар)" },
  "Hazardous (Mercury lamps, Batteries)": { en: "Hazardous (Mercury lamps, Batteries)", ru: "Опасные (Ртутные лампы, Батарейки)", kz: "Қауіпті (Суретті лампалар, Батареялар)" },
  "Tetra Pak": { en: "Tetra Pak", ru: "Тетра Пак", kz: "Тетра Пак" },
  "Wood": { en: "Wood", ru: "Дерево", kz: "Ағаш" },
  // Scanner specific waste types
  "Plastic Bottle": { en: "Plastic Bottle", ru: "Пластиковая бутылка", kz: "Пластикалық бөтелке" },
  "Glass Bottle": { en: "Glass Bottle", ru: "Стеклянная бутылка", kz: "Шыны бөтелке" },
  "Paper Item": { en: "Paper", ru: "Бумага", kz: "Қағаз" },
  "Cardboard Item": { en: "Cardboard", ru: "Картон", kz: "Картон" },
  "Aluminum Can": { en: "Aluminum Can", ru: "Алюминиевая банка", kz: "Алюминий банка" },
  "Electronics Item": { en: "Electronics", ru: "Электроника", kz: "Электроника" },
  "Organic Waste Item": { en: "Organic Waste", ru: "Органические отходы", kz: "Органикалық қалдықтар" },
  "Unknown Waste": { en: "Unknown Waste", ru: "Неизвестные отходы", kz: "Белгісіз қалдық" },
  "Unknown": { en: "Unknown", ru: "Неизвестно", kz: "Белгісіз" },
  "Plastic Packaging": { en: "Plastic Packaging", ru: "Пластиковая упаковка", kz: "Пластикалық орауыш" },
  "Metal Can": { en: "Metal Can", ru: "Металлическая банка", kz: "Металл банка" },
  "Battery": { en: "Battery", ru: "Батарейка", kz: "Батарея" },
  "Mixed Waste": { en: "Mixed Waste", ru: "Смешанные отходы", kz: "Аралас қалдықтар" },
  "E-Waste": { en: "E-Waste", ru: "Э-отходы", kz: "Э-қалдықтар" },
  "Mixed": { en: "Mixed", ru: "Смешанные", kz: "Аралас" },
};

export const facilityTypeTranslations: WasteTranslations = {
  "Collection Point": { en: "Collection Point", ru: "Пункт приема", kz: "Қабылдау пункті" },
  "Sorting Station": { en: "Sorting Station", ru: "Сортировочная станция", kz: "Сұрыптау станциясы" },
  "Recycling Plant": { en: "Recycling Plant", ru: "Завод по переработке", kz: "Қайта өңдеу зауыты" },
  "Hazardous Disposal": { en: "Hazardous Disposal", ru: "Утилизация опасных отходов", kz: "Қауіпті қалдықтарды жою" },
};

export function translateWasteType(wasteType: string, language: Language): string {
  if (!wasteType) return "";

  const types = wasteType.split(/[,\\/]+/).map(t => t.trim());
  const translatedTypes = types.map(type => {
    const translation = wasteTypeTranslations[type];
    return translation ? translation[language] : type;
  });

  return translatedTypes.join(", ");
}

export function translateFacilityType(facilityType: string, language: Language): string {
  const translation = facilityTypeTranslations[facilityType];
  return translation ? translation[language] : facilityType;
}
