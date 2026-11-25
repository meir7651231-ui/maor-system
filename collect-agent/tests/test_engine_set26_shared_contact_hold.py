"""סט #26 q26-10 (הכרעת המקשר 25.11): דנה ויוסי על אותו טלפון; «אפשר בשלושה תשלומים?» ⇒ כרטיס משותף ⇒ שויך לדנה.
יוסי לא מקבל תזכורת אוטומטית (שלא יצאו שתי הודעות סותרות לאותו מספר) — אבל הסיבה גלויה ברשימה הפתוחה:
`shared_contact_hold` + «הטלפון משותף עם דנה כהן — ממתין להכרעתכם…», לא «הלקוח כתב לכם» (יוסי לא כתב). דינמי — לא
paused_reason; משתחרר לבד כשבעל העסק מטפל."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
ROWS = "9001,דנה כהן,050-1234567,,1200,פתוח,01/10/26,15/10/26\n9002,יוסי לוי,050-1234567,,800,פתוח,01/10/26,15/10/26\n"


def _setup(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + ROWS).encode())
    r = svc.inbound("sms", "050-1234567", "אפשר בשלושה תשלומים?")
    assert r["intent"] == "shared_contact_plan_request"
    dana = svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"]
    svc.inbox.assign_shared_card(r["card_id"], dana)
    clock.now += timedelta(days=1)
    return dana


def _row(svc, number):
    return next(x for x in svc.dashboard()["invoices"] if x["number"] == number)


def test_other_customer_shows_shared_hold_with_name(svc, clock):
    _setup(svc, clock)
    svc.plan()
    yossi = _row(svc, "9002")
    assert yossi["customer_block"] == "shared_contact_hold", yossi["customer_block"]
    assert yossi["hold_with"] == "דנה כהן"
    assert yossi["paused_reason"] is None                       # דינמי — לא נשמרה השהיה
    assert _row(svc, "9001")["customer_block"] != "shared_contact_hold"


def test_hold_releases_when_owner_handles(svc, clock):
    _setup(svc, clock)
    svc.db.x("UPDATE drafts SET status='rejected' WHERE status IN ('pending_approval','needs_owner')")
    assert _row(svc, "9002")["customer_block"] is None and _row(svc, "9002")["hold_with"] is None


def test_both_uis_have_the_label():
    from pathlib import Path
    root = Path(__file__).resolve().parents[1]
    api = (root / "web/src/api.ts").read_text(encoding="utf-8")
    ui = (root / "app/ui.html").read_text(encoding="utf-8")
    assert "shared_contact_hold:" in api and "shared_contact_hold:" in ui
    assert "הטלפון משותף עם" in api and "הטלפון משותף עם" in ui and "hold_with" in ui
