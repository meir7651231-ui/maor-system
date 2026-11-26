"""מרשם בקשות נושאי מידע (עיון / תיקון / מחיקה) — חוק הגנת הפרטיות §13–14.

🟡 לבדיקת עו״ד (legal/LAWYER-QUESTIONS.md שאלה 37): לפי תקנות הגנת הפרטיות (תנאי עיון במידע
וסדרי דין בערעור), תשמ״א-1981, בעל המאגר מאפשר עיון **תוך 30 יום** מקבלת הבקשה. בעל השליטה הוא
העסק; גבי (מחזיק) רק מתעד, סופר ימים ומתריע — היא לא עונה ללקוח בשם העסק (DPA §9).

זרימה: הודעה נכנסת שמבקשת עיון/תיקון/מחיקה ⇒ נפתחת בקשה (פעם אחת לכל לקוח+סוג כל עוד פתוחה) +
התראה לבעל העסק עם תאריך יעד ⇒ 5 ימים לפני היעד ובאיחור: התראה אחת נוספת לכל שלב ⇒ בעל העסק סוגר.
"""
from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from typing import Any

from .policy import TZ

DUE_DAYS = 30
WARN_DAYS = 5
KINDS = ("access", "correction", "deletion")
KIND_HE = {"access": "עיון במידע", "correction": "תיקון מידע", "deletion": "מחיקת מידע"}

SCHEMA = """
CREATE TABLE IF NOT EXISTS dsr (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER, kind TEXT NOT NULL, channel TEXT NOT NULL,
  received_at TEXT NOT NULL, due_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', done_at TEXT, note TEXT,
  warned TEXT NOT NULL DEFAULT ''
);
"""

# מזהים בקשה מפורשת לפי החוק, לא כל "מי אתם" או "תפסיקו" (אלה הסרה / מי זה — מסלולים אחרים)
# critic 171א: גם «איזה מידע יש לכם עליי», «what information do you have about me», «מחקו/מחיקה של המידע»,
# «delete my information», «erase my details» — ניסוחים נפוצים שלא נרשמו (ולכן לא רץ מועד 30 יום)
# מנהל 331 (סט QA #20, 9 בקשות שלא נרשמו ⇒ המועד החוקי לא רץ): הלקוחות כותבים בציווי ולא בשם-הפעולה —
# «שלחו לי את כל המידע שיש לכם עליי», «מחקו בבקשה את הפרטים שלי», «תקנו את הפרטים שלי», «Send me all the data you
# hold about me», «erase everything you have on me», «Delete my phone number», «forget me — remove me from your
# system». עוגן «עליי/about me» נדרש לעיון (אחרת «שלחו לי את פרטי התשלום» היה נרשם); «מהרשימה/from your list» =
# הסרה, לא מחיקה. שלילה חלה עכשיו על **שלושת** הסוגים («אני לא מבקשת לעיין», «אין צורך לתקן» נרשמו).
_ABOUT_ME_HE = r"(?:עליי|עלי|לגביי|אודותיי|אודותי)"
_HOLD_HE = r"(?:ש)?(?:יש\s+לכם|אתם\s+מחזיקים|אתם\s+שומרים|שמור(?:ים)?\s+אצלכם|נשמר(?:ו)?\s+אצלכם)"
_DATA_EN = r"(?:personal\s+)?(?:information|data|info|details|records)"
_HOLD_EN = r"(?:that\s+|which\s+)?(?:you\s+)?(?:have|hold|keep|store|have\s+stored|are\s+holding|collected)"
_FILL_REQ_HE = r"(?:(?:בבקשה|נא|כבר|מיד|מייד|עכשיו|לי|לנו)\s+)*"
_ACCESS = re.compile(r"(לעיין|עיון)\s+(ב|על\s+)?(כל\s+)?(ה)?(מידע|פרטים|נתונים)|סעיף\s*13|"
                     r"(מה|איזה|אילו)\s+(ה)?(מידע|פרטים|נתונים)\s+(ש)?יש\s+לכם\s+(עליי|עלי|לגביי)|"
                     r"אילו\s+פרטים\s+(ש)?יש\s+לכם|"
                     r"(מידע|פרטים|נתונים)\s+" + _HOLD_HE + r"\s+" + _ABOUT_ME_HE + r"|"
                     r"\b(access|copy of)\s+(my|the)\s+(personal\s+)?data\b|\bsubject access\b|"
                     r"\bwhat\s+(personal\s+)?(information|data|info|details)\s+do\s+you\s+(have|hold|keep)"
                     r"\s+(about|on)\s+me\b|"
                     r"\b" + _DATA_EN + r"\s+" + _HOLD_EN + r"\s+(?:about|on)\s+me\b|"
                     # מנהל 333 (מבקר 183 🟡): ניסוח יומיומי — «מה אתם יודעים עליי», «what do you know about me»,
                     # «show me my data». עוגן «עליי/about me» או «my data» נשמר («show me my invoice» לא נרשם).
                     r"(?:מה|כמה|איזה\s+דברים)\s+(?:אתם|את|אתה|אתן)\s+"
                     r"(?:יודעים|יודעת|יודע|יודעות)\s+" + _ABOUT_ME_HE + r"|"
                     r"\bwhat\s+(?:else\s+)?(?:do|did)\s+(?:you|u|ya)\s+(?:guys\s+)?(?:know|have|hold|keep|store)"
                     r"\s+(?:about|on)\s+me\b|"
                     r"\b(?:show|send|give|email)\s+me\s+(?:a\s+copy\s+of\s+)?(?:all\s+)?(?:of\s+)?my\s+"
                     r"(?:personal\s+)?(?:data|information|info|records)\b|"
                     r"(?:תראו|תראי|הראו|שלחו|תשלחו|תשלחי)\s+" + _FILL_REQ_HE +
                     r"(?:את\s+)?(?:כל\s+)?(?:ה)?(?:מידע|נתונים)\s+"
                     r"(?:שלי|" + _ABOUT_ME_HE + r")", re.I)
_CORRECT = re.compile(r"(לתקן|תיקון)\s+(את\s+)?(ה)?(מידע|פרטים|נתונים)|סעיף\s*14|"
                      r"(תקנו|תתקנו|תקני|תתקני|עדכנו|תעדכנו)\s+" + _FILL_REQ_HE + r"(את\s+)?(ה)?(מידע|פרטים|נתונים)"
                      r"(\s+שלי|\s+" + _ABOUT_ME_HE + r")?|"
                      r"\b(correct|rectify)\s+(my|the)\s+(personal\s+)?(data|details)\b|"
                      r"\b(correct|rectify)\s+my\s+(personal\s+)?(data|details|information|info|records?|"
                      r"address(\s+details)?|name)\b", re.I)
_DELETE = re.compile(r"(למחוק|מחיקת|מחיקה\s+של|תמחקו|מחקו|תמחקי|תמחק)\s+" + _FILL_REQ_HE +
                     r"(את\s+)?(כל\s+)?(ה)?(מידע|פרטים|נתונים)"
                     r"(\s+שלי)?(\s+מה?מאגר)?|"
                     r"(למחוק|תמחקו|מחקו|תמחקי|תמחק)\s+" + _FILL_REQ_HE + r"אותי\s+(לגמרי\s+)?מה?(מאגר|מערכת|רשומות)|"
                     r"\b(delete|erase)\s+(all\s+)?(of\s+)?(my\s+)?(personal\s+)?(data|information|info|details)\b|"
                     r"\b(delete|erase|wipe|purge|remove)\s+(all\s+)?(of\s+)?my\s+(phone\s+number|number|email"
                     r"(\s+address)?|records)\s+(and\s+\w+\s+)?from\s+your\s+(records|system|database|files)\b|"
                     r"\b(delete|erase|wipe|purge|remove)\s+(everything|all)\s+(that\s+)?(you\s+)?(have|hold|keep|store)"
                     r"\s+(on|about)\s+(me|my\s+client|him|her|them|us)\b|"
                     # גבי מנוע 20.11 (qa20 q20-27, וריאציה): עו״ד בשם מרשה — «Erase every record you keep about my
                     # client» לא נרשם (מועד 30 יום לא רץ). עוגן חובה: «about/on <נושא המידע>».
                     r"\b(delete|erase|wipe|purge|remove|destroy)\s+(every|all|any)\s+(of\s+)?(the\s+)?"
                     r"(record|records|file|files|data|information|info|details)\s+(that\s+|which\s+)?(you\s+)?"
                     r"(have|hold|keep|store|have\s+stored|maintain)\s+(on|about|regarding)\s+"
                     r"(me|my\s+client|my\s+son|my\s+daughter|my\s+child|him|her|them|us)\b|"
                     r"\bremove\s+me\s+(completely\s+)?from\s+your\s+(system|database|records|files)\b|"
                     r"\bforget\s+(about\s+)?me\b(?!\s+(?:not|for|until|till)\b)|\bright\s+to\s+(be\s+forgotten|erasure)\b",
                     re.I)


# critic 172: «אל תמחקו את המידע שלי», «לא ביקשתי למחוק», «אני לא רוצה שתמחקו», «I don't want you to delete»,
# «please don't delete my details» נרשמו כבקשת **מחיקה** — הפוך מרצון הלקוח. שלילה צמודה לפועל (באותו משפט,
# רק מילות-מילוי ביניהן) ⇒ המופע לא נחשב. «אל תשכחו למחוק» / «don't forget to delete» = בקשה (הפועל המשני לא מילוי).
_FILL_HE = (r"(?:ממש|בכלל|רוצה|רוצים|ביקשתי|ביקשנו|ביקש|ביקשה|מבקש|מבקשת|מבקשים|"
            r"צריך|צריכה|צריכים|צריכות|תנסו|כדאי|צורך|אני|אנחנו)")
# critic 173: «שלא תמחקו» (קידומת ש׳/וש׳), «אסור לכם למחוק», ובאנגלית «u»/«ya» — גם הם שלילה צמודה.
_NEG_HE = re.compile(r"(?:^|[\s,(\"'])(?:וש|ו|ש)?(?:אל|לא|אין|בלי|אף\s+פעם\s+לא|אסור(?:\s+(?:לכם|לכן|לך))?)\s+"
                     r"(?:" + _FILL_HE + r"\s+)*ש?$")
_FILL_EN = r"(?:really|want|wish|need|ask|asked|you|u|ya|y'?all|to|me|for|please|it|guys)"
_NEG_EN = re.compile(r"\b(?:don'?t|do\s+not|didn'?t|did\s+not|never|no\s+need\s+to)\s+(?:" + _FILL_EN
                     + r"\s+)*$", re.I)


def _negated(t: str, start: int) -> bool:
    # רק רווחים בין השלילה לפועל (דרך מילות-מילוי) ⇒ פסיק/נקודה/סימן שאלה שוברים את השרשרת: «לא, תמחקו» = בקשה
    before = t[max(0, start - 60):start].replace("\u2019", "'")
    return bool(_NEG_HE.search(before) or _NEG_EN.search(before))


def _hit(rx: re.Pattern, t: str, negation: bool) -> bool:
    if not negation:
        return bool(rx.search(t))
    return any(not _negated(t, m.start()) for m in rx.finditer(t))


def detect(text: str) -> list[str]:
    t = text or ""
    return [k for k, rx in (("access", _ACCESS), ("correction", _CORRECT), ("deletion", _DELETE))
            if _hit(rx, t, True)]   # מנהל 331: שלילה לכל הסוגים («לא מבקשת לעיין», «אין צורך לתקן»)


def _local_day(dt: datetime) -> date:
    """יום לוח בשעון ישראל (המסך מציג **תאריך** יעד — הספירה בימי לוח, לא ביחידות 24 שעות; critic 174)."""
    return (dt.astimezone(TZ) if dt.tzinfo else dt).date()


def days_left(due: datetime, now: datetime) -> int:
    """0 = יום היעד עצמו; שלילי = באיחור (רק אחרי יום היעד). אחד למרשם, להתראות ולסימון איחור בסגירה."""
    return (_local_day(due) - _local_day(now)).days


_days_left = days_left


def _iso(dt: datetime) -> str:
    return dt.isoformat(timespec="seconds")


def ensure_schema(db) -> None:
    db.ensure_table(SCHEMA)   # מנהל 434 (263ב): תחת lock, בלי COMMIT לטרנזקציה של thread אחר


def open_request(svc: Any, customer_id: int | None, kind: str, channel: str,
                 note: str = "", received_at: datetime | None = None, actor: str | None = None) -> int | None:
    """None ⇒ כבר יש בקשה פתוחה מאותו סוג ללקוח (לא פותחים כפולה).

    received_at: מתי הבקשה התקבלה בפועל (critic 171ב — בקשה מכתובת משותפת נרשמת רק בשיוך, אבל המועד
    החוקי נספר מקבלת ההודעה, לא מיום השיוך). ברירת מחדל: עכשיו. עתידי ⇒ עכשיו."""
    if kind not in KINDS:
        raise ValueError(f"סוג בקשה לא מוכר: {kind}")
    ensure_schema(svc.db)
    if customer_id is not None and svc.db.one(
            "SELECT 1 FROM dsr WHERE customer_id=? AND kind=? AND status='open'", (customer_id, kind)):
        return None
    now = svc.clock()
    if received_at is not None and received_at < now:
        now = received_at
    due = now + timedelta(days=DUE_DAYS)
    rid = svc.db.x("INSERT INTO dsr(customer_id,kind,channel,received_at,due_at,note) "
                   "VALUES(?,?,?,?,?,?)", (customer_id, kind, channel, _iso(now), _iso(due),
                                           (note or "")[:500]))
    _owner_alert(svc, customer_id, f"dsr:{rid}:open",
                 f"התקבלה בקשת {KIND_HE[kind]} לפי חוק הגנת הפרטיות. יש להשיב עד "
                 f"{due.date().isoformat()} (30 יום — לבדיקת עו״ד). "
                 "לעיון: «⬇ ייצוא מידע» בטבלת החשבוניות (בעל העסק בלבד). גבי לא עונה ללקוח בשמכם.")
    # מבקר 192: actor = מי שהזין/ה בפועל (עובד/ת user:N או owner); בלי actor ⇒ כמו קודם, לפי הערוץ
    svc.audit(actor or ("customer" if channel != "owner" else "owner"), "dsr_opened",
              {"dsr": rid, "kind": kind, "customer": customer_id, "due": due.date().isoformat()})
    return rid


def close_request(svc: Any, dsr_id: int, note: str, actor: str = "owner") -> dict:
    ensure_schema(svc.db)
    r = svc.db.one("SELECT * FROM dsr WHERE id=?", (dsr_id,))
    if not r:
        raise KeyError(dsr_id)
    if r["status"] != "open":
        raise ValueError("הבקשה כבר סגורה")
    if len((note or "").strip()) < 5:
        raise ValueError("סגירת בקשה דורשת תיעוד קצר (מה נמסר/תוקן/נמחק ואיך)")
    svc.db.x("UPDATE dsr SET status='done', done_at=?, note=? WHERE id=?",
             (_iso(svc.clock()), note.strip()[:500], dsr_id))
    svc.audit(actor, "dsr_closed", {"dsr": dsr_id,
                                    "late": days_left(datetime.fromisoformat(r["due_at"]), svc.clock()) < 0})
    return dict(svc.db.one("SELECT * FROM dsr WHERE id=?", (dsr_id,)))


def listing(svc: Any) -> list[dict]:
    ensure_schema(svc.db)
    now = svc.clock()
    out = []
    for r in svc.db.q("SELECT d.*, c.name customer FROM dsr d LEFT JOIN customers c ON c.id=d.customer_id "
                      "ORDER BY d.status='done', d.due_at"):
        days = days_left(datetime.fromisoformat(r["due_at"]), now)
        out.append({**dict(r), "days_left": days if r["status"] == "open" else None,
                    "overdue": r["status"] == "open" and days < 0})
    return out


def sweep(svc: Any) -> int:
    """נקרא בכל plan(): התראה אחת כשנותרו ≤5 ימים, ואחת כשעבר המועד."""
    ensure_schema(svc.db)
    now = svc.clock()
    n = 0
    for r in svc.db.q("SELECT * FROM dsr WHERE status='open'"):
        due = datetime.fromisoformat(r["due_at"])
        left = days_left(due, now)   # critic 174: אותה ספירה כמו המרשם — «באיחור» רק אחרי יום היעד
        stage = "late" if left < 0 else ("soon" if left <= WARN_DAYS else "")
        if not stage or stage in r["warned"].split(","):
            continue
        kind_he, due_iso = KIND_HE[r["kind"]], _local_day(due).isoformat()
        if stage == "late":
            msg = f"⚠️ בקשת {kind_he} עברה את המועד ({due_iso})."
        elif left == 0:
            msg = f"היום היום האחרון להשיב לבקשת {kind_he} (עד {due_iso})."
        else:
            msg = f"נותרו {left} ימים להשיב לבקשת {kind_he} (עד {due_iso})."
        _owner_alert(svc, r["customer_id"], f"dsr:{r['id']}:{stage}", msg)
        svc.db.x("UPDATE dsr SET warned=? WHERE id=?",
                 (",".join(x for x in (r["warned"], stage) if x), r["id"]))
        svc.audit("system", "dsr_" + stage, {"dsr": r["id"]})
        n += 1
    return n


def _owner_alert(svc: Any, customer_id: int | None, key: str, body: str) -> None:
    if svc.db.one("SELECT 1 FROM messages WHERE intent='dsr' AND message_id=?", (key,)):
        return
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
             "message_id,created_at) VALUES(?,'system','owner',?,'dsr',1,?,?)",
             (customer_id, body, key, _iso(svc.clock())))
