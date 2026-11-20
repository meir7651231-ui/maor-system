"""תשובות «שאלות» בדפי הענף (marketing/landing/for) — כל טענה רצה מול השירות האמיתי.

דף השאלות הנפוצות הראשי נעול לקוד (test_faq_page), אבל 8 התשובות בדפי הענף נכתבו ביד ולא נבדקו. כך כבר
נתפסה אחת שקרית («ואפשר לערוך», f071c3c3). כאן כל תשובה מקבלת בדיקה מול השירות, באותה בנייה שבה מחולל
הדפים מייצר את דוגמת ה-SMS (נתוני בטא בדויים, dry-run):
  מספרות · עסקי עם קווי ⇒ מייל במקום SMS; בלי נייד ובלי מייל ⇒ נחסם (no_contact), לא מנחשים
  מוסכים · לקוח עסקי ⇒ מייל עם מספר החשבונית והסכום · יותר מ-3 תזכורות ⇒ לא
  קליניקות · ההודעה = שם העסק, מספר, סכום, קישור — בלי תיאור החשבונית · «הורי איתי» נשמר
  לקוחות רו״ח · פריסה בלי ריבית ובלי תוספת · גבי קורא בלבד
"""
import importlib.util
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FOR = ROOT / "marketing/landing/for"
spec = importlib.util.spec_from_file_location("forbuild", FOR / "build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def _faq(vertical: str) -> dict[str, str]:
    return dict(build.COPY[vertical]["faq"])


def _svc(vertical="barber"):
    """אותה בנייה כמו build.sample_sms — שירות אמיתי על mock של חשבונית ירוקה."""
    mock = build.GreenInvoiceMock(api_id=build.DEMO_ID, api_secret=build.DEMO_SECRET, docs=build.beta_docs(vertical),
                            deliver=lambda url, payload: None)
    gi = build.GreenInvoiceClient(build.SANDBOX, build.DEMO_ID, build.DEMO_SECRET,
                                  transport=build.httpx.MockTransport(mock.handler))
    s = build.load_settings({"BUSINESS_NAME": build.beta_business(vertical), "SMS_SENDER_ID": "GabiDemo",
                             "PAYMENT_LINK_MODE": "static", "PAYMENT_LINK": build.DEMO_PAY_LINK,
                             "PAYMENT_DOMAINS": "pay.example", "EMAIL_FROM": "gabi@example.com",
                             "EMAIL_REPLY_TO": "owner@example.com", "TRIAL_START": "2026-11-03",
                             "PUBLIC_BASE_URL": f"https://{build.DOMAIN}"})
    svc = build.CollectService(s, build.DB(":memory:"), gi=gi, clock=build.FixedClock(build.DEMO_NOW))
    svc.sync()
    return svc


def _messages(svc, phone: str, email: str, name: str | None = None):
    inv = svc.db.one("SELECT * FROM invoices WHERE status='open' ORDER BY id LIMIT 1")
    svc.db.x("UPDATE customers SET phone=?, email=? WHERE id=?", (phone, email, inv["customer_id"]))
    if name:
        svc.db.x("UPDATE customers SET name=? WHERE id=?", (name, inv["customer_id"]))
    cust = svc.db.one("SELECT * FROM customers WHERE id=?", (inv["customer_id"],))
    return inv, svc.build_messages([inv], cust, 0, build.DEMO_PAY_LINK)


def test_the_answers_tested_here_are_the_ones_on_the_pages():
    t = (FOR / "build.py").read_text(encoding="utf-8")
    for phrase in ("גבי שולח לו מייל במקום SMS", "התזכורת נחסמת ולא מנחשים", "יכולה לצאת במייל למנהלת החשבונות",
                   "אחרי 3 גבי עוצר", "שום תיאור טיפול מהחשבונית לא יוצא", "«שלום הורי איתי»",
                   "בלי ריבית ובלי תוספת", "קורא ממערכת החשבוניות בלבד"):
        assert phrase in t, f"התשובה «{phrase}» השתנתה בדף — לעדכן גם את הבדיקה"


def test_barber_landline_business_gets_email_not_sms():
    _, (msgs, why) = _messages(_svc(), "03-6123456", "office@example.com")
    assert why is None and [m.channel for m in msgs] == ["email"]


def test_barber_no_mobile_no_email_is_blocked_not_guessed():
    from app.service import HARD_BLOCKS
    _, (msgs, why) = _messages(_svc(), "03-6123456", "")
    assert msgs == [] and why == "no_contact" and "no_contact" in HARD_BLOCKS


def test_garage_business_email_has_invoice_number_and_amount():
    inv, (msgs, _) = _messages(_svc("garage"), "", "books@fleet.example")
    mail = next(m for m in msgs if m.channel == "email")
    assert inv["number"] in mail.body and re.search(r"\d[\d,]*", mail.body)


def test_garage_no_more_than_three():
    from app import policy, templates
    assert policy.MAX_REMINDERS_PER_INVOICE == 3 == len(templates.STEPS)


def test_clinic_message_has_no_invoice_description():
    svc = _svc("clinic")
    inv = svc.db.one("SELECT * FROM invoices WHERE status='open' ORDER BY id LIMIT 1")
    # הערובה מבנית: תיאור/פריטי החשבונית לא נשמרים בכלל ⇒ אין ממה לדלוף להודעה
    cols = {r["name"] for r in svc.db.q("PRAGMA table_info(invoices)")}
    assert not cols & {"description", "items", "income", "remarks", "subject"}, cols
    _, (msgs, _) = _messages(svc, "0501234567", "p@example.com")
    assert msgs and all("טיפול" not in m.body for m in msgs)
    sms = next(m for m in msgs if m.channel == "sms")
    assert build.beta_business("clinic") in sms.body and inv["number"] in sms.body and "/p/" in sms.body


def test_clinic_parent_greeting_kept():
    _, (msgs, _) = _messages(_svc("clinic"), "0501234567", "", name="הורי איתי")
    assert "שלום הורי איתי," in next(m for m in msgs if m.channel == "sms").body


def test_cpa_plan_without_interest():
    from datetime import date

    from app import plans
    for total in (100_00 * 7, 3_450_50, 12_000_00):
        inst = plans.propose(total, date(2026, 11, 20))
        assert sum(i.amount_agorot for i in inst) == total


def test_cpa_read_only_source():
    assert "def test_adapters_are_read_only_static" in (ROOT / "tests/test_invoice_sources.py").read_text("utf-8")


@pytest.mark.parametrize("v", ["barber", "garage", "clinic", "cpa"])
def test_every_vertical_faq_answer_has_a_test_here(v):
    """כל תשובה בכל דף ענף מכוסה ברשימה למעלה — תשובה חדשה בלי בדיקה ⇒ נכשל."""
    answers = _faq(v)
    assert answers, f"{v}: לא נמצאו שאלות (מבנה build.py השתנה?)"
    covered = ("מייל במקום SMS", "במייל למנהלת החשבונות", "אחרי 3 גבי עוצר", "שום תיאור טיפול",
               "שלום הורי איתי", "בלי ריבית ובלי תוספת", "קורא ממערכת החשבוניות בלבד",
               "אתה רואה ומאשר כל הודעה")
    for q, a in answers.items():
        assert any(c in a for c in covered), f"{v}: «{q}» — תשובה בלי בדיקה מול הקוד"
