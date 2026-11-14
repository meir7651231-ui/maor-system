"""critic סבב 56: אישור קשור לנוסח שבעל העסק ראה.

הבאג: תזכורת שאושרה על 1,200 ₪, ולפני השליחה הסכום במקור עלה ל-1,500 ⇒ `_rebuild_for_amount` בונה אותה מחדש
וחוזרת ל-pending_approval **באותו מזהה**. תצוגה מקדימה ישנה (1,200) פתוחה אצל בעל העסק ⇒ «אשר ושלח» ⇒ השרת
אישר את הנוסח החדש (1,500) שבעל העסק לא ראה, והוא יצא. מנוגד ל«אישור פרטני לכל הודעה» ו«אימות סכום לפני
כל שליחה». התיקון: /preview מחזיר body_hash, הממשקים שולחים אותו כ-seen_hash, והשרת מסרב כשהוא לא תואם.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.channels import sent_mark
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _rebuilt(api, fake_gi):
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert "1,200" in seen["messages"][0]["body"]
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    fake_gi.docs[0]["amount"] = "1500.00"           # הסכום עלה לפני השליחה
    assert api.post("/dispatch").json()["sent"] == []
    return rid, seen


def test_stale_preview_cannot_approve_rebuilt_reminder(api, svc, fake_gi):
    rid, seen = _rebuilt(api, fake_gi)
    assert svc._reminder(rid)["status"] == "pending_approval" and "1,500" in svc._reminder(rid)["body"]
    before = sent_mark(svc.sender.sent)
    res = api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]})
    assert res.status_code == 409 and "השתנו מאז שפתחתם" in res.json()["detail"], res.text
    # הפעלה 149: הסירוב מסומן ⇒ הממשק טוען את התצוגה מחדש ומציג מה השתנה (ולא «כבר אושרה»)
    assert res.headers.get("X-Gabi-Stale") == "preview" and "X-Gabi-Already" not in res.headers
    assert svc._reminder(rid)["status"] == "pending_approval"
    api.post("/dispatch")
    assert sent_mark(svc.sender.sent) == before, "יצא נוסח שבעל העסק לא ראה"
    # פתיחה מחדש ⇒ הגיבוב החדש ⇒ האישור עובר, ויוצא 1,500 (מה שנראה)
    fresh = api.get(f"/reminders/{rid}/preview").json()
    assert fresh["body_hash"] != seen["body_hash"] and "1,500" in fresh["messages"][0]["body"]
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": fresh["body_hash"]}).status_code == 200
    api.post("/dispatch")
    assert "1,500" in svc.sender.sent[-1]["body"] or "1,500" in svc.sender.sent[-2]["body"]


def test_stale_header_only_for_stale_preview(api, svc, fake_gi):
    """הפעלה 149: X-Gabi-Stale רק כשהנוסח השתנה. סירוב אחר (כבר אושרה / נדחתה) בלי הכותרת, אחרת הממשק היה
    טוען מחדש ומציג «הנוסח השתנה» על סירוב שאינו כזה. /preview נותן לממשק את הסכום לפני ואחרי."""
    rid, seen = _rebuilt(api, fake_gi)
    fresh = api.get(f"/reminders/{rid}/preview").json()
    assert (seen["total_text"], fresh["total_text"]) == ("1,200 ₪", "1,500 ₪")
    assert fresh["status"] == "pending_approval"
    ok = api.post(f"/reminders/{rid}/approve", json={"seen_hash": fresh["body_hash"]})
    assert ok.status_code == 200 and "X-Gabi-Stale" not in ok.headers
    # אישור חוזר עם הגיבוב הישן: האישור כבר נרשם ⇒ «כבר אושרה», לא «הנוסח השתנה»
    again = api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]})
    assert again.status_code == 409 and again.headers.get("X-Gabi-Already") == "approved"
    assert "X-Gabi-Stale" not in again.headers
    assert api.post(f"/reminders/{rid}/reject").status_code == 200
    rej = api.post(f"/reminders/{rid}/approve", json={"seen_hash": "x"})
    assert rej.status_code == 409 and "X-Gabi-Stale" not in rej.headers


def test_both_uis_reload_stale_preview():
    """הגנת-מקור (הפעלה 149): שני הממשקים מזהים את הכותרת, טוענים את התצוגה מחדש ומנקים את תיבות האישור."""
    api_ts = (ROOT / "web/src/api.ts").read_text(encoding="utf-8")
    mp = (ROOT / "web/src/components/MessagePreview.tsx").read_text(encoding="utf-8")
    ui = (ROOT / "app/ui.html").read_text(encoding="utf-8")
    main = (ROOT / "app/main.py").read_text(encoding="utf-8")
    assert '"X-Gabi-Stale": stale' in main
    assert "r.headers.get('X-Gabi-Stale') === 'preview'" in api_ts
    assert "if (stalePreview(e) && pending)" in mp and "setConfirmOpen(false); setConfirmAmount(false)" in mp
    assert "fresh.status === 'pending_approval'" in mp, "תזכורת שכבר לא ממתינה לא מוצגת כ«בדקו ואשרו שוב»"
    assert 'r.headers.get("X-Gabi-Stale")==="preview"' in ui
    assert 'if(a==="approve"&&e.stale){await load();return show(id,null,{was:p.total_text})}' in ui


def test_both_uis_send_seen_hash():
    api_ts = (ROOT / "web/src/api.ts").read_text(encoding="utf-8")
    mp = (ROOT / "web/src/components/MessagePreview.tsx").read_text(encoding="utf-8")
    ui = (ROOT / "app/ui.html").read_text(encoding="utf-8")
    assert "seen_hash: seenHash" in api_ts and "seenHash: pv?.body_hash" in mp
    assert "seen_hash:p.body_hash" in ui
