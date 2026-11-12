"""הפעלה 159 · שני פריטים מ«לא טופל» של 157.

1. `amount_drift` בכל מקום שמציג סטטוס של תזכורת. אחרי 157 התור ב-`/ui` סימן תזכורת מאושרת שהסכום שלה השתנה
   במקור («תחזור לאישורך»), אבל טבלת החובות באותו מסך (`last_reminder` מ-`/dashboard`) הציגה לה «מאושרת»,
   וגם `/reminders?view=summary` לא החזיר את השדה. עכשיו שלושתם מחזירים אותו ערך כמו `/preview`.
2. כפתורי ההחלטה בלוח בזמן פעולת כותרת (סנכרון / הכנת תזכורות / שליחה). סנכרון יכול לבנות את הנוסח מחדש ושליחה
   יכולה להוציא את התזכורת; עד עכשיו אפשר היה לאשר או לדחות באותו רגע את הנוסח שעל המסך.

הבדיקות בדפדפן: `web/e2e/ui.mjs` (כפתורים כבויים בזמן פעולת כותרת) ו-`web/e2e/rebuild.mjs` (הצ׳יפ בטבלת החובות).
"""
from __future__ import annotations

import pathlib

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

SRC = (pathlib.Path(__file__).parent.parent / "app" / "ui.html").read_text(encoding="utf-8")
DRIFT = {"was_text": "1,200 ₪", "now_text": "1,500 ₪"}


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _last(api, rid):
    return next(x["last_reminder"] for x in api.get("/dashboard").json()["invoices"]
                if x["last_reminder"] and x["last_reminder"]["id"] == rid)


def _summary(api, rid, status=None):
    url = "/reminders?view=summary" + (f"&status={status}" if status else "")
    return next(r for r in api.get(url).json() if r["id"] == rid)


def _approved(api):
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    return rid


def test_dashboard_and_summary_report_same_drift_as_preview(api, svc, fake_gi):
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    assert _last(api, rid)["amount_drift"] is None                     # ממתינה
    assert _summary(api, rid, "pending_approval")["amount_drift"] is None
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    assert _last(api, rid)["amount_drift"] is None                     # מאושרת, הסכום לא השתנה
    assert _summary(api, rid)["amount_drift"] is None
    fake_gi.docs[0]["amount"] = "1500.00"
    api.post("/sync")
    pv = api.get(f"/reminders/{rid}/preview").json()["amount_drift"]
    assert pv == DRIFT
    assert _last(api, rid)["status"] == "approved" and _last(api, rid)["amount_drift"] == pv
    assert _summary(api, rid, "approved")["amount_drift"] == pv
    full = next(r for r in api.get("/reminders").json() if r["id"] == rid)
    assert full["amount_drift"] == pv
    # השליחה מחזירה לאישור ⇒ אין עוד פער באף תצוגה
    assert api.post("/dispatch").json()["sent"] == [] and svc.sender.sent == []
    assert (_last(api, rid)["status"], _last(api, rid)["amount_drift"]) == ("pending_approval", None)
    assert _summary(api, rid)["amount_drift"] is None


def test_summary_view_keeps_its_small_shape(api, fake_gi):
    """התצוגה המקוצרת נשארת קטנה (critic סבב 37): סכום התזכורת נקרא לחישוב הפער ולא מוחזר, וגם לא הנוסח."""
    rid = _approved(api)
    assert set(_summary(api, rid)) == {"id", "invoice_id", "block_reason", "status", "invoice_ids",
                                       "invoice_count", "total_text", "amount_drift"}


def test_closed_invoice_shows_no_drift_on_dashboard(api, fake_gi):
    """חשבונית שנסגרה במקור: התזכורת מתבטלת במסלול אחר, אין «תחזור לאישורך»."""
    rid = _approved(api)
    fake_gi.docs[0]["amount"] = "1500.00"
    fake_gi.docs[0]["status"] = 1
    api.post("/sync")
    rows = [x for x in api.get("/dashboard").json()["invoices"]
            if x["last_reminder"] and x["last_reminder"]["id"] == rid]
    assert rows and all(x["last_reminder"]["amount_drift"] is None for x in rows)


def test_debts_table_chip_marks_drift_as_pending():
    row = SRC[SRC.index('$("#debts").innerHTML=d.invoices.map('):SRC.index("// חידוש ללקוח מושהה")]
    assert ":L?chipOf(L):" in row                                      # chipOf מציג DRIFT כשיש amount_drift
    assert 'L&&(L.status==="pending_approval"||L.amount_drift)?"pending":""' in row
    # צבע «ממתין» רק כשהצ׳יפ באמת מציג את התזכורת (לא «שולמה ונסגרה», לא לקוח מושהה)
    assert 'x.status==="open"&&!x.customer_block&&L&&' in row


def test_header_action_freezes_decision_buttons_until_it_ends():
    run = SRC[SRC.index("const run=(b,p)=>"):SRC.index('$("#btnAct").onclick')]
    # כבויים לפני הבקשה לשרת
    assert run.index('freeze($("#detail"))') < run.index("await api(p,")
    # בסיום, גם בכשל: busy יורד ורק אז התצוגה נטענת מחדש (אחרת היא חוזרת כבויה)
    fin = run[run.index("finally{"):]
    assert fin.startswith("finally{busy=false;hdr();sel&&show(sel)}")
    assert run.count("show(sel)") == 1


def test_preview_rendered_during_header_action_stays_frozen():
    body = SRC[SRC.index("async function show(id,info,stale){"):SRC.index("const DONE=")]
    # אחרי gate() (שמדליק את «אישור ושליחה») ולא לפניו
    assert body.index("boxes.forEach(x=>x.onchange=gate);gate();") < body.index("if(busy)freeze(d);")
