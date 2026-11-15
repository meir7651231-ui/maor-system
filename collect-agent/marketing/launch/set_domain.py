"""מחליף את דומיין ההשקה בכל חומרי השיווק בפעולה אחת (מקור: launch.json).

    python3 marketing/launch/set_domain.py gabi.co.il            # מחליף ומעדכן את launch.json
    python3 marketing/launch/set_domain.py gabi.co.il --dry-run  # מציג מה ישתנה, בלי לכתוב

מה מוחלף: <דומיין ישן> ⇒ <חדש> · «[קישור לדף]» ⇒ https://<חדש> · «[דומיין]» ⇒ <חדש>.
מה לא: קבצי הסרטון (mp4) — הסקריפט מזכיר לרנדר מחדש; check_launch --release ייכשל עד שיעודכן videos_rendered_for.
אינו נוגע בשום מערכת חיצונית ואינו מפרסם דבר.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]                                  # collect-agent/
DOMAIN_RE = re.compile(r"^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$")


def set_domain(new: str, root: Path = ROOT, cfg_path: Path | None = None, dry: bool = False) -> dict[str, int]:
    new = new.strip().lower().removeprefix("https://").removeprefix("http://").rstrip("/")
    if not DOMAIN_RE.match(new):
        raise ValueError(f"דומיין לא תקין: {new!r}")
    cfg_path = cfg_path or root / "marketing/launch/launch.json"
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    old = cfg["domain"]
    changed: dict[str, int] = {}
    for rel in cfg["files"]:
        p = root / rel
        text = p.read_text(encoding="utf-8")
        n = text.count(old)
        text2 = text.replace(old, new)
        for ph in cfg.get("link_placeholders", []):
            n += text2.count(ph)
            text2 = text2.replace(ph, f"https://{new}")
        for ph in cfg.get("domain_placeholders", []):
            n += text2.count(ph)
            text2 = text2.replace(ph, new)
        if n:
            changed[rel] = n
            if not dry:
                p.write_text(text2, encoding="utf-8")
    if not dry:
        cfg["domain"] = new
        cfg["placeholder"] = False
        cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    if len(args) != 1:
        print(__doc__)
        return 2
    dry = "--dry-run" in argv
    changed = set_domain(args[0], dry=dry)
    for rel, n in changed.items():
        print(f"  {'(dry) ' if dry else ''}{rel}: {n} החלפות")
    print(f"✓ {sum(changed.values())} החלפות ב-{len(changed)} קבצים" + (" (dry-run, לא נכתב)" if dry else ""))
    print("⚠️ לרנדר מחדש את הסרטונים ולעדכן videos_rendered_for ב-launch.json; ואז: check_launch.py --release")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
