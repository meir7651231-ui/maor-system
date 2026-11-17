"""critic סבב 116 · רצפים דרך השירות (svc.inbound): הבטחה/תאריך בהודעה הראשונה, וכוונה מגינה בהודעה הבאה. ההקשר
«promised» לא יכול לבלוע את מה שבא אחריו: מצוקה ⇒ דחוף + מייל לבעלים; מחלוקת ⇒ השהיה; הסרה ⇒ לצמיתות; קטין ⇒ דחוף.
ואחרי כל אלה — אף תזכורת לא יוצאת גם כשמועד ההבטחה עובר."""
from datetime import timedelta

import pytest


def _owner_urgent_mails(svc):
    return [m for m in svc.sender.sent if m["channel"] == "email" and m.get("audience") == "owner"]


@pytest.mark.parametrize("second, intent, stop", [
    ("אני כבר לא יכול לחיות ככה", "distress", None),
    ("בעצם אני לא חייב לכם כלום", "dispute", None),
    ("תפסיקו לשלוח לי הודעות", "opt_out", "opted_out"),
    ("הבן שלי בן 12 ענה לכם קודם", "minor", None)])
def test_protective_after_promise(svc, clock, second, intent, stop):
    svc.sync()
    r1 = svc.inbound("sms", "0501234567", "אשלם ביום חמישי")
    assert r1["intent"] == "promise"
    clock.now += timedelta(hours=3)
    r2 = svc.inbound("sms", "0501234567", second)
    assert r2["intent"] == intent, r2
    if intent in ("distress", "minor", "dispute"):
        assert _owner_urgent_mails(svc), "אין מייל דחוף לבעלים אחרי הודעה מגינה שנייה"
    if stop:
        assert svc._customer_block(1) == stop
    clock.now += timedelta(days=10)                 # מועד ההבטחה עבר
    for i in svc.plan():
        try:
            svc.approve(i)
        except ValueError:
            pass
    svc.dispatch()
    to_cust = [m for m in svc.sender.sent
               if m["to"] in ("972501234567", "c1@example.com") and m.get("audience") != "owner"]
    assert to_cust == [], [m["body"][:40] for m in to_cust]


def test_control_promise_alone_then_reminder_after_date(svc, clock):
    """בקרה: הבטחה בלבד ⇒ אחרי שהמועד עבר תזכורת כן יוצאת — כלומר הבדיקות למעלה לא «ירוקות-ריקות»."""
    svc.sync()
    svc.inbound("sms", "0501234567", "אשלם ביום חמישי")
    clock.now += timedelta(days=10)
    for i in svc.plan():
        try:
            svc.approve(i)
        except ValueError:
            pass
    svc.dispatch()
    assert [m for m in svc.sender.sent
            if m["to"] in ("972501234567", "c1@example.com") and m.get("audience") != "owner"]
