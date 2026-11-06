"""תזמור: סנכרון ⇒ תכנון תור ⇒ אישור בעלים ⇒ שליחה (dry-run, SMS+מייל) ⇒ מענה לתשובות."""
from __future__ import annotations

import json
import secrets
from collections.abc import Callable
from datetime import date, datetime, time, timedelta
from typing import Any

from . import assistant, paylinks, plans, templates
from .channels import (
    SMS_ADAPTERS,
    DryRunSender,
    Message,
    SmtpEmail,
    is_il_mobile,
    message_from_json,
    message_to_json,
    normalize_il_phone,
    valid_email,
)
from .config import SafetyError, Settings
from .db import DB
from .greeninvoice import GreenInvoiceClient, GreenInvoiceError, Invoice
from .policy import MAX_REMINDERS_PER_INVOICE, TZ, Policy, customer_blocked, gap_ok

# ימים אחרי מועד-התשלום לכל שלב
STEP_OFFSETS_DAYS = (1, 7, 14, 30)
ACTIVE = ("pending_approval", "approved")
HARD_BLOCKS = {"no_contact", "no_payment_link"}


def _iso(dt: datetime) -> str:
    return dt.astimezone(TZ).isoformat(timespec="seconds")


def _dt(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s) if s else None


def build_dry_sender(s: Settings) -> DryRunSender:
    sms_cls = SMS_ADAPTERS[s.sms_provider]
    if s.sms_provider == "twilio":
        sms = sms_cls(token=s.sms_token, sender=s.sms_sender_id)
    else:
        sms = sms_cls(username=s.sms_username, token=s.sms_token, sender=s.sms_sender_id)
    return DryRunSender(sms=sms, email=SmtpEmail(sender=s.email_from, reply_to=s.email_reply_to))


class CollectService:
    def __init__(self, settings: Settings, db: DB, *, sender: DryRunSender | None = None,
                 gi: GreenInvoiceClient | None = None,
                 clock: Callable[[], datetime] | None = None) -> None:
        if not settings.dry_run:
            raise SafetyError("שלב 1: dry-run בלבד")
        self.s = settings
        self.db = db
        self.sender = sender or build_dry_sender(settings)
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
                "INSERT INTO customers(external_id,name,phone,email,unsub_token) "
                "VALUES(?,?,?,?,?) ON CONFLICT(external_id) DO UPDATE SET name=excluded.name, "
                "phone=excluded.phone, email=excluded.email",
                (cust_ext, inv.client_name, inv.client_phone, inv.client_email,
                 secrets.token_urlsafe(9)))
            cid = self.db.one("SELECT id FROM customers WHERE external_id=?", (cust_ext,))["id"]
            self.db.x(
                "INSERT INTO invoices(external_id,number,doc_type,amount_agorot,currency,issued,"
                "due,customer_id,status,payment_url,synced_at) "
                "VALUES(?,?,?,?,?,?,?,?, 'open', ?, ?) "
                "ON CONFLICT(external_id) DO UPDATE SET amount_agorot=excluded.amount_agorot, "
                "due=excluded.due, status='open', synced_at=excluded.synced_at, "
                "payment_url=COALESCE(NULLIF(excluded.payment_url,''), invoices.payment_url)",
                (inv.external_id, inv.number, inv.doc_type, inv.amount_agorot, inv.currency,
                 inv.issued.isoformat() if inv.issued else None,
                 inv.due.isoformat() if inv.due else None, cid, inv.payment_url, now))
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

    # ---------- payment link ----------
    def _payment_link(self, inv_row) -> str | None:
        url = inv_row["payment_url"] or ""
        if not url and self.s.payment_link_mode == "greeninvoice_form" and self.gi is not None:
            try:
                url = self.gi.create_payment_form(self._invoice_obj(inv_row))
                self.db.x("UPDATE invoices SET payment_url=? WHERE id=?", (url, inv_row["id"]))
            except GreenInvoiceError as e:
                self.audit("system", "payment_form_failed", {"invoice": inv_row["id"],
                                                             "error": str(e)})
                url = ""
        return paylinks.resolve(doc_link=url, static_link=self.s.payment_link,
                                number=inv_row["number"], allowed=self.s.payment_domains)

    def _invoice_obj(self, r) -> Invoice:
        c = self.db.one("SELECT * FROM customers WHERE id=?", (r["customer_id"],))
        return Invoice(r["external_id"], r["number"], r["doc_type"], r["amount_agorot"],
                       r["currency"], None, None, c["external_id"], c["name"], c["phone"],
                       c["email"])

    def unsub_url(self, token: str) -> str:
        return f"{self.s.public_base_url}/u/{token}"

    # ---------- message building ----------
    def build_messages(self, inv_row, cust, step: templates.Step,
                       link: str) -> tuple[list[Message], str | None]:
        unsub = self.unsub_url(cust["unsub_token"])
        f = templates.fields(biz=self.s.business_name, name=cust["name"], num=inv_row["number"],
                             amount_agorot=inv_row["amount_agorot"],
                             currency=inv_row["currency"], link=link, unsub=unsub)
        msgs: list[Message] = []
        phone = normalize_il_phone(cust["phone"])
        if "sms" in self.s.channels and is_il_mobile(phone):
            msgs.append(Message("sms", phone, templates.render_sms(step, f)))
        if "email" in self.s.channels and valid_email(cust["email"]):
            subj, text, html = templates.render_email(step, f)
            msgs.append(Message("email", cust["email"], text, subject=subj, html=html,
                                unsubscribe_url=unsub))
        return msgs, (None if msgs else "no_contact")

    # ---------- planning ----------
    def plan(self) -> list[int]:
        now = self.clock()
        created: list[int] = []
        rows = self.db.q("SELECT * FROM invoices WHERE status='open'")
        for r in rows:
            cust = self.db.one("SELECT * FROM customers WHERE id=?", (r["customer_id"],))
            if self._customer_block(cust["id"]):
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
            if now < due_at + timedelta(days=STEP_OFFSETS_DAYS[done]):
                continue
            last = _dt(cust["last_sent_at"])
            earliest = max(now, last + timedelta(hours=72)) if last else now
            when = self.policy.next_allowed(earliest)
            step = templates.STEPS[done]
            link = self._payment_link(r)
            msgs, block = self.build_messages(r, cust, step, link or "")
            if link is None:
                block = "no_payment_link"
            # אישור בעלים: הודעה ראשונה ללקוח, וכל "הודעה אחרונה"
            needs = (not cust["approved_first"]) or step.key == "final" or bool(block)
            rid = self.db.x(
                "INSERT INTO reminders(invoice_id,step,template_key,scheduled_for,status,"
                "requires_approval,body,payload,block_reason) VALUES(?,?,?,?,?,?,?,?,?)",
                (r["id"], done, step.key, _iso(when),
                 "pending_approval" if needs else "approved", int(needs),
                 msgs[0].body if msgs else "",
                 "[" + ",".join(message_to_json(m) for m in msgs) + "]", block))
            created.append(rid)
        if created:
            self.audit("system", "plan", {"created": created})
        return created

    def preview(self, reminder_id: int) -> dict:
        r = self._reminder(reminder_id)
        msgs = [Message(**m) for m in json.loads(r["payload"])]
        return {"reminder_id": reminder_id, "status": r["status"],
                "block_reason": r["block_reason"], "template_key": r["template_key"],
                "scheduled_for": r["scheduled_for"],
                "messages": [self.sender.preview(m) for m in msgs]}

    # ---------- owner decisions ----------
    def approve(self, reminder_id: int, actor: str = "owner") -> dict:
        r = self._reminder(reminder_id)
        if r["status"] != "pending_approval":
            raise ValueError(f"לא ממתינה לאישור (status={r['status']})")
        if r["block_reason"] in HARD_BLOCKS:
            raise ValueError({"no_contact": "אין נייד או מייל תקין ללקוח — יש לעדכן בחשבונית ירוקה",
                              "no_payment_link": "אין קישור תשלום מאובטח — יש להגדיר PAYMENT_LINK"
                              }[r["block_reason"]])
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
            reason = "invoice_closed" if inv["status"] != "open" else self._customer_block(
                cust["id"])
            if reason:
                self.db.x("UPDATE reminders SET status='cancelled', block_reason=? WHERE id=?",
                          (reason, r["id"]))
                continue
            if not gap_ok(_dt(cust["last_sent_at"]), now):
                continue  # ננסה בסבב הבא
            ids = []
            for m in json.loads(r["payload"]):
                msg = Message(**m)
                mid = self.sender.send(msg)
                ids.append(mid)
                self._log_out(cust["id"], msg, mid, now)
            self.db.x("UPDATE reminders SET status='sent_dry_run', sent_at=?, message_id=? "
                      "WHERE id=?", (_iso(now), ",".join(ids), r["id"]))
            self.db.x("UPDATE customers SET last_sent_at=? WHERE id=?", (_iso(now), cust["id"]))
            out.append({"reminder_id": r["id"], "message_ids": ids, "dry_run": True})
        if out:
            self.audit("system", "dispatch_dry_run", {"count": len(out)})
        return out

    # ---------- inbound ----------
    def _find_customer(self, channel: str, sender: str):
        if channel == "email":
            e = (sender or "").strip().lower()
            return self.db.one("SELECT * FROM customers WHERE lower(email)=?", (e,)) if e else None
        norm = normalize_il_phone(sender)
        if not norm:
            return None
        return next((c for c in self.db.q("SELECT * FROM customers")
                     if normalize_il_phone(c["phone"]) == norm), None)

    def inbound(self, channel: str, sender: str, text: str) -> dict:
        if channel not in ("sms", "email"):
            raise ValueError("ערוץ לא נתמך")
        now = self.clock()
        cust = self._find_customer(channel, sender)
        if cust is None:
            self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                      "created_at) VALUES(NULL,'in',?,?, 'unknown_sender', 1, ?)",
                      (channel, text, _iso(now)))
            return {"intent": "unknown_sender", "escalate": True, "auto_reply": None}
        oldest = self.db.one("SELECT * FROM invoices WHERE customer_id=? AND status='open' "
                             "ORDER BY due LIMIT 1", (cust["id"],))
        link = (self._payment_link(oldest) if oldest else None) or ""
        d = assistant.decide(text, business=self.s.business_name, payment_link=link)
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "created_at) VALUES(?,'in',?,?,?,?,?)",
                  (cust["id"], channel, text, d.intent.value, int(d.escalate), _iso(now)))
        if d.intent == assistant.Intent.OPT_OUT:
            self._opt_out(cust["id"], "reply")
        if d.intent == assistant.Intent.DISPUTE:
            self.db.x("UPDATE customers SET disputed=1 WHERE id=?", (cust["id"],))
        if d.intent == assistant.Intent.PAID_CLAIM:
            # "שילמתי" ⇒ השהיה עד שבעל העסק בודק (resume) או שהחשבונית נסגרת בסנכרון.
            # באג שנתפס בהדגמה: בלי זה הסבב הבא שלח שוב תזכורת ללקוח שאמר ששילם.
            self.db.x("UPDATE customers SET paused_reason='paid_claim' WHERE id=?",
                      (cust["id"],))
        if d.stop_reminders:
            for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (cust["id"],)):
                self._cancel_invoice(inv["id"], d.intent.value)
        plan_id = None
        if d.intent == assistant.Intent.PLAN_REQUEST:
            plan_id = self.propose_plan(cust["id"])
        sent = None
        # מענה אוטומטי רק אחרי שבעל העסק אישר הודעה ראשונה ללקוח הזה, ובאותו ערוץ
        if d.auto_reply and cust["approved_first"]:
            sent = self._reply(cust, channel, d.auto_reply, now)
        self.audit("customer", "inbound", {"intent": d.intent.value, "customer": cust["id"],
                                           "channel": channel})
        return {"intent": d.intent.value, "escalate": d.escalate,
                "auto_reply": d.auto_reply if sent else None, "plan_id": plan_id}

    def sms_webhook_019(self, raw: bytes) -> dict:
        import hashlib
        from urllib.parse import parse_qs

        key = "019:" + hashlib.sha256(raw).hexdigest()
        if self.db.one("SELECT 1 FROM messages WHERE message_id=?", (key,)):
            return {"ok": True, "duplicate": True}
        f = {k: v[0] for k, v in parse_qs(raw.decode("utf-8", "replace")).items()}
        kind = f.get("type", "incoming_sms")
        if kind == "blacklist" and f.get("phone"):
            cust = self._find_customer("sms", f["phone"])
            if cust:
                self._opt_out(cust["id"], "carrier_blacklist")
            res: dict = {"ok": True, "kind": kind}
        elif kind == "incoming_sms" and f.get("phone") and f.get("message") is not None:
            res = {"ok": True, "kind": kind, **self.inbound("sms", f["phone"], f["message"])}
        else:
            res = {"ok": True, "kind": kind, "ignored": True}   # dlr ⇒ שלב 2
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,message_id,created_at)"
                  " VALUES(NULL,'webhook','sms',?,?,?)", (kind, key, _iso(self.clock())))
        return res

    def unsubscribe(self, token: str) -> bool:
        c = self.db.one("SELECT id FROM customers WHERE unsub_token=?", (token,))
        if not c:
            return False
        self._opt_out(c["id"], "link")
        return True

    def _opt_out(self, cid: int, how: str) -> None:
        self.db.x("UPDATE customers SET opted_out=1 WHERE id=?", (cid,))
        for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (cid,)):
            self._cancel_invoice(inv["id"], "opted_out")
        self.audit("customer", "opt_out", {"customer": cid, "via": how})

    def _reply(self, cust, channel: str, text: str, now: datetime) -> str | None:
        if channel == "sms":
            to = normalize_il_phone(cust["phone"])
            if not is_il_mobile(to):
                return None
            msg = Message("sms", to, f"{self.s.business_name}: {text}")
        else:
            if not valid_email(cust["email"]):
                return None
            msg = Message("email", cust["email"], text,
                          subject=f"תשובה מ-{self.s.business_name}")
        mid = self.sender.send(msg)
        self._log_out(cust["id"], msg, mid, now)
        return mid

    def _log_out(self, cid: int, msg: Message, mid: str, now: datetime) -> None:
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,message_id,payload,"
                  "created_at) VALUES(?,?,?,?,?,?,?)",
                  (cid, "out", msg.channel, msg.body, mid, message_to_json(msg), _iso(now)))

    def resume_customer(self, customer_id: int, actor: str = "owner") -> dict:
        """בעל העסק בדק: התשלום לא התקבל ⇒ חידוש תזכורות ללקוח."""
        c = self.db.one("SELECT * FROM customers WHERE id=?", (customer_id,))
        if not c:
            raise KeyError(customer_id)
        if not c["paused_reason"]:
            raise ValueError("הלקוח לא מושהה")
        self.db.x("UPDATE customers SET paused_reason=NULL WHERE id=?", (customer_id,))
        self.audit(actor, "resume_customer", {"customer": customer_id, "was": c["paused_reason"]})
        return dict(self.db.one("SELECT * FROM customers WHERE id=?", (customer_id,)))

    # ---------- dashboard ----------
    def dashboard(self) -> dict:
        """תמונת מצב לבעל העסק: כל החובות הפתוחים + סטטוס התזכורת האחרונה לכל אחד."""
        today = self.clock().date()
        rows = []
        for r in self.db.q("SELECT i.*, c.name cname, c.phone cphone, c.email cemail, "
                           "c.opted_out, c.disputed, c.paused_reason FROM invoices i "
                           "JOIN customers c ON c.id=i.customer_id ORDER BY i.due, i.id"):
            last = self.db.one("SELECT * FROM reminders WHERE invoice_id=? ORDER BY step DESC, "
                               "id DESC LIMIT 1", (r["id"],))
            sent = self.db.one("SELECT COUNT(*) n FROM reminders WHERE invoice_id=? AND "
                               "status='sent_dry_run'", (r["id"],))["n"]
            due = date.fromisoformat(r["due"]) if r["due"] else None
            block = self._customer_block(r["customer_id"])
            rows.append({
                "invoice_id": r["id"], "number": r["number"], "customer": r["cname"],
                "phone": r["cphone"], "email": r["cemail"], "amount_agorot": r["amount_agorot"],
                "currency": r["currency"], "due": r["due"], "status": r["status"],
                "days_overdue": (today - due).days if due and r["status"] == "open" else 0,
                "reminders_sent": sent,
                "last_reminder": None if not last else {
                    "id": last["id"], "step": last["step"], "status": last["status"],
                    "template_key": last["template_key"], "sent_at": last["sent_at"],
                    "block_reason": last["block_reason"]},
                "customer_block": block})
        open_rows = [x for x in rows if x["status"] == "open"]
        outbox = self.sender.sent
        return {
            "today": today.isoformat(),
            "totals": {
                "open_invoices": len(open_rows),
                "open_agorot": sum(x["amount_agorot"] for x in open_rows),
                "overdue_agorot": sum(x["amount_agorot"] for x in open_rows
                                      if x["days_overdue"] > 0),
                "closed_invoices": len(rows) - len(open_rows),
                "pending_approval": self.db.one("SELECT COUNT(*) n FROM reminders WHERE "
                                                "status='pending_approval'")["n"],
                "sent_sms": sum(m["channel"] == "sms" for m in outbox),
                "sent_email": sum(m["channel"] == "email" for m in outbox),
                "owner_inbox": self.db.one("SELECT COUNT(*) n FROM messages WHERE "
                                           "needs_owner=1")["n"]},
            "invoices": rows}

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
        now = self.clock()
        channel = "sms" if is_il_mobile(normalize_il_phone(cust["phone"])) else "email"
        msg = self._reply(cust, channel, text, now)
        self.audit(actor, "plan_approved", {"plan": plan_id, "message_id": msg})
        return {"plan_id": plan_id, "message_id": msg, "channel": channel, "text": text}

    # ---------- helpers ----------
    def _reminder(self, rid: int):
        r = self.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
        if not r:
            raise KeyError(rid)
        return r

    def _invoice(self, iid: int):
        return self.db.one("SELECT * FROM invoices WHERE id=?", (iid,))

    def _customer_block(self, cid: int) -> str | None:
        c = self.db.one("SELECT opted_out, disputed, paused_reason FROM customers WHERE id=?",
                        (cid,))
        plan = self.db.one("SELECT 1 FROM plans WHERE customer_id=? AND status IN "
                           "('proposed','approved')", (cid,))
        return customer_blocked(opted_out=bool(c["opted_out"]), disputed=bool(c["disputed"]),
                                plan_active=bool(plan), paused=c["paused_reason"])

    def _cancel_invoice(self, iid: int, reason: str) -> None:
        self.db.x("UPDATE reminders SET status='cancelled', block_reason=? "
                  "WHERE invoice_id=? AND status IN (?,?)", (reason, iid, *ACTIVE))


__all__ = ["CollectService", "build_dry_sender", "message_from_json"]
