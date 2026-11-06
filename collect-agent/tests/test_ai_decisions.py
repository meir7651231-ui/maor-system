"""הכרעות מאיר 6.11 לתפקיד ה-AI: LLM מוק כבוי/fail-closed, ערבית/רוסית ⇒ בעל העסק, קטין,
אין חידוש אוטומטי אחרי השהיות "קשות", אימות סכום לפני שליחה, הסרה בכל הודעה."""
from datetime import timedelta

import pytest

from app.config import SafetyError
from app.conversation import Intent, Stop, foreign_language, respond
from app.inbox import ConversationInbox
from app.llm import MockLLM, SafeClassifier, load_classifier
from evals.harness import build_ctx

DANA = "050-1234567"


@pytest.fixture
def inbox(svc):
    svc.sync()
    return ConversationInbox(svc, llm=None)


def cust(svc):
    return svc.db.one("SELECT * FROM customers WHERE name='דנה כהן'")


def dana_reminders(svc, ids):
    inv = svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (cust(svc)["id"],))["id"]
    return [r for r in ids if svc.db.one("SELECT 1 FROM reminders WHERE id=? AND invoice_id=?", (r, inv))]


# ═══════════ LLM: כבוי כברירת מחדל, מוק בלבד, fail-closed ═══════════
def test_llm_disabled_by_default_and_real_provider_refused(svc, monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    assert load_classifier({}) is None
    assert ConversationInbox(svc).llm is None
    for bad in ("openai", "anthropic", "claude", "live"):
        with pytest.raises(SafetyError):
            load_classifier({"LLM_PROVIDER": bad})
    assert isinstance(load_classifier({"LLM_PROVIDER": "mock"}).provider, MockLLM)


def test_mock_llm_gets_redacted_text_and_cannot_send(svc):
    svc.sync()
    clf = SafeClassifier(MockLLM())
    inbox = ConversationInbox(svc, llm=clf)
    res = inbox.handle("sms", DANA, "דנה כהן כאן 050-1234567, יש לי בעיה מסוימת עם 1001")
    assert res["intent"] == "dispute" and res["escalation"] == "urgent" and not res["auto_sent"]
    prompt = clf.provider.seen[0]
    for leak in ("דנה", "כהן", "050", "1234567", "1001"):
        assert leak not in prompt
    assert svc.sender.sent == []


class Boom:
    name = "boom"

    def complete(self, prompt):
        raise TimeoutError("down")


class Says:
    name = "says"

    def __init__(self, out):
        self.out = out

    def complete(self, prompt):
        return self.out


@pytest.mark.parametrize("provider", [Boom(), Says("thanks"), Says("ok sure"), Says("plan_accept")])
def test_safe_classifier_fails_closed(provider):
    assert SafeClassifier(provider).classify("טקסט כלשהו") == "unknown"


def test_safe_classifier_refuses_unredacted_pii():
    p = Says("dispute")
    assert SafeClassifier(p).classify("התקשרו ל-0501234567") == "unknown"


def test_unclear_with_llm_off_goes_to_owner(inbox):
    res = inbox.handle("sms", DANA, "יש לי בעיה מסוימת")
    assert res["intent"] == "unknown" and res["escalate"] and res["draft_id"]
    assert inbox.drafts()[0]["status"] == "needs_owner"


# ═══════════ ערבית / רוסית ⇒ בעל העסק + עצירת אוטומציה ═══════════
@pytest.mark.parametrize("text,lang", [("لقد دفعت الفاتورة", "ar"), ("Я уже оплатил счёт", "ru"),
                                       ("שילמתי", None), ("I already paid", None)])
def test_foreign_language_detection(text, lang):
    assert foreign_language(text) == lang


def test_foreign_language_pauses_and_escalates_without_reply(inbox, svc):
    res = inbox.handle("sms", DANA, "Я уже оплатил счёт")
    assert res["intent"] == "unknown" and "foreign_language" in res["tags"]
    assert res["stop"] == "pause" and cust(svc)["paused_reason"] == "unknown"
    assert cust(svc)["opted_out"] == 0                    # לא מסירים — רק עוצרים ומעבירים
    assert inbox.drafts()[0]["status"] == "needs_owner" and inbox.drafts()[0]["body"] == ""


def test_foreign_language_never_sent_to_llm():
    llm = MockLLM()
    d = respond("لا أملك المال", build_ctx({}), llm=SafeClassifier(llm))
    assert llm.seen == [] and d.reply is None and d.stop == Stop.PAUSE


# ═══════════ קטין (ר-6) ═══════════
def test_minor_stops_without_reply(inbox, svc):
    res = inbox.handle("sms", DANA, "אני בן 13 זה הטלפון של אמא")
    assert res["intent"] == "minor" and res["escalation"] == "urgent"
    assert cust(svc)["paused_reason"] == "minor"
    assert inbox.drafts()[0]["status"] == "needs_owner"


def test_adult_age_is_not_minor():
    assert respond("אני בן 40 ושילמתי", build_ctx({})).intent == Intent.PAID_CLAIM


# ═══════════ אין חידוש אוטומטי ═══════════
HARD = [("שילמתי כבר", "paid_claim"), ("הסכום לא נכון", "dispute"), ("אני בת 15", "minor"),
        ("בעל החשבון, אבא שלי, נפטר", "deceased"), ("יש לי צו פתיחת הליכי חדלות פירעון", "insolvency"),
        ("העברתי לעורך דין", "legal")]


@pytest.mark.parametrize("text,reason", HARD)
def test_no_auto_resume_after_hard_pause(inbox, svc, clock, text, reason):
    inbox.handle("sms", DANA, text)
    assert cust(svc)["paused_reason"].startswith(reason)
    for _ in range(4):                        # 60 יום, כולל שחרור השהיות שפגו
        clock.now += timedelta(days=15)
        inbox.release_expired_pauses()
        assert dana_reminders(svc, svc.plan()) == []
    assert cust(svc)["paused_reason"].startswith(reason)


def test_no_auto_resume_after_opt_out(inbox, svc, clock):
    inbox.handle("sms", DANA, "הסר")
    clock.now += timedelta(days=60)
    assert dana_reminders(svc, svc.plan()) == [] and cust(svc)["opted_out"] == 1


def test_promise_after_paid_claim_does_not_make_pause_expire(inbox, svc, clock):
    inbox.handle("sms", DANA, "שילמתי")
    inbox.handle("sms", DANA, "ואם לא עבר, אשלם ביום שלישי")
    assert cust(svc)["paused_reason"] == "paid_claim"
    clock.now += timedelta(days=10)
    assert inbox.release_expired_pauses() == 0 and dana_reminders(svc, svc.plan()) == []


def test_soft_promise_pause_does_expire(inbox, svc, clock):
    inbox.handle("sms", DANA, "אשלם ביום שלישי")
    clock.now += timedelta(days=3)
    assert inbox.release_expired_pauses() == 1


def test_resync_does_not_clear_pause_or_opt_out(inbox, svc):
    inbox.handle("sms", DANA, "הסכום לא נכון")
    svc.sync()
    c = cust(svc)
    assert c["disputed"] == 1 and c["paused_reason"] == "dispute"


# ═══════════ אימות סכום לפני כל שליחה ═══════════
def test_draft_blocked_when_balance_changed(inbox, svc, fake_gi):
    d = inbox.handle("sms", DANA, "איך אפשר לשלם?")["draft_id"]
    fake_gi.docs[0]["amount"] = "700.00"            # תשלום חלקי נקלט בחשבונית ירוקה
    svc.sync()
    out = inbox.approve_draft(d)
    assert out["status"] == "rejected" and out["decided_by"] == "system:amount_changed"
    assert svc.sender.sent == []


def test_draft_blocked_when_invoice_closed(inbox, svc, fake_gi):
    d = inbox.handle("sms", DANA, "אפשר בתשלומים?")["draft_id"]
    fake_gi.docs[:] = [x for x in fake_gi.docs if x["id"] != "doc1"]
    svc.sync()
    assert inbox.approve_draft(d)["decided_by"] == "system:amount_changed"


def test_non_money_draft_not_blocked_by_balance(inbox, svc, fake_gi):
    d = inbox.handle("sms", DANA, "מי זה?")["draft_id"]
    fake_gi.docs[0]["amount"] = "700.00"
    svc.sync()
    assert inbox.approve_draft(d)["status"] == "sent_dry_run"


# ═══════════ הסרה בכל הודעה ═══════════
def test_every_reply_carries_opt_out(inbox, svc):
    sms = inbox.handle("sms", DANA, "איך אפשר לשלם?")["draft_id"]
    assert "להפסקה" in inbox._get(sms)["body"]
    em = inbox.handle("email", "c1@example.com", "איך אפשר לשלם?")["draft_id"]
    assert "להפסקת הודעות: https://gabi.example/u/" in inbox._get(em)["body"]


def test_owner_edit_gets_opt_out_back(inbox, svc):
    d = inbox.handle("email", "c1@example.com", "איך אפשר לשלם?")["draft_id"]
    out = inbox.approve_draft(d, body="שלום, הקישור לתשלום בדרך.")
    assert "להפסקת הודעות" in out["body"]


def test_opt_out_confirmation_has_no_extra_footer(inbox, svc):
    d = inbox.handle("sms", DANA, "הסר")["draft_id"]
    assert "להפסקה" not in inbox._get(d)["body"]
