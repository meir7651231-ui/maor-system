"""כל מספר בחומרי השיווק = הערך שהקוד אוכף. שינוי בקוד (או טעות בטקסט) ⇒ הבדיקה נופלת.

מכסה: עד כמה תזכורות · חלון השעות · שישי · מרווח בין הודעות · ימי ניסיון · מחיר חודשי/שנתי ·
כמה ימים לפני סוף הניסיון מגיעה ההתראה. הטענות נמצאות בכל הנכסים ב-marketing/ ובדף המסרים.
"""
import re
from pathlib import Path

import pytest

from app import policy
from app.config import Settings
from app.service import STEP_OFFSETS_DAYS, TRIAL_WARN_DAYS

ROOT = Path(__file__).resolve().parents[1]
FILES = sorted({*ROOT.glob("marketing/**/*.md"), *ROOT.glob("marketing/**/*.html"),
                ROOT / "team/messaging.md", ROOT / "web/src/pages/Landing.tsx"}
               - {*ROOT.glob("marketing/video/compose/**/*")})
F = Settings.__dataclass_fields__
CODE = {
    "max": policy.MAX_REMINDERS_PER_INVOICE,
    "start": f"{policy.DAY[0]:%H:%M}", "end": f"{policy.DAY[1]:%H:%M}",
    "short_end": f"{policy.SHORT[1]:%H:%M}",
    "gap_h": int(policy.MIN_GAP.total_seconds() // 3600),
    "trial": F["trial_days"].default, "month": F["price_ils_month"].default,
    "year": F["price_ils_year"].default, "warn": TRIAL_WARN_DAYS, "ladder": STEP_OFFSETS_DAYS,
}

# (תבנית בטקסט, איך לחלץ מספר/מחרוזת, מפתח בקוד)
CLAIMS = [
    (r"(?:עד|לכל היותר)\s+(\d+)\s+תזכורות", int, "max"),
    (r"בין\s+(\d\d:\d\d)\s+ל-\d\d:\d\d", str, "start"),
    (r"בין\s+\d\d:\d\d\s+ל-(\d\d:\d\d)", str, "end"),
    (r"(\d+)\s+שעות\s+בין", int, "gap_h"),
    (r"(\d+)\s+ימי ניסיון", int, "trial"),
    (r"₪(\d[\d,]*)\s*(?:לחודש|</span>\s*<span[^>]*>\s*לחודש)", lambda s: int(s.replace(",", "")), "month"),
    (r"₪(\d[\d,]*)\s*(?:</b>\s*)?לשנה", lambda s: int(s.replace(",", "")), "year"),
    (r"(\d+)\s+ימים לפני (?:ה)?סוף", int, "warn"),
]


@pytest.mark.parametrize("p", FILES, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_numbers_in_marketing_match_code(p):
    text = p.read_text(encoding="utf-8")
    wrong = []
    for pat, conv, key in CLAIMS:
        for m in re.finditer(pat, text):
            v = conv(m.group(1))
            if v != CODE[key]:
                wrong.append(f"{key}: בטקסט {v!r}, בקוד {CODE[key]!r} · «{m.group(0)}»")
    assert not wrong, wrong


def test_claims_are_actually_present():
    """שלא נעבור "בירוק" כי הדפוסים לא תופסים כלום: כל טענה מופיעה לפחות פעם אחת בנכסים."""
    allt = "\n".join(p.read_text(encoding="utf-8") for p in FILES)
    for pat, _, key in CLAIMS:
        assert re.search(pat, allt), f"הטענה {key} לא נמצאה באף נכס — הדפוס לא תופס"
    assert CODE["ladder"] == (1, 7, 14) and CODE["short_end"] == "12:00"


# ───────── מסכי הממשק (web/src) — הטקסט שבעל העסק והלקוח שלו רואים ─────────
SCREENS = sorted([*(ROOT / "web/src/pages").glob("*.tsx"), *(ROOT / "web/src/components").glob("*.tsx")])
_COMMENTS = re.compile(r"/\*.*?\*/|\{/\*.*?\*/\}|(?<![:\"'])//[^\n]*", re.S)
# מותר במפורש: הסבר מסנן הניסוח לבעל העסק («המילה "חוב"» = למה הטיוטה נחסמה)
SCREEN_ALLOWED = ('המילה "חוב"',)


def _visible(p):
    t = _COMMENTS.sub(" ", p.read_text(encoding="utf-8"))
    for a in SCREEN_ALLOWED:
        t = t.replace(a, " ")
    return t


@pytest.mark.parametrize("p", SCREENS, ids=lambda p: p.name)
def test_screen_copy(p):
    """team/messaging.md §3: «חשבונית פתוחה», לא «חוב» · אין הבטחות לעתיד («בקרוב») · אין ז'רגון פנימי
    (MVP) · אין מילים אסורות · כל מספר (מחיר/ניסיון/תזכורות/שעות) = הקוד."""
    t = _visible(p)
    bad = [w for w in ("חוב", "בקרוב", "MVP", "וואטסאפ", "WhatsApp", "העוזר לגביית", "מובטח", "לפני מע״מ")
           if re.search(r"(?<![א-ת])[הבלמושכ]{0,2}חוב(?![א-ת])" if w == "חוב" else re.escape(w), t)]
    assert not bad, bad
    for pat, conv, key in CLAIMS:
        for m in re.finditer(pat, t):
            assert conv(m.group(1)) == CODE[key], (key, m.group(0))


def test_signup_does_not_call_a_supported_source_unsupported():
    """תיקון עצמי (גבי שיווק 15.11): בהרשמה כתבתי «iCount — לא נתמך עדיין», אבל מאז נבנה מקור iCount
    (app/integrations/icount.py) ומסך ההגדרות מציע אותו. מקור שקיים ב-SOURCE_SYSTEMS לא יסומן «לא נתמך»."""
    settings = (ROOT / "web/src/lib/settings.ts").read_text(encoding="utf-8")
    supported = set(re.findall(r"key: '(\w+)'", settings.split("SOURCE_SYSTEMS")[1].split("];")[0]))
    signup = (ROOT / "web/src/pages/Signup.tsx").read_text(encoding="utf-8")
    for key, label in re.findall(r"\['(\w+)', '[^']+', '([^']+)'\]", signup):
        if key in supported:
            assert "לא נתמך" not in label, (key, label)


def test_video_script_synced_with_scenes_and_clean():
    """התסריט (script.md) נגזר מ-scenes.json; קריינות בלי «חוב» (messaging §3) ובאורך שנכנס ל-60 שניות."""
    import importlib.util
    import json
    spec = importlib.util.spec_from_file_location("vscript", ROOT / "marketing/video/script.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    assert m.main(["--check"]) == 0
    scenes = json.loads((ROOT / "marketing/video/scenes.json").read_text(encoding="utf-8"))
    vo = " ".join(s["vo"] for s in scenes)
    assert not re.search(r"(?<![א-ת])[הבלמושכ]{0,2}חוב(?![א-ת])", vo), "«חוב» בקריינות"
    assert "EZcount" not in vo or "בבדיקה" in vo
    assert len(vo.split()) / 2.3 <= 52, "הקריינות ארוכה מדי ל-60 שניות"
