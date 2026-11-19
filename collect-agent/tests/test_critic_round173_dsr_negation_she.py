"""critic סבב 173 · 🟠 לתיקון בונה — רכיב: `app/dsr.py` → `_NEG_HE` / `_FILL_EN` (תיקון 172 ב-`902322b9`).

השלילה מזוהה רק כ-«(ו)אל/לא/אין/בלי» כמילה עצמאית. הצורה העברית הנפוצה ביותר לבקשה **שלא** לעשות — «ש**לא**
תמחקו» — לא נתפסת (הקידומת ש׳ לפני «לא» לא מותרת), וגם «אסור לכם למחוק», ובאנגלית קיצור «u» ⇒ עדיין נרשמת
**בקשת מחיקה** + התראה לבעל העסק, הפוך מרצון הלקוח (אותו נזק כמו 172). [מאומת: `dsr.detect` ⇒ ['deletion']]
  «אני מבקש שלא תמחקו את המידע שלי» · «בבקשה שלא תמחקו את הפרטים» · «חשוב לי שלא תמחקו את הנתונים» ·
  «אסור לכם למחוק את המידע שלי» · «I dont want u to delete my info».
הצעה: `(?:ו|ש|וש)?(?:אל|לא|…)`, «אסור (לכם|לך)?» כשלילה, ו-«u»/«ya» במילוי האנגלי. xfail(strict=True); הבקרות ירוקות.
   תוקן במנהל 321: קידומת ש׳/וש׳, «אסור (לכם|לך|לכן)», ו-u/ya/yall במילוי — ה-xfail הוסר."""
import pytest

from app import dsr

NEG = ["אני מבקש שלא תמחקו את המידע שלי", "בבקשה שלא תמחקו את הפרטים", "חשוב לי שלא תמחקו את הנתונים",
       "אסור לכם למחוק את המידע שלי", "I dont want u to delete my info"]
REAL = ["לא! תמחקו את המידע שלי", "אני לא לקוח שלכם, תמחקו את המידע שלי", "אל תשלחו יותר ותמחקו את הנתונים שלי",
        "no, please delete my data", "I never asked for this, delete my information"]


@pytest.mark.parametrize("text", NEG)
def test_she_lo_negation_not_a_request(text):
    assert dsr.detect(text) == []


@pytest.mark.parametrize("text", REAL)
def test_control_real_requests_still_detected(text):
    assert dsr.detect(text) == ["deletion"]
