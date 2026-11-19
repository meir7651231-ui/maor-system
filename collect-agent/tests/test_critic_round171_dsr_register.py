"""critic סבב 171 · 🟠 לתיקון בונה — מרשם בקשות נושאי מידע (`dc10bdfc`, §13–14, מועד 30 יום).

א. רכיב: `app/dsr.py` → `detect` (`_ACCESS` / `_DELETE`). ניסוחים נפוצים לא נרשמים — ההודעה מטופלת כהסרה/«לא ברור»
   בלבד, **בלי** בקשה במרשם ובלי מועד: «מחקו את המידע שלי» (ציווי בלי ת׳), «מבקש מחיקה של המידע שלי»,
   «please delete my information», «erase my details», «what information do you have about me»,
   «אני רוצה לראות איזה מידע יש לכם עליי». בעל העסק לא יודע שרץ מועד חוקי של 30 יום.
ב. רכיב: `app/inbox.py` → `assign_shared_card` ⇒ `handle_customer` ⇒ `dsr.open_request(... svc.clock())`.
   בקשה מכתובת משותפת («תמחקו את כל הפרטים שלי מהמאגר» מ-fam@ex.com) **לא** נרשמת עם קבלתה; היא נרשמת רק ביום
   השיוך, עם `received_at` = יום השיוך ⇒ המועד זז. נמדד: שיוך ביום 20 ⇒ due = יום 50 (במקום יום 30): בעל העסק
   רואה «נותרו 30 יום» כשבפועל נותרו 10. הצעה: מועד לפי `created_at` של הכרטיס/ההודעה המקורית (או רישום מיידי
   כבקשה ללא לקוח, שמשויכת בשיוך). הבדיקות xfail(strict=True); הבקרות נשארות ירוקות."""
from datetime import timedelta

import pytest

from app import dsr

MISSED = [("מחקו את המידע שלי", "deletion"), ("מבקש מחיקה של המידע שלי", "deletion"),
          ("please delete my information", "deletion"), ("erase my details", "deletion"),
          ("what information do you have about me", "access"),
          ("אני רוצה לראות איזה מידע יש לכם עליי", "access")]


@pytest.mark.xfail(strict=True, reason="critic 171א: ניסוח נפוץ של בקשת עיון/מחיקה לא נרשם במרשם (לתיקון בונה)")
@pytest.mark.parametrize("text,kind", MISSED)
def test_common_phrasing_opens_request(svc, text, kind):
    svc.sync()
    svc.inbound("sms", "0501234567", text)
    assert [r["kind"] for r in dsr.listing(svc)] == [kind]


@pytest.mark.parametrize("text,kind", [("תמחקו את כל הפרטים שלי מהמאגר", "deletion"),
                                       ("מה המידע שיש לכם עליי", "access")])
def test_control_detected_phrasing(svc, text, kind):
    svc.sync()
    svc.inbound("sms", "0501234567", text)
    assert [r["kind"] for r in dsr.listing(svc)] == [kind]


def _shared(svc):
    svc.sync()
    svc.import_csv(("מספר חשבונית,לקוח,סכום,תאריך לתשלום,טלפון,מייל\n"
                    "3,רונית לוי,300,2026-10-01,050-0001111,fam@ex.com\n"
                    "4,משה כהן,400,2026-10-01,050-0002222,fam@ex.com\n").encode())
    return svc.email_webhook("fam@ex.com", "תמחקו את כל הפרטים שלי מהמאגר", "")


@pytest.mark.xfail(strict=True, reason="critic 171ב: מועד בקשה מכתובת משותפת נספר מיום השיוך (לתיקון בונה)")
def test_shared_request_due_counts_from_receipt(svc, clock):
    received = clock.now
    out = _shared(svc)
    clock.now += timedelta(days=20)
    svc.inbox.assign_shared_card(out["card_id"],
                                 svc.db.one("SELECT id FROM customers WHERE name='רונית לוי'")["id"])
    rows = dsr.listing(svc)
    assert rows and rows[0]["due_at"][:10] == (received + timedelta(days=dsr.DUE_DAYS)).date().isoformat()


def test_control_direct_request_due_is_30_days(svc, clock):
    svc.sync()
    svc.inbound("sms", "0501234567", "תמחקו את כל הפרטים שלי מהמאגר")
    assert dsr.listing(svc)[0]["due_at"][:10] == (clock.now + timedelta(days=30)).date().isoformat()
