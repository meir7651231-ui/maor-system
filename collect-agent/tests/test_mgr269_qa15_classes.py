"""מנהל הפעלה 269 · סט מוחזק #15 (עיוור) + «הבא» AI מ-268: אותו הסדר לא נרשם פעמיים.

היה (מאומת על הקוד שלפני ההפעלה, ראו STATUS):
  · «אולי 300 בחודש?» / «can we do 300 a month?» / «אפשר 4 תשלומים?» כשההסדר כבר 4×300 ⇒ הסדר *זהה* חדש (plans 2),
    ואחרי שבעל העסק אישר — חזרה ל«ממתין להצעה» וכפילות ב«הסדרים».
  · 🔴 «אני לא חייבת 1200, הבת שלי הפסיקה את החוג» ⇒ «לא ברור» (מחלוקת לא זוהתה).
  · 🔴 «החוג של עורכי הדין הצעירים היה מהמם… אפשר ב-3 תשלומים?» ⇒ legal דחוף, בלי הצעה (מלכודת).
  · 🔴 «I'll stop by the studio on the 20th and pay in cash. thanks!» ⇒ «תודה», בלי מועד.
  · «אין לי כרגע איך לשלם» ⇒ how_to_pay + קישור (במקום אין-כסף).
  · «fifteen payments» ⇒ «לא ברור»; «טוב אז שישה» / «ok then 6 payments» (הוצעו 3) ⇒ «לא ברור» / אישור ה-3.
  · «תודה מתאים» על הצעה פתוחה ⇒ «תודה» וההצעה נשארה פתוחה.
  · 🔴 «האמת שהתחרטתי לגבי ההסדר, תבטלו אותו» אחרי אישור ⇒ הצעה חדשה.
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from app.conversation import Intent, State, detect, extract_installments, normalize, plan_retract, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

CH = pytest.mark.parametrize("ch", ["sms", "email"])


def _ctx(state="idle", ch="sms", n=0, approved=False):
    spec = {"state": state, "channel": ch}
    if n:
        spec["offered_n"] = n
    return replace(build_ctx(spec), plan_approved=approved)


# ── אותו הסדר ──
SAME = ["אולי 300 בחודש?", "can we do 300 a month?", "אשלם 300 לחודש", "אפשר 4 תשלומים?",
        "אז זה יוצא 300 לחודש נכון? אפשר 300 לחודש?"]


@CH
@pytest.mark.parametrize("text", SAME)
@pytest.mark.parametrize(("state", "approved"), [("awaiting_plan_reply", False), ("plan_pending_owner", False),
                                                 ("plan_pending_owner", True)])
def test_same_plan_no_new_plan(text, state, approved, ch):
    c = _ctx(state, ch, 4, approved)
    d = respond(text, c)
    assert d.intent == Intent.PLAN_REQUEST
    assert not d.plan, "אותו הסדר ⇒ לא נרשם הסדר חדש"
    assert "plan_same" in d.tags
    assert d.next_state == c.state
    assert d.reply and "זה בדיוק" in d.reply
    if approved:
        assert "שבתוקף" in d.reply


@CH
@pytest.mark.parametrize("text", ["אולי 200 בחודש?", "can we do 200 a month?", "אפשר 6 תשלומים?"])
def test_different_still_new_offer(text, ch):
    d = respond(text, _ctx("awaiting_plan_reply", ch, 4))
    assert d.plan and len(d.plan) == 6 and "plan_same" not in d.tags


# ── סיווג ──
DISPUTE = ["רגע מה?? אני לא חייבת 1200, הבת שלי הפסיקה את החוג באוגוסט והודעתי לכם", "אני לא חייבת.",
           "אנחנו לא חייבים 1,200 ₪", "אבל אני לא חייבת את הסכום הזה"]
NOT_DISPUTE = ["אני לא חייבת לשלם היום, נכון?", "זה לא חייב להיות היום", "אני לא חייבת להיות בבית כשאתם מתקשרים"]


@pytest.mark.parametrize("text", DISPUTE)
def test_bare_not_owe_is_dispute(text):
    assert Intent.DISPUTE in detect(text, _ctx())


@pytest.mark.parametrize("text", NOT_DISPUTE)
def test_not_owe_trap(text):
    assert Intent.DISPUTE not in detect(text, _ctx())


@pytest.mark.parametrize("text", ["החוג של עורכי הדין הצעירים היה מהמם 😍 אגב אפשר לשלם ב-3 תשלומים?",
                                  "the lawyer class was great", "חוג עורכי הדין היה מעולה, תודה"])
def test_lawyer_class_trap(text):
    assert Intent.LEGAL not in detect(text, _ctx())


@pytest.mark.parametrize("text", ["חוג עורכי הדין היה מעולה אבל אני מעבירה את זה לעורך דין",
                                  "the lawyer class was fine but my lawyer will contact you", "אני הולכת לעורך דין",
                                  "חוג עורכי הדין? נתבע אתכם"])
def test_lawyer_class_real_legal_kept(text):
    assert Intent.LEGAL in detect(text, _ctx())


@pytest.mark.parametrize("text", ["Hi, I'll stop by the studio on the 20th and pay in cash. thanks!",
                                  "I'll come by on the 20th and pay", "we'll drop by tomorrow and pay cash"])
def test_stop_by_and_pay_is_promise(text):
    assert Intent.PROMISE in detect(text, _ctx())


@pytest.mark.parametrize("text", ["I'll stop by later to say hi", "stop by anytime"])
def test_stop_by_no_pay(text):
    got = detect(text, _ctx())
    assert Intent.PROMISE not in got and Intent.OPT_OUT not in got


@pytest.mark.parametrize("text", ["אין לי כרגע איך לשלם 😔", "אין לי איך לשלם", "אין לי ממה לשלם"])
def test_no_way_to_pay_is_cant_pay(text):
    got = detect(text, _ctx())
    assert Intent.CANT_PAY in got and Intent.HOW_TO_PAY not in got


@pytest.mark.parametrize("text", ["איך לשלם?", "אין לי מושג איך לשלם", "אין לי קישור, איך לשלם?"])
def test_how_to_pay_kept(text):
    assert Intent.HOW_TO_PAY in detect(text, _ctx())


@pytest.mark.parametrize(("text", "n"), [("fifteen payments", 15), ("twelve installments please", 12),
                                         ("can i do six payments?", 6), ("twenty four payments", 24),
                                         ("4 payments", 4)])
def test_english_installment_words(text, n):
    assert extract_installments(normalize(text)) == n
    assert Intent.PLAN_REQUEST in detect(text, _ctx())


@pytest.mark.parametrize("text", ["I already made 2 payments", "I paid 2 payments last month"])
def test_made_payments_not_plan(text):
    assert extract_installments(normalize(text)) is None


@CH
@pytest.mark.parametrize(("text", "n"), [("טוב אז שישה", 6), ("ok six", 6), ("ok then 6 payments", 6),
                                         ("אוקי אז 6 תשלומים", 6)])
def test_ok_then_count_is_counter(text, n, ch):
    d = respond(text, _ctx("awaiting_plan_reply", ch, 3))
    assert d.intent == Intent.PLAN_REQUEST and len(d.plan) == n


@CH
@pytest.mark.parametrize("text", ["ok then 3 payments", "סבבה מאשרת 3 תשלומים", "ok"])
def test_ok_same_count_is_accept(text, ch):
    assert respond(text, _ctx("awaiting_plan_reply", ch, 3)).intent == Intent.PLAN_ACCEPT


@CH
@pytest.mark.parametrize("text", ["תודה מתאים", "תודה רבה, מאשרת", "thanks, ok"])
def test_thanks_then_accept(text, ch):
    d = respond(text, _ctx("awaiting_plan_reply", ch, 3))
    assert d.intent == Intent.PLAN_ACCEPT and d.next_state == State.PLAN_PENDING_OWNER


def test_thanks_alone_not_accept():
    assert respond("תודה רבה!", _ctx("awaiting_plan_reply", "sms", 3)).intent != Intent.PLAN_ACCEPT


@pytest.mark.parametrize("text", ["האמת שהתחרטתי לגבי ההסדר, תבטלו אותו בבקשה. אני אסתדר אחרת",
                                  "תבטלו אותו בבקשה", "כי התחרטתי"])
def test_retract_variants(text):
    assert plan_retract(normalize(text))


@pytest.mark.parametrize("text", ["אל תבטלו אותו", "לא לבטל אותו"])
def test_retract_negated(text):
    assert not plan_retract(normalize(text))


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr269.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_regress_mgr269(seq):
    assert run_seq(seq) == []


@CH
@pytest.mark.parametrize("text", ["i don't accept 3 payments, 6 please", "לא מאשרת 3 תשלומים, אפשר 6?"])
def test_negated_accept_not_accept(text, ch):
    d = respond(text, _ctx("awaiting_plan_reply", ch, 3))
    assert d.intent != Intent.PLAN_ACCEPT
