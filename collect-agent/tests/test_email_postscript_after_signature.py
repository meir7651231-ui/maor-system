"""לולאה 18.11 (המשך לסבבים 124/139 — חתימות עו״ד): אחרי חתימה מזוהה נחתך הכול, גם נ.ב. מגן שנכתב אחריה:
«תודה / בברכה, / עו״ד דנה כהן / אל תשלחו יותר הודעות» ⇒ «תודה» ⇒ ההסרה נבלעה. עכשיו: שארית אחרי חתימה
נשמרת רק אם יש בה הסרה/מצוקה/קטין/מספר שגוי/מחלוקת (לא legal — שורות החתימה הן מקור ה-legal-שווא)."""
import pytest

from app.channels import strip_reply


@pytest.mark.parametrize("raw,keep", [
    ("תודה\n\nבברכה,\nעו״ד דנה כהן\nאל תשלחו יותר הודעות", "אל תשלחו יותר הודעות"),
    ("Thanks\n\nDana Cohen, Attorney at Law\nP.S. please stop texting me", "please stop texting me"),
    ("תודה\n\nעו״ד דנה כהן\nנ.ב. הבן שלי בן 14 ענה קודם", "בן 14"),
])
def test_protective_postscript_kept(raw, keep):
    assert keep in strip_reply(raw)


@pytest.mark.parametrize("raw", [
    "קיבלתי, תודה\n\nעו״ד דנה כהן",
    "תודה\n\nדנה כהן, עו״ד\nמשרד עורכי דין כהן ושות׳\nטל 03-1234567",
    "תודה\n\nעו״ד דנה כהן\nהודעה זו חסויה ומיועדת לנמען בלבד",
    "תודה\nעו״ד דנה כהן\n\nOn Mon, 16 Nov 2026, X <x@y.com> wrote:\n> להסרה השיבו הסר",
])
def test_signature_noise_still_dropped(raw):
    assert strip_reply(raw).strip() == ("קיבלתי, תודה" if raw.startswith("קיבלתי") else "תודה")
