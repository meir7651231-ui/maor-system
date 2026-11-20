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
