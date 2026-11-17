"""המשך לסבב 125 (נושא המייל): הנושא נקרא רק כשהגוף ריק. אבל גוף שלא אומר כלום («תודה», «נשלח מה-iPhone שלי»,
«בברכה, דנה») אינו ריק ⇒ «הסר» / «לא חייב לכם כלום» בשורת הנושא נבלעו בשקט והתזכורות המשיכו.
עכשיו: נושא **מגן** + גוף בלי תוכן ⇒ הנושא מצטרף. גוף עם תוכן ⇒ כמו בסבב 125, הנושא לא משנה דבר."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_flow import first_cycle


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _post(api, subject, text, mid="<t1@mail>"):
    body = {"sender": "Dana Cohen <C1@Example.com>", "message_id": mid, "text": text, "subject": subject}
    return api.post("/webhooks/email?k=ewk-test", json=body).json()


@pytest.mark.parametrize("text", ["תודה", "נשלח מה-iPhone שלי", "Thanks"])
def test_opt_out_subject_with_thin_body(api, svc, text):
    first_cycle(api)
    r = _post(api, "Re: הסר אותי", text)
    assert r.get("intent") == "opt_out", r
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1


def test_dispute_subject_with_thin_body(api, svc):
    first_cycle(api)
    r = _post(api, "לא חייבת לכם כלום", "תודה")
    assert r.get("intent") == "dispute", r


def test_substantive_body_still_wins(api, svc):
    first_cycle(api)
    r = _post(api, "Re: הסר", "שילמתי בהעברה")
    assert r.get("intent") == "paid_claim", r
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0


def test_non_protective_subject_ignored(api, svc):
    first_cycle(api)
    r = _post(api, "Re: תזכורת תשלום", "תודה")
    assert r.get("intent") == "thanks", r


# בדרך נמצא באג במנוע עצמו: «הסר אותי» נתפס רק כמשפט שלם (או עם «תודה» בעברית) — «הסר אותי\nThanks»,
# «הסר אותי\nנשלח מה-iPhone שלי» (חתימת מייל) ו-«הסר את המספר שלי» ⇒ לא הסרה.
@pytest.mark.parametrize("text", ["הסר אותי\nThanks", "הסר אותי\nנשלח מה-iPhone שלי", "הסר את המספר שלי",
                                  "הסירו אותנו מהרשימה"])
def test_engine_remove_me_with_tail(text):
    from app.conversation import Intent, Stop, respond
    from evals.harness import build_ctx
    d = respond(text, build_ctx({"channel": "email"}))
    assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT


@pytest.mark.parametrize("text", ["אל תסירו אותי, אשלם", "הסר את הקנס ואשלם"])
def test_engine_not_opt_out(text):
    from app.conversation import Intent, respond
    from evals.harness import build_ctx
    assert respond(text, build_ctx({"channel": "email"})).intent != Intent.OPT_OUT
