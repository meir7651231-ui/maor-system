"""תזמור: סנכרון ⇒ תכנון תור ⇒ אישור בעלים ⇒ שליחה (dry-run) ⇒ מענה לתשובות."""
from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta
from typing import Any, Callable

from . import assistant, plans, templates
from .config import SafetyError, Settings
from .db import DB
from .greeninvoice import GreenInvoiceClient, Invoice
from .policy import MAX_REMINDERS_PER_INVOICE, TZ, Policy, customer_blocked, gap_ok
from .whatsapp import (DryRunSender, build_template_payload, build_text_payload,
                       normalize_il_phone)

# ימים אחרי מועד-התשלום לכל שלב
STEP_OFFSETS_DAYS = (1, 7, 14, 30)
ACTIVE = ("pending_approval", "approved")


def _iso(dt: datetime) -> str:
    return dt.astimezone(TZ).isoformat(timespec="seconds")


def _dt(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s) if s else None


class CollectService:
    def __init__(self, settings: Settings, db: DB, *, sender: DryRunSender | None = None,
                 gi: GreenInvoiceClient | None = None,
                 clock: Callable[[], datetime] | None = None) -> None:
        if not settings.dry_run:
            raise SafetyError("שלב 1: dry-run בלבד")
        self.s = settings
        self.db = db
        self.sender = sender or DryRunSender()
        if getattr(self.sender, "mode", None) != "dry_run":
            raise SafetyError("שלב 1: רק DryRunSender מותר")
        self.gi = gi
        self.policy = Policy(frozenset(settings.holidays))
        self.clock = clock or (lambda: datetime.now(TZ))

    # ---------- audit ----------
    def audit(self, actor: str, action: str, detail: Any = None) -> None:
        self.db.x("INSERT INTO audit(at,actor,action,detail) VALUES(?,?,?,?)",
                  (_iso(self.clock()), actor, action,
                   json.dumps(detail, ensure_ascii=False) if detail is not None else None))

    # ---------- sync ----------
    def ingest(self, invoices: list[Invoice]) -> dict[str, int]:
        """upsert מלא. חשבונית פתוחה שנעלמה מהתוצאה ⇒ נסגרה ⇒ ביטול תזכורות פעילות."""
        now = _iso(self.clock())
        seen: set[str] = set()
        for inv in invoices:
            seen.add(inv.external_id)
            cust_ext = inv.client_external_id or f"phone:{inv.client_phone}"
            self.db.x(
                "INSERT INTO customers(external_id,name,phone,email) VALUES(?,?,?,?) "
                "ON CONFLICT(external_id) DO UPDATE SET name=excluded.name, "
                "phone=excluded.phone, email=excluded.email",
                (cust_ext, inv.client_name, inv.client_phone, inv.client_email))
            cid = self.db.one("SELECT id FROM customers WHERE external_id=?", (cust_ext,))["id"]
            self.db.x(
                "INSERT INTO invoices(external_id,number,doc_type,amount_agorot,currency,issued,"
                "due,customer_id,status,synced_at) VALUES(?,?,?,?,?,?,?,?, 'open', ?) "
                "ON CONFLICT(external_id) DO UPDATE SET amount_agorot=excluded.amount_agorot, "
                "due=excluded.due, status='open', synced_at=excluded.synced_at",
                (inv.external_id, inv.number, inv.doc_type, inv.amount_agorot, inv.currency,
                 inv.issued.isoformat() if inv.issued else None,
                 inv.due.isoformat() if inv.due else None, cid, now))
        closed = 0
        for row in self.db.q("SELECT id, external_id FROM invoices WHERE status='open'"):
            if row["external_id"] not in seen:
                self.db.x("UPDATE invoices SET status='closed' WHERE id=?", (row["id"],))
                self._cancel_invoice(row["id"], "invoice_closed")
                closed += 1
        self.audit("system", "sync", {"open": len(seen), "closed": closed})
        return {"open": len(seen), "closed": closed}

    def sync(self) -> dict[str, int]:
        if self.gi is None:
            raise RuntimeError("לא הוגדר חיבור Green Invoice (sandbox)")
        return self.ingest(list(self.gi.iter_open_invoices()))

    # ---------- planning ----------
    def plan(self) -> list[int]:
        now = self.clock()
        created: list[int] = []
        rows = self.db.q(
            "SELECT i.*, c.name cname, c.phone cphone, c.opted_out, c.disputed, c.approved_first, "
            "c.last_sent_at FROM invoices i JOIN customers c ON c.id=i.customer_id "
            "WHERE i.status='open'")
        for r in rows:
            if self._customer_block(r["customer_id"]):
                continue
            if self.db.one("SELECT 1 FROM reminders WHERE invoice_id=? AND status IN (?,?)",
                           (r["id"], *ACTIVE)):
                continue
            if self.db.one("SELECT 1 FROM reminders WHERE invoice_id=? AND status='rejected'",
                           (r["id"],)):
                continue  # בעל העסק דחה ⇒ אין תזכורות נוספות לחשבונית הזו
            done = self.db.one("SELECT COUNT(*) n FROM reminders WHERE invoice_id=?",
                               (r["id"],))["n"]
            if done >= MAX_REMINDERS_PER_INVOICE or not r["due"]:
                continue
            due_at = datetime.combine(date.fromisoformat(r["due"]), time(10), TZ)
            eligible = due_at + timedelta(days=STEP_OFFSETS_DAYS[done])
            if now < eligible:
                continue
            last = _dt(r["last_sent_at"])
            earliest = max(now, last + timedelta(hours=72)) if last else now
            when = self.policy.next_allowed(earliest)
            to = normalize_il_phone(r["cphone"])
            t = templates.STEPS[done]
            params = templates.params_for(
                client_name=r["cname"], business=self.s.business_name, number=r["number"],
                amount_agorot=r["amount_agorot"], currency=r["currency"],
                payment_link=self.s.payment_link)
            body = templates.render(t, params)
            payload = build_template_payload(to or "INVALID", t.wa_name, params)
            # אישור בעלים: הודעה ראשונה ללקוח, וכל "הודעה אחרונה"
            needs = (not r["approved_first"]) or t.key == "final"
            status = "pending_approval" if needs else "approved"
            block = None if to else "invalid_phone"
            if block:
                status = "pending_approval"
            rid = self.db.x(
                "INSERT INTO reminders(invoice_id,step,template_key,scheduled_for,status,"
                "requires_approval,body,payload,block_reason) VALUES(?,?,?,?,?,?,?,?,?)",
                (r["id"], done, t.key, _iso(when), status, int(needs or bool(block)), body,
                 json.dumps(payload, ensure_ascii=False), block))
            created.append(rid)
        if created:
            self.audit("system", "plan", {"created": created})
        return created

    # ---------- owner decisions ----------
    def approve(self, reminder_id: int, actor: str = "owner") -> dict:
        r = self._reminder(reminder_id)
        if r["status"] != "pending_approval":
            raise ValueError(f"לא ממתינה לאישור (status={r['status']})")
        if r["block_reason"] == "invalid_phone":
            raise ValueError("מספר טלפון לא תקין — יש לתקן בחשבונית ירוקה ולסנכרן")
        self.db.x("UPDATE reminders SET status='approved', decided_at=? WHERE id=?",
                  (_iso(self.clock()), reminder_id))
        cid = self._invoice(r["invoice_id"])["customer_id"]
        self.db.x("UPDATE customers SET approved_first=1 WHERE id=?", (cid,))
        self.audit(actor, "approve", {"reminder": reminder_id})
        return dict(self._reminder(reminder_id))

    def reject(self, reminder_id: int, actor: str = "owner") -> dict:
        r = self._reminder(reminder_id)
        if r["status"] not in ACTIVE:
            raise ValueError(f"לא ניתן לדחות (status={r['status']})")
        self.db.x("UPDATE reminders SET status='rejected', decided_at=? WHERE id=?",
                  (_iso(self.clock()), reminder_id))
        self.audit(actor, "reject", {"reminder": reminder_id})
        return dict(self._reminder(reminder_id))

    # ---------- dispatch (dry-run) ----------
    def dispatch(self) -> list[dict]:
        now = self.clock()
        out: list[dict] = []
        if not self.policy.can_send_at(now):
            return out
        rows = self.db.q("SELECT * FROM reminders WHERE status='approved' AND scheduled_for<=? "
                         "ORDER BY scheduled_for", (_iso(now),))
        for r in rows:
            inv = self._invoice(r["invoice_id"])
            cust = self.db.one("SELECT * FROM customers WHERE id=?", (inv["customer_id"],))
            reason = self._customer_block(cust["id"])
            if inv["status"] != "open":
                reason = "invoice_closed"
            if reason:
                self.db.x("UPDATE reminders SET status='cancelled', block_reason=? WHERE id=?",
                          (reason, r["id"]))
                continue
            if not gap_ok(_dt(cust["last_sent_at"]), now):
                continue  # ננסה בסבב הבא
            msg_id = self.sender.send(json.loads(r["payload"]))
            self.db.x("UPDATE reminders SET status='sent_dry_run', sent_at=?, message_id=? "
                      "WHERE id=?", (_iso(now), msg_id, r["id"]))
            self.db.x("UPDATE customers SET last_sent_at=? WHERE id=?", (_iso(now), cust["id"]))
            self.db.x("INSERT INTO messages(customer_id,direction,body,message_id,payload,"
                      "created_at) VALUES(?,?,?,?,?,?)",
                      (cust["id"], "out", r["body"], msg_id, r["payload"], _iso(now)))
            out.append({"reminder_id": r["id"], "message_id": msg_id, "dry_run": True})
        if out:
            self.audit("system", "dispatch_dry_run", {"count": len(out)})
        return out

    # ---------- inbound ----------
    def inbound(self, phone: str, text: str) -> dict:
        now = self.clock()
        norm = normalize_il_phone(phone)
        cust = next((c for c in self.db.q("SELECT * FROM customers")
                     if normalize_il_phone(c["phone"]) == norm), None) if norm else None
        if cust is None:
            self.db.x("INSERT INTO messages(customer_id,direction,body,intent,needs_owner,"
                      "created_at) VALUES(NULL,'in',?, 'unknown_sender', 1, ?)", (text, _iso(now)))
            return {"intent": "unknown_sender", "escalate": True, "auto_reply": None}
        d = assistant.decide(text, business=self.s.business_name, payment_link=self.s.payment_link)
        self.db.x("INSERT INTO messages(customer_id,direction,body,intent,needs_owner,created_at)"
                  " VALUES(?,'in',?,?,?,?)",
                  (cust["id"], text, d.intent.value, int(d.escalate), _iso(now)))
        if d.intent == assistant.Intent.OPT_OUT:
            self.db.x("UPDATE customers SET opted_out=1 WHERE id=?", (cust["id"],))
        if d.intent == assistant.Intent.DISPUTE:
            self.db.x("UPDATE customers SET disputed=1 WHERE id=?", (cust["id"],))
        if d.stop_reminders:
            for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (cust["id"],)):
                self._cancel_invoice(inv["id"], d.intent.value)
        plan_id = None
        if d.intent == assistant.Intent.PLAN_REQUEST:
            plan_id = self.propose_plan(cust["id"])
        sent = None
        # מענה אוטומטי רק אחרי שבעל העסק אישר הודעה ראשונה ללקוח הזה, ובתוך חלון 24ש׳
        if d.auto_reply and cust["approved_first"] and norm:
            sent = self.sender.send(build_text_payload(norm, d.auto_reply))
            self.db.x("INSERT INTO messages(customer_id,direction,body,message_id,created_at) "
                      "VALUES(?,'out',?,?,?)", (cust["id"], d.auto_reply, sent, _iso(now)))
        self.audit("customer", "inbound", {"intent": d.intent.value, "customer": cust["id"]})
        return {"intent": d.intent.value, "escalate": d.escalate,
                "auto_reply": d.auto_reply if sent else None, "plan_id": plan_id}

    # ---------- plans ----------
    def propose_plan(self, customer_id: int, installments: int | None = None) -> int | None:
        inv = self.db.one("SELECT * FROM invoices WHERE customer_id=? AND status='open' "
                          "ORDER BY due LIMIT 1", (customer_id,))
        if not inv:
            return None
        items = plans.propose(inv["amount_agorot"], self.clock().date() + timedelta(days=7),
                              installments)
        data = [{"n": i.n, "due": i.due.isoformat(), "amount_agorot": i.amount_agorot}
                for i in items]
        pid = self.db.x("INSERT INTO plans(customer_id,invoice_id,installments,status,created_at)"
                        " VALUES(?,?,?, 'proposed', ?)",
                        (customer_id, inv["id"], json.dumps(data), _iso(self.clock())))
        self.audit("system", "plan_proposed", {"plan": pid})
        return pid

    def approve_plan(self, plan_id: int, actor: str = "owner") -> dict:
        p = self.db.one("SELECT * FROM plans WHERE id=?", (plan_id,))
        if not p or p["status"] != "proposed":
            raise ValueError("הסדר לא קיים או כבר הוכרע")
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (p["customer_id"],))
        inv = self._invoice(p["invoice_id"])
        lines = "\n".join(f"{i['n']}. {i['due']} — {templates.fmt_amount(i['amount_agorot'])}"
                          for i in json.loads(p["installments"]))
        text = (f"שלום {cust['name']}, הצעת פריסה לחשבונית {inv['number']} ללא תוספת:\n{lines}\n"
                "השיבו \"מאשר\" ובעל העסק יאשר סופית.")
        self.db.x("UPDATE plans SET status='approved' WHERE id=?", (plan_id,))
        norm = normalize_il_phone(cust["phone"])
        msg = self.sender.send(build_text_payload(norm, text)) if norm else None
        self.audit(actor, "plan_approved", {"plan": plan_id, "message_id": msg})
        return {"plan_id": plan_id, "message_id": msg, "text": text}

    # ---------- helpers ----------
    def _reminder(self, rid: int):
        r = self.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
        if not r:
            raise KeyError(rid)
        return r

    def _invoice(self, iid: int):
        return self.db.one("SELECT * FROM invoices WHERE id=?", (iid,))

    def _customer_block(self, cid: int) -> str | None:
        c = self.db.one("SELECT opted_out, disputed FROM customers WHERE id=?", (cid,))
        plan = self.db.one("SELECT 1 FROM plans WHERE customer_id=? AND status IN "
                           "('proposed','approved')", (cid,))
        return customer_blocked(opted_out=bool(c["opted_out"]), disputed=bool(c["disputed"]),
                                plan_active=bool(plan))

    def _cancel_invoice(self, iid: int, reason: str) -> None:
        self.db.x("UPDATE reminders SET status='cancelled', block_reason=? "
                  "WHERE invoice_id=? AND status IN (?,?)", (reason, iid, *ACTIVE))
