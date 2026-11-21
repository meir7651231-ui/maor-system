"""מנהל 355 · מבקר 202 — תקיפת `_REF_DATED` (רשימת 201) + הרחבה.

לפני: «אשלם ב-15 על חשבונית 1234 מ-1.11», «...לגבי החיוב/התשלום/המכתב/השיחה/הטיפול מ-1.11», «...לגבי ההודעה ששלחתם
ב-1.11» ⇒ ללקוח «צפוי עד 1.11.2027». ו«אשלם את החשבונית מה-15.11» (היום 8.11) ⇒ התאריך נמחק ⇒ «עד מתי?» סתם.
עכשיו: מספר מסמך, עוד שמות, משפט זיקה — נמחקים; תאריך-«הפניה» בעתיד הקרוב (≤45 יום) נשאר מועד."""
from datetime import date

import pytest

from app import conversation as cv

TODAY = date(2026, 11, 8)


def _req(text, today=TODAY):
    d = cv.respond(text, cv.Context(business="סטודיו", today=today))
    return getattr(d, "requested_date", None) or d.promise_date


@pytest.mark.parametrize("text", [
    "אשלם ב-15 על חשבונית 1234 מ-1.11",
    "אשלם ב-15 על חשבונית מספר 1234 מ-1.11",
    "אשלם ב-15 לגבי החיוב מ-1.11",
    "אשלם ב-15 לגבי התשלום מ-1.11",
    "אשלם ב-15 לגבי הדרישה מ-1.11",
    "אשלם ב-15 לגבי המכתב מ-1.11",
    "אשלם ב-15 לגבי השיחה מ-1.11",
    "אשלם ב-15 לגבי הטיפול מ-1.11",
    "אשלם ב-15 לגבי הפגישה מ-1.11",
    "אשלם ב-15 לגבי ההודעה ששלחתם ב-1.11",
    "אשלם ב-15 לגבי ההודעה שקיבלתי ב-1.11",
    "אשלם ב-15 לגבי החשבונית מ-1/11",
    "I'll pay on 15.11 for the order from 1.11",
    "I'll pay on the 15th for invoice #1234 from 1.11",
])
def test_reference_date_stripped(text):
    assert _req(text) == date(2026, 11, 15)


@pytest.mark.parametrize(("text", "want"), [
    ("אשלם את החשבונית מה-15.11", date(2026, 11, 15)),   # עתיד קרוב = מועד, לא הפניה
    ("אשלם את ההזמנה של 3.12", date(2026, 12, 3)),
    ("אשלם את החשבונית ב-15.11", date(2026, 11, 15)),
    ("אשלם מחר לגבי החשבונית מ-1.11", date(2026, 11, 9)),
])
def test_near_future_kept(text, want):
    assert _req(text) == want


def test_year_boundary_reference_from_december():
    # 5.1: «מ-20.12» = דצמבר שעבר (הפניה), לא 20.12.2027
    assert _req("אשלם ב-15 לגבי החשבונית מ-20.12", today=date(2027, 1, 5)) == date(2027, 1, 15)


@pytest.mark.parametrize(("rd", "want"), [
    ("1.11", False), ("15.11", True), ("8.11", False), ("23.12", True), ("24.12", False),
    ("1.11.2026", False), ("20.11.26", True), ("31.2", False),
])
def test_near_future_rule(rd, want):
    assert cv._ref_is_near_future(rd, TODAY) is want


@pytest.mark.parametrize(("text", "want"), [
    ("החשבונית מ-1.11 תשולם ב-15", date(2026, 11, 15)),
    ("הכסף יועבר ב-15", date(2026, 11, 15)),
    ("זה ישולם עד ה-20", date(2026, 11, 20)),
])
def test_passive_promise_keeps_date(text, want):
    assert _req(text) == want
