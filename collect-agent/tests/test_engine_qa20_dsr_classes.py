"""מנהל 331 — סט QA #20 (עיוור): 9 בקשות עיון/תיקון/מחיקה בציווי לא נרשמו במרשם (⇒ מועד 30 הימים של חוק הגנת
הפרטיות §13–14 לא רץ, ובעל העסק לא קיבל התראה), ושלילה חלה רק על מחיקה («לא מבקשת לעיין» נרשם עיון). וגם:
«Please do not delete my details» ⇒ הסרה לצמיתות (שלילה אנגלית לא נקראה במנוע השיחה).
המשפטים כאן הם **וריאציות** של המחלקות — לא הטקסט של הסט (שנשאר עיוור לסטים הבאים)."""
import pytest

from app.conversation import Intent, Stop, respond
from app.dsr import detect
from evals.harness import build_ctx


@pytest.mark.parametrize("text,kind", [
    ("תשלחו לנו את כל הנתונים שאתם מחזיקים עליי", "access"),
    ("אשמח לקבל את הפרטים שיש לכם אודותיי", "access"),
    ("Please email me the information you have stored about me", "access"),
    ("could you send the records you keep on me", "access"),
    ("תתקני בבקשה את הנתונים שלי, הכתובת השתנתה", "correction"),
    ("עדכנו את הפרטים שלי — עברתי דירה", "correction"),
    ("Please rectify my name, it is misspelled", "correction"),
    ("תמחקי מיד את כל הנתונים", "deletion"),
    ("תמחקו אותי לגמרי מהמערכת שלכם", "deletion"),
    ("wipe everything you hold about me", "deletion"),
    ("Remove my email address from your database", "deletion"),
    ("I invoke my right to erasure", "deletion"),
])
def test_imperative_requests_registered(text, kind):
    assert kind in detect(text)


@pytest.mark.parametrize("text", [
    "לא ביקשתי לעיין בשום מידע",
    "אין צורך לעדכן את הפרטים שלי",
    "I don't want to rectify my details, they're fine",
    "never asked you to erase my data",
    # מלכודות — לא בקשת פרטיות
    "שלחו לי את פרטי ההעברה לחשבון",
    "send me the details for the payment please",
    "עדכנו את הסכום בחשבונית",
    "I'll update my details on the website later",
    "forget me not — paying tomorrow",
    "forget about it for a week",
    "remove me from your mailing list",           # הסרה, לא מחיקה
    "המידע שיש לכם לגבי החשבונית שגוי",
])
def test_negation_and_traps_not_registered(text):
    assert detect(text) == []


def _intents(text):
    d = respond(text, build_ctx({"channel": "email"}))
    return {d.intent, *d.all_intents}, d.stop


@pytest.mark.parametrize("text", [
    "Do not delete my data please, I need the receipts",
    "please don't erase my details yet",
    "dont delete my info, I'll pay on monday",
])
def test_english_negated_delete_is_not_opt_out(text):
    found, stop = _intents(text)
    assert Intent.OPT_OUT not in found and stop != Stop.PERMANENT


@pytest.mark.parametrize("text", ["please delete my number", "delete my details now", "erase my data"])
def test_plain_delete_still_opt_out(text):
    assert Intent.OPT_OUT in _intents(text)[0]
