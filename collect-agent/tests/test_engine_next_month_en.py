"""ביקורת qa9 (q9-28, RESULTS): «בחודש הבא» ⇒ 10 בחודש, אבל «next month» ⇒ 1 בחודש — אותה בקשה, מועד שונה
לפי שפה. עכשיו עקבי: חודש-הבא סתם ⇒ 10; «בתחילת/beginning/start/early» ⇒ 1."""
from datetime import date

import pytest

from app.conversation import extract_date

T = date(2026, 11, 8)


@pytest.mark.parametrize("text,day", [("I'll pay next month", 10), ("בחודש הבא", 10), ("beginning of next month", 1),
                                      ("start of next month", 1), ("early next month", 1), ("בתחילת החודש הבא", 1)])
def test_next_month_same_in_both_languages(text, day):
    assert extract_date(text, T)[0] == date(2026, 12, day)


def test_december_rolls_year():
    assert extract_date("next month", date(2026, 12, 20))[0] == date(2027, 1, 10)
