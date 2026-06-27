from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Tuple

from app.models.chat_message import ChatMessage
from app.models.user import User
from sqlalchemy.orm import Session

DAILY_TASKS: List[Dict[str, Any]] = [
    {
        "id": "daily-login",
        "title": "Войти сегодня",
        "description": "Войдите в приложение сегодня",
        "reward": 5,
        "target": 1,
        "type": "daily",
        "category": "visit",
        "icon": "📱",
    },
    {
        "id": "daily-scan-1",
        "title": "Отсканировать 1 продукт",
        "description": "Сделайте 1 сканирование сегодня",
        "reward": 5,
        "target": 1,
        "type": "daily",
        "category": "scan",
        "icon": "📸",
    },
    {
        "id": "daily-scan-3",
        "title": "Отсканировать 3 продукта",
        "description": "Сделайте 3 сканирования сегодня",
        "reward": 10,
        "target": 3,
        "type": "daily",
        "category": "scan",
        "icon": "📷",
    },
    {
        "id": "daily-chat-1",
        "title": "Написать ИИ один раз",
        "description": "Задайте 1 вопрос Эко-помощнику сегодня",
        "reward": 5,
        "target": 1,
        "type": "daily",
        "category": "eco_assistant",
        "icon": "🤖",
    },
    {
        "id": "daily-earn-20",
        "title": "Заработать 20 Эко-баллов сегодня",
        "description": "Получите 20 Эко-баллов за сегодня",
        "reward": 10,
        "target": 20,
        "type": "daily",
        "category": "points",
        "icon": "🌿",
    },
    {
        "id": "daily-route-1",
        "title": "Построить один маршрут переработки",
        "description": "Откройте 1 маршрут до пункта переработки сегодня",
        "reward": 8,
        "target": 1,
        "type": "daily",
        "category": "recycling",
        "icon": "🧭",
    },
    {
        "id": "daily-map-1",
        "title": "Посетить Карту переработки",
        "description": "Откройте Карту переработки сегодня",
        "reward": 5,
        "target": 1,
        "type": "daily",
        "category": "map",
        "icon": "🗺️",
    },
]

WEEKLY_TASKS: List[Dict[str, Any]] = [
    {
        "id": "weekly-scan-15",
        "title": "Отсканировать 15 продуктов",
        "description": "Сделайте 15 сканирований за неделю",
        "reward": 40,
        "target": 15,
        "type": "weekly",
        "category": "scan",
        "icon": "📸",
    },
    {
        "id": "weekly-scan-30",
        "title": "Отсканировать 30 продуктов",
        "description": "Сделайте 30 сканирований за неделю",
        "reward": 70,
        "target": 30,
        "type": "weekly",
        "category": "scan",
        "icon": "📷",
    },
    {
        "id": "weekly-earn-300",
        "title": "Заработать 300 Эко-баллов",
        "description": "Получите 300 Эко-баллов за неделю",
        "reward": 75,
        "target": 300,
        "type": "weekly",
        "category": "points",
        "icon": "🏆",
    },
    {
        "id": "weekly-streak-5",
        "title": "Поддерживать серию 5 дней",
        "description": "Достигните серии входов 5 дней",
        "reward": 50,
        "target": 5,
        "type": "weekly",
        "category": "streak",
        "icon": "🔥",
    },
    {
        "id": "weekly-chat-10",
        "title": "Использовать ИИ 10 раз",
        "description": "Отправьте 10 сообщений Эко-помощнику за неделю",
        "reward": 45,
        "target": 10,
        "type": "weekly",
        "category": "eco_assistant",
        "icon": "🤖",
    },
    {
        "id": "weekly-route-5",
        "title": "Построить 5 маршрутов переработки",
        "description": "Откройте 5 маршрутов до пунктов переработки за неделю",
        "reward": 55,
        "target": 5,
        "type": "weekly",
        "category": "recycling",
        "icon": "🧭",
    },
]

TASK_REWARDS: Dict[str, int] = {
    task["id"]: task["reward"] for task in DAILY_TASKS + WEEKLY_TASKS
}
TASK_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    task["id"]: task for task in DAILY_TASKS + WEEKLY_TASKS
}
DAILY_TASK_IDS = {task["id"] for task in DAILY_TASKS}
WEEKLY_TASK_IDS = {task["id"] for task in WEEKLY_TASKS}


def _utc_now() -> datetime:
    return datetime.utcnow()


def _utc_today() -> date:
    return _utc_now().date()


def _start_of_week(day: date) -> date:
    return day - timedelta(days=day.weekday())


def _ensure_json_fields(user: User) -> None:
    if user.task_progress is None:
        user.task_progress = {}
    if user.claimed_rewards is None:
        user.claimed_rewards = []


def _ensure_meta(user: User) -> None:
    _ensure_json_fields(user)
    progress = dict(user.task_progress or {})
    claimed = list(user.claimed_rewards or [])

    progress.setdefault("meta", {})
    meta = progress["meta"]
    meta.setdefault("daily", {})
    meta.setdefault("weekly", {})

    user.task_progress = progress
    user.claimed_rewards = claimed


def _get_meta_bucket(user: User, bucket: str) -> Dict[str, Any]:
    _ensure_meta(user)
    return user.task_progress["meta"][bucket]


def _increment_meta_counter(user: User, bucket: str, key: str, amount: int = 1) -> None:
    meta_bucket = _get_meta_bucket(user, bucket)
    meta_bucket[key] = int(meta_bucket.get(key, 0) or 0) + amount


def _set_meta_value(user: User, bucket: str, key: str, value: int) -> None:
    meta_bucket = _get_meta_bucket(user, bucket)
    meta_bucket[key] = value


def _clear_task_ids(user: User, task_ids: set[str]) -> None:
    _ensure_meta(user)
    progress = dict(user.task_progress or {})
    user.task_progress = {
        key: value for key, value in progress.items() if key not in task_ids
    }
    user.claimed_rewards = [
        task_id for task_id in (user.claimed_rewards or []) if task_id not in task_ids
    ]


def reset_daily_tasks_if_needed(user: User) -> bool:
    _ensure_meta(user)
    today = _utc_today()
    if user.last_daily_reset and user.last_daily_reset.date() == today:
        return False

    _clear_task_ids(user, DAILY_TASK_IDS)
    daily_meta = _get_meta_bucket(user, "daily")
    daily_meta.clear()
    user.last_daily_reset = datetime.combine(today, datetime.min.time())
    return True


def reset_weekly_tasks_if_needed(user: User) -> bool:
    _ensure_meta(user)
    current_week = _start_of_week(_utc_today())
    if user.last_weekly_reset and user.last_weekly_reset.date() == current_week:
        return False

    _clear_task_ids(user, WEEKLY_TASK_IDS)
    weekly_meta = _get_meta_bucket(user, "weekly")
    weekly_meta.clear()
    user.last_weekly_reset = datetime.combine(current_week, datetime.min.time())
    return True


def sync_task_state(user: User, db: Session | None = None) -> bool:
    changed = False
    if reset_daily_tasks_if_needed(user):
        changed = True
    if reset_weekly_tasks_if_needed(user):
        changed = True
    if changed and db is not None:
        db.add(user)
        db.commit()
        db.refresh(user)
    return changed


def _get_progress(user: User, task_id: str) -> int:
    return int((user.task_progress or {}).get(task_id, 0) or 0)


def _set_progress(user: User, task_id: str, value: int) -> None:
    _ensure_meta(user)
    user.task_progress[task_id] = max(0, int(value))


def recompute_all_task_progress(user: User, db: Session | None = None) -> None:
    _ensure_meta(user)
    sync_task_state(user)

    daily_meta = _get_meta_bucket(user, "daily")
    weekly_meta = _get_meta_bucket(user, "weekly")

    _set_progress(user, "daily-login", 1 if daily_meta.get("logged_in_today") else 0)
    _set_progress(user, "daily-scan-1", int(daily_meta.get("scans", 0)))
    _set_progress(user, "daily-scan-3", int(daily_meta.get("scans", 0)))
    _set_progress(user, "daily-chat-1", int(daily_meta.get("chat_messages", 0)))
    _set_progress(user, "daily-earn-20", int(daily_meta.get("earned_points", 0)))
    _set_progress(user, "daily-route-1", int(daily_meta.get("routes", 0)))
    _set_progress(user, "daily-map-1", int(daily_meta.get("map_visits", 0)))

    _set_progress(user, "weekly-scan-15", int(weekly_meta.get("scans", 0)))
    _set_progress(user, "weekly-scan-30", int(weekly_meta.get("scans", 0)))
    _set_progress(user, "weekly-earn-300", int(weekly_meta.get("earned_points", 0)))
    _set_progress(user, "weekly-streak-5", int(user.streak or 0))
    _set_progress(user, "weekly-chat-10", int(weekly_meta.get("chat_messages", 0)))
    _set_progress(user, "weekly-route-5", int(weekly_meta.get("routes", 0)))

    if db is not None:
        db.add(user)
        db.commit()
        db.refresh(user)


def build_task_payload(user: User) -> Dict[str, Any]:
    sync_task_state(user)
    recompute_all_task_progress(user)

    task_progress = user.task_progress or {}
    claimed_rewards = user.claimed_rewards or []

    def serialize(task: Dict[str, Any]) -> Dict[str, Any]:
        current = min(_get_progress(user, task["id"]), int(task["target"]))
        return {
            **deepcopy(task),
            "current": current,
            "completed": current >= int(task["target"]),
            "claimed": task["id"] in claimed_rewards,
        }

    return {
        "task_progress": {
            key: value for key, value in task_progress.items() if key != "meta"
        },
        "claimed_rewards": claimed_rewards,
        "last_daily_reset": user.last_daily_reset,
        "last_weekly_reset": user.last_weekly_reset,
        "daily_tasks": [serialize(task) for task in DAILY_TASKS],
        "weekly_tasks": [serialize(task) for task in WEEKLY_TASKS],
    }


def record_login(user: User) -> bool:
    _ensure_meta(user)
    sync_task_state(user)

    today = _utc_today()
    first_login_today = user.last_login_date != today
    if first_login_today:
        user.last_login_date = today
        _get_meta_bucket(user, "daily")["logged_in_today"] = 1
    else:
        _get_meta_bucket(user, "daily")["logged_in_today"] = 1

    recompute_all_task_progress(user)
    return first_login_today


def record_scan(user: User, earned_points: int) -> None:
    _ensure_meta(user)
    sync_task_state(user)
    _increment_meta_counter(user, "daily", "scans", 1)
    _increment_meta_counter(user, "weekly", "scans", 1)
    _increment_meta_counter(user, "daily", "earned_points", earned_points)
    _increment_meta_counter(user, "weekly", "earned_points", earned_points)
    recompute_all_task_progress(user)


def record_chat_message(user: User) -> None:
    _ensure_meta(user)
    sync_task_state(user)
    _increment_meta_counter(user, "daily", "chat_messages", 1)
    _increment_meta_counter(user, "weekly", "chat_messages", 1)
    recompute_all_task_progress(user)


def record_route_open(user: User) -> None:
    _ensure_meta(user)
    sync_task_state(user)
    _increment_meta_counter(user, "daily", "routes", 1)
    _increment_meta_counter(user, "weekly", "routes", 1)
    recompute_all_task_progress(user)


def record_map_visit(user: User) -> None:
    _ensure_meta(user)
    sync_task_state(user)
    _set_meta_value(user, "daily", "map_visits", 1)
    recompute_all_task_progress(user)


def claim_task_reward(user: User, task_id: str) -> Tuple[bool, int, str]:
    _ensure_meta(user)
    sync_task_state(user)
    recompute_all_task_progress(user)

    if task_id not in TASK_DEFINITIONS:
        return False, int(user.eco_points or 0), "Task not found"

    if task_id in (user.claimed_rewards or []):
        return False, int(user.eco_points or 0), "Reward already claimed"

    task = TASK_DEFINITIONS[task_id]
    current = _get_progress(user, task_id)
    if current < int(task["target"]):
        return False, int(user.eco_points or 0), "Task is not completed yet"

    reward = int(TASK_REWARDS.get(task_id, 0))
    user.eco_points = int(user.eco_points or 0) + reward
    user.level = max(1, user.eco_points // 100 + 1)
    user.claimed_rewards.append(task_id)

    db_user = user
    return True, int(db_user.eco_points), f"Reward claimed: +{reward}"


def auto_claim_completed_tasks(user: User) -> Dict[str, Any]:
    _ensure_meta(user)
    sync_task_state(user)
    recompute_all_task_progress(user)

    claimed_task_ids: List[str] = []
    daily_task_rewards = 0
    weekly_task_rewards = 0

    for task in DAILY_TASKS + WEEKLY_TASKS:
        task_id = task["id"]
        if task_id in user.claimed_rewards:
            continue

        current = _get_progress(user, task_id)
        target = int(task["target"])
        if current < target:
            continue

        reward = int(TASK_REWARDS.get(task_id, 0))
        user.eco_points = int(user.eco_points or 0) + reward
        user.claimed_rewards.append(task_id)
        claimed_task_ids.append(task_id)

        if task["type"] == "daily":
            daily_task_rewards += reward
        else:
            weekly_task_rewards += reward

    if claimed_task_ids:
        user.level = max(1, user.eco_points // 100 + 1)

    return {
        "claimed_task_ids": claimed_task_ids,
        "daily_task_rewards": daily_task_rewards,
        "weekly_task_rewards": weekly_task_rewards,
        "task_rewards": daily_task_rewards + weekly_task_rewards,
    }


def get_total_chat_messages_this_week(
    db: Session, user_id: int, week_start: datetime
) -> int:
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.is_user.is_(True),
            ChatMessage.timestamp >= week_start,
        )
        .count()
    )
