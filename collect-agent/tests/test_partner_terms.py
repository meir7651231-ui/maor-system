"""תנאי השותפות (הכרעת מאיר 6.11 לילה): 20% **לפני מע״מ**, **12 חודשים**, המחיר ללקוח זהה, גילוי נאות.
באג (critic סבב 6): בכל טיוטות הפנייה לשותפים היה כתוב «20% מהמנוי של כל לקוח», בלי בסיס ובלי תקופה.
מי שקורא את זה מבין ₪23.80 לחודש לתמיד, בעוד שהתנאים הם בערך ₪20.17 לחודש ל-12 חודשים: הצעה מטעה."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTNER_DOCS = ["sales/README.md", "sales/beta-channels.md", "sales/outreach-drafts.md",
                "sales/partner-terms-draft.md", "team/sales.md", "team/gtm.md"]


def test_every_partner_commission_mention_states_basis_and_term():
    bad = []
    for rel in PARTNER_DOCS:
        for n, line in enumerate((ROOT / rel).read_text(encoding="utf-8").splitlines(), 1):
            # פטור: ציטוט היסטורי («מקור:»), שורת טבלה (הבסיס בכותרת), רשימת שאלות לעו״ד
            exempt = "~~" in line or "מקור:" in line or line.lstrip().startswith("|") and "₪" in line \
                or 'עו"ד:' in line or "גילוי נאות:" in line   # נוסח ללקוח (D13), נבדק בנפרד
            if "20%" in line and ("עמלה" in line or "שותפ" in line) and not exempt:
                if not ("לפני מע" in line and "12" in line):
                    bad.append(f"{rel}:{n}: {line.strip()[:90]}")
    assert not bad, "\n".join(bad)


def test_partner_terms_numbers_are_consistent():
    t = (ROOT / "sales/partner-terms-draft.md").read_text(encoding="utf-8")
    net_m, net_y = round(119 / 1.18, 2), round(1190 / 1.18, 2)          # מע״מ 18%
    assert f"₪{round(net_m * 0.2, 2):.2f}" in t                        # ≈ ₪20.17
    assert f"₪{round(net_y * 0.2, 2):.2f}" in t                        # ≈ ₪201.69
    assert f"₪{round(119 / 1.18 * 0.2 * 12, 2):.2f}" in t              # ≈ ₪242.03 (בלי עיגול כפול)
    assert "פתוח להכרעת מאיר" not in t.split("## 6.")[0]               # בסיס ותקופה הוכרעו
    for must in ("12 חודשים", "לפני מע״מ", "המחיר ללקוח **זהה**", "גילוי נאות"):
        assert must in t, must


def test_disclosure_script_tells_customer_commission_and_same_price():
    d13 = (ROOT / "sales/outreach-drafts.md").read_text(encoding="utf-8").split("### D13")[1].split("###")[0]
    assert "גילוי נאות" in d13 and "עמלה" in d13 and "המחיר שלך זהה" in d13
    assert "20%" in d13 and "בשנה הראשונה" in d13          # הלקוח יודע כמה ולכמה זמן
    terms = (ROOT / "sales/partner-terms-draft.md").read_text(encoding="utf-8")
    assert "**לפני** ההרשמה" in terms and "גילוי בכתב" in terms and "באותו יחס" in terms


def test_no_customer_discount_via_partner():
    """המחיר יחיד: אין «חודש חינם» או הנחה ללקוח מופנה (ההמלצה הישנה ב-market.md סומנה ⛔)."""
    for rel in PARTNER_DOCS + ["team/market.md"]:
        for line in (ROOT / rel).read_text(encoding="utf-8").splitlines():
            if ("חודש חינם" in line or "הנחה ללקוח מופנה" in line) and "⛔" not in line and "~~" not in line:
                raise AssertionError(f"{rel}: {line.strip()[:90]}")
