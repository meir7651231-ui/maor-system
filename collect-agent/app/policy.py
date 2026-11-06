"""מדיניות-שליחה: מתי מותר לפנות לחייב. טהור — בלי DB ובלי רשת.

כללי ברירת-מחדל שמרניים (לאישור עו"ד, ראו docs/MARKET-RESEARCH.md):
  • א׳–ה׳ 09:00–19:00 · ו׳ 09:00–12:00 · שבת — לא שולחים · חגים מוגדרים — לא שולחים
  • לכל היותר הודעה יזומה אחת ל-72 שעות לאותו לקוח
  • לכל היותר 4 תזכורות לחשבונית; אחריהן — החלטת בעל העסק
  • opt-out / מחלוקת / הסדר פעיל ⇒ עצירה מלאה
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Asia/Jerusalem")

# weekday(): שני=0 ... ראשון=6
WINDOWS: dict[int, tuple[time, time] | None] = {
    6: (time(9), time(19)),   # ראשון
    0: (time(9), time(19)),
    1: (time(9), time(19)),
    2: (time(9), time(19)),
    3: (time(9), time(19)),   # חמישי
    4: (time(9), time(12)),   # שישי — לפני כניסת שבת
    5: None,                  # שבת
}

MIN_GAP = timedelta(hours=72)
MAX_REMINDERS_PER_INVOICE = 4


@dataclass(frozen=True)
class Policy:
    holidays: frozenset[str] = frozenset()  # 'YYYY-MM-DD' (ערב חג נחסם כיום שישי — להגדיר ידנית)

    def can_send_at(self, when: datetime) -> bool:
        local = when.astimezone(TZ)
        if local.date().isoformat() in self.holidays:
            return False
        win = WINDOWS[local.weekday()]
        return bool(win) and win[0] <= local.time() < win[1]

    def next_allowed(self, when: datetime) -> datetime:
        """הרגע המותר הקרוב (כולל when עצמו)."""
        local = when.astimezone(TZ)
        for _ in range(0, 24 * 14):  # עד שבועיים קדימה, בדילוגי שעה
            if self.can_send_at(local):
                return local
            win = WINDOWS[local.weekday()]
            if win and local.time() < win[0] and local.date().isoformat() not in self.holidays:
                local = local.replace(hour=win[0].hour, minute=0, second=0, microsecond=0)
                continue
            local = (local + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        raise ValueError("לא נמצא חלון שליחה בשבועיים הקרובים")


def customer_blocked(*, opted_out: bool, disputed: bool, plan_active: bool) -> str | None:
    if opted_out:
        return "opted_out"
    if disputed:
        return "disputed"
    if plan_active:
        return "plan_active"
    return None


def gap_ok(last_sent: datetime | None, now: datetime) -> bool:
    return last_sent is None or now - last_sent >= MIN_GAP
