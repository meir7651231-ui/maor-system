"""הפעלת מנהל 108 · המשך לבדיקת 107 (str(None) ⇒ "None"): ברווחית המזהה בנוי מ-f-string על
customer_id/document_type/document_number. ערך null ⇒ "rivhit:None:1:None" — `_missing_doc_id` לא
מזהה אותו (הזנב "None:1:None"), ושני מסמכים בלי מספר של אותו לקוח התמזגו לחשבונית אחת.
נכשלה לפני התיקון ב-`rivhit_external_id`, עוברת אחריו."""
from __future__ import annotations

from app.integrations.rivhit import map_rivhit_open_doc, rivhit_external_id
from app.integrations.sms import Sms019
from app.service import _missing_doc_id


def _row(num, cid=7):
    return {"customer_id": cid, "document_type": 1, "document_number": num, "balance": 100,
            "issue_date": "01/10/2026", "due_date": "15/10/2026"}


def test_rivhit_null_document_number_is_detected_as_missing():
    inv = map_rivhit_open_doc(_row(None), {"email": "a@x.com"})
    assert "None" not in inv.external_id
    assert _missing_doc_id(inv.external_id)


def test_rivhit_empty_document_number_is_missing():
    assert _missing_doc_id(rivhit_external_id(7, 1, ""))


def test_rivhit_null_customer_does_not_render_none():
    ext = rivhit_external_id(None, 1, 55)
    assert "None" not in ext and not _missing_doc_id(ext)


def test_rivhit_normal_id_unchanged():
    assert rivhit_external_id(7, 1, 55) == "rivhit:7:1:55"


def test_019_null_message_not_rendered_as_none():
    import httpx
    import pytest

    from app.integrations.base import ProviderError
    c = object.__new__(Sms019)
    with pytest.raises(ProviderError) as e:
        c.parse(httpx.Response(200, text='{"status": 3, "message": null}'))
    assert "None" not in str(e.value) and "status=3" in str(e.value)
