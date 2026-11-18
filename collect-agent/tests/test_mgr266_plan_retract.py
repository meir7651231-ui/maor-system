"""מנהל הפעלה 266 · «הבא» AI מ-265: הלקוח חוזר בו מהסדר שכבר אישר.

היה:
  · «אני מבטלת את ההסדר» / «חזרתי בי מההסדר» / «אני רוצה לבטל את הפריסה» / «מבטל את התשלומים» ⇒ PLAN_REQUEST
    ⇒ הצעה *חדשה* («בשמחה. הצעה לפריסה…») שנרשמה כהסדר proposed נוסף — הלקוח ביטל וקיבל הצעה.
  · «לא אוכל לעמוד בתשלומים» ⇒ הצעה עם תשלומים *גדולים* יותר (3×400 מול 4×300 שבשיחה).
  · «אל תבטלו את ההסדר» ⇒ «הסדר» ⇒ PLAN_REQUEST ⇒ הצעה חדשה.
  · «לא מתאים לי בסוף» / «I changed my mind» / «לא» אחרי האישור ⇒ «לא ברור», כרטיס בלי הקשר.

עכשיו (`plan_retract`, רק כשיש הסדר בשיחה):
  · PLAN_PENDING_OWNER ⇒ PLAN_REJECT + תג plan_retract ⇒ כרטיס «↩️ חוזר/ת בו מההסדר…», «ההסדר לא בוטל
    אוטומטית». חזרה מפורשת ⇒ טיוטת «קיבלנו… בעל העסק יבדוק»; «לא» לבד ⇒ בלי תשובה. אין הצעה חדשה.
  · AWAITING_PLAN_REPLY ⇒ דחיית ההצעה (המסלול הקיים, «בסדר גמור. נחזור אליכם»).
  · בקשה ממשית (מספר תשלומים / סכום / מועד) ⇒ המסלול של הצעה מעודכנת, כמו קודם.
  · כוונות מגינות (הסרה / שילמתי / עו״ד / מחלוקת) גוברות.
"""
from __future__ import annotations

from dataclasses import replace

import pytest

from app.conversation import Escalation, Intent, State, detect, plan_retract, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

CH = pytest.mark.parametrize("ch", ["sms", "email"])
RETRACT = ["אני מבטלת את ההסדר", "חזרתי בי מההסדר", "אני רוצה לבטל את הפריסה", "מבטל את התשלומים",
           "לא מתאים לי בסוף", "בעצם לא, אני לא יכולה לעמוד בזה", "התחרטתי", "לא אוכל לעמוד בתשלומים",
           "I changed my mind about the plan", "I want to cancel the plan", "חוזרת בי, סליחה",
           "לא מעוניינת בהסדר", "אני מוותרת על הפריסה"]
NOT_RETRACT = ["אל תבטלו את ההסדר", "לא מבטלת, הכל בסדר", "don't cancel the plan", "מאשרת",
               "withdraw?", "לא חוזרת בי", "תודה, לא צריך לבטל כלום", "תבטלו את התזכורות"]


def _ctx(state="plan_pending_owner", ch="sms", approved=True):
    return replace(build_ctx({"state": state, "channel": ch, "offered_n": 4}), plan_approved=approved)


@pytest.mark.parametrize("text", RETRACT)
def test_plan_retract_words(text):
    from app.conversation import normalize
    assert plan_retract(normalize(text))


@pytest.mark.parametrize("text", NOT_RETRACT)
def test_not_retract(text):
    from app.conversation import normalize
    assert not plan_retract(normalize(text))


@CH
@pytest.mark.parametrize("approved", [True, False])
@pytest.mark.parametrize("text", RETRACT)
def test_retract_pending_owner_is_card_with_context(text, approved, ch):
    d = respond(text, _ctx(ch=ch, approved=approved))
    assert d.intent == Intent.PLAN_REJECT and "plan_retract" in d.tags
    assert not d.plan, "חזרה מההסדר לא מייצרת הצעה חדשה"
    assert d.next_state == State.AWAITING_OWNER and d.escalate == Escalation.NORMAL
    assert "↩️" in d.owner_summary and "לא בוטל אוטומטית" in d.owner_summary
    assert "4 תשלומים" in d.owner_summary            # ההסדר שבשיחה מופיע בכרטיס
    assert d.reply and "בעל העסק יבדוק" in d.reply and "הצעה" not in d.reply
    if approved:
        assert any("לבטל אותו ב«הסדרים»" in a for a in d.owner_actions)
    else:
        assert "ממתין לאישור שלך" in d.owner_summary
        assert any("לא לאשר את ההסדר" in a for a in d.owner_actions)


@pytest.mark.parametrize("text", ["לא", "לא מתאים לי", "no"])
def test_bare_no_after_accept_is_soft_card_without_reply(text):
    d = respond(text, _ctx())
    assert d.intent == Intent.PLAN_REJECT and d.reply is None and d.escalate == Escalation.NORMAL
    assert "ייתכן שחוזר/ת" in d.owner_summary and not d.plan


@pytest.mark.parametrize("text", ["אני מבטלת את ההסדר", "חזרתי בי", "I changed my mind",
                                  "לא אוכל לעמוד בתשלומים"])
def test_retract_while_offer_open_rejects_offer(text):
    """AWAITING_PLAN_REPLY: חזרה = דחיית ההצעה (המסלול הקיים), בלי הצעה חדשה."""
    d = respond(text, _ctx("awaiting_plan_reply"))
    assert d.intent == Intent.PLAN_REJECT and not d.plan and Intent.PLAN_REQUEST not in d.all_intents
    assert d.next_state == State.AWAITING_OWNER and "בסדר גמור" in (d.reply or "")


@pytest.mark.parametrize("text", ["אל תבטלו את ההסדר", "לא מבטלת, הכל בסדר", "don't cancel the plan"])
def test_negated_cancel_is_not_new_offer(text):
    d = respond(text, _ctx())
    assert not d.plan and Intent.PLAN_REQUEST not in d.all_intents and "plan_retract" not in d.tags


@pytest.mark.parametrize("text,n", [("לא מתאים לי בסוף, אפשר 6 תשלומים?", 6),
                                    ("בעצם לא, אפשר ב-5 תשלומים?", 5)])
def test_retract_with_concrete_request_gets_new_offer(text, n):
    d = respond(text, _ctx(approved=False))
    assert d.intent == Intent.PLAN_REQUEST and len(d.plan) == n and "plan_retract" not in d.tags


@pytest.mark.parametrize("text,intent", [
    ("אני מבטלת את ההסדר ותפסיקו לשלוח לי", Intent.OPT_OUT),
    ("תבטלו את ההסדר, כבר שילמתי הכל", Intent.PAID_CLAIM),
    ("חזרתי בי, אני הולכת לעורך דין", Intent.LEGAL),
])
def test_protective_intents_win(text, intent):
    assert respond(text, _ctx()).intent == intent


def test_retract_with_date_keeps_date_in_card():
    d = respond("בעצם לא, אשלם הכל ב-20", _ctx())
    assert d.intent == Intent.PLAN_REJECT and d.promise_date is not None
    assert "מציע/ה במקום לשלם עד" in d.owner_summary


@pytest.mark.parametrize("state", ["idle", "promised", "awaiting_owner"])
def test_no_plan_context_unchanged(state):
    """בלי הסדר בשיחה «אני מבטלת את ההסדר» לא הופך לחזרה."""
    c = build_ctx({"state": state})
    assert Intent.PLAN_REJECT not in detect("חזרתי בי", c)
    assert "plan_retract" not in respond("לא מתאים לי בסוף", c).tags


def test_sequences_file_passes():
    import json
    from pathlib import Path
    path = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr266.jsonl"
    seqs = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(seqs) == 12 and sum(s["critical"] for s in seqs) == 7
    for s in seqs:
        assert run_seq(s) == [], s["id"]


def test_service_does_not_cancel_approved_plan_nor_add_one():
    """דרך השירות: חזרה אחרי אישור בעל העסק ⇒ ההסדר נשאר approved, ולא נוסף הסדר proposed."""
    seq = {"id": "x", "channel": "sms", "turns": [
        {"text": "אפשר לחלק ל-4 תשלומים?"}, {"text": "מאשרת"},
        {"owner": "approve_plan", "expect": {"ok": True}},
        {"text": "התחרטתי, אני מבטלת את ההסדר",
         "expect": {"plan_status": "approved", "plans": 1, "state": "awaiting_owner"}}]}
    assert run_seq(seq) == []
