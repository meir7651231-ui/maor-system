"""הפעלה 111: `_to_agorot` (מקורות ה-API) ו-`csv_import._agorot` מחקו **כל** פסיק.
פסיק כנקודה עשרונית ("1200,50") הפך ל-120,050 ₪: חוב **מנופח פי 100** בתזכורת לחייב.
"12,5" נקרא כ-125 ₪, ו-"1,2,3" כ-123 ₪. ב-CSV גם "1.200,50" יובא כ-1.20 ₪ (חוב מוקטן פי 1000).
עכשיו יש מפענח אחד (`parse_amount_agorot`): פסיק מותר רק כמפריד אלפים תקין, וכל השאר ⇒ ValueError.
ב-API המסמך מדולג ומסומן malformed (critic 44, לא סוגרים חשבוניות), וב-CSV השורה נדחית עם הודעה."""
from __future__ import annotations

import pytest

from app import csv_import
from app.greeninvoice import _to_agorot
from app.integrations.base import parse_amount_agorot

AMBIGUOUS = ["1200,50", "12,5", "1,20", "1,2,3", "1,2345", ",500", "1.200,50", "1,200,5", "1,,200"]


@pytest.mark.parametrize("v", AMBIGUOUS)
def test_api_amount_comma_not_thousands_rejected(v):
    with pytest.raises(ValueError):
        _to_agorot(v)


@pytest.mark.parametrize("v", AMBIGUOUS)
def test_csv_amount_comma_not_thousands_rejected(v):
    with pytest.raises(ValueError):
        csv_import._agorot(v)


@pytest.mark.parametrize("v,exp", [("1,200", 120000), ("12,345.67", 1234567), ("1,234,567.5", 123456750),
                                   ("-1,200.50", -120050), ("\u200f1,200.50", 120050), ("1\u202f200", 120000),
                                   ("0.005", 1), ("₪ 99", 9900)])
def test_valid_formats_still_parse(v, exp):
    assert parse_amount_agorot(v) == exp
    assert _to_agorot(v) == exp


def test_bool_and_empty_csv_cell_rejected():
    with pytest.raises(ValueError):
        parse_amount_agorot(True)
    for v in ("", "   ", "\u200f"):
        with pytest.raises(ValueError):
            csv_import._agorot(v)


def test_csv_row_with_comma_decimal_is_error_not_inflated_debt():
    r = csv_import.parse("number,client,phone,amount\n1,A,0501234567,\"1200,50\"\n2,B,0501234568,\"1,200.50\"\n")
    assert [i.amount_agorot for i in r.invoices] == [120050]
    assert len(r.errors) == 1


def test_sync_doc_with_comma_decimal_skipped_not_inflated(svc, fake_gi):
    svc.sync()
    fake_gi.docs[1]["amount"] = "1200,50"
    fake_gi.docs[1].pop("amountDueVat", None)
    svc.sync()
    amounts = [r["amount_agorot"] for r in svc.db.q("SELECT amount_agorot FROM invoices")]
    assert 12005000 not in amounts                      # לא ₪120,050
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='doc_malformed'")
