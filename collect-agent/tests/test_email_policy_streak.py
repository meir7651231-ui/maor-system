"""הכרעת מקשר (q22-10, 20.11): 5.7.x = דחיית מדיניות/אבטחה — הכתובת **לא** נחסמת. אבל אותה כתובת שמחזירה
5.7.x שלוש פעמים ברצף ⇒ כרטיס email_policy_repeat לבעל העסק (פעם אחת לרצף), עדיין בלי חסימה אוטומטית.
כל קוד אחר לכתובת (או מייל מאומת ממנה) מאפס את הרצף."""
from __future__ import annotations

from datetime import timedelta

PASS = "mx.gabi.example; spf=pass; dkim=pass; dmarc=pass"


def _send_round(svc, clock):
    svc.sync()
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()


def _bounce(svc, mid, to, code, n):
    return svc.email_webhook("MAILER-DAEMON@mx.example.com",
                             f"Final-Recipient: rfc822; {to}\nAction: failed\nStatus: {code}\n\nMessage-ID: {mid}\n",
                             f"ps-{n}", subject="Undelivered Mail Returned to Sender", auth_results=PASS)


def _sent_ids(svc, to):
    return [r["provider_id"] for r in svc.db.q("SELECT provider_id FROM messages WHERE direction='out' AND "
                                               "channel='email' AND json_extract(payload,'$.to')=? ORDER BY id",
                                               (to,))]


def _cards(svc):
    return svc.db.q("SELECT 1 FROM messages WHERE intent='email_policy_repeat' AND needs_owner=1")


def _three_messages(svc, clock, to="c1@example.com"):
    """שלוש תזכורות שיצאו לאותה כתובת (כל bounce מתייחס למייל אחר שלנו)."""
    ids = []
    for _ in range(3):
        clock.now += timedelta(days=8)
        _send_round(svc, clock)
        ids = _sent_ids(svc, to)
    return ids


def test_three_policy_rejections_in_a_row_card_once_no_block(svc, clock):
    ids = _three_messages(svc, clock)
    assert len(ids) >= 3, ids
    for i, mid in enumerate(ids[:3]):
        r = _bounce(svc, mid, "c1@example.com", "5.7.1", i)
        assert r["bounce"] == "failed" and r["policy_streak"] == i + 1
        assert len(_cards(svc)) == (1 if i == 2 else 0)
    assert not svc.email_bounced("c1@example.com")                 # לא חסימה
    if len(ids) > 3:                                                # רביעית ברצף ⇒ אין כרטיס נוסף
        _bounce(svc, ids[3], "c1@example.com", "5.7.1", 9)
    assert len(_cards(svc)) == 1


def test_other_code_resets_streak(svc, clock):
    ids = _three_messages(svc, clock)
    _bounce(svc, ids[0], "c1@example.com", "5.7.1", 0)
    _bounce(svc, ids[1], "c1@example.com", "4.2.2", 1)               # עיכוב — לא נקלט כ-failed, לא מאפס
    _bounce(svc, ids[1], "c1@example.com", "5.2.2", 2)               # תיבה מלאה — קוד אחר ⇒ איפוס
    r = _bounce(svc, ids[2], "c1@example.com", "5.7.1", 3)
    assert r["policy_streak"] == 1 and not _cards(svc)
