"""מרשם בקשות נושאי מידע (עיון / תיקון / מחיקה) — חוק הגנת הפרטיות §13–14.

🟡 לבדיקת עו״ד (legal/LAWYER-QUESTIONS.md שאלה 37): לפי תקנות הגנת הפרטיות (תנאי עיון במידע
וסדרי דין בערעור), תשמ״א-1981, בעל המאגר מאפשר עיון **תוך 30 יום** מקבלת הבקשה. בעל השליטה הוא
העסק; גבי (מחזיק) רק מתעד, סופר ימים ומתריע — היא לא עונה ללקוח בשם העסק (DPA §9).

זרימה: הודעה נכנסת שמבקשת עיון/תיקון/מחיקה ⇒ נפתחת בקשה (פעם אחת לכל לקוח+סוג כל עוד פתוחה) +
התראה לבעל העסק עם תאריך יעד ⇒ 5 ימים לפני היעד ובאיחור: התראה אחת נוספת לכל שלב ⇒ בעל העסק סוגר.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any

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
_ACCESS = re.compile(r"(לעיין|עיון)\s+(ב|על\s+)?(כל\s+)?(ה)?(מידע|פרטים|נתונים)|סעיף\s*13|"
                     r"מה\s+(ה)?מידע\s+(ש)?יש\s+לכם\s+עליי|אילו\s+פרטים\s+(ש)?יש\s+לכם|"
                     r"\b(access|copy of)\s+(my|the)\s+(personal\s+)?data\b|\bsubject access\b", re.I)
_CORRECT = re.compile(r"(לתקן|תיקון)\s+(את\s+)?(ה)?(מידע|פרטים|נתונים)|סעיף\s*14|"
                      r"\b(correct|rectify)\s+(my|the)\s+(personal\s+)?(data|details)\b", re.I)
_DELETE = re.compile(r"(למחוק|מחיקת|תמחקו)\s+(את\s+)?(כל\s+)?(ה)?(מידע|פרטים|נתונים)(\s+שלי)?(\s+מה?מאגר)?|"
                     r"\b(delete|erase)\s+(all\s+)?(my\s+)?(personal\s+)?data\b", re.I)


def detect(text: str) -> list[str]:
    t = text or ""
    return [k for k, rx in (("access", _ACCESS), ("correction", _CORRECT), ("deletion", _DELETE))
            if rx.search(t)]


def _iso(dt: datetime) -> str:
    return dt.isoformat(timespec="seconds")


def ensure_schema(db) -> None:
    db.conn.executescript(SCHEMA)


def open_request(svc: Any, customer_id: int | None, kind: str, channel: str,
                 note: str = "") -> int | None:
    """None ⇒ כבר יש בקשה פתוחה מאותו סוג ללקוח (לא פותחים כפולה)."""
    if kind not in KINDS:
        raise ValueError(f"סוג בקשה לא מוכר: {kind}")
    ensure_schema(svc.db)
    if customer_id is not None and svc.db.one(
            "SELECT 1 FROM dsr WHERE customer_id=? AND kind=? AND status='open'", (customer_id, kind)):
        return None
    now = svc.clock()
    due = now + timedelta(days=DUE_DAYS)
    rid = svc.db.x("INSERT INTO dsr(customer_id,kind,channel,received_at,due_at,note) "
                   "VALUES(?,?,?,?,?,?)", (customer_id, kind, channel, _iso(now), _iso(due),
                                           (note or "")[:500]))
    _owner_alert(svc, customer_id, f"dsr:{rid}:open",
                 f"התקבלה בקשת {KIND_HE[kind]} לפי חוק הגנת הפרטיות. יש להשיב עד "
                 f"{due.date().isoformat()} (30 יום — לבדיקת עו״ד). "
                 "לעיון: «⬇ ייצוא מידע» בטבלת החשבוניות. גבי לא עונה ללקוח בשמכם.")
    svc.audit("customer" if channel != "owner" else "owner", "dsr_opened",
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
    svc.audit(actor, "dsr_closed", {"dsr": dsr_id, "late": svc.clock() > datetime.fromisoformat(r["due_at"])})
    return dict(svc.db.one("SELECT * FROM dsr WHERE id=?", (dsr_id,)))


def listing(svc: Any) -> list[dict]:
    ensure_schema(svc.db)
    now = svc.clock()
    out = []
    for r in svc.db.q("SELECT d.*, c.name customer FROM dsr d LEFT JOIN customers c ON c.id=d.customer_id "
                      "ORDER BY d.status='done', d.due_at"):
        days = (datetime.fromisoformat(r["due_at"]) - now).days
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
        stage = "late" if now > due else ("soon" if due - now <= timedelta(days=WARN_DAYS) else "")
        if not stage or stage in r["warned"].split(","):
            continue
        msg = (f"⚠️ בקשת {KIND_HE[r['kind']]} עברה את המועד ({due.date().isoformat()})."
               if stage == "late" else
               f"נותרו {max((due - now).days, 0)} ימים להשיב לבקשת {KIND_HE[r['kind']]} "
               f"(עד {due.date().isoformat()}).")
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
