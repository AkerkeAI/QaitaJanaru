import { Language } from "./language";

export interface WasteTranslations {
  [key: string]: {
    en: string;
    ru: string;
    kz: string;
  };
}

export interface PreparationSteps {
  [key: string]: {
    en: string[];
    ru: string[];
    kz: string[];
  };
}

export const preparationSteps: PreparationSteps = {
  "Plastic": {
    en: [
      "1. Rinse the plastic item with water to remove any food residue.",
      "2. Remove labels, caps, and lids if they are made of different material.",
      "3. Flatten bottles and containers to save space.",
      "4. Check local recycling guidelines for any specific rules."
    ],
    ru: [
      "1. Промойте пластиковое изделие водой, чтобы удалить остатки еды.",
      "2. Удалите этикетки, крышки и крышки, если они сделаны из другого материала.",
      "3. Сплющите бутылки и контейнеры, чтобы сэкономить место.",
      "4. Проверьте местные правила переработки для любых специфических указаний."
    ],
    kz: [
      "1. Пластикті судымен жуыңыз, азық-түлік қалдықтарын жойыңыз.",
      "2. Басқа материалдан жасалған болса, намаларды, қақпақтарды алып тастаңыз.",
      "3. Орынды үнемдеу үшін бөтелкелер мен контейнерлерді сызыңыз.",
      "4. Ерекше ережелер үшін жергілікті қайта өңдеу нұсқауларын тексеріңіз."
    ]
  },
  "Paper": {
    en: [
      "1. Keep paper dry and free of food residue.",
      "2. Remove staples, paper clips, and tape if possible.",
      "3. Flatten boxes to save space.",
      "4. Do not include wet or greasy paper."
    ],
    ru: [
      "1. Сохраняйте бумагу сухой и без остатков еды.",
      "2. Удалите скрепки, зажимы и ленту, если это возможно.",
      "3. Сплющите коробки, чтобы сэкономить место.",
      "4. Не включайте влажную или жирную бумагу."
    ],
    kz: [
      "1. Қағазды құрғақ және азық-түлік қалдықтарсыз сақтаңыз.",
      "2. Мүмкін болса, қалтамаларды, қағаз бөгделерді және лентаны алып тастаңыз.",
      "3. Орынды үнемдеу үшін қораптарды сызыңыз.",
      "4. Ылғай немесе майлы қағазды қоспаныңыз."
    ]
  },
  "Cardboard": {
    en: [
      "1. Remove any packing tape, labels, and plastic.",
      "2. Flatten the cardboard to save space.",
      "3. Keep it dry - wet cardboard is often not recyclable.",
      "4. Check local guidelines for size restrictions."
    ],
    ru: [
      "1. Удалите любую упаковочную ленту, этикетки и пластик.",
      "2. Сплющите картон, чтобы сэкономить место.",
      "3. Сохраняйте его сухим - влажный картон часто не подлежит переработке.",
      "4. Проверьте местные руководства на ограничения по размеру."
    ],
    kz: [
      "1. Кез келген упаковка лентасын, намаларды және пластикті алып тастаңыз.",
      "2. Орынды үнемдеу үшін картонды сызыңыз.",
      "3. Құрғақ сақтаңыз - ылғал картон көбінесе қайта өңделмейді.",
      "4. Өлшем шектері үшін жергілікті нұсқауларды тексеріңіз."
    ]
  },
  "Glass": {
    en: [
      "1. Rinse glass containers to remove any residue.",
      "2. Remove lids and caps if they are not made of glass.",
      "3. Check local rules about broken glass.",
      "4. Do not mix different colors of glass unless instructed."
    ],
    ru: [
      "1. Промойте стеклянные контейнеры, чтобы удалить любые остатки.",
      "2. Удалите крышки, если они не из стекла.",
      "3. Проверьте местные правила о битом стекле.",
      "4. Не смешивайте разные цвета стекла, если не указано иное."
    ],
    kz: [
      "1. Шыны контейнерлерді қалдықтарды жою үшін жуыңыз.",
      "2. Егер олар шынымен жасалмаған болса, қақпақтарды алып тастаңыз.",
      "3. Сынып кеткен шыны туралы жергілікті ережелерді тексеріңіз.",
      "4. Егер басқаша көрсетілмеген болса, шынының әр түрлі түстерін араластырмаңыз."
    ]
  },
  "Aluminum": {
    en: [
      "1. Rinse cans to remove any food residue.",
      "2. Remove labels if possible.",
      "3. Flatten cans to save space.",
      "4. Do not crush cans too much in some recycling systems."
    ],
    ru: [
      "1. Промойте банки, чтобы удалить любые остатки еды.",
      "2. Удалите этикетки, если это возможно.",
      "3. Сплющите банки, чтобы сэкономить место.",
      "4. Не сжимайте банки слишком сильно в некоторых системах переработки."
    ],
    kz: [
      "1. Азық-түлік қалдықтарын жою үшін банктерді жуыңыз.",
      "2. Мүмкін болса, намаларды алып тастаңыз.",
      "3. Орынды үнемдеу үшін банктерді сызыңыз.",
      "4. Кейбір қайта өңдеу жүйелерінде банктерді тым қатты сызып тастаңыз."
    ]
  },
  "Batteries": {
    en: [
      "1. Do not throw batteries in the regular trash!",
      "2. Take them to a designated battery collection point.",
      "3. Keep different battery types separate if possible.",
      "4. Do not damage or disassemble batteries."
    ],
    ru: [
      "1. Не выбрасывайте батарейки в обычный мусор!",
      "2. Отнесите их в специальный пункт приема батареек.",
      "3. По возможности храните разные типы батареек отдельно.",
      "4. Не повреждяйте и не разбирайте батарейки."
    ],
    kz: [
      "1. Батареяларды қалыпты қаққа тастаңыз!",
      "2. Оларды арнайы батареяларды қабылдау пунктіне апарыңыз.",
      "3. Мүмкін болса, әртүрлі батарея түрлерін бөлек сақтаңыз.",
      "4. Батареяларды зақымдаңыз немесе жалыңыз."
    ]
  },
  "E-waste": {
    en: [
      "1. Back up any important data from your devices.",
      "2. Wipe your personal information if possible.",
      "3. Take to a certified electronics recycling center.",
      "4. Do not disassemble devices unless you are trained."
    ],
    ru: [
      "1. Сохраните резервную копию любых важных данных с ваших устройств.",
      "2. Удалите свою личную информацию, если это возможно.",
      "3. Отнесите в сертифицированный центр переработки электроники.",
      "4. Не разбирайте устройства, если у вас нет соответствующего обучения."
    ],
    kz: [
      "1. Құрылғылардан кез келген маңызды деректердің резервтік көшірмесін сақтаңыз.",
      "2. Мүмкін болса, жеке мәліметтеріңізді жойыңыз.",
      "3. Сертификацияланған электрониканы қайта өңдеу орталығына апарыңыз.",
      "4. Егер сізде оқыту жоқ болса, құрылғыларды жалыңыз."
    ]
  },
  "Organic Waste": {
    en: [
      "1. Collect food scraps in a separate container.",
      "2. Keep the container clean to avoid pests.",
      "3. If composting, add a mix of green and brown materials.",
      "4. Do not include meat, dairy, or oily foods unless your compost is designed for them."
    ],
    ru: [
      "1. Собирайте пищевые отходы в отдельный контейнер.",
      "2. Содержите контейнер чистым, чтобы избежать вредителей.",
      "3. При компостировании добавьте смесь зеленых и коричневых материалов.",
      "4. Не добавляйте мясо, молочные продукты или жирную пищу, если ваш компост не предназначен для них."
    ],
    kz: [
      "1. Азық-түлік қалдықтарын бөлек контейнерге жинаңыз.",
      "2. Зиянды жануарлардың алынудың алдын алу үшін контейнерді таза сақтаңыз.",
      "3. Компостта жасыл және қоңыр материалдардың қоспасын қосыңыз.",
      "4. Егер сіздің компостыңыз оларға арналған болмаса, етті, сүт өнімдерін немесе майлы азық-түлікті қоспаныңыз."
    ]
  }
};

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
