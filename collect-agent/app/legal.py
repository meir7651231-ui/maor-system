"""טקסטים משפטיים משותפים לעמודים שהחייב רואה (ר-13). **טיוטה – לבדיקת עו"ד.**

פרטי המפעיל הם placeholder בכוונה (הכרעת מאיר 6.11): לא ממציאים שם חברה, ח.פ. או כתובת.
"""
from __future__ import annotations

from html import escape

DRAFT_LABEL = "טיוטה – לבדיקת עו״ד"
OPERATOR = {
    "legal_name": "[שם החברה המפעילה בע״מ — placeholder]",
    "company_id": "[ח.פ. — placeholder]",
    "address": "[כתובת רשומה — placeholder]",
    "privacy_email": "[privacy@… — placeholder]",
}


def why_you_got_this(business: str) -> str:
    b = escape(business)
    return (f"קיבלתם הודעה זו כי אצל <b>{b}</b> רשומה על שמכם חשבונית פתוחה. ההודעה נשלחה מטעם "
            f"{b} באופן אוטומטי, אחרי שבעל העסק אישר אותה. היא אינה הודעה פרסומית.")


def privacy_html(business: str) -> str:
    b = escape(business)
    o = {k: escape(v) for k, v in OPERATOR.items()}
    return (
        '<section aria-labelledby="privacy"><h2 id="privacy" style="font-size:16px">פרטיות</h2>'
        f"<p>בעל השליטה במידע הוא <b>{b}</b>. השירות מופעל עבורו כספק עיבוד בידי {o['legal_name']} "
        f"({o['company_id']}, {o['address']}).</p>"
        "<p>המידע שבשימוש: שם, טלפון/מייל, מספר חשבונית וסכום — רק לצורך תזכורת על החשבונית "
        "הזו. איננו מוכרים או מעבירים אותו לצד שלישי למטרות אחרות. בקשה לעיון, לתיקון או "
        f"למחיקה: לפנות ל-{b} או ל-{o['privacy_email']}.</p></section>")


def draft_footer() -> str:
    return (f'<p style="font-size:12px;color:#64748b;margin-top:20px">'
            f'<span style="border:1px solid #cbd5e1;border-radius:6px;padding:1px 6px">'
            f'{escape(DRAFT_LABEL)}</span> · {escape(OPERATOR["legal_name"])}</p>')
