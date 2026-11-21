"""מבקר סבב 197ג — «סוף החודש הבא» / «end of next month» ⇒ 10 בחודש הבא במקום היום האחרון שלו.

רכיב: `app/conversation.py` → `_extract_date_core` (הבדיקה «בחודש הבא|חודש הבא» ⇒ 10 בחודש רצה **לפני** הבדיקה
«בסוף|עד סוף החודש») + `_extract_date_en` (אותו כלל, «עקבי עם העברית»).
היום (8.11.2026): «אשלם עד סוף החודש הבא» ⇒ 10.12 (צריך 31.12). מאז q21-19 (56bda8ca) זה מגיע ללקוח ולבעל העסק:
התשובה «רשמנו שהתשלום צפוי עד יום חמישי 10.12», וכרטיס «בדוק ואשר: לאשר את 10.12». בעל העסק מאשר ⇒ ההשהיה
נגמרת ב-11.12 והתזכורות חוזרות שלושה שבועות לפני המועד שהלקוח הבטיח — טעות בטוחה-בעצמה, מוקדמת (כמו מנהל 255).
«בחודש הבא» לבדו ⇒ 10 (מוסכמה קיימת, qa9 q9-28) — לא משתנה. xfail(strict=True); בקרות ירוקות."""
from datetime import date

import pytest

from app.conversation import extract_date

TODAY = date(2026, 11, 8)


@pytest.mark.parametrize("t", ["אשלם עד סוף החודש הבא", "בסוף החודש הבא", "עד סוף חודש הבא",
                               "I'll pay by the end of next month"])
def test_end_of_next_month_is_last_day(t):
    assert extract_date(t, TODAY) == (date(2026, 12, 31), False)


def test_control_next_month_convention_unchanged():
    assert extract_date("אשלם בחודש הבא", TODAY) == (date(2026, 12, 10), False)
    assert extract_date("בתחילת החודש הבא", TODAY) == (date(2026, 12, 1), False)
