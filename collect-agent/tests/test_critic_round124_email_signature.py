"""critic סבב 124 · באג בערוץ המייל: החתימה של הלקוח עצמו נכנסה לסיווג. לקוח שהוא עורך/ת דין או משרד עם
«יעוץ משפטי», או חתימה עם הודעת-סודיות סטנדרטית («הודעה זו חסויה ומיועדת לנמען בלבד», «CONFIDENTIALITY NOTICE:
… privileged and confidential») ⇒ «קיבלתי תודה» ⇒ legal + השהיה + מייל דחוף לבעל העסק — בכל מייל.
התיקון ב-strip_reply חותך רק: (1) שורת הודעת-סודיות (לא שורה ראשונה); (2) שורת תואר-חתימה קצרה
(«שם | עורכת דין», «Name, Attorney at Law») — לא שורה ראשונה, בלי «שלי/my». איום אמיתי בגוף נשמר."""
import pytest

from app.channels import strip_reply
from app.conversation import Intent, respond
from evals.harness import build_ctx

Q = "\n> שלום דנה, נשמח לתשלום\n> להסרה השיבו הסר"
SIGS = [
    "\n\nדנה לוי | עורכת דין\nהודעה זו חסויה ומיועדת לנמען בלבד. אם קיבלת אותה בטעות, נא הודע לשולח ומחק אותה.",
    "\n\nDana Levi, Attorney at Law\nCONFIDENTIALITY NOTICE: This email is privileged and confidential. "
    "If you received it in error, please notify the sender and delete it.",
    "\n\nבברכה,\nדנה\nמשרד רואי חשבון | יעוץ משפטי ומס",
    "\n\nבברכה,\nדנה לוי, עו\"ד",
    "\n\nThis message is intended only for the named recipient and may contain privileged information.",
]


def _d(raw):
    return respond(strip_reply(raw), build_ctx({"channel": "email"}))


@pytest.mark.parametrize("sig", SIGS)
def test_customer_signature_not_legal(sig):
    d = _d("קיבלתי תודה" + sig + Q)
    assert d.intent != Intent.LEGAL, (d.intent, strip_reply("קיבלתי תודה" + sig + Q))


@pytest.mark.parametrize("raw", [
    "קיבלתי תודה\nאבל העו\"ד שלי יתקשר אליכם",
    "תודה, עורך הדין שלי יטפל בזה",
    "שלום\nאני פונה לעורך דין" + Q,
    "Thanks,\nmy attorney will contact you",
    "דנה לוי | עורכת דין\nאני אתבע אתכם",                  # שורה ראשונה לא נחתכת
    "שלום,\nאני לא משלם, נתראה בבית משפט\n\nדנה לוי | עורכת דין",  # האיום בגוף נשאר
    "שלום\nלא משלם, עורך דין",
    "שלום\nלא משלם | עורך דין",
    "hi\nnot paying, see my lawyer",
])
def test_real_legal_in_body_kept(raw):
    assert _d(raw).intent == Intent.LEGAL, (raw, strip_reply(raw))
