"""critic סבב 48: הפעלה 123 עצרה **תזכורת** עם סכום חריג פי 50 (confirm_amount), אבל **תשובות שיחה** עם כסף
עקפו: «אפשר בתשלומים?» ⇒ טיוטת הצעה על 12,250 ₪ (4,083 ₪ לתשלום, במקום ~125 ₪) בלי שום אזהרה, ואישור
רגיל שלח אותה. עכשיו: אותה בדיקה ב-approve_draft (וגם approve_plan) + הדגל בתור הטיוטות לממשק."""
from __future__ import annotations

import pytest

from tests.conftest import gi_doc


def _setup(svc, fake_gi):
    fake_gi.docs[:] = [gi_doc(1, amount="120.00", client_id="A"), gi_doc(3, amount="130.00", client_id="A"),
                       gi_doc(5, amount="12000.00", client_id="A")]
    svc.sync()
    return svc.inbound("sms", "050-1234567", "אפשר לפרוס ל-3 תשלומים?")


def test_money_draft_with_outlier_requires_confirm_amount(svc, fake_gi):
    r = _setup(svc, fake_gi)
    listed = next(d for d in svc.inbox.drafts() if d["id"] == r["draft_id"])
    assert listed["amount_check"], listed
    with pytest.raises(ValueError, match="confirm_amount"):
        svc.inbox.approve_draft(r["draft_id"])
    assert svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)["status"] == "sent_dry_run"


def test_approve_plan_with_outlier_requires_confirm_amount(svc, fake_gi):
    r = _setup(svc, fake_gi)
    with pytest.raises(ValueError, match="confirm_amount"):
        svc.approve_plan(r["plan_id"])
    assert svc.approve_plan(r["plan_id"], confirm_amount=True)


def test_api_passes_confirm_amount(svc, fake_gi):
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    r = _setup(svc, fake_gi)
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert c.post(f"/conversation/drafts/{r['draft_id']}/approve", json={}).status_code == 409
    assert c.post(f"/conversation/drafts/{r['draft_id']}/approve", json={"confirm_amount": True}).status_code == 200
