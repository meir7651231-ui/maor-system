"""הפעלה 234 (AI): כל owner_summary מצטט את הודעת הלקוח.

הבאג: סיכומים כמו «שאל/ה איך משלמים — נשלח קישור תשלום» או «אישר/ה קבלה» לא הראו מה הלקוח כתב בפועל.
בעל העסק מאשר/סוגר מהכרטיס (/ui, /app/) — סיווג שגוי (למשל «תודה, אבל אני לא חייב כלום» שנקרא כ«תודה»)
עבר בלי שיוכל לראות. עכשיו: ציטוט אחיד בכל מקרה, ובלי כפילות במקרים שכבר ציטטו (מחלוקת/לא זוהה/שפה זרה).
"""
import re
from pathlib import Path

import pytest

from app.conversation import _clip, _with_quote, respond
from evals.harness import build_ctx, run

EVALS = sorted((Path(__file__).parent.parent / "evals").glob("*.jsonl"))


def _quote(text: str) -> str:
    return _clip(re.sub(r"\s+", " ", text).strip())


def test_every_eval_case_summary_quotes_the_message():
    missing = []
    for p in EVALS:
        for r in run(p):
            text = r.case["text"]
            if not text.strip():
                continue
            s = r.decision.owner_summary
            if f"\"{_quote(text)}\"" not in s:
                missing.append(f"{r.case['id']}: {s}")
    assert not missing, missing[:10]


@pytest.mark.parametrize("text", ["איך משלמים?", "תודה רבה", "תתקשרו אליי בבקשה", "מי זה?"])
def test_previously_unquoted_intents_now_quote(text):
    d = respond(text, build_ctx({}))
    assert f"\"{text}\"" in d.owner_summary


def test_already_quoted_summary_not_doubled():
    d = respond("החשבונית הזאת לא נכונה, לא הזמנתי כלום", build_ctx({}))
    assert d.owner_summary.count("לא הזמנתי כלום") == 1


def test_foreign_language_quoted_once():
    d = respond("не пишите мне больше", build_ctx({}))
    assert d.owner_summary.count("не пишите") == 1


def test_long_message_clipped_and_whitespace_collapsed():
    text = "שלום\n\n" + "א" * 200
    s = _with_quote("x", text)
    assert "\n" not in s and s.endswith("…\"")
    assert len(s) < 100


def test_empty_message_leaves_summary():
    assert _with_quote("סיכום", "   ") == "סיכום"


def test_existing_quotes_show_original_text_not_normalized():
    """הבאג שנמצא בדרך: «חולק/ת על החוב» ו«לא זיהיתי» ציטטו את הטקסט המנורמל — «לא הזמנתי כלומ», SMS באותיות קטנות."""
    d = respond("לא הזמנתי כלום, זה לא שלי", build_ctx({}))
    assert "כלום" in d.owner_summary and "כלומ" not in d.owner_summary
    d = respond("Blah blah XYZ", build_ctx({}))
    assert "\"Blah blah XYZ\"" in d.owner_summary
