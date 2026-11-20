"""חומר השיווק לא מבטיח «עריכת תזכורת» — המוצר לא מאפשר אותה.

הבאג: דף המספרות («אתה רואה ומאשר כל הודעה, ואפשר לערוך»), מייל הניסיון («לקרוא כל מילה, לערוך או
לדחות»), הודעת הפתיחה בבטא («אתה מאשר, עורך או דוחה»), מוקאפ ה-✎ ערוך והטיפ באונבורדינג ב-marketing.md.
בפועל לתזכורת יש רק אישור או דחייה (`POST /reminders/{rid}/approve|reject`, בלי טקסט), ובממשק תיבת הנוסח
נעולה: «עריכה — בשלב הבא». מה שכן ניתן לעריכה: **תשובה** בשיחה (`/conversation/drafts/{did}/approve` עם body).
נועל: (1) העובדה בקוד · (2) אף שורה בחומר השיווק לא מבטיחה עריכה, חוץ מעריכת תשובה בשיחה. כשהעריכה תיבנה
— הבדיקה הראשונה נכשלת, ואז מחזירים את הטענה בכוונה.
"""
import inspect
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FILES = [*sorted((ROOT / "marketing").glob("*.md")), *sorted((ROOT / "marketing/seo").glob("*.md")),
         *sorted((ROOT / "marketing/landing").rglob("*.html")), ROOT / "marketing/landing/for/build.py",
         ROOT / "marketing/library/index.html", ROOT / "marketing/faq/build.py",
         ROOT / "team/messaging.md", ROOT / "team/marketing.md", ROOT / "team/beta-kit.md",
         ROOT / "web/src/pages/Landing.tsx", *sorted((ROOT / "sales").glob("*.md"))]
# «ערכת» לא נכלל: בעברית זו גם «ערכה» (ערכת בטא). «מה ערכת?» נתפס דרך «לערוך» באותה שורה.
EDIT = re.compile(r"(?<![\w])(?:לערוך|עורך(?!\s*(?:ה?דין|-דין))|עורכ(?:ת|ים)|✎\s*ערוך|ערוך|עריכה)(?![\w])")
# עריכת תשובה בשיחה (קיימת) · הערות מחולל · עורך דין · «לא עורך» = גבי לא משנה מסמכים במערכת החשבוניות
ALLOWED = re.compile(r"תשוב|אל תערכו|עו״ד|עו\"ד|לא עורך|לא יוצר, לא עורך")


def test_reminders_have_no_edit_in_the_product():
    from app.service import CollectService
    params = set(inspect.signature(CollectService.approve).parameters)
    assert not params & {"text", "body", "sms", "edited"}, "נבנתה עריכת תזכורת — אפשר להחזיר את הטענה לשיווק"
    main = (ROOT / "app/main.py").read_text(encoding="utf-8")
    approve = main[main.index('@app.post("/reminders/{rid}/approve"'):main.index('@app.post("/reminders/{rid}/reject"')]
    assert "text" not in approve and "body.get(\"body\")" not in approve
    ui = (ROOT / "web/src/components/MessagePreview.tsx").read_text(encoding="utf-8")
    assert "עריכה — בשלב הבא" in ui


def test_conversation_replies_are_editable():
    """מה שמותר לומר: תשובה בשיחה אפשר לערוך לפני שהיא יוצאת."""
    main = (ROOT / "app/main.py").read_text(encoding="utf-8")
    assert re.search(r"approve_draft\(did, body=e\.body", main)


@pytest.mark.parametrize("path", FILES, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_marketing_does_not_promise_reminder_editing(path):
    bad = [f"{n}: {ln.strip()[:120]}" for n, ln in enumerate(path.read_text(encoding="utf-8").splitlines(), 1)
           if EDIT.search(ln) and not ALLOWED.search(ln)]
    assert not bad, f"{path.relative_to(ROOT)} מבטיח עריכת תזכורת שאין במוצר: {bad}"
