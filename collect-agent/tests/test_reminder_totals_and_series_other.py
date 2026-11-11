"""הפעלה 134 — שני שרידים מ-133.

(1) רשימת התזכורות: `/reminders` מחזיר את סכום התזכורת (הסה״כ) לצד `number` ו-`currency` של חשבונית
    העוגן בלבד. תזכורת מאוחדת של 3 חשבוניות הוצגה ב-`/ui` כ«חשבונית 3001 · 390.50 ₪», כאילו חשבונית
    אחת על כל הסכום, וסה״כ במטבעות שונים הוצג במטבע של העוגן. התיקון: `invoice_count` ו-`total_text`
    לכל תזכורת; `/ui` מציג «3 חשבוניות» ואת הסה״כ לפי מטבע.
(2) גרף הגבייה השבועי מצייר ₪ בלבד (הפעלה 131), וגבייה במטבע אחר נעלמה ממנו בלי אזכור. התיקון:
    `series[i].other` (רק בשבוע שיש בו גבייה כזו), והממשק כותב «ועוד $500, לא בגרף».
"""
from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.templates import fmt_amount
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent
UI = (ROOT / "app/ui.html").read_text(encoding="utf-8")
DASH = (ROOT / "web/src/pages/Dashboard.tsx").read_text(encoding="utf-8")


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"
CSV = HEAD + "".join(f"{3001 + k},דנה כהן,050-1234567,{a},01/09/2026,01/10/2026\n"
                     for k, a in enumerate(("120", "130.50", "140")))


def _planned(svc):
    api = _api(svc)
    api.post("/sync")
    r = api.post("/settings/source/csv", content=CSV.encode())
    assert r.status_code == 200, r.text
    api.post("/plan")
    return api, api.get("/reminders").json()


def test_reminders_list_has_count_and_total_of_all_invoices(svc):
    api, rows = _planned(svc)
    assert rows
    for r in rows:
        ids = r["invoice_ids"] or [r["invoice_id"]]
        invs = [svc.db.one("SELECT amount_agorot, currency FROM invoices WHERE id=?", (i,)) for i in ids]
        assert r["invoice_count"] == len(ids)
        assert r["total_text"] == fmt_amount(sum(i["amount_agorot"] for i in invs), "ILS")
    merged = [r for r in rows if r["invoice_count"] > 1]
    assert merged, "בנתוני הבדיקה אמורה להיות תזכורת מאוחדת"
    m = merged[0]
    assert m["invoice_count"] == 3 and m["total_text"] == "390.50 ₪"
    # הבאג: `number` הוא של העוגן בלבד, והסכום לידו הוא של שלוש החשבוניות
    anchor = svc.db.one("SELECT amount_agorot FROM invoices WHERE id=?", (m["invoice_id"],))
    assert anchor["amount_agorot"] < m["amount_agorot"] == 39050
    sms = next(x for x in api.get(f"/reminders/{m['id']}/preview").json()["messages"]
               if x["channel"] == "sms")
    assert m["total_text"] in sms["body"]


def test_total_text_does_not_add_currencies(svc):
    api, rows = _planned(svc)
    m = next(r for r in rows if r["invoice_count"] > 1)
    other = next(i for i in m["invoice_ids"] if i != m["invoice_id"])
    svc.db.x("UPDATE invoices SET currency='USD' WHERE id=?", (other,))
    again = next(r for r in api.get("/reminders").json() if r["id"] == m["id"])
    parts = again["total_text"].split(" + ")
    assert len(parts) == 2 and any(p.startswith("$") for p in parts) and any("₪" in p for p in parts)


def test_summary_view_stays_lean(svc):
    # הפעלה 135: גם התצוגה המקוצרת מקבלת invoice_count/total_text (תור האישורים ב-/app/); עדיין בלי גוף/payload
    api, _ = _planned(svc)
    row = api.get("/reminders", params={"view": "summary"}).json()[0]
    assert set(row) == {"id", "invoice_id", "block_reason", "status", "invoice_ids", "invoice_count", "total_text"}


def test_series_reports_other_currency_per_week(svc):
    _planned(svc)
    base = svc.dashboard()["series"]
    assert all("other" not in w for w in base)          # עסק בשקלים בלבד: התשובה כמו קודם
    rows = svc.db.q("SELECT id, amount_agorot FROM invoices WHERE status='open' ORDER BY id")
    usd, eur, usd2 = rows[0], rows[1], rows[2]
    now = svc.clock().isoformat()
    for r, c in ((usd, "USD"), (eur, "eur"), (usd2, "USD")):
        svc.db.x("UPDATE invoices SET currency=?, status='closed', closed_at=? WHERE id=?",
                 (c, now, r["id"]))
    series = svc.dashboard()["series"]
    assert [(w["collected_agorot"], w["count"]) for w in series] == \
        [(w["collected_agorot"], w["count"]) for w in base]            # ₪ לא השתנה
    assert [w for w in series[:-1] if "other" in w] == []
    assert series[-1]["other"] == [
        {"currency": "EUR", "collected_agorot": eur["amount_agorot"]},
        {"currency": "USD", "collected_agorot": usd["amount_agorot"] + usd2["amount_agorot"]}]


def test_source_guards():
    assert "r.invoice_count>1" in UI and "r.total_text||" in UI
    assert "חשבונית ${esc(r.number)} · שלב" not in UI
    assert "otherInSeries(series)" in DASH and "לא בגרף" in DASH
