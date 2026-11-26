"""מבקר 261ℹ️ (גבי מנוע): «שילמתי» מלקוח בלי חשבונית פתוחה ⇒ הסיכום היה «דנה כהן טוען/ת ששילם/ה . התזכורות…»
(סכום ריק + רווח לפני נקודה). עכשיו: נוסח מלא; עם חוב פתוח — הסכום כרגיל."""
from dataclasses import replace

from app.conversation import respond
from evals.harness import build_ctx


def test_paid_claim_summary_without_open_invoice():
    ctx = replace(build_ctx({"channel": "sms"}), invoices=())
    s = respond("שילמתי אתמול בהעברה", ctx).owner_summary
    assert "ששילם/ה ." not in s and "אין כרגע חשבונית פתוחה" in s


def test_paid_claim_summary_with_amount_unchanged():
    s = respond("שילמתי אתמול בהעברה", build_ctx({"channel": "sms"})).owner_summary
    assert "1,200" in s and "אין כרגע חשבונית" not in s
