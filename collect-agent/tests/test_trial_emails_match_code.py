"""רצף מיילי הניסיון (marketing/emails-trial.md) נעול לקוד הניסיון.

הרצף מצטט את הקוד (`Settings.trial_days`, `service.trial()`, `_notify_trial_ending`) ובונה עליו הבטחות:
14 יום · מייל 6 ביום 11 = «3 ימים לפני הסוף» · «התזכורות נעצרות, הנתונים נשמרים, לא יבוצע חיוב אוטומטי»
(«זהה בתוכן להודעה הפנימית trial_ending») · מייל 7 ביום 15 = «הניסיון הסתיים והתזכורות נעצרו». עד עכשיו
שום דבר לא בדק שהקוד עדיין אומר את זה. נועל: ספירת הימים מול trial() (יום 0 = ההרשמה), ההודעה הפנימית
מכילה את שלוש ההבטחות, והשמות שהמסמך מצטט קיימים.
"""
import inspect
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

ROOT = Path(__file__).resolve().parents[1]
EMAILS = (ROOT / "marketing/emails-trial.md").read_text(encoding="utf-8")
START = date(2026, 11, 1)   # יום 0 = יום ההרשמה


def _trial_on(day: int) -> dict:
    from app.config import load_settings
    from app.db import DB
    from app.demo import FixedClock
    from app.service import CollectService
    s = load_settings({"BUSINESS_NAME": "סטודיו נועה", "TRIAL_START": START.isoformat(),
                       "PAYMENT_LINK_MODE": "static", "PAYMENT_LINK": "https://pay.example/x",
                       "PAYMENT_DOMAINS": "pay.example"})
    now = datetime.combine(START + timedelta(days=day), datetime.min.time(), ZoneInfo("Asia/Jerusalem"))
    return CollectService(s, DB(":memory:"), clock=FixedClock(now.replace(hour=9))).trial()


def _email_day(n: int) -> int:
    return int(re.search(rf"^## {n} · יום (\d+)", EMAILS, re.M).group(1))


def test_cited_code_names_exist():
    from app import service
    from app.config import Settings
    assert Settings().trial_days == 14 and "14 יום" in EMAILS
    assert callable(service.CollectService.trial) and callable(service.CollectService._notify_trial_ending)
    for cited in ("`Settings.trial_days`", "`service.trial()`", "`_notify_trial_ending`", "`trial_ending`"):
        assert cited in EMAILS, cited


def test_email_6_is_sent_when_the_internal_warning_starts():
    from app.service import TRIAL_WARN_DAYS
    d6 = _email_day(6)
    assert f"({TRIAL_WARN_DAYS} ימים לפני הסוף)" in EMAILS and f"בעוד {TRIAL_WARN_DAYS} ימים" in EMAILS
    assert _trial_on(d6)["ending_soon"] is True and _trial_on(d6)["days_left"] == TRIAL_WARN_DAYS
    assert _trial_on(d6 - 1)["ending_soon"] is False, "המייל יוצא לפני שהמערכת עצמה מזהירה"


def test_email_7_day_the_trial_really_ended():
    d7 = _email_day(7)
    assert "הניסיון הסתיים והתזכורות נעצרו" in EMAILS
    assert _trial_on(d7)["active"] is False and _trial_on(d7 - 2)["active"] is True


@pytest.mark.parametrize("promise", ["התזכורות נעצרות", "הנתונים", "נשמרים", "לא יבוצע חיוב אוטומטי"])
def test_email_6a_says_what_the_internal_message_says(promise):
    from app.service import CollectService
    internal = inspect.getsource(CollectService._notify_trial_ending)
    six_a = EMAILS[EMAILS.index("**6א"):EMAILS.index("**6ב")]
    assert promise in internal, f"ההודעה הפנימית כבר לא אומרת «{promise}» — מייל 6א מבטיח את זה"
    assert promise in six_a


def test_header_promises_match_code():
    head = EMAILS[:EMAILS.index("## ⚖️")]
    assert "התזכורות נעצרות, הנתונים נשמרים, ואין חיוב אוטומטי" in head
    assert "3 ימים לפני הסוף" in head
