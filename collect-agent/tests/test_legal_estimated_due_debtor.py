"""גבי משפט · הגנת הצרכן §2 (הטעיה): מועד **מוערך** (אין dueDate במסמך ⇒ הנפקה+30, d018a41) הוא כלי פנימי
של בעל העסק. לחייב הוא הוצג בעמוד /p כ«מועד DD.MM» ובעמוד /pay כ«לתשלום עד …» — כאילו זה מועד התשלום בחשבונית.
עכשיו: לחייב לא מוצג מועד מוערך בכלל; מועד מהמסמך או מועד שבעל העסק תיקן/קבע — מוצג כרגיל. בעל העסק ממשיך
לראות את המוערך (מסומן) בדשבורד וברשימת הפתוחות.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import OWNER_TOKEN


def _estimated_setup(svc, fake_gi):
    fake_gi.docs[0]["dueDate"] = None          # דנה: אין מועד במסמך ⇒ מוערך
    svc.sync()
    inv = svc.db.one("SELECT * FROM invoices WHERE external_id='doc1'")
    assert inv["due_estimated"] == 1 and inv["due"]            # ההנחה של הבדיקה: באמת מוערך
    other = svc.db.one("SELECT * FROM invoices WHERE external_id='doc2'")
    assert other["due_estimated"] == 0 and other["due"]
    return svc._short_code(inv), svc._short_code(other), inv


def test_estimated_due_not_shown_to_debtor(svc, fake_gi):
    code, _, inv = _estimated_setup(svc, fake_gi)
    assert svc.landing(code)["due"] is None
    assert svc.payer_view(code)["due"] is None
    page = TestClient(create_app(svc, owner_token=OWNER_TOKEN)).get(f"/p/{code}").text
    dd = inv["due"][8:10] + "." + inv["due"][5:7]
    assert "מועד" not in page and dd not in page, page[:400]


def test_real_due_still_shown_to_debtor(svc, fake_gi):
    _, code2, _ = _estimated_setup(svc, fake_gi)
    assert svc.landing(code2)["due"] == "2026-10-01"
    assert "מועד" in TestClient(create_app(svc, owner_token=OWNER_TOKEN)).get(f"/p/{code2}").text


def test_owner_corrected_due_is_shown_again(svc, fake_gi):
    code, _, inv = _estimated_setup(svc, fake_gi)
    svc.confirm_open_list([inv["id"]], [], due={inv["id"]: "2026-12-15"})
    assert svc.landing(code)["due"] == "2026-12-15"
    svc.sync()                                                  # התיקון שורד סנכרון
    assert svc.landing(code)["due"] == "2026-12-15"


def test_owner_still_sees_estimated_flag(svc, fake_gi):
    code, _, inv = _estimated_setup(svc, fake_gi)
    row = next(r for r in svc.dashboard()["invoices"] if r["invoice_id"] == inv["id"])
    assert row["due"] and row["due_estimated"] is True


def test_combined_reminder_lists_no_estimated_due(svc, fake_gi):
    """תזכורת מאוחדת (כמה חשבוניות לאותו לקוח): ברשימה שבעמוד — גם שם בלי מועד מוערך."""
    from tests.conftest import gi_doc
    second = gi_doc(5, client_id="cl1", amount="300.00", due=None)   # דנה, חשבונית שנייה בלי מועד
    fake_gi.docs.append(second)
    svc.sync()
    est = svc.db.one("SELECT * FROM invoices WHERE external_id='doc5'")
    real = svc.db.one("SELECT * FROM invoices WHERE external_id='doc1'")
    assert est["due_estimated"] == 1 and real["due_estimated"] == 0
    rid = svc.db.x("INSERT INTO reminders(invoice_id,step,template_key,scheduled_for,status,requires_approval,"
                   "body,payload) VALUES(?,0,'friendly','2026-11-08T10:00:00','pending_approval',1,'','[]')",
                   (real["id"],))
    for iid in (real["id"], est["id"]):
        svc.db.x("INSERT OR IGNORE INTO reminder_invoices(reminder_id,invoice_id) VALUES(?,?)", (rid, iid))
    items = {i["number"]: i["due"] for i in svc.landing(svc._short_code(real))["invoices"]}
    assert items == {"1001": "2026-10-01", "1005": None}, items
