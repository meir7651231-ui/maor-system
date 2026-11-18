"""מנהל הפעלה 297 · «I transferred» / «transferred» באנגלית לא זוהה כטענת תשלום (נמצא ב-296 ולא תוקן, «הבא» AI).

היה: «I transferred», «transferred yesterday», «I've wired it», «I made the transfer», «transfer done» ⇒ UNKNOWN
(«❓ הודעה שלא זיהיתי»), והתזכורות ממשיכות למי שאומר ששילם. המקבילה העברית «העברתי» לבד נתפסת מזמן.
עכשיו: PAID_CLAIM ⇒ השהיה וכרטיס לבעל העסק, כמו «I paid».
לא: מושא שאינו כסף («I transferred my number/schools», «to another school»), שאלה («transferred?», «did the transfer
go through?»), שלילה («I haven't transferred», «I didn't make the transfer»), עתיד («I'll make the transfer»), ספק.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Intent, detect, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

CLAIMS = ["I transferred", "transferred", "Transferred yesterday", "I transferred yesterday", "transferred already",
          "I already transferred", "we transferred this morning", "I've transferred", "just transferred",
          "wired yesterday", "I deposited yesterday", "transferred to your account",
          "I transferred, check your account",
          "I transferred via bank", "done, transferred", "I made the transfer", "I did the transfer",
          "I did a bank transfer yesterday", "transfer done", "bank transfer sent", "I've sent the transfer",
          "Transfer was made yesterday", "the transfer went through", "Why do I need to pay? I transferred last week",
          "I'd transferred it before you sent this"]

NOT_CLAIMS = ["I haven't transferred yet", "I never transferred", "we have not transferred", "I didn't transfer",
              "I didn't make the transfer", "I haven't made the transfer yet", "did I transfer?",
              "transferred? when?",
              "has the transfer gone through?", "did the transfer go through?", "is the transfer done?",
              "the transfer wasn't done", "I'll make the transfer tomorrow", "can I make a bank transfer?",
              "how do I make a bank transfer?", "I want to make a transfer", "not sure if I transferred",
              "if I transferred it, why the reminder?", "I transferred my number to a new phone",
              "I transferred schools",
              "I transferred to a different school", "I transferred my daughter to another class",
              "my account was transferred", "transfer failed", "the transfer didn't go through",
              "I tried to transfer but it failed", "I'll have it transferred"]


@pytest.mark.parametrize("text", CLAIMS)
def test_transferred_is_paid_claim(text):
    assert Intent.PAID_CLAIM in detect(text), text


@pytest.mark.parametrize("text", NOT_CLAIMS)
def test_not_paid_claim(text):
    assert Intent.PAID_CLAIM not in detect(text), text


@pytest.mark.parametrize("text", ["I transferred yesterday", "transfer done", "I made the transfer"])
def test_respond_pauses_and_cards_owner(text):
    d = respond(text, build_ctx({"state": "idle", "channel": "sms", "total": 120000}))
    assert d.intent is Intent.PAID_CLAIM
    assert "ששילם/ה 1,200 ₪" in d.owner_summary
    assert "עצרנו את התזכורות" in d.reply


def test_hebrew_unchanged():
    assert Intent.PAID_CLAIM in detect("העברתי")
    assert Intent.PAID_CLAIM not in detect("עוד לא העברתי")


def test_sequences_through_service():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr297.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        assert run_seq(json.loads(line)) == []
