"""זיהוי פרטי קשר: טלפון ישראלי ומייל. טהור, בלי תלויות — משותף ל-channels ול-integrations."""
from __future__ import annotations

import re
import unicodedata

# ---------- טלפונים ----------


def _ascii_digits(raw: str) -> str:
    """הפעלה 114: ספרות לא-לטיניות (ערביות-הודיות ٠-٩, רוחב-מלא ０-９) ⇒ ASCII.
    קודם `\\D` של re (יוניקוד) השאיר אותן כמו שהן ⇒ המספר נדחה כלא-תקין."""
    return "".join(str(unicodedata.digit(c)) if c.isdecimal() else c for c in raw)


def normalize_il_phone(raw: str) -> str | None:
    """'050-1234567' / '+972 50 1234567' / '+972 (0)50-1234567' ⇒ '972501234567'. לא-תקין ⇒ None."""
    d = re.sub(r"\D", "", _ascii_digits(raw or ""), flags=re.ASCII)
    if d.startswith("00"):
        d = d[2:]
    # הפעלה 114: קידומת בינלאומית + אפס-חיוג ('+972 (0)50…', '972-050…') ⇒ קודם נדחה כלא-תקין
    # ⇒ החייב לא קיבל SMS בשקט. מסירים את האפס רק כשהאורך מתאים בדיוק למספר ישראלי.
    if d.startswith("9720") and len(d) in (12, 13):
        d = "972" + d[4:]
    if d.startswith("0") and len(d) in (9, 10):
        d = "972" + d[1:]
    if not d.startswith("972") or len(d) not in (11, 12) or d[3] == "0":
        return None
    return d


def is_il_mobile(norm: str | None) -> bool:
    """SMS רק לנייד ישראלי (9725XXXXXXXX). קווי ⇒ מייל בלבד."""
    return bool(norm) and len(norm) == 12 and norm.startswith("9725")


def local_phone(norm: str) -> str:
    return "0" + norm[3:]


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# הפעלה 117: תווים שלא יכולים להופיע בכתובת אמיתית (בלי מרכאות) — "mailto:x@y", "<x@y>", "x@y,z@w",
# RLM/רוחב-אפס מייצוא אחר. קודם עברו את EMAIL_RE ⇒ נשלח מייל לכתובת שלא קיימת / ההסרה עוקפה.
_EMAIL_BAD_CHARS = re.compile(r"[<>(),;:\"\[\]\\\x00-\x1f\x7f\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]")


def valid_email(e: str) -> bool:
    e = e or ""
    if not EMAIL_RE.match(e) or _EMAIL_BAD_CHARS.search(e):
        return False
    local, domain = e.rsplit("@", 1)
    return not (local.startswith(".") or local.endswith(".") or ".." in e
                or domain.startswith((".", "-")) or domain.endswith((".", "-")))


_EMAIL_STRIP = re.compile("[\x00-\x1f\x7f\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]")
_EMAIL_SPLIT = re.compile(r"[\s,;|/]+")


def clean_email(v: object) -> str:
    """הפעלה 117 — מייל לקוח מקלט חיצוני (CSV/GI/iCount/EZcount/רווחית) ⇒ כתובת אחת תקינה באותיות קטנות, או "".
    "Dan@Example.COM" ⇒ "dan@example.com" · " dan@x.com " · "mailto:dan@x.com" · "דן כהן <dan@x.com>" ·
    "dan@x.com; ruth@y.com" ⇒ הראשונה התקינה · רשימה (GI emails[]) ⇒ הראשונה התקינה · RLM/רוחב-אפס מוסרים ·
    "＠" ברוחב-מלא ⇒ "@" · נקודה נגררת מוסרת. ממלא-מקום ("None", "-") / בלי כתובת ⇒ "".
    באגים שנמצאו: מייל עם רווח/כמה כתובות בתא ⇒ החייב «בלי מייל» בשקט; "mailto:…"/"<…>" עברו כ"תקינים" ⇒
    נשלח לכתובת שלא קיימת; אותיות גדולות/RLM ⇒ מפתח-הסרה אחר ⇒ מי שביקש הסרה קיבל שוב מייל."""
    if v is None or isinstance(v, bool):
        return ""
    if isinstance(v, (list, tuple)):
        for item in v:
            c = clean_email(item)
            if c:
                return c
        return ""
    s = _EMAIL_STRIP.sub("", unicodedata.normalize("NFKC", str(v)))
    bracketed = re.findall(r"<([^<>]*)>", s)
    candidates = bracketed + _EMAIL_SPLIT.split(s)
    for p in candidates:
        p = p.strip().strip("\"'()[]<>{}")
        if p.lower().startswith("mailto:"):
            p = p[7:]
        p = p.split("?", 1)[0].rstrip(".").lower()
        if valid_email(p):
            return p
    return ""
