"""מנהל 440 (מבקר 267🟡×2, גבי מנוע): תקרת שורות ב-CSV + אינדקס לחיפוש התאום.

(א) תקרת MAX_ROWS סופרת רק שורות עם תוכן — שורות ריקות / «,,,,,,,» (שאריות Excel) לא דוחות קובץ תקין;
    5,001 שורות אמיתיות עדיין נדחות, גם כשביניהן שורות ריקות.
(ב) `ix_inv_number ON invoices(number, doc_type)` — חיפוש התאום של `_merge_csv_twin` לא סורק את כל הטבלה,
    גם במסד קיים שנפתח מחדש (IF NOT EXISTS).
"""
from __future__ import annotations

import pytest

from app import csv_import

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _rows(n, start=9000):
    return "".join(f"{start + i},לקוח {i},050-{1000000 + i:07d},,1200,פתוח,01/10/26,15/10/26\n" for i in range(n))


def test_exactly_cap_real_rows_with_ghosts_accepted():
    raw = (H + _rows(csv_import.MAX_ROWS) + ",,,,,,,\n" * 50).encode()
    assert len(csv_import.parse(raw).invoices) == csv_import.MAX_ROWS


def test_over_cap_real_rows_interleaved_with_ghosts_rejected():
    body = _rows(csv_import.MAX_ROWS + 1).replace("\n", "\n,,,,,,,\n", 10)
    with pytest.raises(ValueError, match="יותר מדי שורות"):
        csv_import.parse((H + body).encode())


def test_twin_lookup_index_exists_and_used(svc):
    names = {r[0] for r in svc.db.q("SELECT name FROM sqlite_master WHERE type='index'")}
    assert "ix_inv_number" in names
    plan = " ".join(str(tuple(r)) for r in svc.db.q(
        "EXPLAIN QUERY PLAN SELECT 1 FROM invoices WHERE number=? AND doc_type=? AND source!='csv'", ("1", 305)))
    assert "ix_inv_number" in plan, plan
