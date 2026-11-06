"""TOTP לפי RFC 6238 (SHA-1, 6 ספרות, 30 ש׳) — stdlib בלבד. שער 6: 2FA לעובדים.

טהור: אין DB ואין שעון גלובלי (הזמן מוזרק). הגנת replay: מחזירים את ה-counter שאושר,
והמתקשר שומר אותו ודוחה counter קטן-או-שווה לאחרון שנוצל."""
from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import struct
from urllib.parse import quote

STEP = 30
DIGITS = 6


def new_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _code(secret: str, counter: int) -> str:
    key = base64.b32decode(secret.upper() + "=" * (-len(secret) % 8))
    mac = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    o = mac[-1] & 0x0F
    n = (struct.unpack(">I", mac[o:o + 4])[0] & 0x7FFFFFFF) % 10**DIGITS
    return f"{n:0{DIGITS}d}"


def code_at(secret: str, ts: float) -> str:
    return _code(secret, int(ts // STEP))


def verify(secret: str, code: str, ts: float, *, last_counter: int = 0,
           window: int = 1) -> int | None:
    """counter שאושר (לשמירה כ-last_counter), או None. חלון ±1 לסטיית שעון;
    counter שכבר נוצל (<= last_counter) נדחה."""
    code = (code or "").strip().replace(" ", "")
    if len(code) != DIGITS or not code.isdigit():
        return None
    now = int(ts // STEP)
    found = None
    for c in range(now - window, now + window + 1):  # בלי break: זמן קבוע יחסית
        if hmac.compare_digest(_code(secret, c), code) and found is None:
            found = c
    return found if found is not None and found > last_counter else None


def otpauth_uri(secret: str, account: str, issuer: str = "Gabi") -> str:
    return (f"otpauth://totp/{quote(issuer)}:{quote(account)}?secret={secret}"
            f"&issuer={quote(issuer)}&digits={DIGITS}&period={STEP}")
