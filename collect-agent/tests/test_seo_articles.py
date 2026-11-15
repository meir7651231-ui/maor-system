"""מאמרי ה-SEO (marketing/seo): בלי מילים אסורות, קריאה לפעולה דרך placeholder של הדומיין היחיד,
ומאמר «מתי לשלוח» — כל מספר בו הוא הכלל שהקוד אוכף (שינוי בקוד ⇒ המאמר נופל עד שמתעדכן)."""
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
