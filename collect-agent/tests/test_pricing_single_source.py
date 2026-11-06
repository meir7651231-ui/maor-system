"""review חור 5: מחיר יחיד (₪119/₪1,190 כולל מע״מ ככל שחל, בלי A/B, בלי חיוב חריגה).
סורק את כל החומר הפנימי והציבורי. שורה שמסומנת כלא בתוקף (⛔ / ~~ / "בוטל" / "היסטור") פטורה."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANNED = re.compile(r"₪ ?(?:49|79|179|249|349)\b|(?:49|79|179|249|349) ?₪|\+ ?מע[\"״]?מ|לפני מע[\"״]?מ|"
                    r"חריגה מ(?:ה)?מכסה(?:[^.]*)₪")
EXEMPT = re.compile(r"⛔|~~|בוטל|היסטור|לא בתוקף|review|critic|מחירון morning|morning Best|SMS|מקטע|לחלק|"
                    r"לפני מע\"מ\)|לפני מע\"מ, \*\*לא מאומת|ספק|\"לפני מע״מ\"|עמלה|שותפ|20%|"
                    r"בסיס = |אין ₪|אין A/B")
# ציטוט = תיאור של שומר · עמלת שותף (20%): הבסיס לפני מע״מ במכוון — נאכף ב-test_partner_terms
SKIP_DIRS = {"node_modules", "dist", "tests", "review", "evals", "__pycache__"}


def _files():
    for p in ROOT.rglob("*"):
        if p.suffix in {".md", ".tsx", ".ts", ".html", ".py"} and not (SKIP_DIRS & set(p.parts)):
            yield p


def test_no_other_price_or_vat_plus_or_overage_charges():
    bad = []
    for p in _files():
        if p.name in ("critic.md", "MARKET-RESEARCH.md"):   # ביקורת/מחקר היסטורי מסומן ⛔
            continue
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            if BANNED.search(line) and not EXEMPT.search(line):
                bad.append(f"{p.relative_to(ROOT)}:{n}: {line.strip()[:100]}")
    assert not bad, "\n".join(bad)


def test_pricing_source_of_truth():
    t = (ROOT / "docs" / "PRICING.md").read_text(encoding="utf-8")
    assert "₪119 לחודש" in t and "₪1,190 לשנה" in t and "כולל מע״מ ככל שחל" in t
    assert "לא מחייבים" in t and "14 יום, בלי כרטיס אשראי" in t
