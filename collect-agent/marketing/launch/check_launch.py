"""שער השקה לחומרי השיווק של גבי — מקור הדומיין: launch.json.

    python3 marketing/launch/check_launch.py            # עקביות: כל הדומיינים = launch.json
    python3 marketing/launch/check_launch.py --release  # שער השקה (ראו למטה)

שער ההשקה נכשל כל עוד: הדומיין placeholder · נשאר gabi.example · נשארו placeholders של קישור/דומיין ·
הסרטונים רונדרו לדומיין אחר.
יוצא 0 = תקין, 1 = יש ממצאים (מודפסים).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # collect-agent/
CFG = Path(__file__).with_name("launch.json")
PLACEHOLDER_DOMAIN = "gabi.example"
# כתובות שמותר שיופיעו בחומרים בלי להיות "הדומיין שלנו": דמו תשלום, דוגמאות מייל, פלייסהולדרים של מוק
ALLOWED_OTHER = {"pay.example", "example.com", "127.0.0.1"}
HOST = re.compile(r"(?<![a-z0-9.-])((?:[a-z0-9][a-z0-9-]*\.)+(?:example|co\.il|com|org|net|io|app|il))"
                  r"(?=[/\s\"'`<)\]]|$)", re.I)


def load() -> dict:
    return json.loads(CFG.read_text(encoding="utf-8"))


def findings(release: bool, cfg: dict | None = None, root: Path = ROOT) -> list[str]:
    cfg = cfg or load()
    dom = cfg["domain"]
    out: list[str] = []
    for rel in cfg["files"]:
        p = root / rel
        if not p.is_file():
            out.append(f"{rel}: הקובץ חסר (מופיע ב-launch.json)")
            continue
        text = p.read_text(encoding="utf-8")
        for m in HOST.finditer(text):
            h = m.group(1).lower()
            # דומיין placeholder (‎*.example) שאינו הדומיין שלנו ואינו דמו מותר ⇒ חומר שלא מסונכרן ל-launch.json
            if h.endswith(".example") and h != dom.lower() and h not in ALLOWED_OTHER:
                out.append(f"{rel}: דומיין placeholder זר «{h}» (צפוי {dom})")
        if release:
            if PLACEHOLDER_DOMAIN in text:
                out.append(f"{rel}: נשאר {PLACEHOLDER_DOMAIN}")
            for ph in cfg.get("link_placeholders", []) + cfg.get("domain_placeholders", []):
                if ph in text:
                    out.append(f"{rel}: נשאר placeholder «{ph}»")
    if release:
        if cfg.get("placeholder") or dom == PLACEHOLDER_DOMAIN:
            out.insert(0, f"launch.json: הדומיין עדיין placeholder ({dom}) — דורש הכרעת מאיר")
        if cfg.get("videos_rendered_for") != dom:
            out.append(f"סרטונים ({', '.join(cfg.get('videos', []))}) רונדרו ל-{cfg.get('videos_rendered_for')}, "
                       f"לא ל-{dom} — יש לרנדר מחדש ולעדכן videos_rendered_for")
    return out


def main(argv: list[str]) -> int:
    release = "--release" in argv
    out = findings(release)
    label = "שער השקה" if release else "עקביות דומיין"
    if out:
        print(f"✗ {label}: {len(out)} ממצאים")
        for f in out:
            print("  -", f)
        return 1
    print(f"✓ {label}: תקין ({load()['domain']})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
