"""מבקר סבב 267 (🟡, גבי מנוע): ייבוא CSV סורק את כל טבלת החשבוניות פעם לכל שורה.

`_merge_csv_twin` (CSV) מריץ `SELECT 1 FROM invoices WHERE number=? AND doc_type=? AND source!='csv'` לכל
שורה, ואין אינדקס על `invoices(number)` ⇒ SCAN מלא לכל שורה = O(שורות × חשבוניות קיימות). נמדד: ייבוא
של 5,000 שורות לוקח 0.9 שנ׳ על מסד ריק ו-10.3 שנ׳ כשכבר יש 45,000 חשבוניות (גדל ליניארית בכל ייבוא),
וכל הזמן הזה `db.batch()` מחזיק את ה-lock — וובהוקים, דשבורד ותשובות לקוחות ממתינים. קובץ יחיד
של 50,000 שורות (בלי התקרה) = 71 שנ׳. מצופה: חיפוש התאום משתמש באינדקס.
רכיב: app/service.py → _merge_csv_twin; app/db.py → schema (אינדקסים).
"""
from __future__ import annotations

import pytest

SQL = "SELECT 1 FROM invoices WHERE number=? AND doc_type=? AND source!='csv'"


def _plan(svc) -> str:
    return " | ".join(str(tuple(r)) for r in svc.db.q("EXPLAIN QUERY PLAN " + SQL, ("1", 305)))


def test_customer_lookup_uses_index_control(svc):
    plan = " ".join(str(tuple(r)) for r in svc.db.q(
        "EXPLAIN QUERY PLAN SELECT 1 FROM invoices WHERE customer_id=? AND status='open'", (1,)))
    assert "USING" in plan and "INDEX" in plan


@pytest.mark.xfail(strict=True, reason="מבקר 267🟡: חיפוש התאום ב-CSV = SCAN מלא של invoices לכל שורה")
def test_csv_twin_lookup_uses_index(svc):
    plan = _plan(svc)
    assert "INDEX" in plan, plan
