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
        assert set(r) == FIELDS
        assert not {"payload", "body", "html"} & set(r)
        assert {k: f[k] for k in FIELDS} == r


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
    assert used <= FIELDS, used - FIELDS


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
    # נעילה מנקה גם את הסינון ואת «הצגת עוד»
    assert 'for(const i of ["#kpis","#debts","#list","#df","#dmore"])' in src
