"""הפעלה 133 — הדשבורד הפשוט (/ui): תזכורת שדורשת אישור מפורש נתקעה שם לנצח.

באג (לפני התיקון): `approve` בשרת דורש `confirm_amount` (סכום חריג, critic 48) ו-`confirm_open`
(חשבונית מ-CSV, review חור 7). `/ui` שלח `POST /reminders/{id}/approve` בלי גוף ⇒ השרת דחה תמיד,
והמסך הציג רק את הודעת השגיאה. בהדגמה (`./demo.sh` מפנה ל-`/ui`) זו התזכורת של גל שרון (2,490 ₪).
בנוסף: סיבות «חזרה לאישור» (csv_stale וכו') הוצגו «חסום: csv_stale», `no_reply_to` לא השבית את הכפתור,
וברשימת התזכורות חשבונית בדולר הוצגה ב-₪.
התיקון: `preview` מחזיר `needs_confirm_open`; `/ui` מציג תיבות סימון, שולח את האישורים בגוף הבקשה,
ומבחין בין חסימה קשה לבין «לבדיקתך».
"""
from __future__ import annotations

import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.service import AMOUNT_CHECK, HARD_BLOCKS
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent
UI = (ROOT / "app/ui.html").read_text(encoding="utf-8")
SRC = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "app").glob("*.py"))
HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _pending(api):
    return api.get("/reminders", params={"status": "pending_approval"}).json()


def test_preview_tells_ui_when_csv_confirmation_is_needed(svc):
    api = _api(svc)
    api.post("/sync")
    api.post("/plan")
    first = _pending(api)[0]
    assert api.get(f"/reminders/{first['id']}/preview").json()["needs_confirm_open"] is False
    r = api.post("/settings/source/csv",
                 content=(HEAD + "3001,רון לוי,050-7654321,300,01/09/2026,01/10/2026\n").encode())
    assert r.status_code == 200, r.text
    api.post("/plan")
    csv_rem = next(x for x in _pending(api) if x["number"] == "3001")
    assert api.get(f"/reminders/{csv_rem['id']}/preview").json()["needs_confirm_open"] is True
    # בלי גוף (כמו /ui הישן) ⇒ נדחה; עם confirm_open ⇒ מאושר
    assert api.post(f"/reminders/{csv_rem['id']}/approve").status_code >= 400
    ok = api.post(f"/reminders/{csv_rem['id']}/approve", json={"confirm_open": True})
    assert ok.status_code == 200, ok.text


def test_amount_check_reminder_needs_body_from_ui(svc):
    api = _api(svc)
    rows = "".join(f"{3001 + k},דנה כהן,050-1234567,{a},01/09/2026,01/10/2026\n"
                   for k, a in enumerate(("120", "130", "12000")))
    api.post("/settings/source/csv", content=(HEAD + rows).encode())
    api.post("/plan")
    rem = next(x for x in _pending(api) if x["block_reason"] == AMOUNT_CHECK)
    assert api.get(f"/reminders/{rem['id']}/preview").json()["amount_check"]
    assert api.post(f"/reminders/{rem['id']}/approve", json={"confirm_open": True}).status_code >= 400
    ok = api.post(f"/reminders/{rem['id']}/approve", json={"confirm_open": True, "confirm_amount": True})
    assert ok.status_code == 200, ok.text


def _js_keys(name: str) -> set[str]:
    m = re.search(r"const " + name + r"=\{(.*?)\};", UI, re.S)
    assert m, name
    return set(re.findall(r"\b([a-z_]+):\"", m.group(1)))


def test_ui_sends_confirmations_and_shows_checkboxes():
    assert "confirm_amount:" in UI and "confirm_open:" in UI, "/ui לא שולח את האישורים המפורשים"
    assert 'id="cAmt"' in UI and 'id="cOpen"' in UI
    assert "p.needs_confirm_open" in UI and "p.amount_check" in UI
    assert '{method:"POST"});await load();show(id)' not in UI, "approve בלי גוף חזר"


def test_ui_hard_blocks_match_server_and_reapprove_reasons_are_not_blocked():
    m = re.search(r"const HARD=\[([^\]]*)\]", UI)
    assert m and set(re.findall(r'"([a-z_]+)"', m.group(1))) == HARD_BLOCKS
    assert HARD_BLOCKS <= _js_keys("BLOCK"), "חסימה קשה בלי תווית ב-/ui"
    rs = set(re.findall(r'_invalidate\(\w+, "([a-z_]+)"\)', SRC)) | {AMOUNT_CHECK}
    rs |= set(re.findall(r'why: str = "([a-z_]+)"', SRC))
    assert {"csv_stale", "csv_missing_from_import", "approval_expired", "amount_changed"} <= rs
    assert not rs - _js_keys("REAPPROVE"), sorted(rs - _js_keys("REAPPROVE"))
    assert not HARD_BLOCKS & _js_keys("REAPPROVE")


def test_ui_reminder_list_uses_invoice_currency():
    assert "money(r.amount_agorot)" not in UI, "$500 הוצג «500 ₪» ברשימת התזכורות"
    # הפעלה 162: המטבע מגיע מהשרת ב-total_text (templates.fmt_amount לפי מטבע כל חשבונית, «1,200 ₪ + $500»);
    # הנפילה ל-fmtCur(r.amount_agorot,r.currency) ירדה כי `view=list` לא מחזיר amount_agorot/currency
    assert "esc(r.total_text)" in UI and "r.amount_agorot" not in UI[UI.index("el.innerHTML=rows.map"):]


def test_ui_debts_table_has_no_raw_block_code():
    assert "BLOCK[L.block_reason]||L.block_reason" not in UI, "טבלת החובות הציגה «amount_check» גולמי"
    # הפעלה 157: הטבלה והתור עוברים דרך chipOf (why() לסיבה, או הסטטוס כשהסיבה היא שארית מאישור קודם)
    assert ":L?chipOf(L):" in UI and "why(r.block_reason)" in UI


def test_ui_first_load_skeleton_not_blank_run150():
    """הפעלה 150: בכניסה ראשונה `/ui` הציג כותרות בלי מספרים, טבלה ריקה ותור ריק עד שהשרת ענה, וטעינה ראשונה
    שנכשלה נראתה כמו «אין חובות» לצד «מה שמוצג כאן אולי לא עדכני». עכשיו: שלד טעינה בחלק שעוד לא נטען,
    «לא נטענו» כשהטעינה הראשונה נכשלת, והנוסח של פס השגיאה לפי מה שבאמת על המסך.
    ההתנהגות עצמה נבדקת בדפדפן ב-web/e2e/ui.mjs; כאן הגנת-מקור שרצה גם ב-CI (שאין בו דפדפן)."""
    from pathlib import Path
    ui = (Path(__file__).resolve().parent.parent / "app/ui.html").read_text(encoding="utf-8")
    assert "if(ask&&!locked)skel();" in ui                      # רק טעינה שהמשתמש יזם, לא רענון רקע
    assert "function skel(){if(got.d&&got.q)return;" in ui      # אחרי שנטען פעם אחת — לא מחליפים נתונים בשלד
    assert 'aria-hidden="true"><span class="sk big">' in ui     # השלד מוסתר מקורא מסך
    assert '<div class="vh" id="busyMsg" role="status"></div>' in ui
    assert "החובות לא נטענו מהשרת" in ui and "תור התזכורות לא נטען מהשרת" in ui
    assert 'got.d||got.q?"מה שמוצג כאן אולי לא עדכני.":"עדיין אין נתונים להצגה."' in ui
    assert "got={d:false,q:false};busyOff();" in ui.split("function lock(had){")[1].split("\n")[0]
    assert "@media (prefers-reduced-motion:reduce){.sk{animation:none}}" in ui


def test_ui_preview_skeleton_on_switch_run152():
    """הפעלה 152: במעבר לתזכורת אחרת לוח התצוגה המקדימה ב-`/ui` המשיך להציג את התזכורת הקודמת, עם «אישור ושליחה»
    פעיל שלה, עד שהשרת ענה — בזמן שהרשימה כבר סימנה את החדשה. לחיצה באותו רגע אישרה את התזכורת הלא נכונה.
    עכשיו הלוח מתחלף מיד לשלד טעינה; רענון של אותה תזכורת לא מחליף לשלד.
    ההתנהגות נבדקת בדפדפן ב-web/e2e/ui.mjs; כאן הגנת-מקור שרצה גם ב-CI (שאין בו דפדפן)."""
    from pathlib import Path
    ui = (Path(__file__).resolve().parent.parent / "app/ui.html").read_text(encoding="utf-8")
    body = ui.split("async function show(id,info,stale){")[1]
    head = body.split("let p;try{")[0]
    # השלד נכנס לפני הבקשה לשרת, ורק כשעוברים לתזכורת אחרת
    assert 'if(shown!==id){shown=null;d.innerHTML=PVSK;d.setAttribute("aria-busy","true")}' in head
    assert 'id="pvBusy" role="status">טוען תצוגה מקדימה…' in ui
    assert '<div class="previews" aria-hidden="true">' in ui.split("const PVSK=")[1].split("\n")[0]
    # aria-busy יורד בהצלחה, בכשל ובנעילה; shown מתעדכן רק אחרי שהתשובה של התזכורת הנבחרת הגיעה
    assert 'if(sel!==id)return;\n  shown=id;d.removeAttribute("aria-busy");' in body
    assert 'shown=null;d.removeAttribute("aria-busy");d.innerHTML=`<div class="err" id="pverr"' in body
    lock = ui.split("function lock(had){")[1].split("\n")[0]
    assert 'sel=shown=null;$("#detail").removeAttribute("aria-busy");' in lock
