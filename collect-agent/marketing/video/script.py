"""מסנכרן את טבלת התסריט ואת מונה המילים ב-script.md מ-scenes.json (המקור היחיד לקריינות).

באג שתוקן (15.11): scenes.json עודכן (מקורות חשבוניות) אבל הטבלה ב-script.md נשארה עם הנוסח הישן —
התסריט נכתב פעם אחת ולא נבנה מחדש. מעכשיו רק הטבלה ומונה המילים נוצרים; שאר המסמך נשאר ידני.

    python3 marketing/video/script.py          # מעדכן את script.md
    python3 marketing/video/script.py --check  # נכשל אם הטבלה לא תואמת ל-scenes.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "script.md"
HEADER = "| זמן | פריים | קריינות | טקסט על המסך |\n|---|---|---|---|\n"


def render(current: str) -> str:
    sc = json.loads((HERE / "scenes.json").read_text(encoding="utf-8"))
    rows = "".join(f"| {s['t']} | `frames/{i + 1:02d}-{s['key']}.png` | {s['vo']} | {s['onscreen']} |\n"
                   for i, s in enumerate(sc))
    words = len(" ".join(s["vo"] for s in sc).split())
    out = re.sub(re.escape(HEADER) + r"(?:\|[^\n]*\n)+", lambda _: HEADER + rows, current, count=1)
    secs = round(words / 2.3)
    tail = ("כלומר נשאר מרווח לנשימה בתוך 60 שניות." if secs <= 52 else
            "⚠️ **צפוף:** בלי מרווח לנשימה בתוך 60 שניות. כדאי לקצר את הקריינות (למשל רשימת מערכות החשבוניות) "
            "או להאריך את הסרטון.")
    line = f"**אורך הקריינות:** {words} מילים. בקצב שיחה של כ-2.3 מילים לשנייה זה כ-{secs} שניות, {tail}"
    return re.sub(r"\*\*אורך הקריינות:\*\*[^\n]*", lambda _: line, out, count=1)


def main(argv: list[str]) -> int:
    cur = SCRIPT.read_text(encoding="utf-8")
    new = render(cur)
    if "--check" in argv:
        if new != cur:
            print("✗ script.md לא תואם ל-scenes.json (הריצו script.py)")
            return 1
        return 0
    SCRIPT.write_text(new, encoding="utf-8")
    print("✓ marketing/video/script.md")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
