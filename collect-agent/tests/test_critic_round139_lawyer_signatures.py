"""critic סבב 139 · המשך לסבב 124 / מנהל 280–281: צורות נפוצות של חתימת עו״ד ישראלי עדיין לא נחתכו מהמייל ⇒
«קיבלתי תודה» ⇒ legal + השהיה + מייל דחוף: «דנה לוי, עו"ד ונוטריון», «עו"ד דנה לוי» (תואר לפני השם),
«דנה לוי - משרד עורכי דין» (מקף רגיל), «לוי ושות׳, עורכי דין». איום אמיתי (גם בצורה של שורה קצרה) נשאר."""
import pytest

from app.channels import strip_reply
from app.conversation import Intent, respond
from evals.harness import build_ctx

Q = "\n> שלום, נשמח לתשלום"


def _i(raw):
    return respond(strip_reply(raw), build_ctx({"channel": "email"})).intent


@pytest.mark.parametrize("sig", ['דנה לוי, עו"ד ונוטריון', 'עו"ד דנה לוי', "דנה לוי - משרד עורכי דין",
                                 "דנה לוי\nלוי ושות׳, עורכי דין", 'דנה לוי, עו"ד ומגשרת'])
def test_signature_not_legal(sig):
    assert _i("קיבלתי תודה\n\n" + sig + Q) != Intent.LEGAL, sig


@pytest.mark.parametrize("raw", [
    'שלום\nעו"ד בדרך אליכם', 'שלום\nעו"ד שלי יתקשר', "שלום\nלא משלם - עורכי דין יטפלו",
    'שלום\nלא משלם, עו"ד ונוטריון בדרך', 'קיבלתי\nמעביר לעו"ד', "שלום\nאני פונה לעורכי דין",
])
def test_real_threat_kept(raw):
    assert _i(raw) == Intent.LEGAL, (raw, strip_reply(raw))
