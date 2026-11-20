"""מנהל 333 (מבקר 183 🟡): בקשות עיון בניסוח יומיומי נרשמות (מועד 30 יום לפי §13), בלי לבלוע הודעות תשלום רגילות."""
import pytest

from app import dsr


@pytest.mark.parametrize("text", [
    "what do you know about me", "What else do you guys know about me?", "what did you know about me",
    "what do you have on me", "show me my data", "send me a copy of all my personal data",
    "give me my information", "send me my data please",
    "אני רוצה לדעת מה אתם יודעים עליי", "מה אתם יודעים עלי?", "תראו לי את המידע שלי",
    "שלחו לי בבקשה את כל הנתונים עליי",
])
def test_everyday_access_registered(text):
    assert dsr.detect(text) == ["access"]


@pytest.mark.parametrize("text", [
    "show me my invoice", "send me my receipt", "show me my payment link", "what do you know about my debt",
    "מה אתם יודעים על החוב", "שלחו לי את פרטי התשלום", "תשלחו לי את החשבונית שלי",
    "what do you want from me", "I know about the payment",
])
def test_payment_messages_not_access(text):
    assert dsr.detect(text) == []


@pytest.mark.parametrize("text", ["I don't need you to show me my data", "לא צריך לשלוח לי את המידע שלי"])
def test_negated_not_registered(text):
    assert dsr.detect(text) == []
