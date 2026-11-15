"""תקציב אורך ה-SMS מול הדומיין ושם העסק (יעד עלות: ≤2 חלקים; תקרה משפטית 3).

ממצא (גבי חיבורים): הבדיקות הקיימות מודדות רק שם עסק קצר. כל תו בדומיין של הקישור הקצר מוריד
תו משם העסק. עם gabi.co.il (10 תווים) שם עסק עד 22 תווים נשאר ב-2 חלקים במקרה הטיפוסי;
עם דומיין של 19 תווים — רק 13. במקרה הקיצוני (שם לקוח ארוך + מספר חשבונית ארוך + סכום בן 6 ספרות)
גם שם עסק קצר מגיע ל-3 חלקים. ההמלצה לדומיין: עד 10 תווים.
הבדיקה נכשלת אם נוסח ה-SMS מתארך (ומקטין את התקציב) — ההחלטה אז מודעת, לא בשקט.
"""
from __future__ import annotations

import pytest

from app import templates as t
from app.channels import sms_segments

CODE = "AbC12xY"   # 7 תווים, כמו _short_code


def _worst(biz: str, base: str) -> int:
    w = 0
    for st in t.STEPS:
        f = t.fields(biz=biz, name="דנה לוי", num="2001", amount_agorot=120000, currency="ILS",
                     link="https://pay.example/x", unsub=f"{base}/u/t", short=f"{base}/p/{CODE}")
        w = max(w, sms_segments(t.render_sms(st, f))["segments"])
    for st in t.STEPS_MULTI:
        f = t.fields_multi(biz=biz, name="דנה לוי", invoices=[("2001", 120000), ("2002", 50000)],
                           currency="ILS", link="https://pay.example/x", unsub=f"{base}/u/t",
                           short=f"{base}/p/{CODE}")
        w = max(w, sms_segments(t.render_sms(st, f))["segments"])
    return w


def _max_biz(base: str) -> int:
    return max((k for k in range(1, 60) if _worst("א" * k, base) <= 2), default=0)


@pytest.mark.parametrize("base,at_least", [
    ("https://gabi.example", 20),       # היום
    ("https://gabi.co.il", 22),         # דומיין מומלץ (≤10 תווים)
])
def test_business_name_budget_for_two_segments(base, at_least):
    assert _max_biz(base) >= at_least, f"{base}: רק {_max_biz(base)} תווים לשם העסק"


def test_every_domain_char_costs_one_business_char():
    short, long_ = _max_biz("https://gabi.co.il"), _max_biz("https://gabi-tizkorot.co.il")
    assert short - long_ == len("gabi-tizkorot.co.il") - len("gabi.co.il")      # 9


def test_never_above_legal_cap_even_in_extreme_case():
    """גם בקצה (שם עסק 37 תווים, שם לקוח ארוך, מספר ארוך, סכום 6 ספרות) — לא מעל 3 חלקים."""
    base = "https://gabi-tizkorot.co.il"
    for st in t.STEPS:
        f = t.fields(biz="קליניקת השיניים של ד״ר רונית אברהמי", name="אלכסנדרה בן־שושן",
                     num="INV-2026-000123", amount_agorot=12345678, currency="ILS",
                     link="https://pay.example/x", unsub=f"{base}/u/t", short=f"{base}/p/{CODE}")
        body = t.render_sms(st, f)
        assert sms_segments(body)["segments"] <= 3 and len(body) <= t.SMS_HARD_MAX, (st.key, len(body))
