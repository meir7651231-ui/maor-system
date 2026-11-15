"""באג במסנן הניסוח (ר-1, team/legal.md §3.1 סעיף 4) — נמצא ע״י גבי שיווק (מאמר SEO «5 טעויות», 15.11):

«נעביר לעורך דין» ו«עורך הדין שלנו» **עברו** את המסנן, כי הדפוס היה `עורכ\\w* ה?דין` — וביחיד המילה
נכתבת עם כ״ף סופית (עורך), לא «עורכ». רבים («עורכי דין») ונקבה («עורכת») נחסמו; הצורה הנפוצה ביותר לא.
"""
import pytest

from app import compliance

R = compliance.Rules(business="סטודיו נועה", allow_debt_word=False)


@pytest.mark.parametrize("text", [
    "סטודיו נועה: אם לא תשלם עד מחר נעביר את זה לעורך דין.",
    "סטודיו נועה: עורך הדין שלנו יטפל בזה.",
    "סטודיו נועה: נעביר לעורך-דין",
    "סטודיו נועה: נעביר לעורכי דין",
    "סטודיו נועה: עורכת הדין תפנה אליך",
])
def test_lawyer_threat_blocked_including_final_kaf(text):
    assert "lawyer" in compliance.violations(text, R), text


@pytest.mark.parametrize("text", ["סטודיו נועה: עורך הווידאו שלנו סיים", "סטודיו נועה: עוד תזכורת קטנה"])
def test_no_false_positive(text):
    assert "lawyer" not in compliance.violations(text, R), text
