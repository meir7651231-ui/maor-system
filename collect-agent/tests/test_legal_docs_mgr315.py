"""מנהל 315 · המסמכים המשפטיים מתעדכנים למה שהקוד עושה אחרי מנהל 309–314.

רקע: ייצוא לבקשת עיון (309/310), סינון צד שלישי בייצוא (311/312), עמוד תשלום מוסתר בהשהיה מגינה (313),
ושם עסק שמתחזה לרשות / עם תווים בלתי-נראים נחסם (314) — כולם נכנסו לקוד, אבל PRIVACY/DPA/TERMS לא אמרו
את זה (משימת «גבי משפט» ב-BACKLOG). כל טענה כאן נגזרת מהקוד: שינוי התנהגות בלי עדכון המסמך ⇒ הבדיקה נכשלת.
"""
from __future__ import annotations

import re
from pathlib import Path

from app import compliance, policy
from app.service import CollectService

ROOT = Path(__file__).resolve().parents[1]
LEGAL = ROOT / "legal"
DOCS = {n: (LEGAL / n).read_text("utf-8") for n in
        ("TERMS.md", "PRIVACY.md", "DPA.md", "LAWYER-QUESTIONS.md", "LAWYER-BRIEF.md")}
MAIN = (ROOT / "app" / "main.py").read_text("utf-8")

# כל סיבת השהיה שמסתירה תשלום בעמוד החייב ⇒ המילה שבה המסמכים קוראים לה
HOLD_WORDS = {"minor": "קטין", "deceased": "פטירה", "insolvency": "חדלות פירעון", "distress": "מצוקה"}


def _section(doc: str, start: str, length: int = 900) -> str:
    i = doc.index(start)
    return doc[i:i + length]


def test_export_route_documented_in_dpa():
    assert '"/customers/{cid}/data"' in MAIN
    sec = _section(DOCS["DPA.md"], "9.1א")
    assert "GET /customers/{cid}/data" in sec and "ייצוא מידע" in sec


def test_export_hides_third_party_and_docs_say_so():
    hidden = CollectService._EXPORT_CUSTOMER_HIDE
    assert {"blocked_phone", "blocked_email"} <= hidden
    assert "צד שלישי" in _section(DOCS["DPA.md"], "9.1א")
    assert "לא כולל מידע על אדם אחר" in DOCS["PRIVACY.md"]
    assert "בלי מידע על צד שלישי" in DOCS["TERMS.md"]


def test_no_single_customer_erase_route_matches_dpa():
    """DPA 9.1ב אומר שאין מחיקה פרטנית. נוסף נתיב מחיקה ⇒ לעדכן את 9.1ב ואת שאלה 35."""
    assert not re.search(r'@app\.delete\(\s*"/customers', MAIN)
    assert "אין כיום במערכת מחיקה פרטנית" in DOCS["DPA.md"]
    assert re.search(r"^35\. \*\*מחיקה ללקוח בודד", DOCS["LAWYER-QUESTIONS.md"], re.M)


def test_landing_hold_reasons_documented():
    assert set(policy.LANDING_HOLDS) == set(HOLD_WORDS), "סיבת השהיה חדשה ⇒ להוסיף ל-PRIVACY §3א ול-DPA 2.3"
    priv = _section(DOCS["PRIVACY.md"], "**בזמן השהיה בגלל", 300)
    dpa = _section(DOCS["DPA.md"], "בזמן השהיה בגלל", 300)
    for word in HOLD_WORDS.values():
        assert word in priv and word in dpa, word
    assert "עמוד התשלום" in priv and "הפסקת התזכורות נשארת זמינה תמיד" in priv


def test_business_name_rules_documented_in_terms():
    clause = _section(DOCS["TERMS.md"], "4.5", 400)
    for name in ("מס הכנסה", "ביטוח לאומי"):
        assert "brand_authority" in compliance.business_name_violations(name), name
        assert name in clause, name
    assert "invisible_chars" in compliance.business_name_violations("בנק​לאומי")
    assert "תווים בלתי-נראים" in clause


def test_lawyer_question_count_in_brief():
    nums = [int(n) for n in re.findall(r"^(\d+)\. \*\*", DOCS["LAWYER-QUESTIONS.md"], re.M)]
    assert f"(כל השאלות, {max(nums)})" in DOCS["LAWYER-BRIEF.md"]
