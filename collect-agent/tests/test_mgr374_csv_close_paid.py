"""מנהל 374 (מבקר 217🟠): עסק CSV מעלה קובץ עדכני שבו חשבונית שולמה ⇒ קודם השורה דולגה, החשבונית נשארה פתוחה
(חוב בדשבורד) והבאנר «העלו קובץ CSV עדכני» לא ירד (טריות = MAX(synced_at) של חשבוניות פתוחות בלבד).
עכשיו: שורה «שולם»/«מבוטל»/יתרה 0 על מספר קיים ⇒ סגירה + ביטול תזכורות פעילות; כל ייבוא שזוהו בו שורות (או קובץ
נקי בלי שורות) מעדכן את חותמת הטריות. שומרים: מספר שלא קיים · חשבונית API באותו מספר · סתירה באותו קובץ ·
קובץ שכל שורותיו נדחו (לא טרי) · שער הנתונים האמיתיים (לא סוגר כלום)."""
from dataclasses import replace
from datetime import timedelta

import pytest

from app.morning import _csv_freshness
from app.service import RealDataBlocked

H = "מספר מסמך,שם לקוח,טלפון,סכום,סטטוס,תאריך,תאריך לתשלום\n"
OPEN = "7001,רוני,0541112222,500,פתוח,01/11/26,15/11/26\n"
PAID = "7001,רוני,0541112222,500,שולם,01/11/26,15/11/26\n"
OTHER = "7002,דנה,0541113333,300,פתוח,01/11/26,15/11/26\n"


@pytest.fixture
def csv_svc(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    assert svc.import_csv((H + OPEN).encode())["imported"] == 1
    clock.now += timedelta(days=2)
    return svc


def _status(svc, num="7001"):
    return svc.db.one("SELECT status FROM invoices WHERE number=?", (num,))["status"]


@pytest.mark.parametrize("status", ["שולם", "שולמה", "מבוטל", "Paid", "paid in full", "Void", "סגורה"])
def test_closed_status_closes_existing(csv_svc, status):
    r = csv_svc.import_csv((H + f"7001,רוני,0541112222,500,{status},01/11/26,15/11/26\n").encode())
    assert r["closed"] == 1 and r["errors"] == []
    assert _status(csv_svc) == "closed"


@pytest.mark.parametrize("amount", ["0", "0.00", "₪0"])
def test_zero_balance_closes_existing(csv_svc, amount):
    r = csv_svc.import_csv((H + f"7001,רוני,0541112222,{amount},פתוח,01/11/26,15/11/26\n").encode())
    assert r["closed"] == 1 and _status(csv_svc) == "closed"


def test_paid_row_cancels_active_reminder(csv_svc):
    iid = csv_svc.db.one("SELECT id FROM invoices WHERE number='7001'")["id"]
    csv_svc.db.x("INSERT INTO reminders(invoice_id,step,template_key,scheduled_for,status,requires_approval,"
                 "body,payload) VALUES(?,1,'t','2026-11-10','pending_approval',1,'b','[]')", (iid,))
    csv_svc.import_csv((H + PAID).encode())
    r = csv_svc.db.one("SELECT status, block_reason FROM reminders WHERE invoice_id=?", (iid,))
    assert (r["status"], r["block_reason"]) == ("cancelled", "invoice_closed")


def test_paid_only_file_refreshes_freshness_dashboard_and_morning(csv_svc):
    csv_svc.import_csv((H + PAID).encode())
    assert csv_svc._csv_freshness()["upload_needed"] is False
    f = _csv_freshness(csv_svc)
    assert f["csv_upload_needed"] is False
    assert f["csv_last_import"] == csv_svc.clock().date().isoformat()


def test_header_only_file_is_fresh(csv_svc):
    """ייצוא «חשבוניות פתוחות» כשאין אף חוב פתוח = קובץ עם כותרת בלבד — טרי."""
    csv_svc.import_csv(H.encode())
    assert csv_svc._csv_freshness()["upload_needed"] is False


def test_all_rows_rejected_is_not_fresh(csv_svc):
    r = csv_svc.import_csv((H + "7009,רוני,,500,פתוח,01/11/26,15/11/26\n").encode())
    assert r["errors"] and r["imported"] == 0
    assert csv_svc._csv_freshness()["upload_needed"] is True


def test_partial_import_still_does_not_close_absent(csv_svc):
    """ייבוא חלקי: חשבונית שפשוט לא בקובץ — לא נסגרת (רק סימון מפורש סוגר)."""
    r = csv_svc.import_csv((H + OTHER).encode())
    assert r["closed"] == 0 and _status(csv_svc) == "open"


def test_unknown_number_closes_nothing(csv_svc):
    r = csv_svc.import_csv((H + "9999,רוני,0541112222,500,שולם,01/11/26,15/11/26\n").encode())
    assert r["closed"] == 0 and _status(csv_svc) == "open"


def test_same_file_open_and_paid_is_not_closed(csv_svc):
    """אותו מספר בקובץ גם «שולם» וגם פתוח ⇒ סותר ⇒ לא סוגרים בשקט."""
    csv_svc.import_csv((H + PAID + OPEN).encode())
    assert _status(csv_svc) == "open"


def test_api_invoice_with_same_number_not_closed_by_csv(csv_svc):
    csv_svc.db.x("UPDATE invoices SET external_id='gi:abc', source='api' WHERE number='7001'")
    r = csv_svc.import_csv((H + PAID).encode())
    assert r["closed"] == 0 and _status(csv_svc) == "open"


def test_already_closed_counts_zero(csv_svc):
    csv_svc.import_csv((H + PAID).encode())
    assert csv_svc.import_csv((H + PAID).encode())["closed"] == 0


def test_real_data_gate_closes_nothing(csv_svc):
    csv_svc.s = replace(csv_svc.s, real_data_allowed=False)
    with pytest.raises(RealDataBlocked):
        csv_svc.import_csv((H + PAID + "7003,אמיתי,0521234567,100,פתוח,01/11/26,15/11/26\n").encode())
    assert _status(csv_svc) == "open"


def test_settings_endpoint_reports_closed(csv_svc):
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    api = TestClient(create_app(csv_svc, owner_token=OWNER_TOKEN), headers=AUTH)
    r = api.post("/settings/source/csv", content=(H + PAID).encode())
    assert r.status_code == 200, r.text
    assert r.json()["closed"] == 1 and r.json()["imported"] == 0
