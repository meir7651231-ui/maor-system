"""מנהל 317 · critic סבב 169 — המשך: הסימון `email_verified:false` על כרטיס בלי טיוטה (תוקן ב-`_email_webhook`).
נבדק כאן מה שמסביב: שולח לא מוכר **לא** דחוף גם מסומן · שיוך כרטיס משותף מעביר את האזהרה לטיוטה שנוצרת ·
מייל מאומת לא מסומן ושיוכו לא מוסיף אזהרה · ה-payload של הכרטיס נשאר שמיש (linked_customers) · purge עדיין מרוקן."""
import json
from datetime import timedelta

FAIL = "mx.example; spf=fail; dkim=fail; dmarc=fail"
PASS = "mx.example; spf=pass; dkim=pass; dmarc=pass"


def _shared(svc):
    svc.sync()
    svc.import_csv(("מספר חשבונית,לקוח,סכום,תאריך לתשלום,טלפון,מייל\n"
                    "3,רונית לוי,300,2026-10-01,050-0001111,fam@ex.com\n"
                    "4,משה כהן,400,2026-10-01,050-0002222,fam@ex.com\n").encode())


def _card(svc, intent):
    return svc.db.one("SELECT * FROM messages WHERE needs_owner=1 AND intent=? ORDER BY id DESC", (intent,))


def test_unknown_sender_non_urgent_flagged(svc):
    svc.sync()
    svc.email_webhook("nobody@ex.com", "מי אתם בכלל?", "", auth_results=FAIL)
    assert json.loads(_card(svc, "unknown_sender")["payload"])["email_verified"] is False


def test_shared_card_payload_keeps_linked_customers(svc):
    _shared(svc)
    svc.email_webhook("fam@ex.com", "שילמתי", "", auth_results=FAIL)
    info = json.loads(_card(svc, "shared_contact_paid_claim")["payload"])
    assert info["email_verified"] is False
    assert sorted(c["name"] for c in info["linked_customers"]) == ["משה כהן", "רונית לוי"]


def _assign_first(svc, intent):
    card = _card(svc, intent)
    cid = json.loads(card["payload"])["linked_customers"][0]["id"]
    return svc.inbox.assign_shared_card(card["id"], cid)


def test_assign_carries_warning_to_draft(svc):
    _shared(svc)
    svc.email_webhook("fam@ex.com", "שילמתי", "", auth_results=FAIL)
    res = _assign_first(svc, "shared_contact_paid_claim")
    assert res.get("draft_id")
    summ = svc.db.one("SELECT owner_summary FROM drafts WHERE id=?", (res["draft_id"],))["owner_summary"]
    assert "לא עבר אימות" in summ


def test_assign_verified_no_warning(svc):
    _shared(svc)
    svc.email_webhook("fam@ex.com", "שילמתי", "", auth_results=PASS)
    assert "email_verified" not in json.loads(_card(svc, "shared_contact_paid_claim")["payload"])
    res = _assign_first(svc, "shared_contact_paid_claim")
    summ = svc.db.one("SELECT owner_summary FROM drafts WHERE id=?", (res["draft_id"],))["owner_summary"] or ""
    assert "לא עבר אימות" not in summ


def test_only_this_email_cards_marked(svc):
    """הודעה קודמת (מאומתת) לא מקבלת סימון כשמייל לא מאומת מגיע אחריה."""
    svc.sync()
    svc.email_webhook("a@ex.com", "מי אתם?", "", auth_results=PASS)
    first = _card(svc, "unknown_sender")["id"]
    svc.email_webhook("b@ex.com", "ומי אתם?", "", auth_results=FAIL)
    assert svc.db.one("SELECT payload FROM messages WHERE id=?", (first,))["payload"] is None


def test_purge_still_blanks_unknown_card(svc, clock):
    svc.sync()
    svc.email_webhook("nobody@ex.com", "מי אתם בכלל?", "", auth_results=FAIL)
    mid = _card(svc, "unknown_sender")["id"]
    clock.now += timedelta(days=200)
    svc.purge_closed()
    row = svc.db.one("SELECT body, payload FROM messages WHERE id=?", (mid,))
    assert row["body"] == "" and row["payload"] is None
