"""מנוע השיחה מחובר מקצה לקצה: כל כוונה (Intent) נכנסת דרך הנתיב החי (`svc.inbound` — אותו נתיב
של /inbound, webhook 019 ו-webhook המייל) ומגיעה להשפעה הנכונה ב-DB ובתור של בעל העסק.

וגם רגרסיות לחורים שנמצאו בבדיקת החיבור (7.11.2026):
  • «מאשר» אחרי שהצעת הפריסה **נשלחה** לא נקשר לשום הסדר (plan_id=None).
  • דחיית הצעה שנשלחה השאירה אותה approved לנצח ⇒ `plan_active` חוסם תזכורות גם אחרי חידוש.
  • לקוח שהוסר: טיוטת תשובה שהשער ידחה בשקט אחרי אישור בעל העסק (שילמתי/מחלוקת/מצוקה).
  • /conversation/* עבד על מופע תיבה שני, לא על svc.inbox.
  • ר-12: אישור ושליחת טיוטה מתעדים גיבוב של הגוף.
"""
import json

import pytest
from fastapi.testclient import TestClient

from app.channels import sent_mark
from app.conversation import Intent
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

DANA = "050-1234567"


def _cust(svc):
    return svc.db.one("SELECT * FROM customers WHERE name='דנה כהן'")


def _draft(svc, did):
    return svc.db.one("SELECT * FROM drafts WHERE id=?", (did,)) if did else None


def _offer_sent(svc):
    """מצב אמיתי: הלקוח ביקש פריסה ⇒ בעל העסק אישר את טיוטת ההצעה ⇒ ההצעה יצאה."""
    r = svc.inbound("sms", DANA, "אין לי כסף כרגע, אפשר תשלומים?")
    assert r["plan_id"] and r["draft_id"]
    assert svc.inbox.approve_draft(r["draft_id"])["status"] == "sent_dry_run"
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (r["plan_id"],))["status"] == "approved"
    return r["plan_id"]


# (כוונה, טקסט, הכנה, ציפיות). paused: תחילית paused_reason או None; draft: סטטוס הטיוטה/הכרטיס
MATRIX = [
    (Intent.DISTRESS, "אני רוצה למות", None,
     {"esc": "urgent", "paused": "distress", "draft": "pending_approval"}),
    (Intent.MINOR, "אני בן 12", None, {"esc": "urgent", "paused": "minor", "draft": "needs_owner"}),
    (Intent.OPT_OUT, "הסר", None, {"opted_out": 1, "draft": "pending_approval"}),
    (Intent.WRONG_PERSON, "טעות במספר, אין פה דנה", None,
     {"opted_out": 1, "phone_removed": True, "draft": "pending_approval"}),
    (Intent.LEGAL, "אני אתבע אתכם", None,
     {"esc": "urgent", "disputed": 1, "paused": "legal", "draft": "needs_owner"}),
    (Intent.DISPUTE, "הסכום לא נכון", None,
     {"esc": "urgent", "disputed": 1, "paused": "dispute", "draft": "pending_approval"}),
    (Intent.PAID_CLAIM, "שילמתי כבר", None, {"paused": "paid_claim", "draft": "pending_approval"}),
    (Intent.CANT_PAY, "אין לי כסף החודש", None,
     {"paused": "cant_pay", "plan": "proposed", "draft": "pending_approval"}),
    (Intent.PLAN_REQUEST, "אפשר לשלם בתשלומים?", None,
     {"paused": "plan_request", "plan": "proposed", "draft": "pending_approval"}),
    (Intent.PLAN_ACCEPT, "מאשר", _offer_sent,
     {"paused": "plan_accept", "plan": "approved", "plan_linked": True, "draft": "pending_approval"}),
    (Intent.PLAN_REJECT, "לא מתאים לי", _offer_sent,
     {"paused": "plan_reject", "plan": "rejected", "draft": "pending_approval"}),
    (Intent.PROMISE, "אשלם ביום שלישי", None,
     {"paused": "promise:until=2026-11-11", "draft": "pending_approval"}),
    (Intent.COPY_REQUEST, "שלחו לי את החשבונית", None,
     {"esc": "normal", "paused": None, "draft": "pending_approval"}),
    (Intent.HOW_TO_PAY, "איך אפשר לשלם?", None,
     {"esc": "none", "paused": None, "draft": "pending_approval"}),
    (Intent.CALLBACK, "תתקשרו אליי", None, {"esc": "normal", "paused": None, "draft": "pending_approval"}),
    (Intent.WHO_IS_THIS, "מי זה?", None, {"esc": "none", "paused": None, "draft": "pending_approval"}),
    (Intent.ABUSIVE, "יא מניאק", None, {"paused": "abusive", "draft": "needs_owner"}),
    (Intent.THANKS, "תודה", None, {"esc": "none", "paused": None, "draft": None}),
    (Intent.UNKNOWN, "בננה סגולה", None, {"esc": "normal", "paused": None, "draft": "needs_owner"}),
]


def test_matrix_covers_every_intent():
    assert {m[0] for m in MATRIX} == set(Intent)


@pytest.mark.parametrize("intent,text,setup,exp", MATRIX, ids=[m[0].value for m in MATRIX])
def test_every_intent_end_to_end_through_live_inbound(svc, intent, text, setup, exp):
    svc.sync()
    prior_plan = setup(svc) if setup else None
    res = svc.inbound("sms", DANA, text)           # הנתיב החי (= /inbound, 019, מייל)
    assert res["intent"] == intent.value
    c = _cust(svc)
    if "esc" in exp:
        assert res["escalation"] == exp["esc"]
    if "paused" in exp:
        if exp["paused"] is None:
            assert c["paused_reason"] is None
        else:
            assert (c["paused_reason"] or "").startswith(exp["paused"])
    assert c["opted_out"] == exp.get("opted_out", 0)
    assert c["disputed"] == exp.get("disputed", 0)
    if exp.get("phone_removed"):
        assert c["phone"] is None and c["blocked_phone"] == DANA
    dr = _draft(svc, res["draft_id"])
    assert (dr["status"] if dr else None) == exp["draft"]
    if "plan" in exp:
        pid = prior_plan or res["plan_id"]
        assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == exp["plan"]
    if exp.get("plan_linked"):
        assert res["plan_id"] == prior_plan and dr["plan_id"] == prior_plan
    if res["stop"] != "none":                       # כל עצירה מבטלת תזכורות פעילות
        assert not svc.db.one("SELECT 1 FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                              "WHERE i.customer_id=? AND r.status IN ('pending_approval','approved')",
                              (c["id"],))
    # שום דבר לא יוצא בלי אישור בעל העסק (רק הצעת הפריסה שאושרה בהכנה, אם הייתה)
    assert len(svc.sender.sent) == (1 if setup else 0)


def test_accept_after_offer_was_sent_links_the_plan(svc):
    svc.sync()
    pid = _offer_sent(svc)
    r = svc.inbound("sms", DANA, "מאשר")
    assert r["intent"] == "plan_accept" and r["plan_id"] == pid
    audit = [json.loads(a["detail"]) for a in svc.db.q(
        "SELECT detail FROM audit WHERE action='plan_accepted_by_customer'")]
    assert audit == [{"plan": pid}]


def test_rejected_sent_offer_no_longer_blocks_after_owner_resumes(svc, clock):
    from datetime import timedelta
    svc.sync()
    pid = _offer_sent(svc)
    svc.inbound("sms", DANA, "לא מתאים לי, יקר מדי")
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "rejected"
    c = _cust(svc)
    svc.resume_customer(c["id"])
    assert svc._customer_block(c["id"]) is None   # היה: plan_active לנצח
    clock.now += timedelta(days=1)
    dana_inv = svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (c["id"],))["id"]
    created = svc.plan()
    assert any(svc.db.one("SELECT 1 FROM reminders WHERE id=? AND invoice_id=?", (r, dana_inv))
               for r in created)


def test_counter_offer_after_sent_offer_retires_the_sent_one(svc):
    svc.sync()
    pid = _offer_sent(svc)
    r = svc.inbound("sms", DANA, "אפשר 6 תשלומים?")
    assert r["plan_id"] and r["plan_id"] != pid
    st = {p["id"]: p["status"] for p in svc.db.q("SELECT id, status FROM plans")}
    assert st == {pid: "rejected", r["plan_id"]: "proposed"}


def test_accepted_plan_is_not_retired_by_a_later_unrelated_message(svc):
    svc.sync()
    pid = _offer_sent(svc)
    svc.inbound("sms", DANA, "מאשר")             # מצב: plan_pending_owner (לא ממתין להצעה)
    svc.inbound("sms", DANA, "לא מתאים לי")
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "approved"


@pytest.mark.parametrize("text,intent", [("שילמתי כבר", "paid_claim"), ("אני רוצה למות", "distress"),
                                         ("הסכום לא נכון", "dispute")])
def test_opted_out_customer_gets_owner_card_not_unsendable_draft(svc, text, intent):
    svc.sync()
    svc.inbound("sms", DANA, "הסר")
    r = svc.inbound("sms", DANA, text)
    assert r["intent"] == intent and r["escalate"]
    dr = _draft(svc, r["draft_id"])
    assert dr["status"] == "needs_owner" and dr["body"] == ""   # היה: pending_approval ⇒ נדחה בשקט
    assert any("לפנות אישית" in a for a in json.loads(dr["owner_actions"]))
    assert svc.sender.sent == []


def test_opted_out_customer_explicit_request_still_drafted(svc):
    svc.sync()
    svc.inbound("sms", DANA, "הסר")
    r = svc.inbound("sms", DANA, "איך אפשר לשלם?")   # בקשה מפורשת ⇒ מותר (באישור)
    assert _draft(svc, r["draft_id"])["status"] == "pending_approval"
    svc.inbox.approve_draft(r["draft_id"])
    assert sent_mark(svc.sender.sent) == 1


def test_conversation_routes_use_the_service_inbox(svc):
    app = create_app(svc, owner_token=OWNER_TOKEN)
    assert app.state.inbox is svc.inbox
    api = TestClient(app, headers=AUTH)
    svc.sync()
    svc.inbox.policy = type(svc.inbox.policy)(approval_mode="safe_auto")
    r = api.post("/conversation/inbound",
                 json={"channel": "sms", "sender": DANA, "text": "איך אפשר לשלם?"}).json()
    assert r["auto_sent"] is True   # מדיניות svc.inbox חלה גם על /conversation/*


def test_draft_approval_and_send_record_body_hash(svc):
    import hashlib
    svc.sync()
    r = svc.inbound("sms", DANA, "איך אפשר לשלם?")
    svc.inbox.approve_draft(r["draft_id"])
    body = _draft(svc, r["draft_id"])["body"]
    sha = hashlib.sha256(body.encode()).hexdigest()[:16]
    rows = {a["action"]: json.loads(a["detail"]) for a in svc.db.q(
        "SELECT action, detail FROM audit WHERE action IN ('draft_approved','draft_sent_dry_run')")}
    assert rows["draft_approved"]["body_sha"] == sha == rows["draft_sent_dry_run"]["body_sha"]
