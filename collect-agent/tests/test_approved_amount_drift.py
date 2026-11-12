"""הפעלה 154: תזכורת **מאושרת** שהסכום שלה השתנה במקור, ועוד לא הגיעה לשליחה.

הבאג (ידוע מ-153): הסנכרון לא בונה מחדש תזכורת מאושרת (זה היה מבטל אישור קיים), ולכן עד ה-`/dispatch` הבא
התצוגה המקדימה הציגה סכום כולל חדש (1,500 ₪) מעל נוסח ישן (1,200 ₪), בלי שום הסבר. שום דבר שגוי לא נשלח,
אבל המסך סתר את עצמו. התיקון: `/preview` מחזיר `amount_drift` (מה היה ומה עכשיו), ו-`/ui` מציג הערה שהנוסח
לא יישלח כך והתזכורת תחזור לאישור.
"""
from __future__ import annotations

import pathlib

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _approved(api):
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert seen["amount_drift"] is None
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    return rid, seen


def test_approved_reminder_preview_reports_drift_until_dispatch(api, svc, fake_gi):
    rid, seen = _approved(api)
    assert api.get(f"/reminders/{rid}/preview").json()["amount_drift"] is None   # מאושרת, בלי שינוי
    fake_gi.docs[0]["amount"] = "1500.00"
    api.post("/sync")
    p = api.get(f"/reminders/{rid}/preview").json()
    # האישור לא בוטל והנוסח לא נגעו בו; הפער מדווח במפורש
    assert p["status"] == "approved" and p["body_hash"] == seen["body_hash"]
    assert "1,200" in p["messages"][0]["body"]
    assert p["amount_drift"] == {"was_text": "1,200 ₪", "now_text": "1,500 ₪"}
    assert p["total_text"] == "1,500 ₪"
    # השליחה מחזירה לאישור עם הנוסח החדש ⇒ אין יותר פער, ולא יצא דבר
    assert api.post("/dispatch").json()["sent"] == [] and svc.sender.sent == []
    after = api.get(f"/reminders/{rid}/preview").json()
    assert after["status"] == "pending_approval" and after["amount_drift"] is None
    assert all("1,500" in m["body"] for m in after["messages"])


def test_drift_also_reported_when_amount_drops(api, fake_gi):
    """תשלום חלקי: הסכום ירד. אותה הערה, עם הסכומים הנכונים."""
    rid, _ = _approved(api)
    fake_gi.docs[0]["amount"] = "700.00"
    api.post("/sync")
    assert api.get(f"/reminders/{rid}/preview").json()["amount_drift"] == \
        {"was_text": "1,200 ₪", "now_text": "700 ₪"}


def test_pending_reminder_never_reports_drift(api, fake_gi):
    """ממתינה נבנית מחדש כבר בסנכרון (153) ⇒ אין פער להציג."""
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    fake_gi.docs[0]["amount"] = "1500.00"
    api.post("/sync")
    p = api.get(f"/reminders/{rid}/preview").json()
    assert p["status"] == "pending_approval" and p["amount_drift"] is None


def test_ui_shows_drift_note():
    """מגן-מקור: `/ui` מציג את ההערה מ-`amount_drift`, עם שני הסכומים וההבטחה שלא יישלח כך."""
    src = (pathlib.Path(__file__).parent.parent / "app" / "ui.html").read_text(encoding="utf-8")
    assert 'p.amount_drift?`<div class="note" id="driftNote"' in src
    assert "esc(driftText(p.amount_drift))" in src
    assert "d.was_text" in src and "d.now_text" in src and "לא יישלח כך" in src
    # «לבדוק ולאשר מחדש» נשאר מהבנייה הקודמת גם אחרי האישור; על תזכורת מאושרת הוא לא מוצג
    assert 'REAPPROVE[p.block_reason]&&p.status!=="pending_approval"' in src
