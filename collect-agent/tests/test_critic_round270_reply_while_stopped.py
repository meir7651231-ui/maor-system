"""מבקר סבב 270 (🟡, גבייה עיצוב): «✓ אשר ושלח» בזמן שהשירות עצור — הטוסט אומר «נשלח», לא נשלח כלום.

נבדק [מאומת], מנוי אורביט מבוטל:
  ✓ «הסר אותי» ⇒ ההסרה נרשמת מיד (opted_out=1) גם כשהשירות עצור; «שילמתי» ⇒ כרטיס לבעל העסק
    + מייל דחוף לבעלים (התראה פנימית, לא ללקוח) — הודעה ללקוח לא יוצאת.
  ✓ טיוטה שאושרה בזמן העצירה נשארת `approved` (inbox._try_send: trial_expired ⇒ בתור); אחרי חידוש
    של 22 יום ⇒ `_withdraw_if_stale` מחזיר אותה ל«ממתין לאישור» (לא יוצאת בשקט באיחור).
  🟡 web/src/pages/Inbox.tsx — כפתור «✓ אשר ושלח» מציג תמיד '✓ המענה אושר ונשלח (dry-run)', בלי לבדוק את
    הסטטוס שחזר (`approved` = ממתין בתור, `sent` = יצא). בזמן עצירה (וגם בשבת/לילה או עצירת שחזור)
    בעל העסק רואה «נשלח» על תשובה שלא נשלחה — למשל אישור הסרה ללקוח — וכעבור 4 ימים היא חוזרת לאישור.
רכיב: web/src/pages/Inbox.tsx → DraftCard (טוסט קבוע) · app/inbox.py → approve_draft (מחזיר רק status).
"""
from __future__ import annotations

from pathlib import Path

from app.channels import sent_mark, sent_since
from tests.test_orbit_entitlement import _ent, _ingest, keys  # noqa: F401
from tests.test_orbit_unlink_not_free import _link

INBOX_TSX = Path(__file__).resolve().parents[1] / "web" / "src" / "pages" / "Inbox.tsx"


def _stopped_with_draft(svc):
    svc.sync()
    _link(svc)
    _ingest(svc, _ent(svc, status="cancelled", paid_until=""))
    assert svc.trial()["active"] is False
    phone = svc.db.one("SELECT phone FROM customers ORDER BY id")["phone"]
    r = svc.inbound("sms", phone, "הסר אותי")
    return r["draft_id"]


def test_optout_recorded_and_nothing_sent_while_stopped_control(svc):
    mark = sent_mark(svc.sender.sent)
    did = _stopped_with_draft(svc)
    assert svc.db.one("SELECT opted_out FROM customers ORDER BY id")["opted_out"] == 1
    d = svc.inbox.approve_draft(did)
    assert d["status"] == "approved" and not d.get("sent_at")
    assert [m for m in sent_since(svc.sender.sent, mark) if "972501234567" in str(m)] == []


def test_approve_toast_reflects_queued_status():
    src = INBOX_TSX.read_text(encoding="utf-8")
    assert "'✓ המענה אושר ונשלח (dry-run)'" not in src
