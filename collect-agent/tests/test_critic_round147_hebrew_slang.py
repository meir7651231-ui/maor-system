"""critic סבב 147 · סלנג צ׳אט בעברית (40 הודעות). פערים ⇒ unknown: סירוב «לא משלם», «אני לא משלם וזהו» (מחלוקת —
«לא אשלם» כבר נתפס) · הסרה «עזוב אותי», «עזוב אותי בשקט», «תשכחו ממני», «לא מעניין אותי», «חלאס», «חלאס עם ההודעות»,
«נמאס», «נמאס לי», «אל תכתבו לי», «אל תשלחו לי», «אל תשלחו לי כלום» · קטין «בן 15», «בן 15 אחי»."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx

CASES = [("לא משלם", Intent.DISPUTE), ("אני לא משלם וזהו", Intent.DISPUTE), ("עזוב אותי", Intent.OPT_OUT),
         ("עזוב אותי בשקט", Intent.OPT_OUT), ("תשכחו ממני", Intent.OPT_OUT), ("לא מעניין אותי", Intent.OPT_OUT),
         ("חלאס", Intent.OPT_OUT), ("חלאס עם ההודעות", Intent.OPT_OUT), ("נמאס", Intent.OPT_OUT),
         ("נמאס לי", Intent.OPT_OUT),
         ("אל תכתבו לי", Intent.OPT_OUT), ("אל תשלחו לי", Intent.OPT_OUT), ("אל תשלחו לי כלום", Intent.OPT_OUT),
         ("בן 15", Intent.MINOR), ("בן 15 אחי", Intent.MINOR), ("בת 13", Intent.MINOR)]


@pytest.mark.parametrize("t,want", CASES)
def test_hebrew_slang(t, want):
    assert respond(t, build_ctx({"channel": "sms"})).intent == want, t


@pytest.mark.parametrize("t,bad", [
    ("לא משלם היום, מחר", Intent.DISPUTE), ("לא משלם בביט, רק בהעברה", Intent.DISPUTE),
    ("אל תשלחו לי קישור, אני אעביר בבנק", Intent.OPT_OUT), ("עזוב אותי מהקישור, תן מספר חשבון", Intent.OPT_OUT),
    ("בן 15 שקל זה?", Intent.MINOR), ("לא מעניין אותי מתי, העיקר שתקבלו", Intent.OPT_OUT),
])
def test_hebrew_slang_traps(t, bad):
    d = respond(t, build_ctx({"channel": "sms"}))
    assert d.intent != bad, (t, d.intent)
