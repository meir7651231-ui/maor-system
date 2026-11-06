"""קישורי תשלום. כל תזכורת חייבת לכלול קישור — ורק מדומיין מזוהה (סכנת פישינג ב-SMS).

סדר עדיפויות: קישור תשלום של המסמך מחשבונית ירוקה (אם הוחזר/נוצר) ⇒ קישור קבוע של העסק
עם פרמטר חשבונית ⇒ אין קישור ⇒ התזכורת נחסמת (`no_payment_link`) עד שבעל העסק מגדיר.
"""
from __future__ import annotations

from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

DEFAULT_ALLOWED = ("greeninvoice.co.il", "morning.co")


def domain_allowed(url: str, allowed: tuple[str, ...]) -> bool:
    try:
        u = urlparse(url)
    except ValueError:
        return False
    host = (u.hostname or "").lower()
    if u.scheme != "https" or not host or u.username or u.password:
        return False
    return any(host == d or host.endswith("." + d) for d in allowed)


def with_invoice_param(url: str, number: str) -> str:
    u = urlparse(url)
    q = dict(parse_qsl(u.query))
    q.setdefault("invoice", number)
    return urlunparse(u._replace(query=urlencode(q)))


def resolve(*, doc_link: str, static_link: str, number: str,
            allowed: tuple[str, ...]) -> str | None:
    if doc_link and domain_allowed(doc_link, allowed):
        return doc_link
    if static_link and domain_allowed(static_link, allowed):
        return with_invoice_param(static_link, number)
    return None
