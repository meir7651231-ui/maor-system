"""critic סבב 142 · homoglyphs/רוחב-מלא (1d39258a) ✓, וגם RLM/רוחב-אפס/מקף-רך/ניקוד/טעמים בין אותיות ✓. פער: אותיות
מופרדות ברווחים/נקודות — «ה ס ר», «ה.ס.ר», «S T O P», «ת-פ-ס-י-ק-ו», «א נ י ר ו צ ה ל מ ו ת» ⇒ unknown (ההסרה/המצוקה
אבדו). הודעה שכולה אותיות בודדות ⇒ מסווגת כמילה המחוברת (ואז `_deglue` של הצוות מפרק «אנירוצהלמות»)."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx


@pytest.mark.parametrize("t,want", [
    ("ה ס ר", Intent.OPT_OUT), ("ה.ס.ר", Intent.OPT_OUT), ("S T O P", Intent.OPT_OUT), ("s.t.o.p", Intent.OPT_OUT),
    ("ת-פ-ס-י-ק-ו", Intent.OPT_OUT), ("א נ י ר ו צ ה ל מ ו ת", Intent.DISTRESS), ("ע ו ר ך ד י ן", Intent.LEGAL),
    ("ל א ח י י ב ל כ ם כ ל ו ם", Intent.DISPUTE),
])
def test_spaced_letters(t, want):
    assert respond(t, build_ctx({"channel": "sms"})).intent == want, t


@pytest.mark.parametrize("t", ["ב 5 אשלם", "א ב", "ok", "1 2 3"])
def test_not_affected(t):
    assert respond(t, build_ctx({"channel": "sms"})).intent not in (Intent.OPT_OUT, Intent.DISTRESS), t
