"""הפעלת מנהל 107 · באג חשיפת חוב לצד ג׳: לקוח GI עם `"id": null` מופה ל-"None" (str(None)).
שני לקוחות שונים בלי מזהה ⇒ אותו מפתח "None" ⇒ התמזגו, והתזכורת המאוחדת (שתי החשבוניות) יצאה
למייל של אחד מהם. נכשלה לפני התיקון ב-`greeninvoice._s`, עוברת אחריו."""
from __future__ import annotations

from app.greeninvoice import map_document
from tests.conftest import gi_doc


def _anon(i: int, email: str) -> dict:
    d = gi_doc(i, phone="")
    d["client"].update(id=None, emails=[email], name=f"לקוח {i}")
    return d


def test_null_client_id_maps_to_empty_not_none():
    d = _anon(1, "a@x.com")
    d["client"]["name"] = None
    d["linkedDocumentIds"] = [None]
    inv = map_document(d)
    assert inv.client_external_id == "" and inv.client_name == "" and inv.linked_ids == ()


def test_clients_without_id_are_not_merged(svc, fake_gi):
    fake_gi.docs[:] = [_anon(1, "a@x.com"), _anon(2, "b@y.com")]
    svc.sync()
    keys = sorted(r["external_id"] for r in svc.db.q("SELECT external_id FROM customers"))
    assert keys == ["email:a@x.com", "email:b@y.com"]
    for rid in svc.plan():
        svc.approve(rid)
    svc.dispatch()
    by_to: dict[str, str] = {}
    for m in svc.sender.sent:
        by_to[m["to"]] = by_to.get(m["to"], "") + m["body"]
    assert "1001" in by_to["a@x.com"] and "1002" not in by_to["a@x.com"]
    assert "1002" in by_to["b@y.com"] and "1001" not in by_to["b@y.com"]


def test_documents_without_id_are_skipped_not_merged(svc):
    """critic סבב 43 (המשך להפעלה 107): אחרי `_s`, מסמך GI עם `"id": null` ⇒ external_id="" — ושני מסמכים
    כאלה **התמזגו לחשבונית אחת** (ON CONFLICT על ""), כך שאחד נבלע או נדרס. גם EZcount: doc_uuid חסר ⇒
    "ez:" / "ez:None". בלי מזהה אין רענון ואימות מול המקור (ר-4) ⇒ מדלגים + התראה אחת לבעל העסק."""
    a = gi_doc(1, client_id="A")
    a["id"] = None
    b = gi_doc(2, client_id="B", phone="052-1111111")
    b["id"] = None
    c = gi_doc(3, client_id="C", phone="053-1111111")
    from app.integrations.ezcount import map_ezcount_doc as ez_map
    ez = ez_map({"doc_uuid": None, "doc_number": "77", "balance": "100", "customer_name": "x",
                 "customer_phone": "054-1111111"})
    r = svc.ingest([map_document(a), map_document(b), map_document(c), ez])
    assert r["open"] == 1
    assert [x["number"] for x in svc.db.q("SELECT number FROM invoices")] == ["1003"]
    notes = svc.db.q("SELECT body FROM messages WHERE intent='doc_without_id' AND needs_owner=1")
    assert len(notes) == 1 and "3" in notes[0]["body"]
