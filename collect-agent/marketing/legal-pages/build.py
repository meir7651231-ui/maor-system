# ruff: noqa: E501 — תבנית HTML
"""דפי «תנאי שימוש» ו«מדיניות פרטיות» לאתר השיווק — **מחולל בלבד**: התוכן הוא של המשפטי
(legal/TERMS.md, legal/PRIVACY.md) והרינדור הוא שלהם (scripts/legal_bundle.md_to_html). גבי שיווק לא כותב
כאן אף מילה משפטית — רק מעטפת (עיצוב, טיוטה, noindex, ניווט) כדי שהקישורים בתחתיות יגיעו לדף קיים.

    python3 marketing/legal-pages/build.py          # בונה marketing/{terms,privacy}.html + עותקים ב-web/public
    python3 marketing/legal-pages/build.py --check  # נכשל אם דף לא מעודכן מול legal/*.md
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from scripts.legal_bundle import md_to_html  # noqa: E402

PAGES = {"terms": ("legal/TERMS.md", "תנאי שימוש"), "privacy": ("legal/PRIVACY.md", "מדיניות פרטיות")}
OUT = ROOT / "marketing"
COPY = ROOT / "web" / "public"


def page(key: str) -> str:
    src, title = PAGES[key]
    md = (ROOT / src).read_text(encoding="utf-8")
    body = md_to_html("\n".join(md.splitlines()[1:]))          # הכותרת הראשית ⇒ <h1> משלנו
    style = re.search(r"<style>(.*?)</style>", (OUT / "landing/index.html").read_text(encoding="utf-8"), re.S).group(1)
    return f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{title} · גבי – תזכורות תשלום</title>
<style>{style}
.doc{{max-width:820px}}.doc h2,.doc h3{{margin:24px 0 8px}}.doc p,.doc li{{color:var(--ink)}}.doc blockquote{{margin:0 0 16px;padding:10px 14px;background:var(--warn-bg);border-radius:12px}}
.doc table{{display:block;overflow-x:auto}}.doc code{{white-space:normal;overflow-wrap:anywhere}}</style>
</head>
<body>
<!-- נוצר אוטומטית מ-{src} ע״י marketing/legal-pages/build.py · אל תערכו ידנית — עורכים את המקור אצל המשפטי -->
<div class="draft" role="note">טיוטה – לבדיקת עו״ד · לא לפרסום · המקור: {src}</div>
<main id="top"><section class="block"><div class="wrap doc">
<h1>{title}</h1>
{body}
<p><a href="#top">חזרה לראש העמוד</a></p>
</div></section></main>
<footer><div class="wrap"><span>© 2026 גבי – תזכורות תשלום · <a href="terms.html" style="color:inherit">תנאי שימוש</a> · <a href="privacy.html" style="color:inherit">מדיניות פרטיות</a> · <a href="accessibility.html" style="color:inherit">הצהרת נגישות</a></span></div></footer>
</body>
</html>
"""


def main(argv: list[str]) -> int:
    stale = []
    for key in PAGES:
        text = page(key)
        for dst in (OUT / f"{key}.html", COPY / f"{key}.html"):
            if "--check" in argv:
                if not dst.is_file() or dst.read_text(encoding="utf-8") != text:
                    stale.append(str(dst.relative_to(ROOT)))
            else:
                dst.write_text(text, encoding="utf-8")
    if stale:
        print("✗ דפים משפטיים לא מעודכנים מול legal/*.md:", ", ".join(stale))
        return 1
    if "--check" not in argv:
        print("✓ marketing/terms.html, marketing/privacy.html (+ web/public)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
