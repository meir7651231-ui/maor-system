"""הדגמה אופליין מלאה: sandbox מדומה ⇒ תור ⇒ אישור ⇒ dry-run ⇒ תשובת לקוח.

הרצה: python3 -I scripts/demo_dry_run.py   (מתוך collect-agent/; אין שום קריאת רשת)
"""
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import load_settings  # noqa: E402
from app.db import DB  # noqa: E402
from app.greeninvoice import GreenInvoiceClient  # noqa: E402
from app.main import create_app  # noqa: E402
from app.policy import TZ  # noqa: E402
from app.service import CollectService  # noqa: E402
from tests.conftest import SANDBOX, Clock, FakeGreenInvoice, gi_doc  # noqa: E402

fake = FakeGreenInvoice([gi_doc(1), gi_doc(2, phone="052-7654321", name="יוסי לוי",
                                           amount="3450.50")])
gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret",
                        transport=httpx.MockTransport(fake.handler))
clock = Clock(datetime(2026, 11, 8, 10, tzinfo=TZ))
svc = CollectService(load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                                    "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/demo"}),
                     DB(":memory:"), gi=gi, clock=clock)
api = TestClient(create_app(svc))


def show(title, obj):
    print(f"\n=== {title} ===")
    print(json.dumps(obj, ensure_ascii=False, indent=2) if not isinstance(obj, str) else obj)


show("health", api.get("/health").json())
show("sync (sandbox מדומה)", api.post("/sync").json())
ids = api.post("/plan").json()["created"]
for r in api.get("/reminders").json():
    for m in api.get(f"/reminders/{r['id']}/preview").json()["messages"]:
        extra = m.get("length") or {"subject": m.get("subject")}
        show(f"תזכורת #{r['id']} · {r['status']} · {m['channel']} → {m['to']}",
             m["body"] + "\n" + json.dumps(extra, ensure_ascii=False))
show("dispatch לפני אישור", api.post("/dispatch").json())
api.post(f"/reminders/{ids[0]}/approve")
api.post(f"/reminders/{ids[1]}/approve")
show("dispatch אחרי אישור (dry-run)", api.post("/dispatch").json())
show("לקוח: 'אפשר פריסה ל-3 תשלומים?'",
     api.post("/inbound", json={"sender": "052-7654321", "text": "אפשר פריסה ל-3 תשלומים?"}).json())
plan = api.get("/plans").json()[0]
show("הצעת פריסה (ממתינה לבעל העסק)", plan["installments"])
show("בעל העסק מאשר פריסה", api.post(f"/plans/{plan['id']}/approve").json()["text"])
show("לקוח: 'הסר'", api.post("/inbound", json={"sender": "050-1234567", "text": "הסר"}).json())
clock.now += timedelta(days=10)
show("תכנון אחרי 10 ימים (הוסר + בהסדר ⇒ ריק)", api.post("/plan").json())
show("outbox — מה *היה* נשלח", [f"{m['channel']} · {m['provider']} · {m['to']}"
                                for m in api.get("/outbox").json()["messages"]])
