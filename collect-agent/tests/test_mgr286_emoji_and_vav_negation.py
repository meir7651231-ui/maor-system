"""מנהל הפעלה 286 · אמוג׳י כמילות מפתח + שלילה עם ו החיבור.

🔴 «שכחתי ולא שילמתי», «סליחה ולא שילמתי עדיין», «היה לי קשה ולא שילמתי, אשלם מחר» ⇒ היה paid_claim: הלקוח
   אמר במפורש שלא שילם, והמערכת קראה «שילמתי» ועצרה את התזכורות לבירור. _NEG_BEFORE לא הכיר «ולא»/«וטרם».
🟠 «הלקוח שלי פשט רגל ולא שילם לי» (מ-285 (א)) ⇒ היה paid_claim; עכשיו cant_pay, בלי תגית חדלות (צד שלישי).
🟠 הודעה שכולה «🛑» / «⛔» / «🔕» / «📵» ⇒ היה unknown: בקשת הסרה לא כובדה. «🚫» לבד ⇒ הסרה רק מחוץ להקשר הסדר
   (שם = «לא» להצעה). «✋» / «❌» / «🙅» לבד נשארים עמומים.
🟠 מעקה יוצא: «🚨», «⚠️», «🆘», «❗❗», «!❗» לא נחסמו כלחץ (כמו «!!»).
"""
from __future__ import annotations

from datetime import date

import pytest

from app import conversation as C
from app.compliance import Rules, violations
from evals.harness import build_ctx

R = Rules(business="סטודיו")
CTX = C.Context(today=date(2026, 11, 18), business="סטודיו", customer_name="דנה כהן",
                invoices=(C.OpenInvoice("1001", 120000, "ILS", date(2026, 11, 1)),))


@pytest.mark.parametrize("text", ["שכחתי ולא שילמתי", "סליחה ולא שילמתי עדיין", "ולא שילמנו",
                                  "היה לי קשה ולא שילמתי, אשלם מחר", "הייתי בחו\"ל וטרם שילמתי",
                                  "ראיתי ועוד לא שילמתי", "קיבלתי ועדיין לא שילמתי"])
def test_vav_negation_not_paid_claim(text):
    assert C.Intent.PAID_CLAIM not in C.detect(text), text
    assert C.respond(text, CTX).intent is not C.Intent.PAID_CLAIM


@pytest.mark.parametrize("text", ["שילמתי", "קיבלתי את ההודעה ושילמתי", "שילמתי ולא קיבלתי קבלה",
                                  "לא שכחתי ושילמתי", "שילמתי אתמול בהעברה"])
def test_real_paid_claim_unchanged(text):
    assert C.Intent.PAID_CLAIM in C.detect(text), text


@pytest.mark.parametrize("text", ["הלקוח שלי פשט רגל ולא שילם לי", "הלקוח שלי פשט רגל",
                                  "הלקוח שלי פשט רגל ולא שילם לי, אז אין לי כרגע",
                                  "העבודה לא שילמה לי החודש", "המעסיק שלי עדיין ולא שילם לי"])
def test_third_party_nonpayment_is_cant_pay(text):
    d = C.respond(text, build_ctx({"state": "idle", "channel": "sms", "total": 120000}))
    assert d.intent is C.Intent.CANT_PAY, (text, d.intent)
    assert "insolvency" not in d.tags


def test_own_bankruptcy_still_insolvency():
    d = C.respond("פשטתי רגל", build_ctx({"state": "idle", "channel": "sms", "total": 120000}))
    assert "insolvency" in d.tags


@pytest.mark.parametrize("text", ["🛑", "⛔", "🔕", "📵", "🛑🛑", "🛑 🛑 🛑", "⛔️", "🛑✋", "✋🛑", "🛑📩",
                                  "🔕📱", "🛑!", "🚫", "🚫📩", "🚫🚫"])
def test_stop_emoji_only_is_optout(text):
    d = C.respond(text, CTX)
    assert d.stop == C.Stop.PERMANENT, (text, d.intent)
    assert d.next_state == C.State.OPTED_OUT


@pytest.mark.parametrize("text", ["✋", "❌", "🙅", "\U0001F645\u200d\u2640\ufe0f", "✖️", "👎", "🤐", "✅", "💸"])
def test_ambiguous_emoji_not_optout(text):
    assert C.respond(text, CTX).stop != C.Stop.PERMANENT, text


def test_prohibited_sign_in_plan_context_is_not_optout():
    ctx = build_ctx({"state": "awaiting_plan_reply", "channel": "sms", "total": 120000, "offered_n": 3})
    assert C.respond("🚫", ctx).stop != C.Stop.PERMANENT
    assert C.respond("🛑", ctx).stop == C.Stop.PERMANENT


@pytest.mark.parametrize("text", ["👍", "🙏", "שילמתי ✅", "שלום, אשלם מחר 😊"])
def test_other_emoji_unchanged(text):
    assert C.Intent.OPT_OUT not in C.detect(text)


@pytest.mark.parametrize("text", ["סטודיו: 🚨 תזכורת לחשבונית 1001", "סטודיו: ⚠️ נא לשלם", "סטודיו: ⚠ נא לשלם",
                                  "סטודיו: 🆘 נא לשלם", "סטודיו: נא לשלם ❗❗", "סטודיו: נא לשלם !❗",
                                  "סטודיו: נא לשלם ❕❕"])
def test_outbound_alarm_emoji_is_pressure(text):
    assert "pressure" in violations(text, R)


@pytest.mark.parametrize("text", ["סטודיו: שלום דנה, תזכורת ידידותית לחשבונית 1001 על סך 1,200 ₪. תודה!",
                                  "סטודיו: תודה רבה! 🙏", "סטודיו: תודה ❗", "סטודיו: תודה רבה! נשמח לעזור ⁉"])
def test_outbound_friendly_stays_clean(text):
    assert violations(text, R) == []
