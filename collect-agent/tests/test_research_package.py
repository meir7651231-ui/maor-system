"""חבילת «גבי מחקר» לחתימת מאיר: שומר שהחבילה שלמה ושאין בה שום פרט אמיתי או שליחה.

הכרעות מאיר 6.11: בלי הרשמה, בלי פנייה לספק, בלי פרטים אמיתיים (placeholder בלבד),
ומחירי ספקים/זמינות API מסומנים כהערכה עד אימות.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RFQ = (ROOT / "team" / "sms-rfq-draft.md").read_text(encoding="utf-8")
PKG = (ROOT / "team" / "research-signoff.md").read_text(encoding="utf-8")
MARKET = (ROOT / "team" / "market.md").read_text(encoding="utf-8")

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
IL_PHONE = re.compile(r"(?<!\d)0(?:5\d|[23489]|7\d)-?\d{7}(?!\d)")


def test_rfq_is_unsent_draft_with_placeholders_only():
    assert "לא נשלחה" in RFQ and "טיוטה" in RFQ
    for ph in ("[שם החברה בע\"מ — placeholder]", "[000000000]", "[שם איש קשר]", "[טלפון]", "[מייל]"):
        assert ph in RFQ, ph
    assert not EMAIL.search(RFQ), "כתובת מייל אמיתית בטיוטה"
    assert not IL_PHONE.search(RFQ), "מספר טלפון אמיתי בטיוטה"
    assert "019" in RFQ and "InforU" in RFQ


def test_signoff_package_complete_and_nothing_sent():
    assert "שום דבר כאן לא נשלח" in PKG
    for item in ("בקשת הצעת מחיר ל-019", "בקשת הצעת מחיר ל-InforU",
                 "הנוסח במסך החיבור", "אימות מחירון morning"):
        assert item in PKG, item
    assert not EMAIL.search(PKG) and not IL_PHONE.search(PKG)
    # הנוסח הנוכחי (הכרעה) מצוטט כפי שהוא בקוד — לא משתנה בלי חתימה
    sign = (ROOT / "web" / "src" / "pages" / "Signup.tsx").read_text(encoding="utf-8")
    current = "ייתכן שנדרש מסלול Best ומעלה ב-morning; יש לאמת מול הספק"
    assert current in sign and current in PKG


def test_market_estimates_marked_unverified():
    assert "לא מאומת" in MARKET and "הערכה" in MARKET
    assert "₪119" in MARKET and "₪1,190" in MARKET and "כולל מע\"מ" in MARKET
