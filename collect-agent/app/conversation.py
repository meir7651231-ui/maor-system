"""מנוע שיחה של גבי — עונה לתשובות חייבים, מציע הסדר, מסלים לבעל העסק.

טהור לגמרי: בלי DB, בלי רשת, בלי שעון (היום מוזרק ב-`Context.today`). לכן כל
החלטה ניתנת לשחזור ונבדקת ב-eval (`evals/`).

עקרונות (לפי MVP-SPEC §2.3 וההכרעה "בעל העסק מאשר כל הודעה"):
  1. ההחלטה (עצירה/השהיה/הסלמה) נגזרת מ*כל* הכוונות שזוהו, לא רק מהעיקרית.
     "לא הזמנתי כלום, תפסיקו לשלוח" ⇒ גם הסרה לצמיתות וגם הסלמה דחופה.
  2. התשובה היא תמיד *טיוטה*. היא יוצאת אוטומטית רק במצב `safe_auto` ורק לכוונות
     מידע בטוחות. ברירת המחדל = הכול לאישור בעל העסק.
  3. מעקות על התשובה (`check_reply`): בלי איום, בלי ריבית/קנס, בלי הנחה שלא אושרה,
     בלי "התשלום התקבל", בלי לחשוף סכום למי שאמר "טעות במספר", אורך SMS סביר.
     טיוטת LLM שנכשלת במעקה ⇒ חוזרים לנוסח הקבוע.
  4. מה שלא בטוח ⇒ בעל העסק. LLM (שלב 2) רק מסווג טקסט שהכללים לא זיהו,
     בחירה מתוך רשימה סגורה, ולא יכול לבטל הסלמה.
  5. ערוצים: SMS ומייל בלבד (לא WhatsApp — מדיניות Meta). המנוע לא שולח כלום.
"""
from __future__ import annotations

import calendar
import logging
import re
from dataclasses import dataclass, field, replace
from datetime import date, timedelta
from enum import Enum
from functools import cache
from typing import Protocol

from . import compliance
from .plans import Installment, _add_months
from .templates import fmt_amount

log = logging.getLogger(__name__)


# ═══════════════════════════ סוגים ═══════════════════════════
class Intent(str, Enum):
    DISTRESS = "distress"            # מצוקה רגשית קשה — רק בן אדם
    OPT_OUT = "opt_out"              # הסר / תפסיקו לשלוח
    WRONG_PERSON = "wrong_person"    # טעות במספר — לא החייב
    LEGAL = "legal"                  # עו"ד / תביעה / משטרה מצד הלקוח
    DISPUTE = "dispute"              # מחלוקת על החוב
    PAID_CLAIM = "paid_claim"        # שילמתי (מלא או חלקי)
    CANT_PAY = "cant_pay"            # אין כסף / קושי / מילואים / מחלה
    PLAN_REQUEST = "plan_request"    # רוצה תשלומים / פריסה
    PLAN_ACCEPT = "plan_accept"      # מאשר הצעה שנשלחה
    PLAN_REJECT = "plan_reject"      # דוחה הצעה שנשלחה
    PROMISE = "promise"              # אשלם ב... / אפשר לדחות ל...
    COPY_REQUEST = "copy_request"    # שלחו חשבונית / פירוט
    HOW_TO_PAY = "how_to_pay"        # איך משלמים / קישור
    CALLBACK = "callback"            # תתקשרו אליי
    WHO_IS_THIS = "who_is_this"      # מי זה? על מה?
    ABUSIVE = "abusive"              # קללות
    THANKS = "thanks"                # תודה / קיבלתי
    MINOR = "minor"                  # קטין עונה (ר-6) — לא מנהלים איתו שיחה על חוב
    UNKNOWN = "unknown"


class Escalation(str, Enum):
    NONE = "none"
    NORMAL = "normal"
    URGENT = "urgent"


class Stop(str, Enum):
    NONE = "none"            # התזכורות ממשיכות
    PAUSE = "pause"          # השהיה (עד תאריך / עד הכרעת בעלים)
    PERMANENT = "permanent"  # לעולם לא עוד תזכורות אוטומטיות לאיש קשר הזה


class State(str, Enum):
    IDLE = "idle"
    AWAITING_PLAN_REPLY = "awaiting_plan_reply"      # נשלחה הצעת פריסה
    PLAN_PENDING_OWNER = "plan_pending_owner"        # הלקוח אישר, בעל העסק עוד לא
    AWAITING_DATE = "awaiting_date"                  # שאלנו "עד מתי?"
    PROMISED = "promised"                            # יש מועד מוסכם
    AWAITING_OWNER = "awaiting_owner"                # הועבר לבעל העסק
    OPTED_OUT = "opted_out"


@dataclass(frozen=True)
class OpenInvoice:
    number: str
    amount_agorot: int
    currency: str = "ILS"
    due: date | None = None


@dataclass(frozen=True)
class OwnerPolicy:
    """גבולות שבעל העסק קבע. המנוע לעולם לא מציע מעבר להם."""
    max_installments: int = 6
    min_installment_agorot: int = 100_00
    default_installments: int = 3
    first_installment_in_days: int = 7
    auto_offer_plan: bool = True      # מותר לנסח הצעת פריסה בתוך הגבולות (עדיין טיוטה)
    max_defer_days: int = 14          # הבטחת תשלום עד X ימים ⇒ מקבלים ומשהים לבד
    approval_mode: str = "all"        # "all" | "safe_auto"
    max_bot_turns: int = 4            # אחרי כך — רק בעל העסק עונה


@dataclass(frozen=True)
class Context:
    today: date
    business: str
    customer_name: str = ""
    invoices: tuple[OpenInvoice, ...] = ()
    payment_link: str = ""
    channel: str = "sms"              # "sms" | "email"
    state: State = State.IDLE
    offered_plan: tuple[Installment, ...] = ()
    bot_turns: int = 0                # כמה תשובות שלנו כבר היו בשיחה הזו
    policy: OwnerPolicy = field(default_factory=OwnerPolicy)

    @property
    def total_agorot(self) -> int:
        return sum(i.amount_agorot for i in self.invoices)

    @property
    def currency(self) -> str:
        return self.invoices[0].currency if self.invoices else "ILS"

    @property
    def first_name(self) -> str:
        return (self.customer_name or "").split()[0] if self.customer_name.strip() else ""


@dataclass(frozen=True)
class Decision:
    intent: Intent
    secondary: tuple[Intent, ...]
    reply: str | None                 # טיוטת תשובה; None ⇒ לא עונים
    auto_send: bool                   # מותר לשלוח בלי אישור? (ברירת מחדל: לא)
    escalate: Escalation
    stop: Stop
    pause_until: date | None          # כש-stop=PAUSE: עד מתי (None ⇒ עד הכרעת בעלים)
    next_state: State
    plan: tuple[Installment, ...] = ()
    promise_date: date | None = None
    paid_agorot: int | None = None    # סכום שהלקוח טוען ששילם
    owner_summary: str = ""
    owner_actions: tuple[str, ...] = ()
    tags: tuple[str, ...] = ()
    confidence: str = "rules"         # "rules" | "llm" | "none"
    guardrail_issues: tuple[str, ...] = ()

    @property
    def all_intents(self) -> tuple[Intent, ...]:
        return (self.intent, *self.secondary)


class LLMClassifier(Protocol):  # שלב 2 — Claude Haiku עם פלט enum בלבד
    def classify(self, text: str) -> str: ...


class LLMDrafter(Protocol):  # שלב 2 — מנסח מחדש טיוטה; תמיד עובר מעקה ואישור
    def draft(self, intent: Intent, base_reply: str, ctx: Context) -> str: ...


# ═══════════════════════════ נרמול ═══════════════════════════
_NIKUD = re.compile("[\u0591-\u05C7]")
_QUOTES = str.maketrans({"״": '"', "”": '"', "“": '"', "׳": "'", "’": "'", "‘": "'",
                         "`": "'", "–": "-", "—": "-", "\u200f": "", "\u200e": ""})
_FINALS = str.maketrans("ךםןףץ", "כמנפצ")


def normalize(text: str) -> str:
    t = _NIKUD.sub("", text or "").translate(_QUOTES).lower()
    t = t.replace("''", '"').translate(_FINALS)  # אותיות סופיות ⇒ רגילות (גם בתבניות)
    t = re.sub(r"(.)\1{2,}", r"\1\1", t)        # "תודההההה" ⇒ "תודהה"
    t = re.sub(r"\s+", " ", t)
    return t.strip()


@cache
def _c(pat: str) -> re.Pattern[str]:
    """קומפילציה של תבנית שרצה על טקסט מנורמל: גם בה אותיות סופיות ⇒ רגילות."""
    return re.compile(pat.translate(_FINALS))


def _s(pat: str, t: str) -> re.Match[str] | None:
    return _c(pat).search(t)


def _fm(pat: str, t: str) -> re.Match[str] | None:
    return _c(pat).fullmatch(t)


def _m(pat: str, t: str) -> re.Match[str] | None:
    return _c(pat).match(t)


# תחיליות עבריות נפוצות לפני מילה: ו/ש/כש/ה/ב/ל/מ וצירופים
_P = r"(?<![\w])(?:ו?(?:כש|ש|ה|ב|ל|מ){0,2})?"
_E = r"(?![\w])"


def _w(*words: str) -> str:
    """מילה שלמה עם תחיליות מותרות."""
    return _P + "(?:" + "|".join(words) + ")" + _E


def _ws(*stems: str) -> str:
    """שורש + כל סיומת (למשל שילמ ⇒ שילמתי/שילמנו/שילמה)."""
    return _P + "(?:" + "|".join(stems) + r")\w*"


_NEG_BEFORE = _c(r"(?:(?<![\w])(?:לא|טרם|עוד לא|עדיין לא|אף פעם לא|לא ממש|בלי ש|מבלי ש|"
                         r"לא\s+\w+\s+ש)\s*$)")


def _hits(pattern: re.Pattern[str], t: str, *, negatable: bool = False) -> bool:
    for m in pattern.finditer(t):
        if negatable and _NEG_BEFORE.search(t[max(0, m.start() - 14):m.start()]):
            continue
        return True
    return False


def _rx(*parts: str) -> re.Pattern[str]:
    return _c("|".join(parts))


# ═══════════════════════════ אותות ═══════════════════════════
_NUM_STEMS = ("שניים", "שני", "שתי", "שלושה", "שלוש", "ארבעה", "ארבע", "חמישה", "חמש", "שישה", "שש",
              "בשניים", "בשני", "בשתי", "בשלושה", "בשלוש", "בארבעה", "בארבע", "בחמישה", "בחמש", "בשישה", "בשש")

RX: dict[Intent, re.Pattern[str]] = {
    Intent.DISTRESS: _rx(
        r"(?:רוצה|בא לי|הולכ\w?) ל(?:מות|התאבד)", r"להתאבד", r"אתאבד", r"לשים קץ",
        r"אין (?:לי )?(?:טעם|סיבה|כוח) (?:לחיות|יותר לחיות)", r"נמאס לי מהחיים",
        r"אני גומר עם (?:זה|הכול|הכל|החיים)", r"לא רוצה לחיות", r"אין לי בשביל מה לחיות", r"לא רואה (?:שום )?טעם (?:להמשיך|לחיות|בחיים|בכלום)", r"עדיף ש(?:לא אהיה|אמות|איעלם|אעלם)",
        r"(?:לא רוצה להיות|לא אהיה) (?:פה|כאן|בחיים) (?:יותר|בכלל)", r"לסיים את (?:החיים|הכול|הכל) (?:שלי)?$", r"לא יכול\w* (?:יותר )?עם (?:ה)?חיים", r"(?:בשביל מה|למה|סיבה|טעם|כוח) (?:לי )?(?:להמשיך )?לחיות",
        r"\bsuicid", r"kill myself"),
    Intent.OPT_OUT: _rx(
        r"^\W*(?:הסר|הסירו|הסירי|להסיר|הסרה|הסר אותי|הפסק|הפסיקו|תפסיק|תפסיקו|די|די כבר|מספיק|stop|unsubscribe|remove)\W*$",
        r"(?:להסיר|תסירו|תסיר|הסירו|הורידו|תורידו|תוריד) (?:אותי|אותנו|את המספר|מהרשימה)",
        r"(?:תפסיקו|תפסיק|הפסיקו|תפסיקי|די) (?:לשלוח|להטריד|לפנות|לכתוב|עם ההודעות|עם המסרונים|עם הסמסים)",
        r"(?:אל|לא) (?:תשלחו|תשלח|לשלוח) (?:לי |לנו )?(?:עוד|יותר|הודעות|מסרונים|סמס)",
        r"לא (?:רוצה|מעוניינ\w*) (?:לקבל|בהודעות|במסרונים|בתזכורות)",
        r"מספיק עם ההודעות", r"\bstop\b", r"\bunsubscribe\b",
        # מבקר סבב 3 (🟠): ביטויים שזוהו "לא ידוע" — רק כמשפט שלם, כדי לא לבלוע "לא מעוניין בפריסה"
        r"^\W*(?:נא|בבקשה|אנא)\W+(?:להסיר|הסר|הסירו|תסירו|להפסיק|הפסיקו|תפסיקו)\W*$",
        r"^\W*די\W+(?:תפסיקו|תפסיק|הפסיקו|כבר|מספיק)\W*$",
        r"^\W*(?:אני )?לא מעוניינ\w*\W*$", r"\bremove me\b", r"\bplease stop\b",
        r"(?:תמחקו|מחקו|למחוק|תמחק|תמחקי|תוציאו|הוציאו|להוציא) (?:אותי|אותנו|את המספר|את הטלפון)",
        r"(?:אותי|אותנו) מה?רשימ",
        r"(?:להסיר|להוריד|הסירו|הורידו|תסירו|תורידו|תמחקו|למחוק) (?:את )?(?:כתובת )?ה?(?:מייל|אימייל|דוא\"ל|כתובת)",
        r"מ?רשימת ה?(?:תפוצה|דיוור)", r"(?:אל|לא) (?:לשלוח|תשלחו|תשלח) (?:אליי |לי |אלינו )?(?:שום |יותר |עוד )?(?:הודעה|הודעות|מיילים|אימיילים|דואר)",
        r"די (?:כבר )?עם (?:ה)?(?:מיילים|הודעות|תזכורות|מסרונים)", r"לא (?:רוצה|מעוניינ\w*) (?:לקבל )?(?:יותר |עוד )?(?:את )?(?:ה)?(?:הודעות|מסרונים|תזכורות|סמסים|סמס)",
        r"(?:אל|לא) (?:תפנו|תפנה|תכתבו|תתקשרו) (?:אליי|אלי|אלינו) (?:יותר|עוד|שוב)",
        r"(?:תפסיקו|תפסיק|הפסיקו|תפסיקי) (?:כבר |בבקשה |עם זה |פעם אחת |מיד )+(?:לשלוח|להטריד|לפנות|לכתוב)",
        r"(?:נא |אנא |בבקשה )?להפסיק (?:לשלוח|לפנות|את ההודעות|עם ההודעות)",
        r"(?:להוריד|תורידו|הורידו|תוריד|למחוק|תמחקו) (?:את )?(?:ה)?מספר (?:שלי|שלנו|הזה)",
        # critic סבב 14 (שוחזר): «חסום אותי» ⇒ unknown, והתזכורות נמשכו. בקשת חסימה = בקשת הסרה
        r"(?:חסום|חסמו|תחסום|תחסמו|לחסום|תחסמי) (?:אותי|אותנו|את המספר|את הטלפון|את המייל)",
        r"\bblock (?:me|this number)\b"),
    Intent.WRONG_PERSON: _rx(
        r"טעות (?:ב)?(?:מספר|מס'|מס\b)", r"מספר (?:שגוי|לא נכון|הלא נכון|טעות)",
        r"(?:הגעתם|הגעת|פניתם) (?:ל|אל )?(?:מספר |אדם |בן אדם )?(?:הלא נכון|לא נכון|שגוי)",
        r"(?:זה|המספר הזה) (?:כבר )?לא (?:המספר )?של\s+\w", r"אין (?:כאן|פה) (?:אף אחד|מישהו|מישהי)? ?בשם",
        r"(?:לא|אינני|אינני) מכיר(?:ה)? (?:את )?(?:ה?שם|אותו|אותה|את ה?אדם|שום|כזה|כזאת|\w+ \w+)?",
        r"לא מכיר(?:ה)?\W*$", r"זה לא אני", r"את מי (?:אתם )?(?:מחפשים|חיפשתם)", r"wrong number",
        r"החלפתי מספר", r"המספר (?:הזה )?(?:עבר|הוחלף)", r"לא (?:קשור|קשורה) אליי? בכלל",
        r"אין לי (?:מושג|מושג בכלל) מי",
        r"(?:הגעתם|שלחתם|פניתם) (?:ל|אל )?(?:ה)?כתובת (?:ה)?(?:לא נכונה|שגויה|הלא נכונה)",
        r"(?:ה)?(?:מייל|אימייל|כתובת)(?: ה?מייל)?(?: הזה| הזאת| הזו)? (?:לא |אינו |אינה )(?:שייכ\w*|של)",
        r"לא (?:שייך|שייכת) ל(?:אף |שום )?(?:לקוח|לקוחה)", r"(?:קיבלתי|הגיע אליי|הגיעה אליי) (?:את )?(?:ה)?(?:מייל|הודעה)(?: הזה| הזאת| הזו)? בטעות", r"אין (?:לנו|לי|כאן|פה) (?:לקוח|לקוחה|לקוחות|מישהו|מישהי) (?:כזה|כזאת|כזו|בשם)", r"(?:ה)?מספר (?:הזה )?(?:שייכ|שלי מ|אצלי מ)",
        r"(?:נתנו|נתן|נתנה|מסרו|מסר) לכם (?:את ה)?מספר (?:לא נכון|שגוי|הלא נכון)", r"(?:טעיתם|טעית|טעיתי) (?:ב)?מספר",
        r"(?:אני |אנחנו )?לא (?:ה)?(?:לקוח|לקוחה|לקוחות) (?:שלכם|שלך|ה?זה|ה?זאת)?",
        r"(?:קיבלתי|הגיעה|הגיע) (?:אליי |לי )?(?:את )?(?:ה)?הודעה (?:הזאת |הזו )?בטעות",
        r"(?:זה|זו|זאת) (?:ה)?מספר של (?:אמא|אבא|הבן|הבת|אח|אחות|בעלי|אשתי|הילד|סבתא|סבא)\w*"),
    Intent.LEGAL: _rx(
        _w(r'עו"ד', r"עוה\"ד", r"עורך דין", r"עורכת דין", r"עורך הדין", r"עורכי דין", r"עו\"דית"),
        _ws(r"תביע", r"אתבע", r"נתבע", r"לתבוע", r"תובע"), _w("משטרה", "למשטרה", "בית משפט",
                                                             "בית המשפט", "תלונה במשטרה"),
        r"לשון הרע", r"הרשות להגנת הצרכן", r"הגנת הצרכן", r"תביעות קטנות", r"\blawyer\b",
        r"\bsue\b", r"הטרדה מאיימת", r"עורכ\w* ה?דין", r"(?:יועץ|יועצת|ייעוץ) משפטי\w*",
        r"(?:לתבוע|אתבע|נתבע|לתביעה)", r"משפטי\w*", r"(?:אגיש|נגיש|להגיש|הגשתי) (?:נגדכם |עליכם |נגדך )?(?:תלונה|תביעה)", r"(?:אגיש|נגיש|להגיש) (?:נגדכם|עליכם)", r"אתלונן",
        r"תלונה (?:נגדכם|עליכם|במשטרה|לרשות|למשטרה)"),
    Intent.DISPUTE: _rx(
        r"לא הזמנתי", r"לא ביקשתי (?:את )?(?:זה|השירות|העבודה)", r"לא קיבלתי (?:את )?(?:ה?שירות|ה?סחורה|ה?מוצר|ה?עבודה|כלום|שום)",
        r"(?:ה?סכום|ה?מחיר|ה?חשבון|ה?חשבונית) (?:בכלל |ממש |פשוט |גם |הזה |הזאת )?(?:לא נכונ?ה?|שגוי\w*|מוגזמ\w*|לא תואמ\w*|גבוה מדי|מנופח\w*)",
        r"(?:סיכמנו|סגרנו|הסכמנו|דיברנו) (?:על|ש|אחרת)", r"זה לא מה ש(?:סיכמנו|סגרנו|הוסכם|דיברנו)",
        r"לא מגיע (?:לכם|לך)", r"(?:חויבתי|חייבתם|חייבו אותי) (?:פעמיים|כפול|ביתר|יותר מדי)", r"כפל (?:חיוב|חשבונית)",
        r"העבודה (?:לא (?:הושלמה|נגמרה|גמורה|בוצעה)|הייתה גרועה|לא תקינה)", r"לא (?:עשיתם|השלמתם|סיימתם) את העבודה",
        r"(?:לא מרוצה|לא מרוצים|גרוע|פאשלה|נכשלתם|הרסתם|קלקלתם|נזק)", r"(?:זו|זאת|יש) טעות",
        r"טעות (?:בחשבונית|בסכום|בחיוב)", r"(?:זה|החשבונית|החוב) לא שלי", r"לא חייב(?:ת|ים)? (?:לכם|לך|כלום|שקל)",
        r"(?:אני |אנחנו )?(?:חולק|חולקת|חולקים|מערער|מערערת) על", r"ביטלתי (?:את )?(?:ה?הזמנה|ה?עסקה|ה?שירות)",
        r"(?:מחלוקת|ערעור|לא מסכים לשלם|לא מוכן לשלם|לא אשלם|לא מתכוונ\w* לשלם|לא משלם על)",
        r"(?:עדיין |עוד )?מחכה (?:ל|ש)(?:תיקון|תתקנו|תסיימו|החזר)",
        r"(?:טכנאי|מתקין|שליח|נציג|עובד|איש מקצוע|אף אחד|אתם|הוא|היא)\w* (?:\w+ )?לא (?:הגיע|הגיעה|הגיעו|באו|בא)",
        r"(?:חיוב|חשבונית|תשלום)\w* כפול\w*", r"(?:פעמיים|פעם שנייה) (?:על|את) (?:אותו|אותה|אותה ה?)",
        r"(?:התקלקל|התקלקלה|נשבר|נשברה|הפסיק לעבוד|לא עובד|לא עובדת|דולף|דולפת|תקול|תקולה)\w*",
        r"(?:מה פתאום|על מה) (?:אני )?(?:צריכ|חייב)\w* לשלם",
        r"לא(?![\w]).{0,25}(?:סוכם|הוסכם|סיכמנו|סגרנו|דיברנו|הסכמנו)", r"שלא (?:דיברנו|סיכמנו|סגרנו|הוסכמו|הסכמנו)",
        r"לא (?:ביצעתם|עשיתם|סיימתם|תיקנתם|השלמתם|הגעתם|גמרתם)", r"לא (?:\w+ )?כמו שצריך", r"(?:ברשלנות|בחפיפ)",
        r"לא (?:מסכים|מסכימה|מסכימים) (?:עם|על|ל)", r"(?:פגום|פגומה|פגומים|פגומות|מקולקל\w*|לא תקינ\w*)",
        r"(?:חייבים|חייב|חייבת) לי (?:החזר|כסף בחזרה|זיכוי)", r"(?:מגיע לי|אני רוצה|דורש|דורשת) (?:החזר|זיכוי)",
        r"(?:לא משלם|לא אשלם|לא אעביר|לא נשלם|לא משלמת) עד ש",
        r"(?:גבוה|יקר|יותר|שונה)\w* ממה ש(?:הוסכם|סוכם|סיכמנו|הוצע|קיבלתי|דובר)",
        r"(?:לא תואמ\w*|שונה מ)\s*(?:את )?(?:ל)?(?:ה)?(?:הצעה|הצעת ה?מחיר|הסכם|ה?חוזה|מה שסוכם)",
        r"(?:לא|טרם|עוד לא) (?:הסתיימ\w*|הושלמ\w*)", r"לא (?:קיבלתי|קיבלנו) (?:שום|כלום)"),
    Intent.PAID_CLAIM: _rx(
        _ws(r"שילמ", r"שלמת", r"שלמנו"), _w("שולם", "שולמה", "שולמו", "משולם", "משולמת"),
        _ws(r"העברת", r"העברנו", r"הפקדת", r"הפקדנו"),
        r"(?:עשיתי|ביצעתי|ביצענו|עשינו) (?:כבר )?(?:העברה|תשלום|ביט|פייבוקס)",
        r"(?:שלחתי|שלחנו|העברתי) (?:לכם |לך )?(?:כבר )?(?:ב|ב-)?(?:ביט|פייבוקס|paybox|bit|העברה|צ'?ק)",
        r"(?:נתתי|מסרתי|השארתי|שלחתי) (?:לו |לה |לכם )?(?:צ'?ק|צ'?קים|מזומן|את הכסף)",
        r"הכסף (?:כבר )?(?:הועבר|נשלח|אצלכם|ירד|יצא)", r"(?:התשלום|הכסף) (?:בוצע|יצא|ירד מהחשבון)",
        r"\b(?:already )?paid\b", r"(?:יש לי|מצרפ\w*|הנה|שולח\w*) (?:את ה)?אסמכתא", r"(?:בעלי|אשתי|בעלה|אבא שלי|אמא שלי|השותף) (?:כבר )?(?:שילם|שילמה|העביר|העבירה)",
        r"(?:ה)?(?:ביט|פייבוקס|העברה|תשלום|צ'?ק|כסף)(?: \w+)? (?:כבר )?(?:נשלח|נשלחה|בוצע|בוצעה|יצא|יצאה|הועבר|הועברה|הופקד)",
        r"(?:קיבלתם|קיבלת) (?:כבר )?(?:את )?(?:ה)?(?:כסף|תשלום)"),
    Intent.CANT_PAY: _rx(
        r"אין (?:לי|לנו) (?:כרגע |עכשיו |בינתיים |את ה)?(?:כסף|מאיפה|אפשרות|יכולת|שקל|גרוש)",
        r"(?:לא|אינני|איני) (?:יכול|יכולה|יכולים|מסוגל|מסוגלת|מסוגלים) (?:לשלם|לעמוד|להעביר)",
        r"(?:קשה|קשוח) (?:לי|לנו)(?: מאוד| מאד| עכשיו| כרגע)? (?:כלכלית|עם הכסף|לשלם|החודש|עכשיו|כרגע)?",
        r"(?:מצב|מצבי|מצבנו) (?:ה)?כלכלי", r"תקופה (?:קשה|לא פשוטה|מאתגרת)",
        _ws("פוטרתי", "פוטרנו", "פיטרו אותי"), _w("מובטל", "מובטלת", "אבטלה", "דמי אבטלה"),
        _w("מילואים", "במילואים", "צו 8", "צו שמונה"), r"(?:חולה|מחלה|מאושפז\w*|אשפוז|ניתוח|כימו|שבעה|אבל|בבית ה?חולים|בבי\"?ח|בטיפול נמרץ)",  # critic סבב 18: «בבית חולים» נפל ל-promise ושוחרר אוטומטית
        r"(?:במינוס|מינוס בבנק|בפשיטת רגל|פשיטת רגל|חובות|הוצאה לפועל נגדי|העיקול|עיקול)",
        r"(?:חדלות פירעון|צו כינוס|צו פתיחת הליכים|הליך חדלות|נאמן (?:בתיק|שמונה)|כונס נכסים)",
        r"(?:עוד )?לא (?:קיבלתי|נכנסה|נכנס|הגיעה|הגיע) (?:את )?ה?(?:משכורת|כסף|תשלום מלקוח)",
        r"(?:לקוח|לקוחות|מעסיק|הבוס)\w* (?:שלי )?לא (?:שילם|שילמו|העביר|העבירו) לי",
        r"(?:חייבים|חייב) לי כסף", r"(?:בעיה|בעיות) (?:כלכלית|כלכליות|תזרים|בתזרים)", r"\bbroke\b",
        r"אין (?:לי |לנו )?(?:עבודה|הכנסה|הכנסות|פרנסה|משכורת)", r"בלי (?:משכורת|הכנסה|עבודה|פרנסה)",
        r"(?:סגרתי|סגרנו) את העסק", r"העסק (?:נסגר|קרס)", r"(?:אחרי|בחופשת) לידה",
        r"(?:ה)?מצב (?:קשה|לא טוב|על הפנים|גרוע|בכי רע)", r"אין (?:לי|לנו) את (?:כל )?(?:ה)?(?:סכום|כסף)",
        r"(?:לחוצ|לחוצה|לחוצים) (?:לי |לנו )?(?:כלכלית|בכסף|החודש)?", r"(?:החודש|התקופה) (?:ממש |מאוד |קצת )?(?:לחוצ|קשה|צפופ|על הפנים)",
        r"לא נשאר (?:לי|לנו) (?:שקל|כסף|גרוש|אגורה)", r"(?:נפטר|נפטרה|נפטרו|הלך לעולמו|הלכה לעולמה|הלוויה|לוויה)"),
    Intent.PLAN_REQUEST: _rx(
        _ws("תשלומים", "בתשלומים", "פריס", "לפרוס", "לפרס", "פרוס"),
        r"(?:לחלק|לפצל) (?:את (?:ה)?(?:סכום|תשלום|חוב|חשבון))?", _w("הסדר", "הסדר תשלומים"),
        r"חצי (?:עכשיו|היום|החודש) ו?(?:חצי|השאר|את השאר)", r"(?:כל|בכל) חודש (?:קצת|סכום|\d)",
        r"(?:בכמה|כמה) (?:תשלומים|פעמים)", r"(?:לשלם|אשלם|לשלם לכם) (?:בחלקים|לאט לאט|בהדרגה|חלק חלק)",
        r"\binstall?ments?\b", r"payment plan", r"(?:\d{1,2}|" + "|".join(_NUM_STEMS) + r") (?:צ'?קים|צ'?יקים|צקים)",
        r"(?:לפצל|לחלק) (?:את )?(?:זה|הסכום|התשלום|החוב|החשבון)",
        r"\d{2,}\s*(?:₪|ש\"ח|שח|שקל\w*)?\s*(?:כל|בכל) חודש", r"\d{3,}\s*(?:₪|ש\"ח|שח|שקל\w*)?\s*(?:לחודש|בחודש)(?! ה)"),
    Intent.PLAN_ACCEPT: _rx(
        r"^\W*(?:מאשר|מאשרת|מאשרים|מסכים|מסכימה|מסכימים|כן|סגור|סגרנו|מתאים|מתאים לי|מעולה|אוקיי|אוקי|ok|okay|בסדר|יאללה|דיל|עובד)\b",
        r"(?:מאשר|מאשרת|מאשרים|מסכים|מסכימה|מסכימים) (?:את )?(?:ה)?(?:הצעה|הסדר|פריסה|זה)",
        r"(?:ההצעה|ההסדר|הפריסה) (?:מתאימ\w*|בסדר|טוב\w*)"),
    Intent.PLAN_REJECT: _rx(
        r"^\W*(?:לא|ממש לא|לא מתאים|לא מתאימה|לא טוב|לא מסכים|לא מסכימה)\b",
        r"(?:ההצעה|ההסדר|הפריסה) (?:לא מתאימ\w*|לא טוב\w*|גבוה\w* מדי)", r"(?:סכום|תשלום) (?:חודשי )?גבוה מדי",
        r"לא (?:אוכל|אצליח) (?:לעמוד ב|לשלם) (?:זה|כזה|סכום כזה)",
        r"(?:יותר מדי|גבוה מדי|יקר מדי|הרבה מדי)", r"(?:זה |זו |זאת )?לא (?:מתאים|מתאימה|מסתדר|מסתדרת|טוב) (?:לי|לנו)", r"קשה (?:לי|לנו) עם (?:זה|הסכום|הסכומים)"),
    Intent.PROMISE: _rx(
        _ws(r"אשלם", r"נשלם", r"אעביר", r"נעביר", r"אסדר", r"נסדר", r"אפקיד", r"נפקיד"),
        r"(?:אטפל|נטפל|אדאג|נדאג) (?:בזה|לזה|לתשלום)?", r"(?:תנו|תן|תני) לי (?:עוד )?(?:כמה ימים|שבוע|שבועיים|חודש|זמן|עד)",
        r"(?:אפשר|אפשרי|ניתן) (?:לדחות|להמתין|לחכות)", r"(?:לדחות|דחייה) (?:את התשלום|ל|עד)",
        r"(?:הכסף|התשלום) (?:יגיע|יעבור|יצא|ייכנס|יוסדר|ישולם)", r"(?:ישולם|תשולם|יועבר) (?:עד|ב|תוך)",
        r"(?:כשת?יכנס|כשתכנס|ברגע ש(?:ת)?י?כנס|אחרי ש(?:ת)?י?כנס|כשאקבל|אחרי שאקבל) (?:ה)?(?:משכורת|כסף|תשלום)",
        r"(?:בתחילת|בסוף|באמצע) (?:ה)?חודש", r"\bwill pay\b",
        r"(?:זה |הכסף |התשלום )?(?:יהיה )?אצלכם (?:עד|תוך|ב|מחר|השבוע)", r"(?:תוך|בעוד) (?:יומיים|יום|שבוע|שבועיים) (?:זה|הכסף|התשלום)",
        r"תקבלו (?:את )?(?:ה)?(?:כסף|תשלום)", r"(?:רוצה|צריך|צריכה|צריכים|אפשר|אשמח ל|אבקש) (?:עוד )?(?:קצת )?(?:זמן|ארכה|דחייה)", r"(?:זה|הכסף|התשלום) (?:יהיה )?אצלכם", r"(?:ב|עד ה?)(?:ראשון|שני|שלישי|רביעי|חמישי) (?:הקרוב|הבא)"),
    Intent.COPY_REQUEST: _rx(
        r"(?:העתק|עותק|צילום) (?:של )?(?:ה)?(?:חשבונית|קבלה)", r"לא (?:קיבלתי|ראיתי|מצאתי|מוצא|מוצאת|רואה|רואים) (?:את )?(?:ה)?(?:חשבונית|חשבון)",
        r"(?:תשלחו|שלחו|תשלח|תוכלו לשלוח|אפשר לקבל) (?:לי )?(?:שוב )?(?:את )?(?:ה)?(?:חשבונית|פירוט|קבלה|חשבון)",
        r"(?:על מה|עבור מה|בשביל מה) (?:בדיוק )?(?:ה)?(?:חשבונית|חיוב|תשלום|סכום|זה)", r"(?:פירוט|פרטים) (?:של |על )?(?:ה)?(?:חשבונית|חיוב|עבודה)",
        r"\binvoice copy\b", r"(?:למייל|במייל) (?:את ה)?(?:חשבונית|פירוט)"),
    Intent.HOW_TO_PAY: _rx(
        r"איך (?:אפשר |ניתן |אני יכול\w* |לעשות |מבצעים )?(?:לשלם|משלמים|להעביר|לבצע תשלום|לסגור את זה)",
        r"(?:קישור|לינק|link) (?:ל|ל-)?(?:תשלום|לשלם)", r"(?:תשלחו|שלחו|תשלח|אפשר) (?:לי )?(?:קישור|לינק|link)",
        r"(?:פרטי|מספר) (?:ה)?(?:חשבון|בנק|ביט|פייבוקס)", r"(?:אפשר|אפשרי|ניתן) (?:לשלם |להעביר )?(?:ב|ב-)(?:אשראי|ביט|פייבוקס|העברה|כרטיס|מזומן|צ'?ק)",
        r"(?:מה|איזה) (?:ה)?מספר (?:ל|של )?(?:ה)?(?:ביט|פייבוקס|העברה)?\W*$",
        r"(?:לאן|למי|לאיזה חשבון) (?:להעביר|לשלם)", r"(?:כמה|מה) (?:אני )?(?:חייב|חייבת|חייבים|הסכום|היתרה|יוצא)",
        r"\bhow (?:can|do) i pay\b", r"payment link", r"(?:לבוא|לקפוץ|להגיע) (?:אליכם )?לשלם",
        r"(?:מתי|איפה) (?:אתם )?(?:פתוחים|נמצאים)"),
    Intent.CALLBACK: _rx(
        r"(?:תתקשרו|תתקשר|תתקשרי|התקשרו|תחזרו|תחזור|חזרו) (?:אליי|אלי|אלינו|לי)", r"(?:אפשר|רוצה|אשמח) (?:ל)?(?:דבר|שיחה|שתתקשרו|שיחזרו)",
        r"(?:מתי|באיזה שעה) (?:אפשר )?(?:לדבר|להתקשר)", r"(?:שבעל|שבעלת) העסק (?:יתקשר|תתקשר|יחזור|תחזור)",
        r"\bcall me\b", r"(?:אחזור|נחזור|אתקשר|נתקשר) (?:אליכם|אלייך|אליך)",
        r"(?:יחזור|תחזור|יתקשר|תתקשר|שיחזרו|שיתקשרו) (?:אליי|אלי|אלינו)", r"(?:שיחה|לשוחח) טלפוני\w*|טלפונית", r"(?:טלפון|מספר) (?:של )?(?:בעל העסק|המשרד|ליצירת קשר)"),
    Intent.WHO_IS_THIS: _rx(
        r"^\W*(?:מי (?:זה|זאת|אתם|את|אתה|שולח|כותב)|מי זה\?|מה זה|מה זה\?|על מה (?:מדובר|זה)|מאיפה (?:יש לכם|השגתם) את המספר|who is this)\W*$",
        r"(?:מי|מאיזה עסק|מאיזו חברה) (?:זה|אתם|שולח)", r"ממי (?:ה)?(?:הודעה|מייל)", r"(?:איזה|איזו|מאיזה|מאיזו) (?:עסק|חברה|מקום|משרד|ספק)", r"מאיפה (?:יש לכם|השגתם|קיבלתם) את (?:ה)?מספר", r"על מה (?:מדובר|ההודעה)"),
    Intent.ABUSIVE: _rx(
        _w("בן זונה", "בת זונה", "זונה", "זונות", "מניאק", "מניאקים", "מזדיין", "תזדיין", "תזדיינו", "לך תזדיין",
           "חרא", "חארות", "לעזאזל", "לכו לעזאזל", "תמותו", "שרמוטה", "שרמוטות", "כוס אמק", "כוסאמק", "כוס אמא שלך", "אידיוט", "אידיוטים",
           "מטומטם", "מטומטמים", "טמבל", "טמבלים", "דביל", "דבילים", "מפגר", "מפגרים", "אפסים", "נוכלים", "נוכל", "גנבים", "גנב", "רמאים", "חלאות", "חלאה", "סתום", "תסתום"),
        r"\bf+u+c+k", r"\bidiot", r"\bscam"),
    Intent.MINOR: _rx(
        r"אני (?:רק )?(?:קטין|קטינה|ילד|ילדה|נער|נערה)(?![\w])",
        r"אני (?:בן|בת) (?:1[0-7]|[5-9]|" + "|".join(("חמש", "שש", "שבע", "שמונה", "תשע", "עשר", "אחת עשרה",
                                                      "שתים עשרה", "שלוש עשרה", "ארבע עשרה", "חמש עשרה",
                                                      "שש עשרה", "שבע עשרה", "עשרה")) + r")(?![\d\w])",
        r"אני (?:ב|תלמיד\w* ב)כיתה [א-י](?:'|׳)?(?![\w])", r"אני (?:עדיין )?ב(?:בית ספר|תיכון|חטיבה)",
        r"\bi'?m (?:1[0-7]|a minor)\b"),
    Intent.THANKS: _rx(
        r"^\W*(?:(?:תודה|תודה רבה|תודהה|תנקס|thanks|thank you|תודה על העדכון|קיבלתי|קיבלנו|סבבה|אחלה|"
        r"אוקיי|אוקי|ok|בסדר|בסדר גמור|מעולה|יופי|👍|🙏|רשמתי|ראיתי|טוב|רבה|גמור|לכם|לך|יום טוב|שבוע טוב)\W*)+$"),
}

# כוונות שמבוססות על הקשר (מגיבות להצעה שנשלחה)
STATEFUL = {Intent.PLAN_ACCEPT, Intent.PLAN_REJECT}

# סדר עדיפות לכוונה העיקרית (קובע את נוסח התשובה)
PRIORITY: tuple[Intent, ...] = (
    Intent.DISTRESS, Intent.MINOR, Intent.OPT_OUT, Intent.WRONG_PERSON, Intent.LEGAL, Intent.DISPUTE,
    Intent.PAID_CLAIM, Intent.PLAN_ACCEPT, Intent.PLAN_REJECT, Intent.PLAN_REQUEST,
    Intent.CANT_PAY, Intent.PROMISE, Intent.COPY_REQUEST, Intent.HOW_TO_PAY, Intent.CALLBACK,
    Intent.WHO_IS_THIS, Intent.ABUSIVE, Intent.THANKS, Intent.UNKNOWN,
)

NEGATABLE = {Intent.PAID_CLAIM, Intent.PROMISE, Intent.OPT_OUT, Intent.HOW_TO_PAY}

# מה מותר לשלוח בלי אישור במצב safe_auto — רק מידע, אף פעם לא כסף/הבטחות
SAFE_AUTO = {Intent.HOW_TO_PAY, Intent.WHO_IS_THIS, Intent.OPT_OUT, Intent.WRONG_PERSON}


# ═══════════════════════════ חילוץ ישויות ═══════════════════════════
_NUM_WORDS = {
    "אחד": 1, "אחת": 1, "שניים": 2, "שנים": 2, "שתיים": 2, "שתים": 2, "שני": 2, "שתי": 2,
    "שלוש": 3, "שלושה": 3, "ארבע": 4, "ארבעה": 4, "חמש": 5, "חמישה": 5, "שש": 6, "שישה": 6,
    "שבע": 7, "שבעה": 7, "שמונה": 8, "תשע": 9, "תשעה": 9, "עשר": 10, "עשרה": 10,
    "אחת עשרה": 11, "שתים עשרה": 12, "שנים עשר": 12, "שתיים עשרה": 12,
}
_NUM_WORDS = {k.translate(_FINALS): v for k, v in _NUM_WORDS.items()}
_NUMW = "|".join(sorted(_NUM_WORDS, key=len, reverse=True))
_INST_RX = _c(
    r"(?:ב-?|ל-?)?(\d{1,2}|" + _NUMW + r")\s*(?:-\s*)?(?:תשלומים|תשלומי|חלקים|פעמים|חודשים|חודשי|צ'?קים|צ'?יקים|צקים|installments)"
    r"|(?:תשלומים|פריסה|לפרוס|לחלק)\s*(?:ל|ב)-?\s*(\d{1,2}|" + _NUMW + r")(?!\s*(?:₪|ש\"ח|שקל|ש'|ימים|יום|לחודש|בחודש))")
_HALF_RX = _c(r"חצי (?:עכשיו|היום|החודש) ו?(?:חצי|השאר|את השאר)")


def extract_installments(t: str) -> int | None:
    if _HALF_RX.search(t):
        return 2
    m = _INST_RX.search(t)
    if not m:
        return None
    g = (m.group(1) or m.group(2) or "").strip()
    if g.isdigit():
        n = int(g)
    else:
        n = _NUM_WORDS.get(g, 0)
    return n if 1 <= n <= 36 else None


_MONTHLY_RX = _c(r"(\d{1,3}(?:,\d{3})+|\d{2,})\s*(?:₪|ש\"ח|שח|שקל\w*)?\s*(?:כל חודש|בכל חודש|לחודש|בחודש(?! ה))")


def extract_monthly_amount(t: str) -> int | None:
    """"300 כל חודש" ⇒ 30000 אגורות."""
    m = _MONTHLY_RX.search(t)
    if not m:
        return None
    v = int(m.group(1).replace(",", ""))
    return v * 100 if 10 <= v <= 1_000_000 else None


_AMOUNT_RX = _c(r"(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(?:₪|ש\"ח|שח|שקלים|שקל|nis|ils)?")
_PAID_AMOUNT_RX = _c(
    r"(?:שילמ\w*|שלמת\w*|העבר\w*|הפקד\w*|שלחת\w*|שולמ\w*|שולם|נתתי|מסרתי)\s*(?:לכם |לך |כבר |רק |בינתיים |את )*"
    r"(?:ב-?(?:ביט|פייבוקס|העברה)\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(₪|ש\"ח|שח|שקלים|שקל)?")
_PARTIAL_WORDS = _c(r"(?<![\w])(?:חלק|חלקי|חצי|מקדמה|רק חלק|את רוב|קצת|חלק מה)")


def extract_paid_amount(t: str) -> int | None:
    for m in _PAID_AMOUNT_RX.finditer(t):
        after = t[m.end():m.end() + 12]
        if _m(r"\s*(?:תשלומים|ימים|יום|לחודש|בחודש|\.\d|/)", after):
            continue
        whole = int(m.group(1).replace(",", ""))
        frac = int((m.group(2) or "0").ljust(2, "0"))
        if whole == 0 or whole > 10_000_000:
            continue
        return whole * 100 + frac
    return None


_WEEKDAYS = {"ראשון": 6, "שני": 0, "שלישי": 1, "רביעי": 2, "חמישי": 3, "שישי": 4}


_WEEKDAYS = {k.translate(_FINALS): v for k, v in _WEEKDAYS.items()}


def _next_weekday(today: date, wd: int) -> date:
    """המופע הבא של היום (לעולם לא היום עצמו)."""
    return today + timedelta(days=(wd - today.weekday()) % 7 or 7)


def _month_day(today: date, day: int) -> date:
    y, m = today.year, today.month
    if day <= today.day:
        m += 1
        if m > 12:
            y, m = y + 1, 1
    return date(y, m, min(day, calendar.monthrange(y, m)[1]))


def extract_date(t: str, today: date) -> tuple[date | None, bool]:
    """מחזיר (תאריך, מעורפל?). מעורפל = יש כוונה לתאריך אבל אי אפשר לקבע אותו."""
    if _s(r"(?<![\w])(?:מחרתיים)", t):
        return today + timedelta(days=2), False
    if _s(r"(?<![\w])(?:עד |כבר )?מחר(?![\w])", t):
        return today + timedelta(days=1), False
    if _s(r"(?<![\w])(?:עכשיו|מיד|תיכף|בדקות הקרובות)(?![\w])", t):
        return today, False
    if _s(r"(?<![\w])(?:עוד |עד |כבר )?היום(?![\w])|(?<![\w])עוד מעט|בשעות הקרובות|הערב(?![\w])", t):
        return today, False
    m = _s(r"(?:בעוד|תוך|עוד)\s+(\d{1,2}|" + _NUMW + r")\s*(ימים|יום|שבועות|שבוע)", t)
    if m:
        g = m.group(1)
        n = int(g) if g.isdigit() else _NUM_WORDS.get(g, 0)
        return today + timedelta(days=n * (7 if m.group(2).startswith("שבוע") else 1)), False
    if _s(r"(?:בעוד|תוך|עוד)\s+(?:כ)?חודשיים", t):
        return today + timedelta(days=60), False
    if _s(r"(?:בעוד|תוך|עוד)\s+(?:כ)?יומיים", t):
        return today + timedelta(days=2), False
    if _s(r"(?:בעוד|תוך|עוד)\s+(?:כ)?שבועיים", t):
        return today + timedelta(days=14), False
    if _s(r"(?:בעוד|תוך|עוד)\s+(?:כ)?שבוע(?!\w)", t) or _s(r"(?:תנו|תן|תני) לי (?:עוד )?שבוע", t):
        return today + timedelta(days=7), False
    if _s(r"(?:תנו|תן|תני) לי (?:עוד )?שבועיים", t):
        return today + timedelta(days=14), False
    if _s(r"(?:בעוד|תוך|עוד)\s+(?:כ)?חודש(?!\w)|(?:תנו|תן|תני) לי (?:עוד )?חודש", t):
        return today + timedelta(days=30), False
    m = _s(r"(?:(?:עד |ב|ל)?יום |ב|עד ה?|ל)-?(ראשון|שני|שלישי|רביעי|חמישי|שישי)(?![\w])", t)
    if m and not _s(r"(?:תשלום|חלק) (?:ה)?" + m.group(1), t):
        return _next_weekday(today, _WEEKDAYS[m.group(1)]), False
    m = _s(r"(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?", t)
    if m:
        d, mo = int(m.group(1)), int(m.group(2))
        y = int(m.group(3)) if m.group(3) else today.year
        if y < 100:
            y += 2000
        try:
            cand = date(y, mo, d)
            if not m.group(3) and cand < today:
                cand = date(y + 1, mo, d)
            return cand, False
        except ValueError:
            pass
    m = _s(r"(?:ב|עד ה?)-?(\d{1,2})\s*(?:ל|ב)(?:חודש)", t)
    if m and 1 <= int(m.group(1)) <= 31:
        return _month_day(today, int(m.group(1))), False
    if _s(r"(?:בתחילת|עד תחילת|בראשית) (?:ה)?חודש (?:ה)?(?:הבא|הקרוב)?|בחודש הבא|חודש הבא", t):
        y, mo = (today.year + 1, 1) if today.month == 12 else (today.year, today.month + 1)
        return date(y, mo, 10 if "חודש הבא" in t and "תחילת" not in t else 1), False
    if _s(r"(?:בסוף|עד סוף) (?:ה)?חודש", t):
        last = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
        if (last - today).days < 3:
            y, mo = (today.year + 1, 1) if today.month == 12 else (today.year, today.month + 1)
            last = date(y, mo, calendar.monthrange(y, mo)[1])
        return last, False
    if _s(r"(?:בשבוע הבא|שבוע הבא)", t):
        return _next_weekday(today, 6), False
    if _s(r"(?:משכורת|אחרי החג|אחרי החגים|כשאקבל|כשיהיה|כשיהיה לי|בקרוב|בהקדם|בימים הקרובים|"
                 r"כמה ימים|מתישהו|אחרי שאקבל|לקראת|כשאחזור|כשאסתדר)", t):
        return None, True
    return None, False


# ═══════════════════════════ סיווג ═══════════════════════════
def detect(text: str, ctx: Context | None = None) -> list[Intent]:
    """כל הכוונות שזוהו, לפי סדר העדיפות."""
    t = normalize(text)
    if not t:
        return [Intent.UNKNOWN]
    found: set[Intent] = set()
    for it, rx in RX.items():
        if it in STATEFUL:
            continue
        if _hits(rx, t, negatable=it in NEGATABLE):
            found.add(it)
    awaiting = ctx is not None and ctx.state == State.AWAITING_PLAN_REPLY
    if awaiting:
        if _hits(RX[Intent.PLAN_REJECT], t):
            found.add(Intent.PLAN_REJECT)
        elif _hits(RX[Intent.PLAN_ACCEPT], t):
            found.add(Intent.PLAN_ACCEPT)
        # ספרה לבד או "ב-4" ⇒ הצעה נגדית
        if _fm(r"\W*(?:אפשר |ו?אם |מה עם )?(?:ב-?|ל-?)?(\d{1,2}|" + _NUMW + r")\W*\??", t) or \
                _s(r"(?:אפשר|ואם|מה עם|רק|אולי) (?:ב-?|ל-?)?(\d{1,2}|" + _NUMW + r")(?![\d\w])", t):
            found.add(Intent.PLAN_REQUEST)
    # זיהוי לפי שם הלקוח מההקשר: "אין פה דנה" / "אני לא דנה" / "לא מכיר שום דנה"
    fn = normalize(ctx.first_name) if ctx is not None else ""
    if fn and len(fn) >= 2 and _s(r"(?:אין (?:פה|כאן|בבית|בטלפון הזה)|לא מכיר\w*|אני לא|זה לא|מי (?:זאת|זה|זו)|אין לי)"
                                  r"\W+(?:\w+\W+){0,2}" + re.escape(fn) + r"(?![\w])", t):
        found.add(Intent.WRONG_PERSON)
    if fn and len(fn) >= 2 and _s(r"(?<![\w])לא\W+" + re.escape(fn) + r"\W+(?:פה|כאן|בבית|גר|גרה)(?![\w])", t):
        found.add(Intent.WRONG_PERSON)
    # שאלה על תשלום ("מתי שילמתי?") ≠ טענת תשלום
    if Intent.PAID_CLAIM in found and _s(r"^\W*(?:מתי|האם|כמה|למה|איך|מה)\b[^.!]*\?\W*$", t) \
            and not _s(r"(?:כבר )?(?:שילמתי|העברתי|שילמנו|העברנו)[^?]*[.!,]", t):
        found.discard(Intent.PAID_CLAIM)
    # הבטחה בזמן הווה עם תאריך: "תוך שבוע אני מסדר"
    if ctx is not None and Intent.PROMISE not in found and \
            _s(_ws("מסדר", "מעביר", "משלמ", "מטפל", "מפקיד", "סוגר"), t) and \
            (extract_date(t, ctx.today)[0] or _s(r"(?:עכשיו|כרגע|מיד|תיכף|בדקות הקרובות)", t)):
        found.add(Intent.PROMISE)
    if ctx is not None and ctx.state == State.AWAITING_DATE:
        d, _vague = extract_date(t, ctx.today)
        if d is not None:
            found.add(Intent.PROMISE)
    # תיקוני התנגשות ידועים
    if Intent.PAID_CLAIM in found and _s(r"(?:איך|לאן|למי) (?:אפשר )?(?:לשלם|להעביר)", t) \
            and not _s(r"שילמתי|העברתי", t):
        found.discard(Intent.PAID_CLAIM)
    if Intent.CANT_PAY in found and _s(r"אין (?:לי|לנו) בעיה", t):
        found.discard(Intent.CANT_PAY)
    # "לא שלי" עם טענה נגד החוב, בלי סימני מספר/כתובת שגויים ⇒ מחלוקת (שומרת את החוב ומסלימה בדחיפות)
    if Intent.WRONG_PERSON in found and Intent.DISPUTE in found and not _s(
            r"מספר|מס'|כתובת|מייל|בטעות|לא מכיר|לא מכירה|אין (?:פה|כאן)|טלפון", t):
        found.discard(Intent.WRONG_PERSON)
    # ספק/שאלה על תשלום ("לא זוכר אם שילמתי", "האם התשלום התקבל?") ≠ טענת תשלום
    if Intent.PAID_CLAIM in found and (
            _s(r"(?:לא זוכר\w*|לא בטוח\w*|לבדוק|לברר|לוודא) (?:אם|האם|ש)", t)
            or _s(r"(?<![\w])(?:אם|האם) (?:כבר )?(?:שילמ|העבר|התשלום|הכסף)", t)) \
            and not _s(r"(?:^|[.!,\n] *)(?:כבר )?(?:שילמתי|שילמנו|העברתי|העברנו)(?![^.!?\n]*\?)", t):
        found.discard(Intent.PAID_CLAIM)
    if not found and "?" in t and _s(r"(?:ה)?(?:קישור|לינק)", t):
        found.add(Intent.HOW_TO_PAY)          # שאלה על הקישור לתשלום
    if not found and "?" not in t and _s(r"(?<![\w])(?:תודה|thanks)", t):
        found.add(Intent.THANKS)              # שבח + תודה בלי בקשה
    # "שלחו לינק ואשלם" — בלי תאריך, הדבר המועיל הוא הקישור
    if Intent.PROMISE in found and Intent.HOW_TO_PAY in found and ctx is not None \
            and extract_date(t, ctx.today)[0] is None:
        found.discard(Intent.PROMISE)
    if Intent.THANKS in found and len(found) > 1:
        found.discard(Intent.THANKS)
    if Intent.PLAN_ACCEPT in found and (found & {Intent.DISPUTE, Intent.OPT_OUT, Intent.LEGAL}):
        found.discard(Intent.PLAN_ACCEPT)
    if Intent.WRONG_PERSON in found and Intent.DISPUTE in found and \
            _s(r"טעות (?:ב)?(?:מספר|מס')|מספר (?:שגוי|לא נכון)", t):
        found.discard(Intent.DISPUTE)
    # "פיטרו... ואני מבקש תשלומים" — שני האותות נשמרים; הבטחה בלי תאריך מעל כוונת פריסה ⇒ פריסה עיקרית
    if not found:
        found.add(Intent.UNKNOWN)
    return [i for i in PRIORITY if i in found]


# ═══════════════════════════ מעקות ═══════════════════════════
# בדיקות ייחודיות לשיחה, מעבר למסנן המשפטי המשותף (app/compliance.py)
CONVERSATION_BANNED: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("payment_confirmed", re.compile(r"התשלום (?:התקבל|נקלט|אושר)|קיבלנו את התשלום|(?:החשבונית|החוב) (?:נסגר|סולק|שולם)")),
    ("promise_waiver", re.compile(r"לא תצטרכו לשלם|אין צורך לשלם|בוטל(?:ה)? החשבונית")),
    ("whatsapp", re.compile(r"וואטסאפ|ווטסאפ|whatsapp", re.IGNORECASE)),
    ("unfilled_placeholder", re.compile(r"\{\w+\}|\{\{\d+\}\}")),
)


def frame(body: str, ctx: Context) -> str:
    """שם העסק בתחילת כל הודעה (§3.1 סעיף 1)."""
    if ctx.channel == "email":
        return f"{ctx.business}\n\n{body}"
    return f"{ctx.business}: {body}"


def check_reply(text: str, ctx: Context, intent: Intent) -> list[str]:
    rules = compliance.Rules(business=ctx.business, payment_link=ctx.payment_link,
                             channel=ctx.channel)
    issues = compliance.violations(text, rules)
    issues += [name for name, rx in CONVERSATION_BANNED if rx.search(text)]
    if intent == Intent.WRONG_PERSON:
        # לא חושפים לאדם זר שם/סכום/מספר חשבונית
        if ctx.first_name and ctx.first_name in text:
            issues.append("privacy_name")
        if re.search(r"₪|\d{3,}", text):
            issues.append("privacy_amount")
    return issues


_PHONE_RX = re.compile(r"\+?\d[\d\- ]{7,}\d")
_EMAIL_RX = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")


def redact_for_llm(text: str, ctx: Context) -> str:
    """מזעור לפני שליחה ל-LLM בחו"ל (ר-9): בלי שם, טלפון, מייל, מספר חשבונית, ת"ז."""
    out = _EMAIL_RX.sub("[מייל]", text or "")
    out = _PHONE_RX.sub("[טלפון]", out)
    for inv in ctx.invoices:
        if inv.number:
            out = out.replace(inv.number, "[מס׳]")
    for part in (ctx.customer_name or "").split():
        if len(part) >= 2:
            out = re.sub(r"(?<![\w])" + re.escape(part) + r"(?![\w])", "[שם]", out)
    if ctx.business:
        out = out.replace(ctx.business, "[העסק]")
    return re.sub(r"\b\d{9}\b", "[ת״ז]", out)


# ═══════════════════════════ הצעת פריסה ═══════════════════════════
def propose_plan(ctx: Context, requested: int | None, start: date | None = None) -> tuple[Installment, ...]:
    total = ctx.total_agorot
    if total <= 0:
        return ()
    p = ctx.policy
    max_by_min = max(1, total // max(1, p.min_installment_agorot))
    n = max(1, min(requested or p.default_installments, p.max_installments, max_by_min))
    if n < 2:
        return ()
    first = start or (ctx.today + timedelta(days=p.first_installment_in_days))
    base, rem = divmod(total, n)
    return tuple(Installment(i + 1, _add_months(first, i), base + (rem if i == 0 else 0))
                 for i in range(n))


def _he_date(d: date) -> str:
    names = {6: "ראשון", 0: "שני", 1: "שלישי", 2: "רביעי", 3: "חמישי", 4: "שישי", 5: "שבת"}
    return f"יום {names[d.weekday()]} {d.day}.{d.month}"


def plan_lines(plan: tuple[Installment, ...], currency: str = "ILS") -> str:
    if not plan:
        return ""
    same = len({i.amount_agorot for i in plan[1:]}) <= 1
    if same and len(plan) > 2:
        first, rest = plan[0], plan[1]
        if first.amount_agorot == rest.amount_agorot:
            return (f"{len(plan)} תשלומים חודשיים של {fmt_amount(first.amount_agorot, currency)}, "
                    f"החל מ-{first.due.day}.{first.due.month}")
        return (f"תשלום ראשון {fmt_amount(first.amount_agorot, currency)} ב-{first.due.day}.{first.due.month}, "
                f"ואחריו {len(plan) - 1} תשלומים חודשיים של {fmt_amount(rest.amount_agorot, currency)}")
    return ", ".join(f"{fmt_amount(i.amount_agorot, currency)} ב-{i.due.day}.{i.due.month}" for i in plan)


# ═══════════════════════════ נוסחים ═══════════════════════════
def _hi(ctx: Context) -> str:
    return f"{ctx.first_name}, " if ctx.first_name else ""


def _numbers(ctx: Context) -> str:
    nums = [i.number for i in ctx.invoices]
    if not nums:
        return ""
    return ("חשבונית " + nums[0]) if len(nums) == 1 else ("חשבוניות " + ", ".join(nums))


# ═══════════════════════════ ההחלטה ═══════════════════════════
def respond(text: str, ctx: Context, *, llm: LLMClassifier | None = None,
            drafter: LLMDrafter | None = None) -> Decision:
    t = normalize(text)
    lang = foreign_language(text)
    if lang:
        # ערבית/רוסית: אין הבטחת תמיכה — עוצרים אוטומציה ומעבירים לבעל העסק, בלי ניחוש ובלי LLM
        return _foreign(lang, text, ctx)
    intents = detect(text, ctx)
    confidence = "rules"
    if intents == [Intent.UNKNOWN] and llm is not None and t:
        try:
            got = Intent(str(llm.classify(redact_for_llm(text, ctx))).strip().lower())
            # ה-LLM לא יכול לבחור כוונות מבוססות-הקשר או "תודה" שמשתיקה את בעל העסק
            if got not in STATEFUL and got != Intent.THANKS:
                intents, confidence = [got], "llm"
        except Exception as exc:  # noqa: BLE001 — LLM שבור ⇒ נשארים ב-UNKNOWN
            log.warning("llm classify failed: %s", exc)
    if intents == [Intent.UNKNOWN]:
        confidence = "none"
    d = _decide(t, intents, ctx)
    d = replace(d, confidence=confidence)
    if confidence == "llm" and d.escalate == Escalation.NONE:
        d = replace(d, escalate=Escalation.NORMAL, tags=d.tags + ("llm_classified",))
    # מגן לולאה: אחרי X תשובות של הבוט — רק בעל העסק
    if d.reply and ctx.bot_turns >= ctx.policy.max_bot_turns and d.intent != Intent.OPT_OUT:
        d = replace(d, reply=None, auto_send=False,
                    escalate=max(d.escalate, Escalation.NORMAL, key=_esc_rank),
                    tags=d.tags + ("bot_turn_limit",),
                    owner_actions=d.owner_actions + ("השיחה ארוכה — להמשיך אישית",))
    # ניסוח LLM (אופציונלי) — חייב לעבור מעקה, אחרת נשארים עם הנוסח הקבוע
    if d.reply and drafter is not None:
        try:
            alt = drafter.draft(d.intent, d.reply, ctx)
            if isinstance(alt, str) and alt.strip() and \
                    not check_reply(frame(alt.strip(), ctx), ctx, d.intent):
                d = replace(d, reply=alt.strip(), auto_send=False, tags=d.tags + ("llm_drafted",))
        except Exception as exc:  # noqa: BLE001 — מנסח שבור ⇒ הנוסח הקבוע
            log.warning("llm draft failed: %s", exc)
    if d.reply:
        d = replace(d, reply=frame(d.reply, ctx))
        issues = check_reply(d.reply, ctx, d.intent)
        if issues:  # נוסח קבוע שנכשל — באג. לא שולחים; בעל העסק מטפל
            d = replace(d, reply=None, auto_send=False, guardrail_issues=tuple(issues),
                        escalate=max(d.escalate, Escalation.NORMAL, key=_esc_rank))
    return d


_ARABIC = re.compile("[\u0600-\u06FF\u0750-\u077F]")
_CYRILLIC = re.compile("[\u0400-\u04FF]")
_HEB = re.compile("[\u05D0-\u05EA]")


def foreign_language(text: str) -> str | None:
    """'ar' / 'ru' כשרוב האותיות בכתב ערבי/קירילי, אחרת None."""
    ar, ru = len(_ARABIC.findall(text or "")), len(_CYRILLIC.findall(text or ""))
    he = len(_HEB.findall(text or ""))
    if max(ar, ru) == 0 or max(ar, ru) < he:
        return None
    return "ar" if ar >= ru else "ru"


def _foreign(lang: str, text: str, ctx: Context) -> Decision:
    name = ctx.customer_name or "הלקוח/ה"
    label = {"ar": "ערבית", "ru": "רוסית"}[lang]
    return Decision(
        intent=Intent.UNKNOWN, secondary=(), reply=None, auto_send=False,
        escalate=Escalation.NORMAL, stop=Stop.PAUSE, pause_until=None, next_state=State.AWAITING_OWNER,
        owner_summary=f"🌐 {name} השיב/ה ב{label}: \"{_clip(text)}\". האוטומציה נעצרה; נדרש מענה אישי.",
        owner_actions=("לקרוא/לתרגם ולהשיב אישית", "לחדש תזכורות רק אחרי שבירור"),
        tags=("foreign_language", f"lang:{lang}"), confidence="none")


def _esc_rank(e: Escalation) -> int:
    return {Escalation.NONE: 0, Escalation.NORMAL: 1, Escalation.URGENT: 2}[e]


def _stop_rank(s: Stop) -> int:
    return {Stop.NONE: 0, Stop.PAUSE: 1, Stop.PERMANENT: 2}[s]


def _decide(t: str, intents: list[Intent], ctx: Context) -> Decision:
    primary, secondary = intents[0], tuple(intents[1:])
    allset = set(intents)
    p = ctx.policy
    hi, sig = _hi(ctx), ""
    name = ctx.customer_name or "הלקוח/ה"
    total = fmt_amount(ctx.total_agorot, ctx.currency) if ctx.invoices else ""
    reply: str | None = None
    esc, stop = Escalation.NONE, Stop.NONE
    pause_until: date | None = None
    state = ctx.state
    plan: tuple[Installment, ...] = ()
    promise_date: date | None = None
    paid: int | None = None
    summary = ""
    actions: list[str] = []
    tags: list[str] = []

    def bump(e: Escalation = Escalation.NONE, s: Stop = Stop.NONE) -> None:
        nonlocal esc, stop
        if _esc_rank(e) > _esc_rank(esc):
            esc = e
        if _stop_rank(s) > _stop_rank(stop):
            stop = s

    # ── השפעות מכל הכוונות (איחוד) ──
    if Intent.MINOR in allset:
        bump(Escalation.URGENT, Stop.PAUSE)
        tags += ["minor", "sensitive"]
    if Intent.DISTRESS in allset:
        bump(Escalation.URGENT, Stop.PAUSE)
        tags.append("sensitive")
    if Intent.OPT_OUT in allset:
        bump(s=Stop.PERMANENT)
    if Intent.WRONG_PERSON in allset:
        bump(Escalation.NORMAL, Stop.PERMANENT)
    if Intent.LEGAL in allset:
        bump(Escalation.URGENT, Stop.PAUSE)
        tags.append("legal")
    if Intent.DISPUTE in allset:
        bump(Escalation.URGENT, Stop.PAUSE)
    if Intent.PAID_CLAIM in allset:
        bump(Escalation.NORMAL, Stop.PAUSE)
    if Intent.CANT_PAY in allset:
        bump(Escalation.NORMAL, Stop.PAUSE)
        if _s(r"מילואים|צו 8|צו שמונה", t):
            tags.append("reservist")
        if _s(r"חולה|מחלה|מאושפז|אשפוז|ניתוח|כימו|שבעה|אבל|נפטר|לעולמ|לוויה|בבית ה?חולימ|בבי\"?ח|בטיפול נמרצ", t):
            tags.append("sensitive")
        # ר-6: חדלות פירעון ⇒ אסור לגבות בעצמנו; נפטר ⇒ עזבון — שניהם לבעל העסק בדחיפות
        if _s(r"פשיטת רגל|חדלות פירעון|צו כינוס|צו פתיחת הליכים|הליך חדלות|נאמן (?:בתיק|שמונה)|כונס נכסים", t):
            tags += ["insolvency", "sensitive"]
            bump(Escalation.URGENT)
        if _s(r"(?:הוא|היא|בעלי|אשתי|אבא|אמא|אבי|אמי|הלקוח|הלקוחה|בעל החשבון)\w*(?: שלי)?[\s,\-–]+(?:\w+[\s,]+)?(?:נפטר|נפטרה|הלך לעולמו|הלכה לעולמה|נהרג|נהרגה)", t):
            tags += ["deceased"]
            bump(Escalation.URGENT)
    if Intent.PLAN_REQUEST in allset or Intent.PLAN_ACCEPT in allset or Intent.PLAN_REJECT in allset:
        bump(Escalation.NORMAL, Stop.PAUSE)
    if Intent.ABUSIVE in allset:
        bump(Escalation.NORMAL)
        tags.append("abusive")
    if Intent.CALLBACK in allset or Intent.COPY_REQUEST in allset:
        bump(Escalation.NORMAL)
    if Intent.UNKNOWN in allset:
        bump(Escalation.NORMAL)

    # ── נוסח לפי הכוונה העיקרית ──
    if primary == Intent.MINOR:
        reply = None  # לא מנהלים שיחה על חוב עם קטין
        summary = f"🔴 נראה שמי שענה במספר של {name} הוא קטין. כל האוטומציה נעצרה ולא נשלחה תשובה."
        actions.append("לבדוק פרטי קשר נכונים של בעל החשבון; לא לפנות שוב למספר הזה בלי בירור")
        state = State.AWAITING_OWNER
    elif primary == Intent.DISTRESS:
        reply = (f"{hi}מצטערים מאוד לשמוע. התשלום יכול לחכות — עצרנו את כל התזכורות. "
                 f"אם קשה לכם עכשיו, ער\"ן זמינים בכל שעה בטלפון 1201.{sig}")
        summary = f"⚠️ {name} כתב/ה משהו שנשמע כמו מצוקה קשה. כל התזכורות הושהו."
        actions.append("לקרוא את ההודעה ולפנות אישית ובעדינות — לא לדבר על כסף")
        pause_until = ctx.today + timedelta(days=30)
        state = State.AWAITING_OWNER
    elif primary == Intent.OPT_OUT:
        reply = f"הבקשה התקבלה — לא יישלחו אליכם עוד תזכורות אוטומטיות.{sig}"
        summary = f"{name} ביקש/ה להפסיק לקבל תזכורות. הוסר/ה לצמיתות."
        if Intent.DISPUTE in allset or Intent.LEGAL in allset:
            summary += " ההודעה כוללת גם טענה נגד החוב."
            actions.append("לברר את הטענה אישית")
        state = State.OPTED_OUT
    elif primary == Intent.WRONG_PERSON:
        reply = f"סליחה על ההטרדה! נעדכן את הפרטים אצלנו ולא נפנה שוב למספר הזה.{sig}"
        summary = f"מי שענה במספר של {name} אומר/ת שזה לא הוא/היא. המספר הוסר."
        actions.append("לעדכן טלפון נכון בחשבונית ירוקה")
        state = State.OPTED_OUT
    elif primary == Intent.LEGAL:
        reply = None  # כל מילה עלולה לשמש בהליך — בעל העסק מחליט
        summary = f"🔴 {name} הזכיר/ה עו\"ד / תביעה / תלונה. התזכורות הושהו ולא נשלחה תשובה."
        actions.append("לא להשיב לפני התייעצות; לבדוק את ההיסטוריה של החשבונית")
        state = State.AWAITING_OWNER
    elif primary == Intent.DISPUTE:
        reply = (f"תודה שעדכנתם{(' ' + ctx.first_name) if ctx.first_name else ''}. עצרנו את התזכורות, "
                 f"ונחזור אליכם אישית כדי לברר את העניין.{sig}")
        summary = f"🔴 {name} חולק/ת על החוב: \"{_clip(t)}\". התזכורות הושהו."
        actions.append("לבדוק את הטענה ולחזור ללקוח אישית")
        state = State.AWAITING_OWNER
    elif primary == Intent.PAID_CLAIM:
        paid = extract_paid_amount(t)
        partial = bool(_PARTIAL_WORDS.search(t)) or (
            paid is not None and ctx.total_agorot and paid < ctx.total_agorot)
        if partial:
            tags.append("partial")
            got = f" ({fmt_amount(paid, ctx.currency)})" if paid else ""
            reply = (f"תודה{(' ' + ctx.first_name) if ctx.first_name else ''}! רשמנו שהעברתם חלק מהסכום{got}. "
                     f"נבדוק מול הרישומים ונחזור אליכם לגבי היתרה. "
                     f"אם יש אסמכתא — אפשר לשלוח כאן.{sig}")
            summary = (f"{name} טוען/ת ששילם/ה חלק{got} מתוך {total}. לבדוק ולעדכן יתרה.")
        else:
            reply = (f"תודה שעדכנתם{(' ' + ctx.first_name) if ctx.first_name else ''}! עצרנו את התזכורות "
                     f"ונבדוק את התשלום מול הרישומים שלנו. אם יש אסמכתא (צילום או מספר העברה) — "
                     f"אפשר לשלוח כאן, זה יזרז את הבדיקה.{sig}")
            summary = f"{name} טוען/ת ששילם/ה {total}. התזכורות הושהו עד שתבדקו."
        actions.append("לבדוק בבנק/בסליקה ולסמן בחשבונית ירוקה")
        if Intent.PLAN_REQUEST in allset:
            actions.append("ביקש/ה גם פריסה ליתרה")
        pause_until = ctx.today + timedelta(days=7)
        state = State.AWAITING_OWNER
    elif primary == Intent.PLAN_ACCEPT:
        plan = ctx.offered_plan
        reply = (f"מעולה, תודה{(' ' + ctx.first_name) if ctx.first_name else ''}! ההסדר הועבר לאישור סופי, "
                 f"ונשלח בקרוב את פרטי התשלום הראשון.{sig}")
        summary = f"✅ {name} אישר/ה את הצעת הפריסה ({plan_lines(plan, ctx.currency)}). נדרש אישור סופי שלך."
        actions.append("לאשר את ההסדר")
        state = State.PLAN_PENDING_OWNER
    elif primary == Intent.PLAN_REJECT and Intent.PLAN_REQUEST not in allset:
        reply = (f"בסדר גמור. נחזור אליכם כדי למצוא יחד פתרון שמתאים לכם.{sig}")
        summary = f"{name} דחה/תה את הצעת הפריסה: \"{_clip(t)}\"."
        actions.append("להציע הסדר אחר או לדבר אישית")
        state = State.AWAITING_OWNER
    elif primary in (Intent.PLAN_REQUEST, Intent.PLAN_REJECT, Intent.CANT_PAY):
        requested = extract_installments(t)
        if requested is None and ctx.state == State.AWAITING_PLAN_REPLY:
            m = _s(r"(\d{1,2}|" + _NUMW + r")", t)
            if m:
                g = m.group(1)
                requested = int(g) if g.isdigit() else _NUM_WORDS.get(g)
        monthly = extract_monthly_amount(t)
        if requested is None and monthly and ctx.total_agorot:
            requested = -(-ctx.total_agorot // monthly)  # עיגול למעלה
        start = None
        dd, _ = extract_date(t, ctx.today)
        if dd and (dd - ctx.today).days <= p.max_defer_days and dd > ctx.today:
            start = dd
        over = requested is not None and requested > p.max_installments
        sensitive = "reservist" in tags or "sensitive" in tags
        if p.auto_offer_plan and ctx.invoices and not sensitive:
            plan = propose_plan(ctx, requested, start)
        if plan:
            intro = {Intent.CANT_PAY: f"{hi}תודה ששיתפתם, אנחנו מבינים. אפשר לפרוס את {total} בלי תוספת: ",
                     }.get(primary, f"{hi}בשמחה. הצעה לפריסת {total} בלי תוספת: ")
            if over:
                intro = f"{hi}אפשר לפרוס עד {p.max_installments} תשלומים בלי תוספת: "
            reply = (intro + plan_lines(plan, ctx.currency) + ". "
                     f"בכפוף לאישור סופי. מתאים? השיבו \"מאשר\" או כתבו מה מתאים לכם.{sig}")
            state = State.AWAITING_PLAN_REPLY
            summary = f"{name} " + ("סיפר/ה על קושי" if primary == Intent.CANT_PAY else "ביקש/ה פריסה") + \
                      (f" ל-{requested} תשלומים" if requested else "") + \
                      f". טיוטת הצעה: {plan_lines(plan, ctx.currency)}."
            if over:
                summary += f" ⚠️ ביקש/ה {requested} — מעל התקרה שלך ({p.max_installments})."
                actions.append(f"להחליט אם לאשר {requested} תשלומים")
            actions.append("לאשר את טיוטת ההצעה לפני שליחה")
        elif "reservist" in tags:
            reply = (f"{hi}תודה על השירות! עצרנו את התזכורות לתקופה הקרובה, ונחזור אליכם אישית "
                     f"כשיהיה נוח. אין שום לחץ.{sig}")
            summary = f"{name} במילואים. התזכורות הושהו ל-30 יום."
            actions.append("לחזור אחרי המילואים; לשקול דחייה בלי לחץ")
            pause_until = ctx.today + timedelta(days=30)
            state = State.AWAITING_OWNER
        elif "insolvency" in tags:
            reply = (f"{hi}תודה שעדכנתם. עצרנו את התזכורות, ונחזור אליכם אישית.{sig}")
            summary = f"🔴 {name} מדווח/ת על הליך חדלות פירעון / פשיטת רגל. התזכורות הושהו; אין להציע הסדר בלי ייעוץ."
            actions.append("לבדוק סטטוס הליך (נאמן/צו) לפני כל פנייה נוספת")
            state = State.AWAITING_OWNER
        elif "sensitive" in tags:
            reply = (f"{hi}מצטערים לשמוע, ומאחלים שיהיה רק טוב. עצרנו את התזכורות לתקופה הקרובה, "
                     f"ונחזור אליכם אישית כשיהיה מתאים.{sig}")
            summary = f"{name} שיתף/ה במצב רגיש (מחלה/אבל). התזכורות הושהו ל-30 יום."
            if "deceased" in tags:
                summary = (f"🔴 נמסר על פטירה בהקשר של {name}. התזכורות הושהו; "
                           "אם בעל החשבון נפטר — לא פונים שוב, החוב מול העיזבון.")
            actions.append("לפנות אישית ובעדינות כשיהיה מתאים")
            pause_until = ctx.today + timedelta(days=30)
            state = State.AWAITING_OWNER
        else:
            reply = (f"{hi}תודה ששיתפתם. נחזור אליכם אישית כדי למצוא יחד פתרון שמתאים לכם.{sig}")
            summary = f"{name} מבקש/ת הסדר/מתקשה לשלם. לא הוצעה פריסה אוטומטית."
            actions.append("להציע הסדר")
            state = State.AWAITING_OWNER
    elif primary == Intent.PROMISE:
        dd, vague = extract_date(t, ctx.today)
        if dd is not None and dd >= ctx.today:
            promise_date = dd
            days = (dd - ctx.today).days
            if days <= p.max_defer_days:
                link = f" לתשלום: {ctx.payment_link}" if ctx.payment_link else ""
                reply = (f"תודה{(' ' + ctx.first_name) if ctx.first_name else ''}! רשמנו שהתשלום צפוי עד "
                         f"{_he_date(dd)}, ולא נשלח תזכורות עד אז.{link}{sig}")
                pause_until = dd + timedelta(days=1)
                bump(s=Stop.PAUSE)
                state = State.PROMISED
                summary = f"{name} התחייב/ה לשלם עד {_he_date(dd)}. התזכורות הושהו עד אז."
            else:
                reply = (f"תודה{(' ' + ctx.first_name) if ctx.first_name else ''}. נבדוק את המועד שביקשתם "
                         f"ונחזור אליכם.{sig}")
                bump(Escalation.NORMAL, Stop.PAUSE)
                state = State.AWAITING_OWNER
                summary = (f"{name} מבקש/ת לדחות עד {_he_date(dd)} ({days} ימים) — מעל {p.max_defer_days} "
                           f"הימים שמותר לי לאשר לבד.")
                actions.append("לאשר או להציע מועד אחר")
        else:
            reply = (f"תודה{(' ' + ctx.first_name) if ctx.first_name else ''}! כדי שלא נטריד סתם — "
                     f"עד איזה תאריך בערך יהיה נוח לכם?{sig}")
            pause_until = ctx.today + timedelta(days=3)
            bump(s=Stop.PAUSE)
            state = State.AWAITING_DATE
            summary = f"{name} אמר/ה שישלם/תשלם (בלי תאריך). שאלתי עד מתי; הושהה ל-3 ימים."
            if vague:
                tags.append("vague_date")
    elif primary == Intent.COPY_REQUEST:
        reply = f"בטח. נשלח לכם שוב את {_numbers(ctx) or 'החשבונית'} עם הפירוט בהקדם.{sig}"
        summary = f"{name} מבקש/ת העתק/פירוט של {_numbers(ctx) or 'החשבונית'}."
        actions.append("לשלוח העתק חשבונית מחשבונית ירוקה")
    elif primary == Intent.HOW_TO_PAY:
        if ctx.payment_link:
            amt = f" ({total})" if total else ""
            reply = f"אפשר לשלם{amt} בקישור המאובטח: {ctx.payment_link}\nתודה!{sig}"
            summary = f"{name} שאל/ה איך משלמים — נשלח קישור תשלום."
        else:
            reply = f"נשלח לכם פרטי תשלום בהקדם. תודה!{sig}"
            bump(Escalation.NORMAL)
            summary = f"{name} שאל/ה איך משלמים, ואין קישור תשלום מוגדר."
            actions.append("להגדיר קישור תשלום / לשלוח פרטים")
    elif primary == Intent.CALLBACK:
        reply = f"בשמחה, נחזור אליכם בטלפון בהקדם.{sig}"
        summary = f"{name} מבקש/ת שתתקשרו."
        actions.append("להתקשר ללקוח")
    elif primary == Intent.WHO_IS_THIS:
        reply = f"שלום! ההודעה נשלחה בנוגע לחשבונית שהופקה עבורכם. אם יש שאלה — אפשר להשיב כאן.{sig}"
        summary = f"{name} שאל/ה מי פונה. נשלח זיהוי בלי פרטי חוב."
    elif primary == Intent.ABUSIVE:
        reply = None
        summary = f"{name} השיב/ה בגסות. לא נשלחה תשובה; התזכורות האוטומטיות ממשיכות רק באישורך."
        bump(s=Stop.PAUSE)
        actions.append("להחליט אם להמשיך")
        state = State.AWAITING_OWNER
    elif primary == Intent.THANKS:
        reply = None
        summary = f"{name} אישר/ה קבלה."
    else:
        reply = None
        summary = f"❓ הודעה מ-{name} שלא זיהיתי: \"{_clip(t)}\"."
        actions.append("לקרוא ולהשיב אישית")
        state = State.AWAITING_OWNER

    if stop == Stop.PERMANENT:
        pause_until = None
        state = State.OPTED_OUT

    # כשהלקוח כבר ביקש הסרה — עונים רק על בקשה מפורשת, ורק באישור
    if ctx.state == State.OPTED_OUT and primary not in (Intent.HOW_TO_PAY, Intent.COPY_REQUEST,
                                                         Intent.CALLBACK, Intent.DISPUTE,
                                                         Intent.PAID_CLAIM, Intent.DISTRESS):
        reply = None
        if primary not in (Intent.THANKS, Intent.OPT_OUT):
            bump(Escalation.NORMAL)
    if ctx.state == State.OPTED_OUT:
        bump(s=Stop.PERMANENT)
        state = State.OPTED_OUT

    auto = (ctx.policy.approval_mode == "safe_auto" and reply is not None and primary in SAFE_AUTO
            and esc == Escalation.NONE and not secondary)
    return Decision(
        intent=primary, secondary=secondary, reply=reply, auto_send=auto, escalate=esc, stop=stop,
        pause_until=pause_until if stop == Stop.PAUSE else None, next_state=state, plan=plan,
        promise_date=promise_date, paid_agorot=paid, owner_summary=summary,
        owner_actions=tuple(actions), tags=tuple(dict.fromkeys(tags)))


def _clip(t: str, n: int = 80) -> str:
    return t if len(t) <= n else t[: n - 1] + "…"
