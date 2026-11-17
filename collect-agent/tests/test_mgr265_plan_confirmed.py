"""מנהל הפעלה 265 · «הבא» AI מ-264: «מאשרת» אחרי שההסדר כבר אושר.

היה (שני באגים):
  1. המסלול הרגיל — בעל העסק מאשר ב«הסדרים» (ההצעה נשלחת: «השיבו מאשר»), הלקוח עונה «מאשרת» ⇒ טיוטה
     «ההסדר הועבר לאישור סופי, ואחרי האישור נשלח את פרטי התשלום הראשון» (הבטחה שאף אחד לא יקיים — האישור כבר
     ניתן) + כרטיס «נדרש אישור סופי שלך · לאשר את ההסדר», שאין מה לעשות בו (ההסדר כבר approved).
  2. אישור חוזר במצב PLAN_PENDING_OWNER («מאשרת», «סגור», «yes I confirm») ⇒ «לא ברור» ⇒ כרטיס בלי הקשר.

עכשיו (`Context.plan_approved` נבנה מ-plans.status='approved'):
  · ההסדר אושר + אישור ראשון של הלקוח ⇒ טיוטת אישור עם התשלום הקרוב וקישור, בלי «נדרש אישור סופי».
  · אישור חוזר בלבד ⇒ אין תשובה, אין כרטיס, אין השהיה חדשה (כמו «תודה»).
  · אישור חוזר עם שאלה ⇒ אושר: טיוטה עם התשלום הקרוב · לא אושר: כרטיס רגיל.
  · מלכודות: שינוי מועד / הסרה / שילמתי / דחייה — לא נבלעים באישור.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta

import pytest

from app.conversation import Escalation, Intent, State, Stop, detect, respond
from evals.harness import TODAY, build_ctx
from evals.sequences import run_seq

CH = pytest.mark.parametrize("ch", ["sms", "email"])
ACCEPTS = ["מאשרת", "מאשר 👍", "סגור", "ok", "yes I confirm", "סגור, מאשר", "מאשרת!!"]


def _ctx(state="plan_pending_owner", ch="sms", approved=True, **kw):
    return replace(build_ctx({"state": state, "channel": ch, "offered_n": 4}), plan_approved=approved, **kw)


# ── אישור חוזר אחרי שההסדר אושר ⇒ שקט ──
@CH
@pytest.mark.parametrize("text", ACCEPTS)
def test_reconfirm_after_approval_is_silent(text, ch):
    d = respond(text, _ctx(ch=ch))
    assert d.intent == Intent.PLAN_ACCEPT
    assert d.reply is None and d.escalate == Escalation.NONE and d.stop == Stop.NONE
    assert d.next_state == State.PLAN_PENDING_OWNER
    assert "plan_confirmed" in d.tags and "בתוקף" in d.owner_summary
    assert "נדרש אישור סופי" not in d.owner_summary and "לאשר את ההסדר" not in d.owner_actions


@CH
@pytest.mark.parametrize("text", ["סגור, תודה רבה", "כן מאשרת תודה", "מעולה תודה"])
def test_thanks_after_approval_stays_thanks(text, ch):
    """q11-07 (תווית עיוורת): «סגור, תודה רבה» אחרי האישור = תודה. אותה התנהגות — בלי תשובה ובלי כרטיס."""
    d = respond(text, _ctx(ch=ch))
    assert d.intent == Intent.THANKS and d.reply is None and d.escalate == Escalation.NONE


def test_thanks_with_question_is_accept_with_details():
    d = respond("מאשרת תודה, מתי התשלום הראשון?", _ctx())
    assert d.intent == Intent.PLAN_ACCEPT and d.reply and "התשלום הראשון" in d.reply


# ── אישור חוזר לפני שבעל העסק אישר ⇒ שקט, בלי כרטיס (ההסדר כבר מחכה ב«הסדרים») ──
@CH
@pytest.mark.parametrize("text", ["מאשרת", "סגור", "yes I confirm"])
def test_reconfirm_before_owner_is_silent(text, ch):
    d = respond(text, _ctx(ch=ch, approved=False))
    assert d.intent == Intent.PLAN_ACCEPT and d.reply is None and d.escalate == Escalation.NONE
    assert "plan_reconfirm" in d.tags and "ממתין לאישור הסופי שלך" in d.owner_summary


def test_reconfirm_question_before_owner_is_card():
    d = respond("מאשרת, מתי זה יאושר?", _ctx(approved=False))
    assert d.intent == Intent.PLAN_ACCEPT and d.reply is None and d.escalate == Escalation.NORMAL
    assert any("לקרוא את השאלה" in a for a in d.owner_actions)


# ── המסלול הרגיל: בעל העסק אישר (AWAITING_PLAN_REPLY), הלקוח «מאשרת» ──
@CH
@pytest.mark.parametrize("text", ["מאשרת", "כן", "מתאים לי", "Yes, that works for me"])
def test_first_accept_after_owner_approved(text, ch):
    c = _ctx("awaiting_plan_reply", ch)
    d = respond(text, c)
    assert d.intent == Intent.PLAN_ACCEPT and d.next_state == State.PLAN_PENDING_OWNER
    assert d.reply and "ההסדר בתוקף" in d.reply and "התשלום הראשון" in d.reply
    assert "לאישור סופי" not in d.reply and "אחרי האישור" not in d.reply
    assert c.payment_link in d.reply
    assert d.escalate == Escalation.NONE
    assert "לאשר את ההסדר" not in d.owner_actions and "לאשר את הודעת האישור ללקוח" in d.owner_actions


def test_first_accept_before_owner_unchanged():
    """ההסדר עוד לא אושר ⇒ ההתנהגות הקודמת (הועבר לאישור סופי + כרטיס לבעל העסק)."""
    d = respond("מאשרת", _ctx("awaiting_plan_reply", approved=False))
    assert d.intent == Intent.PLAN_ACCEPT and "לאישור סופי" in d.reply
    assert "לאשר את ההסדר" in d.owner_actions and d.escalate == Escalation.NORMAL


def test_question_after_first_installment_passed_uses_next():
    c = _ctx()
    later = replace(c, today=c.offered_plan[0].due + timedelta(days=1))
    d = respond("מאשרת, מתי התשלום?", later)
    assert d.reply and "התשלום הבא" in d.reply
    assert f"{c.offered_plan[1].due.day}.{c.offered_plan[1].due.month}" in d.reply


def test_sms_reply_fits_without_link_when_long():
    c = _ctx("awaiting_plan_reply", payment_link="https://pay.example/" + "x" * 200)
    d = respond("מאשרת", c)
    assert d.reply and "pay.example" not in d.reply and "ההסדר בתוקף" in d.reply


# ── מלכודות: לא נבלעות באישור ──
@pytest.mark.parametrize("text,intent", [
    ("מאשרת, רק שהתשלום הראשון יהיה ב-25", Intent.PLAN_REQUEST),
    ("תפסיקו לשלוח לי הודעות", Intent.OPT_OUT),
    ("כבר שילמתי הכל בביט", Intent.PAID_CLAIM),
    ("כן אבל הסכום לא נכון, לא חייבת לכם כלום", Intent.DISPUTE),
])
def test_traps_after_approval(text, intent):
    d = respond(text, _ctx())
    assert d.intent == intent and d.intent != Intent.PLAN_ACCEPT


@pytest.mark.parametrize("text", ["לא מתאים לי בסוף", "לא"])
def test_reject_after_approval_not_auto(text):
    """«לא» אחרי שההסדר אושר לא מבטל אותו אוטומטית — כרטיס לבעל העסק.
    מנהל 266: הכרטיס עכשיו עם הקשר (PLAN_REJECT + plan_retract במצב PLAN_PENDING_OWNER); השירות לא מבטל
    הסדר מאושר (רק דחייה מ-AWAITING_PLAN_REPLY מסמנת rejected) — נבדק ב-test_mgr266_plan_retract."""
    d = respond(text, _ctx())
    assert Intent.PLAN_ACCEPT not in d.all_intents and "plan_retract" in d.tags and not d.plan
    assert d.escalate != Escalation.NONE and "לא בוטל אוטומטית" in d.owner_summary


def test_idle_accept_words_unchanged():
    """בלי הסדר בשיחה «סגור» / «מאשרת» לא הופכים לאישור הסדר."""
    c = build_ctx({"state": "idle"})
    assert Intent.PLAN_ACCEPT not in detect("מאשרת", c)
    assert Intent.PLAN_ACCEPT not in detect("סגור", replace(c, plan_approved=True))


def test_pending_owner_without_plan_not_accept():
    c = replace(build_ctx({"state": "plan_pending_owner"}), plan_approved=True)
    assert Intent.PLAN_ACCEPT not in detect("מאשרת", c)


# ── דרך השירות האמיתי (inbound + approve_plan + DB) ──
def test_sequences_file_passes():
    import json
    from pathlib import Path
    path = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr265.jsonl"
    seqs = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(seqs) == 12
    for s in seqs:
        assert run_seq(s) == [], s["id"]


def test_context_plan_approved_from_db():
    seq = {"id": "x", "channel": "sms", "turns": [
        {"text": "אפשר לחלק ל-4 תשלומים?"}, {"owner": "approve_plan", "expect": {"ok": True}},
        {"text": "מאשרת", "expect": {"draft": "pending_approval", "escalate": "none"}},
        {"text": "מאשרת", "expect": {"draft": None, "escalate": "none", "state": "plan_pending_owner"}}]}
    assert run_seq(seq) == []


assert TODAY  # שימוש ב-harness (תאריך קבוע)
