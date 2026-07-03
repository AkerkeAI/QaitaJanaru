from __future__ import annotations

from typing import Any, Dict

from app.models.user import User

LEVEL_SCORE_PER_LEVEL = 100

WEEKLY_TASK_TARGETS: Dict[str, int] = {
    "weekly-scan-15": 15,
    "weekly-scan-30": 30,
    "weekly-earn-300": 300,
    "weekly-streak-5": 5,
    "weekly-chat-10": 10,
    "weekly-route-5": 5,
}

ACHIEVEMENT_DEFINITIONS: list[Dict[str, Any]] = [
    {
        "id": "achievement-first-login",
        "target": 1,
        "chapter": 1,
        "kind": "task",
        "task_id": "daily-login",
        "cap": 1,
    },
    {
        "id": "achievement-first-scan",
        "target": 1,
        "chapter": 1,
        "kind": "total_scans_cap",
        "cap": 1,
    },
    {
        "id": "achievement-first-eco-question",
        "target": 1,
        "chapter": 1,
        "kind": "task",
        "task_id": "weekly-chat-10",
        "cap": 1,
    },
    {
        "id": "achievement-first-recycling-visit",
        "target": 1,
        "chapter": 1,
        "kind": "map_route_sum_cap",
        "cap": 1,
    },
    {
        "id": "achievement-25-scans",
        "target": 25,
        "chapter": 2,
        "kind": "total_scans",
    },
    {
        "id": "achievement-20-questions",
        "target": 20,
        "chapter": 2,
        "kind": "task",
        "task_id": "weekly-chat-10",
    },
    {
        "id": "achievement-7-day-streak",
        "target": 7,
        "chapter": 2,
        "kind": "streak",
    },
    {
        "id": "achievement-complete-weekly",
        "target": 3,
        "chapter": 2,
        "kind": "weekly_completed",
    },
    {
        "id": "achievement-75-scans",
        "target": 75,
        "chapter": 3,
        "kind": "total_scans",
    },
    {
        "id": "achievement-14-day-streak",
        "target": 14,
        "chapter": 3,
        "kind": "streak",
    },
    {
        "id": "achievement-recycling-hero",
        "target": 500,
        "chapter": 3,
        "kind": "eco_points",
    },
    {
        "id": "achievement-earth-guardian",
        "target": 1000,
        "chapter": 3,
        "kind": "eco_points",
    },
]


def _task_progress(user: User, task_id: str) -> int:
    return int((user.task_progress or {}).get(task_id, 0) or 0)


def _count_completed_weekly_tasks(user: User) -> int:
    completed = 0
    for task_id, target in WEEKLY_TASK_TARGETS.items():
        if _task_progress(user, task_id) >= target:
            completed += 1
    return completed


def _achievement_progress(user: User, definition: Dict[str, Any]) -> int:
    kind = definition["kind"]

    if kind == "task":
        current = _task_progress(user, str(definition["task_id"]))
        cap = definition.get("cap")
        return min(current, cap) if cap is not None else current

    if kind == "total_scans_cap":
        return min(int(user.total_scans or 0), int(definition["cap"]))

    if kind == "total_scans":
        return int(user.total_scans or 0)

    if kind == "streak":
        return int(user.streak or 0)

    if kind == "eco_points":
        return int(user.eco_points or 0)

    if kind == "weekly_completed":
        return _count_completed_weekly_tasks(user)

    if kind == "map_route_sum_cap":
        combined = _task_progress(user, "daily-map-1") + _task_progress(
            user, "daily-route-1"
        )
        return min(combined, int(definition["cap"]))

    return 0


def count_completed_achievements(user: User) -> int:
    completed_count = 0
    previous_chapter_completed = True

    for chapter in (1, 2, 3):
        chapter_defs = [
            definition
            for definition in ACHIEVEMENT_DEFINITIONS
            if int(definition["chapter"]) == chapter
        ]
        unlocked = chapter == 1 or previous_chapter_completed
        if not unlocked:
            break

        chapter_complete = True
        for definition in chapter_defs:
            current = min(
                _achievement_progress(user, definition),
                int(definition["target"]),
            )
            if current >= int(definition["target"]):
                completed_count += 1
            else:
                chapter_complete = False

        previous_chapter_completed = chapter_complete
        if not chapter_complete:
            break

    return completed_count


def compute_level_score(user: User) -> int:
    total_scans = int(user.total_scans or 0)
    streak = int(user.streak or 0)
    achievements = count_completed_achievements(user)
    return total_scans * 3 + streak * 5 + achievements * 25


def calculate_level(user: User) -> int:
    score = compute_level_score(user)
    return max(1, score // LEVEL_SCORE_PER_LEVEL + 1)
