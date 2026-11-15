"""סבב 4 — מחלקות מהמדידה החיצונית של QA (15.11) + שער: אף טעות קריטית לא עוברת בשקט ב-100 ההודעות
החיצוניות. הטקסטים בבדיקות היחידה חדשים; השער רץ על הסטים החיצוניים עצמם."""
from pathlib import Path

import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx, report, run  # noqa: F401

HELDOUT = Path(__file__).parent.parent / "evals" / "heldout"
# רק סטים שכבר נמדדו ונרשמו ב-RESULTS.md נכנסים לשער. סט חיצוני חדש נשאר עיוור עד הריצה היחידה
# שלו — אחרת CI היה נשבר לכל הצוות ברגע ש-QA מוסיף סט, ומכריח כוונון לפני מדידה.
_MEASURED = (HELDOUT / "RESULTS.md").read_text(encoding="utf-8")
EXTERNAL = sorted(p for p in HELDOUT.glob("external-*.jsonl") if f"## {p.name}" in _MEASURED)


def d(text):
    return respond(text, build_ctx({}))


@pytest.mark.parametrize("text", ["זה לא אני שהזמנתי, זה הבן שלי, אבל אשלם בשבוע הבא",
                                  "לא אני ביקשתי את השירות, אבל אני אסדר את זה"])
def test_not_me_but_i_will_pay_is_not_wrong_person(text):
    r = d(text)
    assert Intent.WRONG_PERSON not in r.all_intents and r.stop != Stop.PERMANENT


@pytest.mark.parametrize("text", ["רואה החשבון ועורכת הדין שלי אמרו לי לשלם, תשלחו קישור",
                                  "דיברתי עם עורך דין והוא אמר שזה בסדר, אשלם מחר"])
def test_lawyer_advice_to_pay_is_not_legal(text):
    assert Intent.LEGAL not in d(text).all_intents


def test_lawyer_threat_still_legal():
    assert d("עורך הדין שלי ייצור איתכם קשר").intent == Intent.LEGAL


@pytest.mark.parametrize("text", ["אין לי מה לאכול החודש", "בקושי יש לנו אוכל בבית"])
def test_food_deprivation_is_urgent(text):
    assert d(text).escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["please take my number off your list", "unsubscribe me please"])
def test_english_opt_out(text):
    assert d(text).intent == Intent.OPT_OUT


@pytest.mark.parametrize("text", ["הוא החליף מספר מזמן, זה כבר לא הטלפון שלו",
                                  "אין לי שום קשר למספרה שלכם"])
def test_wrong_person_round4(text):
    assert d(text).intent == Intent.WRONG_PERSON


@pytest.mark.parametrize("text", ["אפשר לשלם בביט?", "הלינק לא עובד אצלי"])
def test_how_to_pay_round4(text):
    assert d(text).intent == Intent.HOW_TO_PAY


# סטייה מוצדקת מהציפייה של כותב הסט — לכיוון הבטוח יותר, עם נימוק. כל הוספה כאן = החלטה גלויה.
ACCEPTED = {
    "xc44": "מחלה במשפחה + תאריך ⇒ השהיה רגישה שלא משתחררת לבד (הכרעת המבקר, סבב 18, בדיקה בריפו)",
}


# כוונות "מגינות": פספוס שלהן לטובת כוונה תמימה = טעות קריטית שקטה
PROTECTIVE = {"opt_out", "wrong_person", "legal", "dispute", "distress", "minor", "paid_claim"}


# מה כל כוונה מגינה מחייבת בפועל: (עצירה מינימלית, הסלמה מינימלית)
REQUIRED = {"opt_out": ("permanent", "none"), "wrong_person": ("permanent", "none"),
            "legal": ("pause", "urgent"), "dispute": ("pause", "urgent"), "distress": ("pause", "urgent"),
            "minor": ("pause", "urgent"), "paid_claim": ("pause", "normal")}
_STOP = {"none": 0, "pause": 1, "permanent": 2}
_ESC = {"none": 0, "normal": 1, "urgent": 2}


def silent_critical(r) -> str | None:
    """טעות קריטית שעוברת בשקט = (א) כוונה אסורה הופיעה, או (ב) ההחלטה *פחות מגינה* ממה שהכוונה
    הצפויה מחייבת (עצירה חלשה יותר או הסלמה נמוכה יותר) ואינה 'לא ברור ⇒ בעל העסק'.
    תווית אחרת עם הגנה שווה או חזקה יותר (למשל חדלות פירעון ⇒ cant_pay דחוף במקום legal) אינה טעות שקטה."""
    e, dec = r.case["expect"], r.decision
    got = {i.value for i in dec.all_intents}
    if set(e.get("not", [])) & got:
        return f"forbidden {sorted(set(e.get('not', [])) & got)}"
    need = REQUIRED.get(e["intent"])
    # מחמיר (legal 15.11): "לא ברור" בלי עצירה כשהכוונה מחייבת עצירה = התזכורות ממשיכות עד שבעל העסק קורא
    if need and dec.intent.value == "unknown" and _STOP[need[0]] >= 1 and dec.stop.value == "none":
        return f"unknown without stop (expected {e['intent']} ⇒ {need[0]})"
    if need and dec.intent.value != "unknown":
        stop_ok = _STOP[dec.stop.value] >= _STOP[need[0]]
        esc_ok = _ESC[dec.escalate.value] >= _ESC[need[1]]
        if not (stop_ok and esc_ok):
            return f"{dec.intent.value} ({dec.stop.value}/{dec.escalate.value}) weaker than {e['intent']} {need}"
    return None


@pytest.mark.parametrize("path", EXTERNAL, ids=[p.name for p in EXTERNAL])
def test_external_blind_sets_have_no_silent_critical_error(path):
    """השער של היעד: על ההודעות שכתבו המבקר ו-QA — אפס טעויות קריטיות שקטות."""
    res = run(path)
    assert len(res) >= 30
    bad = [f"{r.case['id']} «{r.case['text']}» ⇒ {why}" for r in res
           if r.case.get("critical") and r.case["id"] not in ACCEPTED and (why := silent_critical(r))]
    assert bad == []


def test_unmeasured_external_set_is_not_gated(tmp_path, monkeypatch):
    """סט חיצוני חדש שעוד לא נרשם ב-RESULTS.md לא נכנס לשער (נשאר עיוור)."""
    assert all(f"## {p.name}" in _MEASURED for p in EXTERNAL)
    assert len(EXTERNAL) >= 2
