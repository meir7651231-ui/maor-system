"""לולאת גבי מנוע 17.11 בוקר — המשך לסבב 122 (שגיאות כתיב ב-SMS: lawer/atorney). בדיקה יזומה של שאר הכוונות המגינות
מצאה שגיאות כתיב נפוצות שלא נתפסו ⇒ unknown בלי עצירה: «stop txting», «stpo texting me», «unsubcribe»
(הסרה — ממשיכים לשלוח למי שביקש להפסיק), «reportin u to the polise», «i feel so hopless»."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["stop txting", "stpo texting me", "unsubcribe", "unsubsribe me pls",
                                  "pls stop msging me",
                                  "stop emailing me"])
def test_opt_out_typos(text):
    d = _d(text)
    assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT, (text, d.intent)


@pytest.mark.parametrize("text", ["reportin u to the polise", "im calling the polise"])
def test_police_typos(text):
    d = _d(text)
    assert d.intent == Intent.LEGAL and d.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["i feel so hopless", "feel so helples"])
def test_distress_typos(text):
    assert _d(text).intent == Intent.DISTRESS


@pytest.mark.parametrize("text", ["stop worrying, ill pay friday", "the police station is near my house"])
def test_traps(text):
    assert _d(text).intent not in (Intent.OPT_OUT, Intent.LEGAL)
