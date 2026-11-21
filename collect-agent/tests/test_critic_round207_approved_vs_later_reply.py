"""מבקר סבב 207 · 🟡 — המשך 206: טיוטה approved שממתינה לחלון יוצאת אחרי «רק מייל» / «שילמתי» (ממתינה לאישור — נעצרת).

רכיבים: `app/inbox.py` → `_draft` (מחליף רק `pending_approval`) + 206 (bb6521ed — עוצר `approved` רק בהודעה דחופה /
השהיה קשה). נבדק: «איך משלמים?» ⇒ טיוטה עם קישור תשלום אושרה בערב ⇒ הלקוח כותב
  «תפסיקו לשלוח לי SMS, רק מייל» (השהיה `channel_pref`) ⇒ בבוקר `dispatch` שולח את התשובה **ב-SMS**;
  «שילמתי» (`paid_claim` — ללקוח: «תודה שעדכנתם! עצרנו את התזכורות ונבדוק») ⇒ יוצא גם «אפשר לשלם (1,200 ₪) בקישור».
אותן הודעות כשהטיוטה עוד `pending_approval` ⇒ superseded. אותו קלט — תוצאה שונה לפי שעת האישור.
xfail(strict=True); בקרות ירוקות."""
import pytest

LATER = ["תפסיקו לשלוח לי SMS, רק מייל", "שילמתי"]


def _first_status(svc, second, approved):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "איך משלמים?")
    if approved:
        svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))
    svc.inbound("sms", "050-1234567", second)
    svc.dispatch()
    return svc.db.one("SELECT status FROM drafts WHERE id=?", (r["draft_id"],))["status"]


@pytest.mark.xfail(strict=True, reason="207🟡: approved יוצאת אחרי «רק מייל» / «שילמתי» (pending נעצרת)")
@pytest.mark.parametrize("second", LATER)
def test_approved_waiting_draft_superseded_like_pending(svc, second):
    assert _first_status(svc, second, approved=True) != "sent_dry_run"


@pytest.mark.parametrize("second", LATER)
def test_control_pending_is_superseded(svc, second):
    assert _first_status(svc, second, approved=False) == "superseded"


@pytest.mark.parametrize("second", ["תודה", "אשלם מחר"])
def test_control_ordinary_followup_still_sends_approved(svc, second):
    assert _first_status(svc, second, approved=True) == "sent_dry_run"
