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
        ads = root / cfg.get("ads_launch", "marketing/ads/launch.json")
        if ads.is_file():
            a = json.loads(ads.read_text(encoding="utf-8"))
            if a.get("domain") != dom:
                out.append(f"marketing/ads/launch.json: domain={a.get('domain')!r} ≠ {dom} (set_domain.py מסנכרן)")
            man = ads.parent / "out" / "manifest.json"
            if man.is_file() and json.loads(man.read_text(encoding="utf-8")).get("domain") != dom:
                out.append(f"מודעות (marketing/ads/out) רונדרו בלי {dom} — node marketing/ads/render.mjs")
        if cfg.get("videos_rendered_for") != dom:
            out.append(f"סרטונים ({', '.join(cfg.get('videos', []))}) רונדרו ל-{cfg.get('videos_rendered_for')}, "
                       f"לא ל-{dom} — יש לרנדר מחדש ולעדכן videos_rendered_for")
    return out


# מה שרק מאיר יכול להזיז (team/marketing.md · marketing/SIGN-OFF.md). כל השאר — באחריות הצוות.
MEIR_WALLS = (
    "דומיין: לבחור (ולרכוש) — אחר כך set_domain.py + רינדור מחדש",
    "אישור פרסום לכל נכס (דף, דפי ענף, ספריית נוסחים, פוסטים, מודעות, סרטון, מאמרים)",
    "מערכת דיוור + SPF/DKIM לרצף מיילי הניסיון (הרשמה לשירות)",
    "בדיקת עו״ד: §30א (שירות מול פרסומת), פרטי החברה בתחתית, «כולל מע״מ ככל שחל»",
)
GENERATORS = ("marketing/landing/for/build.py", "marketing/library/build.py", "marketing/legal-pages/build.py",
              "marketing/video/transcript.py")


def readiness(root: Path = ROOT) -> list[str]:
    """«מוכן לחתימה»: מה שבידי הצוות ירוק, ומה שנשאר אדום בשער ההשקה נעלם ברגע שיש דומיין
    (מדמים set_domain על עותק) — חוץ מרינדור מחדש, שהוא פקודה. מחזיר רשימת בעיות; ריקה = מוכן."""
    import importlib.util
    import shutil
    import tempfile

    problems = [f"עקביות: {f}" for f in findings(release=False, root=root)]
    for g in GENERATORS:
        spec = importlib.util.spec_from_file_location(f"gen_{abs(hash(g))}", root / g)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        if mod.main(["--check"]) != 0:
            problems.append(f"{g}: הדף לא מעודכן מול הקוד (הריצו את build.py)")
    cfg = load()
    sd_spec = importlib.util.spec_from_file_location("set_domain_r", Path(__file__).with_name("set_domain.py"))
    sd = importlib.util.module_from_spec(sd_spec)
    sd_spec.loader.exec_module(sd)
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        extra = ["marketing/launch/launch.json", cfg.get("ads_launch", "marketing/ads/launch.json"),
                 "marketing/ads/out/manifest.json"]
        for rel in cfg["files"] + extra:
            if (root / rel).is_file():
                (t / rel).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(root / rel, t / rel)
        sd.set_domain("readiness-test.co.il", root=t, cfg_path=t / "marketing/launch/launch.json")
        left = findings(release=True, cfg=json.loads((t / "marketing/launch/launch.json").read_text("utf-8")), root=t)
        problems += [f"גם אחרי דומיין: {f}" for f in left if "סרטונים" not in f and "מודעות" not in f]
    return problems


def main(argv: list[str]) -> int:
    if "--readiness" in argv:
        probs = readiness()
        if probs:
            print(f"✗ לא מוכן לחתימה: {len(probs)} בעיות בידי הצוות")
            for p in probs:
                print("  -", p)
            return 1
        print("✓ מוכן לחתימה. החוסמים שנשארו הם רק של מאיר:")
        for w in MEIR_WALLS:
            print("  •", w)
        return 0
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
