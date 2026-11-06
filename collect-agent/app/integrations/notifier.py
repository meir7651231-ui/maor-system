"""בחירת ערוץ + גיבוי: SMS ראשי ⇒ SMS משני (על תקלה זמנית) ⇒ מייל.

כללים:
  • לא WhatsApp (מדיניות Meta אוסרת debt collection — ראו docs/MVP-SPEC.md §0).
  • כשל לא-זמני (מספר שגוי, הרשאה) ⇒ לא מנסים ספק SMS נוסף (אותה תוצאה), עוברים למייל.
  • כשל זמני (429/5xx/timeout) ⇒ ספק SMS הבא, ואז מייל.
  • אותו idempotency_key לכל הניסיונות — כל adapter מונע כפילות אצלו.
  • ⚠️ timeout ב-SMS ⇒ ייתכן שההודעה כן נשלחה. ברירת המחדל: **לא** ממשיכים לערוץ אחר
    אחרי timeout (עדיף לפספס מאשר להציק פעמיים) — ניתן לשנות ב-failover_on_timeout.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .base import EmailMessageOut, IntegrationError, SendResult, SmsMessage


@dataclass
class Notification:
    key: str                  # idempotency, למשל "reminder:42"
    phone: str = ""
    email: str = ""
    sms_text: str = ""
    email_subject: str = ""
    email_text: str = ""
    email_html: str = ""
    unsubscribe_url: str = ""


@dataclass
class DeliveryReport:
    delivered: bool
    attempts: list[SendResult] = field(default_factory=list)

    @property
    def final(self) -> SendResult | None:
        return self.attempts[-1] if self.attempts else None

    def as_dict(self) -> dict[str, Any]:
        return {"delivered": self.delivered,
                "attempts": [{"provider": a.provider, "channel": a.channel, "ok": a.ok,
                              "dry_run": a.dry_run, "message_id": a.message_id,
                              "error": a.error, "retryable": a.retryable,
                              "duplicate": a.duplicate} for a in self.attempts]}


class Notifier:
    def __init__(self, sms: list[Any] | None = None, email: Any | None = None, *,
                 failover_on_timeout: bool = False) -> None:
        self.sms = list(sms or [])
        self.email = email
        self.failover_on_timeout = failover_on_timeout
        if not self.sms and self.email is None:
            raise IntegrationError("Notifier: לא הוגדר אף ערוץ (SMS_PROVIDER / EMAIL_PROVIDER)")

    @property
    def dry_run(self) -> bool:
        return all(getattr(a, "dry_run", True) for a in [*self.sms, self.email] if a)

    def send(self, n: Notification) -> DeliveryReport:
        rep = DeliveryReport(False)
        if n.phone and n.sms_text and self.sms:
            for ad in self.sms:
                try:
                    r = ad.send(SmsMessage(n.phone, n.sms_text, n.key))
                except IntegrationError as e:   # מספר לא נייד / הודעה ארוכה ⇒ לא ננסה SMS אחר
                    rep.attempts.append(SendResult(False, ad.provider, "sms", ad.dry_run,
                                                   error=str(e)))
                    break
                rep.attempts.append(r)
                if r.ok:
                    rep.delivered = True
                    return rep
                if "Timeout" in r.error and not self.failover_on_timeout:
                    return rep            # ייתכן שנשלח — לא מציקים בערוץ נוסף
                if not r.retryable:
                    break
        if n.email and n.email_text and self.email is not None:
            try:
                r = self.email.send(EmailMessageOut(
                    to=n.email, subject=n.email_subject or "תזכורת תשלום", text=n.email_text,
                    html=n.email_html, idempotency_key=n.key,
                    unsubscribe_url=n.unsubscribe_url))
            except IntegrationError as e:
                r = SendResult(False, self.email.provider, "email", self.email.dry_run,
                               error=str(e))
            rep.attempts.append(r)
            rep.delivered = r.ok
        return rep
