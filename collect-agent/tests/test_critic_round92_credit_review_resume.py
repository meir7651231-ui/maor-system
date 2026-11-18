"""critic סבב 92 · BACKLOG «גבי מבקר» 1: שער רשימת הפתוחות + credit_review — מסלולים שבהם לקוח ששילם עדיין
מקבל תזכורת. הפער: קבלה **מקושרת** לחשבונית שעדיין פתוחה ⇒ credit_review עוצר; בעלים לוחץ «חידוש» בלי לסגור
את החשבונית (לחיצה אחת, בטעות או בלי לבדוק) ⇒ הסנכרון הבא לא עוצר שוב (בכוונה — «הכרעה שלו») ⇒ תזכורת יוצאת
למי שיש לו קבלה מקושרת. תיקון שמכבד את הכרעת הבעלים: החשבונית שיש עליה קבלה חוזרת ל«ממתינה לאישור» ברשימת
הפתוחות ⇒ אחרי «חידוש» צריך לסמן במפורש «עדיין פתוח» או «כבר שולם» עליה. (השער דלוק — כמו בפרודקשן.)"""
from datetime import timedelta

import pytest

from tests.test_paid_never_reminded import _approve_all, _receipt, _to_dana

pytestmark = pytest.mark.open_review


def _cid(svc):
    return svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]


def _confirm_all(svc):
    svc.confirm_open_list([x["id"] for x in svc.open_list()["pending"]], [])


def test_resume_without_closing_does_not_remind_a_payer(svc, fake_gi, clock):
    svc.sync()
    _confirm_all(svc)
    fake_gi.docs.append(_receipt(1, linked=["doc1"]))
    svc.sync()
    svc.resume_customer(_cid(svc))
    clock.now += timedelta(hours=2)
    svc.sync()
    _approve_all(svc, svc.plan())
    svc.dispatch()
    assert _to_dana(svc) == [], [m["body"][:50] for m in _to_dana(svc)]
    assert "1001" in [x["number"] for x in svc.open_list()["pending"]], "החשבונית לא חזרה לרשימת האישור"


def test_owner_then_confirms_still_open_and_reminder_flows(svc, fake_gi, clock):
    """הבעלים בדק: הקבלה לא שייכת ⇒ «עדיין פתוח» ⇒ תזכורת יכולה לצאת (לא תוקעים לנצח)."""
    svc.sync()
    _confirm_all(svc)
    fake_gi.docs.append(_receipt(1, linked=["doc1"]))
    svc.sync()
    svc.resume_customer(_cid(svc))
    _confirm_all(svc)
    ids = svc.plan()
    assert ids, "אחרי «עדיין פתוח» מפורש — אין תזכורת"


def test_owner_marks_paid_closes(svc, fake_gi):
    svc.sync()
    _confirm_all(svc)
    fake_gi.docs.append(_receipt(1, linked=["doc1"]))
    svc.sync()
    svc.resume_customer(_cid(svc))
    inv = next(x["id"] for x in svc.open_list()["pending"] if x["number"] == "1001")
    svc.confirm_open_list([], [inv])
    assert svc._invoice(inv)["status"] == "closed"
