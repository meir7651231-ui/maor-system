"""דוחות מסירה / bounce / תלונות — על דוגמאות מתיעוד הספקים, למנגנון אחד.

מקורות (נקראו 20.11.2026; ציטוטים מילה במילה, קיצורים מסומנים):
  019   https://docs.019sms.co.il/sms/push-api.html · https://docs.019sms.co.il/sms/errors-and-status.html
        «we will push DLR on arrival using HTTP POST request» · «application/x-www-form-urlencoded» ·
        שדות: external_id, status, he_message, en_message, date, phone, operaor (כך במקור), shipment_id.
        אין שדה type — ה-URL מוגדר לכל סוג push בנפרד (push_url type=dlr).
  InforU  https://www.inforu.co.il/ (עמוד «ממשקי API»): DLR נשלח ב-POST לכתובת שבשדה
        Settings.DeliveryNotificationUrl של בקשת השליחה. תבנית גוף ה-DLR וטבלת הקודים — לא נמצאו
        (apidoc.inforu.co.il = מעטפת JS) ⇒ נשאר מפענח סובלני ולא מאומת.
  RFC 3464 נספח E (Simple / Multi-Recipient / gateway / Delayed DSN) · RFC 5965 נספח B (B.1, B.2)
  Microsoft  https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/non-delivery-reports-in-exchange-online/non-delivery-reports-in-exchange-online
        («How to interpret an Exchange NDR» — הדוגמה המלאה)
  Gmail  https://support.google.com/mail/answer/7720 — שולח «Mail Delivery Subsystem (mailer-daemon@googlemail.com)»,
        נושא «Delivery Status Notification (Failure)». **גוף ה-bounce של Gmail לא מופיע בעמוד** ⇒ הגוף כאן סינתטי.

באגים שנמצאו מול התיעוד:
  1. DLR אמיתי של 019 (בלי type) נבלע: נחשב incoming_sms בלי טקסט ⇒ ignored. וגם הקוד המספרי (102 וכו') ⇒ unknown.
  2. InforU לא היה שולח DLR בכלל: לא העברנו DeliveryNotificationUrl בבקשת השליחה.
  3. NDR של Exchange (טקסט קריא בלבד, בלי Status:/Final-Recipient:) לא זוהה כ-bounce ⇒ «שולח לא מוכר».
  4. 5.7.x (מדיניות/אבטחה) חסם את הכתובת כאילו היא לא קיימת — רק 5.1.x/5.2.1/«user unknown» = כתובת מתה.
"""
from __future__ import annotations

from urllib.parse import quote, urlencode

import pytest
from fastapi.testclient import TestClient

from app.channels import parse_bounce, parse_complaint
from app.integrations.sms import DLR_019_CODES, InforUSms, parse_019_dlr
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

FORM = {"content-type": "application/x-www-form-urlencoded"}


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _sent(api, svc, channel):
    api.post("/sync")
    for rid in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    row = svc.db.one("SELECT m.*, c.email cemail, c.phone cphone FROM messages m JOIN customers c ON "
                     "c.id=m.customer_id WHERE m.direction='out' AND m.channel=? ORDER BY m.id LIMIT 1",
                     (channel,))
    assert row is not None
    return row


def _alerts(svc, cid, intent):
    return svc.db.q("SELECT * FROM messages WHERE needs_owner=1 AND intent=? AND customer_id=?",
                    (intent, cid))


# ═══════════════════════════ 019 — הפורמט המתועד ═══════════════════════════
def _doc_019_body(shipment_id: str, status: str = "102", en: str = "Delivered", he: str = "הגיע ליעד") -> str:
    """הדוגמה מהתיעוד (GET-equivalent), כ-form-urlencoded כפי ש-019 שולחים ב-POST."""
    return urlencode({"external_id": "1234", "status": status, "he_message": he, "en_message": en,
                      "date": "01/04/14 16:05:05", "phone": "9725xxxxxxxx", "operaor": "Telzar",
                      "shipment_id": shipment_id}, quote_via=quote)


def test_019_documented_dlr_without_type_is_processed(api, svc):
    m = _sent(api, svc, "sms")
    r = api.post("/webhooks/sms/019?k=whk-test", content=_doc_019_body(m["provider_id"]), headers=FORM)
    assert r.json().get("matched") and r.json()["status"] == "delivered", r.json()
    assert svc.db.one("SELECT delivery_status FROM messages WHERE id=?", (m["id"],))[0] == "delivered"


# טבלת «DLR statuses» מהתיעוד ⇒ (מצב, קטגוריה). קטגוריה: recipient = לבדוק את המספר · account = בעיה
# אצלנו/בחשבון הספק (לא «מספר שגוי») · blocked = הנמען חסם · transient/None = בלי התראה
DOC_019 = {
    "-1": ("unknown", None), "0": ("delivered", None), "1": ("failed", "recipient"), "2": ("unknown", None),
    "3": ("failed", "recipient"), "4": ("failed", "recipient"), "5": ("failed", "recipient"),
    "6": ("failed", "recipient"), "7": ("failed", "account"), "14": ("failed", "recipient"),
    "15": ("failed", "recipient"), "16": ("failed", "account"), "17": ("failed", "blocked"),
    "18": ("failed", "account"), "101": ("failed", "recipient"), "102": ("delivered", None),
    "103": ("failed", "recipient"), "104": ("failed", "recipient"), "105": ("failed", "recipient"),
    "108": ("failed", "recipient"), "120": ("failed", "recipient"), "132": ("failed", "recipient"),
    "201": ("failed", "blocked"), "747": ("failed", "transient"), "998": ("failed", "account"),
    "999": ("failed", "account"),
}


@pytest.mark.parametrize("code", sorted(DOC_019, key=int))
def test_019_documented_status_table(code):
    pid, st = parse_019_dlr({"shipment_id": "s1", "status": code})
    assert (pid, st) == ("s1", DOC_019[code][0]), code
    assert DLR_019_CODES.get(code, (None, None))[1] == DOC_019[code][1], code


@pytest.mark.parametrize("code,intent,alert", [
    ("103", "sms_undelivered", True),        # פג תוקף ⇒ לבדוק מספר
    ("7", "sms_account_issue", True),        # אין יתרה ⇒ לא «מספר שגוי»
    ("747", "sms_undelivered", False),       # מחוץ לכיסוי — זמני, בלי התראה
    ("102", "sms_undelivered", False),
])
def test_019_codes_through_webhook(api, svc, code, intent, alert):
    m = _sent(api, svc, "sms")
    api.post("/webhooks/sms/019?k=whk-test", content=_doc_019_body(m["provider_id"], code), headers=FORM)
    assert bool(_alerts(svc, m["customer_id"], intent)) is alert, code


def test_019_code_201_blocked_by_request_stops_sms(api, svc):
    """201 «נחסם לפי בקשה» = כמו blacklist של 019 ⇒ ה-SMS לכתובת נעצר."""
    m = _sent(api, svc, "sms")
    api.post("/webhooks/sms/019?k=whk-test", content=_doc_019_body(m["provider_id"], "201"), headers=FORM)
    assert svc.suppressed("sms", m["cphone"])


# ═══════════════════════════ InforU — DeliveryNotificationUrl ═══════════════════════════
def test_inforu_send_request_carries_delivery_notification_url():
    """התיעוד: DLR נשלח לכתובת שב-Settings.DeliveryNotificationUrl. בלעדיה InforU לא שולח דוח בכלל."""
    import json

    from app.integrations.base import SmsMessage
    a = InforUSms("u", "t", "Gabi", dlr_url="https://gabi.example/webhooks/sms/inforu?k=K")
    body = json.loads(a.build_request(SmsMessage("0501234567", "x")).content)
    assert body["Data"]["Settings"]["DeliveryNotificationUrl"] == "https://gabi.example/webhooks/sms/inforu?k=K"


def test_default_sender_wires_inforu_dlr_url(svc):
    from app.service import build_dry_sender
    inforu = next(a for a in build_dry_sender(svc.s).chain if a.provider == "inforu")
    assert inforu.dlr_url == "https://gabi.example/webhooks/sms/inforu?k=whk-test"


# ═══════════════════════════ מייל — RFC 3464 / Exchange / Gmail ═══════════════════════════
RFC3464_SIMPLE = """This is a Delivery Status Notification.
Reporting-MTA: dns; cs.utk.edu

Original-Recipient: rfc822;louisl@larry.slip.umd.edu
Final-Recipient: rfc822;louisl@larry.slip.umd.edu
Action: failed
Status: 4.0.0
Diagnostic-Code: smtp; 426 connection timed out
"""

RFC3464_MULTI = """Reporting-MTA: dns; cs.utk.edu

Original-Recipient: rfc822;arathib@vnet.IBM.COM
Final-Recipient: rfc822;arathib@vnet.ibm.com
Action: failed
Status: 5.0.0 (permanent failure)
Diagnostic-Code: smtp;  550 'arathib@vnet.IBM.COM' is not a registered gateway user
Remote-MTA: dns; vnet.ibm.com
"""

RFC3464_GATEWAY = """Reporting-MTA: mailbus; SYS30

Final-Recipient: unknown; nair_s
Action: failed
Status: 5.0.0 (unknown permanent failure)
"""

RFC3464_DELAYED = """Final-Recipient: rfc822;thomas@de-montfort.ac.uk
Action: delayed
Status: 4.0.0 (unknown temporary failure)
"""

# Microsoft — «How to interpret an Exchange NDR», מילה במילה
MS_NDR = ("Delivery has failed to these recipients or groups:\nronald@contoso.com\n"
          "Your message wasn't delivered due to a permission or security issue. It might have been rejected "
          "by a moderator, the address might only accept email from certain senders, or another restriction "
          "might be preventing delivery. The following organization rejected your message: mail.contoso.com.\n"
          """Diagnostic information for administrators:
Generating server: alpineskihouse.com
ronald@contoso.com
mail.contoso.com #<exchange.contoso.com #5.7.1 smtp;530 5.7.1 Client was not authenticated> #SMTP#
Original message headers:
""")

# Exchange NDR מבנה זהה, קוד 5.1.10 («Recipient not found» — מטבלת הקודים באותו עמוד)
MS_NDR_NOT_FOUND = MS_NDR.replace("5.7.1 smtp;530 5.7.1 Client was not authenticated",
                                  "5.1.10 smtp;550 5.1.10 Recipient not found")


@pytest.mark.parametrize("sender,subject,text,expect", [
    ("MAILER-DAEMON@cs.utk.edu", "Returned mail: Cannot send message", RFC3464_SIMPLE,
     {"recipient": "louisl@larry.slip.umd.edu", "permanent": False, "address_invalid": False}),
    ("MAILER-DAEMON@cs.utk.edu", "Returned mail: see transcript", RFC3464_MULTI,
     {"recipient": "arathib@vnet.ibm.com", "permanent": True, "address_invalid": True}),
    ("postmaster@sys30.example", "Undeliverable mail", RFC3464_GATEWAY,
     {"recipient": "", "permanent": True, "address_invalid": False}),
    ("MAILER-DAEMON@de-montfort.example", "Delayed mail", RFC3464_DELAYED,
     {"recipient": "thomas@de-montfort.ac.uk", "permanent": False, "address_invalid": False}),
    ("postmaster@alpineskihouse.com", "Undeliverable: תזכורת", MS_NDR,
     {"recipient": "ronald@contoso.com", "permanent": True, "address_invalid": False}),   # 5.7.1 = מדיניות
    ("postmaster@alpineskihouse.com", "Undeliverable: תזכורת", MS_NDR_NOT_FOUND,
     {"recipient": "ronald@contoso.com", "permanent": True, "address_invalid": True}),
    ("Mail Delivery Subsystem <mailer-daemon@googlemail.com>", "Delivery Status Notification (Failure)",
     "550 5.1.1 The email account that you tried to reach does not exist.\nFinal-Recipient: rfc822; a@b.example",
     {"recipient": "a@b.example", "permanent": True, "address_invalid": True}),            # גוף סינתטי
])
def test_parse_bounce_on_documented_samples(sender, subject, text, expect):
    b = parse_bounce(sender, text, subject)
    assert b is not None, subject
    assert {k: b[k] for k in expect} == expect


def test_policy_rejection_does_not_kill_the_address(api, svc):
    """5.7.1 (מדיניות/אבטחה, כמו בדוגמת Exchange) ⇒ ההודעה נכשלה + התראה, אבל הכתובת לא נחסמת."""
    m = _sent(api, svc, "email")
    r = svc.email_webhook("postmaster@alpineskihouse.com", MS_NDR.replace("ronald@contoso.com", m["cemail"]),
                          "ndr-571", subject="Undeliverable: תזכורת")
    assert r.get("bounce") == "failed", r
    assert not svc.email_bounced(m["cemail"])
    assert _alerts(svc, m["customer_id"], "email_bounced")


def test_exchange_not_found_kills_the_address(api, svc):
    m = _sent(api, svc, "email")
    r = svc.email_webhook("postmaster@alpineskihouse.com",
                          MS_NDR_NOT_FOUND.replace("ronald@contoso.com", m["cemail"]), "ndr-5110",
                          subject="Undeliverable: תזכורת")
    assert r.get("bounce") == "failed" and svc.email_bounced(m["cemail"])


# ═══════════════════════════ RFC 5965 — ARF ═══════════════════════════
ARF_B1 = """Feedback-Type: abuse
User-Agent: SomeGenerator/1.0
Version: 1
"""

ARF_B2 = """Feedback-Type: abuse
User-Agent: SomeGenerator/1.0
Version: 1
Original-Mail-From: <somespammer@example.net>
Original-Rcpt-To: <user@example.com>
Arrival-Date: Thu, 8 Mar 2005 14:00:00 EDT
Reporting-MTA: dns; mail.example.com
Source-IP: 192.0.2.1
Authentication-Results: mail.example.com;
               spf=fail smtp.mail=somespammer@example.com
Reported-Domain: example.net
Reported-Uri: http://example.net/earn_money.html
Reported-Uri: mailto:user@example.com
Removal-Recipient: user@example.com
"""


def test_arf_rfc5965_b2_full_report():
    assert parse_complaint("fbl@mail.example.com", ARF_B2, "") == \
        {"recipient": "user@example.com", "message_ids": [], "type": "abuse"}


def test_arf_rfc5965_b1_without_recipient_needs_message_id(svc):
    c = parse_complaint("fbl@mail.example.com", ARF_B1, "")
    assert c == {"recipient": "", "message_ids": [], "type": "abuse"}
    assert svc.email_webhook("fbl@mail.example.com", ARF_B1, "arf-b1")["complaint"] == "unmatched"


def test_policy_reject_with_address_wording_still_keeps_address():
    """5.7.1 «Recipient address rejected: Access denied» (נוסח Postfix נפוץ לדחיית מדיניות; גוף סינתטי) —
    המילים «address rejected» לא הופכות את הכתובת ל«מתה»: 5.7.x = מדיניות/אבטחה."""
    b = parse_bounce("MAILER-DAEMON@mx.example.com",
                     "Final-Recipient: rfc822; a@b.example\nAction: failed\nStatus: 5.7.1\n"
                     "Diagnostic-Code: smtp; 554 5.7.1 <a@b.example>: Recipient address rejected: Access denied",
                     "Undelivered Mail Returned to Sender")
    assert b["permanent"] and b["code"] == "5.7.1" and b["address_invalid"] is False


def test_019_blacklist_push_without_type_uses_url_hint(api, svc):
    """019 מגדירים URL נפרד לכל סוג push (push_url type=dlr/incoming_sms/blacklist) ובגוף אין type.
    blacklist בלי type ובלי message נבלע; עם ?type=blacklist ב-URL שמוגדר אצלם — מטופל."""
    m = _sent(api, svc, "sms")
    body = urlencode({"phone": "972" + m["cphone"].replace("-", "")[1:]})
    api.post("/webhooks/sms/019?k=whk-test&type=blacklist", content=body, headers=FORM)
    assert svc.suppressed("sms", m["cphone"])


def test_019_url_type_hint_is_allowlisted(api, svc):
    m = _sent(api, svc, "sms")
    r = api.post("/webhooks/sms/019?k=whk-test&type=drop_tables", content=_doc_019_body(m["provider_id"]),
                 headers=FORM)
    assert r.json().get("status") == "delivered"                    # רמז לא חוקי ⇒ זיהוי לפי צורה
