"""critic סבב 169 · 🟠 לתיקון בונה — רכיב: `app/service.py` → `CollectService._email_webhook`
(האזהרה «⚠️ המייל לא עבר אימות שולח» נכתבת רק `if not auth["verified"] and out.get("draft_id")`).

מייל נכנס שנכשל ב-SPF/DKIM/DMARC (התחזות קלה — critic 3.6.7) מסומן לבעל העסק **רק כשנוצרה טיוטה**. שלושה מסלולים
יוצרים כרטיס בלי טיוטה (`card_id` / `unknown_sender_urgent`) ולכן בלי אזהרה:
  • כתובת משותפת + «שילמתי» ⇒ `shared_contact_paid_claim`: **כל** הלקוחות המקושרים מושהים, והכרטיס נראה אמין;
  • כתובת משותפת + «אני בן 14» ⇒ `shared_contact_urgent` (+ מייל דחוף לבעל העסק);
  • שולח לא מוכר + «אני בן 14, הפסיקו» ⇒ `unknown_sender_urgent`.
בעל העסק מחליט (שיוך/«שולם»/טיפול בקטין) על בסיס כרטיס שאין בו שום סימן שהמייל אולי מזויף. [מאומת בהרצה]
הצעה: כש-`not auth["verified"]` — לסמן גם את הכרטיס (`messages.payload` של card_id/unknown_sender, למשל
`"email_verified": false`) ולהציג אותו ב-/app/ וב-/ui כמו בטיוטה. הבדיקות xfail(strict=True)."""
import json

import pytest

FAIL = "mx.example; spf=fail; dkim=fail; dmarc=fail"
PASS = "mx.example; spf=pass; dkim=pass; dmarc=pass"


def _shared(svc):
    svc.sync()
    svc.import_csv(("מספר חשבונית,לקוח,סכום,תאריך לתשלום,טלפון,מייל\n"
                    "3,רונית לוי,300,2026-10-01,050-0001111,fam@ex.com\n"
                    "4,משה כהן,400,2026-10-01,050-0002222,fam@ex.com\n").encode())


def _card_flagged(svc, intent) -> bool:
    row = svc.db.one("SELECT body, payload FROM messages WHERE needs_owner=1 AND intent=? ORDER BY id DESC",
                     (intent,))
    assert row is not None, intent
    try:
        if json.loads(row["payload"] or "{}").get("email_verified") is False:
            return True
    except ValueError:
        pass
    return "לא עבר אימות" in ((row["payload"] or "") + (row["body"] or ""))


@pytest.mark.parametrize("who,msg,intent", [
    ("fam@ex.com", "שילמתי", "shared_contact_paid_claim"),
    ("fam@ex.com", "אני בן 14", "shared_contact_urgent"),
    ("stranger@ex.com", "אני בן 14, הפסיקו", "unknown_sender_urgent")])
def test_unverified_email_card_is_flagged(svc, who, msg, intent):
    _shared(svc)
    svc.email_webhook(who, msg, "", auth_results=FAIL)
    assert _card_flagged(svc, intent)


def test_control_unverified_customer_draft_is_flagged(svc):
    svc.sync()
    out = svc.email_webhook("c1@example.com", "שילמתי", "", auth_results=FAIL)
    assert "לא עבר אימות" in svc.db.one("SELECT owner_summary FROM drafts WHERE id=?",
                                         (out["draft_id"],))["owner_summary"]


def test_control_verified_shared_card_not_flagged(svc):
    _shared(svc)
    svc.email_webhook("fam@ex.com", "שילמתי", "", auth_results=PASS)
    assert not _card_flagged(svc, "shared_contact_paid_claim")
