"""critic סבב 66 (טבלת מנגנוני העצירה — «איך משתחרר»): מחלוקת מסמנת גם `paused_reason='dispute'` וגם
`disputed=1`. «חידוש תזכורות» ניקה רק את paused_reason ⇒ 200, הממשק כתב «התזכורות ל… חודשו», אבל `disputed=1`
נשאר ו-`_customer_block` המשיך להחזיר 'disputed' **לתמיד** — אין שום מסלול בקוד שמנקה אותו. כשל שקט: בעל העסק
סגר את המחלוקת עם הלקוח, לחץ «חידוש», ושום תזכורת לא חזרה. «חידוש» = הכרעה מפורשת שלו ⇒ משחרר גם את המחלוקת."""
from __future__ import annotations

from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _mine(svc, ids):
    return [i for i in ids if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1]


def test_resume_after_dispute_really_resumes(svc, clock):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    api.post("/inbound", json={"sender": "050-1234567", "text": "הסכום לא נכון, אמור להיות 1,100"})
    assert svc._customer_block(1) == "disputed"
    clock.now += timedelta(days=8)
    assert _mine(svc, api.post("/plan").json()["created"]) == []      # בזמן המחלוקת: שקט (נכון)
    assert api.post("/customers/1/resume").status_code == 200
    assert svc._customer_block(1) is None, svc._customer_block(1)
    assert svc._customer_blocks()[1] is None
    assert _mine(svc, api.post("/plan").json()["created"]), "«חודשו» אבל שום תזכורת לא חזרה"
    assert any(a["action"] == "resume_customer" for a in api.get("/audit").json())


def test_resume_of_dispute_only_customer_is_allowed(svc):
    """מחלוקת בלי paused_reason (סומנה ידנית או מגרסה ישנה) ⇒ «חידוש» מותר, לא «הלקוח לא מושהה»."""
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    svc.db.x("UPDATE customers SET disputed=1, paused_reason=NULL WHERE id=1")
    assert api.post("/customers/1/resume").status_code == 200
    assert svc._customer_block(1) is None


def test_ui_shows_resume_button_for_dispute():
    """/ui הציג «חידוש» רק כש-customer_block===paused_reason; במחלוקת ('disputed' מול 'dispute') — בלי כפתור."""
    from pathlib import Path
    ui = (Path(__file__).resolve().parent.parent / "app/ui.html").read_text(encoding="utf-8")
    assert 'x.customer_block==="disputed"' in ui
