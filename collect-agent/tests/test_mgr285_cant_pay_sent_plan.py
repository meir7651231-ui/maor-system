"""מנהל הפעלה 285 · cant_pay על הסדר שכבר נשלח (פתוח מ-277 (א)).

היה: «אין לי כסף» אחרי שבעל העסק אישר ושלח הסדר ⇒ cant_pay ראשי ⇒ המנוע הציע ללקוח **שוב את אותו הסדר**
(«אפשר לפרוס… 3 תשלומים של 400», כאילו לא נשלח) ונרשם proposed זהה ליד ה-approved — שני הסדרים חיים.
באנגלית «I can't afford it» כבר נקרא דחייה. עכשיו: קושי בלי הצעה נגדית/אישור על הצעה שנשלחה ⇒ דחייה (ההסדר
נסגר, כרטיס לבעל העסק), cant_pay משני. מצב רגיש (אשפוז/אבל/חדלות/מילואים) ⇒ cant_pay ראשי עם התשובה האמפתית
(היה באנגלית: «בסדר גמור. נחזור אליכם» ללקוח בבית חולים), וההסדר לא נדחה (rm276-13).
גם: «פשטתי רגל» (פועל) ⇒ היה «לא ברור» / הצעת פריסה; עכשיו חדלות-פירעון דחוף. «הלקוח שלי פשט רגל» ≠ חדלות.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx
from evals.sequences import run_seq


def _d(text, state="awaiting_plan_reply"):
    spec = {"state": state, "channel": "sms", "total": 120000}
    if state != "idle":
        spec["offered_n"] = 3
    return respond(text, build_ctx(spec))


@pytest.mark.parametrize("text", ["אין לי כסף", "אין לי כסף לשלם את זה עכשיו", "אין לי כרגע איך לשלם",
                                  "אני מובטלת ואין לי כסף", "I can't pay", "I can't afford it"])
def test_cant_pay_on_sent_offer_is_reject_not_same_offer(text):
    d = _d(text)
    assert d.intent is Intent.PLAN_REJECT
    assert Intent.CANT_PAY in d.all_intents
    assert not d.plan
    assert "אפשר לפרוס" not in (d.reply or "")


@pytest.mark.parametrize("text", ["אני בבית חולים ואין לי כסף", "I'm in hospital and can't pay",
                                  "פשטתי רגל, אין לי איך לשלם", "אני במילואים ואין לי כסף"])
def test_sensitive_keeps_cant_pay_primary(text):
    d = _d(text)
    assert d.intent is Intent.CANT_PAY
    assert not d.plan
    assert "בסדר גמור" not in (d.reply or "")


@pytest.mark.parametrize("text", ["אני בבית חולים ואין לי כסף", "פשטתי רגל, אין לי איך לשלם"])
def test_sensitive_hebrew_does_not_reject_plan(text):
    assert Intent.PLAN_REJECT not in _d(text).all_intents


def test_counter_offer_still_counter():
    d = _d("אין לי כסף, אפשר ב-6?")
    assert d.intent is Intent.PLAN_REQUEST and len(d.plan) == 6


def test_idle_unchanged():
    d = _d("אין לי כסף", "idle")
    assert d.intent is Intent.CANT_PAY and d.plan


@pytest.mark.parametrize("text", ["פשטתי רגל", "פשטנו רגל לפני חודש", "אני פושטת רגל", "הכריזו עליי פושט רגל"])
def test_bankrupt_verb_is_insolvency(text):
    d = _d(text, "idle")
    assert d.intent is Intent.CANT_PAY
    assert "insolvency" in d.tags and d.escalate is Escalation.URGENT
    assert not d.plan


def test_third_party_bankrupt_not_insolvency():
    assert "insolvency" not in _d("הלקוח שלי פשט רגל ולא שילם לי", "idle").tags


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr285.jsonl"


@pytest.mark.parametrize("seq", [json.loads(line) for line in SEQ.read_text(encoding="utf-8").splitlines()
                                 if line.strip()], ids=lambda s: s["id"])
def test_regress_sequences(seq):
    assert run_seq(seq) == []
