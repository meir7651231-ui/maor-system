"""critic סבב 91 · 🔴 7ffbd861 (סבב 10 במנוע): «רק <ערוץ>» מוריד OPT_OUT (העדפת ערוץ ≠ הסרה), אבל ההשהיה+כרטיס
של העדפת ערוץ נדלקים רק בניסוחים מסוימים («אל תשלחו… ב<ערוץ>»). כשהבקשה נוסחה אחרת — ההסרה ירדה ולא בא כלום:
«סטופ, רק בטלפון» / «עצור. רק בטלפון» / «לא רוצה לקבל הודעות, רק טלפון» ⇒ unknown, stop=none ⇒ התזכורות ממשיכות.
תיקון: (1) מילות הסרה מפורשות (סטופ/עצור/לא רוצה לקבל) לא נכנסות להורדה; (2) כל הורדת OPT_OUT בגלל העדפת ערוץ
⇒ לפחות השהיה + כרטיס (לעולם לא «כלום»)."""
import pytest

from app.conversation import Escalation, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["סטופ, רק בטלפון", "עצור. רק בטלפון", "לא רוצה לקבל הודעות, רק טלפון",
                                  "אל תשלחו לי מיילים, רק בסמס", "לא מעוניין בהודעות, רק בוואטסאפ"])
def test_channel_preference_never_ends_with_nothing(text):
    d = _d(text)
    assert d.stop in (Stop.PAUSE, Stop.PERMANENT) and d.escalate != Escalation.NONE, (d.intent, d.stop, d.escalate)


@pytest.mark.parametrize("text", ["סטופ, רק בטלפון", "עצור. רק בטלפון"])
def test_explicit_stop_word_stays_permanent(text):
    assert _d(text).stop == Stop.PERMANENT
