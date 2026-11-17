"""critic סבב 123 · באג בערוץ המייל: `strip_reply` לא הכיר את שורת הכותרת של ציטוט ב-Gmail עברית
(«בתאריך יום ג׳, 17 בנוב׳ 2026 ב-10:00 מאת שם <mail>:» — עם תווי כיווניות וללא «כתב») וב-Apple Mail עברית
(«ב-17 בנוב׳ 2026, בשעה 10:00, שם <mail> כתב/ה:»), וגם לא כותרת Gmail אנגלית שנשברה לשתי שורות.
השורה נשארה בגוף ההודעה ⇒ (1) עסק ששמו «משרד עורכי דין כהן»: לקוח שכתב «קיבלתי תודה» ⇒ legal + השהיה + דחוף;
(2) «אשלם בסוף השבוע» + כותרת אנגלית שבורה ⇒ תאריך ההבטחה נלקח מהכותרת («Nov 17») — טעות שקטה."""
import pytest

from app.channels import strip_reply
from app.conversation import Intent, respond
from evals.harness import build_ctx

GMAIL_HE = ("בתאריך יום ג׳, 17 בנוב׳ 2026 ב-10:00 מאת משרד עורכי דין כהן "
            "<office@cohen-law.co.il>:")
APPLE_HE = "ב-17 בנוב׳ 2026, בשעה 10:00, משרד עורכי דין כהן <office@cohen-law.co.il> כתב/ה:"
GMAIL_EN_WRAPPED = "On Tue, Nov 17, 2026 at 10:00 AM Cohen Law Office <\noffice@cohen-law.com> wrote:"
QUOTE = "\n> שלום, נשמח לתשלום\n> להסרה השיבו הסר"


@pytest.mark.parametrize("hdr", [GMAIL_HE, APPLE_HE, GMAIL_EN_WRAPPED])
def test_header_line_is_stripped(hdr):
    assert strip_reply("קיבלתי תודה\n\n" + hdr + QUOTE) == "קיבלתי תודה"


@pytest.mark.parametrize("hdr", [GMAIL_HE, APPLE_HE, GMAIL_EN_WRAPPED])
def test_law_firm_business_name_not_legal(hdr):
    d = respond(strip_reply("קיבלתי תודה\n\n" + hdr + QUOTE), build_ctx({"channel": "email"}))
    assert d.intent != Intent.LEGAL, d.intent


def test_header_date_not_promise_date():
    ctx = build_ctx({"channel": "email"})
    clean = respond("תודה, אשלם בסוף השבוע", ctx)
    d = respond(strip_reply("תודה, אשלם בסוף השבוע\n\n" + GMAIL_EN_WRAPPED + QUOTE), build_ctx({"channel": "email"}))
    assert d.intent == clean.intent and d.promise_date == clean.promise_date, (d.promise_date, clean.promise_date)


@pytest.mark.parametrize("text", [
    "אני לא מבין מה הוא כתב:\nתסבירו",                 # שורה של הלקוח שמסתיימת ב«כתב:» — לא כותרת (אין מייל/שנה)
    "on second thought i'll pay friday\nthanks",          # «on» בתחילת שורה של הלקוח
    "שלחו לי ל-dana@x.com בבקשה:\nתודה",
])
def test_customer_lines_kept(text):
    assert strip_reply(text) == text
