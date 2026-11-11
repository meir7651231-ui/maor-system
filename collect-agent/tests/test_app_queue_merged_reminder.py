"""הפעלה 135 — תור האישורים ב-`/app/` הציג תזכורת מאוחדת כחשבונית העוגן בלבד.

`/reminders?view=summary` החזיר רק `invoice_id` (העוגן), והממשק הציג בתור ובכותרת התצוגה המקדימה את המספר
והסכום של חשבונית אחת, בזמן שה-SMS שמתחת דיבר על הסה״כ של כל החשבוניות. בנוסף, תיבת «הסכום עדיין פתוח»
הוצגה רק כשהעוגן עצמו מ-CSV, אף שהשרת דורש `confirm_open` כשיש חשבונית מ-CSV בכל מקום בתזכורת
⇒ האישור נדחה בלי שהייתה דרך לסמן. התיקון: `invoice_count`/`total_text` גם ב-`view=summary`,
`numbers` + אותם שדות ב-`preview`, והממשק קורא את `needs_confirm_open` מהשרת.
"""
from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent
MP = (ROOT / "web/src/components/MessagePreview.tsx").read_text(encoding="utf-8")
DASH = (ROOT / "web/src/pages/Dashboard.tsx").read_text(encoding="utf-8")
API = (ROOT / "web/src/api.ts").read_text(encoding="utf-8")

HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"
CSV = HEAD + "".join(f"{3001 + k},דנה כהן,050-1234567,{a},01/09/2026,01/10/2026\n"
                     for k, a in enumerate(("120", "130.50", "140")))


def _planned(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    assert api.post("/settings/source/csv", content=CSV.encode()).status_code == 200
    api.post("/plan")
    return api


def test_summary_view_has_count_and_total(svc):
    api = _planned(svc)
    rows = api.get("/reminders", params={"view": "summary", "status": "pending_approval"}).json()
    assert rows
    # התשובה נשארת רזה (critic סבב 37): בלי גוף ההודעה ובלי payload
    assert all(set(r) == {"id", "invoice_id", "block_reason", "status", "invoice_ids",
                          "invoice_count", "total_text"} for r in rows)
    full = {r["id"]: r for r in api.get("/reminders").json()}
    for r in rows:
        assert (r["invoice_count"], r["total_text"]) == (full[r["id"]]["invoice_count"], full[r["id"]]["total_text"])
    m = next(r for r in rows if r["invoice_count"] > 1)
    assert m["invoice_count"] == 3 and m["total_text"] == "390.50 ₪"


def test_preview_lists_all_numbers_and_total(svc):
    api = _planned(svc)
    m = next(r for r in api.get("/reminders", params={"view": "summary"}).json() if r["invoice_count"] > 1)
    pv = api.get(f"/reminders/{m['id']}/preview").json()
    assert pv["numbers"] == ["3001", "3002", "3003"]
    assert (pv["invoice_count"], pv["total_text"]) == (3, "390.50 ₪")
    sms = next(x for x in pv["messages"] if x["channel"] == "sms")
    assert pv["total_text"] in sms["body"]


def test_csv_invoice_that_is_not_the_anchor_still_needs_confirm_open(svc):
    api = _planned(svc)
    m = next(r for r in api.get("/reminders", params={"view": "summary"}).json() if r["invoice_count"] > 1)
    # העוגן «מה-API», שתי האחרות מ-CSV: לפי העוגן בלבד הממשק לא היה מציג את התיבה
    svc.db.x("UPDATE invoices SET source='api' WHERE id=?", (m["invoice_id"],))
    assert api.get(f"/reminders/{m['id']}/preview").json()["needs_confirm_open"] is True
    assert api.post(f"/reminders/{m['id']}/approve").status_code in (409, 422)
    r = api.post(f"/reminders/{m['id']}/approve", json={"confirm_open": True})
    assert r.status_code == 200, r.text


def test_single_invoice_reminder_is_shown_as_before(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    api.post("/plan")
    rows = api.get("/reminders", params={"view": "summary"}).json()
    one = next(r for r in rows if r["invoice_count"] == 1)
    assert api.get(f"/reminders/{one['id']}/preview").json()["invoice_count"] == 1


def test_source_guard_app_reads_merged_fields():
    # הממשק: התיבה לפי השרת (כל התזכורת), הכותרת והתור לפי הסה״כ
    assert "pv?.needs_confirm_open ?? invoice.source === 'csv'" in MP
    assert "pv?.total_text ?? pending?.totalText" in MP
    assert "{email.cta} · {total}" in MP and "הסכום {total} עדיין פתוח" in MP
    assert 'data-testid="queue-merged"' in DASH and "pendingOf(i.id)!.totalText" in DASH
    assert "(p.invoice_count ?? 1) > 1" in API
