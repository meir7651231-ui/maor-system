"""טקסטים משפטיים משותפים לעמודים שהחייב רואה (ר-13). **טיוטה – לבדיקת עו"ד.**

פרטי המפעיל הם placeholder בכוונה (הכרעת מאיר 6.11): לא ממציאים שם חברה, ח.פ. או כתובת.
"""
from __future__ import annotations

import os
import re
from collections.abc import Mapping
from html import escape
from pathlib import Path

DRAFT_LABEL = "טיוטה – לבדיקת עו״ד"
PLACEHOLDER_OPERATOR = {
    "legal_name": "[שם החברה המפעילה בע״מ — placeholder]",
    "company_id": "[ח.פ. — placeholder]",
    "address": "[כתובת רשומה — placeholder]",
    "privacy_email": "[privacy@… — placeholder]",
}
# פרטי המפעיל מגיעים מהסביבה, כולם או אף אחד (legal/OPERATOR-PLACEHOLDERS.md). לא ממציאים.
OPERATOR_ENV = {"legal_name": "OPERATOR_NAME", "company_id": "OPERATOR_ID",
                "address": "OPERATOR_ADDRESS", "privacy_email": "OPERATOR_PRIVACY_EMAIL"}


def load_operator(env: Mapping[str, str]) -> dict[str, str]:
    got = {k: (env.get(v) or "").strip() for k, v in OPERATOR_ENV.items()}
    if not any(got.values()):
        return dict(PLACEHOLDER_OPERATOR)
    missing = [OPERATOR_ENV[k] for k, v in got.items() if not v]
    if missing:   # חצי-מוגדר = עמוד משפטי חצי-אמיתי. עדיף לא לעלות
        raise ValueError(f"פרטי מפעיל חלקיים — חסר: {', '.join(missing)}")
    if "@" not in got["privacy_email"]:
        raise ValueError("OPERATOR_PRIVACY_EMAIL אינו כתובת מייל")
    return got


OPERATOR = load_operator(os.environ)

# קבצים סטטיים (לא נטענים מהסביבה) שבהם פרטי המפעיל עדיין placeholder ⇒ ממלאים ידנית ביום ההקמה
_PLACEHOLDER_RX = re.compile(r"\[שם החברה|— placeholder\]|ימולאו לפני השקה")
_SCAN_GLOBS = ("legal/*.md", "marketing/**/*.html", "marketing/**/*.md", "marketing/**/*.py",
               "marketing/**/*.mjs", "web/src/**/*.tsx", "web/src/**/*.ts", "app/*.html")
_ROOT = Path(__file__).resolve().parents[1]


def static_placeholder_files(root: Path = _ROOT) -> list[str]:
    """כל קובץ סטטי שעדיין מכיל placeholder של המפעיל (בלי dist/ ו-node_modules)."""
    out = set()
    for g in _SCAN_GLOBS:
        for p in root.glob(g):
            rel = p.relative_to(root).as_posix()
            if any(x in rel for x in ("node_modules", "/dist/", "__pycache__")):
                continue
            if p.is_file() and _PLACEHOLDER_RX.search(p.read_text("utf-8", errors="ignore")):
                out.add(rel)
    return sorted(out)


def why_you_got_this(business: str) -> str:
    b = escape(business)
    return (f"קיבלתם הודעה זו כי אצל <b>{b}</b> רשומה על שמכם חשבונית פתוחה. ההודעה נשלחה מטעם "
            f"{b} באופן אוטומטי, אחרי שבעל העסק אישר אותה. היא אינה הודעה פרסומית.")


# מנהל 316: אותו טקסט ב-/u, /p ו-/pay (מקור יחיד) — כמו PRIVACY §3 (ייצוא בלי צד שלישי) ו-§3א (השהיה מגינה)
PRIVACY_ACCESS = ("בבקשת עיון תקבלו את כל המידע עליכם: הפרטים, החשבוניות, התזכורות וההודעות. "
                  "הייצוא לא כולל מידע על אדם אחר.")
PRIVACY_HOLD = ("כשהעסק מסמן קטין, פטירה, הליך חדלות פירעון או מצוקה, עמוד התשלום לא מציע תשלום, "
                "פריסה או «כבר שילמתי», ובעל העסק ייצור איתכם קשר אישית. הפסקת התזכורות נשארת זמינה תמיד.")


def privacy_html(business: str) -> str:
    b = escape(business)
    o = {k: escape(v) for k, v in OPERATOR.items()}
    return (
        '<section aria-labelledby="privacy"><h2 id="privacy" style="font-size:16px">פרטיות</h2>'
        f"<p>בעל השליטה במידע הוא <b>{b}</b>. השירות מופעל עבורו כספק עיבוד בידי {o['legal_name']} "
        f"({o['company_id']}, {o['address']}).</p>"
        "<p>המידע שבשימוש: שם, טלפון/מייל, מספר חשבונית וסכום — רק לצורך תזכורת על החשבונית "
        "הזו. איננו מוכרים או מעבירים אותו לצד שלישי למטרות אחרות, לא שולחים לכם פרסומות, "
        "לא פונים לאף אחד מלבדכם ולא מדווחים ללשכות אשראי.</p>"
        "<p>מידע על חוב שנסגר נמחק או מותמם 90 יום אחרי הסגירה, אלא אם קיימת חובה חוקית או "
        "החזקה משפטית מתועדת. בקשת הסרה נשמרת כטביעת אצבע מגובבת של הטלפון או המייל בלבד, "
        "כדי שלא נפנה שוב.</p>"
        f"<p>{escape(PRIVACY_HOLD)}</p>"
        f"<p>בקשה לעיון, לתיקון או למחיקה: לפנות ל-{b} או ל-{o['privacy_email']}. "
        f"{escape(PRIVACY_ACCESS)}</p></section>")


def draft_footer() -> str:
    # critic סבב 37: משתני העמוד (מצב כהה) עם fallback — היה #64748b קבוע ⇒ ניגודיות 3.65 בכהה
    return (f'<p style="font-size:12px;color:var(--muted,#64748b);margin-top:20px">'
            f'<span style="border:1px solid var(--line,#cbd5e1);border-radius:6px;padding:1px 6px">'
            f'{escape(DRAFT_LABEL)}</span> · {escape(OPERATOR["legal_name"])}</p>')


def privacy_points(business: str) -> dict[str, str]:
    """אותו תוכן כמו why_you_got_this + privacy_html, כטקסט נקי (בלי HTML) — לעמוד החייב ב-web
    (`/pay/{code}`), כדי שגם הוא יציג «למה קיבלתם» ופרטיות כמו `/p` ו-`/u` (ר-13). מקור יחיד."""
    o = OPERATOR
    return {
        "why": (f"קיבלתם הודעה זו כי אצל {business} רשומה על שמכם חשבונית פתוחה. ההודעה נשלחה מטעם "
                f"{business} באופן אוטומטי, אחרי שבעל העסק אישר אותה. היא אינה הודעה פרסומית."),
        "controller": (f"בעל השליטה במידע הוא {business}. השירות מופעל עבורו כספק עיבוד בידי "
                       f"{o['legal_name']} ({o['company_id']}, {o['address']})."),
        "use": ("המידע שבשימוש: שם, פרטי קשר, מספר חשבונית וסכום — רק לצורך תזכורת על החשבונית הזו. "
                "איננו מוכרים או מעבירים אותו לצד שלישי למטרות אחרות, לא שולחים לכם פרסומות, "
                "לא פונים לאף אחד מלבדכם ולא מדווחים ללשכות אשראי."),
        "retention": ("מידע על חוב שנסגר נמחק או מותמם 90 יום אחרי הסגירה, אלא אם קיימת חובה חוקית "
                      "או החזקה משפטית מתועדת. בקשת הסרה נשמרת כטביעת אצבע מגובבת בלבד, כדי שלא נפנה שוב."),
        "hold": PRIVACY_HOLD,
        "contact": f"בקשה לעיון, לתיקון או למחיקה: לפנות ל-{business} או ל-{o['privacy_email']}. {PRIVACY_ACCESS}",
        "label": f"{DRAFT_LABEL} · {o['legal_name']}",
    }
