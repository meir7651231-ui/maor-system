"""מבקר סבב 198 · 🔴 — תאריך מלא בנקודה (D.M / D.M.YYYY) במשפט ההבטחה נקרא כ«יום בחודש» בלבד.

רכיב: `app/conversation.py` → `extract_date_ctx` → `_promise_clause_date` (מנהל 260, «תאריך משפט ההבטחה גובר»):
הוא תופס «ב-10» מתוך «אשלם ב-10.12» ומחזיר את ה-10 **בחודש הקרוב** — החודש והשנה שהלקוח כתב נזרקים. `extract_date`
עצמו קורא נכון (10.12) — אבל `_promise_clause_date` רץ לפניו וגובר. בצורה «D/M» (קו נטוי) — תקין.
נבדק דרך `svc.inbound` (8.11.2026):
  «אשלם ב-10.12» ⇒ «רשמנו שהתשלום צפוי עד יום שלישי 10.11» + השהיה עד 11.11 — תזכורות חוזרות **חודש** לפני המועד.
  «אעביר ב-15.1» ⇒ 15.11 (חודשיים מוקדם) · «אשלם ב-5.1» ⇒ 5.12 · «אשלם ב-25.11.2027» ⇒ 25.11.2026 (השנה נזרקת).
קיים כבר ב-36d1acf0 (לפני q21-19) — לא רגרסיה של היום; מאז q21-19 הוא גם מגיע לכרטיס «בדוק ואשר» עם המועד הלא נכון.
D.M הוא כתיב התאריך הנפוץ בעברית ⇒ 🔴 (טעות בטוחה-בעצמה, מוקדמת — כמו מנהל 255).
xfail(strict=True); בקרות ירוקות."""
from datetime import date

import pytest

from app import conversation as cv

TODAY = date(2026, 11, 8)


def _req(text):
    d = cv.respond(text, cv.Context(business="סטודיו", today=TODAY))
    return getattr(d, "requested_date", None) or d.promise_date


@pytest.mark.xfail(strict=True, reason="198🔴: «ב-D.M» במשפט ההבטחה ⇒ D בחודש הקרוב (החודש/השנה נזרקים)")
@pytest.mark.parametrize(("text", "want"), [
    ("אשלם ב-10.12", date(2026, 12, 10)),
    ("אעביר ב-15.1", date(2027, 1, 15)),
    ("אני אשלם ב-3.1", date(2027, 1, 3)),
    ("אשלם ב-25.11.2027", date(2027, 11, 25)),
    ("I'll pay on 5.1.2027", date(2027, 1, 5)),
])
def test_dotted_full_date_in_promise_clause(text, want):
    assert _req(text) == want


@pytest.mark.xfail(strict=True, reason="198🔴: «אשלם ב-10.12» ⇒ ללקוח «עד 10.11» והשהיה עד 11.11")
def test_inbound_reply_and_pause_use_requested_month(svc):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "אשלם ב-10.12")
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],))["body"]
    assert "10.12" in body and "10.11" not in body, body


@pytest.mark.parametrize(("text", "want"), [
    ("אשלם ב-5/1", date(2027, 1, 5)),        # קו נטוי — תקין
    ("אשלם ב-25.11", date(2026, 11, 25)),     # החודש הנוכחי — תקין במקרה
])
def test_control_slash_and_current_month(text, want):
    assert _req(text) == want
