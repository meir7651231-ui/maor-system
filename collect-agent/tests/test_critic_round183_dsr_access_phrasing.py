"""critic סבב 183 · 🟡 לתיקון בונה — רכיב: `app/dsr.py` → `detect` (`_ACCESS`, אחרי `8b3b37d3`).
בקשות עיון בניסוח יומיומי עדיין לא נרשמות (אין מועד 30 יום): «what do you know about me», «show me my data»,
«אני רוצה לדעת מה אתם יודעים עליי». [מאומת: detect ⇒ [].] בקרה: «מה המידע שיש לכם עליי» ⇒ access. xfail(strict=True).
   תוקן במנהל 333: ניסוח יומיומי עם עוגן «עליי/about me/my data» — ה-xfail הוסר."""
import pytest

from app import dsr


@pytest.mark.parametrize("text", ["what do you know about me", "show me my data", "אני רוצה לדעת מה אתם יודעים עליי"])
def test_everyday_access_phrasing(text):
    assert dsr.detect(text) == ["access"]


def test_control_access_phrasing():
    assert dsr.detect("מה המידע שיש לכם עליי") == ["access"]
