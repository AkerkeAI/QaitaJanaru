from datetime import date

from app.models.user import User

FREE_DAILY_SCAN_LIMIT = 3
FREE_DAILY_ASSISTANT_LIMIT = 10


class DailyLimitReachedError(Exception):
    def __init__(self, limit_type: str):
        self.limit_type = limit_type
        super().__init__(limit_type)


def reset_usage_limits_if_needed(user: User, local_date: date) -> bool:
    stored_date = user.last_limit_reset_date
    if stored_date == local_date:
        return False

    user.scans_used_today = 0
    user.assistant_messages_today = 0
    user.last_limit_reset_date = local_date
    return True


def consume_scan(user: User, local_date: date) -> None:
    reset_usage_limits_if_needed(user, local_date)
    if int(user.scans_used_today or 0) >= FREE_DAILY_SCAN_LIMIT:
        raise DailyLimitReachedError("DAILY_SCAN_LIMIT_REACHED")
    user.scans_used_today = int(user.scans_used_today or 0) + 1


def consume_assistant_message(user: User, local_date: date) -> None:
    reset_usage_limits_if_needed(user, local_date)
    if int(user.assistant_messages_today or 0) >= FREE_DAILY_ASSISTANT_LIMIT:
        raise DailyLimitReachedError("DAILY_ASSISTANT_LIMIT_REACHED")
    user.assistant_messages_today = int(user.assistant_messages_today or 0) + 1


def sync_usage_limits(user: User, local_date: date) -> None:
    reset_usage_limits_if_needed(user, local_date)
