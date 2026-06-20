"""Single scan smoke test with a real public image."""
import json
import sys

import requests

API_BASE = "http://127.0.0.1:8000"
USER_ID = 1

TEST_IMAGES = {
    "plastic bottle": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Plastic_water_bottle.jpg/640px-Plastic_water_bottle.jpg",
    "cardboard box": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cardboard_boxes.jpg/640px-Cardboard_boxes.jpg",
    "aluminum can": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Aluminum_can.jpg/480px-Aluminum_can.jpg",
    "glass bottle": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Glass_bottle.jpg/480px-Glass_bottle.jpg",
    "battery": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Battery_9V.jpg/480px-Battery_9V.jpg",
}


def main() -> None:
    results = []
    for label, url in TEST_IMAGES.items():
        try:
            image = requests.get(url, timeout=30).content
            response = requests.post(
                f"{API_BASE}/scan/{USER_ID}",
                files={"file": (f"{label.replace(' ', '_')}.jpg", image, "image/jpeg")},
                timeout=90,
            )
            payload = response.json() if "application/json" in response.headers.get("content-type", "") else {}
            row = {
                "scenario": label,
                "status": response.status_code,
                "detail": payload.get("detail"),
                "waste_type": payload.get("waste_type"),
                "recycling_category": payload.get("recycling_category"),
                "confidence": payload.get("confidence"),
                "recyclable": payload.get("recyclable"),
                "preparation_steps": payload.get("preparation_steps"),
            }
        except Exception as exc:
            row = {"scenario": label, "status": "error", "detail": str(exc)}
        results.append(row)
        print(json.dumps(row, ensure_ascii=False))

    ok = sum(1 for row in results if row.get("status") == 200)
    print(f"\nPassed: {ok}/{len(results)}")


if __name__ == "__main__":
    main()
