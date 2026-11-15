"""באג (גבי שיווק, 15.11): «חוב» אסור בתזכורות 1–2 (team/legal.md §3.1 סעיף 4). השירות בדק
`step.key not in ("friendly", "second")` — אבל השלב "second" כבר לא קיים (הוחלף ב-"plan_offer" כשהסולם ירד
ל-3). התוצאה: בתזכורת השנייה המילה «חוב» **הותרה**. עכשיו המקור יחיד: templates.debt_word_allowed(key).
+ מותגים עם מקף («בנק-לאומי», «pay-box») עקפו את רשימת ההתחזות.
"""
from pathlib import Path

import pytest

from app import compliance, templates

ROOT = Path(__file__).resolve().parents[1]


def test_debt_word_forbidden_in_first_two_reminders_only():
    keys = [s.key for s in templates.STEPS]
    assert keys == ["friendly", "plan_offer", "final"]
    assert [templates.debt_word_allowed(k) for k in keys] == [False, False, True]


def test_no_stale_step_names_in_rule_sites():
    """אף קובץ לא מחליט על «חוב» לפי שמות שלבים קשיחים — רק דרך templates.debt_word_allowed."""
    for p in [ROOT / "app/service.py", ROOT / "marketing/library/build.py"]:
        src = p.read_text(encoding="utf-8")
        assert '"second"' not in src and "not in (\"friendly\"" not in src, p.name


def test_second_reminder_with_debt_word_is_blocked():
    sms = "סטודיו נועה: דני, נשאר חוב על חשבונית 1043. לתשלום: https://pay.example/x"
    r = compliance.Rules(business="סטודיו נועה", payment_link="https://pay.example/x",
                         allow_debt_word=templates.debt_word_allowed("plan_offer"))
    assert "debt_word" in compliance.violations(sms, r)


@pytest.mark.parametrize("text", ["בנק-לאומי", "בנק - הפועלים", "Bank-Leumi", "pay-box", "פיי-בוקס"])
def test_brand_with_hyphen_blocked(text):
    v = compliance.violations("סטודיו נועה: שלום, עדכון דרך " + text, compliance.Rules(business="סטודיו נועה"))
    assert {"brand_bank", "brand_payapp"} & set(v), (text, v)
