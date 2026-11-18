"""critic סבב 140 · (1) 🔴 «הסר» לבד בשורה נפרדת לא זוהה: «תודה\\nהסר» ⇒ thanks, «קיבלתי\\n\\nהסר» ⇒ unknown — ההסרה
אבדה (התזכורות ממשיכות; חוק הספאם). התבנית הכירה «הסר» רק בתחילת ההודעה או אחרי .!? — לא אחרי ירידת שורה, שהיא
המפריד הנפוץ במייל וב-SMS רב-שורתי. (2) המשך ל-e2ecbc2a (נ.ב. אחרי חתימה): הזנב המגן החריג LEGAL לגמרי (כדי
לא להחזיר את «משרד עורכי דין» מסבבים 124/139) ⇒ «נ.ב. אני פונה לעורך דין» אחרי חתימה נבלע. עכשיו: LEGAL בזנב נשמר
כשיש בשורה פועל/בעלות (אני/שלי/פונה/אתבע/מעביר…) — כמו `_SIG_MINE`."""
import pytest

from app.channels import strip_reply
from app.conversation import Intent, respond
from evals.harness import build_ctx


@pytest.mark.parametrize("ch", ["sms", "email"])
@pytest.mark.parametrize("t", ["תודה\nהסר", "קיבלתי\n\nהסר", "בסדר\nהסירו", "ok\nstop", "thanks\nunsubscribe",
                               "קיבלתי\n\nהסר\n\nדנה"])
def test_bare_optout_on_own_line(t, ch):
    assert respond(t, build_ctx({"channel": ch})).intent == Intent.OPT_OUT, (t, ch)


@pytest.mark.parametrize("t", ["תודה\nהסרתי את החסימה, אשלם מחר", "קיבלתי\nהסרה של הקנס?",
                               "ok\nstop by tomorrow to pay"])
def test_optout_line_traps(t):
    assert respond(t, build_ctx({"channel": "sms"})).intent != Intent.OPT_OUT, t


Q = "\n> שלום, נשמח לתשלום"


@pytest.mark.parametrize("raw", ['תודה\nדנה לוי | עו"ד\nנ.ב. אני פונה לעורך דין',
                                 'תודה\n\nעו"ד דנה כהן\nהעו"ד שלי יתקשר'])
def test_legal_ps_after_signature_kept(raw):
    assert respond(strip_reply(raw + Q), build_ctx({"channel": "email"})).intent == Intent.LEGAL, strip_reply(raw + Q)


@pytest.mark.parametrize("raw", ["קיבלתי תודה\n\nדנה לוי\nלוי ושות׳ משרד עורכי דין\nטל׳ 03-1234567",
                                 "קיבלתי תודה\n\nDana Levi\nLevi & Co. Law Offices"])
def test_firm_name_tail_still_not_legal(raw):
    assert respond(strip_reply(raw + Q), build_ctx({"channel": "email"})).intent != Intent.LEGAL, strip_reply(raw + Q)
