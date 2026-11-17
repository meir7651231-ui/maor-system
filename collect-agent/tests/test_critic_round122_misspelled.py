"""critic סבב 122 · פער ותיק: ניסוחים יומיומיים עם שגיאות כתיב/סלנג SMS לא נתפסו — «my lawer will call u»,
«im reportin u to the cops» ⇒ unknown (לא משפטי דחוף); «i allready payed», «payed yesterday» ⇒ unknown (לא טענת תשלום);
«ur charging me for something i never got» ⇒ unknown (לא מחלוקת דחופה). אותיות גדולות/בלי גרש (DONT/IM) כבר תקינים."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


CASES = [
    ("my lawer will call u", Intent.LEGAL), ("talk to my lawyr", Intent.LEGAL),
    ("my atorney will contact you", Intent.LEGAL),
    ("im reportin u to the cops", Intent.LEGAL), ("calling the cops", Intent.LEGAL),
    ("i allready payed", Intent.PAID_CLAIM), ("payed yesterday", Intent.PAID_CLAIM),
    ("I payed it last week", Intent.PAID_CLAIM),
    ("ur charging me for something i never got", Intent.DISPUTE),
    ("you billed me for something i didnt order", Intent.DISPUTE),
]


@pytest.mark.parametrize("text,want", CASES)
def test_misspelled_everyday(text, want):
    d = _d(text)
    assert d.intent == want, (text, d.intent)
    if want in (Intent.LEGAL, Intent.DISPUTE):
        assert d.stop == Stop.PAUSE and d.escalate == Escalation.URGENT


TRAPS = [
    ("i never payed this", Intent.PAID_CLAIM), ("have i payed?", Intent.PAID_CLAIM),
    ("the cops show is on tv lol, ill pay friday", Intent.LEGAL),
    ("a layer of paint", Intent.LEGAL),
]


@pytest.mark.parametrize("text,bad", TRAPS)
def test_traps(text, bad):
    assert _d(text).intent != bad, (text, _d(text).intent)
