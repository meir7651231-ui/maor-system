"""זיהוי פרטי קשר: טלפון ישראלי ומייל. טהור, בלי תלויות — משותף ל-channels ול-integrations."""
from __future__ import annotations

import re

# ---------- טלפונים ----------


def normalize_il_phone(raw: str) -> str | None:
    """'050-1234567' / '+972 50 1234567' ⇒ '972501234567'. לא-תקין ⇒ None."""
    d = re.sub(r"\D", "", raw or "")
    if d.startswith("00"):
        d = d[2:]
    if d.startswith("0") and len(d) in (9, 10):
        d = "972" + d[1:]
    if not d.startswith("972") or len(d) not in (11, 12):
        return None
    return d


def is_il_mobile(norm: str | None) -> bool:
    """SMS רק לנייד ישראלי (9725XXXXXXXX). קווי ⇒ מייל בלבד."""
    return bool(norm) and len(norm) == 12 and norm.startswith("9725")


def local_phone(norm: str) -> str:
    return "0" + norm[3:]


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def valid_email(e: str) -> bool:
    return bool(EMAIL_RE.match(e or ""))
