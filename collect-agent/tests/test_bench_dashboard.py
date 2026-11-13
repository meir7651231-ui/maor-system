"""הפעלה 176 — `scripts/bench_dashboard.py` (מדידת `/dashboard` על קובץ אמיתי ועל SQLCipher).

הפעלה 175 הוכיחה זהות פלט מול המימוש הקודם רק על DB בזיכרון. כאן: (1) אותה זהות על קובץ על דיסק
ועל SQLCipher (מודול אחר — `sqlcipher3.Row` במקום `sqlite3.Row`), כולל תזכורות מאוחדות; (2) סקריפט
המדידה רץ ומחזיר מספרים סבירים בקנה מידה קטן (שלא יירקב); (3) מספר השאילתות קבוע גם על קובץ.
"""
from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path

import pytest

from tests.test_dashboard_batched import _reference

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import bench_dashboard as bench  # noqa: E402

HAVE_SQLCIPHER = importlib.util.find_spec("sqlcipher3") is not None
MODES = [False, pytest.param(True, marks=pytest.mark.skipif(
    not HAVE_SQLCIPHER, reason="sqlcipher3 לא מותקן (requirements-sqlcipher.lock)"))]


def _env(encrypted: bool) -> dict[str, str]:
    env = {k: v for k, v in os.environ.items() if k not in ("DB_ENCRYPTION", "COLLECT_MASTER_KEYS")}
    if encrypted:
        from app import secretbox
        env.update(DB_ENCRYPTION="sqlcipher", COLLECT_MASTER_KEYS=f"k1:{secretbox.generate_key()}")
    return env


@pytest.mark.parametrize("encrypted", MODES)
def test_file_db_same_output_as_reference(tmp_path, encrypted):
    svc = bench.build(str(tmp_path / "b.sqlite3"), 60, _env(encrypted))
    try:
        assert svc.db.encrypted is encrypted
        rows = svc.dashboard()["invoices"]
        assert len(rows) == 60
        # 60 חשבוניות על 24 לקוחות ⇒ תזכורות מאוחדות (כמה חשבוניות בתזכורת אחת)
        assert any(x["last_reminder"] and len(x["last_reminder"]["invoice_ids"]) > 1 for x in rows)
        for x in rows:
            ref = _reference(svc, x["invoice_id"], x["customer_id"])
            assert {k: x[k] for k in ref} == ref, x["number"]
    finally:
        svc.db.conn.close()


@pytest.mark.parametrize("encrypted", MODES)
def test_bench_runs_and_queries_constant(encrypted):
    small = bench.run(40, encrypted, repeat=1)
    big = bench.run(120, encrypted, repeat=1)
    assert small["encrypted"] is big["encrypted"] is encrypted
    assert (small["invoices"], big["invoices"]) == (40, 120)
    assert small["after_queries"] == big["after_queries"]          # לא גדל עם מספר החשבוניות
    for r in (small, big):
        assert r["file_mb"] > 0 and r["after_ms"] > 0 and r["before_per_invoice_ms"] > 0


def test_cli_json(capsys):
    assert bench.main(["--invoices", "20", "--repeat", "1", "--json"]) == 0
    import json
    out = json.loads(capsys.readouterr().out)
    assert out["invoices"] == 20 and out["encrypted"] is False
