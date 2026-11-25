"""מנהל 386 · סגירת מבקר 225🟡 — יתרה של חשבונית CSV שעולה בין קבצים (קובץ ישן) מסומנת לבעל העסק.

א. בהסדר מאושר: כרטיס `plan_amount_changed` בנוסח CSV — מזכיר קובץ ישן ולא דורש «לתאם» בעיוור. כרטיס אחד בלבד.
ב. בלי הסדר: כרטיס `csv_balance_rose` (כמו csv_reopened) — אחד לחשבונית/סכום/יום.
גבולות: ייבוא ראשון / ירידה / אותו סכום ⇒ אין כרטיס; סנכרון API ⇒ נוסח 203 המקורי."""
from dataclasses import replace
from datetime import timedelta

from app import service as S

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _row(amt, num="9001"):
    return f"{num},דנה כהן,050-1234567,d@x.example,{amt},פתוח,01/10/26,15/10/26\n"


def _imp(svc, *amts):
    svc.s = replace(svc.s, source_system="csv")
    for a in amts:
        svc.import_csv((H + _row(a)).encode())


def _cards(svc, intent):
    return [m["body"] for m in svc.db.q("SELECT body FROM messages WHERE intent=? AND needs_owner=1", (intent,))]


def test_rise_without_plan_card_text(svc, clock):
    _imp(svc, "1200", "800")
    clock.now += timedelta(days=1)
    _imp(svc, "1200")
    c = _cards(svc, "csv_balance_rose")
    assert len(c) == 1
    assert "9001" in c[0] and "קובץ ישן" in c[0] and "800" in c[0] and "1,200" in c[0]
    assert "050" not in c[0] and "דנה" not in c[0]   # בלי PII מעבר לנדרש
    assert svc.db.q("SELECT 1 FROM audit WHERE action='csv_balance_rose'")


def test_first_import_drop_and_same_no_card(svc, clock):
    _imp(svc, "1200", "1200", "800", "800")
    assert _cards(svc, "csv_balance_rose") == []


def test_card_once_per_day_per_amount(svc, clock):
    _imp(svc, "1200", "800", "1200", "1200")
    assert len(_cards(svc, "csv_balance_rose")) == 1
    _imp(svc, "800", "1200")   # שוב באותו יום, אותו סכום
    assert len(_cards(svc, "csv_balance_rose")) == 1
    clock.now += timedelta(days=1)
    _imp(svc, "800", "1200")
    # מנהל 389 (מבקר 227): ה-800 הוריד את הכרטיס של אתמול ⇒ פתוח רק החדש; שתי שורות בסך הכול
    assert len(_cards(svc, "csv_balance_rose")) == 1
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='csv_balance_rose'")["n"] == 2


def test_plan_single_card_csv_wording(svc, clock):
    _imp(svc, "1200")
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"]
    svc.approve_plan(svc.propose_plan(cid, 3), confirm_amount=True)
    clock.now += timedelta(days=5)
    _imp(svc, "800")
    clock.now += timedelta(days=1)
    _imp(svc, "1200")
    plan = _cards(svc, "plan_amount_changed")
    assert len(plan) == 1 and "קובץ ישן" in plan[0] and "אל תדרשו" in plan[0]
    assert _cards(svc, "csv_balance_rose") == []   # לא שני כרטיסים על אותו אירוע


def test_api_wording_unchanged():
    t = S.plan_raised_text("דנה", "9001", 80000, 120000)
    assert "כדאי לתאם עם הלקוח" in t and "קובץ" not in t
    c = S.plan_raised_text("דנה", "9001", 80000, 120000, csv=True)
    assert "קובץ ישן" in c and c.endswith("יחזרו לאישורכם.")


def test_source_guard():
    import inspect
    src = inspect.getsource(S.CollectService._ingest_rows)
    assert "_notify_csv_balance_rose" in src and "_in_approved_plan" in src
