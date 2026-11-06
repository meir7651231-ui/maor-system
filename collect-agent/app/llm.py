"""מתאם LLM לסיווג תשובות "לא ברורות" — כבוי כברירת מחדל. אין ספק אמיתי בקוד.

הכרעת מאיר (6.11): לא מחברים LLM אמיתי ולא מבקשים API key. לכן:
  • `LLM_PROVIDER` = "disabled" (ברירת מחדל) או "mock". כל ערך אחר ⇒ קריסה בעלייה (SafetyError).
  • `MockLLM` דטרמיניסטי ואופליין — רק כדי לבדוק את הצנרת (טשטוש, אימות פלט, fail-closed).
  • `SafeClassifier` עוטף כל ספק: מקבל רק טקסט מטושטש, מחזיר רק ערך מתוך רשימה סגורה,
    וכל חריגה / פלט לא חוקי / טקסט עם PII שדלף / זמן ארוך ⇒ "unknown" ⇒ בעל העסק (fail-closed).
  • גם כשהסיווג מצליח, מנוע השיחה לא שולח בגללו כלום: לפחות הסלמה רגילה, תמיד טיוטה לאישור.

שלב עתידי (דורש הכרעת מאיר + DPA + העברה לחו"ל לפי תיקון 13): ספק אמיתי יממש `Provider.complete`.
"""
from __future__ import annotations

import re
import time
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Protocol

from .config import SafetyError

ALLOWED_PROVIDERS = ("disabled", "mock")
# מה שה-LLM רשאי להחזיר. בכוונה בלי thanks (משתיק את בעל העסק) ובלי כוונות מבוססות-הקשר.
ALLOWED_LABELS = frozenset({
    "distress", "minor", "opt_out", "wrong_person", "legal", "dispute", "paid_claim", "cant_pay",
    "plan_request", "promise", "copy_request", "how_to_pay", "callback", "who_is_this", "abusive",
    "unknown"})
_PII = re.compile(r"\d{7,}|@|\+972|05\d[- ]?\d{3}")


class Provider(Protocol):
    name: str

    def complete(self, prompt: str) -> str: ...


@dataclass
class MockLLM:
    """ספק מדומה: מחזיר תווית לפי מילות מפתח פשוטות. מתעד כל prompt שקיבל (לבדיקות)."""
    name: str = "mock"
    seen: list[str] = field(default_factory=list)
    table: tuple[tuple[str, str], ...] = (
        ("בעיה", "dispute"), ("כסף", "cant_pay"), ("קבלה", "copy_request"), ("לשלם", "how_to_pay"))

    def complete(self, prompt: str) -> str:
        self.seen.append(prompt)
        text = prompt.rsplit("הודעה:", 1)[-1]
        return next((label for kw, label in self.table if kw in text), "unknown")


PROMPT = ("סווג את הודעת הלקוח לתווית אחת בלבד מתוך: {labels}. "
          "אם יש ספק — unknown. החזר רק את התווית.\nהודעה: {text}")


@dataclass
class SafeClassifier:
    """עוטף ספק. הממשק תואם ל-conversation.LLMClassifier (classify(text) -> str)."""
    provider: Provider
    max_seconds: float = 3.0
    calls: int = 0
    failures: int = 0

    def classify(self, redacted_text: str) -> str:
        self.calls += 1
        if _PII.search(redacted_text or ""):
            # הטקסט אמור להגיע מטושטש (conversation.redact_for_llm). אם לא — לא שולחים.
            self.failures += 1
            return "unknown"
        prompt = PROMPT.format(labels=", ".join(sorted(ALLOWED_LABELS)), text=redacted_text)
        t0 = time.monotonic()
        try:
            out = str(self.provider.complete(prompt)).strip().lower()
        except Exception:  # noqa: BLE001 — fail-closed
            self.failures += 1
            return "unknown"
        if time.monotonic() - t0 > self.max_seconds or out not in ALLOWED_LABELS:
            self.failures += 1
            return "unknown"
        return out


def load_classifier(env: Mapping[str, str]) -> SafeClassifier | None:
    """None = כבוי (ברירת מחדל). mock = ספק מדומה. כל דבר אחר = שגיאת בטיחות."""
    name = (env.get("LLM_PROVIDER") or "disabled").strip().lower()
    if name not in ALLOWED_PROVIDERS:
        raise SafetyError(f"LLM_PROVIDER={name!r} אסור: רק disabled/mock (הכרעת מאיר — אין ספק אמיתי)")
    if name == "disabled":
        return None
    return SafeClassifier(MockLLM())
