"""מנהל 373 · מבקר 216🟡: מספר מסמך שמתחיל במילת סיכום («SUM-1001», «סיכום-1001») נקלט — אבל שורות סיכום
אמיתיות בעמודת המספר נשארות «שורת סיכום» (חוב מזויף = הסיכון הגדול יותר). מוטציה: בלי `_SUMMARY_DOCNUM` ⇒
הנקלטים נדחים; עם החרגה רחבה מדי ⇒ הסיכומים נקלטים."""
from datetime import date

import pytest

from app.csv_import import SUMMARY_MSG, parse

H = "מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"


def _parse(num):
    return parse((H + f'"{num}",דנה,0501234567,1200,01/11/26,15/11/26\n').encode(), today=date(2026, 11, 8))


@pytest.mark.parametrize("num", ["SUM-1001", "sum_2024001", "TOTAL/555", "Totals-0042", "total1001A",
                                 "סיכום1001", "סהכ_7788", "סהך-1001", "SUM-1001-B", "Total2024.11"])
def test_summary_word_glued_to_doc_number_imported(num):
    r = _parse(num)
    assert [i.number for i in r.invoices] == [num]


@pytest.mark.parametrize("num", ['סה"כ', 'סה"כ-1200', "סה״כ 1200", "Total 1200", "Total: 1001", "*** TOTAL-1001",
                                 "Total-12", "SUM 1001", "סיכום 1001", "Sub-total", "Grand Total 5000",
                                 "סך הכל", "TOTAL", "Total (ILS)", "סכום כולל", "Total--1001", "Total -1001"])
def test_real_summary_rows_still_rejected(num):
    r = _parse(num)
    assert r.invoices == []
    assert any(SUMMARY_MSG in str(e) for e in r.errors), r.errors
