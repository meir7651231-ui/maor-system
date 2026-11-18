"""טענות הבידול: SMS ושמירת שבת **אינם** בידול; הבידול = אישור לכל הודעה · תשובות הלקוח מגיעות לבעל
העסק · עצירה אחרי 3 תזכורות.

ממצא גבי מחקר (team/market.md §1.6, 15.11): ה«נודניק» של iCount שולח SMS ב-₪29 לחודש, ו-morning כבר
דוחה תזכורת שיוצאת בשבת או בחג ליום שאחרי. דף הנחיתה פתח ב«תזכורות מנומסות ב-SMS ובמייל» — כלומר הציג
את הערוץ כמה שמייחד את גבי. נועל: במקומות שמציגים את גבי (תיאור הדף, משפט הפתיחה, משפט הפתיחה בדפי
הענף ובשאלות הנפוצות, כותרות הפוסטים) אין SMS/שבת/חג; במשפטי הפתיחה של שני דפי הנחיתה יש את שלושת
מרכיבי הבידול; ואין בשום חומר שיווקי טענת בלעדיות על SMS או שבת. הערוצים והשעות נשארים כמידע (רשימת
«אתה בשליטה», שאלות נפוצות) — שם הם עובדה, לא בידול.
"""
import html
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
NOT_A_DIFF = re.compile(r"SMS|סמס|(?<![\w])[בוה]?שבת(?![\w])|(?<![\w])[בוה]?חג(?![\w])|וואטסאפ|WhatsApp", re.I)
# שלושת מרכיבי הבידול (כל אחד: אחת מהצורות)
DIFF = {"אישור לכל הודעה": re.compile(r"מאשר\w* כל הודעה"),
        "תשובות מגיעות לבעל העסק": re.compile(r"תשובות? (?:של )?ה?לקוח\w* מגיע\w* אלי(?:ך|כם)"),
        "עצירה אחרי 3": re.compile(r"(?:אחרי|עד) 3 תזכורות[^.]*עוצר")}


def _txt(s: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", " ", s)).strip()


def _static_landing():
    t = (ROOT / "marketing/landing/index.html").read_text(encoding="utf-8")
    meta = re.search(r'<meta name="description" content="([^"]*)"', t).group(1)
    lead = re.search(r'<p class="lead">(.*?)</p>', t, re.S).group(1)
    return {"דף סטטי · תיאור": html.unescape(meta), "דף סטטי · פתיחה": _txt(lead)}


def _designed_landing():
    t = (ROOT / "web/src/pages/Landing.tsx").read_text(encoding="utf-8")
    m = re.search(r'data-testid="hero-title".*?</h1>\s*<p[^>]*>(.*?)</p>', t, re.S)
    assert m, "לא נמצא משפט הפתיחה מתחת לכותרת ב-Landing.tsx"
    return {"דף מעוצב /app/ · פתיחה": _txt(m.group(1))}


def _slots():
    slots = {**_static_landing(), **_designed_landing()}
    for p in sorted((ROOT / "marketing/landing/for").glob("*.html")) + [ROOT / "marketing/faq/index.html"]:
        lead = re.search(r'<p class="lead">(.*?)</p>', p.read_text(encoding="utf-8"), re.S)
        slots[f"{p.relative_to(ROOT)} · פתיחה"] = _txt(lead.group(1))
    posts = (ROOT / "marketing/posts.md").read_text(encoding="utf-8")
    for n, hook in re.findall(r"^## פוסט (\d)[^\n]*\n\*\*(.+?)\*\*", posts, re.M):
        slots[f"פוסט {n} · כותרת"] = hook
    msg = (ROOT / "team/messaging.md").read_text(encoding="utf-8")
    slots["messaging · משפט אחד"] = re.search(r"^\| \*\*משפט אחד\*\* \| (.+?) \|$", msg, re.M).group(1)
    slots["messaging · משפט (§5)"] = re.search(r"^- \*\*משפט:\*\* (.+)$", msg, re.M).group(1)
    return slots


@pytest.mark.parametrize("name", list(_slots()))
def test_positioning_slot_does_not_sell_sms_or_shabbat(name):
    text = _slots()[name]
    assert not NOT_A_DIFF.search(text), f"{name}: «{NOT_A_DIFF.search(text).group(0)}» מוצג כבידול — {text}"


@pytest.mark.parametrize("name", ["דף סטטי · תיאור", "דף סטטי · פתיחה", "דף מעוצב /app/ · פתיחה",
                                  "messaging · משפט אחד", "messaging · משפט (§5)"])
def test_landing_openers_carry_the_three_differentiators(name):
    text = _slots()[name]
    missing = [k for k, rx in DIFF.items() if not rx.search(text)]
    assert not missing, f"{name}: חסר {missing} — {text}"


def test_differentiators_are_true_in_code():
    """כל מרכיב בידול מגובה בקוד: 3 תזכורות · תשובה מעמוד הלקוח מגיעה לבעל העסק ועוצרת · תזכורת נולדת ממתינה לאישור."""
    from app import policy, service
    from app.main import landing_done
    assert policy.MAX_REMINDERS_PER_INVOICE == 3
    assert service.ACTIVE[0] == "pending_approval"
    assert "העברנו לבעל העסק" in landing_done("paid", {}) and "נעצרו" in landing_done("paid", {})
    assert "בעל העסק" in landing_done("plan", {})


def test_no_exclusivity_claim_about_sms_or_shabbat_anywhere():
    rx = re.compile(r"(?:רק גבי|היחיד\w*|אין לאף אחד|אף אחד לא|בניגוד ל)[^.\n]{0,40}(?:SMS|סמס|שבת|חג)", re.I)
    files = [*ROOT.glob("marketing/**/*.html"), *ROOT.glob("marketing/**/*.md"), ROOT / "web/src/pages/Landing.tsx",
             *ROOT.glob("sales/*.md")]
    bad = [f"{p.relative_to(ROOT)}: {m.group(0)}" for p in files
           for m in rx.finditer(p.read_text(encoding="utf-8", errors="ignore"))]
    assert not bad, bad
