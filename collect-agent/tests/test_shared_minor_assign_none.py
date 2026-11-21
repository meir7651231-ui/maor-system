"""גבייה סוכן · fuzz ב׳ (21.11, זרע 89) — ממצא ל«גבי מנוע» (team/findings-gvia-sochen.md):
«אני בן 15» מטלפון המשותף לשני לקוחות ⇒ כרטיס דחוף ושניהם מושהים (נושא 5) ✓. בעל העסק בוחר «אף אחד מהם» ⇒ ההשהיה
משתחררת לשניהם ⇒ בתכנון הבא נבנית תזכורת **לאותו טלפון** שקטין ענה ממנו — ובאישור שלה אין שום סימן לכך.
כשבוחרים לקוח, השהיית הקטין שלו חוסמת את הכתובת (לכן אין שליחה); ב«אף אחד» לא נשאר כלום.
xfail(strict=True) עד הכרעה (הצעות בקובץ הממצאים); הבקרה — בחירת לקוח חוסמת — ירוקה."""
from datetime import timedelta

import pytest

from tests.conftest import customer_sent
from tests.test_legal_requirements import _shared_phone_csv

PHONE = "050-0001111"


def _cycle(svc, clock):
    for _ in range(3):
        clock.now += timedelta(days=3)
        for rid in svc.plan():
            try:
                svc.approve(rid, confirm_open=True)
            except (ValueError, PermissionError):
                pass
        svc.dispatch()
    return [m for m in customer_sent(svc) if m["to"] == "972500001111"]


@pytest.mark.xfail(strict=True, reason="ממצא ל-גבי מנוע: «אף אחד מהם» על כרטיס קטין משחרר את הטלפון לתזכורות")
def test_minor_on_shared_phone_assigned_to_nobody_no_reminder_to_that_phone(svc, clock):
    _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, "אני בן 15")
    svc.inbox.assign_shared_card(r["card_id"], None)
    assert _cycle(svc, clock) == []


@pytest.mark.parametrize("who", ["רונית לוי", "משה כהן"])
def test_control_assigning_a_customer_blocks_the_phone(svc, clock, who):
    ids = _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, "אני בן 15")
    svc.inbox.assign_shared_card(r["card_id"], ids[who])
    assert _cycle(svc, clock) == []
