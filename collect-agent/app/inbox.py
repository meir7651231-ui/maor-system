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

import json
from dataclasses import asdict, replace
from datetime import date, datetime
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
    frame,
    respond,
)
from .policy import TZ

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
  sent_at TEXT, message_id TEXT
);
"""

# הודעה ללקוח שביקש הסרה מותרת רק כמענה לבקשה מפורשת שלו או כאישור ההסרה עצמה
_ALLOWED_AFTER_OPT_OUT = {Intent.OPT_OUT.value, Intent.WRONG_PERSON.value, Intent.HOW_TO_PAY.value,
                          Intent.COPY_REQUEST.value, Intent.CALLBACK.value}


def _iso(dt: datetime) -> str:
    return dt.astimezone(TZ).isoformat(timespec="seconds")


class ConversationInbox:
    def __init__(self, svc: Any, policy: OwnerPolicy | None = None) -> None:
        self.svc = svc
        self.db = svc.db
        self.policy = policy or OwnerPolicy()
        with self.db.lock:
            self.db.conn.executescript(SCHEMA)

    # ---------- קלט ----------
    def handle(self, channel: str, sender: str, text: str) -> dict:
        if channel not in ("sms", "email"):
            raise ValueError("ערוץ לא נתמך")
        now = self.svc.clock()
        cust = self.svc._find_customer(channel, sender)
        if cust is None:
            # לא חושפים כלום לשולח לא מזוהה; רק לבעל העסק
            self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                      "created_at) VALUES(NULL,'in',?,?, 'unknown_sender', 1, ?)",
                      (channel, text, _iso(now)))
            return {"intent": "unknown_sender", "escalate": True, "escalation": "normal",
                    "draft_id": None, "auto_reply": None, "plan_id": None}
        return self.handle_customer(cust, channel, text)

    def handle_customer(self, cust, channel: str, text: str) -> dict:
        """channel: sms / email / web (פעולה בעמוד הקישור הקצר — בלי טיוטת תשובה)."""
        now = self.svc.clock()
        self.release_expired_pauses()
        web = channel == "web"
        ctx = self._context(cust, "sms" if web else channel)
        d = respond(text, ctx)
        if web:
            d = replace(d, reply=None, auto_send=False)
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "created_at) VALUES(?,'in',?,?,?,?,?)",
                  (cust["id"], channel, text, d.intent.value,
                   int(d.escalate != Escalation.NONE), _iso(now)))
        plan_id = self._apply_effects(cust, d)
        draft_id = None
        if d.reply or d.escalate != Escalation.NONE:
            # בלי טיוטה (למשל עו"ד) ⇒ כרטיס "דרוש טיפול" בתור, שבעל העסק יכול לענות ממנו בעצמו
            draft_id = self._draft(cust, channel, d, plan_id)
        if getattr(self, "_wrong_number", False):
            # ר-3: מספר שגוי ⇒ מוחקים את השדה מהלקוח (התנצלות, אם תאושר, הולכת לכתובת שנשמרה בטיוטה)
            col = "email" if channel == "email" else "phone"
            # שומרים את הערך שנחסם, כדי שסנכרון מחשבונית ירוקה (שם הוא עדיין רשום) לא יחזיר אותו
            self.db.x(f"UPDATE customers SET blocked_{col}={col}, {col}=NULL WHERE id=?",
                      (cust["id"],))
            self._wrong_number = False
        self._save_state(cust["id"], d, bump_turn=bool(d.reply))
        self.svc.audit("customer", "conversation", {
            "customer": cust["id"], "intent": d.intent.value,
            "secondary": [i.value for i in d.secondary], "escalate": d.escalate.value,
            "stop": d.stop.value, "draft": draft_id})
        sent = None
        if draft_id and d.auto_send:
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
            bot_turns=conv["bot_turns"] if conv else 0, policy=self.policy)

    # ---------- השפעות מיידיות (לא מחכות לאישור — הן רק עוצרות) ----------
    def _apply_effects(self, cust, d: Decision) -> int | None:
        cid = cust["id"]
        intents = {i.value for i in d.all_intents}
        if Intent.WRONG_PERSON.value in intents:
            self.svc._opt_out(cid, "wrong_number")
            self._wrong_number = True
        elif d.stop == Stop.PERMANENT:
            self.svc._opt_out(cid, "reply")
        if intents & {Intent.DISPUTE.value, Intent.LEGAL.value}:
            self.db.x("UPDATE customers SET disputed=1 WHERE id=?", (cid,))
        if d.stop == Stop.PAUSE:
            # רק הבטחה משתחררת לבד ⇒ רק לה יש תאריך בסיבה; השאר נקי לדשבורד ("paid_claim")
            auto_release = d.intent == Intent.PROMISE and d.pause_until
            reason = d.intent.value + (f":until={d.pause_until.isoformat()}" if auto_release else "")
            self.db.x("UPDATE customers SET paused_reason=? WHERE id=?", (reason, cid))
        if d.stop != Stop.NONE:
            for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (cid,)):
                self.svc._cancel_invoice(inv["id"], d.intent.value)
        plan_id = None
        if d.plan and d.intent != Intent.PLAN_ACCEPT:
            oldest = self.db.one("SELECT id FROM invoices WHERE customer_id=? AND status='open' "
                                 "ORDER BY due LIMIT 1", (cid,))
            if oldest:
                # הצעה חדשה מחליפה הצעה קודמת שעוד לא אושרה
                self.db.x("UPDATE plans SET status='rejected' WHERE customer_id=? AND status='proposed'",
                          (cid,))
                plan_id = self.db.x(
                    "INSERT INTO plans(customer_id,invoice_id,installments,status,created_at) "
                    "VALUES(?,?,?, 'proposed', ?)",
                    (cid, oldest["id"], _plan_json(d.plan), _iso(self.svc.clock())))
        if d.intent == Intent.PLAN_ACCEPT:
            row = self.db.one("SELECT id FROM plans WHERE customer_id=? AND status='proposed' "
                              "ORDER BY id DESC LIMIT 1", (cid,))
            plan_id = row["id"] if row else None
            self.svc.audit("customer", "plan_accepted_by_customer", {"plan": plan_id})
        return plan_id

    def _draft(self, cust, channel: str, d: Decision, plan_id: int | None) -> int:
        # טיוטה חדשה מחליפה טיוטות קודמות שעוד לא אושרו (למשל הצעת פריסה ישנה) — חוץ מדחופות
        self.db.x("UPDATE drafts SET status='superseded' WHERE customer_id=? AND "
                  "status='pending_approval' AND escalate!='urgent'", (cust["id"],))
        status = "pending_approval" if d.reply else "needs_owner"
        return self.db.x(
            "INSERT INTO drafts(customer_id,channel,to_addr,body,intent,status,escalate,owner_summary,"
            "owner_actions,plan_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            (cust["id"], channel, self._addr(cust, channel), d.reply or "", d.intent.value, status,
             d.escalate.value,
             d.owner_summary,
             json.dumps(list(d.owner_actions), ensure_ascii=False), plan_id,
             _iso(self.svc.clock())))

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
        return [dict(r) | {"owner_actions": json.loads(r["owner_actions"] or "[]")} for r in rows]

    def approve_draft(self, draft_id: int, *, body: str | None = None, actor: str = "owner") -> dict:
        dr = self._get(draft_id)
        if dr["status"] not in ("pending_approval", "needs_owner"):
            raise ValueError(f"הטיוטה כבר הוכרעה (status={dr['status']})")
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
            bad = compliance.violations(text, compliance.Rules(
                business=ctx.business, payment_link=ctx.payment_link, channel=dr["channel"]))
            if bad:
                raise ValueError(f"הנוסח נחסם במסנן: {', '.join(bad)}")
            edited = 1
        self.db.x("UPDATE drafts SET status='approved', body=?, edited=?, decided_at=?, decided_by=? "
                  "WHERE id=?", (text, edited, _iso(self.svc.clock()), actor, draft_id))
        self.svc.audit(actor, "draft_approved", {"draft": draft_id, "edited": bool(edited)})
        self._try_send(draft_id)
        return dict(self._get(draft_id))

    def reject_draft(self, draft_id: int, actor: str = "owner") -> dict:
        dr = self._get(draft_id)
        if dr["status"] not in ("pending_approval", "needs_owner", "approved"):
            raise ValueError(f"לא ניתן לדחות (status={dr['status']})")
        self.db.x("UPDATE drafts SET status='rejected', decided_at=?, decided_by=? WHERE id=?",
                  (_iso(self.svc.clock()), actor, draft_id))
        self.svc.audit(actor, "draft_rejected", {"draft": draft_id})
        return dict(self._get(draft_id))

    def flush(self) -> list[int]:
        """שולח טיוטות שאושרו אבל חיכו לחלון שליחה (לילה/שבת/חג)."""
        return [r["id"] for r in self.db.q("SELECT id FROM drafts WHERE status='approved' ORDER BY id")
                if self._try_send(r["id"])]

    # ---------- שער שליחה יחיד ----------
    def _can_message(self, cust, dr) -> str | None:
        if cust["opted_out"] and dr["intent"] not in _ALLOWED_AFTER_OPT_OUT:
            return "opted_out"
        if not self.svc.policy.can_send_at(self.svc.clock()):
            return "outside_window"
        return None

    def _try_send(self, draft_id: int) -> bool:
        dr = self._get(draft_id)
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (dr["customer_id"],))
        why = self._can_message(cust, dr)
        if why == "outside_window":
            return False  # נשאר approved; flush() ישלח בחלון הבא
        if why:
            self.db.x("UPDATE drafts SET status='rejected', decided_by=? WHERE id=?",
                      (f"system:{why}", draft_id))
            return False
        msg = self._message(cust, dr)
        if msg is None:
            self.db.x("UPDATE drafts SET status='rejected', decided_by='system:no_address' WHERE id=?",
                      (draft_id,))
            return False
        now = self.svc.clock()
        mid = self.svc.sender.send(msg)
        self.svc._log_out(cust["id"], msg, mid, now)
        self.db.x("UPDATE drafts SET status='sent_dry_run', sent_at=?, message_id=? WHERE id=?",
                  (_iso(now), mid, draft_id))
        self.svc.audit("system", "draft_sent_dry_run", {"draft": draft_id, "message_id": mid})
        return True

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
        unsub = self.svc.unsub_url(cust["unsub_token"]) if cust["unsub_token"] else ""
        return Message("email", to, dr["body"],
                       subject=f"תשובה מ-{self.svc.s.business_name}", unsubscribe_url=unsub)

    def _get(self, draft_id: int):
        r = self.db.one("SELECT * FROM drafts WHERE id=?", (draft_id,))
        if not r:
            raise KeyError(draft_id)
        return r


def _plan_json(plan: tuple[Installment, ...]) -> str:
    return json.dumps([{"n": i.n, "due": i.due.isoformat(), "amount_agorot": i.amount_agorot}
                       for i in plan])


def decision_dict(d: Decision) -> dict:
    out = asdict(d)
    return json.loads(json.dumps(out, default=str))
