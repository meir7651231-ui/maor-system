"""מאמרי ה-SEO (marketing/seo): בלי מילים אסורות, קריאה לפעולה דרך placeholder של הדומיין היחיד,
ומאמר «מתי לשלוח» — כל מספר בו הוא הכלל שהקוד אוכף (שינוי בקוד ⇒ המאמר נופל עד שמתעדכן)."""
import re
from pathlib import Path

import pytest

from app import policy
from app.service import STEP_OFFSETS_DAYS

SEO = Path(__file__).resolve().parents[1] / "marketing" / "seo"
ARTICLES = sorted(SEO.glob("*.md"))
WHEN = SEO / "03-when-to-send-payment-reminder.md"


def test_three_articles_exist():
    assert len(ARTICLES) >= 3 and WHEN.is_file()


@pytest.mark.parametrize("p", ARTICLES, ids=lambda p: p.name)
def test_article_rules(p):
    t = p.read_text(encoding="utf-8")
    low = t.lower()
    for bad in ("whatsapp", "וואטסאפ", "העוזר לגביית", "מובטח", "מבטיח", "100%", "מוצפן", "גבייה מובטחת"):
        assert bad not in low, bad
    assert "`[קישור לדף]`" in t or "gabi" not in low      # CTA דרך placeholder ⇒ set_domain מחליף
    assert "₪119" in t and "₪1,190" in t and "כולל מע״מ ככל שחל" in t
    assert "לא ייעוץ משפטי" in t


def test_when_article_numbers_match_code():
    t = WHEN.read_text(encoding="utf-8")
    d1, d2, d3 = STEP_OFFSETS_DAYS
    assert (d1, d2, d3) == (1, 7, 14), "הסולם בקוד השתנה — לעדכן את המאמר"
    assert f"אחרי {d2} ימים" in t and f"אחרי {d3} יום" in t and "יום אחרי המועד" in t
    assert policy.MAX_REMINDERS_PER_INVOICE == 3 and "לכל היותר 3 תזכורות" in t
    start, end = policy.DAY
    assert f"{start:%H:%M}" == "08:00" and f"{end:%H:%M}" == "20:00" and "בין 08:00 ל-20:00" in t
    assert f"{policy.SHORT[1]:%H:%M}" == "12:00" and "עד 12:00" in t
    assert policy.WINDOWS[5] is None and "לא בשבת" in t
    hours = int(policy.MIN_GAP.total_seconds() // 3600)
    assert hours == 72 and "72 שעות" in t


PLAN = SEO / "04-offer-payment-plan.md"


def test_payment_plan_article_numbers_match_code():
    """מאמר הפריסה: טווח התשלומים והמינימום לתשלום = app/plans.py ואפשרויות עמוד החייב."""
    from app import plans
    t = PLAN.read_text(encoding="utf-8")
    assert plans.MAX_INSTALLMENTS == 6 and "2 עד 6 תשלומים" in t
    assert plans.MIN_INSTALLMENT_AGOROT == 100_00 and "₪100 לתשלום" in t
    total, parts = 100_01, plans.propose(100_01 * 3, __import__("datetime").date(2026, 11, 8), 3)
    assert sum(p.amount_agorot for p in parts) == total * 3 and parts[0].amount_agorot >= parts[1].amount_agorot
    assert "השארית" in t and "לתשלום הראשון" in t
    assert "בלי ריבית" in t


PAID = SEO / "05-client-says-paid.md"


@pytest.mark.parametrize("text,partial", [("שילמתי אתמול בביט", False),
                                          ("כבר העברתי לכם", False),
                                          ("שילמתי חלק, 500 ש״ח, את השאר בשבוע הבא", True)])
def test_paid_claim_article_matches_engine(text, partial):
    """מה שהמאמר אומר על גבי = מה שמנוע השיחה עושה על «שילמתי»: עוצר, טיוטה לאישור, מבקש אסמכתא,
    ומזהה תשלום חלקי."""
    from datetime import date

    from app import conversation as c
    t = PAID.read_text(encoding="utf-8")
    ctx = c.Context(today=date(2026, 11, 8), business="סטודיו נועה", customer_name="דני כהן",
                    invoices=(c.OpenInvoice("1043", 180000),), payment_link="https://pay.example/x")
    d = c.respond(text, ctx)
    assert d.intent == c.Intent.PAID_CLAIM
    assert d.stop == c.Stop.PAUSE and "גבי עוצר את התזכורות" in t
    assert d.auto_send is False and "שום תשובה לא יוצאת בלי אישורך" in t
    assert d.reply and "אסמכתא" in d.reply and "אסמכתא" in t
    assert ("partial" in d.tags) == partial and "תשלום חלקי" in t


MISTAKES = SEO / "06-reminder-mistakes.md"
_EX = re.compile(r"[❌✅] `([^`]+)` <!-- (bad:(\w+)|good) -->")


def _rules():
    from app import compliance
    return compliance.Rules(business="סטודיו נועה", payment_link="https://pay.example/x", allow_debt_word=False)


def test_mistakes_article_bad_examples_are_blocked_by_the_real_filter():
    """כל «❌» במאמר נחסם במסנן הניסוח של גבי בדיוק בקטגוריה שהמאמר טוען; כל «✅» עובר."""
    from app import compliance
    ex = _EX.findall(MISTAKES.read_text(encoding="utf-8"))
    bad = [(t, cat) for t, kind, cat in ex if kind.startswith("bad")]
    good = [t for t, kind, _ in ex if kind == "good"]
    assert len(bad) == 5 and len(good) == 5
    for text, cat in bad:
        v = compliance.violations(text, _rules())
        assert cat in v, (text, v)
    for text in good:
        assert compliance.violations(text, _rules()) == [], text
