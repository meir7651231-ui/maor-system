"""מדיניות-שליחה: מתי מותר לפנות לחייב. טהור — בלי DB ובלי רשת.

כללי ברירת-מחדל שמרניים (לאישור עו"ד, ראו docs/MARKET-RESEARCH.md):
  • א׳–ה׳ 08:00–20:00 · ו׳ וערב חג 08:00–12:00 · שבת וחג — לא שולחים (הכרעת מאיר 6.11)
  • לוח חגים מובנה (ימי יום-טוב בישראל, 2026–2030; מאומת מול Intl hebrew) + HOLIDAYS ידני
  • לכל היותר הודעה יזומה אחת ל-72 שעות לאותו לקוח
  • לכל היותר 3 תזכורות לחשבונית; אחריהן — עצירה והודעה לבעל העסק (הכרעת מאיר 6.11)
  • opt-out / מחלוקת / הסדר פעיל ⇒ עצירה מלאה
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Asia/Jerusalem")

# weekday(): שני=0 ... ראשון=6
WINDOWS: dict[int, tuple[time, time] | None] = {
    6: (time(8), time(20)),   # ראשון
    0: (time(8), time(20)),
    1: (time(8), time(20)),
    2: (time(8), time(20)),
    3: (time(8), time(20)),   # חמישי
    4: (time(8), time(12)),   # שישי — לא אחר הצהריים
    5: None,                  # שבת
}
EVE_WINDOW = (time(8), time(12))   # ערב חג = כמו שישי

# ימי יום-טוב בישראל (ר"ה ×2, יוה"כ, סוכות, שמיני עצרת, פסח א׳ וז׳, שבועות).
# נוצר מ-Intl.DateTimeFormat('en-u-ca-hebrew') ונבדק מול לוח; ראו tests/test_round3_critic.py
BUILTIN_HOLIDAYS: frozenset[str] = frozenset((
    "2026-04-02", "2026-04-08", "2026-05-22", "2026-09-12", "2026-09-13", "2026-09-21",
    "2026-09-26", "2026-10-03", "2027-04-22", "2027-04-28", "2027-06-11", "2027-10-02",
    "2027-10-03", "2027-10-11", "2027-10-16", "2027-10-23", "2028-04-11", "2028-04-17",
    "2028-05-31", "2028-09-21", "2028-09-22", "2028-09-30", "2028-10-05", "2028-10-12",
    "2029-03-31", "2029-04-06", "2029-05-20", "2029-09-10", "2029-09-11", "2029-09-19",
    "2029-09-24", "2029-10-01", "2030-04-18", "2030-04-24", "2030-06-07", "2030-09-28",
    "2030-09-29", "2030-10-07", "2030-10-12", "2030-10-19",
))
HOLIDAYS_UNTIL = date(2030, 12, 31)   # אחרי זה ⇒ אין שליחה בכלל עד עדכון הטבלה (fail-closed)

MIN_GAP = timedelta(hours=72)
MAX_REMINDERS_PER_INVOICE = 3


@dataclass(frozen=True)
class Policy:
    holidays: frozenset[str] = frozenset()  # 'YYYY-MM-DD' נוספים (מעבר ללוח המובנה)

    def _all_holidays(self) -> frozenset[str]:
        return BUILTIN_HOLIDAYS | self.holidays

    def window(self, d: date) -> tuple[time, time] | None:
        hol = self._all_holidays()
        if d > HOLIDAYS_UNTIL or d.isoformat() in hol:
            return None
        win = WINDOWS[d.weekday()]
        if win and (d + timedelta(days=1)).isoformat() in hol:
            return EVE_WINDOW   # ערב חג: רק עד הצהריים
        return win

    def can_send_at(self, when: datetime) -> bool:
        local = when.astimezone(TZ)
        win = self.window(local.date())
        return bool(win) and win[0] <= local.time() < win[1]

    def next_allowed(self, when: datetime) -> datetime:
        """הרגע המותר הקרוב (כולל when עצמו)."""
        local = when.astimezone(TZ)
        for _ in range(0, 24 * 14):  # עד שבועיים קדימה, בדילוגי שעה
            if self.can_send_at(local):
                return local
            win = self.window(local.date())
            if win and local.time() < win[0]:
                local = local.replace(hour=win[0].hour, minute=0, second=0, microsecond=0)
                continue
            local = (local + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        raise ValueError("לא נמצא חלון שליחה בשבועיים הקרובים")


def customer_blocked(*, opted_out: bool, disputed: bool, plan_active: bool,
                     paused: str | None = None) -> str | None:
    if opted_out:
        return "opted_out"
    if disputed:
        return "disputed"
    if plan_active:
        return "plan_active"
    if paused:
        return paused  # למשל paid_claim — עד שבעל העסק בודק ומחדש
    return None


def gap_ok(last_sent: datetime | None, now: datetime) -> bool:
    return last_sent is None or now - last_sent >= MIN_GAP
