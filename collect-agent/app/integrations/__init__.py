"""שכבת אינטגרציות — SMS, מייל, הנהלת חשבונות וקישורי תשלום.

עיקרון שלב 1 (נאכף בקוד, ראו base.py):
  • בלי transport מוזרק ⇒ dry-run: נבנית הבקשה המדויקת, נשמרת לתצוגה, **אין רשת**.
  • עם transport ⇒ חייב להיות httpx.MockTransport (בדיקות). כל transport אחר ⇒ SafetyError.
  • SMTP: רק factory שמסומן is_mock=True.
  • סודות לעולם לא מופיעים בתצוגה / audit (redaction).
"""
from .base import (
                   EmailMessageOut,
                   IntegrationError,
                   ProviderError,
                   SafetyError,
                   SendResult,
                   SmsMessage,
)

__all__ = ["EmailMessageOut", "IntegrationError", "ProviderError", "SafetyError",
           "SendResult", "SmsMessage"]
