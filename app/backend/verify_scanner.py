"""End-to-end waste scanner verification script."""
import io
import json
import os
import struct
import sys
import zlib

import requests

sys.path.insert(0, os.getcwd())

from app.services.ai_waste_detector import analyze_waste_image, GEMINI_API_KEY
from app.db.session import SessionLocal
from app.models.user import User

API_BASE = os.getenv("SCAN_API_BASE", "http://127.0.0.1:8000")

WASTE_SCENARIOS = [
    ("plastic bottle", (30, 144, 255), "Plastic Bottle"),
    ("cardboard box", (210, 180, 140), "Cardboard"),
    ("aluminum can", (192, 192, 192), "Metal Can"),
    ("glass bottle", (0, 200, 120), "Glass Bottle"),
    ("battery", (255, 80, 80), "Battery"),
    ("mixed waste", (120, 120, 120), "Mixed Waste"),
]


def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    chunk = chunk_type + data
    return struct.pack(">I", len(data)) + chunk + struct.pack(">I", zlib.crc32(chunk) & 0xFFFFFFFF)


def make_test_image(label: str, color: tuple[int, int, int]) -> bytes:
    width, height = 640, 480
    r, g, b = color
    row = bytes([r, g, b, 255]) * width
    raw = b"".join([b"\x00" + row for _ in range(height)])
    compressed = zlib.compress(raw, 9)
    png = b"\x89PNG\r\n\x1a\n"
    png += _png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += _png_chunk(b"IDAT", compressed)
    png += _png_chunk(b"IEND", b"")
    return png


def get_or_create_test_user(db) -> int:
    user = db.query(User).order_by(User.id.asc()).first()
    if user:
        return user.id
    raise RuntimeError("No users in database. Register a user first.")


def test_ai_direct() -> list[dict]:
    print("\n=== PHASE 5: Direct AI detector tests ===")
    print(f"GEMINI_API_KEY loaded: {bool(GEMINI_API_KEY)}")
    results = []
    for label, color, expected in WASTE_SCENARIOS:
        image = make_test_image(label, color)
        try:
            result = analyze_waste_image(image)
            status = "OK"
            if result["waste_type"] == "Unknown Waste":
                status = "UNKNOWN"
        except Exception as exc:
            result = {"error": str(exc)}
            status = "ERROR"
        row = {
            "scenario": label,
            "expected": expected,
            "status": status,
            "waste_type": result.get("waste_type"),
            "recycling_category": result.get("recycling_category"),
            "confidence": result.get("confidence"),
            "recyclable": result.get("recyclable"),
            "preparation_steps": result.get("preparation_steps"),
        }
        results.append(row)
        print(json.dumps(row, ensure_ascii=False))
    return results


def test_scan_api(user_id: int) -> list[dict]:
    print("\n=== PHASE 5: Scan API endpoint tests ===")
    print(f"API base: {API_BASE}")
    print(f"user_id: {user_id}")
    results = []
    for label, color, expected in WASTE_SCENARIOS:
        image = make_test_image(label, color)
        files = {"file": (f"{label.replace(' ', '_')}.png", image, "image/png")}
        try:
            response = requests.post(f"{API_BASE}/scan/{user_id}", files=files, timeout=60)
            payload = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            status = "OK" if response.ok else f"HTTP_{response.status_code}"
            row = {
                "scenario": label,
                "expected": expected,
                "status": status,
                "detail": payload.get("detail"),
                "waste_type": payload.get("waste_type"),
                "recycling_category": payload.get("recycling_category"),
                "confidence": payload.get("confidence"),
                "recyclable": payload.get("recyclable"),
            }
        except Exception as exc:
            row = {"scenario": label, "status": "ERROR", "detail": str(exc)}
        results.append(row)
        print(json.dumps(row, ensure_ascii=False))
    return results


def main() -> None:
    db = SessionLocal()
    try:
        user_id = get_or_create_test_user(db)
        user = db.query(User).filter(User.id == user_id).first()
        print("=== Diagnostic snapshot ===")
        print(json.dumps({
            "user_id": user_id,
            "total_scans": user.total_scans or 0,
            "eco_points": user.eco_points or 0,
            "usage_limit": "none (no per-user scan quota in database)",
        }, indent=2))
    finally:
        db.close()

    ai_results = test_ai_direct()

    try:
        health = requests.get(f"{API_BASE}/", timeout=5)
        print(f"\nAPI health: {health.status_code} {health.text[:120]}")
    except Exception as exc:
        print(f"\nAPI health check failed: {exc}")
        print("Start backend: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return

    api_results = test_scan_api(user_id)

    ai_ok = sum(1 for r in ai_results if r["status"] == "OK")
    api_ok = sum(1 for r in api_results if r["status"] == "OK")
    print("\n=== Summary ===")
    print(f"AI direct: {ai_ok}/{len(ai_results)} successful")
    print(f"Scan API: {api_ok}/{len(api_results)} successful")


if __name__ == "__main__":
    main()
