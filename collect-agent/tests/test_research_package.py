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


def test_beta_profiles_30_are_profiles_only():
    """BACKLOG מחקר #3: 30 פרופילים — בלי שמות, טלפונים, מיילים או קישורים לעסק אמיתי."""
    txt = (ROOT / "team" / "beta-profiles-30.md").read_text(encoding="utf-8")
    rows = [ln for ln in txt.splitlines() if re.match(r"^\| \d+ \|", ln)]
    assert len(rows) == 30
    assert [int(r.split("|")[1]) for r in rows] == list(range(1, 31))
    assert not EMAIL.search(txt) and not IL_PHONE.search(txt)
    assert not re.search(r"https?://", txt), "קישור לעסק אמיתי"
    assert "אין כאן אף עסק אמיתי" in txt
    counts = {}
    for r in rows:
        slot = r.split("|")[2].strip().rsplit(" ", 1)[0]
        counts[slot] = counts.get(slot, 0) + 1
    assert counts == {"מספרה": 9, "מוסך": 6, "קליניקה": 6, "לקוח רו\"ח": 9}


def test_market_differentiation_consistent_with_competitor_table():
    """§1.6 קבע: SMS ושבת אינם בידול (iCount «נודניק» ₪29 שולח SMS; morning דוחה תזכורת אחרי שבת).
    שומר שה-TL;DR וההוכחות למסרים לא חוזרים להציג אותם כבידול המוביל."""
    tldr = MARKET.split("## 1.")[0]
    assert "iCount" in tldr and "SMS ושבת אינם בידול" in tldr
    proofs = next(ln for ln in MARKET.splitlines() if ln.startswith("- **שלוש הוכחות"))
    lead = proofs.split("**גם:**")[0]
    assert "SMS" not in lead and "שבת" not in lead, "SMS/שבת שוב בראש ההוכחות"
    assert "מאשר כל הודעה" in lead


def test_competitor_table_every_row_has_source_link():
    """BACKLOG מחקר: «עם ציטוט וקישור לכל שורה» — כל שורת מתחרה ב-§1.6 נושאת קישור https."""
    sec = MARKET.split("### 1.6")[1].split("**⚠️ מה זה משנה")[0]
    rows = [ln for ln in sec.splitlines() if ln.startswith("| **")]
    names = [r.split("|")[1].strip() for r in rows]
    for must in ("iCount", "SUMIT", "ריווחית", "EZcount", "Invoice4U"):
        assert any(must in n for n in names), must
    for r in rows:
        assert re.search(r"\]\(https://", r), f"שורה בלי קישור מקור: {r[:60]}"


def test_global_competitors_sourced():
    """§1.2: שורות Chaser/InvoiceSherpa/Paidnice נושאות קישור למחירון הרשמי ותאריך קריאה."""
    sec = MARKET.split("### 1.2")[1].split("### 1.4")[0]
    for name, url in (("Chaser", "chaserhq.com/pricing"), ("InvoiceSherpa", "invoicesherpa.com/pricing"),
                      ("Paidnice", "paidnice.com/pricing")):
        row = next(ln for ln in sec.splitlines() if ln.startswith(f"| **{name}**"))
        assert url in row and "נקרא 19.11.2026" in row, name


def test_fit_model_arithmetic_and_beta_verdicts():
    """market.md §3.6 (ביקורת: «האם נועה קהל יעד ב-₪119?»): נקודת האיזון נגזרת מההנחות הכתובות,
    וכל משבצת בטא מסומנת ✅/🟡/❌ — אם מישהו משנה הנחה בלי לעדכן את המסקנה, הבדיקה נכשלת."""
    m = re.search(r"fit-model: hour_value=(\d+) minutes_per_reminder=(\d+(?:\.\d+)?) "
                  r"reminders_per_open=(\d+(?:\.\d+)?) breakeven_gross=(\d+) breakeven_net=(\d+)", MARKET)
    assert m, "חסר סימון fit-model ב-§3.6"
    hour, mins, per_open, be_gross, be_net = (float(x) for x in m.groups())
    per_invoice = hour * mins / 60 * per_open
    assert round(119 / per_invoice) == be_gross
    assert round(101 / per_invoice) == be_net          # ₪119 כולל 18% מע"מ ⇒ ~₪101 נטו
    assert "נועה" in MARKET.split("### 3.6")[1].split("## 4.")[0] and "❌ **לא קהל יעד ב-₪119.**" in MARKET
    txt = (ROOT / "team" / "beta-profiles-30.md").read_text(encoding="utf-8")
    rows = [ln for ln in txt.splitlines() if re.match(r"^\| \d+ \|", ln)]
    verdicts = [r.split("|")[7].strip()[:1] for r in rows]
    assert len(rows) == 30 and set(verdicts) <= {"✅", "🟡", "❌"}
    counts = {v: verdicts.count(v) for v in "✅🟡❌"}
    assert f"✅ {counts['✅']} · 🟡 {counts['🟡']} · ❌ {counts['❌']}" in txt, counts


def test_sender_id_rules_documented_and_enforced_in_code():
    """market.md §4.7: כלל שם השולח (≤11 לטיניים, בלי עברית) מתועד עם מקור — וגם נאכף בקוד.
    אם הקוד יתחיל לקבל שם שולח בעברית/ארוך, או שהמסמך יאבד את המקור — נכשל."""
    from app.integrations.base import IntegrationError
    from app.integrations.sms import validate_sender
    sec = MARKET.split("### 4.7")[1].split("## 6.")[0]
    assert "עד 11 תווים" in sec and "בלי עברית" in sec and "textme.co.il" in sec
    assert "אימות זהות" in sec and "beta-kit" in sec
    assert validate_sender("StudioMeir") == "StudioMeir"
    for bad in ("סטודיו", "StudioMeir12", "Studio@Meir"):
        try:
            validate_sender(bad)
        except IntegrationError:
            continue
        raise AssertionError(f"שם שולח לא תקין התקבל: {bad!r}")
    assert "§4.7" in RFQ


def test_distribution_section_sourced():
    sec = MARKET.split("### 2.5")[1].split("## 3.")[0]
    assert "greeninvoice.co.il/integrations" in sec and "ניהול קליניקות" in sec
    assert "לא נעשתה שום פנייה" in sec
