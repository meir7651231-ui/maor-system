"""5 טיוטות הפוסטים (marketing/posts.md) — כל טענה מוצרית מול הקוד.

הפוסטים נבדקו עד היום רק על דומיין, בידול, «כל בוקר» ו«אישור» — לא על רשימת ההבטחות עצמה (פוסט 3: «לכל היותר
3», «08:00–20:00», «הסרה בכל הודעה», «בלי איומים», «לא נוגעים בכסף»; שקף 4 / פוסט 4: «שילם? התזכורות נעצרות
לבד»). נועל: כל שורת ✓ וכל שקף ממופים לבדיקה (שורה חדשה בלי מיפוי ⇒ נכשל), וכל בדיקה רצה מול הקוד. הבדיקות
המשותפות עם דפי הנחיתה מגיעות מ-test_landing_claims (מקור אחד).
"""
import importlib.util
import inspect
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
POSTS = (ROOT / "marketing/posts.md").read_text(encoding="utf-8")
_spec = importlib.util.spec_from_file_location("landing_claims", Path(__file__).parent / "test_landing_claims.py")
L = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(L)


def _closed_at_source_stops():
    """«לקוח שילם? התזכורות נעצרות לבד» / «כשהחשבונית נסגרת… נעצרות»: הסנכרון מבטל תזכורות של חשבונית שנסגרה."""
    from app.service import CollectService
    sync_src = inspect.getsource(CollectService)
    beh = (ROOT / "tests/test_between_approve_and_send.py").read_text("utf-8")
    return '_cancel_invoice(row["id"], "invoice_closed")' in sync_src and "def test_paid_at_source_with_sync(" in beh


def _finds_unpaid_itself():
    from app.service import CollectService
    return callable(CollectService.sync) and (ROOT / "app/morning.py").is_file()


def _one_click_approve():
    main = (ROOT / "app/main.py").read_text("utf-8")
    return '@app.post("/reminders/{rid}/approve"' in main and L._approve_each()


def _no_threats_no_marketing():
    from app import compliance
    r = compliance.Rules(business="סטודיו נועה", payment_link="https://pay.example/x", allow_debt_word=True)
    threat = compliance.violations("סטודיו נועה: נעביר לטיפול עו״ד ולבית משפט. https://pay.example/x", r)
    promo = compliance.violations("סטודיו נועה: מבצע חדש! הצטרפו עכשיו. https://pay.example/x", r)
    return bool(threat) and bool(promo)


CLAIMS = {
    "שום הודעה לא יוצאת בלי שאישרת": L._approve_each, "אתה מאשר כל הודעה": L._approve_each,
    "אתה מאשר, וההודעה יוצאת בשם העסק שלך": L._business_name,
    "לחיצה אחת לאישור": _one_click_approve,
    "לכל היותר 3 תזכורות לחשבונית": L._max_three,
    "רק בין 08:00 ל-20:00": L._hours, "בשעה סבירה": L._hours,
    "בכל הודעה יש אפשרות הסרה": L._channels_link_unsub,
    "בלי איומים ובלי שיווק": _no_threats_no_marketing,
    "הכסף עובר ישירות לעמוד התשלום שלך": L._no_money,
    "התזכורות נעצרות": _closed_at_source_stops,
    "מוצא לבד את החשבוניות שלא שולמו": _finds_unpaid_itself,
    "רק קריאה": L._read_only,
    "חשבונית ירוקה, iCount או רווחית": L._sources,
    "₪119 לחודש": L._price,
    "לא לוקחים אחוז": L._no_percent, "ואין עמלות הצלחה": L._no_percent,
}


def _claim_lines():
    """שורות שהן הבטחה: כל ✓, שקפים 2–4, וכל שורה עם מספר/מחיר/«נעצרות»/«מאשר» בגוף הפוסטים."""
    body = POSTS[POSTS.index("## פוסט 1"):POSTS.index("### בדיקה לפני פרסום")]
    rx = re.compile(r"^✓|^\*\*שקף [234]|₪|נעצרות|מאשר|אישור|עמלות|אחוז|08:00|קריאה")
    return [ln.strip() for ln in body.splitlines() if rx.search(ln.strip()) and not ln.startswith("## ")]


def test_found_the_claim_lines():
    assert len(_claim_lines()) >= 12


@pytest.mark.parametrize("line", _claim_lines(), ids=lambda s: s[:40])
def test_every_post_claim_is_mapped_and_true_in_code(line):
    hits = [k for k in CLAIMS if k in line]
    assert hits, f"שורת הבטחה בלי בדיקה מול הקוד — להוסיף ל-CLAIMS: «{line}»"
    for k in hits:
        assert CLAIMS[k](), f"«{k}» כבר לא נכון בקוד"
