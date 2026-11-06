"""מענה לתשובות הלקוח.

שלב 1: מסווג כללים בעברית (דטרמיניסטי, נבדק). ממשק `LLMClassifier` מוכן לחיבור AI
בשלב 2 — כשהוא מחובר, הוא רק *מסווג* ומנסח טיוטה; מדיניות ההכרעה נשארת כאן.

כלל זהב: כל מה שאינו בטוח ⇒ הסלמה לבעל העסק, לא תשובה אוטומטית.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Protocol


class Intent(str, Enum):
    OPT_OUT = "opt_out"
    PAID_CLAIM = "paid_claim"
    PLAN_REQUEST = "plan_request"
    HOW_TO_PAY = "how_to_pay"
    COPY_REQUEST = "copy_request"
    DISPUTE = "dispute"
    THANKS = "thanks"
    UNKNOWN = "unknown"


# סדר חשוב: הסרה ומחלוקת לפני הכול
RULES: list[tuple[Intent, re.Pattern[str]]] = [
    # הסרה בכל מקום בהודעה ("בבקשה הסירו אותי") — לא רק בתחילתה (חוק התקשורת §30א)
    (Intent.OPT_OUT, re.compile(r"(^|[\s,.!])ו?(הסר|הסירו|תסירו|הסרה|stop|unsubscribe|"
                                r"תפסיקו|אל תשלחו|לא מעוניי)", re.I)),
    (Intent.DISPUTE, re.compile(r"(לא הזמנתי|טעות|לא מגיע|לא נכון|לא שלי|עו\"?ד|ערעור|תלונה)")),
    (Intent.PAID_CLAIM, re.compile(r"(שילמתי|כבר שולם|העברתי|שולם)")),
    (Intent.PLAN_REQUEST, re.compile(r"(פריסה|תשלומים|לפרוס|הסדר)")),
    (Intent.COPY_REQUEST, re.compile(r"(העתק|שלחו (את )?החשבונית|לא קיבלתי חשבונית)")),
    (Intent.HOW_TO_PAY, re.compile(r"(איך (אפשר )?(לשלם|משלמים|משלם)|קישור|ביט|העברה בנקאית|פרטי חשבון)")),
    (Intent.THANKS, re.compile(r"^\s*(תודה|סבבה|אוקיי|בסדר)\s*[!.]*\s*$")),
]

# תשובות שמותר לשלוח אוטומטית (אחרי שההודעה הראשונה אושרה). כל השאר — לבעל העסק.
AUTO_OK = {Intent.OPT_OUT, Intent.HOW_TO_PAY, Intent.COPY_REQUEST, Intent.THANKS}


@dataclass(frozen=True)
class Decision:
    intent: Intent
    auto_reply: str | None      # None ⇒ אין שליחה אוטומטית
    escalate: bool
    stop_reminders: bool


class LLMClassifier(Protocol):  # שלב 2
    def classify(self, text: str) -> Intent: ...


def classify(text: str, llm: LLMClassifier | None = None) -> Intent:
    for intent, pat in RULES:
        if pat.search(text or ""):
            return intent
    if llm is not None:
        try:
            got = llm.classify(text)
            # LLM לא יכול להמציא כוונה חדשה, ואף פעם לא מוריד הסלמה של מחלוקת
            return got if isinstance(got, Intent) else Intent.UNKNOWN
        except Exception:
            return Intent.UNKNOWN
    return Intent.UNKNOWN


def decide(text: str, *, business: str, payment_link: str,
           llm: LLMClassifier | None = None) -> Decision:
    it = classify(text, llm)
    link = payment_link or "בעל העסק ישלח פרטי תשלום בהקדם"
    replies = {
        Intent.OPT_OUT: f"הוסרתם מתזכורות אוטומטיות של {business}. בעל העסק ייצור קשר אם יידרש.",
        Intent.HOW_TO_PAY: f"אפשר לשלם כאן: {link}. תודה!",
        Intent.COPY_REQUEST: "נשלח לכם העתק של החשבונית בהקדם. תודה על הסבלנות.",
        Intent.THANKS: None,
    }
    if it in AUTO_OK:
        return Decision(it, replies.get(it), escalate=False,
                        stop_reminders=it == Intent.OPT_OUT)
    if it == Intent.PAID_CLAIM:
        # לא מאמתים לבד — עוצרים תזכורות ומעבירים לבעל העסק לבדיקה
        return Decision(it, None, escalate=True, stop_reminders=True)
    if it == Intent.DISPUTE:
        return Decision(it, None, escalate=True, stop_reminders=True)
    if it == Intent.PLAN_REQUEST:
        return Decision(it, None, escalate=True, stop_reminders=True)
    return Decision(Intent.UNKNOWN, None, escalate=True, stop_reminders=False)
