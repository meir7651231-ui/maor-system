"""הפעלה 162 · `/ui` טען את `/reminders` המלא בכל רענון.

התור ב-`/ui` מציג לכל תזכורת: שם הלקוח, סה״כ, מספר חשבונית (או כמה חשבוניות), שלב, וצ׳יפ סטטוס. אבל הוא ביקש את
`/reminders` המלא — גוף ההודעה, ה-payload וה-HTML של המייל לכל תזכורת. במדידה של 161 על 5,000 לקוחות: 27MB
ו-0.95 שנ׳ לכל רענון (והדף מרענן אחרי כל פעולה). `view=summary` של `/app/` לא מספיק: אין בו שם לקוח, מספר ושלב.
עכשיו: `view=list` — שדות הרשימה בלבד, באותם ערכים כמו בתצוגה המלאה. הבדיקה בדפדפן: `web/e2e/ui.mjs`.
"""
from __future__ import annotations

import json
import pathlib
import re

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

SRC = (pathlib.Path(__file__).parent.parent / "app" / "ui.html").read_text(encoding="utf-8")
FIELDS = {"id", "invoice_id", "block_reason", "status", "step", "number", "customer_name",
          "invoice_ids", "invoice_count", "total_text", "amount_drift"}
# הפעלה 169: `numbers` קיים רק ב-`view=list` (חיפוש בתור); לא בתצוגה המלאה
LIST_ONLY = {"numbers"}


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _planned(api):
    api.post("/sync")
    return api.post("/plan").json()["created"]


def test_list_view_has_only_list_fields_with_same_values_as_full(api, fake_gi):
    assert _planned(api)
    full = api.get("/reminders").json()
    lst = api.get("/reminders?view=list").json()
    assert [r["id"] for r in lst] == [r["id"] for r in full] and lst
    for f, r in zip(full, lst, strict=True):
        assert set(r) == FIELDS | LIST_ONLY
        assert not {"payload", "body", "html"} & set(r)
        assert {k: f[k] for k in FIELDS} == {k: r[k] for k in FIELDS}
        assert r["numbers"][0] == f["number"]


def test_list_view_filters_by_status(api, fake_gi):
    rids = _planned(api)
    seen = api.get(f"/reminders/{rids[0]}/preview").json()
    assert api.post(f"/reminders/{rids[0]}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    for st in ("approved", "pending_approval"):
        a = api.get(f"/reminders?status={st}").json()
        b = api.get(f"/reminders?status={st}&view=list").json()
        assert [r["id"] for r in a] == [r["id"] for r in b]
        assert all(r["status"] == st for r in b)


def test_list_view_reports_drift_like_full_view(api, fake_gi):
    rid = _planned(api)[0]
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    fake_gi.docs[0]["amount"] = "1500.00"
    api.post("/sync")
    pv = api.get(f"/reminders/{rid}/preview").json()["amount_drift"]
    assert pv
    row = next(r for r in api.get("/reminders?view=list").json() if r["id"] == rid)
    assert row["amount_drift"] == pv and row["status"] == "approved"


def test_list_view_is_much_smaller_than_full(api, fake_gi):
    assert _planned(api)
    full = len(json.dumps(api.get("/reminders").json(), ensure_ascii=False))
    lst = len(json.dumps(api.get("/reminders?view=list").json(), ensure_ascii=False))
    assert lst * 4 < full, (lst, full)


def test_summary_view_unchanged():
    """`/app/` נשען על `view=summary`; ה-view החדש לא נוגע בו (הצורה נעולה ב-test_header_action_and_drift_views)."""
    src = (pathlib.Path(__file__).parent.parent / "app" / "main.py").read_text(encoding="utf-8")
    assert 'if view == "list":' in src and 'if view == "summary":' in src


def test_ui_loads_list_view_not_full_reminders():
    """מגן-מקור: הדף לא חוזר לבקש את `/reminders` המלא, ושורת הרשימה משתמשת רק בשדות של `view=list`."""
    assert 'api("/reminders?view=list",{},ask)' in SRC
    assert not re.search(r'api\("/reminders"\s*[,)]', SRC)
    # הפעלה 165: השורה עברה ל-drawQueue (סינון «לטיפול» + עימוד) ⇒ המגן מכסה את כל הפונקציה, כולל שדות הסינון
    row = SRC[SRC.index("const QPAGE="):SRC.index('el.querySelectorAll(".item")')]
    used = set(re.findall(r"\br\.(\w+)", row))
    assert used <= FIELDS | LIST_ONLY, used - FIELDS - LIST_ONLY


def test_list_view_total_text_keeps_invoice_currency(api, fake_gi):
    """«$500 הוצג 500 ₪» (מגן ישן ב-test_ui_simple_approve): המטבע מגיע עכשיו רק מ-total_text של השרת."""
    fake_gi.docs[1]["currency"] = "USD"
    fake_gi.docs[1]["amount"] = "500.00"
    _planned(api)
    texts = {r["total_text"] for r in api.get("/reminders?view=list").json()}
    assert any("$" in t and "₪" not in t for t in texts), texts


def test_ui_queue_defaults_to_actionable_and_pages():
    """הפעלה 165: התור ב-/ui הציג את כל 5,000 התזכורות (גם שנשלחו/נדחו/בוטלו) בכל רענון — 2.2–3.3 שנ׳ לטעינה
    במעבד מואט ×4, והממתינות נקברו. מגן-מקור: ברירת מחדל «לטיפול», גבול של 50, «הצגת עוד», ו«נסגר» מוגדר בדיוק:
    send_unknown (אולי יצאה) ותזכורת עם פער סכום נשארות לטיפול; התזכורת שנבחרה לא נעלמת מהרשימה."""
    assert "const QPAGE=50" in SRC and "let qRows=[],qAll=false,qLim=QPAGE;" in SRC
    done = SRC[SRC.index("qDone=r=>"):SRC.index("let qRows")]
    assert "!r.amount_drift&&" in done and 'startsWith("sent")' in done
    assert '"rejected"' in done and '"cancelled"' in done and "send_unknown" not in done
    dq = SRC.index("function drawQueue")    # הפעלה 167: גם drawDebts מכיל el.innerHTML=view.map ⇒ מחפשים אחרי drawQueue
    assert "r.id===sel" in SRC[dq:SRC.index("el.innerHTML=view.map", dq)]
    assert "el.innerHTML=view.map" in SRC and "el.innerHTML=rows.map" not in SRC
    assert "qRows=q.value;drawQueue();" in SRC


# ---------- הפעלה 167: טבלת החובות ב-/ui — «פתוחות» כברירת מחדל ועד 50 שורות ----------

def test_debts_table_defaults_to_open_and_pages():
    """5,000 חשבוניות ⇒ 5,000 שורות בכל רענון (4.5–5.1 שנ׳ במעבד מואט ×4). עכשיו כמו התור: «פתוחות» כברירת מחדל,
    סגורות מאחורי «הכול», ועד DPAGE שורות עם «הצגת עוד». אף שורה לא נמחקת — הכול נשאר נגיש."""
    src = SRC
    assert "const DPAGE=50;" in src and "let dRows=[],dAll=false,dLim=DPAGE;" in src
    load = src[src.index("async function loadDash(ask){"):src.index("const DPAGE=50;")]
    assert "dRows=d.invoices;drawDebts();" in load
    assert "d.invoices.map(" not in load                     # השורות לא נבנות יותר כולן בטעינה
    draw = src[src.index("function drawDebts(){"):src.index("// חידוש ללקוח מושהה")]
    assert 'open=rows.filter(x=>x.status==="open"),pick=dAll?rows:open' in draw
    assert "view=pick.slice(0,dLim)" in draw and "el.innerHTML=view.map(" in draw
    assert "dLim+=DPAGE" in draw and 'dAll=b.dataset.d==="1";dLim=DPAGE' in draw
    assert "אין חובות פתוחים. «הכול» מציג" in draw          # ריק בלי הסבר נראה כמו «אין חובות»
    # נעילה מנקה גם את הסינון ואת «הצגת עוד». הפעלה 168: גם את סינון התור («לטיפול (N)» של המשתמש הקודם נשאר
    # על המסך הנעול) ואת שדות החיפוש
    assert 'for(const i of ["#kpis","#debts","#list","#df","#dmore","#qf","#qmore"])' in src


# ---------- הפעלה 168: חיפוש לפי שם / מספר חשבונית / טלפון בתור ובטבלת החובות ----------

def _found():
    """מריץ את פונקציית ההתאמה של הדף ב-node, אם זמין; אחרת None (המגן הטקסטואלי עדיין רץ)."""
    import shutil
    import subprocess
    node = shutil.which("node")
    if not node:
        return None
    i = SRC.index("const norm=")
    fn = SRC[i:SRC.index(";\nlet dQ", i)]
    cases = [["דנה", "דָּנָה  כהן", "1001", ""], ["דנה כהן", "דנה   כהן", "1", ""],
             ["050-123", "x", "9", "0501234567"], ["1001", "x", "INV-1001", ""],
             ["כהן", "לוי", "1", "050"], ["", "x", "1", ""], ["DANA", "dana k", "1", ""],
             ["--", "x", "1", "050"], ["123", "x", "9", None],
             # הפעלה 169: מערך מספרים — כל אחד לחוד, בלי הדבקה ביניהם
             ["3003", "x", ["3001", "3002", "3003"], ""], ["0130", "x", ["3001", "3002"], ""],
             ["inv-2", "x", ["INV-1", "INV-2"], ""], ["3001", "x", [], ""]]
    js = fn + ";console.log(JSON.stringify(" + json.dumps(cases) + ".map(c=>found(...c))))"
    out = subprocess.run([node, "-e", js], capture_output=True, text=True, check=True).stdout  # noqa: S603 — קוד הדף עצמו
    return json.loads(out)


def test_ui_search_in_queue_and_debts():
    """5,000 חשבוניות/תזכורות עם עימוד של 50 ⇒ להגיע ללקוח אחד דרש «הצגת עוד» עשרות פעמים. מגן-מקור: שדה חיפוש
    סטטי לכל רשימה (הפוקוס לא הולך לאיבוד בציור), הקלדה מאפסת את העימוד, התזכורת שנבחרה לא נעלמת, ריק ⇒ הסבר
    עם מה שחיפשו, כפתורי «לטיפול»/«הכול» נשארים גם כשאין התאמה (אחרת אי אפשר לעבור ל«הכול»)."""
    assert 'id="dFind"' in SRC and 'id="qFind"' in SRC
    assert '$("#dFind").addEventListener("input",e=>{dQ=e.target.value;dLim=DPAGE;drawDebts()});' in SRC
    assert '$("#qFind").addEventListener("input",e=>{qQ=e.target.value;qLim=QPAGE;drawQueue()});' in SRC
    draw = SRC[SRC.index("function drawDebts(){"):SRC.index("// חידוש ללקוח מושהה")]
    assert "found(dQ,x.customer,x.number,x.phone)" in draw and "לא נמצאו" in draw and "esc(dQ)" in draw
    q = SRC[SRC.index("function drawQueue(){"):SRC.index('el.querySelectorAll(".item")')]
    assert "r.id===sel||found(qQ,r.customer_name,r.numbers||r.number)" in q and "esc(qQ)" in q
    assert '$("#qf").innerHTML=all.length?' in q                  # לא rows.length — אחרת הכפתורים נעלמים בחיפוש ריק
    assert 'dQ=qQ="";' in SRC                                      # נעילה מנקה את החיפוש
    got = _found()
    if got is not None:
        assert got == [True, True, True, True, False, True, True, False, False, True, False, True, False], got


# ---------- הפעלה 169: חיפוש בתור לפי מספר של חשבונית שאינה העוגן ----------

HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"
CSV = HEAD + "".join(f"{3001 + k},דנה כהן,050-1234567,{a},01/09/2026,01/10/2026\n"
                     for k, a in enumerate(("120", "130.50", "140")))


def test_list_view_numbers_cover_all_invoices_of_merged_reminder(api):
    """הבאג (168): החיפוש בתור השווה רק את `number` של העוגן ⇒ תזכורת מאוחדת על 3001–3003 לא נמצאה בחיפוש
    «3003». עכשיו `numbers` מחזיר את כל המספרים לפי מועד (העוגן ראשון), ותזכורת רגילה ⇒ [המספר שלה]."""
    api.post("/sync")
    assert api.post("/settings/source/csv", content=CSV.encode()).status_code == 200
    api.post("/plan")
    rows = api.get("/reminders?view=list").json()
    merged = [r for r in rows if r["invoice_count"] > 1]
    assert merged and all(len(r["numbers"]) == r["invoice_count"] for r in rows)
    m = merged[0]
    assert sorted(m["numbers"]) == ["3001", "3002", "3003"] and m["numbers"][0] == m["number"]
    assert all(r["numbers"] == [r["number"]] for r in rows if r["invoice_count"] == 1)
    # מסונן לפי סטטוס ⇒ אותם מספרים
    st = api.get(f"/reminders?status={m['status']}&view=list").json()
    assert next(r for r in st if r["id"] == m["id"])["numbers"] == m["numbers"]
