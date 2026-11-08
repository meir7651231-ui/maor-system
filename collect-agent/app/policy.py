"""מדיניות-שליחה: מתי מותר לפנות לחייב. טהור — בלי DB ובלי רשת.

הכרעת מאיר (6.11.2026), לאישור עו"ד:
  • 08:00–20:00 · שישי וערב חג: 08:00–12:00 בלבד (בלי שישי אחה"צ) · שבת וחג — לא שולחים
  • לוח חגים מובנה (`HOLIDAYS`, יום טוב בלבד; חושב מלוח עברי) + ימי שקט (`QUIET_DAYS`: תשעה באב,
    יום הזיכרון, יום השואה) + חגים נוספים מהגדרות העסק
  • לכל היותר הודעה יזומה אחת ל-72 שעות לאותו לקוח
  • לכל היותר **3** תזכורות ללקוח לאפיזודת חוב, בהודעה מאוחדת על כל החשבוניות (הכרעת מאיר 7.11,
    critic 15.1; השם `MAX_REMINDERS_PER_INVOICE` נשמר לתאימות); אחריהן — עצירה והתראה לבעל העסק
  • opt-out / מחלוקת / הסדר פעיל / השהיה ⇒ עצירה מלאה
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

# מקור יחיד לאזור הזמן, ולא הגדרה: חלון 08–20, שבת והחגים מוגדרים לפי שעון ישראל, וגבי פונה רק
# לחייבים בישראל. (critic 3.5: היה גם `Settings.timezone`, שלא נקרא מאף מקום — הוסר כדי שלא ייראה
# כאילו אפשר לשנות אותו; test_critic_open_items נועל.)
TZ = ZoneInfo("Asia/Jerusalem")

DAY = (time(8), time(20))
SHORT = (time(8), time(12))       # שישי / ערב חג — בלי אחר הצהריים

# weekday(): שני=0 ... ראשון=6
WINDOWS: dict[int, tuple[time, time] | None] = {
    6: DAY, 0: DAY, 1: DAY, 2: DAY, 3: DAY,   # ראשון–חמישי
    4: SHORT,                                 # שישי
    5: None,                                  # שבת
}

# יום טוב (אין שליחה) ⇒ ערב החג (חלון קצר). חושב מלוח עברי (pyluach) ונבדק ב-test_policy.
# 5787–5789. לפני 1.9.2029 יש להאריך (בדיקה נופלת כשהטבלה עומדת להיגמר).
HOLIDAYS: dict[str, str] = {
    "2026-09-12": "ראש השנה", "2026-09-13": "ראש השנה", "2026-09-21": "יום כיפור",
    "2026-09-26": "סוכות", "2026-10-03": "שמיני עצרת",
    "2027-04-22": "פסח", "2027-04-28": "שביעי של פסח", "2027-06-11": "שבועות",
    "2027-10-02": "ראש השנה", "2027-10-03": "ראש השנה", "2027-10-11": "יום כיפור",
    "2027-10-16": "סוכות", "2027-10-23": "שמיני עצרת",
    "2028-04-11": "פסח", "2028-04-17": "שביעי של פסח", "2028-05-31": "שבועות",
    "2028-09-21": "ראש השנה", "2028-09-22": "ראש השנה", "2028-09-30": "יום כיפור",
    "2028-10-05": "סוכות", "2028-10-12": "שמיני עצרת",
    "2029-03-31": "פסח", "2029-04-06": "שביעי של פסח", "2029-05-20": "שבועות",
}
# ימי שקט (הכרעת מאיר 7.11.2026, critic 3.6.6): לא חג, אבל לא שולחים תזכורת תשלום —
# תשעה באב · יום הזיכרון לחללי מערכות ישראל · יום השואה. כמו חג: אין שליחה ביום עצמו, והיום שלפניו
# (שבו הצום/יום הזיכרון נכנס בערב) מקבל חלון קצר 08:00–12:00 — שמרני. חושב מלוח עברי, עם הדחיות:
#   • תשעה באב (ט׳ באב) שחל בשבת ⇒ נדחה ליום ראשון (י׳ באב)
#   • יום השואה (כ״ז בניסן): שישי ⇒ חמישי · ראשון ⇒ שני (חוק יום הזיכרון לשואה ולגבורה)
#   • יום הזיכרון (ד׳ באייר): חמישי/שישי ⇒ רביעי · ראשון ⇒ שני (חוק יום הזיכרון לחללי מערכות ישראל)
# בדיקה עצמאית מול לוח עברי מחושב: tests/test_owner_decisions_nov7.py.
QUIET_DAYS: dict[str, str] = {
    "2027-05-04": "יום השואה", "2027-05-11": "יום הזיכרון", "2027-08-12": "תשעה באב",
    "2028-04-24": "יום השואה", "2028-05-01": "יום הזיכרון", "2028-08-01": "תשעה באב",
    "2029-04-12": "יום השואה", "2029-04-18": "יום הזיכרון", "2029-07-22": "תשעה באב",
}
HOLIDAYS_VALID_UNTIL = date(2029, 8, 31)

MIN_GAP = timedelta(hours=72)
MAX_REMINDERS_PER_INVOICE = 3
MANUAL_ONLY_AFTER_DAYS = 3 * 365   # ר-7: חשבונית מעל 3 שנים ⇒ טיפול ידני בלבד


def invoice_too_old(r, today: date) -> bool:
    """ר-7: חשבונית (לפי תאריך ההנפקה, אחרת המועד) מעל 3 שנים ⇒ טיפול ידני בלבד."""
    born = r["issued"] or r["due"]
    return bool(born) and (today - date.fromisoformat(born)).days > MANUAL_ONLY_AFTER_DAYS
RETENTION_DAYS = 90                # ר-10: חוב סגור ⇒ מחיקה/התממה אחרי 90 יום (אלא legal hold)
OWNER_HOLDS = ("minor", "deceased", "insolvency")   # ר-6: סימון בעל העסק = השהיה קשה


@dataclass(frozen=True)
class Policy:
    holidays: frozenset[str] = frozenset()          # חגים נוספים מהגדרות העסק
    builtin: dict[str, str] = field(default_factory=lambda: {**HOLIDAYS, **QUIET_DAYS})

    def _is_holiday(self, d: date) -> bool:
        iso = d.isoformat()
        return iso in self.holidays or iso in self.builtin

    def window(self, d: date) -> tuple[time, time] | None:
        # review/hostile-review חור 10: אחרי סוף הלוח המובנה אין לנו מידע על חגים ⇒ fail-closed
        if self._is_holiday(d) or d > HOLIDAYS_VALID_UNTIL:
            return None
        win = WINDOWS[d.weekday()]
        if win and self._is_holiday(d + timedelta(days=1)):
            return SHORT  # ערב חג = כמו שישי
        return win

    def reason_closed(self, when: datetime) -> str | None:
        """למה אסור עכשיו (לתצוגה לבעל העסק), או None אם מותר."""
        local = when.astimezone(TZ)
        d = local.date()
        if d > HOLIDAYS_VALID_UNTIL:
            return "לוח החגים המובנה פג — יש לעדכן את policy.HOLIDAYS"
        if d.isoformat() in QUIET_DAYS and d.isoformat() in self.builtin:
            return f"יום שקט ({QUIET_DAYS[d.isoformat()]})"
        if self._is_holiday(d):
            return f"חג ({self.builtin.get(d.isoformat(), 'חג')})"
        if d.weekday() == 5:
            return "שבת"
        win = self.window(d)
        if not win:
            return "שבת"
        if not (win[0] <= local.time() < win[1]):
            return f"מחוץ לשעות {win[0]:%H:%M}–{win[1]:%H:%M}"
        return None

    def can_send_at(self, when: datetime) -> bool:
        return self.reason_closed(when) is None

    def next_allowed(self, when: datetime) -> datetime:
        """הרגע המותר הקרוב (כולל when עצמו)."""
        local = when.astimezone(TZ)
        for _ in range(0, 24 * 14):  # עד שבועיים קדימה
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
