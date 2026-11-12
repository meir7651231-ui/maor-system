"""critic סבב 52: הכרעת מאיר — המחיר מוצג תמיד «כולל מע״מ ככל שחל». המגן הקיים (test_pricing_single_source)
בודק רק את docs/PRICING.md ואוסר «+ מע״מ», אבל לא בודק שכל **הצגת מחיר בממשק** אומרת שהמע״מ כלול.
נמצאו 4 הצגות בלי: /ui («אחר כך ₪119 לחודש», «₪119 לחודש להמשך»), נחיתה (שורת ה-Hero «₪119 לחודש או
₪1,190 לשנה», ומחשבון ה-ROI «גבי עולה ₪119 לחודש»). כלל: מחיר מוצג ⇒ «מע״מ» באותה שורה או עד 2 שורות ממנה."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRICE = re.compile(r"₪\s?(?:119|1,190|\$\{[^}]*price[^}]*\}|\{PRICE\.(?:monthly|yearly)[^}]*\}|\{GABI_PRICE\})"
                   r"|(?:119|1,190) ?₪")
FILES = [ROOT / "app/ui.html", *(ROOT / "web/src").rglob("*.tsx")]


def test_every_displayed_price_says_vat_included():
    bad = []
    for p in FILES:
        lines = p.read_text(encoding="utf-8").splitlines()
        for n, line in enumerate(lines):
            if not PRICE.search(line) or line.lstrip().startswith("//"):
                continue
            near = "\n".join(lines[max(0, n - 2): n + 3])
            if "מע״מ" not in near and 'מע"מ' not in near:
                bad.append(f"{p.relative_to(ROOT)}:{n + 1}: {line.strip()[:90]}")
    assert not bad, "מחיר בלי «כולל מע״מ ככל שחל»:\n" + "\n".join(bad)
