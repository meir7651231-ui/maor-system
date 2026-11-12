"""הפעלה 157 · /ui: שני פריטים מ«לא טופל» של 154/156.

1. הצ׳יפ בתור התזכורות. תזכורת שנבנתה מחדש בסנכרון (`amount_changed`) ואז אושרה המשיכה להציג «הסכום התעדכן
   מהמקור» במקום «מאושרת»: `block_reason` נשאר מהבנייה, והרשימה הציגה אותו בכל סטטוס. ותזכורת מאושרת שהסכום
   שלה השתנה שוב במקור לא סומנה בכלל, אף שהיא תחזור לאישור לפני השליחה. עכשיו `/reminders` מחזיר `amount_drift`
   לכל שורה (אותו חישוב כמו ב-`/preview`), והצ׳יפ מציג «הסכום השתנה במקור, תחזור לאישורך».
2. כפתורי ההחלטה בלוח. ברענון של אותה תזכורת (אחרי פעולה, או לחיצה חוזרת) הכפתורים של הנוסח הקודם נשארו
   פעילים עד שהשרת ענה. עכשיו הם כבויים מרגע הלחיצה ועד שהתצוגה חוזרת, וחוזרים אם הפעולה נכשלה.

הבדיקות בדפדפן: `web/e2e/ui.mjs` (כפתורים כבויים בזמן רענון) ו-`web/e2e/rebuild.mjs` (הצ׳יפ בתור).
"""
from __future__ import annotations

import pathlib

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

SRC = (pathlib.Path(__file__).parent.parent / "app" / "ui.html").read_text(encoding="utf-8")


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _row(api, rid):
    return next(r for r in api.get("/reminders").json() if r["id"] == rid)


def test_list_reports_drift_only_for_approved_reminder_whose_amount_changed(api, svc, fake_gi):
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    assert _row(api, rid)["amount_drift"] is None                      # ממתינה
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    assert _row(api, rid)["amount_drift"] is None                      # מאושרת, הסכום לא השתנה
    fake_gi.docs[0]["amount"] = "1500.00"
    api.post("/sync")
    row = _row(api, rid)
    assert row["status"] == "approved"
    assert row["amount_drift"] == {"was_text": "1,200 ₪", "now_text": "1,500 ₪"}
    # אותו ערך כמו בתצוגה המקדימה: הרשימה והלוח לא סותרים זה את זה
    assert row["amount_drift"] == api.get(f"/reminders/{rid}/preview").json()["amount_drift"]
    # השליחה מחזירה לאישור ⇒ אין פער, והסיבה היא amount_changed על תזכורת ממתינה
    assert api.post("/dispatch").json()["sent"] == [] and svc.sender.sent == []
    row = _row(api, rid)
    assert (row["status"], row["block_reason"], row["amount_drift"]) == \
        ("pending_approval", "amount_changed", None)


def test_rebuilt_then_approved_reminder_keeps_leftover_reason_in_api(api, fake_gi):
    """השארית שהצ׳יפ צריך להתעלם ממנה: אחרי אישור `block_reason` נשאר amount_changed, בלי פער."""
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    fake_gi.docs[0]["amount"] = "1500.00"
    api.post("/sync")                                                  # ממתינה ⇒ נבנית מחדש (153)
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert seen["block_reason"] == "amount_changed"
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    row = _row(api, rid)
    assert (row["status"], row["block_reason"], row["amount_drift"]) == ("approved", "amount_changed", None)


def test_chip_ignores_leftover_reapprove_reason_and_marks_drift():
    chip = SRC[SRC.index("const chipOf=r=>"):].split("\n", 1)[0]
    # פער ⇒ הסימון המיוחד; סיבת REAPPROVE רק על תזכורת ממתינה; אחרת הסטטוס
    assert chip.startswith("const chipOf=r=>r.amount_drift?DRIFT:")
    assert 'REAPPROVE[r.block_reason]&&r.status!=="pending_approval"' in chip
    assert "STATUS[r.status]||r.status" in chip
    assert 'const DRIFT="הסכום השתנה במקור, תחזור לאישורך"' in SRC
    # התור וטבלת החובות עוברים שניהם דרך chipOf; אין עוד הצגה ישירה של block_reason בלי בדיקת הסטטוס
    assert "${esc(chipOf(r))}" in SRC and ":L?chipOf(L):" in SRC
    assert "block_reason?why(" not in SRC


def test_decide_buttons_frozen_while_same_reminder_refreshes():
    body = SRC[SRC.index("async function show(id,info,stale){"):]
    first_await = body.index("await ")
    # רענון של אותה תזכורת: הנוסח נשאר, הכפתורים כבויים, לפני כל המתנה לשרת
    switch = body.index('if(shown!==id){shown=null;d.innerHTML=PVSK;d.setAttribute("aria-busy","true")}')
    frozen = body.index("else freeze(d);")
    assert switch < frozen < first_await
    assert 'const freeze=d=>d.querySelectorAll(".decide button,.confirm input").forEach(x=>{x.disabled=true});' in SRC


def test_action_freezes_first_and_thaws_only_on_plain_failure():
    body = SRC[SRC.index("const act=async(a,body)=>{"):]
    act = body[:body.index("const boxes=")]
    assert act.startswith("const act=async(a,body)=>{freeze(d);try{await api(")
    # «כבר נרשם» ונוסח ישן טוענים את התצוגה מחדש (show) ולא מחזירים את הכפתורים הישנים; רק כשל רגיל מחזיר
    assert act.count("thaw()") == 1
    assert act.index("thaw();failed(") > act.index("e.stale")
    assert "const thaw=()=>{boxes.forEach(x=>{x.disabled=false});if(noBtn)noBtn.disabled=false;gate()};" in SRC
