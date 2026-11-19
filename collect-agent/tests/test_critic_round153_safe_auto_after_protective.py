"""critic סבב 153 · 🔴 לתיקון בונה — רכיב: `app/inbox.py` → `ConversationInbox.handle_customer`, שליחה אוטומטית
(`if draft_id and d.auto_send: self.approve_draft(draft_id, actor="system:safe_auto")`).

במצב `approval_mode="safe_auto"`: לקוח שכתב «אני בן 14» (paused_reason=minor) / «אני רוצה למות» (distress) /
«העברתי לעורך הדין שלי» (legal) / «לא הזמנתי את זה» (dispute) — וההודעה הבאה שלו «איך משלמים?» ⇒ **קישור תשלום
נשלח לו אוטומטית, בלי אישור בעל העסק** (נמדד: הודעה יוצאת אחת). קישור תשלום לקטין / לאדם במצוקה / ללקוח שפנה
לעו״ד, בלי עין אנושית. המנוע (`conversation.respond`) קובע `auto_send` רק לפי ההודעה הנוכחית (בלי secondary ובלי
הסלמה) ולא רואה את מצב הלקוח; `handle_customer` לא בודק את `cust["paused_reason"]` / `disputed` לפני השליחה.
הצעה: אם ללקוח השהיה מגינה (minor/distress/legal/dispute/insolvency/deceased/sensitive/shared_contact_urgent)
או disputed=1 ⇒ `auto_send=False` (טיוטה לבעל העסק, כמו במצב «all»).
תקין ונבדק: שבת/לילה ⇒ לא נשלח; לקוח שהוסר ⇒ לא נשלח (`_hold_reply_if_opted_out`).
הבדיקות `xfail(strict=True)`: מוכיחות את הבאג בלי להפיל CI; אחרי התיקון הן יעברו ⇒ strict ייכשל ⇒ להסיר את xfail."""
import dataclasses

import pytest

from tests.conftest import customer_sent


@pytest.mark.parametrize("first", ["אני בן 14", "אני רוצה למות", "העברתי לעורך הדין שלי", "לא הזמנתי את זה, זו טעות",
                                   "שילמתי כבר"])
def test_no_auto_payment_link_after_protective_message(svc, first):
    svc.sync()
    svc.inbox.policy = dataclasses.replace(svc.inbox.policy, approval_mode="safe_auto")
    svc.inbound("sms", "0501234567", first)
    before = len(customer_sent(svc))
    r = svc.inbound("sms", "0501234567", "איך משלמים?")
    assert len(customer_sent(svc)) == before and r["auto_reply"] is None, (first, r["auto_reply"])


def test_safe_auto_still_works_for_ordinary_customer(svc):
    """בקרה: לקוח רגיל ⇒ התשובה האוטומטית יוצאת (כדי שהתיקון לא יכבה את safe_auto לגמרי)."""
    svc.sync()
    svc.inbox.policy = dataclasses.replace(svc.inbox.policy, approval_mode="safe_auto")
    before = len(customer_sent(svc))
    r = svc.inbound("sms", "0501234567", "איך משלמים?")
    assert len(customer_sent(svc)) == before + 1 and r["auto_reply"]


def test_held_draft_waits_for_owner_and_is_audited(svc):
    """תוקן (גבייה סוכן 18.11): הטיוטה נשארת pending_approval לבעל העסק, עם audit safe_auto_held."""
    svc.sync()
    svc.inbox.policy = dataclasses.replace(svc.inbox.policy, approval_mode="safe_auto")
    svc.inbound("sms", "0501234567", "אני בן 14")
    r = svc.inbound("sms", "0501234567", "איך משלמים?")
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (r["draft_id"],))["status"] in (
        "pending_approval", "needs_owner")
    assert svc.db.one("SELECT 1 FROM audit WHERE action='safe_auto_held'")
