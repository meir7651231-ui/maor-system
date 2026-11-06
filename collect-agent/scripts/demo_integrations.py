"""הדגמת dry-run של שכבת האינטגרציות: מה *היה* נשלח לכל ספק. אין רשת, אין סודות בפלט.

    python3 -I scripts/demo_integrations.py
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.integrations.notifier import Notification  # noqa: E402
from app.integrations.payments import PaymentRequest  # noqa: E402
from app.integrations.registry import build_notifier, build_payment_links  # noqa: E402
from app.integrations.sms import sms_segments  # noqa: E402

ENV = {"SMS_PROVIDER": "inforu,019,twilio", "SMS_SENDER": "Studio",
       "INFORU_USERNAME": "demo", "INFORU_TOKEN": "fake-token-1",
       "SMS019_USERNAME": "demo", "SMS019_TOKEN": "fake-token-2",
       "TWILIO_ACCOUNT_SID": "AC_demo", "TWILIO_AUTH_TOKEN": "fake-token-3",
       "TWILIO_FROM": "Studio", "EMAIL_PROVIDER": "resend", "RESEND_API_KEY": "re_fake",
       "MAIL_FROM": "owner@studio.example", "PAYMENT_LINK_MODE": "template",
       "PAYMENT_LINK_TEMPLATE": "https://pay.example/p?sum={amount}&inv={invoice}"}

link = build_payment_links(ENV).link_for(PaymentRequest("doc1", "1001", 120000))
text = f"שלום דנה, תזכורת מסטודיו מאיר: חשבונית 1001 על סך 1,200 ₪ פתוחה. לתשלום: {link.url}"
print("קידוד/חלקים:", sms_segments(text))
n = build_notifier(ENV)
print("dry_run:", n.dry_run)
for ad in n.sms:   # תצוגה לכל ספק — לא שליחה אמיתית
    from app.integrations.base import SmsMessage
    r = ad.send(SmsMessage("050-1234567", text, "demo:1"))
    print(f"\n== {ad.provider} ==")
    print(json.dumps(r.preview, ensure_ascii=False, indent=1))
rep = n.send(Notification(key="demo:2", email="dana@example.com", email_subject="תזכורת",
                          email_text=text))
print("\n== email ==")
print(json.dumps(rep.as_dict(), ensure_ascii=False, indent=1))
blob = json.dumps([a.outbox for a in n.sms] + [n.email.outbox], ensure_ascii=False)
assert not any(s in blob for s in ("fake-token-1", "fake-token-2", "fake-token-3", "re_fake"))
print("\n✓ אין סודות בפלט")
