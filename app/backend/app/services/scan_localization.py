from typing import Dict, List

LOCALIZED_SCAN_TEXT: Dict[str, Dict[str, Dict[str, object]]] = {
    "en": {
        "eco_tips": {
            "Plastic Bottle": "Remove caps and rinse plastic bottles before recycling.",
            "Plastic Packaging": "Try to reuse plastic packaging or recycle it when accepted.",
            "Glass Bottle": "Separate glass by color and rinse before recycling.",
            "Paper": "Keep paper clean and dry for recycling.",
            "Cardboard": "Flatten cardboard boxes and remove tape before recycling.",
            "Metal Can": "Rinse metal cans and crush them to save space.",
            "Organic Waste": "Compost organic waste locally if possible.",
            "Electronics": "Take electronics to an authorized e-waste center.",
            "Battery": "Do not throw batteries in trash; use battery recycling points.",
            "Mixed Waste": "Mixed waste should go to general waste collection or separate by material.",
            "Unknown Waste": "Uncertain material. Check local recycling rules or dispose safely.",
        },
        "recycling_advice": {
            "Plastic Bottle": "Recyclable at most plastic collection points.",
            "Plastic Packaging": "Check local recycling rules for plastic film and packaging.",
            "Glass Bottle": "Recyclable at glass collection centers.",
            "Paper": "Recycle with paper and cardboard streams.",
            "Cardboard": "Recycle with cardboard or paper recycling.",
            "Metal Can": "Recyclable at metal collection facilities.",
            "Organic Waste": "Add to compost or organic waste processing.",
            "Electronics": "Take to an electronics recycling or drop-off center.",
            "Battery": "Bring batteries to a hazardous waste or battery collection point.",
            "Mixed Waste": "Use general waste disposal or sort materials carefully.",
            "Unknown Waste": "Check local recycling rules before disposal.",
        },
        "preparation_steps": {
            "Plastic Bottle": [
                "Empty the bottle completely",
                "Remove remaining liquid",
                "Compress the bottle if possible",
                "Separate the cap when required locally",
            ],
            "Plastic Packaging": [
                "Remove food residue",
                "Dry the packaging",
                "Flatten soft packaging",
            ],
            "Glass Bottle": [
                "Empty the bottle",
                "Rinse lightly",
                "Remove cork or cap if required",
            ],
            "Paper": [
                "Keep paper dry and clean",
                "Remove plastic windows or tape",
                "Flatten sheets",
            ],
            "Cardboard": [
                "Flatten boxes",
                "Remove tape and labels",
                "Keep cardboard dry",
            ],
            "Metal Can": [
                "Empty the can",
                "Rinse lightly",
                "Crush the can to save space",
            ],
            "Organic Waste": [
                "Remove packaging",
                "Compost only food scraps",
                "Do not include plastic bags",
            ],
            "Electronics": [
                "Remove batteries if detachable",
                "Keep device intact",
                "Take to an authorized e-waste point",
            ],
            "Battery": [
                "Do not throw in household trash",
                "Tape exposed terminals if damaged",
                "Bring to a battery collection point",
            ],
            "Mixed Waste": [
                "Sort materials by type if possible",
                "Remove food contamination",
                "Separate plastic, paper, and metal",
            ],
            "Unknown Waste": [
                "Check local recycling rules",
                "Keep the item clean and dry",
                "Ask staff at a recycling center",
            ],
        },
    },
    "ru": {
        "eco_tips": {
            "Plastic Bottle": "Снимите крышку и ополосните пластиковую бутылку перед переработкой.",
            "Plastic Packaging": "Постарайтесь использовать пластиковую упаковку повторно или сдайте её в переработку, если это разрешено.",
            "Glass Bottle": "Сортируйте стекло по цвету и ополаскивайте перед переработкой.",
            "Paper": "Сохраняйте бумагу чистой и сухой для переработки.",
            "Cardboard": "Сложите картонные коробки и снимите скотч перед переработкой.",
            "Metal Can": "Ополосните металлические банки и сомните их для экономии места.",
            "Organic Waste": "По возможности компостируйте органические отходы локально.",
            "Electronics": "Сдавайте электронику в авторизованный пункт приёма электронных отходов.",
            "Battery": "Не выбрасывайте батарейки в мусор; используйте пункты приёма батареек.",
            "Mixed Waste": "Смешанные отходы следует выбрасывать в общий мусор или по возможности разделять по материалам.",
            "Unknown Waste": "Материал не определён. Проверьте местные правила переработки или утилизируйте безопасно.",
        },
        "recycling_advice": {
            "Plastic Bottle": "Можно сдать в большинство пунктов приёма пластика.",
            "Plastic Packaging": "Проверьте местные правила переработки для пластиковой плёнки и упаковки.",
            "Glass Bottle": "Можно сдать в пункты приёма стекла.",
            "Paper": "Сдавайте вместе с потоком бумаги и картона.",
            "Cardboard": "Сдавайте вместе с картоном или макулатурой.",
            "Metal Can": "Можно сдать в пункты приёма металла.",
            "Organic Waste": "Добавьте в компост или отправьте на переработку органических отходов.",
            "Electronics": "Сдайте в центр переработки электроники или пункт приёма.",
            "Battery": "Сдавайте батарейки в пункт приёма опасных отходов или батареек.",
            "Mixed Waste": "Используйте общий контейнер для отходов или аккуратно отсортируйте материалы.",
            "Unknown Waste": "Перед утилизацией проверьте местные правила переработки.",
        },
        "preparation_steps": {
            "Plastic Bottle": [
                "Полностью опустошите бутылку",
                "Удалите остатки жидкости",
                "Сомните бутылку, если это возможно",
                "Отделите крышку, если это требуется по местным правилам",
            ],
            "Plastic Packaging": [
                "Удалите остатки еды",
                "Высушите упаковку",
                "Сложите мягкую упаковку",
            ],
            "Glass Bottle": [
                "Опустошите бутылку",
                "Слегка ополосните",
                "Снимите пробку или крышку, если это требуется",
            ],
            "Paper": [
                "Держите бумагу сухой и чистой",
                "Удалите пластиковые окошки или скотч",
                "Разровняйте листы",
            ],
            "Cardboard": [
                "Сложите коробки",
                "Удалите скотч и этикетки",
                "Держите картон сухим",
            ],
            "Metal Can": [
                "Опустошите банку",
                "Слегка ополосните",
                "Сомните банку для экономии места",
            ],
            "Organic Waste": [
                "Удалите упаковку",
                "Компостируйте только пищевые отходы",
                "Не используйте пластиковые пакеты",
            ],
            "Electronics": [
                "Извлеките батарейки, если это возможно",
                "Сохраняйте устройство целым",
                "Сдайте в авторизованный пункт приёма электронных отходов",
            ],
            "Battery": [
                "Не выбрасывайте в бытовой мусор",
                "Заклейте контакты, если батарейка повреждена",
                "Сдайте в пункт приёма батареек",
            ],
            "Mixed Waste": [
                "По возможности отсортируйте материалы по типу",
                "Удалите пищевые загрязнения",
                "Разделите пластик, бумагу и металл",
            ],
            "Unknown Waste": [
                "Проверьте местные правила переработки",
                "Держите предмет чистым и сухим",
                "Спросите у сотрудников центра переработки",
            ],
        },
    },
    "kz": {
        "eco_tips": {
            "Plastic Bottle": "Пластик бөтелкенің қақпағын алып, қайта өңдеуден бұрын шайыңыз.",
            "Plastic Packaging": "Пластик қаптаманы қайта пайдалануға тырысыңыз немесе қабылданса қайта өңдеуге тапсырыңыз.",
            "Glass Bottle": "Шыныны түсі бойынша бөліп, қайта өңдеуден бұрын шайыңыз.",
            "Paper": "Қағазды қайта өңдеу үшін таза және құрғақ күйде ұстаңыз.",
            "Cardboard": "Қайта өңдеуден бұрын картон қораптарды тегістеп, скотчты алып тастаңыз.",
            "Metal Can": "Металл банкаларды шайып, орын үнемдеу үшін мыжыңыз.",
            "Organic Waste": "Мүмкін болса, органикалық қалдықтарды жергілікті жерде компосттаңыз.",
            "Electronics": "Электрониканы рұқсат етілген электрондық қалдықтар қабылдау орнына апарыңыз.",
            "Battery": "Батарейкаларды қоқысқа тастамаңыз; батарейка қабылдау нүктелерін пайдаланыңыз.",
            "Mixed Waste": "Аралас қалдықтарды жалпы қоқысқа тастаңыз немесе мүмкін болса материал бойынша бөліңіз.",
            "Unknown Waste": "Материал анықталмады. Жергілікті қайта өңдеу ережелерін тексеріңіз немесе қауіпсіз түрде тастаңыз.",
        },
        "recycling_advice": {
            "Plastic Bottle": "Пластик қабылдау нүктелерінің көбіне тапсыруға болады.",
            "Plastic Packaging": "Пластик үлдір мен қаптама бойынша жергілікті қайта өңдеу ережелерін тексеріңіз.",
            "Glass Bottle": "Шыны қабылдау орталықтарына тапсыруға болады.",
            "Paper": "Қағаз бен картон ағынымен бірге қайта өңдеңіз.",
            "Cardboard": "Картон немесе қағаз қабылдау ағынымен бірге өткізіңіз.",
            "Metal Can": "Металл қабылдау орындарына тапсыруға болады.",
            "Organic Waste": "Компостқа қосыңыз немесе органикалық қалдықтарды өңдеу жүйесіне жіберіңіз.",
            "Electronics": "Электроника қайта өңдеу орталығына немесе қабылдау орнына апарыңыз.",
            "Battery": "Батарейкаларды қауіпті қалдықтар немесе батарейка қабылдау пунктіне тапсырыңыз.",
            "Mixed Waste": "Жалпы қоқыс жүйесін қолданыңыз немесе материалдарды мұқият сұрыптаңыз.",
            "Unknown Waste": "Тастамас бұрын жергілікті қайта өңдеу ережелерін тексеріңіз.",
        },
        "preparation_steps": {
            "Plastic Bottle": [
                "Бөтелкені толық босатыңыз",
                "Сұйықтық қалдықтарын алып тастаңыз",
                "Мүмкін болса бөтелкені мыжыңыз",
                "Жергілікті ереже талап етсе қақпағын бөліңіз",
            ],
            "Plastic Packaging": [
                "Тағам қалдықтарын алып тастаңыз",
                "Қаптаманы құрғатыңыз",
                "Жұмсақ қаптаманы тегістеңіз",
            ],
            "Glass Bottle": [
                "Бөтелкені босатыңыз",
                "Жеңіл шайыңыз",
                "Қажет болса тығынды немесе қақпақты алыңыз",
            ],
            "Paper": [
                "Қағазды таза және құрғақ ұстаңыз",
                "Пластик терезелерді немесе скотчты алыңыз",
                "Парақтарды тегістеңіз",
            ],
            "Cardboard": [
                "Қораптарды тегістеңіз",
                "Скотч пен жапсырмаларды алыңыз",
                "Картонды құрғақ ұстаңыз",
            ],
            "Metal Can": [
                "Банканы босатыңыз",
                "Жеңіл шайыңыз",
                "Орын үнемдеу үшін банканы мыжыңыз",
            ],
            "Organic Waste": [
                "Қаптаманы алып тастаңыз",
                "Тек тағам қалдықтарын компосттаңыз",
                "Пластик пакеттерді қоспаңыз",
            ],
            "Electronics": [
                "Мүмкін болса батареяларды шығарыңыз",
                "Құрылғыны бүтін күйде сақтаңыз",
                "Рұқсат етілген электрондық қалдықтар қабылдау орнына апарыңыз",
            ],
            "Battery": [
                "Тұрмыстық қоқысқа тастамаңыз",
                "Зақымдалған болса ашық түйіспелерді жабыстырыңыз",
                "Батарейка қабылдау орнына апарыңыз",
            ],
            "Mixed Waste": [
                "Мүмкін болса материалдарды түрі бойынша бөліңіз",
                "Тағам ластануын алып тастаңыз",
                "Пластик, қағаз және металды ажыратыңыз",
            ],
            "Unknown Waste": [
                "Жергілікті қайта өңдеу ережелерін тексеріңіз",
                "Затты таза және құрғақ ұстаңыз",
                "Қайта өңдеу орталығы қызметкерлерінен сұраңыз",
            ],
        },
    },
}


def localize_scan_result(result: Dict[str, object], language: str) -> Dict[str, object]:
    language_pack = LOCALIZED_SCAN_TEXT.get(language, LOCALIZED_SCAN_TEXT["en"])
    waste_type = str(result.get("waste_type", "Unknown Waste"))

    localized = dict(result)
    localized["eco_tip"] = language_pack["eco_tips"].get(
        waste_type, language_pack["eco_tips"]["Unknown Waste"]
    )
    localized["recycling_advice"] = language_pack["recycling_advice"].get(
        waste_type, language_pack["recycling_advice"]["Unknown Waste"]
    )

    current_steps = result.get("preparation_steps")
    if not current_steps:
        localized["preparation_steps"] = language_pack["preparation_steps"].get(
            waste_type,
            language_pack["preparation_steps"]["Unknown Waste"],
        )

    return localized


def get_localized_preparation_steps(waste_type: str, language: str) -> List[str]:
    language_pack = LOCALIZED_SCAN_TEXT.get(language, LOCALIZED_SCAN_TEXT["en"])
    return list(
        language_pack["preparation_steps"].get(
            waste_type,
            language_pack["preparation_steps"]["Unknown Waste"],
        )
    )
