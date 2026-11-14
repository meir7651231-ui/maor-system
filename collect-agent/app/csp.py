"""Content-Security-Policy לעמודי ה-HTML של השרת (critic סבב 70, 💡; הפעלה 193).

שלוש מדיניויות, לפי מה שכל עמוד באמת צריך:
- STRICT (ברירת מחדל לכל HTML): בלי שום סקריפט. עמודי החייב `/p/`, `/u/`, 404 — HTML+CSS בלבד, טפסי POST ל-self.
  הזרקת HTML (שם עסק/לקוח שלא ברח) לא יכולה להריץ JS ולא לשלוח טופס לשרת זר.
- inline_script_csp(html): עמודים עם סקריפט inline (`/ui`, `/connect/orbit`) — מותר **רק** הסקריפט המדויק
  שבעמוד (sha256 שלו), לא 'unsafe-inline'. סקריפט מוזרק ⇒ hash אחר ⇒ חסום.
- APP (הממשק המעוצב `/app/`, `/pay/{code}`): סקריפטים רק מ-self (ה-build של Vite, בלי inline), fetch רק ל-self.

style-src כולל 'unsafe-inline' בכל המדיניויות: העמודים משתמשים ב-<style> וב-style=; סיכון CSS לבדו נמוך.
"""
from __future__ import annotations

import base64
import hashlib
import re

_COMMON = ("frame-ancestors 'none'; form-action 'self'; object-src 'none'; "
           "img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:")

STRICT = f"default-src 'none'; base-uri 'none'; {_COMMON}"

# base-uri 'self': /pay/{code} מזריק <base href="/app/"> כדי שנתיבי ./assets היחסיים של ה-build יעבדו (main._web_index).
# 'none' שבר את העמוד (נתפס ב-e2e/csp.mjs). 'self' עדיין חוסם <base> מוזרק לדומיין זר.
APP = f"default-src 'none'; base-uri 'self'; {_COMMON}; script-src 'self'; connect-src 'self'; manifest-src 'self'"

# תוכן <script> בלי src (inline). src= ⇒ לא inline, מכוסה ע"י 'self' אם צריך.
_INLINE = re.compile(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", re.S | re.I)


def script_hashes(html: str) -> list[str]:
    return ["'sha256-" + base64.b64encode(hashlib.sha256(m.encode("utf-8")).digest()).decode() + "'"
            for m in _INLINE.findall(html)]


def inline_script_csp(html: str) -> str:
    """STRICT + הסקריפטים ה-inline של העמוד הזה בלבד (לפי sha256) + fetch ל-self.
    frame-src 'self': ה-iframe של תצוגת המייל ב-/ui הוא srcdoc (sandbox), לא טוען כלום מבחוץ."""
    hashes = " ".join(script_hashes(html))
    return (f"default-src 'none'; base-uri 'none'; {_COMMON}; script-src {hashes or chr(39) + 'none' + chr(39)}; "
            "connect-src 'self'; frame-src 'self'")


def for_path(path: str) -> str:
    """המדיניות לתשובת HTML שלא קבעה CSP בעצמה."""
    if path == "/app" or path.startswith("/app/") or path.startswith("/pay/"):
        return APP
    return STRICT
