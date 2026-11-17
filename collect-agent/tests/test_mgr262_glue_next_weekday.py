"""מנהל הפעלה 262 · «הבא» מ-261: (א) הדבקת מילים כללית בכוונות מגינות, (ב) «שלישי הבא» כשהשלישי הזה עוד לפנינו.

(א) 261 תיקן רק «תפסיקולשלוחלי» בתבנית ייעודית. «תורידואותי», «איןליכסף לאוכל», «אנירוצה למות», «לאחייבת לכם כלום»,
«זהלאהמספר שלי» נשארו «לא ברור» — לקוחה שביקשה להפסיק / במצוקה / חולקת על החוב קיבלה טיפול רגיל.
פתרון: `_deglue` מפרק מילה ארוכה רק אם כולה מתפרקת למילים מאוצר מילים סגור; משמש רק לכוונות מגינות.
(ב) «אשלם ביום שלישי הבא» ביום ראשון נרשם כמועד ביום שלישי הזה (יומיים) — אם התכוונו לשבוע הבא, תזכורת לפני המועד
שהבטיחו (טעות בטוחה-בעצמה). עכשיו: מעורפל ⇒ «עד איזה תאריך?». ביום רביעי «שלישי הבא» = 24.11 (חד-משמעי, ללא שינוי).
"""
from __future__ import annotations

from datetime import date

import pytest

from app.conversation import Escalation, Intent, Stop, _deglue, detect, extract_date, normalize, respond
from evals.harness import build_ctx

CH = pytest.mark.parametrize("ch", ["sms", "email"])


def _d(t, ch="sms", state="idle"):
    return respond(t, build_ctx({"channel": ch, "state": state}))


@CH
@pytest.mark.parametrize("t", ["תורידואותי מהרשימה", "תמחקואותי", "הסירואותי", "תפסיקולהציקלי", "אנילא רוצה הודעות",
                               "תפסיקולהטריד"])
def test_glued_opt_out_general(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT, (d.intent, d.stop)


@CH
@pytest.mark.parametrize("t", ["אנירוצה למות", "איןליכסף לאוכל", "איןלימהלאכול", "אניאתאבד", "לאיכולהלחיות ככה"])
def test_glued_distress(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.DISTRESS and d.escalate == Escalation.URGENT, (d.intent, d.escalate)


@pytest.mark.parametrize("t,it", [("לאחייבת לכם כלום", Intent.DISPUTE), ("לאהזמנתי את זה", Intent.DISPUTE),
                                  ("החיובלא נכון", Intent.DISPUTE), ("זהלאהמספר שלי", Intent.WRONG_PERSON)])
def test_glued_dispute_wrong_person(t, it):
    assert it in detect(t)


@pytest.mark.parametrize("t", ["כדילשלוח", "לשלוח", "אנירוצהלשלם", "תודהרבה", "אשלםב20"])
def test_deglue_traps(t):
    """מלכודות: «כדי לשלוח» לא הופך ל«די לשלוח»; מילה שלא מתפרקת כולה לא נוגעים; הבטחה לא מגיעה מהפירוק."""
    ints = detect(t)
    assert Intent.OPT_OUT not in ints and Intent.DISTRESS not in ints and Intent.DISPUTE not in ints, ints


def test_deglue_only_full_segmentation():
    assert _deglue(normalize("תורידואותי")) == "תורידו אותי"
    assert _deglue(normalize("אנירוצהלשלם")) == normalize("אנירוצהלשלם")   # «לשלם» לא באוצר ⇒ לא נוגעים
    assert _deglue(normalize("לשלוח")) == "לשלוח"


@pytest.mark.parametrize("t,state", [("תורידואותי", "promised"), ("אנירוצה למות", "awaiting_date"),
                                     ("תפסיקולהציק", "awaiting_plan_reply")])
def test_glued_in_states(t, state):
    d = _d(t, state=state)
    assert d.intent in (Intent.OPT_OUT, Intent.DISTRESS), d.intent


SUN, MON, WED, THU = date(2026, 11, 15), date(2026, 11, 16), date(2026, 11, 18), date(2026, 11, 19)


@pytest.mark.parametrize("today", [SUN, MON])
@pytest.mark.parametrize("t", ["אשלם ביום שלישי הבא", "אשלם בשלישי הבא", "I'll pay next Tuesday"])
def test_next_weekday_same_week_is_ambiguous(t, today):
    assert extract_date(normalize(t), today) == (None, True)


@pytest.mark.parametrize("today,exp", [(WED, date(2026, 11, 24)), (THU, date(2026, 11, 24))])
@pytest.mark.parametrize("t", ["אשלם ביום שלישי הבא", "I'll pay next Tuesday"])
def test_next_weekday_after_passed_is_next_week(t, today, exp):
    assert extract_date(normalize(t), today) == (exp, False)


@pytest.mark.parametrize("t", ["אשלם ביום שלישי הקרוב", "אשלם ביום שלישי", "I'll pay on Tuesday",
                               "I'll pay this Tuesday"])
def test_weekday_without_next_unchanged(t):
    assert extract_date(normalize(t), SUN) == (date(2026, 11, 17), False)


@CH
@pytest.mark.parametrize("t", ["שלישי הבא", "ביום שלישי הבא", "next tuesday", "אשלם ביום שלישי הבא"])
def test_awaiting_date_next_weekday_reasks(t, ch):
    """harness TODAY = יום ראשון 8.11 ⇒ «שלישי הבא» מעורפל ⇒ הבטחה בלי מועד ושואלים שוב, לא «לא ברור»/בעלים."""
    d = _d(t, ch, "awaiting_date")
    assert d.intent == Intent.PROMISE and d.promise_date is None, (d.intent, d.promise_date)
    assert d.escalate == Escalation.NONE
    assert "תאריך" in (d.reply or "")


def test_idle_next_weekday_promise_asks_date():
    d = _d("אשלם ביום שלישי הבא")
    assert d.intent == Intent.PROMISE and d.promise_date is None and "תאריך" in (d.reply or "")


def test_closest_weekday_still_dated():
    d = _d("שלישי הקרוב", state="awaiting_date")
    assert d.intent == Intent.PROMISE and str(d.promise_date) == "2026-11-10"
