"""הפעלה 180 — מדידת `/reminders/{rid}/preview` ו-`/customers` («הבא» (2) מ-179), והכרעה: **לא מאחדים**.

אותה שיטה כמו 175–179 (`bench.count_queries` דרך ה-API, 5,000 חשבוניות על קובץ):
- `/customers` — שאילתה אחת (`SELECT * FROM customers`), קבועה בכל גודל.
- `/reminders/{rid}/preview` — 3·k+2 שאילתות, k = מספר החשבוניות בתזכורת עצמה (`_invoice` + שתיים ב-`_amount_outliers`
  לכל חשבונית). **לא תלוי בגודל ה-DB**: 200 / 2,000 / 5,000 חשבוניות ⇒ 11 שאילתות לתזכורת של 3 חשבוניות.
  תזכורת מאוחדת של 40 חשבוניות ללקוח אחד: 122 שאילתות, 1.7ms. זו פעולה על תזכורת אחת שהבעלים פותח, לא רשימה
  שנטענת בכל רענון ⇒ איחוד לא מצדיק את הסיכון לנוסח/לגיבוב שמוצגים לאישור.

הבדיקות נועלות את ההכרעה: אם מישהו יכניס לכאן שאילתה שגדלה עם כל ה-DB (סריקה לכל לקוח/תזכורת), הן ייפלו.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_bench_dashboard import _env

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import bench_dashboard as bench  # noqa: E402


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _by_links(svc) -> dict[int, int]:
    """מספר החשבוניות → תזכורת לדוגמה עם המספר הזה (הראשונה לפי id)."""
    out: dict[int, int] = {}
    for r in svc.db.q("SELECT reminder_id rid, COUNT(*) c FROM reminder_invoices GROUP BY reminder_id "
                      "ORDER BY reminder_id"):
        out.setdefault(r["c"], r["rid"])
    return out


def test_customers_single_query(tmp_path):
    small = bench.build(str(tmp_path / "s.sqlite3"), 30, _env(False))
    big = bench.build(str(tmp_path / "b.sqlite3"), 150, _env(False))
    try:
        counts = []
        for svc in (small, big):
            api = _api(svc)
            n = svc.db.one("SELECT COUNT(*) n FROM customers")["n"]
            res = {}
            counts.append(bench.count_queries(svc, lambda api=api, res=res: res.update(r=api.get("/customers"))))
            assert res["r"].status_code == 200 and len(res["r"].json()) == n
        # שאילתת הלקוחות + שאילתה קבועה אחת של שכבת ה-API (אימות) — בלי תלות במספר הלקוחות
        assert counts[0] == counts[1] <= 2, counts
    finally:
        small.db.conn.close()
        big.db.conn.close()


def test_preview_queries_depend_on_reminder_not_db_size(tmp_path):
    small = bench.build(str(tmp_path / "s.sqlite3"), 30, _env(False))
    big = bench.build(str(tmp_path / "b.sqlite3"), 150, _env(False))
    try:
        ls, lb = _by_links(small), _by_links(big)
        common = sorted(set(ls) & set(lb))
        assert common, (ls, lb)
        for k in common:
            qs = []
            for svc, rid in ((small, ls[k]), (big, lb[k])):
                api, res = _api(svc), {}
                qs.append(bench.count_queries(svc, lambda api=api, rid=rid, res=res:
                                              res.update(r=api.get(f"/reminders/{rid}/preview"))))
                body = res["r"].json()
                assert res["r"].status_code == 200 and len(body["numbers"]) == k, body
            # אותו k ⇒ אותו מספר שאילתות בשני הגדלים, ובתוך החסם שנמדד (3·k+2, +1 של שכבת ה-API)
            assert qs[0] == qs[1] <= 3 * k + 3, (k, qs)
    finally:
        small.db.conn.close()
        big.db.conn.close()
