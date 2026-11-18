"""critic סבב 90 · 🔴 פער ותיק (קיים לפחות מ-027acca7): מילות הסרה עבריות נפוצות ב-SMS לא זוהו —
«סטופ» (STOP בתעתיק, נפוץ מאוד בישראל) ⇒ unknown · «עצור» לבד ⇒ unknown · «הסר!! כבר שילמתי» ⇒ רק השהיה
(ההסרה אבדה, כמו «STOP. I already paid» בסבב 88). כולן חייבות להסיר לצמיתות.
מלכודות: «עצרו את החיוב הכפול» ≠ הסרה (טענה על החוב), «הסרה של הקנס?» ≠ הסרה."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["סטופ", "סטופ!", "סטופ. כבר שילמתי", "עצור", "עצרו!", "תעצרו את ההודעות",
                                  "הסר!! כבר שילמתי", "הסר, טעיתם בסכום"])
def test_hebrew_stop_words_opt_out(text):
    d = _d(text)
    assert d.stop == Stop.PERMANENT and Intent.OPT_OUT in d.all_intents, (d.intent, d.stop)


@pytest.mark.parametrize("text", ["עצרו את החיוב הכפול", "אפשר הסרה של הקנס?", "סטופר הזמן נגמר לי, אשלם מחר"])
def test_traps_are_not_opt_out(text):
    assert _d(text).stop != Stop.PERMANENT
