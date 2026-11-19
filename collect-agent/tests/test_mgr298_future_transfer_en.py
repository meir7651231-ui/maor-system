"""מנהל הפעלה 298 · עתיד של «transfer» באנגלית ⇒ הבטחה (נמצא ב-297 ולא תוקן, «הבא» AI).

היה: «I'll make the transfer tomorrow», «I will do the transfer on Sunday», «we'll make the payment on Friday»,
«I'm going to make the transfer», «I'll have it transferred» ⇒ UNKNOWN (בלי מועד, «❓ לא זיהיתי»).
🔴 נמצא בדרך: «I'll pay when I get paid», «I'll transfer when I get paid», «I'll get the transfer done (tomorrow)»,
«I'll make the transfer when I get paid» ⇒ PAID_CLAIM — מי שרק *מבטיח* נרשם כ«טוען ששילם», התזכורות נעצרו
וכרטיס «ששילם/ה 1,200 ₪» עלה לבעל העסק. «paid» ב«when I get paid» = המשכורת של הלקוח.
עכשיו: הבטחה (עם מועד כשיש). טענת תשלום נבדקת על הטקסט בלי קטעי העתיד/המשכורת — «I paid, I'll send the receipt»
נשאר טענה.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Intent, detect, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

PROMISES = ["I'll make the transfer tomorrow", "I will do the transfer on Sunday",
            "I'll do the bank transfer next week",
            "we'll make the transfer on Friday", "I'll make the payment tomorrow", "I'll make a payment on Monday",
            "I'll do the transfer", "I'll make the transfer",
            "I'm going to make the transfer tomorrow",
            "gonna do the transfer tomorrow", "I'll make the transfer by the 20th",
            "I'll get the transfer done tomorrow",
            "I'll make the transfer when I get paid", "I'll have it transferred", "I'll have it transferred tomorrow",
            "I'll pay when I get paid", "I'll transfer when I get paid", "I'll get the transfer done",
            "I'll pay it when I get paid on the 10th", "we're going to make the bank transfer this week",
            "I'll definitely make the transfer tomorrow", "I'll make the transfer tomorrow, how do I do it?",
            "I'll make the transfer tomorrow if you send the invoice", "I'll set up the transfer tonight"]

# מנהל 303: «when I get paid» לבד = הבטחה מעורפלת (test_mgr303); השאלה «when I get paid?» עדיין לא
NOT_PROMISES = ["I won't make the transfer tomorrow", "I'll make the transfer tomorrow?",
                "should I make the transfer tomorrow?",
                "I'll make the transfer to my son tomorrow", "I'll do the transfer of my number tomorrow",
                "I don't think I'll make the transfer", "when I get paid?", "I'll never make the transfer"]

STILL_CLAIMS = ["I paid, I'll send the receipt", "I already paid. I'll send you the confirmation tomorrow",
                "I made the transfer yesterday, I'll send a screenshot", "I got paid today so I paid you",
                "I transferred yesterday", "transfer done", "I made the transfer"]


def _ctx():
    return build_ctx({"state": "idle", "channel": "sms", "total": 120000})


@pytest.mark.parametrize("text", PROMISES)
def test_future_transfer_is_promise_not_claim(text):
    got = detect(text, _ctx())
    assert Intent.PROMISE in got, (text, got)
    assert Intent.PAID_CLAIM not in got, (text, got)


@pytest.mark.parametrize("text", NOT_PROMISES)
def test_not_promise(text):
    got = detect(text, _ctx())
    assert Intent.PROMISE not in got, (text, got)
    assert Intent.PAID_CLAIM not in got, (text, got)


@pytest.mark.parametrize("text", STILL_CLAIMS)
def test_real_claims_unchanged(text):
    assert Intent.PAID_CLAIM in detect(text, _ctx()), text


@pytest.mark.parametrize("text,iso", [("I'll make the transfer tomorrow", "2026-11-09"),
                                      ("we'll make the transfer on Friday", "2026-11-13"),
                                      ("I'll make the transfer by the 20th", "2026-11-20"),
                                      ("I'll pay it when I get paid on the 10th", "2026-11-10")])
def test_respond_records_promise_date(text, iso):
    d = respond(text, _ctx())
    assert d.intent is Intent.PROMISE
    assert d.promise_date is not None and d.promise_date.isoformat() == iso
    assert "ששילם" not in d.owner_summary


@pytest.mark.parametrize("text", ["I'll pay when I get paid", "I'll get the transfer done"])
def test_no_paid_card_for_promise(text):
    d = respond(text, _ctx())
    assert d.intent is Intent.PROMISE
    assert "עצרנו את התזכורות" not in (d.reply or "")
    assert "ששילם" not in d.owner_summary


def test_hebrew_unchanged():
    assert Intent.PROMISE in detect("אעביר מחר", _ctx())
    assert Intent.PAID_CLAIM in detect("העברתי", _ctx())


def test_sequences_through_service():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr298.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        assert run_seq(json.loads(line)) == []
