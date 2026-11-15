# ruff: noqa: E501 — תבנית HTML
"""תמליל מלא לסרטוני הדמו (נגישות: מגבלה ידועה בהצהרה) — **מחולל מהמקור, לא טקסט ידני**:
הכתוביות והתזמונים מ-compose/assets/captions.json, וכרטיס הסיום מ-compose/endcard.mjs (של גבי עיצוב).

    python3 marketing/video/transcript.py          # בונה marketing/video/transcript.html
    python3 marketing/video/transcript.py --check  # נכשל אם התמליל לא מעודכן מול הכתוביות/הכרטיס
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CAPS = HERE / "compose/assets/captions.json"
END = HERE / "compose/endcard.mjs"
OUT = HERE / "transcript.html"
COPY = ROOT / "web/public/video/transcript.html"   # מוגש גם מ-/app/video/ (הצהרת הנגישות מקשרת אליו מאותו נתיב יחסי)
VIDEOS = {"h": ("סרטון הדגמה 16:9", "gabi-demo-16x9.mp4"), "v": ("ריל 9:16", "gabi-reel-9x16.mp4")}


def clean(t: str) -> str:
    return re.sub(r"\s+", " ", t.replace("<br>", " ").replace("*", "")).strip()


def captions() -> dict[str, list[tuple[float, float, str]]]:
    data = json.loads(CAPS.read_text(encoding="utf-8"))
    return {k: [(c["a"], c["b"], clean(c["text"])) for c in v] for k, v in data.items()}


def endcard(fmt: str) -> list[str]:
    """הטקסט שבכרטיס הסיום, לפי הפורמט (בפורמט h/v שורת המחיר נשברת אחרת)."""
    src = END.read_text(encoding="utf-8")
    lines = []
    for cls in ("n", "s", "p", "m"):
        m = re.search(rf'<div class="{cls}">(.*?)</div>', src, re.S)
        if not m:
            continue
        t = m.group(1)
        tern = re.match(r"\$\{h \? '(.*?)' : '(.*?)'\}$", t, re.S)
        if tern:
            t = tern.group(1 if fmt == "h" else 2)
        lines.append(clean(t))
    return lines


def page() -> str:
    e = html.escape
    style = re.search(r"<style>(.*?)</style>", (ROOT / "marketing/landing/index.html").read_text(encoding="utf-8"), re.S).group(1)
    secs = []
    for fmt, caps in captions().items():
        title, file = VIDEOS[fmt]
        rows = "".join(f"<tr><td class=\"t\">{a:.1f}–{b:.1f} שנ׳</td><td>{e(t)}</td></tr>" for a, b, t in caps)
        end = "".join(f"<li>{e(t)}</li>" for t in endcard(fmt))
        secs.append(f"""<h2>{e(title)} <small style="font-weight:400;color:var(--muted)">({e(file)})</small></h2>
<p>הסרטון מראה את המסכים של גבי בטלפון ובמחשב. התוכן המילולי מוצג בכתוביות, וזה התמליל המלא שלהן:</p>
<div class="tablewrap"><table><thead><tr><th scope="col">זמן</th><th scope="col">כתובית</th></tr></thead><tbody>{rows}</tbody></table></div>
<p><b>כרטיס הסיום:</b></p><ul>{end}</ul>""")
    return f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>תמליל סרטוני ההדגמה · גבי – תזכורות תשלום</title>
<style>{style}
.doc{{max-width:820px}}.doc h2{{margin:28px 0 10px}}td.t{{white-space:nowrap;color:var(--muted)}}</style>
</head>
<body>
<!-- נוצר אוטומטית ע״י marketing/video/transcript.py מ-compose/assets/captions.json ו-compose/endcard.mjs · אל תערכו ידנית -->
<div class="draft" role="note">טיוטה, לא לפרסום · תמליל אוטומטי מהכתוביות</div>
<main id="top"><section class="block"><div class="wrap doc">
<h1>תמליל סרטוני ההדגמה</h1>
{''.join(secs)}
<p><a href="../accessibility.html">הצהרת נגישות</a></p>
</div></section></main>
<footer><div class="wrap"><span>© 2026 גבי – תזכורות תשלום · <a href="../terms.html" style="color:inherit">תנאי שימוש</a> · <a href="../privacy.html" style="color:inherit">מדיניות פרטיות</a> · <a href="../accessibility.html" style="color:inherit">הצהרת נגישות</a></span></div></footer>
</body>
</html>
"""


def main(argv: list[str]) -> int:
    text = page()
    if "--check" in argv:
        if any(not p.is_file() or p.read_text(encoding="utf-8") != text for p in (OUT, COPY)):
            print("✗ התמליל לא מעודכן מול הכתוביות/כרטיס הסיום (הריצו transcript.py)")
            return 1
        return 0
    COPY.parent.mkdir(parents=True, exist_ok=True)
    for p in (OUT, COPY):
        p.write_text(text, encoding="utf-8")
    print(f"✓ {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
