"""מבקר סבב 202 · 🟠 — הצעת פריסה שנשלחה מהדשבורד: הלקוח עונה «מאשר» כמו שהתבקש — וגבי לא מזהה.

רכיבים: `app/service.py` → `approve_plan` / `_approve_plan_claimed` (מסלול הדשבורד, POST /plans/{pid}/approve) — לא
מעדכן את מצב השיחה (`conversations.state`) כמו הצעה שיוצאת מתור התשובות; `app/inbox.py` (PLAN_ACCEPT מחפש
הסדר `proposed/approved`) + `app/conversation.py` (`Intent.PLAN_ACCEPT` רק בהקשר של הצעה בשיחה).
ההצעה במייל אומרת במפורש: «השיבו "מאשר" ובעל העסק יאשר סופית». נבדק (לקוח מייל, וגם SMS):
  «מאשר» / «מאשרת» / «כן מאשר» / «מסכים» ⇒ intent=unknown, כרטיס «❓ הודעה מ-דנה כהן שלא זיהיתי: "מאשר"»,
  ואין `plan_accepted_by_customer` ב-audit.
  «מאשר את הפריסה» ⇒ plan_request ⇒ **הצעה שנייה** (plans#2 proposed) ללקוח שכבר אישר: «הצעה לפריסת 1,200 ₪ …
  מתאים? השיבו "מאשר"» — לולאה.
הצעה: `approve_plan` מעביר את השיחה למצב «הצעת פריסה נשלחה» (כמו המסלול שבתור), כך ש«מאשר» = PLAN_ACCEPT על ההסדר הזה.
xfail(strict=True)."""
import pytest

from app.conversation import Intent


def _offer_by_dashboard(svc):
    svc.sync()
    svc.db.x("UPDATE customers SET phone=NULL WHERE id=1")       # ערוץ מייל — ההצעה אומרת «השיבו "מאשר"»
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    body = svc.db.one("SELECT body FROM messages WHERE customer_id=1 AND direction='out' ORDER BY id DESC LIMIT 1")
    assert 'השיבו "מאשר"' in body["body"]
    return pid, svc.db.one("SELECT email FROM customers WHERE id=1")["email"]



@pytest.mark.parametrize("reply", ["מאשר", "מאשרת", "כן מאשר"])
def test_marer_after_dashboard_offer_is_plan_accept(svc, reply):
    pid, email = _offer_by_dashboard(svc)
    r = svc.inbound("email", email, reply)
    assert r["intent"] == Intent.PLAN_ACCEPT.value, r["intent"]
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_accepted_by_customer' "
                      "AND json_extract(detail,'$.plan')=?", (pid,))



def test_accept_with_words_does_not_reoffer(svc):
    pid, email = _offer_by_dashboard(svc)
    svc.inbound("email", email, "מאשר את הפריסה")
    assert svc.db.one("SELECT COUNT(*) AS n FROM plans WHERE customer_id=1")["n"] == 1
