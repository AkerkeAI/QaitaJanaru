import base64
import json
import os
from typing import Any, Dict, List

import requests

def _load_env_var_from_dotenv(key: str) -> str:
    value = os.getenv(key)
    if value:
        return value

    current_dir = os.path.abspath(os.path.dirname(__file__))
    while True:
        env_path = os.path.join(current_dir, ".env.local")
        if os.path.isfile(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        stripped = line.strip()
                        if stripped.startswith(f"{key}="):
                            return stripped.split("=", 1)[1].strip().strip('"').strip("'")
            except Exception:
                break

        parent_dir = os.path.dirname(current_dir)
        if parent_dir == current_dir:
            break
        current_dir = parent_dir

    return ""


GEMINI_API_KEY = _load_env_var_from_dotenv("GEMINI_API_KEY")

# Prefer the same model family used by the working Eco Assistant chat route.
MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]

WASTE_CLASSES = [
    "Plastic Bottle",
    "Plastic Packaging",
    "Glass Bottle",
    "Paper",
    "Cardboard",
    "Metal Can",
    "Organic Waste",
    "Electronics",
    "Battery",
    "Mixed Waste",
    "Unknown Waste",
]

CATEGORY_MAP = {
    "Plastic Bottle": "Plastic",
    "Plastic Packaging": "Plastic",
    "Glass Bottle": "Glass",
    "Paper": "Paper",
    "Cardboard": "Cardboard",
    "Metal Can": "Metal",
    "Organic Waste": "Organic",
    "Electronics": "E-Waste",
    "Battery": "E-Waste",
    "Mixed Waste": "Mixed",
    "Unknown Waste": "Unknown",
}

RECYCLABLE_MAP = {
    "Plastic Bottle": True,
    "Plastic Packaging": True,
    "Glass Bottle": True,
    "Paper": True,
    "Cardboard": True,
    "Metal Can": True,
    "Organic Waste": False,
    "Electronics": True,
    "Battery": True,
    "Mixed Waste": False,
    "Unknown Waste": False,
}

PREPARATION_STEPS = {
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
}

ECO_TIPS = {
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
}

RECYCLING_ADVICE = {
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
}

CONFIDENCE_THRESHOLD = 0.65
AI_TIMEOUT_SECONDS = 30


class AIProviderError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int | None = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def _build_prompt(language: str = "en") -> str:
    language_instructions = {
        "en": "Respond in English.",
        "ru": "Respond in Russian.",
        "kz": "Respond in Kazakh.",
    }
    
    return (
        f"You are a waste classification assistant for Kazakhstan recycling education.\n"
        f"{language_instructions.get(language, 'Respond in English.')}\n"
        "Classify the image into exactly one of these waste types: "
        + ", ".join(WASTE_CLASSES)
        + ".\n"
        "IMPORTANT: The 'waste_type' field MUST be exactly one of the listed waste types (in English).\n"
        "Translate ONLY the 'preparation_steps' array items into the specified language.\n"
        "Translate ONLY the explanation text into the specified language.\n"
        "Return ONLY valid JSON with keys:\n"
        "waste_type, confidence, explanation, preparation_steps, recyclable.\n"
        "preparation_steps must be an array of 2-4 short actionable strings in the specified language.\n"
        "recyclable must be true or false.\n"
        "If uncertain, use waste_type='Unknown Waste' and confidence below 0.65."
    )


def _detect_mime_type(image: bytes) -> str:
    if image.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if image.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if image.startswith(b"GIF87a") or image.startswith(b"GIF89a"):
        return "image/gif"
    if image.startswith(b"RIFF") and image[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


def analyze_waste_image(image: bytes, language: str = "en") -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise AIProviderError("AI_UNAVAILABLE", "AI service is not configured")

    if not image:
        raise AIProviderError("INVALID_IMAGE", "Invalid image file")

    image_base64 = base64.b64encode(image).decode("utf-8")
    mime_type = _detect_mime_type(image)
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": _build_prompt(language)},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_base64,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": 768,
            "responseMimeType": "application/json",
        },
    }

    last_error: AIProviderError | None = None

    for model_name in MODEL_CANDIDATES:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_name}:generateContent?key={GEMINI_API_KEY}"
        )

        try:
            response = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=AI_TIMEOUT_SECONDS,
            )
        except requests.exceptions.Timeout as exc:
            raise AIProviderError("AI_TIMEOUT", "AI analysis timed out. Please try again.") from exc
        except requests.exceptions.RequestException as exc:
            raise AIProviderError(
                "AI_UNAVAILABLE",
                "AI service is temporarily unavailable. Please try again.",
            ) from exc

        if response.status_code == 429:
            last_error = AIProviderError(
                "AI_PROVIDER_QUOTA",
                "AI provider quota is temporarily exhausted. Please try again later.",
                status_code=429,
            )
            continue

        if response.status_code in {500, 502, 503, 504}:
            last_error = AIProviderError(
                "AI_UNAVAILABLE",
                "AI service is temporarily unavailable. Please try again.",
                status_code=response.status_code,
            )
            continue

        if not response.ok:
            detail = response.text
            try:
                error_json = response.json()
                detail = error_json.get("error", {}).get("message", detail)
            except Exception:
                pass

            if response.status_code == 400 and "image" in detail.lower():
                raise AIProviderError("INVALID_IMAGE", "Invalid or unsupported image. Please upload a clear photo.")

            raise AIProviderError(
                "AI_UNAVAILABLE",
                f"AI service error: {detail}",
                status_code=response.status_code,
            )

        data = response.json()
        return _parse_gemini_response(data)

    if last_error:
        raise last_error

    raise AIProviderError(
        "AI_UNAVAILABLE",
        "AI service is temporarily unavailable. Please try again.",
    )


def _parse_gemini_response(data: Dict[str, Any]) -> Dict[str, Any]:
    candidates = data.get("candidates") or []
    if not candidates or not isinstance(candidates, list):
        return _build_unknown_result()

    first_candidate = candidates[0]
    text_response = _extract_text_from_candidate(first_candidate)
    if not text_response:
        return _build_unknown_result()

    parsed_json = _extract_json_object(text_response)
    if parsed_json:
        return _build_result_from_json(parsed_json)

    return _build_result_from_free_text(text_response)


def _extract_text_from_candidate(candidate: Dict[str, Any]) -> str:
    if not isinstance(candidate, dict):
        return ""

    content = candidate.get("content") or {}
    if isinstance(content, dict):
        parts = content.get("parts") or []
        if isinstance(parts, list) and parts:
            texts: List[str] = []
            for part in parts:
                if isinstance(part, dict) and part.get("text"):
                    texts.append(str(part["text"]))
            return "\n".join(texts).strip()

    return ""


def _extract_json_object(text: str) -> Dict[str, Any] | None:
    if not text:
        return None

    stripped = text.strip()
    if not stripped:
        return None

    start = stripped.find("{")
    if start == -1:
        return None

    candidate = stripped[start:]
    try:
        parsed = json.loads(candidate)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    return None


def _normalize_preparation_steps(raw_steps: Any, waste_type: str) -> List[str]:
    if isinstance(raw_steps, list):
        cleaned = [str(step).strip() for step in raw_steps if str(step).strip()]
        if cleaned:
            return cleaned[:4]

    return PREPARATION_STEPS.get(waste_type, PREPARATION_STEPS["Unknown Waste"])


def _normalize_waste_type(raw: str) -> str:
    if not raw:
        return "Unknown Waste"

    normalized = raw.strip()
    lookup = {item.lower(): item for item in WASTE_CLASSES}
    if normalized.lower() in lookup:
        return lookup[normalized.lower()]

    for waste_type in WASTE_CLASSES:
        if waste_type.lower() in normalized.lower() or normalized.lower() in waste_type.lower():
            return waste_type

    aliases = {
        "pet bottle": "Plastic Bottle",
        "plastic bottle (pet)": "Plastic Bottle",
        "aluminum can": "Metal Can",
        "tin can": "Metal Can",
        "metal can": "Metal Can",
        "cardboard box": "Cardboard",
        "paper": "Paper",
        "electronic waste": "Electronics",
        "e-waste": "Electronics",
        "ewaste": "Electronics",
    }
    return aliases.get(normalized.lower(), normalized)


def _build_result_from_json(parsed: Dict[str, Any]) -> Dict[str, Any]:
    waste_type = _normalize_waste_type(parsed.get("waste_type") or parsed.get("label") or "Unknown Waste")
    confidence = float(parsed.get("confidence", 0.0) or 0.0)

    if waste_type not in WASTE_CLASSES:
        return _build_unknown_result()

    if confidence < CONFIDENCE_THRESHOLD:
        # Keep a useful classification when the model is confident in label but omitted score.
        if parsed.get("waste_type") and waste_type != "Unknown Waste":
            confidence = max(CONFIDENCE_THRESHOLD, 0.72)
        else:
            return _build_unknown_result()

    category = CATEGORY_MAP.get(waste_type, "Unknown")
    recyclable = parsed.get("recyclable")
    if isinstance(recyclable, str):
        recyclable = recyclable.strip().lower() in {"true", "yes", "1"}
    elif recyclable is None:
        recyclable = RECYCLABLE_MAP.get(waste_type, False)
    else:
        recyclable = bool(recyclable)

    return {
        "waste_type": waste_type,
        "category": category,
        "recycling_category": category,
        "confidence": confidence,
        "eco_tip": ECO_TIPS.get(waste_type, ECO_TIPS["Unknown Waste"]),
        "recycling_advice": RECYCLING_ADVICE.get(waste_type, RECYCLING_ADVICE["Unknown Waste"]),
        "preparation_steps": _normalize_preparation_steps(parsed.get("preparation_steps"), waste_type),
        "recyclable": recyclable,
    }


def _build_result_from_free_text(text: str) -> Dict[str, Any]:
    normalized = text.lower()
    for waste_type in WASTE_CLASSES:
        if waste_type.lower() in normalized:
            return {
                "waste_type": waste_type,
                "category": CATEGORY_MAP.get(waste_type, "Unknown"),
                "recycling_category": CATEGORY_MAP.get(waste_type, "Unknown"),
                "confidence": max(CONFIDENCE_THRESHOLD, 0.7),
                "eco_tip": ECO_TIPS.get(waste_type, ECO_TIPS["Unknown Waste"]),
                "recycling_advice": RECYCLING_ADVICE.get(waste_type, RECYCLING_ADVICE["Unknown Waste"]),
                "preparation_steps": PREPARATION_STEPS.get(waste_type, PREPARATION_STEPS["Unknown Waste"]),
                "recyclable": RECYCLABLE_MAP.get(waste_type, False),
            }

    return _build_unknown_result()


def _build_unknown_result() -> Dict[str, Any]:
    return {
        "waste_type": "Unknown Waste",
        "category": "Unknown",
        "recycling_category": "Unknown",
        "confidence": 0.0,
        "eco_tip": ECO_TIPS["Unknown Waste"],
        "recycling_advice": RECYCLING_ADVICE["Unknown Waste"],
        "preparation_steps": PREPARATION_STEPS["Unknown Waste"],
        "recyclable": False,
    }
