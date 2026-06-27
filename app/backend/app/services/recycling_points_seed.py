from app.models.recycling_point import RecyclingPoint

SEED_RECYCLING_POINTS = [
    {
        "id": 1,
        "name": "ТОО Taza.Likee",
        "city": "Aktau",
        "address": "Микрорайон 15, дом 56, офис 11",
        "latitude": 43.6543,
        "longitude": 51.1648,
        "description": "Официальное экологическое предприятие. Занимается сбором, сортировкой и подготовкой ТБО к вторичному циклу. Имеет прессы для ПЭТ-бутылок, ПНД-флаконов и гофрокартона.",
        "waste_type": "Plastic, Paper, Cardboard",
        "facility_type": "Sorting Station",
    },
    {
        "id": 2,
        "name": "Eco Waste Aqtau (Главный пункт)",
        "city": "Aktau",
        "address": "Микрорайон 3Б, 39/3",
        "latitude": 43.6425,
        "longitude": 51.1578,
        "description": "Популярный городской пункт розничного приема вторичного сырья у населения за денежное вознаграждение.",
        "waste_type": "Paper, Plastic, Aluminum",
        "facility_type": "Collection Point",
    },
    {
        "id": 3,
        "name": "Eco Waste Aqtau (База Промзона)",
        "city": "Aktau",
        "address": "Промзона 4, здание 51",
        "latitude": 43.6821,
        "longitude": 51.215,
        "description": "Производственная площадка, где собранные в городе бумага и пластик проходят глубокую досортировку по видам и цветам, прессуются в гигантские тюки и отправляются на заводы рециклинга.",
        "waste_type": "Paper, Plastic, Cardboard, Aluminum",
        "facility_type": "Sorting Station",
    },
]


def build_qr_identifier(point_id: int) -> str:
    return f"recycling-point-{point_id}"


def seed_recycling_points(db) -> None:
    for item in SEED_RECYCLING_POINTS:
        existing = (
            db.query(RecyclingPoint).filter(RecyclingPoint.id == item["id"]).first()
        )
        if existing:
            if not existing.qr_identifier:
                existing.qr_identifier = build_qr_identifier(existing.id)
            continue

        db.add(
            RecyclingPoint(
                id=item["id"],
                qr_identifier=build_qr_identifier(item["id"]),
                name=item["name"],
                city=item["city"],
                address=item["address"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                description=item["description"],
                waste_type=item["waste_type"],
                facility_type=item["facility_type"],
            )
        )

    db.commit()
