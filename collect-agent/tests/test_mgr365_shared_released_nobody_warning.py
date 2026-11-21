"""מנהל 365 (ממצא «גבייה סוכן» 21.11, fuzz זרע 89 — team/findings-gvia-sochen.md): «אני בן 15» מטלפון משותף ⇒
בעל העסק בוחר «אף אחד מהם» ⇒ ההשהיה משתחררת ⇒ התזכורת הבאה לאותו טלפון נבנית **בלי שום סימן** במסך האישור.
ההכרעה אם לחסום (אפשרות 1) נשארת למאיר; כאן אפשרות 2 בלבד — `shared_warning` ב-/preview של כל תזכורת למקושרים,
וב-/ui ובאפליקציה מוצגת אזהרה. לא חוסם אישור (xfail ב-test_shared_minor_assign_none נשאר עד ההכרעה)."""
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_legal_requirements import _shared_phone_csv

PHONE = "050-0001111"


def _reminders(svc, clock):
    clock.now += timedelta(days=3)
    svc.plan()
    return {r["customer_id"]: r["id"] for r in svc.db.q(
        "SELECT r.id, i.customer_id FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
        "WHERE r.status='pending_approval'")}


@pytest.mark.parametrize("text,urgent", [("אני בן 15", "minor"), ("אני הולך לתבוע אתכם", "legal")])
def test_nobody_on_protective_card_flags_every_linked_reminder(svc, clock, text, urgent):
    ids = _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, text)
    assert r["detected"] == urgent
    svc.inbox.assign_shared_card(r["card_id"], None)
    rems = _reminders(svc, clock)
    assert set(rems) == set(ids.values())     # ההשהיה שוחררה — כמו קודם (לא חוסמים; ההכרעה למאיר)
    for cid in ids.values():
        w = svc.preview(rems[cid])["shared_warning"]
        assert w["card_id"] == r["card_id"] and w["urgent"] == urgent and w["channel"] == "sms"
        assert w["received_at"] and w["released_at"]
    # לא חוסם: האישור עובר
    svc.approve(rems[ids["רונית לוי"]], confirm_open=True)


@pytest.mark.parametrize("who", ["רונית לוי", "משה כהן"])
def test_assigning_a_customer_does_not_flag(svc, clock, who):
    ids = _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, "אני בן 15")
    svc.inbox.assign_shared_card(r["card_id"], ids[who])
    for rid in _reminders(svc, clock).values():
        assert svc.preview(rid)["shared_warning"] is None


def test_non_protective_card_released_to_nobody_does_not_flag(svc, clock):
    """«שילמתי» מכתובת משותפת (SHARED_PAID) ⇒ «אף אחד מהם» — לא קטין/מצוקה/משפטי ⇒ אין סימון."""
    _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, "שילמתי")
    assert r["intent"] == "shared_contact_paid_claim"
    svc.inbox.assign_shared_card(r["card_id"], None)
    for rid in _reminders(svc, clock).values():
        assert svc.preview(rid)["shared_warning"] is None


def test_unrelated_customer_not_flagged(svc, clock, fake_gi):
    ids = _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, "אני בן 15")
    svc.inbox.assign_shared_card(r["card_id"], None)
    for cid, rid in _reminders(svc, clock).items():
        if cid not in ids.values():
            assert svc.preview(rid)["shared_warning"] is None


def test_preview_api_exposes_warning_and_audit(svc, clock):
    ids = _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, "אני בן 15")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert api.post(f"/owner/shared-cards/{r['card_id']}/assign", json={"customer_id": None}).status_code == 200
    rid = _reminders(svc, clock)[ids["משה כהן"]]
    body = api.get(f"/reminders/{rid}/preview").json()
    assert body["shared_warning"]["urgent"] == "minor"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='shared_released_nobody_flagged'")


def test_ui_html_renders_shared_warning():
    from pathlib import Path
    html = (Path(__file__).resolve().parent.parent / "app" / "ui.html").read_text(encoding="utf-8")
    assert 'id="sharedWarn"' in html and "sharedWarn(p.shared_warning)" in html
    assert "ובחרתם «אף אחד מהם»" in html
