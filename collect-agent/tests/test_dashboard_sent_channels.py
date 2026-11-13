"""הפעלה 177 — `/dashboard` אחרי שתזכורות יצאו: ערוצי היוצאים בשאילתה אחת, לא שאילתה לכל שורה.

176 מדדה רק מצב שבו אף תזכורת לא יצאה. עם תזכורות שיצאו, `last_sent.channels` חושב ב-`_sent_channels`
לכל שורה ⇒ 5,000 חשבוניות שיצאו = 5,016 שאילתות (205ms). עכשיו: `_sent_channels_many` (שאילתה אחת,
json_each) ⇒ 17 שאילתות. הבדיקות: זהות פלט מול המימוש הקודם (`_reference` ⇒ `_sent_channels` שורה-שורה)
על קובץ ועל SQLCipher; מספר שאילתות שלא גדל עם מספר השורות שיצאו; ערוץ ריק/ריבוי מזהים/נכנסות.
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

import pytest

from tests.test_bench_dashboard import MODES, _env
from tests.test_dashboard_batched import _reference

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import bench_dashboard as bench  # noqa: E402


@pytest.mark.parametrize("encrypted", MODES)
def test_sent_rows_same_output_as_reference(tmp_path, encrypted):
    svc = bench.build(str(tmp_path / "s.sqlite3"), 60, _env(encrypted), sent=True)
    try:
        rows = svc.dashboard()["invoices"]
        went = [x for x in rows if x["last_sent"]]
        assert len(went) == 60                                      # הכול יצא ⇒ הנתיב נבדק בכל שורה
        assert all(x["last_sent"]["channels"] for x in went)
        for x in rows:
            ref = _reference(svc, x["invoice_id"], x["customer_id"])
            assert {k: x[k] for k in ref} == ref, x["number"]
        lst = svc.dashboard(view="list")["invoices"]
        assert [x["last_sent"] for x in lst] == [x["last_sent"] for x in rows]
    finally:
        svc.db.conn.close()


def test_queries_do_not_grow_with_sent_rows():
    small = bench.run(40, False, repeat=1, sent=True)
    big = bench.run(120, False, repeat=1, sent=True)
    assert (small["sent_rows"], big["sent_rows"]) == (40, 120)
    assert small["after_queries"] == big["after_queries"]


def test_channels_union_multi_ids_skip_empty(tmp_path):
    svc = bench.build(str(tmp_path / "c.sqlite3"), 5, _env(False))
    try:
        now = datetime(2026, 11, 8, 10, 0).isoformat()
        cid = svc.db.one("SELECT id FROM customers")["id"]
        for mid, ch, d in [("a1", "sms", "out"), ("a2", "email", "out"), ("a2", "email", "out"),
                           ("b1", "", "out"), ("c1", "sms", "in"), ("d1", None, "out")]:
            svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,message_id,created_at) "
                     "VALUES(?,?,?,?,?,?)", (cid, d, ch, "x", mid, now))
        many = svc._sent_channels_many(["a1,a2", "b1", "c1", None, "", "d1,a1"])
        for mid in ["a1,a2", "b1", "c1", None, "", "d1,a1", "zz"]:
            got = sorted({c for m in (mid or "").split(",") if m for c in many.get(m, ())})
            assert got == svc._sent_channels(mid), mid
        assert many == {"a1": {"sms"}, "a2": {"email"}}
        assert svc._sent_channels_many([None, ""]) == {}
    finally:
        svc.db.conn.close()


def test_send_unknown_rows_keep_channels(tmp_path):
    """critic סבב 41/53: send_unknown נספרת כשיצאה ומוצגת עם ערוצים — גם באצווה (מוטציה: רק sent_dry_run)."""
    svc = bench.build(str(tmp_path / "u.sqlite3"), 30, _env(False), sent=True)
    try:
        rid = svc.db.one("SELECT id FROM reminders WHERE status='sent_dry_run' ORDER BY id")["id"]
        svc.db.x("UPDATE reminders SET status='send_unknown' WHERE id=?", (rid,))
        rows = svc.dashboard()["invoices"]
        unk = [x for x in rows if x["last_sent"] and x["last_sent"]["unknown"]]
        assert unk and all(x["last_sent"]["channels"] for x in unk)
        for x in rows:
            ref = _reference(svc, x["invoice_id"], x["customer_id"])
            assert {k: x[k] for k in ref} == ref, x["number"]
    finally:
        svc.db.conn.close()
