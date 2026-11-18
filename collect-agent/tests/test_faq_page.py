"""«שאלות נפוצות» (marketing/faq): 10 ההתנגדויות מתסריט השיחה, כל תשובה נעולה לקוד.

BACKLOG «גבי שיווק»: דף אחד שעונה על ההתנגדויות של מכירות. הסכנה: דף שאלות שמבטיח משהו שהמוצר לא
עושה (או הפסיק לעשות). נועל: הדף מעודכן מול המחולל · 10 שאלות שמכסות את התסריט · כל טענה התנהגותית
רצה מול הקוד (ושבירה שלה מפילה את הבנייה — מוטציה) · בלי מילים אסורות · מקושר מדף הנחיתה ונבדק בנגישות.
"""
import html
import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAQ_DIR = ROOT / "marketing/faq"
spec = importlib.util.spec_from_file_location("faqbuild", FAQ_DIR / "build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

# ההתנגדויות בתסריט (sales/call-script.md §3–§4) ⇒ מילת מפתח שחייבת להופיע בשאלה
OBJECTIONS = {"לא נעים": "לא נעים", "אין זמן": "אין לי זמן", "כבר שולחת תזכורות": "כבר שולחת",
              "יעצבן": "יעצבן", "כמה זה עולה": "כמה זה עולה", "אחוז": "אחוז", "פרטיות": "פרטיות",
              "לא עובד": "לא מתאים", "WhatsApp": "WhatsApp", "מכתב התראה": "מכתב התראה"}


def _text():
    p = FAQ_DIR / "index.html"
    assert p.is_file(), "חסר marketing/faq/index.html (python3 marketing/faq/build.py)"
    return p.read_text(encoding="utf-8")


def _prose():
    return html.unescape(re.sub(r"<style>.*?</style>|<script.*?</script>|<[^>]+>", " ", _text(), flags=re.S))


def test_faq_is_fresh_and_every_claim_holds_in_code():
    assert build.main(["--check"]) == 0
    assert build.failed_locks() == []


def test_ten_questions_cover_the_call_script_objections():
    script = (ROOT / "sales/call-script.md").read_text(encoding="utf-8")
    qs = [f["q"] for f in build.FAQ]
    assert len(qs) == 10
    for in_script, in_faq in OBJECTIONS.items():
        assert in_script in script, f"ההתנגדות «{in_script}» כבר לא בתסריט — לעדכן את המיפוי"
        assert any(in_faq in q for q in qs), f"אין שאלה על «{in_script}»"
    t = _text()
    assert all(html.escape(q) in t for q in qs)


def test_numbers_come_from_code():
    from app import policy
    from app.config import Settings
    s, p = Settings(), _prose()
    assert f"₪{s.price_ils_month} לחודש או ₪{s.price_ils_year:,} לשנה, כולל מע״מ ככל שחל" in p
    assert f"{s.trial_days} ימי ניסיון" in p
    assert f"לכל היותר {policy.MAX_REMINDERS_PER_INVOICE} תזכורות" in p
    assert f"{policy.DAY[0]:%H:%M}" in p and f"{policy.DAY[1]:%H:%M}" in p


def test_broken_claim_fails_the_build(monkeypatch):
    """מוטציה: אם מסנן הניסוח מפסיק לחסום מכתב דרישה, או גבי מפסיק לעצור על «שילמתי» — הבנייה נכשלת."""
    monkeypatch.setattr(build.compliance, "violations", lambda *a, **k: [])
    assert "אתם שולחים מכתב התראה?" in build.failed_locks()
    monkeypatch.undo()
    real = build.conversation.respond

    def no_stop(text, ctx, **kw):
        d = real(text, ctx, **kw)
        object.__setattr__(d, "stop", build.conversation.Stop.NONE)
        return d
    monkeypatch.setattr(build.conversation, "respond", no_stop)
    assert "מערכת החשבוניות שלי כבר שולחת תזכורות." in build.failed_locks()
    assert build.main(["--check"]) == 1


def test_no_forbidden_or_unproven_wording():
    p = _prose()
    for bad in ("מובטח", "מבטיחים", "100%", "חוקי", "מוצפן", "גבייה", "הוצל", "חוב ", "נגבה בשבילך", "וואטסאפ בקרוב",
                "בקרוב", "מאושר על ידי"):
        assert bad not in p, bad
    assert "WhatsApp?" in p and "גבי שולח SMS ומייל." in p   # עונים רק מה יש, בלי הבטחה לעתיד


def test_draft_noindex_footer_and_linked_from_landing():
    t = _text()
    assert 'name="robots" content="noindex' in t and "טיוטה, לא לפרסום" in t
    for href in ("../terms.html", "../privacy.html", "../accessibility.html"):
        assert href in t and (FAQ_DIR / href).resolve().is_file()
    landing = (ROOT / "marketing/landing/index.html").read_text(encoding="utf-8")
    assert 'href="../faq/index.html"' in landing
    assert "faq/index.html" in (ROOT / "web/e2e/a11y.mjs").read_text(encoding="utf-8")
