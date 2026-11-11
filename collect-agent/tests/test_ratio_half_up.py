"""הפעלה 129: עיגול KPI בדשבורד «חצי למעלה», זהה לממשק.

הבאג: round() של Python מעגל חצי-לזוגי — 1 מתוך 8 לקוחות שהשיבו ⇒ «12%», ממוצע איחור 2.5 ⇒ «2».
הממשק (Math.round) הראה 13% ו-3 על אותם נתונים, כלומר המוק והחי הציגו מספרים שונים.
מראה: web/src/lib/format.ts ratioHalfUp (נבדק שם מול הטבלה הזו)."""
import inspect
import re

from app import service
from app.service import ratio_half_up

# (num, den, scale) ⇒ צפוי. הטבלה מועתקת ל-web/tests/lib.check.ts
CASES = [((1, 8, 100), 13), ((5, 2, 1), 3), ((3, 2, 1), 2), ((1, 3, 100), 33), ((2, 3, 100), 67),
         ((0, 5, 100), 0), ((7, 0, 100), 0), ((249000, 249000 + 872500, 100), 22), ((5, 4, 1), 1),
         ((7, 4, 1), 2), ((1, 200, 100), 1), ((1, 201, 100), 0)]


def test_half_up_table():
    for (n, d, s), want in CASES:
        assert ratio_half_up(n, d, s) == want, (n, d, s)


def test_halves_round_up_where_python_round_went_down():
    assert round(100 * 1 / 8) == 12 and ratio_half_up(1, 8, 100) == 13
    assert round(5 / 2) == 2 and ratio_half_up(5, 2) == 3


def test_dashboard_kpis_use_half_up_not_round():
    src = inspect.getsource(service.CollectService)
    for key in ("recovery_rate_pct", "avg_days_overdue", "reply_rate_pct"):
        line = next(x for x in src.splitlines() if f'"{key}"' in x)
        assert "ratio_half_up(" in line and not re.search(r"\bround\(", line), line
