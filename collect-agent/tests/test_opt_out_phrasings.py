"""critic סבב 62: «הסר בבקשה» — הסדר הנפוץ בעברית — זוהה כ-unknown (רק «בבקשה הסר» זוהה), וגם «די להודעות».
לקוח שכתב כך **לא הוסר**, והתזכורות המשיכו (חוק הספאם §30א: הודעת סירוב בכל דרך סבירה; כלל הבעלים:
הסרה בכל הודעה). מבחן: רשימת ניסוחים אמיתיים + זרימה מלאה (התזכורת המאושרת לא יוצאת אחרי «הסר בבקשה»)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.conversation import Intent, detect
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

OPT_OUT = ["הסר", "הסרה", "הסר בבקשה", "הסר בבקשה!", "הסירו בבקשה", "הסר תודה", "תסירו בבקשה",
           "בבקשה הסר", "נא להסיר", "להסיר בבקשה", "הסר אותי בבקשה", "די להודעות", "די עם ההודעות",
           "מספיק עם ההודעות", "די לשלוח", "stop", "STOP", "הסר מיד"]
NOT_OPT_OUT = ["לא מעוניין בפריסה", "שילמתי כבר", "איך אפשר לשלם?", "תודה"]


@pytest.mark.parametrize("text", OPT_OUT)
def test_detected_as_opt_out(text):
    assert Intent.OPT_OUT in detect(text), (text, [i.value for i in detect(text)])


@pytest.mark.parametrize("text", NOT_OPT_OUT)
def test_not_overmatched(text):
    assert Intent.OPT_OUT not in detect(text), text


def test_flow_hasar_bevakasha_stops_approved_reminder(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    api.post(f"/reminders/{rid}/approve")
    api.post("/inbound", json={"sender": "050-1234567", "text": "הסר בבקשה"})
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    api.post("/dispatch")
    assert not [m for m in svc.sender.sent if m["to"] in ("972501234567", "c1@example.com")
                and "טרם סומנה כשולמה" in m["body"]]
