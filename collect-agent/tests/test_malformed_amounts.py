"""critic סבב 44: מסמך **אחד** עם סכום לא תקין ("NaN", "abc") הפיל את **כל** הסנכרון (ValueError/
InvalidOperation מתוך map_document) ⇒ אף חשבונית לא התעדכנה, סבב אחרי סבב. "1e9" (מיליארד ₪) עבר לתזכורת.
ופורמטים נפוצים ("1,200.50", "₪1,200") קרסו. עכשיו: פורמטים נפוצים נקראים; לא תקין/אבסורדי ⇒ המסמך
מסומן malformed: לא נשמר, **לא נסגר כ«שולם»**, ובעל העסק מקבל התראה."""
from __future__ import annotations

import pytest

from app.greeninvoice import _to_agorot


@pytest.mark.parametrize("v,exp", [("1,200.50", 120050), ("₪1,200", 120000), ("1 200", 120000),
                                   ("1200", 120000), (1200.5, 120050), ("", 0), (None, 0)])
def test_common_amount_formats(v, exp):
    assert _to_agorot(v) == exp


@pytest.mark.parametrize("v", ["NaN", "inf", "abc", "1e9", "1.200,50"])
def test_bad_amounts_raise_value_error(v):
    with pytest.raises(ValueError):
        _to_agorot(v)


def test_one_bad_document_does_not_break_sync_or_close_invoice(svc, fake_gi):
    svc.sync()
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"] == 2
    fake_gi.docs[1]["amount"] = "NaN"
    r = svc.sync()                                     # לא קורס
    assert r["open"] == 1
    st = {x["number"]: x["status"] for x in svc.db.q("SELECT number, status FROM invoices")}
    assert st["1002"] == "open"                        # לא נסגר כאילו שולם
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='doc_malformed' AND needs_owner=1")
