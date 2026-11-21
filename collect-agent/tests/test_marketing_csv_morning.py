"""«כל בוקר רשימה מוכנה» אצל עסק CSV — נכון רק אם הקובץ עדכני (ממצא גבי חיבורים b050cc8, findings §3).

עם API (חשבונית ירוקה / iCount / רווחית) עבודת הבוקר מסנכרנת לבד. עם CSV אין סנכרון: הרשימה נבנית מהקובץ
האחרון, ועבודת הבוקר מסמנת csv_upload_needed כשהייבוא האחרון מעל 24 שעות. בכל מקום שהמסר מזכיר CSV
(שני דפי הנחיתה, מייל הניסיון) כתוב בדיוק את זה. נועל: הטקסט בשלושת המקומות + הקוד (CSV_FRESH = 24 שעות,
csv_upload_needed בסיכום, רק למקור csv) + התנהגות (ייבוא טרי ⇒ False, ישן/חסר ⇒ True).
"""
import inspect
from datetime import datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

import pytest

ROOT = Path(__file__).resolve().parents[1]
PLACES = {
    "marketing/landing/index.html":
        "עם CSV היא נבנית מהקובץ האחרון שהעלית, וגבי מזכיר לך להעלות חדש כשהוא בן יותר מיום",
    "web/src/pages/Landing.tsx":
        "עם CSV היא נבנית מהקובץ האחרון שהעליתם, וגבי מזכיר לכם להעלות חדש כשהוא בן יותר מיום",
    "marketing/emails-trial.md":
        "עם CSV אין עדכון אוטומטי: הרשימה של כל בוקר נבנית מהקובץ האחרון שהעלית, וגבי מזכיר לך להעלות חדש כשהוא בן "
        "יותר מיום",
}
TZ = ZoneInfo("Asia/Jerusalem")


@pytest.mark.parametrize("rel", PLACES)
def test_csv_caveat_is_written_where_csv_is_mentioned(rel):
    assert PLACES[rel] in (ROOT / rel).read_text(encoding="utf-8"), rel


def test_every_marketing_csv_mention_has_the_caveat():
    """נכס חדש שמזכיר ייבוא CSV ו«כל בוקר»/«רשימה» בלי ההסתייגות ⇒ נכשל."""
    for rel in ["marketing/landing/index.html", "web/src/pages/Landing.tsx", "marketing/emails-trial.md",
                "marketing/posts.md", "marketing/faq/build.py", "marketing/landing/for/build.py"]:
        t = (ROOT / rel).read_text(encoding="utf-8")
        if "לייבא קובץ CSV" in t or "לייבא CSV" in t:
            assert "מזכיר" in t and "בן יותר מיום" in t, f"{rel}: מזכיר ייבוא CSV בלי «מהקובץ האחרון… מזכיר להעלות חדש»"


def test_code_flags_stale_csv_after_one_day():
    from app import morning
    assert morning.CSV_FRESH == timedelta(hours=24)
    assert 'svc.s.source_system == "csv"' in inspect.getsource(morning._summary)


class _DB:
    def __init__(self, m):
        self.m = m

    def one(self, sql, *_):
        # מנהל 374: חותמת הייבוא (business_settings) — אין בזיוף הזה ⇒ None (נופל ל-MAX(synced_at))
        return None if "business_settings" in sql else {"m": self.m}


@pytest.mark.parametrize("hours_ago,needed", [(2, False), (23, False), (25, True), (None, True)])
def test_csv_upload_needed_behaviour(hours_ago, needed):
    from app import morning
    now = datetime(2026, 11, 21, 7, 30, tzinfo=TZ)
    last = None if hours_ago is None else (now - timedelta(hours=hours_ago)).isoformat()
    svc = SimpleNamespace(db=_DB(last), clock=lambda: now)
    assert morning._csv_freshness(svc)["csv_upload_needed"] is needed
