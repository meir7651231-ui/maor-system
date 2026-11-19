"""מנהל הפעלה 299 · סט מוחזק #18 (עיוור) הורץ על המנוע: 21/30 ⇒ 28/30. שבע מחלקות תוקנו.

🔴 q18-02: על הסדר שבעל העסק אישר, «Could the first installment be pushed back?» ⇒ PLAN_REQUEST רגיל ⇒ הצעה *חדשה
   וזהה* ללקוח, הסדר proposed שני, והמצב חזר ל-AWAITING_PLAN_REPLY («pushed»/«moved» לא נתפסו כבקשת שינוי; גם
   «move the first one»). עכשיו: בקשת שינוי ⇒ כרטיס לבעל העסק, ההסדר המאושר נשאר יחיד.
🔴 q18-14: «Who's this?» ⇒ UNKNOWN.
🔴 q18-16: «charged for parts that were never replaced. I'm not paying until this is fixed.» ⇒ UNKNOWN
   (תזכורות ממשיכות).
🔴 q18-19: «I'm falling apart… my dad passed last week» ⇒ cant_pay רגיל, לא דחוף (מצוקה + אבל).
🔴 q18-24: «מאיפה יש לכם את המספר?» ⇒ «תמחקו אותו בבקשה» ⇒ UNKNOWN (ההסרה לא כובדה).
🔴 q18-27: «stop the reminders for a week, I'll pay on the 16th» ⇒ הסרה *קבועה* ראשית.
🔴 q18-30: «Our lawyer … confirmed the amount is correct. Payment will go out Thursday.» ⇒ legal (דחוף) בלי הבטחה.
נשאר (לביקורת): q18-01/03 — «אין לי כסף» על הסדר מאושר ⇒ plan_reject ראשי (הכרעת מנהל 287), cant_pay משני.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Intent, detect
from evals.harness import build_ctx
from evals.sequences import run_seq


def _ctx():
    return build_ctx({"state": "idle", "channel": "sms", "total": 120000})


def _has(text, intent):
    return intent in detect(text, _ctx())


@pytest.mark.parametrize("text", ["Who's this?", "whos this", "Who’s this?", "who's this from?", "who's texting me?"])
def test_whos_this(text):
    assert _has(text, Intent.WHO_IS_THIS), text


@pytest.mark.parametrize("text", [
    "I was charged for parts that were never replaced. I'm not paying until this is fixed.",
    "you charged me for parts that were never replaced", "I'm not paying until this is fixed",
    "not paying until the repair is done", "I was charged for the hours which weren't actually done",
    "I'm not going to pay until you fix it"])
def test_dispute_conditional_refusal(text):
    assert _has(text, Intent.DISPUTE), text


@pytest.mark.parametrize("text", ["I'm not paying until next month", "I'm not paying until I get paid"])
def test_not_dispute_timing(text):
    assert not _has(text, Intent.DISPUTE), text


@pytest.mark.parametrize("text", ["honestly I'm falling apart", "I'm completely falling apart",
                                  "I'm at my breaking point"])
def test_distress_falling_apart(text):
    assert _has(text, Intent.DISTRESS), text


@pytest.mark.parametrize("text", ["the house is falling apart", "the app is falling apart"])
def test_not_distress(text):
    assert not _has(text, Intent.DISTRESS), text


@pytest.mark.parametrize("text", ["my dad passed last week", "my father died", "my mom passed.",
                                  "I lost my father last month", "my mother passed away in May"])
def test_bereavement_en_urgent(text):
    from app.conversation import respond
    d = respond(text, _ctx())
    assert Intent.CANT_PAY in [d.intent, *d.secondary], text
    assert d.escalate.value == "urgent", text


@pytest.mark.parametrize("text", ["my son passed his exam", "I lost my dad's card", "my dad passed the payment to you"])
def test_not_bereavement(text):
    assert not _has(text, Intent.CANT_PAY), text


@pytest.mark.parametrize("text", ["תמחקו אותו בבקשה", "delete my number", "please delete me",
                                  "delete my details from your list"])
def test_delete_is_opt_out(text):
    assert _has(text, Intent.OPT_OUT), text


@pytest.mark.parametrize("text", ["תמחקו את החשבונית", "תמחקו אותו, החשבון שגוי"])
def test_delete_other_not_opt_out(text):
    assert not _has(text, Intent.OPT_OUT), text


@pytest.mark.parametrize("text", ["stop the reminders for a week, I'll pay on the 16th",
                                  "stop for now, I'll pay Sunday", "תפסיקו לשלוח עד ה-16, אשלם אז"])
def test_temporary_stop_with_promise(text):
    got = detect(text, _ctx())
    assert Intent.PROMISE in got and Intent.OPT_OUT not in got, (text, got)


@pytest.mark.parametrize("text", ["stop texting me forever, I'll pay on the 16th", "remove me, I'll pay on the 16th",
                                  "stop sending reminders until Friday", "stop"])
def test_permanent_stop_unchanged(text):
    assert _has(text, Intent.OPT_OUT), text


@pytest.mark.parametrize("text", ["Payment will go out Thursday.", "the payment will be sent tomorrow",
                                  "Our lawyer reviewed the contract and confirmed the amount is correct. "
                                  "Payment will go out Thursday."])
def test_passive_payment_promise(text):
    got = detect(text, _ctx())
    assert got[0] is Intent.PROMISE and Intent.LEGAL not in got, (text, got)


@pytest.mark.parametrize("text", ["when will the payment go out?", "the payment won't go out"])
def test_not_passive_promise(text):
    assert not _has(text, Intent.PROMISE), text


def test_active_lawyer_stays_legal():
    assert _has("Our lawyer will contact you. Payment will go out Thursday.", Intent.LEGAL)


def test_changed_my_mind_still_retract():
    from app.conversation import plan_change, plan_retract
    assert plan_change("I changed my mind about the plan") is None
    assert plan_retract("I changed my mind about the plan")
    assert plan_change("Could the first installment be pushed back?") is not None
    assert plan_change("can we move the first one to next month?") is not None


def test_sequences_through_service():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr299.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        assert run_seq(json.loads(line)) == [], line[:40]
