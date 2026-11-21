"""התנגדויות צפויות בשיחת מכירה שחייבות מענה בתסריט (sales/call-script.md) **וטענה מגובה בבדיקה** בחבילה
(sales/PACKAGE.md, שם tests/test_sales_package.py מוודא שהבדיקה קיימת):

- «המזכירה / העובדת שלי תוכל לאשר?» — נבנה ב«צוות ותפקידים» (מנהל 328–329, שער 6): כניסה אישית עם קוד אימות,
  כל אישור נרשם בשמה, ורק הבעלים מנהל את הצוות.
- «ומה אם הלקוח לא עומד בהסדר?» — מחזור-חיים להסדר (מנהל 332, מבקר 183): לקוח שמשלם לפי הלוח לא מקבל
  תזכורות; תשלום שהוחמץ ⇒ כרטיס לבעל העסק והתזכורות חוזרות.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = (ROOT / "sales/call-script.md").read_text(encoding="utf-8")
PKG = (ROOT / "sales/PACKAGE.md").read_text(encoding="utf-8")

REQUIRED = {
    "המזכירה": ["tests/test_users_2fa.py::test_mutating_actions_are_audited_under_the_employee",
                "tests/test_mgr328_team_screen.py::test_staff_cannot_change_roles_or_deactivate"],
    # מנהל 359–360 (מבקר 205–206): «אני בן 16», «אבא נפטר», מצוקה ⇒ הכול נעצר, גם תשובות שכבר אושרו;
    # סימון קטין/נפטר/חדלות פירעון ⇒ שום דבר לא יוצא. חשש צפוי של קליניקות ושל כל מי ש«לא נעים לו».
    "במצב רגיש": ["tests/test_mgr360_protective_stops_approved.py::test_dispatch_sends_nothing_after_stop",
                  "tests/test_legal_requirements.py::test_r6_owner_hold_stops_everything"],
    "לא עומד בהסדר": ["tests/test_mgr332_plan_lifecycle.py::test_missed_card_once_and_block_released",
                      "tests/test_mgr332_plan_lifecycle.py::test_on_track_stays_blocked_and_no_card"],
}


def _objections() -> list[str]:
    part = SCRIPT.split("## 4. התנגדויות")[1].split("\n## ")[0]
    return [ln for ln in part.splitlines() if ln.startswith('| "')]


def test_expected_objections_have_an_answer_in_the_script():
    rows = _objections()
    missing = [k for k in REQUIRED if not any(k in r.split("|")[1] for r in rows)]
    assert not missing, f"אין מענה בתסריט ל: {missing}"


def test_each_answer_is_backed_by_a_claim_in_the_package():
    missing = [ref for refs in REQUIRED.values() for ref in refs if f"`{ref}`" not in PKG]
    assert not missing, missing


def test_csv_wording_is_excel_csv_not_any_file():
    """גבי חיבורים, 21.11 (`3ef599b`, team/findings-integrations-2026-11-21.md): ייבוא CSV קולט כל CSV שנשמר
    מ-Excel עברי (Windows-1255, UTF-16 עם טאבים, «;»), אבל **לא כל קובץ**: למשל Windows-1252 עם מירכאות «חכמות»
    נדחה. לכן בחומרי המכירות כתוב «CSV שנשמר מ-Excel», לא «כל קובץ», והטענה נעולה לבדיקת הקידודים."""
    import re
    texts = {p: p.read_text(encoding="utf-8") for p in (ROOT / "sales").glob("*.md")}
    texts[ROOT / "team/sales.md"] = (ROOT / "team/sales.md").read_text(encoding="utf-8")
    # רשימת «מה אסור לטעון» בחבילה מצטטת את הניסוח האסור בכוונה — לא נסרקת
    pkg = texts[ROOT / "sales/PACKAGE.md"]
    head, rest = pkg.split("מה **אסור** לטעון", 1)
    texts[ROOT / "sales/PACKAGE.md"] = head + "\n## " + rest.split("\n## ", 1)[-1]
    bad = [f"{p.relative_to(ROOT)}:{n}" for p, t in texts.items() for n, ln in enumerate(t.splitlines(), 1)
           if re.search(r"CSV|אקסל|Excel", ln) and re.search(r"כל קובץ|כל פורמט|כל סוג קובץ", ln)]
    assert not bad, bad
    script = texts[ROOT / "sales/call-script.md"]
    assert re.search(r"CSV[^\n]*Excel|Excel[^\n]*CSV|אקסל[^\n]*CSV", script), "התסריט לא אומר «CSV מ-Excel»"
    assert "`tests/test_csv_import.py::test_excel_encodings_and_delimiters`" in PKG, "הטענה על CSV לא נעולה בחבילה"
