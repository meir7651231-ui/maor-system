"""השאלות והתשובות בשני דפי הנחיתה (הסטטי ו-/app/) + טבלת «מה גבי עושה עם תשובה» — כל טענה מול הקוד.

כמו דפי הענף (test_vertical_faq_claims) ודף השאלות (test_faq_page): הטקסטים כאן נכתבו ביד, ושום דבר לא
בדק שהמוצר עדיין עושה את מה שהם אומרים. נועל: (1) כל תשובה בשני הדפים ממופה לבדיקה — תשובה חדשה בלי מיפוי
⇒ נכשל · (2) כל בדיקה רצה מול הקוד: מנוע השיחה (respond), המסנן, המדיניות, ההגדרות, התבניות.
"""
import inspect
import re
from datetime import date
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
STATIC = (ROOT / "marketing/landing/index.html").read_text(encoding="utf-8")
APP = (ROOT / "web/src/pages/Landing.tsx").read_text(encoding="utf-8")


def _static_faq() -> dict[str, str]:
    return dict(re.findall(r"<details><summary>([^<]+)</summary><p>([^<]+)</p></details>",
                           STATIC[STATIC.index('id="faq"'):]))


def _tsx_block(name: str) -> dict[str, str]:
    """const FAQ = [ ['שאלה', 'תשובה' | `תשובה`], … ] ב-Landing.tsx."""
    block = APP[APP.index(f"const {name} = ["):]
    block = block[:block.index("\n]")]
    return {q: a or b for q, a, b in re.findall(r"\[\s*'([^']+)',\s*(?:'([^']*)'|`([^`]*)`)", block)}


def _ctx():
    from app import conversation as c
    return c.Context(today=date(2026, 11, 8), business="סטודיו נועה", customer_name="דני כהן",
                     invoices=(c.OpenInvoice("1043", 180000),), payment_link="https://pay.example/x")


def _respond(text):
    from app import conversation as c
    return c.respond(text, _ctx())


def _sms():
    from app import templates
    f = templates.fields(biz="סטודיו נועה", name="דני כהן", num="1043", amount_agorot=180000, currency="ILS",
                         link="https://pay.example/x", unsub="https://gabi.example/u/x",
                         short="https://gabi.example/p/AbC1234")
    return [templates.render_sms(st, f) for st in templates.STEPS]


# ── הבדיקות ──────────────────────────────────────────────────────────────────────────────────────────────
def _sources():           # הנעילה המלאה (תווית + «בבדיקה» + CSV) — tests/test_marketing_sources.py
    return 'SOURCES[k][0]' in (ROOT / "tests/test_marketing_sources.py").read_text("utf-8")


def _read_only():
    return "def test_adapters_are_read_only_static" in (ROOT / "tests/test_invoice_sources.py").read_text("utf-8")


def _business_name():
    return all(s.startswith("סטודיו נועה:") for s in _sms())


def _paid_stops_and_asks():
    from app import conversation as c
    d = _respond("שילמתי אתמול")
    return d.intent == c.Intent.PAID_CLAIM and d.stop != c.Stop.NONE and d.auto_send is False


def _max_three():
    from app import policy, templates
    return policy.MAX_REMINDERS_PER_INVOICE == 3 == len(templates.STEPS)


def _not_a_letter():
    from app import compliance
    r = compliance.Rules(business="סטודיו נועה", payment_link="https://pay.example/x", allow_debt_word=True)
    return "warning_letter" in compliance.violations("סטודיו נועה: מכתב דרישה. https://pay.example/x", r)


def _price():
    from app.config import Settings
    s = Settings()
    return (s.price_ils_month, s.price_ils_year, s.trial_days) == (119, 1190, 14)


def _approve_each():
    from app import service
    return service.ACTIVE[0] == "pending_approval"


def _amount_checked():
    return (ROOT / "tests/test_approved_amount_drift.py").is_file() and \
        (ROOT / "tests/test_between_approve_and_send.py").is_file()


def _channels_link_unsub():
    from app.config import Settings
    return set(Settings().channels) == {"sms", "email"} and all("/p/" in s and "להפסקה" in s for s in _sms())


def _hours():
    from app import policy
    return f"{policy.DAY[0]:%H:%M}" == "08:00" and f"{policy.DAY[1]:%H:%M}" == "20:00" \
        and policy.WINDOWS[4] == policy.SHORT and policy.WINDOWS[5] is None and bool(policy.HOLIDAYS)


def _no_money():
    return '"we_hold_money": False' in (ROOT / "app/settings_api.py").read_text("utf-8")


def _no_percent():
    return (ROOT / "tests/test_pricing_single_source.py").is_file() and _price()


def _how_to_pay():
    from app import conversation as c
    d = _respond("איך משלמים?")
    return d.intent == c.Intent.HOW_TO_PAY and d.auto_send is False and d.reply and "https://pay.example/x" in d.reply


def _plan():
    from app import conversation as c
    from app import plans
    d = _respond("אפשר בתשלומים?")
    no_extra = sum(i.amount_agorot for i in plans.propose(180000, date(2026, 11, 8), 3)) == 180000
    return d.auto_send is False and no_extra and d.intent == c.Intent.PLAN_REQUEST


def _dispute():
    from app import conversation as c
    d = _respond("יש פה טעות בחשבונית")
    return d.stop != c.Stop.NONE and d.escalate == c.Escalation.URGENT


def _opt_out():
    from app import conversation as c
    return _respond("הסר").stop == c.Stop.PERMANENT


def _csv_stale_flag():
    from datetime import timedelta

    from app import morning
    return morning.CSV_FRESH == timedelta(hours=24) and "csv_upload_needed" in inspect.getsource(morning)


# ביטוי מתוך התשובה ⇒ הבדיקה שמוכיחה אותו. כל תשובה חייבת להכיל לפחות ביטוי אחד מכאן.
CLAIMS = {
    "חשבונית ירוקה (morning), iCount ורווחית": _sources,
    "רק קורא חשבוניות פתוחות": _read_only, "קורא חשבוניות פתוחות דרך מפתח API": _read_only,
    "בשם העסק שלך": _business_name,
    "גבי עוצר ושואל אותך": _paid_stops_and_asks, "עוצר את התזכורות ומבקש מכם לבדוק": _paid_stops_and_asks,
    "לכל היותר 3 לכל חשבונית": _max_three,
    "אלה תזכורות עובדתיות": _not_a_letter,
    "כולל מע״מ ככל שחל": _price,
    "שום הודעה לא יוצאת בלי שאישרת": _approve_each,
    "לפני כל שליחה הסכום נבדק": _amount_checked,
    "SMS ומייל. בכל הודעה יש קישור": _channels_link_unsub,
    "בין 08:00 ל-20:00": _hours,
    "אנחנו לא מחזיקים כסף": _no_money,
    "רק מנוי קבוע": _no_percent,
    "מכין מענה עם קישור התשלום, לאישורכם": _how_to_pay,
    "מכין הצעה בלי תוספת, ומחכה לאישורכם": _plan,
    "עוצר הכול ומסמן אצלכם «דחוף»": _dispute,
    "מפסיק לפנות ללקוח הזה": _opt_out,
    "מזכיר לך להעלות חדש כשהוא בן יותר מיום": _csv_stale_flag,
    "מזכיר לכם להעלות חדש כשהוא בן יותר מיום": _csv_stale_flag,
}


def _all_answers():
    out = [(f"דף סטטי · {q}", a) for q, a in _static_faq().items()]
    out += [(f"/app/ · {q}", a) for q, a in _tsx_block("FAQ").items()]
    out += [(f"/app/ תשובות · {q}", a) for q, a in _tsx_block("REPLIES").items()]
    return out


def test_parsed_all_blocks():
    assert len(_static_faq()) >= 7 and len(_tsx_block("FAQ")) >= 10 and len(_tsx_block("REPLIES")) == 5


@pytest.mark.parametrize("name,answer", _all_answers(), ids=[n for n, _ in _all_answers()])
def test_every_answer_is_mapped_and_true_in_code(name, answer):
    hits = [k for k in CLAIMS if k in answer]
    assert hits, f"{name}: תשובה בלי בדיקה מול הקוד — להוסיף ל-CLAIMS: «{answer}»"
    for k in hits:
        assert CLAIMS[k](), f"{name}: «{k}» כבר לא נכון בקוד"
