"""מבקר סבב 206 · 🔴 — תשובה שאושרה וממתינה לחלון השליחה יוצאת גם אחרי שהלקוח כתב «אני בן 16» / «עורך דין» / פשיטת רגל.

רכיבים: `app/inbox.py` → `_draft` (הודעה חדשה מחליפה רק טיוטות `pending_approval` — לא `approved` שממתינה לחלון) +
`dispatch` (שולח `approved` בלי לבדוק השהיה מגינה שנוצרה אחרי האישור). 205 (bb2c588c) סגר את זה לסימון של **בעל העסק**
(`set_hold`); כשהלקוח עצמו כותב — לא.
נבדק: «איך משלמים?» ⇒ טיוטה עם קישור תשלום ⇒ בעל העסק מאשר בערב (מחוץ לחלון ⇒ status=approved) ⇒ הלקוח כותב «אני בן 16»
(intent=minor) / «העברתי את העניין לעורך דין שלי» (legal) / «אני בהליך פשיטת רגל» / «אבא שלי נפטר אתמול, אני
הבן שלו» (urgent — ללקוח «מצטערים לשמוע… עצרנו את התזכורות») / «אני מאושפז» ⇒ בבוקר `dispatch` ⇒ נשלח «אפשר לשלם
(1,200 ₪) בקישור המאובטח…» — לקטין, למשפחה שבאבל אחרי «עצרנו את התזכורות», למי שבהליך משפטי.
כשהטיוטה עוד `pending_approval` — נעצרת (superseded, 409) ✓.
גם `wrong_person` כבר עוצר `approved` ✓ — כלומר המנגנון קיים, רק לא חל על ההשהיות המגינות.
xfail(strict=True); בקרות ירוקות."""
import pytest

PROTECTIVE = ["אני בן 16", "העברתי את העניין לעורך דין שלי", "אני בהליך פשיטת רגל",
              "אבא שלי נפטר אתמול, אני הבן שלו", "אני מאושפז בבית חולים, אין לי כוח לזה עכשיו"]


def _approved_then(svc, second):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "איך משלמים?")
    svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))   # אושרה בערב, ממתינה לחלון
    n0 = svc.db.one("SELECT COALESCE(MAX(id),0) AS n FROM messages")["n"]
    svc.inbound("sms", "050-1234567", second)
    svc.dispatch()
    return [m["body"] for m in svc.db.q("SELECT body FROM messages WHERE customer_id=1 AND direction='out' AND id>?",
                                       (n0,)) if "לשלם" in m["body"]]


@pytest.mark.parametrize("second", PROTECTIVE)
def test_protective_reply_stops_approved_waiting_draft(svc, second):
    sent = _approved_then(svc, second)
    assert not sent, sent[0][:80]


def test_control_wrong_person_already_stops_approved(svc):
    assert not _approved_then(svc, "הכתובת הזו כבר לא שלי, טעות במספר")


@pytest.mark.parametrize("second", PROTECTIVE)
def test_control_pending_draft_is_stopped(svc, second):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "איך משלמים?")
    svc.inbound("sms", "050-1234567", second)
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (r["draft_id"],))["status"] == "superseded"
