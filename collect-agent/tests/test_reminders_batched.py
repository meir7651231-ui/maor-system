"""הפעלה 179 — `/reminders` (מלא, `view=list`, `view=summary`) בלי שאילתות לכל תזכורת.

`/ui` ו-`/app/` טוענים את `view=list`/`view=summary` בכל רענון. כל שורה הריצה `reminder_invoice_ids`,
`_invoice` לכל חשבונית בתזכורת (ב-`reminder_totals`) ו-`reminder_amount_drift` (שוב אותן שאילתות)
⇒ 2,000 תזכורות ≈ 7,003 שאילתות. עכשיו `reminder_extras_many` — שתי שאילתות קבועות לכל הרשימה.
הבדיקות: זהות פלט מול המימוש שורה-שורה (`_reference_*` — הקוד הקודם בדיוק) על קובץ ועל SQLCipher,
כולל תזכורות מאוחדות, מאושרות עם פער סכום, מטבעות שונים, תזכורת ישנה בלי קישורים וסינון סטטוס;
ומספר שאילתות שלא גדל עם מספר התזכורות.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_bench_dashboard import MODES, _env

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import bench_dashboard as bench  # noqa: E402

LIST_Q = ("SELECT r.id, r.invoice_id, r.block_reason, r.status, r.step, r.amount_agorot, i.number, "
          "c.name customer_name FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
          "JOIN customers c ON c.id=i.customer_id")
FULL_Q = ("SELECT r.*, i.number, i.amount_agorot, i.currency, c.name customer_name "
          "FROM reminders r JOIN invoices i ON i.id=r.invoice_id JOIN customers c ON c.id=i.customer_id")


def _rows(svc, q, status, order="r.id"):
    return (svc.db.q(q + f" WHERE r.status=? ORDER BY {order}", (status,)) if status
            else svc.db.q(q + f" ORDER BY {order}"))


def _reference_list(svc, status=None):
    """המימוש של הפעלה 169–178 (`view=list`), שורה-שורה."""
    nums: dict[int, list[str]] = {}
    for x in svc.db.q("SELECT x.reminder_id rid, i.number FROM reminder_invoices x "
                      "JOIN invoices i ON i.id=x.invoice_id ORDER BY x.reminder_id, i.due, i.id"):
        nums.setdefault(x["rid"], []).append(x["number"])
    out = []
    for r in _rows(svc, LIST_Q, status):
        ids = svc.reminder_invoice_ids(r["id"])
        row = {k: r[k] for k in ("id", "invoice_id", "block_reason", "status", "step", "number", "customer_name")}
        out.append({**row, "invoice_ids": ids, **svc.reminder_totals(r["id"], r["invoice_id"], ids),
                    "amount_drift": svc.reminder_amount_drift(r), "numbers": nums.get(r["id"]) or [r["number"]]})
    return out


def _reference_summary(svc, status=None):
    q = "SELECT id, invoice_id, block_reason, status, amount_agorot FROM reminders r"
    out = []
    for r in _rows(svc, q, status, "id"):
        ids = svc.reminder_invoice_ids(r["id"])
        row = {k: r[k] for k in ("id", "invoice_id", "block_reason", "status")}
        out.append({**row, "invoice_ids": ids, **svc.reminder_totals(r["id"], r["invoice_id"], ids),
                    "amount_drift": svc.reminder_amount_drift(r)})
    return out


def _reference_full(svc, status=None):
    return [{**dict(r), "payload": json.loads(r["payload"]), "invoice_ids": svc.reminder_invoice_ids(r["id"]),
             **svc.reminder_totals(r["id"], r["invoice_id"]), "amount_drift": svc.reminder_amount_drift(r)}
            for r in _rows(svc, FULL_Q, status)]


def _mix(svc):
    """כל המקרים: מאושרות, אחת עם פער סכום, מטבע זר, ותזכורת ישנה בלי קישורים (נפילה לעוגן)."""
    ids = [r["id"] for r in svc.db.q("SELECT id FROM reminders WHERE status='pending_approval' ORDER BY id")]
    for rid in ids[:6]:
        svc.approve(rid, confirm_open=True, confirm_amount=True)
    merged = svc.db.one("SELECT reminder_id rid FROM reminder_invoices GROUP BY reminder_id "
                        "HAVING COUNT(*) > 1 ORDER BY reminder_id")
    assert merged, "אין תזכורת מאוחדת בנתונים — הבדיקה לא מכסה את המקרה"
    first = ids[0]
    svc.db.x("UPDATE invoices SET amount_agorot=amount_agorot+10000 WHERE id="
             "(SELECT invoice_id FROM reminders WHERE id=?)", (first,))           # פער במאושרת
    svc.db.x("UPDATE invoices SET currency='USD' WHERE id IN (SELECT invoice_id FROM reminder_invoices "
             "WHERE reminder_id=? ORDER BY invoice_id LIMIT 1)", (merged["rid"],))  # מטבעות שונים
    svc.db.x("DELETE FROM reminder_invoices WHERE reminder_id=?", (ids[1],))      # ישנה: בלי קישורים
    return first, ids[1]


@pytest.mark.parametrize("encrypted", MODES)
def test_all_views_same_output_as_reference(tmp_path, encrypted):
    svc = bench.build(str(tmp_path / "r.sqlite3"), 80, _env(encrypted))
    try:
        drifted, unlinked = _mix(svc)
        api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
        for status in (None, "approved", "pending_approval", "nothing"):
            sfx = f"&status={status}" if status else ""
            assert api.get("/reminders?view=list" + sfx).json() == _reference_list(svc, status), status
            assert api.get("/reminders?view=summary" + sfx).json() == _reference_summary(svc, status), status
            full = api.get("/reminders" + (f"?status={status}" if status else "")).json()
            assert full == json.loads(json.dumps(_reference_full(svc, status))), status
        lst = {r["id"]: r for r in api.get("/reminders?view=list").json()}
        assert lst[drifted]["amount_drift"] is not None                           # המקרים באמת נבדקו
        assert lst[unlinked]["invoice_ids"] == [] and lst[unlinked]["invoice_count"] == 1
        assert any(" + " in r["total_text"] for r in lst.values())
    finally:
        svc.db.conn.close()


def _count(svc, path):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    return bench.count_queries(svc, lambda: api.get(path))


@pytest.mark.parametrize("path", ["/reminders?view=list", "/reminders?view=summary", "/reminders"])
def test_queries_do_not_grow_with_reminders(tmp_path, path):
    small = bench.build(str(tmp_path / "s.sqlite3"), 30, _env(False))
    big = bench.build(str(tmp_path / "b.sqlite3"), 150, _env(False))
    try:
        ns = [s.db.one("SELECT COUNT(*) n FROM reminders")["n"] for s in (small, big)]
        assert ns[1] > ns[0] * 3, ns
        assert _count(small, path) == _count(big, path) <= 4
    finally:
        small.db.conn.close()
        big.db.conn.close()
