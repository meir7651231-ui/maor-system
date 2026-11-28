"""תיבת השיחה: מחבר את מנוע השיחה (conversation.py) ל-DB ולשליחה, מעל CollectService.

זרימה: תשובת חייב ⇒ `handle()` ⇒ החלטה ⇒ השפעות (הסרה/מחלוקת/השהיה/הסדר) מיד,
       ⇒ טיוטת תשובה בתור "ממתין לאישור" ⇒ בעל העסק מאשר/עורך/דוחה ⇒ `approve_draft()`
       ⇒ שער שליחה יחיד (`_can_message`: הסרה, שעות, שבת/חג) ⇒ DryRunSender.

"בעל העסק מאשר כל הודעה": ברירת המחדל היא שאף תשובה לא יוצאת בלי אישור. רק אם
`approval_mode="safe_auto"` הוגדר במפורש, תשובות מידע (קישור תשלום, "מי זה") יוצאות לבד.

לא משנה את service.py: משתמש בשירותים שלו (_find_customer, _opt_out, _cancel_invoice,
_payment_link, _log_out, audit) ומוסיף שתי טבלאות משלו (conversations, drafts).
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import asdict, replace
from datetime import date, datetime, timedelta
from typing import Any

from . import compliance
from .channels import Message, is_il_mobile, normalize_il_phone, valid_email
from .conversation import (
    Context,
    Decision,
    Escalation,
    Installment,
    Intent,
    OpenInvoice,
    OwnerPolicy,
    State,
    Stop,
    detect,
    frame,
    respond,
)
from .llm import load_classifier
from .policy import TZ, invoice_too_old

# critic 3.6.7 / סבב 169: מקור יחיד לאזהרת מייל לא מאומת (טיוטה ישירה וטיוטה אחרי שיוך כרטיס)
UNVERIFIED_EMAIL_NOTE = " ⚠️ המייל לא עבר אימות שולח (SPF/DKIM) — ייתכן שלא נשלח ע״י הלקוח."

SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
  customer_id INTEGER PRIMARY KEY REFERENCES customers(id),
  state TEXT NOT NULL DEFAULT 'idle',
  offered_plan TEXT,
  bot_turns INTEGER NOT NULL DEFAULT 0,
  pause_until TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  channel TEXT NOT NULL,
  to_addr TEXT,                      -- נקבע ביצירה (במספר שגוי הטלפון נמחק מהלקוח מיד)
  body TEXT NOT NULL,
  intent TEXT NOT NULL,
  status TEXT NOT NULL,  -- pending_approval / needs_owner / approved / sent_dry_run / rejected / superseded
  escalate TEXT NOT NULL,
  owner_summary TEXT,
  owner_actions TEXT,
  plan_id INTEGER,
  created_at TEXT NOT NULL,
  decided_at TEXT, decided_by TEXT, edited INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT, message_id TEXT,
  total_agorot INTEGER                -- יתרה פתוחה ברגע הניסוח (אימות סכום לפני שליחה)
);
-- critic סבב 64: _customer_block בודק «הודעה של הלקוח ממתינה לבעל העסק» לכל חשבונית בדשבורד ובתכנון
CREATE INDEX IF NOT EXISTS ix_drafts_cust ON drafts(customer_id, status);
"""

# הודעה ללקוח שביקש הסרה מותרת רק כמענה לבקשה מפורשת שלו או כאישור ההסרה עצמה
_ALLOWED_AFTER_OPT_OUT = {Intent.OPT_OUT.value, Intent.WRONG_PERSON.value, Intent.HOW_TO_PAY.value,
                          Intent.COPY_REQUEST.value, Intent.CALLBACK.value}


# critic סבב 61: סיבות שער (service.gate) לבעל העסק, כשתשובה שאושרה נחסמת ברגע השליחה
_GATE_HE = {
    "opted_out": "הלקוח ביקש הסרה, ולכן אסור לשלוח. אם צריך, פנו ללקוח אישית",
    "email_bounced": "מייל קודם לכתובת הזו חזר (הכתובת לא קיימת). כדאי לתקן את המייל בחשבונית ירוקה או לענות ב-SMS",
}


def _iso(dt: datetime) -> str:
    return dt.astimezone(TZ).isoformat(timespec="seconds")


def _parse_iso(value: str | None) -> datetime | None:
    """created_at שמור ⇒ datetime (עם אזור זמן). פגום/חסר ⇒ None (המועד נספר מעכשיו, כמו קודם)."""
    try:
        dt = datetime.fromisoformat(value or "")
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=TZ)


STALE_DRAFT_HOURS = 96   # critic סבב 30: טיוטה מאושרת שחיכתה מעבר לזה מהשאלה ⇒ לא נשלחת



# הפעלה 146: סירוב להכרעה על טיוטה שכבר הוכרעה, בעברית (היה «status=superseded» גולמי בממשק)
_DRAFT_DECIDED_HE = {
    "approved": "הטיוטה כבר אושרה",
    "sent": "הטיוטה כבר אושרה ונשלחה",
    "sent_dry_run": "הטיוטה כבר אושרה ונשלחה",
    "sending": "הטיוטה כבר אושרה, והיא בשליחה",
    "send_unknown": "הטיוטה כבר אושרה. השליחה נקטעה באמצע, בדקו ביומן היוצאים",
    "rejected": "הטיוטה כבר נסגרה בלי מענה",
    "superseded": "הטיוטה הוחלפה כי המצב מול הלקוח השתנה",
}


def _decided_he(status: str) -> str:
    return _DRAFT_DECIDED_HE.get(status, "הטיוטה כבר הוכרעה")


_DRAFT_APPROVED_STATES = ("approved", "sending", "sent_dry_run", "sent", "send_unknown")


def _draft_decided(status: str, action: str, who=None) -> ValueError:
    """הפעלה 147: אותה הכרעה שוב על טיוטה (התשובה אבדה ברשת) ⇒ AlreadyDecided, כמו בתזכורות (146).
    עדיין 409 ובלי שינוי מצב; הממשק מציג «כבר אושר/נסגר» ולא שגיאה. הכרעה הפוכה נשארת סירוב רגיל.
    מנהל 456 (מבקר 280ℹ️ — 275 חלקי): who מוסיף «— על ידי X ב-D.M HH:MM» (מ-decided_by/decided_at)."""
    from .service import AlreadyDecided  # ייבוא מאוחר: service מייבא את inbox
    he = _decided_he(status)
    if who is not None:
        he = who(he)
    if action == "approve" and status in _DRAFT_APPROVED_STATES:
        return AlreadyDecided(he, "approved")
    if action == "reject" and status == "rejected":
        return AlreadyDecided(he, "rejected")
    return ValueError(he + (". אי אפשר לאשר אותה" if action == "approve" else ". אי אפשר לדחות אותה"))

# כוונות שמודיעות לבעל העסק במייל גם אם המנוע לא סימן אותן urgent (הסרה = חובה לכבד; קטין/מצוקה = אדם)
_URGENT_OWNER_ALERT = {"opt_out", "minor", "distress", "dispute", "legal"}
# מנהל 243: סוג הפנייה במייל הדחוף — תג המצב גובר על הכוונה. חדלות פירעון/פטירה/אשפוז מסווגים cant_pay+תג
# (עקבי עם evals), ולכן לפי הכוונה בלבד המייל אמר «הודעה דחופה» במקום «הליך חדלות פירעון» / «פטירה».
_ALERT_TAGS = ("minor", "insolvency", "deceased")


def _alert_kind(d: Decision) -> str:
    tag = next((t for t in _ALERT_TAGS if t in d.tags), None)
    if tag:
        return tag
    if d.intent == Intent.CANT_PAY and "sensitive" in d.tags:
        return "sensitive"
    return d.intent.value


# כוונות שהופכות הודעה מכתובת משותפת לכרטיס דחוף אחד (נושא 5)
_SHARED_URGENT = (Intent.DISTRESS, Intent.MINOR, Intent.LEGAL, Intent.DISPUTE, Intent.OPT_OUT,
                  Intent.WRONG_PERSON)


class ConversationInbox:
    def __init__(self, svc: Any, policy: OwnerPolicy | None = None, llm: Any = "env") -> None:
        self.svc = svc
        self.db = svc.db
        self.policy = policy or OwnerPolicy()
        # LLM: כבוי כברירת מחדל (LLM_PROVIDER=disabled); mock בלבד; fail-closed (app/llm.py)
        self.llm = load_classifier(os.environ) if llm == "env" else llm
        with self.db.lock:
            self.db.conn.executescript(SCHEMA)
            cols = {r[1] for r in self.db.conn.execute("PRAGMA table_info(drafts)")}
            if "total_agorot" not in cols:  # DB קיים מלפני העמודה
                self.db.conn.execute("ALTER TABLE drafts ADD COLUMN total_agorot INTEGER")
            if "claimed_at" not in cols:    # critic סבב 40: תפיסה לשליחה (כמו reminders, 39.1)
                self.db.conn.execute("ALTER TABLE drafts ADD COLUMN claimed_at TEXT")
            self.db.conn.commit()

    # ---------- כתובת משותפת + דחוף (נושא 5) ----------
    SHARED_URGENT = "shared_contact_urgent"
    # גבייה סוכן 18.11 («אף לקוח ששילם לא מקבל תזכורת»): «שילמתי» מכתובת משותפת בלי שיוך ⇒ היה
    # shared_contact_ambiguous בלי השהיה ⇒ plan() בנה תזכורת גם למי ששילם. עכשיו כרטיס עם בחירה + השהיית כולם.
    SHARED_PAID = "shared_contact_paid_claim"
    # מבקר 233🟡 (הכרעת ראש צוות 25.11): «אשלם ב-12» מכתובת משותפת בלי שיוך ⇒ היה shared_contact_ambiguous בלי השהיה
    # ובלי כפתור שיוך ⇒ ההבטחה לא נרשמה ולמחרת «טרם סומנה כשולמה» לשני האנשים. עכשיו כמו «שילמתי»: כרטיס עם בחירה,
    # כל המקושרים מושהים עד השיוך; בשיוך ההבטחה נרשמת ללקוח שנבחר בלבד, והשאר חוזרים למסלול הרגיל.
    SHARED_PROMISE = "shared_contact_promise"
    # מבקר 234א🟡 (מנהל 398): «אפשר בשלושה תשלומים?» מכתובת משותפת בלי שיוך ⇒ היה shared_contact_ambiguous בלי השהיה
    # ובלי שיוך ⇒ למחרת «טרם סומנה כשולמה» לשניהם, אף שבפנייה ישירה plan_request עוצר. עכשיו כמו ההבטחה (233):
    # כרטיס עם בחירה, כל המקושרים מושהים עד השיוך; בשיוך הצעת ההסדר נבנית ללקוח שנבחר בלבד.
    SHARED_PLAN = "shared_contact_plan_request"
    SHARED_CARDS = (SHARED_URGENT, SHARED_PAID, SHARED_PROMISE, SHARED_PLAN)

    def _shared_urgent_card(self, channel: str, sender: str, text: str, linked: list, intent: str,
                            found: set, now, card: str = SHARED_URGENT) -> dict:
        """החלטת ראש הצוות לנושא 5 (18.11.2026): פנייה דחופה מכתובת/מספר המשותפים לכמה לקוחות ⇒ דחופה בכל מקרה,
        כרטיס בעל עסק אחד עם כל הלקוחות המקושרים, בלי שיוך אוטומטי (גם אם אחד קיבל את ההודעה האחרונה) ובלי
        תשובה ללקוח עד שבעל העסק בוחר (`assign_shared_card`). לא-דחוף ⇒ כמו קודם (סבב 27)."""
        ids = [c["id"] for c in linked]
        # הסרה / מספר שגוי ⇒ רשימת ההסרה לפי הכתובת (חל על כולם; זה לא שיוך — זו הכתובת עצמה)
        if {Intent.OPT_OUT, Intent.WRONG_PERSON} & found:
            self.svc.suppress(channel, sender, "shared_contact_opt_out")
        if Intent.WRONG_PERSON in found:
            # מבקר סבב 163: הקישורים שנשלחו לכתובת המשותפת — אצל מי שאומר שאינו האדם ⇒ מבוטלים לכל המקושרים
            for c in linked:
                self.svc.revoke_short_codes(c["id"], "shared_contact_wrong_person")
        if Intent.OPT_OUT in found:
            # review חור 1 (הכרעה שמרנית קודמת, נשמרת): «הסר» מכתובת משותפת ⇒ כל הערוצים של כל המקושרים
            # נעצרים. זו לא שיוך — עוצרים את כולם; בעל העסק יכול לחדש את מי שלא ביקש
            # מנהל 366 (מבקר 210🟡): מי הוסר **בגלל הכרטיס הזה** (לא היה מוסר קודם) — כדי שבשיוך הלקוח שנבחר יקבל
            # אישור הסרה כמו בפנייה ישירה (אחרת `_context` רואה opted_out ⇒ OPTED_OUT ⇒ «הסר» חוזר בלי תשובה).
            newly = [c["id"] for c in linked if not c["opted_out"]]
            for c in linked:
                self.svc._opt_out(c["id"], "shared_contact_opt_out")
        # עד שבעל העסק בוחר: אף לקוח מקושר לא מקבל תזכורת או תשובה בכתובת הזו
        for c in linked:
            if not c["paused_reason"]:
                self.db.x("UPDATE customers SET paused_reason=? WHERE id=?", (card, c["id"]))
            for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (c["id"],)):
                self.svc._cancel_invoice(inv["id"], card)
        # מבנה ה-payload נקרא ב-web (notices.ts: linked_customers[].name, stopped_approved) — לא לשנות שמות שדות
        info = {"linked_customers": [{"id": c["id"], "name": c["name"]} for c in linked], "urgent": intent}
        if Intent.OPT_OUT in found and Intent.WRONG_PERSON not in found and newly:
            info["opted_out_by_card"] = newly
        mid = self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,payload,"
                        "created_at) VALUES(NULL,'in',?,?,?,1,?,?)",
                        (channel, text, card, json.dumps(info, ensure_ascii=False), _iso(now)))
        if card == self.SHARED_URGENT:
            # מנהל 361 (ביקורת 207🔴): «אני בן 15» / «אבא נפטר» / עו״ד מכתובת משותפת עוקף את handle_customer ⇒
            # תשובה שבעל העסק אישר לאחד המקושרים וממתינה לחלון (קישור תשלום) יצאה ב-dispatch, אף שהכרטיס מבטיח
            # «בלי תשובה ללקוח עד שבעל העסק בוחר». עכשיו נעצרות לכל המקושרים, כמו בפנייה ישירה (360).
            stopped_ids = {str(c["id"]): self._stop_approved_ids(c["id"], intent, pause=card, shared_card=mid)
                           for c in linked}
            stopped = sum(len(v) for v in stopped_ids.values())
            if stopped:
                info["stopped_approved"] = stopped
                # מנהל 364 (מבקר 209🟡): מי נעצר — כדי להחזיר לתור בשיוך את מי שההודעה לא שלו
                info["stopped_drafts"] = {k: v for k, v in stopped_ids.items() if v}
                self.db.x("UPDATE messages SET payload=? WHERE id=?", (json.dumps(info, ensure_ascii=False), mid))
        self._register_unlinked_dsr(mid, channel, text, found, info)
        self.svc.audit("customer", card, {"message": mid, "customers": ids, "intent": intent})
        urgent = card == self.SHARED_URGENT
        if urgent:   # «שילמתי» אינו דחוף — אין מייל מחוץ לאפליקציה (throttle הדחופים נשמר לדחופים)
            self.svc.email_owner_urgent(intent, unmatched="shared")
        return {"intent": card, "detected": intent, "escalate": True,
                "escalation": "urgent" if urgent else "normal", "draft_id": None, "auto_reply": None, "plan_id": None,
                "card_id": mid, "linked_customers": ids}

    def _register_unlinked_dsr(self, mid: int, channel: str, text: str, found: set, info: dict) -> None:
        """מנהל 319 (critic 171ב): בקשת עיון/תיקון/מחיקה מכתובת של כמה לקוחות ⇒ נרשמת **עם קבלתה** (בלי לקוח),
        כדי שהמועד החוקי (30 יום) ירוץ ויוצג מהיום הראשון. בשיוך (`assign_shared_card`) הבקשה מקושרת ללקוח
        שנבחר. «מספר שגוי» ⇒ זר, לא נרשם (כמו בפנייה ישירה). המזהים נשמרים ב-payload (`dsr_ids`)."""
        if Intent.WRONG_PERSON in found:
            return
        from . import dsr
        ids = [rid for kind in dsr.detect(text)
               if (rid := dsr.open_request(self.svc, None, kind, channel,
                                           note=f"מכתובת של כמה לקוחות — כרטיס #{mid}; לשייך מהכרטיס")) is not None]
        if ids:
            info["dsr_ids"] = ids
            self.db.x("UPDATE messages SET payload=? WHERE id=?", (json.dumps(info, ensure_ascii=False), mid))

    def _link_card_dsr(self, info: dict, customer_id: int, actor: str) -> list[int]:
        """בקשות שנרשמו עם קבלת הכרטיס ⇒ משויכות ללקוח שנבחר (המועד נשמר מיום הקבלה). אם ללקוח כבר יש בקשה
        פתוחה מאותו סוג — לא יוצרים כפולה; הבקשה נשארת במרשם בלי לקוח, לסגירה עם תיעוד."""
        from . import dsr
        dsr.ensure_schema(self.db)
        linked: list[int] = []
        for rid in info.get("dsr_ids") or []:
            r = self.db.one("SELECT kind FROM dsr WHERE id=? AND customer_id IS NULL AND status='open'", (rid,))
            if r and not self.db.one("SELECT 1 FROM dsr WHERE customer_id=? AND kind=? AND status='open'",
                                     (customer_id, r["kind"])):
                self.db.x("UPDATE dsr SET customer_id=? WHERE id=?", (customer_id, rid))
                self.svc.audit(actor, "dsr_linked", {"dsr": rid, "customer": customer_id})
                linked.append(rid)
        return linked

    def _already_handled_he(self, card_id: int) -> str:
        """מנהל 454 (מבקר 275/276ℹ️): «הכרטיס כבר טופל» + מי שייך ולמי, ומתי — מהשיוך האחרון ביומן."""
        row = self.db.one("SELECT at, actor, detail FROM audit WHERE action='shared_contact_assigned' "
                          "AND json_extract(detail,'$.card')=? ORDER BY id DESC LIMIT 1", (card_id,))
        base = "הכרטיס כבר טופל"
        if row:
            cid = json.loads(row["detail"] or "{}").get("customer")
            if cid is None:
                base += " («אף אחד מהם»)"
            else:
                c = self.db.one("SELECT name FROM customers WHERE id=?", (cid,))
                if c and (c["name"] or "").strip():
                    base += f" (שויך ל{c['name'].strip()})"
        return self.svc.already_decided_he(base, row)

    def assign_shared_card(self, card_id: int, customer_id: int | None, actor: str = "owner") -> dict:
        """בעל העסק בחר למי ההודעה שייכת (או None = «אף אחד מהם»). רק אז המנוע מטפל בה כרגיל עבור הלקוח
        הנבחר (השפעות + טיוטה לאישור); שאר הלקוחות המקושרים משתחררים מההשהיה של הכרטיס הזה."""
        m = self.db.one("SELECT * FROM messages WHERE id=? AND intent IN (SELECT value FROM json_each(?))",
                        (card_id, json.dumps(self.SHARED_CARDS)))
        if m is None:
            raise KeyError(card_id)
        if not m["needs_owner"]:
            raise ValueError(self._already_handled_he(card_id))
        info = json.loads(m["payload"] or "{}")
        ids = [x["id"] for x in info.get("linked_customers", [])]
        if customer_id is not None and customer_id not in ids:
            raise ValueError("הלקוח לא מקושר לכתובת הזו")
        gone_he = "הלקוח הזה כבר לא קיים במערכת — בחרו לקוח אחר או «אף אחד מהם»"
        # מנהל 461: «לא קיים» = נמחק **או הותמם** (ר-10 לא מוחק שורה — purged_at). היה `cust is None` בלבד ⇒ שיוך
        # ללקוח מותמם רשם מחדש את גוף ההודעה (PII) תחת הלקוח המותמם ויצר טיוטה לכתובת NULL.
        live_sql = "SELECT * FROM customers WHERE id=? AND purged_at IS NULL"
        cust = self.db.one(live_sql, (customer_id,)) if customer_id is not None else None
        if customer_id is not None and cust is None:
            # critic סבב 150: נמחק בינתיים (purge) — היה TypeError/500 אחרי שהכרטיס כבר נסגר וההשהיות שוחררו
            raise ValueError(gone_he)
        # מבקר 276ב🟡: תפיסה אטומית. היה `WHERE id=?` אחרי בדיקת needs_owner ⇒ עובדת a ⇒ דויד ‖ עובדת b ⇒ שרה:
        # שני השיוכים הצליחו, «שילמתי» נרשם לשני הלקוחות (שניהם מושהים) ושתי טיוטות לאותו טלפון.
        marker = (self.db.one("SELECT MAX(id) AS m FROM messages") or {"m": 0})["m"] or 0
        # מנהל 455 (מבקר 279א🟡): התפיסה, שחרור ההשהיות ושיוך בקשות העיון/מחיקה — טרנזקציה אחת, ואיתם «רשומת
        # תפיסה» בכרטיס (assign_claim: מי/מתי/מה שוחרר). כך גם קריסה קשה (SIGKILL/OOM) באמצע handle_customer
        # ניתנת לשחזור: _recover_stuck_assigns מוצא תפיסה שלא הושלמה ומפעיל את אותו פיצוי.
        linked: list[int] = []
        with self.db.batch():
            if not self.db.update("UPDATE messages SET needs_owner=0 WHERE id=? AND needs_owner=1", (card_id,)):
                raise ValueError(self._already_handled_he(card_id))
            if customer_id is not None:
                # מנהל 461 (check-then-update): התממה/מחיקה בין הבדיקה למעלה לתפיסה ⇒ בודקים שוב בתוך הטרנזקציה;
                # הזריקה מגלגלת אחורה גם את התפיסה ⇒ הכרטיס נשאר ב«דורש טיפול» וההשהיות לא זזות.
                cust = self.db.one(live_sql, (customer_id,))
                if cust is None:
                    raise ValueError(gone_he)
            released = [cid for cid in ids
                        if self.db.update("UPDATE customers SET paused_reason=NULL WHERE id=? AND paused_reason=?",
                                          (cid, m["intent"]))]
            self.svc.audit(actor, "shared_contact_assigned", {"card": card_id, "customer": customer_id})
            if customer_id is not None:
                linked = self._link_card_dsr(info, customer_id, actor)
                self._set_assign_claim(card_id, {"customer": customer_id, "marker": marker, "released": released,
                                                 "linked": linked, "actor": actor,
                                                 "at": _iso(self.svc.clock())})
        if customer_id is None:
            requeued = self._requeue_stopped_for_others(info, card_id, customer_id, actor)
            self._mark_released_nobody(m, info, card_id, actor)
            return {"card_id": card_id, "assigned": None, "requeued_drafts": requeued}
        try:
            # critic 171ב: המועד החוקי לבקשת עיון/מחיקה נספר מקבלת ההודעה המקורית, לא מיום השיוך
            if customer_id in (info.get("opted_out_by_card") or []):
                # מנהל 366 (מבקר 210🟡): ההסרה נעשתה ע״י הכרטיס עצמו, לא בבקשה קודמת ⇒ המנוע מטפל ב«הסר» כבקשה
                # ראשונה (טיוטת «הבקשה התקבלה…» לאישור), כמו בפנייה ישירה. ההסרה עצמה נשארת (_apply_effects מחיל שוב).
                cust = {**dict(cust), "opted_out": 0}
            res = self.handle_customer(cust, m["channel"], m["body"], received_at=_parse_iso(m["created_at"]))
        except BaseException as e:   # מנהל 455 (מבקר 279א): גם KeyboardInterrupt/SystemExit (כיבוי בפריסה)
            self._undo_failed_assign(m, card_id, customer_id, marker, released, linked, actor, e)
            raise
        self._set_assign_claim(card_id, None)
        # מנהל 453: אחרי שהלקוח הנבחר טופל (היה לפני — כשל ב-handle_customer השאיר טיוטות של האחרים בתור)
        requeued = self._requeue_stopped_for_others(info, card_id, customer_id, actor)
        if info.get("email_verified") is False and res.get("draft_id"):
            # critic סבב 169: האזהרה עוברת מהכרטיס לטיוטה שנוצרה אחרי השיוך (אחרת נעלמת ברגע הבחירה)
            self.db.x("UPDATE drafts SET owner_summary=COALESCE(owner_summary,'') || ? WHERE id=?",
                      (UNVERIFIED_EMAIL_NOTE, res["draft_id"]))
        return {"card_id": card_id, "assigned": customer_id, **res, "requeued_drafts": requeued}

    def _undo_failed_assign(self, m, card_id: int, customer_id: int, marker: int, released: list[int],
                            linked: list[int], actor: str, err: BaseException | str) -> None:
        """מנהל 453 (מבקר 278🟡): מאז 451 הכרטיס נתפס וההשהיות משתחררות **לפני** handle_customer. חריגה שם ⇒
        הכרטיס «טופל», אף לקוח לא מושהה, «שילמתי» לא נרשם, ניסיון חוזר ⇒ «כבר טופל», ולמחרת תזכורות לכולם.
        כשל **לפני** שההודעה נרשמה ללקוח (אין השפעות) ⇒ הכרטיס חוזר ל«דורש טיפול», ההשהיות חוזרות (רק למי
        ששוחרר כאן ולא קיבל השהיה אחרת בינתיים), ובקשות העיון/מחיקה חוזרות לכרטיס. ההודעה כבר נרשמה ⇒ ההשפעות
        (חלקן) כבר חלו — לא פותחים שוב (שיוך שני = טיפול כפול), רק מתעדים לבדיקה."""
        err_name = err if isinstance(err, str) else type(err).__name__
        with self.db.batch():
            self._set_assign_claim(card_id, None)
            recorded = self.db.one("SELECT 1 FROM messages WHERE id>? AND customer_id=? AND direction='in'",
                                   (marker, customer_id))
            if recorded:
                self.svc.audit("system", "shared_assign_failed_after_effects",
                               {"card": card_id, "customer": customer_id, "error": err_name})
                return
            self.db.x("UPDATE messages SET needs_owner=1 WHERE id=?", (card_id,))
            for cid in released:
                self.db.x("UPDATE customers SET paused_reason=? WHERE id=? AND paused_reason IS NULL",
                          (m["intent"], cid))
            for rid in linked:
                self.db.x("UPDATE dsr SET customer_id=NULL WHERE id=? AND customer_id=?", (rid, customer_id))
            self.svc.audit(actor, "shared_assign_rolled_back",
                           {"card": card_id, "customer": customer_id, "error": err_name})

    def _set_assign_claim(self, card_id: int, claim: dict | None) -> None:
        """רשומת התפיסה בתוך payload של הכרטיס (בלי שינוי סכמה). None ⇒ השיוך הושלם / פוצה."""
        if claim is None:
            self.db.x("UPDATE messages SET payload=json_remove(payload,'$.assign_claim') WHERE id=? "
                      "AND json_valid(payload) AND json_extract(payload,'$.assign_claim') IS NOT NULL", (card_id,))
        else:
            self.db.x("UPDATE messages SET payload=json_set(CASE WHEN json_valid(payload) THEN payload ELSE '{}' "
                      "END,'$.assign_claim',json(?)) WHERE id=?", (json.dumps(claim), card_id))

    def _recover_stuck_assigns(self) -> int:
        """מנהל 455 (מבקר 279א🟡): שיוך כרטיס משותף שנתפס ולא הושלם תוך CLAIM_STALE = התהליך נהרג באמצע
        handle_customer (SIGKILL / OOM — שם שום except לא רץ). אותו פיצוי כמו בכשל רגיל: ההודעה לא נרשמה ⇒ הכרטיס
        חוזר ל«דורש טיפול» וההשהיות חוזרות; נרשמה ⇒ לא נפתח שוב, רק audit לבדיקה. מחזיר כמה טופלו."""
        cutoff = _iso(self.svc.clock() - self.svc.CLAIM_STALE)
        n = 0
        for r in self.db.q("SELECT * FROM messages WHERE needs_owner=0 AND payload LIKE '%assign_claim%' "
                           "AND json_valid(payload) AND json_extract(payload,'$.assign_claim.at')<=?", (cutoff,)):
            claim = json.loads(r["payload"])["assign_claim"]
            self._undo_failed_assign(r, r["id"], claim["customer"], claim.get("marker") or 0,
                                     list(claim.get("released") or []), list(claim.get("linked") or []),
                                     claim.get("actor") or "owner", "interrupted")
            n += 1
        return n

    # מנהל 365 (ממצא «גבייה סוכן» 21.11, fuzz זרע 89): קטין / מצוקה / משפטי מכתובת משותפת ⇒ «אף אחד מהם» משחרר
    # את ההשהיה, והתזכורת הבאה לאותו טלפון נבנתה בלי שום סימן במסך האישור. ההכרעה אם לחסום נשארת לבעלים
    # (team/findings-gvia-sochen.md, אפשרות 1); כאן רק אפשרות 2 — סימון גלוי בתצוגה המקדימה של כל תזכורת למקושרים.
    RELEASED_WARN_INTENTS = ("minor", "distress", "legal")

    def _mark_released_nobody(self, m, info: dict, card_id: int, actor: str) -> None:
        if m["intent"] != self.SHARED_URGENT or info.get("urgent") not in self.RELEASED_WARN_INTENTS:
            return
        info["released_nobody"] = _iso(self.svc.clock())
        self.db.x("UPDATE messages SET payload=? WHERE id=?", (json.dumps(info, ensure_ascii=False), card_id))
        self.svc.audit(actor, "shared_released_nobody_flagged", {"card": card_id, "urgent": info.get("urgent")})

    def released_nobody_warning(self, customer_id: int) -> dict | None:
        """הכרטיס האחרון שבו קטין/מצוקה/משפטי הגיע מכתובת משותפת ללקוח הזה ובעל העסק בחר «אף אחד מהם»."""
        for r in self.db.q("SELECT id, channel, payload, created_at FROM messages WHERE intent=? AND needs_owner=0 "
                           "AND payload LIKE '%released_nobody%' ORDER BY id DESC", (self.SHARED_URGENT,)):
            try:
                info = json.loads(r["payload"] or "{}")
            except ValueError:
                continue
            if not info.get("released_nobody") or info.get("urgent") not in self.RELEASED_WARN_INTENTS:
                continue
            if customer_id in {x.get("id") for x in info.get("linked_customers", [])}:
                return {"card_id": r["id"], "urgent": info["urgent"], "channel": r["channel"],
                        "received_at": r["created_at"], "released_at": info["released_nobody"]}
        return None

    REQUEUE_NOTE = (" · התשובה אושרה קודם ונעצרה בגלל הודעה דחופה מכתובת משותפת; בעל העסק שייך את ההודעה "
                    "ללקוח/ה אחר/ת — לבדוק ולאשר מחדש")

    def _requeue_stopped_for_others(self, info: dict, card_id: int, chosen: int | None, actor: str) -> list[int]:
        """מנהל 364 (מבקר 209🟡): כרטיס דחוף מכתובת משותפת עוצר approved של **כל** המקושרים (361). בשיוך —
        ההודעה לא של מי שלא נבחר (או של אף אחד), ולכן התשובות שנעצרו בגללה חוזרות לתור **לאישור מחדש**
        (pending_approval, לא נשלחות לבד). לא חוזרות: לקוח שהוסר / עדיין בהשהיה, טיוטה שכבר הוכרעה אחרת,
        או כשבינתיים נוצרה ללקוח טיוטה חדשה (היא מחליפה)."""
        out: list[int] = []
        for key, dids in (info.get("stopped_drafts") or {}).items():
            cid = int(key)
            if cid == chosen:
                continue
            c = self.db.one("SELECT opted_out, paused_reason FROM customers WHERE id=?", (cid,))
            if c is None or c["opted_out"] or c["paused_reason"]:
                continue
            for did in dids:
                newer = self.db.one("SELECT 1 FROM drafts WHERE customer_id=? AND id>? AND status IN "
                                    "('pending_approval','needs_owner','approved')", (cid, did))
                if newer:
                    continue
                n = self.db.update("UPDATE drafts SET status='pending_approval', decided_by=NULL, decided_at=NULL, "
                              "owner_summary=COALESCE(owner_summary,'') || ? WHERE id=? AND status='superseded' "
                              "AND decided_by='system:protective_reply'", (self.REQUEUE_NOTE, did))
                if n:
                    out.append(did)
        if out:
            self.svc.audit(actor, "stopped_drafts_requeued", {"card": card_id, "drafts": out, "chosen": chosen})
        return out

    # ---------- קלט ----------
    def handle(self, channel: str, sender: str, text: str) -> dict:
        if channel not in ("sms", "email"):
            raise ValueError("ערוץ לא נתמך")
        now = self.svc.clock()
        cust, ambiguous = self.svc._resolve_sender(channel, sender)
        # החלטת ראש צוות (סבב ביקורת, נושא 5): הודעה **דחופה** מכתובת שמשותפת לכמה לקוחות ⇒ תמיד דחופה,
        # כרטיס בעל עסק **אחד** עם כל הלקוחות המקושרים, בלי שיוך אוטומטי (גם אם אפשר היה לנחש לפי ההודעה
        # היוצאת האחרונה) ובלי תשובה ללקוח עד שבעל העסק בוחר (assign_shared_card).
        linked = self.svc._find_customers(channel, sender)
        found = set(detect(text)) if len(linked) > 1 else set()
        shared_urgent = next((i.value for i in _SHARED_URGENT if i in found), None)
        if shared_urgent:
            return self._shared_urgent_card(channel, sender, text, linked, shared_urgent, found, now)
        if cust is None and ambiguous and Intent.PAID_CLAIM in found:
            return self._shared_urgent_card(channel, sender, text, linked, Intent.PAID_CLAIM.value, found, now,
                                            card=self.SHARED_PAID)
        if cust is None and ambiguous and Intent.PROMISE in found:
            return self._shared_urgent_card(channel, sender, text, linked, Intent.PROMISE.value, found, now,
                                            card=self.SHARED_PROMISE)
        if cust is None and ambiguous and Intent.PLAN_REQUEST in found:
            return self._shared_urgent_card(channel, sender, text, linked, Intent.PLAN_REQUEST.value, found, now,
                                            card=self.SHARED_PLAN)
        if cust is None and ambiguous:
            # critic סבב 27: כתובת של כמה לקוחות ואף אחד מהם לא קיבל הודעה ⇒ לא משייכים ולא מנסחים
            # (אין טיוטה עם חוב של אדם אחר). «הסר» ⇒ רשימת ההסרה לפי הכתובת ⇒ חל על כולם.
            if {Intent.OPT_OUT, Intent.WRONG_PERSON} & set(detect(text)):
                self.svc.suppress(channel, sender, "shared_contact_opt_out")
            mid = self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                            "created_at) VALUES(NULL,'in',?,?, 'shared_contact_ambiguous', 1, ?)",
                            (channel, text, _iso(now)))
            # מנהל 319: «מה המידע שיש לכם עליי» מכתובת משותפת לא נרשם כלל (לא דחוף ⇒ לא כרטיס שיוך). עכשיו במרשם.
            self._register_unlinked_dsr(mid, channel, text, set(detect(text)), {})
            return {"intent": "shared_contact_ambiguous", "escalate": True, "escalation": "normal",
                    "draft_id": None, "auto_reply": None, "plan_id": None}
        if cust is None:
            found = set(detect(text))
            # מבקר סבב 3: «הסר» ממספר/כתובת שעוד לא ב-DB ⇒ רשימת ההסרה (גם ללקוח עתידי)
            if Intent.OPT_OUT in found:
                self.svc.suppress(channel, sender, "unknown_sender_opt_out")
            # critic סבב 126: מצוקה/קטין/משפטי/מחלוקת משולח לא משויך (בן זוג, מייל מהעבודה) ⇒ דחוף + מייל לבעלים
            urgent = next((i.value for i in (Intent.DISTRESS, Intent.MINOR, Intent.LEGAL, Intent.DISPUTE)
                           if i in found), None)
            # לא חושפים כלום לשולח לא מזוהה; רק לבעל העסק
            self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                      "created_at) VALUES(NULL,'in',?,?,?, 1, ?)",
                      # critic סבב 127: דחופה מסומנת בנפרד ⇒ /app/ מציג אותה ראשונה ומסומנת
                      (channel, text, "unknown_sender_urgent" if urgent else "unknown_sender", _iso(now)))
            if urgent:
                self.svc.email_owner_urgent(urgent, unmatched=True)
            return {"intent": "unknown_sender", "escalate": True, "escalation": "urgent" if urgent else "normal",
                    "draft_id": None, "auto_reply": None, "plan_id": None}
        return self.handle_customer(cust, channel, text)

    def handle_customer(self, cust, channel: str, text: str, received_at: datetime | None = None) -> dict:
        """channel: sms / email / web (פעולה בעמוד הקישור הקצר — בלי טיוטת תשובה)."""
        now = self.svc.clock()
        self.release_expired_pauses()
        web = channel == "web"
        ctx = self._context(cust, "sms" if web else channel)
        d = respond(text, ctx, llm=self.llm)
        if (not web and ctx.state == State.OPTED_OUT and d.intent == Intent.OPT_OUT
                and self.svc._inherited_optout(cust["id"])):
            # מנהל 433 (מבקר 262🟡): ההסרה עברה בקובץ מלקוח קודם (239) — «הסר» של הלקוח עצמו הוא הבקשה **הראשונה**
            # שלו ⇒ כמו 366: המנוע מטפל בה כבקשה ראשונה (טיוטת «הבקשה התקבלה…»), וההסרה נרשמת על שמו
            # (_apply_effects ⇒ _opt_out). רק לכוונת הסרה — הודעה אחרת נשארת במסלול 239 (כרטיס, בלי תשובה).
            cust = {**dict(cust), "opted_out": 0}
            ctx = self._context(cust, channel)
            d = respond(text, ctx, llm=self.llm)
        if web:
            d = replace(d, reply=None, auto_send=False)
        d = self._hold_reply_if_opted_out(cust, channel, d)
        if ctx.manual_old and d.auto_send:
            # critic סבב 23 (ר-7): חשבונית מעל 3 שנים ⇒ שום תשובה לא יוצאת בלי אישור פרטני
            d = replace(d, auto_send=False, tags=d.tags + ("manual_only_old",),
                        owner_actions=d.owner_actions + ("יש חשבונית בת יותר מ-3 שנים — לאשר ידנית",))
        if d.plan:
            row = self.db.one("SELECT paused_reason, disputed FROM customers WHERE id=?", (cust["id"],))
            base = ((row["paused_reason"] if row else "") or "").split(":", 1)[0]
            if base in _HARD_PAUSES or (row and row["disputed"]):
                # qa19 (q19-06 🔴): «אני בן 14» ⇒ קטין דחוף, ואחריו «אפשר לשלם בתשלומים?» ⇒ המנוע (שלא מכיר את ההשהיה)
                # הציע הסדר ונוצר הסדר לקטין. השהיה קשה (קטין/פטירה/חדלות/מצוקה/עו״ד/מחלוקת) ⇒ אין הסדר ואין הצעה —
                # כרטיס לבעל העסק בלבד.
                d = replace(d, plan=(), reply=None, auto_send=False, next_state=State.AWAITING_OWNER,
                            escalate=max(d.escalate, Escalation.NORMAL, key=lambda e: _ESC_ORDER.index(e)),
                            tags=d.tags + ("plan_held_protected",),
                            owner_actions=d.owner_actions + (
                                f"בקשת פריסה בזמן השהיה ({base or 'מחלוקת'}) — לא הוצע הסדר; לבדוק לפני כל הצעה",))
        # critic 165: «מספר שגוי» כוונה **משנית** (ליד הסרה/גיל) ⇒ סימון צד-שלישי ב-payload, כדי שייצוא בקשת
        # העיון (customer_data_export) לא ימסור ללקוחה את תוכן ההודעה של הזר. ה-intent הראשי לא משתנה.
        third = Intent.WRONG_PERSON in d.all_intents
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "payload,created_at) VALUES(?,'in',?,?,?,?,?,?)",
                  (cust["id"], channel, text, d.intent.value,
                   int(d.escalate != Escalation.NONE), compliance.THIRD_PARTY_PAYLOAD if third else None, _iso(now)))
        plan_id = self._apply_effects(cust, d, prior=ctx.state)
        if not third:   # בקשה לפי חוק הגנת הפרטיות §13–14 ⇒ מרשם + מועד 30 יום (app/dsr.py). זר — לא
            from . import dsr
            for kind in dsr.detect(text):
                dsr.open_request(self.svc, cust["id"], kind, channel, received_at=received_at)
        stopped = self._stop_approved_on_protective(cust["id"], d)
        if stopped:
            one = stopped == 1
            d = replace(d, owner_actions=d.owner_actions + (
                f"עצרנו {'תשובה שאישרת' if one else f'{stopped} תשובות שאישרת'} קודם ועוד לא יצא"
                f"{'ה' if one else 'ו'} (ממתינ{'ה' if one else 'ות'} לחלון השליחה) — לא תישלח אחרי ההודעה הזו",))
        if Intent.PAID_CLAIM in d.all_intents:
            d = self._paid_claim_moved_note(cust["id"], d)
        elif {Intent.PLAN_REQUEST, Intent.PROMISE, Intent.DISPUTE} & set(d.all_intents):
            d = self._moved_invoice_note(cust["id"], d)   # מבקר 234ב
        if d.intent == Intent.PLAN_ACCEPT:
            # מבקר 235א/ב (מנהל 399) — הסדר שאושר; סט #26 (q26-17/18, גבי מנוע): גם «מאשר» על הצעה שעוד proposed
            d = self._plan_accept_file_check(cust, d)
        draft_id = None
        if d.reply or d.escalate != Escalation.NONE:
            # בלי טיוטה (למשל עו"ד) ⇒ כרטיס "דרוש טיפול" בתור, שבעל העסק יכול לענות ממנו בעצמו
            draft_id = self._draft(cust, channel, d, plan_id)
        if getattr(self, "_wrong_number", False):
            # ר-3: מספר שגוי ⇒ מוחקים את השדה מהלקוח (התנצלות, אם תאושר, הולכת לכתובת שנשמרה בטיוטה)
            # שומרים את הערך שנחסם, כדי שסנכרון מחשבונית ירוקה (שם הוא עדיין רשום) לא יחזיר אותו.
            # SQL קבוע לכל ערוץ (בלי f-string — שער האבטחה test_no_dynamic_sql)
            sql = ("UPDATE customers SET blocked_email=email, email=NULL WHERE id=?"
                   if channel == "email" else
                   "UPDATE customers SET blocked_phone=phone, phone=NULL WHERE id=?")
            self.db.x(sql, (cust["id"],))
            # מבקר סבב 163: הקישור /p/ שנשלח למספר השגוי — אצל זר ⇒ מבוטל
            self.svc.revoke_short_codes(cust["id"], "wrong_number")
            self._wrong_number = False
        self._save_state(cust["id"], d, bump_turn=bool(d.reply))
        # מבקר סבב 99: כרטיס דחוף לא הודיע לבעלים מחוץ לאפליקציה ⇒ מייל קצר (בלי טקסט הלקוח, עם throttle)
        if d.escalate == Escalation.URGENT or d.intent.value in _URGENT_OWNER_ALERT:
            self.svc.email_owner_urgent(_alert_kind(d), auto_replied=bool(d.auto_send and d.reply))
        self.svc.audit("customer", "conversation", {
            "customer": cust["id"], "intent": d.intent.value,
            "secondary": [i.value for i in d.secondary], "escalate": d.escalate.value,
            "stop": d.stop.value, "draft": draft_id})
        sent = None
        if draft_id and d.auto_send and _protected(self.db.one(
                "SELECT paused_reason, disputed FROM customers WHERE id=?", (cust["id"],))):
            # critic סבב 153: המנוע קובע auto_send לפי ההודעה הנוכחית בלבד ⇒ אחרי «אני בן 14» / «אני רוצה למות» /
            # עו״ד / מחלוקת (או «שילמתי»), «איך משלמים?» הוציא קישור תשלום אוטומטית. לקוח מושהה-מגן ⇒ טיוטה בלבד.
            self.svc.audit("system", "safe_auto_held", {"customer": cust["id"], "draft": draft_id})
        elif draft_id and d.auto_send:
            sent = self.approve_draft(draft_id, actor="system:safe_auto")
        auto = bool(sent and sent.get("status") == "sent_dry_run")
        return {"intent": d.intent.value, "secondary": [i.value for i in d.secondary],
                "escalate": d.escalate != Escalation.NONE, "escalation": d.escalate.value,
                "stop": d.stop.value, "auto_reply": sent["body"] if auto else None,
                "pause_until": d.pause_until.isoformat() if d.pause_until else None,
                "draft_id": draft_id, "plan_id": plan_id, "owner_summary": d.owner_summary,
                "owner_actions": list(d.owner_actions), "tags": list(d.tags),
                "auto_sent": auto}

    def _context(self, cust, channel: str) -> Context:
        invs = self.db.q("SELECT * FROM invoices WHERE customer_id=? AND status='open' "
                         "ORDER BY due", (cust["id"],))
        link = (self.svc._payment_link(invs[0]) if invs else None) or ""
        conv = self.db.one("SELECT * FROM conversations WHERE customer_id=?", (cust["id"],))
        state = State(conv["state"]) if conv else State.IDLE
        if cust["opted_out"]:
            state = State.OPTED_OUT
        offered: tuple[Installment, ...] = ()
        if conv and conv["offered_plan"]:
            offered = tuple(Installment(i["n"], date.fromisoformat(i["due"]), i["amount_agorot"])
                            for i in json.loads(conv["offered_plan"]))
        return Context(
            today=self.svc.clock().date(), business=self.svc.s.business_name,
            customer_name=cust["name"] or "",
            invoices=tuple(OpenInvoice(r["number"], r["amount_agorot"], r["currency"],
                                       date.fromisoformat(r["due"]) if r["due"] else None)
                           for r in invs),
            payment_link=link, channel=channel, state=state, offered_plan=offered,
            bot_turns=conv["bot_turns"] if conv else 0, policy=self.policy,
            manual_old=any(invoice_too_old(r, self.svc.clock().date()) for r in invs),
            # critic סבב 25: מקום לשורת ההסרה (`_with_footer`, טוקן של 22 תווים) בתקציב ה-SMS
            footer_len=len("\nלהפסקה: " + self.svc.unsub_url("x" * 22)),
            # מנהל 265: ההסדר שבשיחה כבר אושר ונשלח ע״י בעל העסק ⇒ «מאשרת» של הלקוח לא מבקש אישור שני
            # מנהל 290: רק אם ההסדר **האחרון** (הפעיל) הוא המאושר. היה: «יש ללקוח הסדר approved כלשהו» ⇒ הצעה
            # מעודכנת (267/290) ליד הסדר שבתוקף, ואז «מאשרת» ⇒ plan_confirmed: «ההסדר בתוקף, התשלום הראשון…» על
            # הצעה שבעל העסק לא אישר, וכרטיס «אישר/ה את ההסדר שאישרת» על לוח שלא אושר.
            plan_approved=bool(offered) and (self.db.one(
                "SELECT status FROM plans WHERE customer_id=? AND status IN ('proposed','approving','approved') "
                "ORDER BY id DESC LIMIT 1", (cust["id"],)) or {"status": ""})["status"] == "approved")

    def _hold_reply_if_opted_out(self, cust, channel: str, d: Decision) -> Decision:
        """לקוח שכבר הוסר (או שהכתובת שלו ברשימת ההסרה): שער השליחה (`_can_message`) יחסום כל
        תשובה שאינה ב-`_ALLOWED_AFTER_OPT_OUT`. המנוע עדיין מנסח לחלק מהכוונות (שילמתי, מחלוקת,
        מצוקה) ⇒ בעל העסק קיבל טיוטה, אישר, והיא נדחתה בשקט כ-`system:opted_out`. במקום טיוטה שלא
        תצא לעולם ⇒ כרטיס «דרוש טיפול» עם הנחיה לפנות אישית (ההגבלה עצמה לא משתנה — TERMS §6)."""
        if channel == "web" or not d.reply or d.intent.value in _ALLOWED_AFTER_OPT_OUT:
            return d
        if not (cust["opted_out"] or self.svc.suppressed(channel, self._addr(cust, channel) or "")):
            return d
        esc = d.escalate if d.escalate != Escalation.NONE else Escalation.NORMAL
        return replace(d, reply=None, auto_send=False, escalate=esc,
                       tags=d.tags + ("opted_out_no_reply",),
                       owner_actions=d.owner_actions + (
                           "הלקוח/ה ביקש/ה הסרה — לא תישלח תשובה אוטומטית; לפנות אישית בלבד",))

    # ---------- השפעות מיידיות (לא מחכות לאישור — הן רק עוצרות) ----------
    def _apply_effects(self, cust, d: Decision, prior: State = State.IDLE) -> int | None:
        cid = cust["id"]
        intents = {i.value for i in d.all_intents}
        if Intent.WRONG_PERSON.value in intents:
            self.svc._opt_out(cid, "wrong_number")
            self._wrong_number = True
            if Intent.OPT_OUT.value in intents:
                # הכרעת ראש צוות 19.11: «מספר שגוי + תפסיקו» ⇒ גם בקשת ההסרה עצמה מתועדת (לא רק «מספר שגוי»)
                self.svc.audit("customer", "opt_out_request", {"customer": cid, "with": "wrong_number"})
        elif d.stop == Stop.PERMANENT:
            if Intent.OPT_OUT.value not in intents and self.svc._inherited_optout(cid):
                # מבקר 239🟡: ההסרה עברה בקובץ מלקוח קודם — הודעה שאינה בקשת הסרה לא נרשמת כבקשה שלו
                self.svc._inherited_optout_card(cid)
            else:
                self.svc._opt_out(cid, "reply")
        if intents & {Intent.DISPUTE.value, Intent.LEGAL.value}:
            self.db.x("UPDATE customers SET disputed=1 WHERE id=?", (cid,))
        if d.stop == Stop.PAUSE:
            # רק הבטחה משתחררת לבד ⇒ רק לה יש תאריך בסיבה; השאר נקי לדשבורד ("paid_claim")
            auto_release = d.intent == Intent.PROMISE and d.pause_until
            base = next((t for t in ("minor", "deceased", "insolvency", "channel_pref", "foreign_language")
                         if t in d.tags), d.intent.value)
            reason = base + (f":until={d.pause_until.isoformat()}" if auto_release else "")
            old = (self.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
                   or "")
            if not _keeps_old_pause(old, reason):
                self.db.x("UPDATE customers SET paused_reason=? WHERE id=?", (reason, cid))
            if "promise_over_limit" in d.tags and d.requested_date and d.pause_until:
                # הכרעת ראש צוות q21-19: ההבטחה התקבלה עד max_defer_days; המועד המבוקש ממתין ל«בדוק ואשר» של בעל העסק
                self.svc.audit("customer", "promise_over_limit", {
                    "customer": cid, "requested": d.requested_date.isoformat(),
                    "until": d.pause_until.isoformat()})
        if d.stop != Stop.NONE:
            for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (cid,)):
                self.svc._cancel_invoice(inv["id"], d.intent.value)
        plan_id = None
        if intents & {Intent.PLAN_ACCEPT.value, Intent.PLAN_REJECT.value}:
            self._drop_queued_plan_offers(cid, d.intent.value)
        # מנהל 275 (qa16 q16-09): הלקוח ביקש **בדיוק** את מה שהוצע («אפשר ב-3 תשלומים?» אחרי הצעת 3) ⇒ התשובה
        # «זה בדיוק מה שהצענו… מתאים?» אבל ההצעה סומנה rejected ⇒ «מאשרת» אחר כך הוביל ל-plan_pending_owner בלי
        # הסדר לאישור. בקשה זהה (plan_same) היא לא דחייה — ההצעה נשארת בתוקף.
        # מנהל 276 (qa17 q17-10): «So 400 a month for 3 months, right? Ok I'm in» ⇒ plan_accept + plan_request משני
        # (חזרה על ההצעה) ⇒ ההצעה סומנה rejected **לפני** שהאישור נקשר אליה ⇒ בעל העסק: «אין הסדר מוצע». אישור
        # הוא לעולם לא דחייה של ההצעה שהוא מאשר.
        if prior == State.AWAITING_PLAN_REPLY and "plan_same" not in d.tags and d.intent != Intent.PLAN_ACCEPT \
                and intents & {Intent.PLAN_REJECT.value, Intent.PLAN_REQUEST.value}:
            # ההצעה האחרונה כבר נשלחה (status='approved' = בעל העסק אישר לשלוח), והלקוח דחה אותה
            # או ביקש אחרת. בלי זה היא נשארה approved לנצח ⇒ `plan_active` חוסם תזכורות גם אחרי
            # שבעל העסק מחדש (critic 2.3.4). השהיית plan_reject/plan_request עצמה נשארת.
            last = self.db.one("SELECT id FROM plans WHERE customer_id=? AND status IN "
                               "('proposed','approved') ORDER BY id DESC LIMIT 1", (cid,))
            if last:
                self.db.x("UPDATE plans SET status='rejected' WHERE id=?", (last["id"],))
                self.svc.audit("customer", "plan_rejected_by_customer", {"plan": last["id"]})
                # הפעלה 211: כרטיס פתוח של ההסדר שנדחה (בדרך כלל אין — הוא כבר נשלח) נסגר
                self.svc._supersede_plan_drafts(last["id"], by="system:plan_replaced")
        if d.plan and d.intent != Intent.PLAN_ACCEPT:
            # מבקר §4.6: ההצעה (d.plan) נבנתה על כל החוב הפתוח (Context.total_agorot) ⇒ ההסדר נרשם
            # על כל החשבוניות, לא רק על הוותיקה. סה״כ לא תואם (מטבעות שונים) ⇒ לא נרשם הסדר.
            invs, total = self.svc.open_debt(cid)
            if invs and total == sum(i.amount_agorot for i in d.plan):
                # הצעה חדשה מחליפה הצעה קודמת שעוד לא אושרה
                replaced = [r["id"] for r in self.db.q(
                    "SELECT id FROM plans WHERE customer_id=? AND status='proposed'", (cid,))]
                self.db.x("UPDATE plans SET status='rejected' WHERE customer_id=? AND status='proposed'",
                          (cid,))
                # הפעלה 211: הכרטיס הפתוח של ההסדר שנדחה נסגר — אחרת בעל העסק רואה כרטיס שמצביע על
                # הסדר שאינו בתוקף (`_draft` סוגר רק pending_approval, וכרטיס פריסה הוא needs_owner)
                for old in replaced:
                    self.svc._supersede_plan_drafts(old, by="system:plan_replaced")
                plan_id = self.db.x(
                    "INSERT INTO plans(customer_id,invoice_id,installments,status,created_at,"
                    "invoice_ids) VALUES(?,?,?, 'proposed', ?, ?)",
                    (cid, invs[0]["id"], _plan_json(d.plan), _iso(self.svc.clock()),
                     json.dumps([r["id"] for r in invs])))
                # ר-12: כל הצעה מתועדת (נתפס ב-E2E של QA אחרי חיבור מנוע השיחה)
                self.svc.audit("system", "plan_proposed", {"plan": plan_id, "via": "conversation"})
        if d.intent == Intent.PLAN_ACCEPT:
            # גם הצעה שכבר נשלחה (approved): זה המסלול הרגיל — בעל העסק אישר, הלקוח השיב «מאשר».
            # היה: רק 'proposed' ⇒ plan_id=None והאישור לא נקשר לשום הסדר.
            row = self.db.one("SELECT id FROM plans WHERE customer_id=? AND status IN "
                              "('proposed','approved') ORDER BY id DESC LIMIT 1", (cid,))
            plan_id = row["id"] if row else None
            self.svc.audit("customer", "plan_accepted_by_customer", {"plan": plan_id})
        return plan_id

    def _drop_queued_plan_offers(self, cid: int, intent: str) -> None:
        """מנהל 447 (מבקר 273ב🟡): הצעת פריסה מהשיחה שבעל העסק אישר והיא ממתינה בתור (`approved` — שירות עצור /
        מחוץ לחלון / עצירת שחזור), והלקוח כבר השיב עליה («מאשר» / «לא מתאים») ⇒ ההצעה הישנה לא יוצאת אחר כך
        («השיבו מאשר» אחרי שאישר). כמו טיוטה שעוד לא אושרה (`_draft` ⇒ superseded). ההסדר עצמו לא נוגע —
        האישור נקשר אליו כרגיל ובעל העסק מכריע בכרטיס."""
        rows = self.db.q("SELECT id FROM drafts WHERE customer_id=? AND status='approved' AND "
                         "intent='plan_request'", (cid,))
        if not rows:
            return
        ids = [r["id"] for r in rows]
        for did in ids:
            self.db.x("UPDATE drafts SET status='superseded', decided_by='system:customer_replied' WHERE id=?",
                      (did,))
        self.svc.audit("system", "queued_plan_offer_dropped", {"customer": cid, "drafts": ids, "intent": intent})

    def _paid_claim_moved_note(self, cid: int, d: Decision) -> Decision:
        """מנהל 395 (מבקר 231🟡): «שילמתי» מטלפון שחשבונית עברה ממנו בקובץ CSV ללקוח אחר (219א) ⇒ ההשהיה חלה על
        הכותב/ת, והחשבונית שעברה ממשיכה אצל הלקוח הנוכחי. לא משהים אדם אחר על סמך הודעה ממספר אחר (מבודד
        לקוחות) — אבל הכרטיס אומר את האמת: «הושהו» לא חל עליה, ותזכורת עליה ממילא דורשת אישורכם."""
        moved = self.svc.moved_away_open(cid)
        if not moved:
            return d
        lines = "; ".join(f"חשבונית {r['number']} רשומה כעת על {r['name'] or 'לקוח אחר'}" for r in moved)
        one = len(moved) == 1
        note = (f" שימו לב: {lines} (פרטי הקשר השתנו בקובץ) — התזכורות עלי{'ה' if one else 'הן'} לא הושהו. "
                "בדקו את התשלום לפני שמאשרים תזכורת עלי" + ("ה." if one else "הן."))
        return replace(d, owner_summary=(d.owner_summary or "") + note,
                       owner_actions=d.owner_actions + (
                           "לבדוק אם התשלום שייך לחשבונית שעברה ללקוח אחר לפני אישור תזכורת עליה",))

    def _plan_accept_file_check(self, cust, d: Decision) -> Decision:
        """מבקר 235א/ב🟡: «מאשר» על הסדר שאושר ונשלח ⇒ טיוטת «ההסדר בתוקף. התשלום הראשון: 400 ₪» + כרטיס «נותר רק
        לשלוח» — גם כש(א) הקובץ כבר סימן את כל חשבוניות ההסדר כשולמות (plan_progress רץ רק בתכנון הבא), או
        (ב) הקובץ שינה את פרטי הקשר של חשבונית בהסדר (כרטיס csv_contact_plan פתוח: «שום הודעה לא תצא לפרטים
        הישנים») ⇒ האישור היה יוצא לטלפון הישן. עכשיו: בלי טיוטה, וכרטיס שאומר את האמת."""
        plan = self.db.one("SELECT * FROM plans WHERE customer_id=? AND status IN ('approved','proposed') "
                           "ORDER BY id DESC LIMIT 1", (cust["id"],))
        if not plan:
            return self._plan_accept_currency_check(cust, d)
        ids = self.svc._plan_invoice_ids(plan)
        rows = [r for r in (self.db.one("SELECT id, number, external_id, status FROM invoices WHERE id=?", (i,))
                            for i in ids) if r]
        if not rows:
            return d
        name = cust["name"] or "הלקוח/ה"
        nums = ", ".join(str(r["number"]) for r in rows)
        one = len(rows) == 1
        if all(r["status"] != "open" for r in rows):
            self.svc.audit("system", "plan_accept_held_closed", {"plan": plan["id"]})
            return replace(d, reply=None, auto_send=False,
                           escalate=d.escalate if d.escalate != Escalation.NONE else Escalation.NORMAL,
                           tags=d.tags + ("plan_accept_closed",),
                           owner_summary=(f"{name} אישר/ה את ההסדר, אבל לפי הקובץ האחרון "
                                          f"{'חשבונית ' + nums + ' סומנה' if one else 'החשבוניות ' + nums + ' סומנו'}"
                                          " כשולמ" + ("ה" if one else "ות") + ". לא נוסחה הודעה על תשלום ראשון."),
                           owner_actions=("לבדוק בבנק/בסליקה ולסגור את ההסדר ב«הסדרים» אם הכול שולם",))
        cards = [r for r in rows if r["external_id"] and self.db.one(
            "SELECT 1 FROM messages WHERE intent='csv_contact_plan' AND needs_owner=1 AND message_id=?",
            (f"csv_contact_plan:{r['external_id']}",))]
        if cards:
            cn = ", ".join(str(r["number"]) for r in cards)
            self.svc.audit("system", "plan_accept_held_contact_changed", {"plan": plan["id"]})
            return replace(d, reply=None, auto_send=False,
                           escalate=d.escalate if d.escalate != Escalation.NONE else Escalation.NORMAL,
                           tags=d.tags + ("plan_accept_contact_changed",),
                           owner_summary=(f"{name} אישר/ה את ההסדר, אבל בקובץ האחרון פרטי הקשר של חשבונית {cn} "
                                          "השתנו. לא נוסחה הודעה — שום הודעה לא תצא לפרטים הישנים עד שתבדקו."),
                           owner_actions=("לעדכן את הטלפון/המייל בכרטיס הלקוח ולפנות אישית לגבי ההסדר",))
        return d

    def _plan_accept_currency_check(self, cust, d: Decision) -> Decision:
        """מנהל 411 (מבקר 245🟡): «מאשר» על הצעת פריסה שהוחלפה כי המקור שינה את מטבע החשבונית (מנהל 410 ⇒
        `superseded`). היה: הכרטיס «אישר/ה את הצעת הפריסה (3 תשלומים של 400 ₪…). נדרש אישור סופי שלך» — ההצעה הייתה
        $400, ואין הסדר לאשר — והטיוטה ללקוחה הבטיחה «אישור סופי ופרטי התשלום הראשון». עכשיו: בלי טיוטה, וכרטיס
        שאומר שההצעה בוטלה בגלל שינוי המטבע ויש להציע מחדש. רק כשההסדר האחרון של הלקוח הוחלף **בגלל מטבע**."""
        last = self.db.one("SELECT id, status FROM plans WHERE customer_id=? ORDER BY id DESC LIMIT 1", (cust["id"],))
        if not last or last["status"] != "superseded":
            return d
        hit = False
        for a in self.db.q("SELECT detail FROM audit WHERE action='currency_changed'"):
            try:
                hit = last["id"] in (json.loads(a["detail"] or "{}").get("plans_superseded") or [])
            except (ValueError, AttributeError):
                hit = False
            if hit:
                break
        if not hit:
            return d
        name = cust["name"] or "הלקוח/ה"
        self.svc.audit("system", "plan_accept_held_currency_changed", {"plan": last["id"]})
        return replace(d, reply=None, auto_send=False,
                       escalate=d.escalate if d.escalate != Escalation.NONE else Escalation.NORMAL,
                       tags=d.tags + ("plan_accept_currency_changed",),
                       owner_summary=(f"{name} אישר/ה את הצעת הפריסה, אבל ההצעה בוטלה: מטבע החשבונית השתנה במקור "
                                      "אחרי שנשלחה. לא נוסחה הודעה — כדי להמשיך יש להציע הסדר חדש במטבע הנוכחי."),
                       owner_actions=("להציע ללקוח/ה הסדר חדש במטבע הנוכחי (או לפנות אישית)",))

    def _moved_invoice_note(self, cid: int, d: Decision) -> Decision:
        """מבקר 234ב🟡: כמו `_paid_claim_moved_note` (395) לבקשת פריסה / הבטחה / מחלוקת — «אפשר לשלם את 9001 בשלושה
        תשלומים?» מטלפון שהחשבונית עברה ממנו בקובץ ⇒ הכרטיס «מבקש/ת הסדר» + «להציע הסדר» לכותב/ת (בלי חשבונית
        פתוחה), בלי לומר שהחשבונית רשומה כעת על לקוח אחר ולא הושהתה. עכשיו הכרטיס אומר זאת."""
        moved = self.svc.moved_away_open(cid)
        if not moved:
            return d
        lines = "; ".join(f"חשבונית {r['number']} רשומה כעת על {r['name'] or 'לקוח אחר'}" for r in moved)
        one = len(moved) == 1
        note = (f" שימו לב: {lines} (פרטי הקשר השתנו בקובץ) — הבקשה הזו לא חלה עלי{'ה' if one else 'הן'} "
                f"והתזכורות עלי{'ה' if one else 'הן'} לא הושהו.")
        return replace(d, owner_summary=(d.owner_summary or "") + note,
                       owner_actions=d.owner_actions + (
                           "לבדוק אם הבקשה שייכת לחשבונית שעברה ללקוח אחר לפני שמציעים הסדר/מאשרים מועד",))

    def _stop_approved_on_protective(self, cid: int, d: Decision) -> int:
        """מנהל 360 (מבקר 206🔴): `_draft` מחליף רק `pending_approval` ⇒ תשובה שבעל העסק אישר בערב וממתינה לחלון
        (`approved`) יצאה בבוקר אחרי «אני בן 16» / «אבא שלי נפטר» / עו״ד / פשיטת רגל / אשפוז — קישור תשלום לקטין,
        למשפחה שבאבל אחרי «עצרנו את התזכורות». הודעה דחופה או השהיה קשה (`_HARD_PAUSES`) ⇒ הממתינות לחלון נעצרות
        (`superseded`, `system:protective_reply`) וכרטיס ההודעה החדשה אומר זאת. לא נעצרות: אישור הסרה / «מספר שגוי»
        ותשובות דחופות קודמות (אמפתיה/הפניה — לא גבייה). כמו 205 לסימון של בעל העסק."""
        row = self.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))
        base = ((row["paused_reason"] if row else "") or "").split(":", 1)[0]
        # מבקר 207🟡: גם «שילמתי» (קישור תשלום אחרי «עצרנו את התזכורות ונבדוק») ו«רק מייל» (התשובה יצאה ב-SMS
        # שהלקוח ביקש להפסיק) — כשהטיוטה pending היא מוחלפת ב-`_draft`; approved צריכה להיעצר באותו אופן.
        later = "paid_claim" if Intent.PAID_CLAIM in d.all_intents else (
            "channel_pref" if "channel_pref" in d.tags else None)
        if d.escalate != Escalation.URGENT and base not in _HARD_PAUSES and not later:
            return 0
        return self._stop_approved(cid, d.intent.value, pause=(base or later) or None)

    def _stop_approved(self, cid: int, intent: str, *, pause: str | None = None,
                       shared_card: int | None = None) -> int:
        return len(self._stop_approved_ids(cid, intent, pause=pause, shared_card=shared_card))

    def _stop_approved_ids(self, cid: int, intent: str, *, pause: str | None = None,
                           shared_card: int | None = None) -> list[int]:
        """הממתינות לחלון (`approved`) של לקוח ⇒ `superseded` (`system:protective_reply`) + audit. משותף לפנייה
        ישירה (360) ולכרטיס כתובת משותפת (361). לא נעצרות: אישור הסרה / «מספר שגוי» / תשובות דחופות קודמות."""
        rows = self.db.q("SELECT id, intent FROM drafts WHERE customer_id=? AND status='approved' AND "
                         "escalate!='urgent' AND intent NOT IN ('opt_out','wrong_person')", (cid,))
        for r in rows:
            self.db.x("UPDATE drafts SET status='superseded', decided_by='system:protective_reply' WHERE id=?",
                      (r["id"],))
        if rows:
            detail = {"customer": cid, "drafts": [r["id"] for r in rows], "intent": intent, "pause": pause}
            if shared_card is not None:
                detail["shared_card"] = shared_card
            self.svc.audit("system", "approved_drafts_stopped_protective", detail)
        return [r["id"] for r in rows]

    def _draft(self, cust, channel: str, d: Decision, plan_id: int | None) -> int:
        # טיוטה חדשה מחליפה טיוטות קודמות שעוד לא אושרו (למשל הצעת פריסה ישנה) — חוץ מדחופות
        self.db.x("UPDATE drafts SET status='superseded' WHERE customer_id=? AND "
                  "status='pending_approval' AND escalate!='urgent'", (cust["id"],))
        status = "pending_approval" if d.reply else "needs_owner"
        body = self._with_footer(cust, channel, d.reply, d.intent.value) if d.reply else ""
        return self.db.x(
            "INSERT INTO drafts(customer_id,channel,to_addr,body,intent,status,escalate,owner_summary,"
            "owner_actions,plan_id,created_at,total_agorot) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            (cust["id"], channel, self._addr(cust, channel), body, d.intent.value, status,
             d.escalate.value,
             d.owner_summary,
             json.dumps(list(d.owner_actions), ensure_ascii=False), plan_id,
             _iso(self.svc.clock()), self._open_total(cust["id"])))

    # ---------- הסרה בכל הודעה + אימות סכום ----------
    def _open_total(self, cid: int) -> int:
        return self.db.one("SELECT COALESCE(SUM(amount_agorot),0) t FROM invoices "
                           "WHERE customer_id=? AND status='open'", (cid,))["t"]

    def _footer_url(self, cust, channel: str | None = None) -> str:
        if cust["id"]:
            return self.svc.unsub_url(self.svc.new_unsub_token(cust["id"], channel))
        inv = self.db.one("SELECT * FROM invoices WHERE customer_id=? AND status='open' "
                          "ORDER BY due LIMIT 1", (cust["id"],))
        return self.svc.short_url(inv) if inv else ""

    def _existing_unsub_url(self, cust, text: str) -> str | None:
        """קישור הסרה תקף שכבר בטקסט (טוקן חדש נוצר לכל הודעה, אז משווים לפי תוקף, לא לפי מחרוזת).
        קישור /u/ מזויף או של לקוח אחר ⇒ None (וייחסם במסנן כקישור זר)."""
        m = re.search(re.escape(self.svc.s.public_base_url) + r"/u/([A-Za-z0-9_-]{16,64})", text)
        if not m:
            return None
        c = self.svc._unsub_customer(m.group(1))
        return m.group(0) if c and c["id"] == cust["id"] else None

    def _with_footer(self, cust, channel: str, body: str, intent: str,
                     url: str | None = None) -> str:
        """אפשרות הסרה בכל הודעה — חוץ מאישור ההסרה עצמו ומהתנצלות למספר שגוי."""
        if intent in (Intent.OPT_OUT.value, Intent.WRONG_PERSON.value):
            return body
        url = url if url is not None else self._footer_url(cust, channel)
        if channel == "email":
            return body + (f"\n\nלהפסקת הודעות: {url}" if url else "\n\nלהפסקת הודעות השיבו \"הסר\".")
        return body + (f"\nלהפסקה: {url}" if url else " להפסקה השיבו הסר")

    def _save_state(self, cid: int, d: Decision, *, bump_turn: bool) -> None:
        offered = _plan_json(d.plan) if d.next_state == State.AWAITING_PLAN_REPLY and d.plan else None
        self.db.x(
            "INSERT INTO conversations(customer_id,state,offered_plan,bot_turns,pause_until,updated_at)"
            " VALUES(?,?,?,?,?,?) ON CONFLICT(customer_id) DO UPDATE SET state=excluded.state, "
            "offered_plan=COALESCE(excluded.offered_plan, conversations.offered_plan), "
            "bot_turns=conversations.bot_turns+?, pause_until=excluded.pause_until, "
            "updated_at=excluded.updated_at",
            (cid, d.next_state.value, offered, int(bump_turn),
             d.pause_until.isoformat() if d.pause_until else None, _iso(self.svc.clock()),
             int(bump_turn)))

    def release_expired_pauses(self) -> int:
        """השהיה עם תאריך (למשל 'אשלם עד חמישי') פגה ⇒ התזכורות חוזרות. השהיה בלי תאריך
        (שילמתי/מחלוקת/הסדר) נשארת עד שבעל העסק מחליט (resume_customer)."""
        today = self.svc.clock().date().isoformat()
        n = 0
        for c in self.db.q("SELECT id, paused_reason FROM customers WHERE paused_reason LIKE '%:until=%'"):
            until = c["paused_reason"].split(":until=", 1)[1]
            if until <= today and c["paused_reason"].startswith(Intent.PROMISE.value):
                self.db.x("UPDATE customers SET paused_reason=NULL WHERE id=?", (c["id"],))
                self.svc.audit("system", "pause_expired", {"customer": c["id"], "was": c["paused_reason"]})
                n += 1
        return n

    # ---------- החלטות בעל העסק ----------
    def drafts(self, status: str | None = "queue") -> list[dict]:
        """status='queue' (ברירת מחדל) = כל מה שמחכה לבעל העסק: טיוטות + כרטיסי טיפול."""
        sql = ("SELECT d.*, c.name customer FROM drafts d JOIN customers c ON c.id=d.customer_id")
        if status == "queue":
            sql += " WHERE d.status IN ('pending_approval','needs_owner')"
            status = None
        rows = self.db.q(sql + (" WHERE d.status=?" if status else "") +
                         " ORDER BY CASE d.escalate WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, d.id",
                         (status,) if status else ())
        return [self._with_queue_reason(dict(r) | {"owner_actions": json.loads(r["owner_actions"] or "[]"),
                                                   "amount_check": self._amount_check(r)}) for r in rows]

    def _amount_check(self, dr) -> list[dict]:
        """critic סבב 48: כמו הפעלה 123 בתזכורות — טיוטה עם כסף ללקוח שיש לו חשבונית פתוחה בסכום חריג (פי 50
        מהרגיל) ⇒ מה שחריג (לממשק ולאישור). בלי כסף בטיוטה ⇒ []."""
        money = "₪" in (dr["body"] or "") or dr["plan_id"] or dr["intent"] in _MONEY_INTENTS
        if not money:
            return []
        invs = self.db.q("SELECT * FROM invoices WHERE customer_id=? AND status='open'", (dr["customer_id"],))
        return [{"number": i["number"], "amount_agorot": i["amount_agorot"], "usual_agorot": u,
                 "currency": i["currency"]} for i, u in self.svc._amount_outliers(invs)]

    def approve_draft(self, draft_id: int, *, body: str | None = None, actor: str = "owner",
                      confirm_amount: bool = False) -> dict:
        dr = self._get(draft_id)
        if dr["status"] not in ("pending_approval", "needs_owner"):
            if dr["decided_by"] == "system:opted_out":   # critic סבב 58: נעצרה בהסרה ⇒ הסבר מדויק
                raise ValueError("הלקוח ביקש הסרה אחרי שהטיוטה נוסחה, ולכן היא לא תישלח")
            if dr["decided_by"] == "system:owner_hold":   # מנהל 359: נעצרה בסימון קטין/פטירה/חדלות פירעון
                raise ValueError("הלקוח סומן (קטין/ה, נפטר/ה או הליך חדלות פירעון) אחרי שהטיוטה נוסחה, "
                                 "ולכן היא לא תישלח. לשחרור — «חידוש» בכרטיס הלקוח, ואז תשובה חדשה")
            raise _draft_decided(dr["status"], "approve", self._draft_who(dr))
        if self._amount_check(dr) and not confirm_amount:
            raise ValueError("סכום חריג מאוד מהרגיל ללקוח (אולי נקודה עשרונית במקום הלא נכון?) — "
                             "יש לאשר במפורש שהסכום נכון (confirm_amount)")
        if dr["status"] == "needs_owner" and not (body or "").strip():
            raise ValueError("אין טיוטה — כתבו תשובה או סגרו את הכרטיס")
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (dr["customer_id"],))
        text = dr["body"]
        edited = 0
        if body is not None and body.strip() != dr["body"]:
            text = body.strip()
            if not text.startswith(self.svc.s.business_name):
                text = frame(text, replace(self._context(cust, dr["channel"]), channel=dr["channel"]))
            ctx = self._context(cust, dr["channel"])
            url = self._existing_unsub_url(cust, text) or self._footer_url(cust, dr["channel"])
            if (url and url not in text) or (not url and "הסר" not in text):
                text = self._with_footer(cust, dr["channel"], text, dr["intent"],
                                         url=url)  # הסרה בכל הודעה
            bad = compliance.violations(text, compliance.Rules(
                business=ctx.business, payment_link=ctx.payment_link, unsubscribe_url=url,
                channel=dr["channel"]))
            if bad:
                raise ValueError(f"הנוסח נחסם במסנן: {', '.join(bad)}")
            edited = 1
        # מבקר 275ב🟠: מותנה במצב שנבדק. היה `WHERE id=?` ⇒ אישור של עובדת אחרת בין הבדיקה לעדכון: העריכה
        # «אושרה» (200) אבל המקור יצא, ולפעמים ה-UPDATE החזיר sent_dry_run ל-approved ⇒ שתי הודעות ללקוח.
        if not self.db.update("UPDATE drafts SET status='approved', body=?, edited=?, decided_at=?, decided_by=? "
                              "WHERE id=? AND status=?",
                              (text, edited, _iso(self.svc.clock()), actor, draft_id, dr["status"])):
            raise self._draft_decided_now(draft_id, "approve")
        # ר-12: מה בדיוק אושר (כמו approved_hash בתזכורות) — שינוי מאוחר של הגוף ב-DB יתגלה
        self.svc.audit(actor, "draft_approved", {"draft": draft_id, "edited": bool(edited),
                                                 "body_sha": _body_sha(text)})
        self._try_send(draft_id)
        return self._with_queue_reason(dict(self._get(draft_id)))

    _QUEUE_GATES = ("outside_window", "trial_expired", "restore_hold")

    def _with_queue_reason(self, d: dict) -> dict:
        """מבקר 270🟡: טיוטה שאושרה ונשארה `approved` = ממתינה בתור (לא נשלחה). מחזירים את הסיבה כדי
        שהממשק לא יציג «נשלח»: outside_window / trial_expired / restore_hold, אחרת retry (רענון נכשל וכו׳)."""
        if d.get("status") != "approved":
            return d
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (d["customer_id"],))
        why = self._can_message(cust, d) if cust else None
        return d | {"queued_reason": why if why in self._QUEUE_GATES else "retry"} | self._queued_age(d)

    def _queued_age(self, d: dict) -> dict:
        """מנהל 450 (STATUS 449 «הבא» עיצוב): טיוטה מאושרת בתור ⇒ מאז מתי, וכמה ימים שלמים נותרו עד ש-
        `_withdraw_if_stale` מחזירה אותה לאישור (תשובה) או מבטלת אותה (הצעת פריסה). אותו עוגן ואותו מועד:
        decided_at (או created_at) + STALE_DRAFT_HOURS, ובהצעה — מוקדם יותר אם מועד תשלום בה יעבור (חצות שאחריו)."""
        since = _parse_iso(d.get("decided_at") or d.get("created_at"))
        if since is None:
            return {"queued_since": None, "queued_days_left": None}
        now = self.svc.clock()
        deadline = since + timedelta(hours=STALE_DRAFT_HOURS)
        if d.get("plan_id"):
            row = self.db.one("SELECT installments FROM plans WHERE id=?", (d["plan_id"],))
            dues = [date.fromisoformat(i["due"]) for i in json.loads(row["installments"] or "[]")] if row else []
            if dues:   # past_due = due < now.date() ⇒ מתחיל בחצות שאחרי המועד
                deadline = min(deadline, datetime.combine(min(dues) + timedelta(days=1), datetime.min.time(),
                                                          tzinfo=now.tzinfo))
        days = max(0, -(-int((deadline - now).total_seconds()) // 86400))
        return {"queued_since": since.astimezone(TZ).date().isoformat(), "queued_days_left": days}

    def _draft_who(self, dr):
        """מנהל 456: מי הכריע על הטיוטה ומתי. רק אושרה/נסגרה ע״י אדם; system:* (הסרה, חלון, הוחלפה) ⇒ בלי ייחוס."""
        if dr["status"] not in _DRAFT_APPROVED_STATES + ("rejected",):
            return None
        by = dr["decided_by"] or ""
        if not by or by.startswith("system"):
            return None
        row = {"at": dr["decided_at"], "actor": by}
        return lambda he: self.svc.already_decided_he(he, row)

    def _draft_decided_now(self, draft_id: int, action: str) -> ValueError:
        dr = self._get(draft_id)
        return _draft_decided(dr["status"], action, self._draft_who(dr))

    def reject_draft(self, draft_id: int, actor: str = "owner") -> dict:
        dr = self._get(draft_id)
        if dr["status"] not in ("pending_approval", "needs_owner", "approved"):
            raise _draft_decided(dr["status"], "reject", self._draft_who(dr))
        if not self.db.update("UPDATE drafts SET status='rejected', decided_at=?, decided_by=? "
                              "WHERE id=? AND status=?",
                              (_iso(self.svc.clock()), actor, draft_id, dr["status"])):   # מבקר 275ב🟠
            raise self._draft_decided_now(draft_id, "reject")
        self.svc.audit(actor, "draft_rejected", {"draft": draft_id})
        return dict(self._get(draft_id))

    def flush(self) -> list[int]:
        """שולח טיוטות שאושרו אבל חיכו לחלון שליחה (לילה/שבת/חג).
        מבקר סבב 3: חריגה בטיוטה אחת לא עוצרת את האחרות (_try_send תופס ומסמן)."""
        out = []
        self._recover_stuck_drafts()
        for r in self.db.q("SELECT id FROM drafts WHERE status='approved' ORDER BY id"):
            if self._try_send(r["id"]):
                out.append(r["id"])
        return out

    # ---------- שער שליחה יחיד ----------
    def _can_message(self, cust, dr) -> str | None:
        """מאציל לשער היחיד של השירות (שעות/שבת/חג/ניסיון/רשימת הסרה מגובבת)."""
        to = dr["to_addr"] or self._addr(cust, dr["channel"]) or ""
        return self.svc.gate(cust, dr["channel"], to,
                             opt_out_ack=dr["intent"] in _ALLOWED_AFTER_OPT_OUT)

    def _withdraw_if_stale(self, dr) -> bool:
        """critic סבב 30: טיוטה שאושרה וחיכתה בתור (סוף ניסיון, חלון) יצאה גם שבועות אחרי האישור —
        «איך אפשר לשלם?» ⇒ תשובה אחרי 22 יום, והצעת פריסה שהתשלום הראשון שלה כבר עבר. עכשיו: מעבר
        ל-STALE_DRAFT_HOURS (4 ימים: מכסה שבת + ראש השנה) מהאישור, או הצעה שתאריך בה כבר הגיע ⇒ לא
        שולחים. הצעת פריסה ⇒ בוטלה (התאריכים לא תקפים); כל תשובה אחרת ⇒ חוזרת לאישור מחדש."""
        now = self.svc.clock()
        try:   # מאז האישור (אישור עכשיו על שאלה ישנה = החלטה טרייה של בעל העסק)
            since = datetime.fromisoformat(dr["decided_at"] or dr["created_at"])
        except (TypeError, ValueError):
            return False
        past_due = False
        if dr["plan_id"]:
            row = self.db.one("SELECT installments FROM plans WHERE id=?", (dr["plan_id"],))
            past_due = bool(row) and any(date.fromisoformat(i["due"]) < now.date()
                                         for i in json.loads(row["installments"] or "[]"))
        if not past_due and now - since <= timedelta(hours=STALE_DRAFT_HOURS):
            return False
        if dr["plan_id"]:
            self.db.x("UPDATE drafts SET status='rejected', decided_by='system:stale' WHERE id=?",
                      (dr["id"],))
            self.db.x("UPDATE plans SET status='rejected' WHERE id=? AND status IN ('proposed','approved')",
                      (dr["plan_id"],))
            # מנהל 446 (מבקר 272ב🟠): ההצעה בוטלה ⇒ השיחה כבר לא «הציעה» אותה. היה: awaiting_plan_reply נשאר ⇒
            # «מאשר» של הלקוח = כרטיס אישור על הסדר שנדחה + ביטול התזכורת שתוכננה לו
            prow = self.db.one("SELECT * FROM plans WHERE id=?", (dr["plan_id"],))
            if prow:
                self.svc._clear_plan_offer(prow)
            self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                      "created_at) VALUES(?,'system','owner',?,'stale_draft',1,?)",
                      (dr["customer_id"], "הצעת הפריסה שאישרת לא נשלחה: היא חיכתה יותר מ-4 ימים, "
                       "והתאריכים בה כבר לא תקפים. אפשר לשלוח הצעה חדשה.", _iso(self.svc.clock())))
        else:
            self.db.x("UPDATE drafts SET status='pending_approval', decided_by=NULL, decided_at=NULL, "
                      "owner_summary=COALESCE(owner_summary,'') || ? WHERE id=?",
                      (" ⏳ התשובה חיכתה יותר מ-4 ימים ולא נשלחה — לאשר מחדש אם עדיין רלוונטית.",
                       dr["id"]))
        self.svc.audit("system", "draft_stale", {"draft": dr["id"], "plan": bool(dr["plan_id"])})
        return True

    def _claim_draft(self, draft_id: int) -> bool:
        """critic סבב 40: תפיסה אטומית (approved ⇒ sending) לפני השליחה. False ⇒ מישהו אחר כבר שולח/שלח."""
        return self.db.update("UPDATE drafts SET status='sending', claimed_at=? WHERE id=? AND "
                              "status='approved'", (_iso(self.svc.clock()), draft_id)) == 1

    def _recover_stuck_drafts(self) -> None:
        """טיוטה ב-sending מעל 30 דק׳ = נפילה בין send לסימון ⇒ לא שולחים שוב; send_unknown + הודעה."""
        cutoff = _iso(self.svc.clock() - self.svc.CLAIM_STALE)
        for r in self.db.q("SELECT id, customer_id FROM drafts WHERE status='sending' AND claimed_at<=?",
                           (cutoff,)):
            if self.db.update("UPDATE drafts SET status='send_unknown' WHERE id=? AND status='sending'",
                              (r["id"],)) != 1:
                continue
            self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                      "message_id,created_at) VALUES(?,'system','owner',?,'send_unknown',1,?,?)",
                      (r["customer_id"], "שליחת תשובה ללקוח נקטעה באמצע. ייתכן שהיא יצאה — היא לא "
                       "תישלח שוב אוטומטית. בדקו ב«יומן יוצאים» לפני שליחה ידנית.",
                       f"sendunk-draft:{r['id']}", _iso(self.svc.clock())))
            self.svc.audit("system", "send_unknown", {"draft": r["id"]})

    def _try_send(self, draft_id: int) -> bool:
        dr = self._get(draft_id)
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (dr["customer_id"],))
        why = self._can_message(cust, dr)
        if why in ("outside_window", "trial_expired", "restore_hold"):
            return False  # נשאר approved; flush() ישלח בחלון הבא (critic 175: גם אחרי חידוש משחזור)
        if why:
            self._drop_approved(draft_id, cust, f"system:{why}", _GATE_HE.get(why, "השליחה נחסמה בשער השליחה"))
            return False
        if self._withdraw_if_stale(dr):
            return False
        money = "₪" in dr["body"] or dr["plan_id"] or dr["intent"] in _MONEY_INTENTS
        if money and not self.svc.refresh_customer(cust["id"]):
            # ר-4 (מבקר סבב 3 🔴): טיוטה עם כסף יצאה בלי אף קריאה ל-GI, גם כש-GI החזיר 500.
            # כשל רענון ⇒ לא שולחים; נשאר approved ונשלח בהצלחת רענון הבאה (flush).
            self.svc.audit("system", "draft_refresh_failed", {"draft": draft_id})
            return False
        now_total = self._open_total(cust["id"])
        if money and dr["total_agorot"] is not None and now_total != dr["total_agorot"]:
            # אימות סכום לפני כל שליחה: היתרה השתנתה (תשלום/עדכון) ⇒ הנוסח לא נשלח
            self._drop_approved(draft_id, cust, "system:amount_changed",
                                "היתרה של הלקוח השתנתה מאז שהתשובה נוסחה (תשלום או עדכון), ולכן הסכום בה כבר "
                                "לא נכון. אם צריך, תכינו תשובה חדשה")
            self.svc.audit("system", "draft_blocked_amount_changed",
                           {"draft": draft_id, "was": dr["total_agorot"], "now": now_total})
            return False
        msg = self._message(cust, dr)
        if msg is None:
            self._drop_approved(draft_id, cust, "system:no_address",
                                "אין ללקוח כתובת תקינה בערוץ הזה (נייד/מייל). עדכנו את פרטי הקשר ושלחו שוב")
            return False
        now = self.svc.clock()
        if not self._claim_draft(draft_id):
            return False   # critic סבב 40: אישור ו-flush במקביל / ריצה אחרת — רק אחד שולח
        try:
            mid = self.svc.sender.send(msg)
        except Exception as e:  # noqa: BLE001 — מבקר סבב 3: IntegrationError (ארוך מדי) קרס ונעל את הלקוח
            self._drop_approved(draft_id, cust, "system:send_error", f"שגיאת שליחה: {str(e)[:160]}",
                                intent="send_error", body=f"הטיוטה לא נשלחה: {str(e)[:160]}")
            self.svc.audit("system", "draft_send_error", {"draft": draft_id, "error": str(e)[:200]})
            return False
        self.svc._log_out(cust["id"], msg, mid, now)
        self.db.x("UPDATE drafts SET status='sent_dry_run', sent_at=?, message_id=? WHERE id=?",
                  (_iso(now), mid, draft_id))
        if dr["plan_id"]:
            # review חור 2: הצעת הפריסה יצאה מתור התשובות ⇒ ההסדר הוכרע. אחרת /plans/approve
            # שלח ללקוח הצעה שנייה (בנוסח ובתאריכים אחרים).
            self.db.x("UPDATE plans SET status='approved' WHERE id=? AND status='proposed'",
                      (dr["plan_id"],))
            self.svc._resolve_plan_request_cards(cust["id"])   # מנהל 460 (מבקר 283🟡)
            if dr["intent"] == "plan_offer":
                # מנהל 446 (מבקר 272א🟠): הצעה מהדשבורד שחיכתה בתור יצאה עכשיו ⇒ רק עכשיו השיחה «הציעה» אותה
                prow = self.db.one("SELECT installments FROM plans WHERE id=?", (dr["plan_id"],))
                if prow:
                    self.svc._mark_plan_offered(cust["id"], json.loads(prow["installments"] or "[]"))
        self.svc.audit("system", "draft_sent_dry_run", {"draft": draft_id, "message_id": mid,
                                                        "body_sha": _body_sha(dr["body"])})
        return True

    def _drop_approved(self, draft_id: int, cust, decided_by: str, reason: str, *,
                       intent: str = "draft_not_sent", body: str | None = None) -> None:
        """critic סבב 61: טיוטה **שבעל העסק אישר** לא יוצאת בגלל החלטת מערכת ⇒ נדחית **ובעל העסק מקבל הודעה**.
        היה: amount_changed / no_address / חסימה בשער נדחו בשקט, ובעל העסק בטוח שהלקוח קיבל תשובה."""
        self.db.x("UPDATE drafts SET status='rejected', decided_by=? WHERE id=?", (decided_by, draft_id))
        who = cust["name"] if cust and cust["name"] else "הלקוח"
        text = body or f"התשובה שאישרתם ל{who} לא נשלחה: {reason}."
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,created_at) "
                  "VALUES(?,'system','owner',?,?,1,?)",
                  (cust["id"] if cust else None, text, intent, _iso(self.svc.clock())))

    @staticmethod
    def _addr(cust, channel: str) -> str | None:
        if channel == "sms":
            to = normalize_il_phone(cust["phone"])
            return to if is_il_mobile(to) else None
        return cust["email"] if valid_email(cust["email"]) else None

    def _message(self, cust, dr) -> Message | None:
        to = dr["to_addr"] or self._addr(cust, dr["channel"])
        if not to:
            return None
        if dr["channel"] == "sms":
            return Message("sms", to, dr["body"])
        unsub = self.svc.unsub_url(self.svc.new_unsub_token(cust["id"], "email", to))
        return Message("email", to, dr["body"],
                       subject=f"תשובה מ-{self.svc.s.business_name}", unsubscribe_url=unsub)

    def _get(self, draft_id: int):
        r = self.db.one("SELECT * FROM drafts WHERE id=?", (draft_id,))
        if not r:
            raise KeyError(draft_id)
        return r


_MONEY_INTENTS = {Intent.PLAN_REQUEST.value, Intent.PLAN_ACCEPT.value, Intent.PLAN_REJECT.value,
                  Intent.CANT_PAY.value, Intent.HOW_TO_PAY.value, Intent.PROMISE.value,
                  Intent.PAID_CLAIM.value}
# השהיות "קשות": רק בעל העסק משחרר, ולא מוחלפות בסיבה רכה יותר
_ESC_ORDER = (Escalation.NONE, Escalation.NORMAL, Escalation.URGENT)
_HARD_PAUSES = ("minor", "deceased", "insolvency", "distress", "legal", "dispute")


# critic סבב 153: השהיות שאחריהן אין שליחה אוטומטית (safe_auto) — רק טיוטה לבעל העסק. ההשהיות הקשות + מצב רגיש +
# כרטיסי כתובת משותפת + «שילמתי» (קישור תשלום אוטומטי למי שטוען ששילם = תזכורת בלי אישור)
_NO_AUTO_SEND_PAUSES = _HARD_PAUSES + ("sensitive", "paid_claim", "shared_contact_urgent", "shared_contact_paid_claim",
                                       "shared_contact_promise", "shared_contact_plan_request")


def _protected(row) -> bool:
    if row is None:
        return True   # לקוח שנמחק תוך כדי — לא שולחים
    base = (row["paused_reason"] or "").split(":", 1)[0]
    return bool(row["disputed"]) or base in _NO_AUTO_SEND_PAUSES


def _keeps_old_pause(old: str, new: str) -> bool:
    """True ⇒ לא דורסים את ההשהיה הקיימת. "שילמתי" ואחריו "אשלם בחמישי" לא יהפוך להשהיה
    שמשתחררת לבד; קטין/פטירה/חדלות פירעון/מחלוקת לא יוחלפו בסיבה רכה."""
    if not old:
        return False
    old_base, new_base = old.split(":", 1)[0], new.split(":", 1)[0]
    if old_base in _HARD_PAUSES and new_base not in _HARD_PAUSES:
        return True
    return ":until=" not in old and ":until=" in new


def _body_sha(body: str) -> str:
    return hashlib.sha256((body or "").encode()).hexdigest()[:16]


def _plan_json(plan: tuple[Installment, ...]) -> str:
    return json.dumps([{"n": i.n, "due": i.due.isoformat(), "amount_agorot": i.amount_agorot}
                       for i in plan])


def decision_dict(d: Decision) -> dict:
    out = asdict(d)
    return json.loads(json.dumps(out, default=str))
