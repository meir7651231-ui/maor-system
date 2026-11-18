"""critic סבב 88 · 🔴 7f4788ce (סבב 9 במנוע) צמצם את «stop» להסרה רק כשהוא **בסוף** ההודעה (כדי ש-"stop worrying"
לא יסיר). אבל STOP בתחילת SMS הוא בקשת הסרה תקנית, גם כשאחריו טקסט:
«STOP. I already paid» ⇒ רק השהיה (היה: הסרה) · «stop it, this is harassment» ⇒ unknown, שום עצירה (היה: הסרה).
תיקון: stop כפקודה בתחילת משפט (אחרי תחילת הודעה או סוף משפט), חוץ מ-stop worrying / don't stop."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["STOP. I already paid", "stop it, this is harassment", "Stop! no more messages",
                                  "ok. stop. thanks", "STOP"])
def test_leading_stop_is_permanent_opt_out(text):
    d = _d(text)
    assert d.stop == Stop.PERMANENT and Intent.OPT_OUT in (d.all_intents or [d.intent]), (d.intent, d.stop)


@pytest.mark.parametrize("text", ["stop worrying, I will pay friday", "don't stop the service, I will pay",
                                  "I will pay at the bus stop tomorrow"])
def test_non_command_stop_is_not_opt_out(text):
    assert _d(text).stop != Stop.PERMANENT
