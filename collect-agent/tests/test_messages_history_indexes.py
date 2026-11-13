"""הפעלה 178 — `/dashboard` ו-`/owner/inbox` על היסטוריית `messages` גדולה.

נמדד (`scripts/bench_dashboard.py --sent --history 200000`, 5,000 חשבוניות): `/dashboard` 307 ⇒ 165ms בקובץ
גלוי ו-618 ⇒ 190ms ב-SQLCipher; `/owner/inbox` 13.6 ⇒ 1.4ms / 74 ⇒ 0.9ms. הסיבה: שתי שאילתות
`SELECT DISTINCT customer_id FROM messages WHERE direction=?` וספירת `needs_owner=1` סרקו את כל הטבלה.
התיקון = אינדקסים בלבד (ה-SQL לא השתנה) ⇒ כאן: (1) תוכנית השאילתה משתמשת באינדקס; (2) **אינדקס שמתחיל
ב-direction נבחר גם לשאילתות לפי message_id** (ערוצי היוצאים קפצו 6 ⇒ 134ms) — נועל שהן נשארות על
ix_msg_mid; (3) זהות פלט של `/dashboard` עם ובלי האינדקסים, על קובץ ועל SQLCipher.
"""
from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path

import pytest

from app.db import DB

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import bench_dashboard as bench  # noqa: E402

NEW = ("ix_msg_cust_dir", "ix_msg_owner", "ix_msg_provider")
HAVE_SQLCIPHER = importlib.util.find_spec("sqlcipher3") is not None
MODES = [False, pytest.param(True, marks=pytest.mark.skipif(
    not HAVE_SQLCIPHER, reason="sqlcipher3 לא מותקן (requirements-sqlcipher.lock)"))]


def _plan(d: DB, sql: str) -> list[str]:
    return [r[3] for r in d.conn.execute("EXPLAIN QUERY PLAN " + sql, (1,) * sql.count("?"))]


@pytest.mark.parametrize(("sql", "index"), [
    ("SELECT DISTINCT customer_id FROM messages WHERE direction='out' AND customer_id IS NOT NULL",
     "COVERING INDEX ix_msg_cust_dir"),
    ("SELECT DISTINCT customer_id FROM messages WHERE direction='in' AND customer_id IS NOT NULL",
     "COVERING INDEX ix_msg_cust_dir"),
    ("SELECT COUNT(*) n FROM messages WHERE needs_owner=1", "ix_msg_owner"),
    ("SELECT * FROM messages WHERE needs_owner=1 ORDER BY id DESC", "ix_msg_owner"),
    ("SELECT * FROM messages WHERE direction='out' AND provider=? AND provider_id=?", "ix_msg_provider"),
    ("SELECT MAX(id) m FROM messages WHERE direction='out' AND channel=? AND customer_id=?", "ix_msg_cust_dir"),
])
def test_history_queries_use_index(sql, index):
    """«SCAN … USING INDEX» על אינדקס מלא = עדיין סריקה של כל הטבלה; נדרש האינדקס הייעודי. על ix_msg_owner
    (חלקי — רק needs_owner=1) גם SCAN עובר רק על השורות שדורשות טיפול."""
    plan = _plan(DB(":memory:"), sql)
    hit = [p for p in plan if p.startswith("SEARCH messages") or (p.startswith("SCAN messages") and
                                                                   index == "ix_msg_owner")]
    assert hit and all(index in p for p in hit), plan


@pytest.mark.parametrize("sql", [
    "SELECT DISTINCT message_id, channel FROM messages WHERE direction='out' "
    "AND message_id IN (SELECT value FROM json_each(?))",
    "SELECT DISTINCT channel FROM messages WHERE direction='out' AND message_id=?",
    "SELECT 1 FROM messages WHERE message_id=?",
])
def test_message_id_queries_stay_on_message_id_index(sql):
    """אינדקס (direction, customer_id) נבחר כאן במקום ix_msg_mid (אין ANALYZE) ⇒ 6 ⇒ 134ms על 200k."""
    plan = _plan(DB(":memory:"), sql)
    assert any("ix_msg_mid" in p for p in plan), plan


def _env(encrypted: bool) -> dict[str, str]:
    env = {k: v for k, v in os.environ.items() if k not in ("DB_ENCRYPTION", "COLLECT_MASTER_KEYS")}
    if encrypted:
        from app import secretbox
        env.update(DB_ENCRYPTION="sqlcipher", COLLECT_MASTER_KEYS=f"k1:{secretbox.generate_key()}")
    return env


@pytest.mark.parametrize("encrypted", MODES)
def test_dashboard_same_output_with_and_without_indexes(tmp_path, encrypted):
    svc = bench.build(str(tmp_path / "h.sqlite3"), 60, _env(encrypted), sent=True, history=3000)
    try:
        assert svc.db.encrypted is encrypted
        names = {r["name"] for r in svc.db.q("SELECT name FROM sqlite_master WHERE type='index'")}
        assert set(NEW) <= names
        with_idx = (svc.dashboard(), svc.dashboard(view="list"),
                    [dict(r) for r in svc.db.q("SELECT * FROM messages WHERE needs_owner=1 ORDER BY id DESC")])
        assert with_idx[0]["totals"]["owner_inbox"] == len(with_idx[2]) > 0
        assert with_idx[0]["totals"]["customers_messaged"] > 0
        for n in NEW:
            svc.db.conn.execute(f"DROP INDEX {n}")   # noqa: S608 — שמות קבועים מהבדיקה
        svc.db.conn.execute("DROP INDEX ix_msg_mid")    # גם שאילתות message_id בסריקה מלאה = מקור אמת
        without = (svc.dashboard(), svc.dashboard(view="list"),
                   [dict(r) for r in svc.db.q("SELECT * FROM messages WHERE needs_owner=1 ORDER BY id DESC")])
        assert with_idx == without
    finally:
        svc.db.conn.close()


def test_existing_db_gets_indexes_on_open(tmp_path):
    """DB קיים מלפני 178 (בלי האינדקסים) ⇒ נוצרים בפתיחה (IF NOT EXISTS), בלי לגעת בנתונים."""
    path = str(tmp_path / "old.sqlite3")
    d = DB(path)
    d.conn.execute("INSERT INTO messages(customer_id, direction, channel, body, needs_owner, created_at) "
                   "VALUES(1,'in','sms','x',1,'2026-11-01')")
    for n in NEW:
        d.conn.execute(f"DROP INDEX {n}")   # noqa: S608
    d.conn.commit()
    d.conn.close()
    d2 = DB(path)
    names = {r["name"] for r in d2.q("SELECT name FROM sqlite_master WHERE type='index'")}
    assert set(NEW) <= names
    assert d2.one("SELECT COUNT(*) n FROM messages WHERE needs_owner=1")["n"] == 1
    d2.conn.close()


def test_bench_history_runs_small():
    r = bench.run(40, False, 1, sent=True, history=500)
    assert r["messages"] >= 500 and r["after_queries"] < 30 and r["owner_inbox_ms"] >= 0
