"""«שום הודעה לא יוצאת בלי שאישרת» — הטענה המרכזית בכל חומר השיווק — מול מצב `safe_auto` של מנוע השיחה.

critic סבב 152 (be73cc00): במצב safe_auto תשובות מידע (קישור תשלום, «מי זה», אישור הסרה, טעות במספר)
יוצאות ללקוח לבד, והמייל לבעל העסק טען שלא. היום safe_auto **לא נגיש** בשום דרך מהמוצר: השירות בונה את
תיבת השיחות בלי מדיניות (ברירת המחדל approval_mode="all"), ואין לו הגדרה, משתנה סביבה, API או מסך.
לכן הטענה בשיווק נכונה. נועל: אם מישהו מחבר את safe_auto למוצר, הבדיקה הזו נכשלת עד שהקופי מתעדכן
(דף הנחיתה, /app/, messaging, פוסטים, שאלות נפוצות) — טענה שיווקית לא נשארת מאחור בשקט.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# מקומות שבהם safe_auto מוגדר/ממומש (המנוע עצמו) — לא «חיבור למוצר»
ENGINE = {"app/conversation.py", "app/inbox.py"}
CLAIM = re.compile(r"(?:שום|אף) הודעה לא יוצאת בלי|מאשר\w* כל הודעה|כל הודעה מחכה לאישור")
MARKETING = ["marketing/landing/index.html", "web/src/pages/Landing.tsx", "team/messaging.md", "marketing/posts.md",
             "marketing/faq/index.html"]


def test_production_inbox_uses_approve_all():
    from app.conversation import OwnerPolicy
    assert OwnerPolicy().approval_mode == "all"
    svc = (ROOT / "app/service.py").read_text(encoding="utf-8")
    calls = re.findall(r"ConversationInbox\(([^)]*)\)", svc)
    assert calls == ["self"], f"השירות בונה את תיבת השיחות עם מדיניות — לבדוק את טענת האישור בשיווק: {calls}"


def _code_lines(path: Path):
    """שורות קוד בלי הערות (# ב-Python, // ב-TS) — הערה שמזכירה safe_auto אינה נתיב הפעלה."""
    for n, ln in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
        code = re.sub(r"#.*$", "", ln) if path.suffix == ".py" else re.sub(r"//.*$", "", ln)
        yield n, code


def test_safe_auto_is_not_reachable_from_product_surfaces():
    """אין הגדרה/סביבה/API/מסך שמדליקים safe_auto. מוטציה: approval_mode ב-settings_api או OwnerPolicy(...)
    בשירות ⇒ נכשל."""
    surfaces = [*(p for p in (ROOT / "app").rglob("*.py") if p.relative_to(ROOT).as_posix() not in ENGINE),
                *(ROOT / "web/src").rglob("*.ts*")]
    rx = re.compile(r"safe_auto|approval_mode|OwnerPolicy\(")
    bad = [f"{p.relative_to(ROOT)}:{n}" for p in surfaces for n, code in _code_lines(p) if rx.search(code)]
    assert not bad, f"safe_auto חובר למוצר ב-{bad} — לעדכן את «כל הודעה באישורך» בשיווק ואז את הבדיקה"


def test_marketing_still_makes_the_claim_that_this_guards():
    for rel in MARKETING:
        text = (ROOT / rel).read_text(encoding="utf-8")
        assert CLAIM.search(text), f"{rel}: אין טענת אישור — הבדיקה הזו כבר לא צריכה לשמור עליה?"
