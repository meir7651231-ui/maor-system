"""critic סבב 155 · 🟡 לתיקון בונה (גבייה עיצוב) — רכיבים: `web/src/pages/Dashboard.tsx` → `PAUSE_LABEL`
ו-`app/ui.html` → `PAUSE`.

(1) `paused_reason='minor'` נקבע גם **ע״י המנוע** מהודעת הלקוח («אני בן 14» ⇒ minor; וכן deceased/insolvency מ-«אמא שלי
נפטרה» / «אני בפשיטת רגל»), לא רק מסימון בעל העסק — אבל התווית בשני המסכים היא «סימנתם: קטין/ה» / «סימנתם: נפטר/ה» /
«סימנתם: הליך חדלות פירעון». בעל העסק קורא שזה סימון שלו, וליד זה כפתור «↻ חידוש תזכורות» (לחיצה כפולה, בלי אזהרה) —
חידוש אחרי קטין ⇒ תזכורות חוב לטלפון של קטין. הצעה: ניסוח ניטרלי («קטין/ה — לפי הודעת הלקוח או סימון שלכם; לפנות להורה
לפני חידוש») + אזהרה מפורשת בחידוש לסיבות המגינות.
(2) סיבות השהיה חדשות בלי תווית ⇒ «מושהה עד שתבדקו» כללי: `shared_contact_urgent`, `shared_contact_paid_claim`
(החלטה 5 —
בעל העסק לא יודע שזה כרטיס כתובת משותפת ושעדיף לשייך דרכו), `sensitive` (מחלה/אשפוז/אבל).
הבדיקות `xfail(strict=True)` — מוכיחות בלי להפיל CI; אחרי התיקון strict ייכשל ⇒ להסיר xfail."""
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
DASH = (ROOT / "web" / "src" / "pages" / "Dashboard.tsx").read_text(encoding="utf-8")
UI = (ROOT / "app" / "ui.html").read_text(encoding="utf-8")
SOURCES = {"app": DASH, "ui": UI}


def test_engine_sets_minor_from_customer_message():
    """עובדה שהבאג נשען עליה (ירוק): המנוע — לא בעל העסק — מסמן minor."""
    from app.conversation import respond
    from evals.harness import build_ctx
    assert respond("אני בן 14", build_ctx({"channel": "sms"})).intent.value == "minor"


@pytest.mark.xfail(strict=True, reason="critic 155: לתיקון גבייה עיצוב — «סימנתם» על השהיה שהמנוע קבע")
@pytest.mark.parametrize("where", ["app", "ui"])
@pytest.mark.parametrize("key", ["minor", "deceased", "insolvency"])
def test_protective_label_not_attributed_to_owner(where, key):
    m = re.search(key + r"""\s*:\s*['"]([^'"]+)['"]""", SOURCES[where])
    assert m and not m.group(1).startswith("סימנתם"), (where, key, m and m.group(1))


@pytest.mark.xfail(strict=True, reason="critic 155: לתיקון גבייה עיצוב — סיבות השהיה חדשות בלי תווית")
@pytest.mark.parametrize("where", ["app", "ui"])
@pytest.mark.parametrize("key", ["shared_contact_urgent", "shared_contact_paid_claim", "sensitive"])
def test_new_pause_reasons_have_labels(where, key):
    assert re.search(key + r"\s*:", SOURCES[where]), (where, key)
