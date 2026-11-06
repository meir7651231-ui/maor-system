"""בדיקות משחזרות ל-review/hostile-review-2026-11-06.md (חורים 2, 3, 10).
כל אחת נכשלת על 3163d09 ועוברת אחרי התיקון."""
from __future__ import annotations

from datetime import datetime

import pytest

from app.config import SafetyError, load_settings
from app.policy import TZ, Policy


def _cycle(svc):
    svc.sync()
    for rid in svc.plan():
        svc.approve(rid)
    svc.dispatch()


def test_hole2_plan_offer_sent_once_draft_then_plans(svc):
    _cycle(svc)
    res = svc.inbound("sms", "0501234567", "אפשר לפרוס לשלושה תשלומים?")
    n = len(svc.sender.sent)
    svc.inbox.approve_draft(res["draft_id"])
    assert len(svc.sender.sent) == n + 1
    with pytest.raises(ValueError):
        svc.approve_plan(res["plan_id"])
    assert len(svc.sender.sent) == n + 1


def test_hole3_no_receipt_creating_payment_mode():
    assert load_settings({}).payment_link_mode == "static"
    with pytest.raises(SafetyError, match="קבלה"):
        load_settings({"PAYMENT_LINK_MODE": "greeninvoice_form"})


@pytest.mark.parametrize("dt", [datetime(2029, 9, 3, 10), datetime(2031, 1, 5, 10)])
def test_hole10_no_sending_after_holiday_table_ends(dt):
    p = Policy()
    assert p.can_send_at(dt.replace(tzinfo=TZ)) is False
    assert "לוח החגים" in p.reason_closed(dt.replace(tzinfo=TZ))


def test_hole7_residual_csv_reimport_without_invoice_blocks_send(svc, clock):
    """review חור 7, שארית (שוחזר על d3fb03f): בעל העסק אישר «הסכום עדיין פתוח», שעה אחרי זה
    דנה שילמה והוא ייבא קובץ חדש בלי החשבונית שלה ⇒ התזכורת לדנה **נשלחה** בכל זאת.
    עכשיו: חסרה בייבוא שאחרי האישור ⇒ חוזרת לאישור (csv_missing_from_import) ולא נשלחת."""
    from datetime import timedelta

    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    head = "number,client,phone,amount,due\n"
    api.post("/import/csv", content=(head + "501,דנה,0501111111,100,2026-10-01\n"
                                     "502,רון,0502222222,200,2026-10-01\n").encode())
    ids = api.post("/plan").json()["created"]
    for i in ids:
        assert api.post(f"/reminders/{i}/approve", json={"confirm_open": True}).status_code == 200
    clock.now += timedelta(hours=1)
    api.post("/import/csv", content=(head + "502,רון,0502222222,200,2026-10-01\n").encode())
    api.post("/dispatch")
    assert [m["to"] for m in svc.sender.sent] == ["972502222222"]
    dana = next(i for i in ids if svc._invoice(svc._reminder(i)["invoice_id"])["number"] == "501")
    assert svc._reminder(dana)["status"] == "pending_approval"
    assert svc._reminder(dana)["block_reason"] == "csv_missing_from_import"
    # בעל העסק בודק ומאשר שוב (הסכום עדיין פתוח) ⇒ יוצאת
    clock.now += timedelta(hours=73)
    assert api.post(f"/reminders/{dana}/approve", json={"confirm_open": True}).status_code == 200
    api.post("/dispatch")
    assert "972501111111" in [m["to"] for m in svc.sender.sent]


def test_hole1_opt_out_on_shared_phone_stops_all_channels_of_both(svc, fake_gi, clock):
    """review חור 1 (שוחזר על d3fb03f): שני לקוחות על אותו נייד; «תסירו אותי» ⇒ ה-SMS נחסם, אבל
    יצא מייל ללקוח השני (c2@example.com). הכרעה שמרנית: עוצרים את כל הערוצים של שניהם."""
    from datetime import timedelta

    from tests.conftest import gi_doc
    fake_gi.docs = [gi_doc(1), gi_doc(2, client_id="other", name="אחר")]
    _cycle(svc)
    svc.inbound("sms", "0501234567", "תסירו אותי")
    clock.now += timedelta(days=10)
    n = len(svc.sender.sent)
    svc.sync()
    for rid in svc.plan():
        try:
            svc.approve(rid)
        except ValueError:
            pass
    svc.dispatch()
    assert svc.sender.sent[n:] == []
    assert [r["opted_out"] for r in svc.db.q("SELECT opted_out FROM customers ORDER BY id")] == [1, 1]


@pytest.mark.parametrize("url,ok", [("https://gabi.example", True), ("http://127.0.0.1:8000", True),
                                    ("http://gabi.example", False), ("ftp://x", False)])
def test_hole8_public_links_https_only(url, ok):
    """review חור 8: הקישור הקצר הוא דרך ההסרה היחידה ב-SMS ⇒ לא על http (חוץ מהדגמה מקומית)."""
    if ok:
        assert load_settings({"PUBLIC_BASE_URL": url}).public_base_url == url
    else:
        with pytest.raises(SafetyError, match="https"):
            load_settings({"PUBLIC_BASE_URL": url})
