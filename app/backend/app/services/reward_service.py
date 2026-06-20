from typing import Dict

WASTE_POINTS: Dict[str, int] = {
    "Plastic Bottle": 5,
    "Plastic Packaging": 5,
    "Glass Bottle": 5,
    "Paper": 3,
    "Cardboard": 3,
    "Metal Can": 5,
    "Organic Waste": 3,
    "Electronics": 15,
    "Battery": 20,
    "Mixed Waste": 2,
    "Unknown Waste": 1,
}


def points_for_waste(waste_type: str) -> int:
    return WASTE_POINTS.get(waste_type, 1)
