"""הצעת הסדר תשלומים — טהור. ללא ריבית/הצמדה בשלב MVP (ריבית ⇒ סיכון "אשראי" רגולטורי)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

MIN_INSTALLMENT_AGOROT = 100_00   # 100 ₪
MAX_INSTALLMENTS = 6


@dataclass(frozen=True)
class Installment:
    n: int
    due: date
    amount_agorot: int


def _add_months(d: date, k: int) -> date:
    m = d.month - 1 + k
    y, m = d.year + m // 12, m % 12 + 1
    import calendar

    return date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def propose(total_agorot: int, start: date, requested: int | None = None) -> list[Installment]:
    if total_agorot <= 0:
        raise ValueError("סכום חייב להיות חיובי")
    max_by_min = max(1, total_agorot // MIN_INSTALLMENT_AGOROT)
    n = min(requested or 3, MAX_INSTALLMENTS, max_by_min)
    n = max(n, 1)
    base, rem = divmod(total_agorot, n)
    # השארית לתשלום הראשון ⇒ הסכום תמיד מדויק לאגורה
    return [Installment(i + 1, _add_months(start, i), base + (rem if i == 0 else 0))
            for i in range(n)]
