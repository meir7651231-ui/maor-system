"""תזמור: סנכרון ⇒ תכנון תור ⇒ אישור בעלים ⇒ שליחה (dry-run, SMS+מייל) ⇒ מענה לתשובות."""
from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
from collections.abc import Callable
from datetime import date, datetime, time, timedelta
from typing import Any

from . import compliance, paylinks, plans, templates
from .channels import (
    DryRunSender,
    Message,
    build_adapters,
    is_il_mobile,
    message_from_json,
    message_to_json,
    normalize_il_phone,
    valid_email,
)
from .config import SafetyError, Settings
from .db import DB, token_hash
from .greeninvoice import GreenInvoiceClient, Invoice
from .integrations.base import IntegrationError
from .policy import (
    MANUAL_ONLY_AFTER_DAYS,
    MAX_REMINDERS_PER_INVOICE,
    OWNER_HOLDS,
    RETENTION_DAYS,
    TZ,
    Policy,
    customer_blocked,
    gap_ok,
)

# ימים אחרי מועד-התשלום לכל שלב
STEP_OFFSETS_DAYS = (1, 7, 14)   # 3 תזכורות לכל היותר (הכרעת מאיר) ⇒ עצירה + התראה לבעל העסק
ACTIVE = ("pending_approval", "approved")
HARD_BLOCKS = {"no_contact", "no_payment_link", "compliance", "no_reply_to"}
_B62 = "abcdefghijkmnpqrstuvwxyz23456789"  # אותיות קטנות+ספרות, בלי 0/o/1/l (קריא, ~31 ביט)


def _iso(dt: datetime) -> str:
    return dt.astimezone(TZ).isoformat(timespec="seconds")


def _dt(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s) if s else None


def build_dry_sender(s: Settings) -> DryRunSender:
    """adapters של app/integrations (שכבת הספקים היחידה) במצב dry-run."""
    sms, email = build_adapters(provider=s.sms_provider, username=s.sms_username, token=s.sms_token,
                                sender=s.sms_sender_id, email_from=s.email_from,
                                backup_username=s.sms_backup_username,
                                backup_token=s.sms_backup_token)
    return DryRunSender(sms=sms, email=email, reply_to=s.email_reply_to)


class CollectService:
    def __init__(self, settings: Settings, db: DB, *, sender: DryRunSender | None = None,
                 gi: GreenInvoiceClient | None = None,
                 clock: Callable[[], datetime] | None = None) -> None:
        if not settings.dry_run:
            raise SafetyError("שלב 1: dry-run בלבד")
        from . import settings_api
        self.db = db
        # הגדרות שבעל העסק שמר דרך /api/settings גוברות על ברירות המחדל (בלי סודות)
        settings = settings_api.overlay(settings, settings_api.load_overrides(db))
        self.s = settings
        self._custom_sender = sender is not None
        self.sender = sender or build_dry_sender(settings)
        if getattr(self.sender, "mode", None) != "dry_run":
            raise SafetyError("שלב 1: רק DryRunSender מותר")
        self.gi = gi
        self.policy = Policy(frozenset(settings.holidays))
        self.clock = clock or (lambda: datetime.now(TZ))

    # ---------- הגדרות עסק (API מאומת) ----------
    def settings_view(self) -> dict:
        from . import settings_api
        return {**settings_api.public_view(self.s), "profile": settings_api.profile(self.db)}

    def design_settings(self) -> dict:
        from . import settings_api
        has_csv = self.db.one("SELECT 1 FROM invoices WHERE source='csv' LIMIT 1") is not None
        return settings_api.design_view(self.s, self.db, api_connected=self.gi is not None,
                                        has_csv=has_csv)

    def update_design_settings(self, body: dict) -> dict:
        from . import settings_api
        if isinstance(body, dict):
            bad = settings_api.reject_secret_fields(body)
            if bad:
                raise PermissionError("סודות לא נשלחים דרך ה-API: " + ", ".join(bad))
        self.update_settings(settings_api.from_design(body))
        return self.design_settings()

    def update_settings(self, raw: dict, actor: str = "owner") -> dict:
        from pydantic import ValidationError

        from . import settings_api
        if not isinstance(raw, dict):
            raise ValueError("גוף הבקשה חייב להיות אובייקט JSON")
        bad = settings_api.reject_secret_fields(raw)
        if bad:
            raise PermissionError("סודות לא נשלחים דרך ה-API (רק בסביבה/בכספת): " + ", ".join(bad))
        try:
            data = settings_api.SettingsIn.model_validate(raw)
        except ValidationError as e:
            raise ValueError("; ".join(f"{'.'.join(map(str, x['loc']))}: {x['msg']}"
                                       for x in e.errors())) from None
        new, keys = settings_api.apply(self.s, data)
        settings_api.save_overrides(self.db, new, keys, _iso(self.clock()))
        keys += settings_api.save_profile(self.db, data, _iso(self.clock()))
        self.s = new
        self.policy = Policy(frozenset(new.holidays))
        if not self._custom_sender:
            self.sender = build_dry_sender(new) if not self.sender.sent else \
                _rebuild_keep_log(self.sender, new)
        self.audit(actor, "settings_updated", {"fields": keys})
        return self.settings_view()

    # ---------- audit ----------
    def audit(self, actor: str, action: str, detail: Any = None) -> None:
        self.db.x("INSERT INTO audit(at,actor,action,detail) VALUES(?,?,?,?)",
                  (_iso(self.clock()), actor, action,
                   json.dumps(detail, ensure_ascii=False) if detail is not None else None))

    # ---------- sync ----------
    @staticmethod
    def customer_key(inv: Invoice) -> str:
        """ממצא מבקר 2.0.2: לקוחות בלי מזהה ובלי טלפון התמזגו ל-"phone:" ⇒ חוב של א' למייל של ב'.
        סדר: מזהה GI ⇒ מייל ⇒ טלפון מנורמל ⇒ מזהה המסמך. לעולם לא ריק ולא משותף בטעות."""
        if inv.client_external_id:
            return inv.client_external_id
        if valid_email(inv.client_email):
            return "email:" + inv.client_email.strip().lower()
        norm = normalize_il_phone(inv.client_phone)
        if norm:
            return "phone:" + norm
        return "doc:" + inv.external_id

    def ingest(self, invoices: list[Invoice], *, source: str = "api",
               full: bool = True) -> dict[str, int]:
        """upsert. full=True (סנכרון API מלא): חשבונית פתוחה שנעלמה ⇒ נסגרה ⇒ ביטול תזכורות.
        ייבוא CSV חלקי (full=False) לא סוגר חשבוניות שלא הופיעו בקובץ."""
        now = _iso(self.clock())
        seen: set[str] = set()
        for inv in invoices:
            if inv.status != 0 or inv.amount_agorot <= 0:
                continue   # ממצא 2.10: רק «פתוח» עם יתרה חיובית הוא חוב
            seen.add(inv.external_id)
            cust_ext = self.customer_key(inv)
            self.db.x(
                "INSERT INTO customers(external_id,name,phone,email) "
                "VALUES(?,?,?,?) ON CONFLICT(external_id) DO UPDATE SET name=excluded.name, "
                # ר-3: טלפון/מייל שסומנו «מספר שגוי» לא חוזרים, גם אם עדיין רשומים בחשבונית ירוקה
                "phone=CASE WHEN customers.blocked_phone=excluded.phone THEN NULL "
                "ELSE excluded.phone END, "
                "email=CASE WHEN customers.blocked_email=excluded.email THEN NULL "
                "ELSE excluded.email END",
                (cust_ext, inv.client_name, inv.client_phone, inv.client_email))
            cid = self.db.one("SELECT id FROM customers WHERE external_id=?", (cust_ext,))["id"]
            self.db.x(
                "INSERT INTO invoices(external_id,number,doc_type,amount_agorot,currency,issued,"
                "due,customer_id,status,payment_url,synced_at,source) "
                "VALUES(?,?,?,?,?,?,?,?, 'open', ?, ?, ?) "
                "ON CONFLICT(external_id) DO UPDATE SET amount_agorot=excluded.amount_agorot, "
                "due=excluded.due, status='open', synced_at=excluded.synced_at, "
                "source=excluded.source, "
                # סכום השתנה (תשלום חלקי) ⇒ טופס התשלום השמור נבנה על הסכום הישן ⇒ לא בשימוש
                "payment_url=CASE WHEN invoices.amount_agorot<>excluded.amount_agorot "
                "THEN NULLIF(excluded.payment_url,'') "
                "ELSE COALESCE(NULLIF(excluded.payment_url,''), invoices.payment_url) END",
                (inv.external_id, inv.number, inv.doc_type, inv.amount_agorot, inv.currency,
                 inv.issued.isoformat() if inv.issued else None,
                 inv.due.isoformat() if inv.due else None, cid, inv.payment_url, now, source))
        closed = 0
        if not full:
            self.audit("system", "import", {"source": source, "rows": len(seen)})
            return {"open": len(seen), "closed": 0}
        for row in self.db.q("SELECT id, external_id FROM invoices WHERE status='open'"):
            if row["external_id"] not in seen:
                self.db.x("UPDATE invoices SET status='closed', closed_at=? WHERE id=?",
                          (now, row["id"]))
                self._cancel_invoice(row["id"], "invoice_closed")
                closed += 1
        self.audit("system", "sync", {"open": len(seen), "closed": closed})
        return {"open": len(seen), "closed": closed}

    def sync(self) -> dict[str, int]:
        if self.gi is None:
            raise RuntimeError("לא הוגדר חיבור Green Invoice (sandbox)")
        return self.ingest(list(self.gi.iter_open_invoices()))

    def import_csv(self, raw: bytes, actor: str = "owner") -> dict:
        """חלופה ל-API: ייבוא חלקי (לא סוגר חשבוניות שלא בקובץ). שגיאות לפי שורה."""
        from . import csv_import
        res = csv_import.parse(raw)
        counts = self.ingest(res.invoices, source="csv", full=False)
        self.audit(actor, "csv_import", {"rows": len(res.invoices), "errors": len(res.errors)})
        return {"imported": counts["open"], "errors": res.errors}

    # ---------- payment link ----------
    def _payment_link(self, inv_row) -> str | None:
        """קישור לעמוד התשלום של העסק (Green Invoice/Meshulam/Bit) — רק מדומיין מותר.
        לא נוצר שום מסמך/דף תשלום בחשבונית ירוקה (ממצא מבקר 2.0.5; הכרעת מאיר 6.11)."""
        return paylinks.resolve(doc_link=inv_row["payment_url"] or "",
                                static_link=self.s.payment_page, number=inv_row["number"],
                                allowed=self.s.allowed_payment_domains)

    def _invoice_obj(self, r) -> Invoice:
        c = self.db.one("SELECT * FROM customers WHERE id=?", (r["customer_id"],))
        return Invoice(r["external_id"], r["number"], r["doc_type"], r["amount_agorot"],
                       r["currency"], None, None, c["external_id"], c["name"], c["phone"],
                       c["email"])

    def _short_code(self, inv_row) -> str:
        if inv_row["short_code"]:
            return inv_row["short_code"]
        while True:
            code = "".join(secrets.choice(_B62) for _ in range(7))
            if not self.db.one("SELECT 1 FROM invoices WHERE short_code=?", (code,)):
                break
        self.db.x("UPDATE invoices SET short_code=? WHERE id=?", (code, inv_row["id"]))
        return code

    def short_url(self, inv_row) -> str:
        return f"{self.s.public_base_url}/p/{self._short_code(inv_row)}"

    def new_unsub_token(self, customer_id: int) -> str:
        """טוקן חדש (128 ביט, ממצא 2.3.1) לכל הודעה. ב-DB נשמר רק ה-sha256 ⇒ הקישורים הישנים
        ממשיכים לעבוד, ודליפת הטבלאות לא מאפשרת להסיר לקוחות בשמם."""
        tok = secrets.token_urlsafe(16)
        self.db.x("INSERT INTO link_tokens(token_hash,customer_id,kind,created_at) "
                  "VALUES(?,?, 'unsub', ?)", (token_hash(tok), customer_id, _iso(self.clock())))
        return tok

    def _unsub_customer(self, token: str):
        if not token or len(token) > 64:
            return None
        return self.db.one("SELECT customer_id id FROM link_tokens WHERE token_hash=? "
                           "AND kind='unsub'", (token_hash(token),))

    def unsub_url(self, token: str) -> str:
        return f"{self.s.public_base_url}/u/{token}"

    # ---------- message building ----------
    def build_messages(self, inv_row, cust, step: templates.Step,
                       link: str) -> tuple[list[Message], str | None]:
        unsub = self.unsub_url(self.new_unsub_token(cust["id"]))
        short = self.short_url(inv_row)
        f = templates.fields(biz=self.s.business_name, name=cust["name"], num=inv_row["number"],
                             amount_agorot=inv_row["amount_agorot"],
                             currency=inv_row["currency"], link=link, unsub=unsub, short=short,
                             two_way=self.s.sms_two_way)
        msgs: list[Message] = []
        phone = normalize_il_phone(cust["phone"])
        if "sms" in self.s.channels and is_il_mobile(phone):
            sms = templates.render_sms(step, f)
            # ר-1 (team/legal.md): מסנן הניסוח חוסם — לא מזהיר
            bad = compliance.violations(sms, compliance.Rules(
                business=self.s.business_name, payment_link=short,
                max_sms_chars=templates.SMS_HARD_MAX, allow_debt_word=step.key not in (
                    "friendly", "second")))
            if bad:
                return [], "compliance"
            msgs.append(Message("sms", phone, sms))
        email_ok = "email" in self.s.channels and valid_email(cust["email"])
        # review חור 6: המייל אומר «השיבו למייל הזה». בלי Reply-To לתיבה של העסק (או ל-inbound שלנו)
        # «שילמתי» הולך לכתובת מתה והתזכורות ממשיכות ⇒ ערוץ המייל חסום עד שמוגדר Reply-To.
        if email_ok and valid_email(self.s.email_reply_to):
            subj, text, html = templates.render_email(step, f)
            msgs.append(Message("email", cust["email"], text, subject=subj, html=html,
                                unsubscribe_url=unsub))
        if msgs:
            return msgs, None
        return msgs, ("no_reply_to" if email_ok else "no_contact")

    # ---------- שער שליחה יחיד (ממצא מבקר 2.6 §5) ----------
    @staticmethod
    def addr_hash(channel: str, addr: str) -> str:
        norm = normalize_il_phone(addr) if channel == "sms" else (addr or "").strip().lower()
        return hashlib.sha256(f"{channel}:{norm or addr}".encode()).hexdigest()

    def suppress(self, channel: str, addr: str, reason: str) -> None:
        if not addr:
            return
        self.db.x("INSERT OR IGNORE INTO suppressions(hash,channel,reason,created_at) "
                  "VALUES(?,?,?,?)", (self.addr_hash(channel, addr), channel, reason,
                                      _iso(self.clock())))

    def suppressed(self, channel: str, addr: str) -> bool:
        return bool(addr) and self.db.one("SELECT 1 FROM suppressions WHERE hash=?",
                                          (self.addr_hash(channel, addr),)) is not None

    def gate(self, cust, channel: str, to: str, *, opt_out_ack: bool = False) -> str | None:
        """כל הודעה יוצאת עוברת כאן: תזכורת, תשובה, אישור פריסה. None ⇒ מותר עכשיו.
        'outside_window' ⇒ מותר מאוחר יותר (נשאר בתור); כל ערך אחר ⇒ אסור."""
        if not self.trial()["active"]:
            return "trial_expired"
        if not opt_out_ack and (cust["opted_out"] or self.suppressed(channel, to)):
            return "opted_out"
        if self.policy.reason_closed(self.clock()):
            return "outside_window"
        return None

    # ---------- ניסיון 14 יום ----------
    def trial(self) -> dict:
        """ניסיון: בסופו התזכורות נעצרות (הנתונים נשמרים) עד הצטרפות. אין trial_start ⇒ פעיל."""
        info = {"price_ils_month": self.s.price_ils_month, "trial_days": self.s.trial_days}
        if not self.s.trial_start:
            return {**info, "on_trial": False, "active": True, "days_left": None}
        start = date.fromisoformat(self.s.trial_start)
        left = self.s.trial_days - (self.clock().date() - start).days
        return {**info, "on_trial": True, "active": left > 0, "days_left": max(left, 0),
                "ends": (start + timedelta(days=self.s.trial_days)).isoformat()}

    # ---------- planning ----------
    def plan(self) -> list[int]:
        now = self.clock()
        if not self.trial()["active"]:
            return []
        # באג: release_expired_pauses לא נקרא מאף מקום ⇒ "אשלם בחמישי" שלא שולם השהה לנצח
        self.inbox.release_expired_pauses()
        self.purge_closed()   # ר-10: זול, פעם בסבב
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
            born = r["issued"] or r["due"]
            if born and (now.date() - date.fromisoformat(born)).days > MANUAL_ONLY_AFTER_DAYS:
                self._notify_too_old(r, cust)   # ר-7: אין שום אוטומציה, רק התראה אחת
                continue
            done = self.db.one("SELECT COUNT(*) n FROM reminders WHERE invoice_id=?",
                               (r["id"],))["n"]
            if done >= MAX_REMINDERS_PER_INVOICE:
                self._notify_exhausted(r, cust)
                continue
            if not r["due"]:
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
            # אישור פרטני (הכרעת מאיר, בטא = טיוטות בלבד): כל תזכורת ממתינה לאישור בעל העסק
            payload = "[" + ",".join(message_to_json(m) for m in msgs) + "]"
            rid = self.db.x(
                "INSERT INTO reminders(invoice_id,step,template_key,scheduled_for,status,"
                "requires_approval,body,payload,block_reason,template_version,body_hash) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                (r["id"], done, step.key, _iso(when), "pending_approval", 1,
                 msgs[0].body if msgs else "", payload, block, templates.template_version(),
                 _sha(payload)))
            created.append(rid)
        if created:
            self.audit("system", "plan", {"created": created})
        return created

    def _csv_unverified(self) -> int:
        last = self.db.one("SELECT MAX(synced_at) m FROM invoices WHERE source='csv'")["m"]
        if not last:
            return 0
        return self.db.one("SELECT COUNT(*) n FROM invoices WHERE source='csv' AND status='open' "
                           "AND synced_at < ?", (last,))["n"]

    def _notify_exhausted(self, inv_row, cust) -> None:
        """אחרי 3 תזכורות שנשלחו והחשבונית עדיין פתוחה ⇒ עצירה + התראה אחת לבעל העסק."""
        sent = self.db.one("SELECT COUNT(*) n FROM reminders WHERE invoice_id=? AND "
                           "status LIKE 'sent%'", (inv_row["id"],))["n"]
        if sent < MAX_REMINDERS_PER_INVOICE:
            return
        if self.db.one("SELECT 1 FROM messages WHERE intent='max_reminders' AND message_id=?",
                       (f"inv:{inv_row['id']}",)):
            return
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(?,'system','owner',?,'max_reminders',1,?,?)",
                  (cust["id"], f"נשלחו {MAX_REMINDERS_PER_INVOICE} תזכורות לחשבונית "
                   f"{inv_row['number']} ({cust['name']}) והיא עדיין פתוחה. התזכורות האוטומטיות "
                   "נעצרו — מומלץ קשר אישי.", f"inv:{inv_row['id']}", _iso(self.clock())))
        self.audit("system", "max_reminders_reached", {"invoice": inv_row["id"]})

    def _notify_too_old(self, inv_row, cust) -> None:
        key = f"old:{inv_row['id']}"
        if self.db.one("SELECT 1 FROM messages WHERE intent='manual_only_old' AND message_id=?",
                       (key,)):
            return
        self._cancel_invoice(inv_row["id"], "manual_only_old")
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(?,'system','owner',?,'manual_only_old',1,?,?)",
                  (cust["id"], f"חשבונית {inv_row['number']} ({cust['name']}) בת יותר מ-3 שנים. "
                   "גבי לא שולחת עליה תזכורות אוטומטיות — לטיפול ידני בלבד.", key,
                   _iso(self.clock())))
        self.audit("system", "manual_only_old", {"invoice": inv_row["id"]})

    # ---------- ר-6: סימון בעל העסק (קטין / נפטר / חדלות פירעון) ----------
    def set_hold(self, customer_id: int, reason: str, note: str = "", actor: str = "owner") -> dict:
        """השהיה קשה (כמו זו שמנוע השיחה קובע): עוצרת הכול, רק בעל העסק משחרר (resume)."""
        if reason not in OWNER_HOLDS:
            raise ValueError(f"סימון לא מוכר: {reason}")
        c = self.db.one("SELECT * FROM customers WHERE id=?", (customer_id,))
        if not c:
            raise KeyError(customer_id)
        self.db.x("UPDATE customers SET paused_reason=? WHERE id=?", (reason, customer_id))
        for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (customer_id,)):
            self._cancel_invoice(inv["id"], reason)
        note_id = self._owner_note(customer_id, "hold_note", note)
        self.audit(actor, "customer_hold", {"customer": customer_id, "reason": reason,
                                            "note_id": note_id})
        return dict(self.db.one("SELECT * FROM customers WHERE id=?", (customer_id,)))

    # ---------- ר-10: legal hold + מחיקה/התממה אחרי 90 יום ----------
    def set_legal_hold(self, customer_id: int, note: str | None, actor: str = "owner") -> dict:
        """note מתועד ⇒ פטור ממחיקה; None/"" ⇒ ביטול. שניהם נרשמים ב-audit."""
        if not self.db.one("SELECT 1 FROM customers WHERE id=?", (customer_id,)):
            raise KeyError(customer_id)
        val = (note or "").strip() or None
        if val is not None and len(val) < 10:
            raise ValueError("legal hold דורש סיבה מתועדת (תיק, בקשת עו״ד, חובה חוקית)")
        self.db.x("UPDATE customers SET legal_hold=? WHERE id=?", (val, customer_id))
        # הסיבה עצמה נשמרת ב-customers.legal_hold (מתרוקן בשחרור); ב-audit רק עובדה + מזהה הערה
        note_id = self._owner_note(customer_id, "legal_hold_note", val or "")
        self.audit(actor, "legal_hold", {"customer": customer_id, "on": val is not None,
                                         "note_id": note_id})
        return dict(self.db.one("SELECT * FROM customers WHERE id=?", (customer_id,)))

    def purge_closed(self) -> dict[str, int]:
        """חוב סגור מעל 90 יום ⇒ ריקון תוכן ההודעות והתממת הלקוח (כשאין לו חוב פתוח),
        אלא אם יש legal hold מתועד. רשימת ההסרה (suppressions, גיבוב בלבד) ו-audit נשארים."""
        cutoff = _iso(self.clock() - timedelta(days=RETENTION_DAYS))
        now = _iso(self.clock())
        inv_n = cust_n = 0
        for r in self.db.q("SELECT i.id FROM invoices i JOIN customers c ON c.id=i.customer_id "
                           "WHERE i.status='closed' AND i.purged_at IS NULL AND i.closed_at "
                           "IS NOT NULL AND i.closed_at<=? AND c.legal_hold IS NULL", (cutoff,)):
            self.db.x("UPDATE reminders SET body='', payload='[]' WHERE invoice_id=?", (r["id"],))
            self.db.x("UPDATE invoices SET purged_at=?, payment_url=NULL WHERE id=?",
                      (now, r["id"]))
            inv_n += 1
        for c in self.db.q("SELECT id FROM customers WHERE purged_at IS NULL AND "
                           "legal_hold IS NULL"):
            left = self.db.one("SELECT COUNT(*) n FROM invoices WHERE customer_id=? AND "
                               "purged_at IS NULL", (c["id"],))["n"]
            if left or not self.db.one("SELECT 1 FROM invoices WHERE customer_id=?", (c["id"],)):
                continue
            self.db.x("UPDATE messages SET body='', payload=NULL WHERE customer_id=?", (c["id"],))
            # QA: גם טיוטות (כתובת יעד + גוף + סיכום לבעל העסק), מצב שיחה וטוקני הסרה
            if self._table_exists("drafts"):
                self.db.x("UPDATE drafts SET to_addr=NULL, body='', owner_summary=NULL, "
                          "owner_actions=NULL WHERE customer_id=?", (c["id"],))
            if self._table_exists("conversations"):
                self.db.x("UPDATE conversations SET offered_plan=NULL WHERE customer_id=?",
                          (c["id"],))
            self.db.x("DELETE FROM link_tokens WHERE customer_id=?", (c["id"],))
            self.db.x("UPDATE customers SET name=NULL, phone=NULL, email=NULL, blocked_phone=NULL,"
                      " blocked_email=NULL, purged_at=? WHERE id=?", (now, c["id"]))
            cust_n += 1
        # QA: הודעה משולח לא מוכר (customer_id=NULL) = PII של מי שאינו לקוח ⇒ 90 יום מקבלתה
        unk = self.db.q("SELECT id FROM messages WHERE customer_id IS NULL AND direction='in' "
                        "AND body<>'' AND created_at<=?", (cutoff,))
        for m in unk:
            self.db.x("UPDATE messages SET body='', payload=NULL WHERE id=?", (m["id"],))
        if inv_n or cust_n or unk:
            self.audit("system", "retention_purge", {"invoices": inv_n, "customers": cust_n,
                                                     "unknown_messages": len(unk)})
        return {"invoices": inv_n, "customers": cust_n}

    def _table_exists(self, name: str) -> bool:
        return self.db.one("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
                           (name,)) is not None

    def _owner_note(self, customer_id: int, intent: str, note: str) -> int | None:
        """טקסט חופשי של בעל העסק (יכול להכיל שם/טלפון) נשמר כהודעה של הלקוח — נמחק עם
        הלקוח (ר-10) — ולא ב-audit, שהוא הוספה-בלבד ולא נמחק לעולם."""
        note = (note or "").strip()[:500]
        if not note:
            return None
        return self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,"
                         "needs_owner,created_at) VALUES(?,'note','owner',?,?,0,?)",
                         (customer_id, note, intent, _iso(self.clock())))

    def preview(self, reminder_id: int) -> dict:
        r = self._reminder(reminder_id)
        msgs = [Message(**m) for m in json.loads(r["payload"])]
        return {"reminder_id": reminder_id, "status": r["status"],
                "block_reason": r["block_reason"], "template_key": r["template_key"],
                "scheduled_for": r["scheduled_for"],
                "messages": [self.sender.preview(m) for m in msgs]}

    # ---------- owner decisions ----------
    def approve(self, reminder_id: int, actor: str = "owner", *, confirm_open: bool = False) -> dict:
        r = self._reminder(reminder_id)
        if r["status"] != "pending_approval":
            raise ValueError(f"לא ממתינה לאישור (status={r['status']})")
        inv = self._invoice(r["invoice_id"])
        if inv["source"] == "csv" and not confirm_open:
            # review חור 7: ב-CSV אין מקור לרענון ⇒ בעל העסק מאשר במפורש שהסכום עדיין פתוח
            raise ValueError("חשבונית מ-CSV: יש לאשר במפורש שהסכום עדיין פתוח (confirm_open). "
                             "האישור תקף 24 שעות")
        if r["block_reason"] in HARD_BLOCKS:
            raise ValueError({"no_contact": "אין נייד או מייל תקין ללקוח — יש לעדכן בחשבונית ירוקה",
                              "no_payment_link": "אין קישור תשלום מאובטח — יש להגדיר PAYMENT_LINK",
                              "compliance": "הנוסח נחסם במסנן הניסוח (מילה אסורה/ארוך מדי) — "
                                            "יש לתקן את שם העסק או את הנוסח",
                              "no_reply_to": "ללקוח יש רק מייל, ולא הוגדרה כתובת תשובה (Reply-To) "
                                             "לעסק — הגדירו אותה ב-/settings"
                              }[r["block_reason"]])
        h = _sha(r["payload"])
        self.db.x("UPDATE reminders SET status='approved', decided_at=?, approved_hash=?, "
                  "approved_version=?, approved_by=?, body_hash=? WHERE id=?",
                  (_iso(self.clock()), h, r["template_version"] or templates.template_version(),
                   actor, h, reminder_id))
        cid = self._invoice(r["invoice_id"])["customer_id"]
        self.db.x("UPDATE customers SET approved_first=1 WHERE id=?", (cid,))
        # ר-12: מי אישר, מתי, איזו גרסת נוסח ואיזה גוף בדיוק (גיבוב)
        self.audit(actor, "approve", {"reminder": reminder_id, "body_sha256": h,
                                      "template_version": r["template_version"],
                                      "confirm_open": bool(confirm_open)})
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
        if not self.policy.can_send_at(now) or not self.trial()["active"]:
            return out
        rows = self.db.q("SELECT * FROM reminders WHERE status='approved' AND scheduled_for<=? "
                         "ORDER BY scheduled_for", (_iso(now),))
        for r in rows:
            # ר-12: אושר בדיוק הגוף הזה ובגרסת הנוסח הנוכחית? אחרת האישור בטל
            if r["approved_hash"] != _sha(r["payload"]) or \
                    (r["approved_version"] or "") != templates.template_version():
                self._invalidate(r, "approval_invalidated")
                continue
            # ר-4: רענון מהמקור לפני כל שליחה; כשל ⇒ לא שולחים
            fresh = self._refresh_before_send(r)
            if fresh != "ok":
                continue
            r = self._reminder(r["id"])
            inv = self._invoice(r["invoice_id"])
            cust = self.db.one("SELECT * FROM customers WHERE id=?", (inv["customer_id"],))
            reason = self._customer_block(cust["id"])
            if reason:
                self.db.x("UPDATE reminders SET status='cancelled', block_reason=? WHERE id=?",
                          (reason, r["id"]))
                continue
            if not gap_ok(_dt(cust["last_sent_at"]), now):
                continue  # ננסה בסבב הבא
            ids = []
            failed = False
            for m in json.loads(r["payload"]):
                msg = Message(**m)
                if self.gate(cust, msg.channel, msg.to):
                    continue
                try:
                    mid = self.sender.send(msg)
                except IntegrationError as e:
                    # כל ספקי הערוץ נכשלו (019 ⇒ InforU) ⇒ לא מסמנים "נשלח" ⇒ ננסה בסבב הבא
                    self.audit("system", "send_failed", {"reminder": r["id"],
                                                         "channel": msg.channel,
                                                         "error": str(e)[:300]})
                    failed = True
                    continue
                ids.append(mid)
                self._log_out(cust["id"], msg, mid, now)
            if failed and not ids:
                continue
            if not ids:
                self.db.x("UPDATE reminders SET status='cancelled', block_reason='opted_out' "
                          "WHERE id=?", (r["id"],))
                continue
            self.db.x("UPDATE reminders SET status='sent_dry_run', sent_at=?, message_id=? "
                      "WHERE id=?", (_iso(now), ",".join(ids), r["id"]))
            self.db.x("UPDATE customers SET last_sent_at=? WHERE id=?", (_iso(now), cust["id"]))
            out.append({"reminder_id": r["id"], "message_ids": ids, "dry_run": True})
        if out:
            self.audit("system", "dispatch_dry_run", {"count": len(out)})
        return out

    def _invalidate(self, r, why: str) -> None:
        self.db.x("UPDATE reminders SET status='pending_approval', approved_hash=NULL, "
                  "approved_version=NULL, approved_by=NULL, block_reason=? WHERE id=?",
                  (why, r["id"]))
        self.audit("system", why, {"reminder": r["id"]})

    def _refresh_before_send(self, r) -> str:
        """ר-4: הסכום, הסטטוס והקשר נבדקים מול המקור רגע לפני השליחה.
        'ok' ⇒ אפשר לשלוח. אחרת התזכורת לא נשלחת:
          • נסגרה/נמחקה ⇒ בוטלה · • הסכום השתנה ⇒ נבנתה מחדש וחוזרת לאישור
          • כשל ברענון ⇒ נשארת מאושרת ולא נשלחת (block_reason=refresh_failed), ננסה שוב
          • CSV (אין API) ⇒ תקף 24 שעות מהייבוא; אחרי כן נדרש ייבוא חדש."""
        inv = self._invoice(r["invoice_id"])
        if inv["status"] != "open":
            self.db.x("UPDATE reminders SET status='cancelled', block_reason='invoice_closed' "
                      "WHERE id=?", (r["id"],))
            return "closed"
        if inv["source"] == "csv":
            # review חור 7: תוקף 24 שעות **מאישור «הסכום עדיין פתוח»**, לא מהייבוא. פג ⇒ חוזר לאישור
            approved = _dt(r["decided_at"])
            if approved is None or self.clock() - approved > timedelta(hours=24):
                self._invalidate(r, "csv_stale")
                return "failed"
            return "ok"
        if self.gi is None:
            self._mark_refresh_failed(r, "refresh_failed")
            return "failed"
        try:
            doc = self.gi.get_document(inv["external_id"])
        except KeyError:
            doc = None
        except Exception as e:  # noqa: BLE001 — כל כשל ברענון חוסם שליחה
            self._mark_refresh_failed(r, "refresh_failed", str(e))
            return "failed"
        if doc is None or doc.status != 0 or doc.amount_agorot <= 0:
            self.db.x("UPDATE invoices SET status='closed' WHERE id=?", (inv["id"],))
            self._cancel_invoice(inv["id"], "invoice_closed")
            self.db.x("UPDATE reminders SET status='cancelled', block_reason='invoice_closed' "
                      "WHERE id=?", (r["id"],))
            self.audit("system", "refresh_closed", {"invoice": inv["id"]})
            return "closed"
        self.db.x("UPDATE invoices SET synced_at=? WHERE id=?", (_iso(self.clock()), inv["id"]))
        if doc.amount_agorot != inv["amount_agorot"]:
            # טופס תשלום ישן = הסכום הישן ⇒ מאופס, ו-_payment_link בונה חדש על היתרה
            self.db.x("UPDATE invoices SET amount_agorot=?, payment_url=NULL WHERE id=?",
                      (doc.amount_agorot, inv["id"]))
            inv = self._invoice(inv["id"])
            cust = self.db.one("SELECT * FROM customers WHERE id=?", (inv["customer_id"],))
            msgs, block = self.build_messages(inv, cust, templates.STEPS[r["step"]],
                                              self._payment_link(inv) or "")
            payload = "[" + ",".join(message_to_json(m) for m in msgs) + "]"
            self.db.x("UPDATE reminders SET payload=?, body=?, body_hash=? WHERE id=?",
                      (payload, msgs[0].body if msgs else "", _sha(payload), r["id"]))
            self._invalidate(r, "amount_changed")
            self.audit("system", "amount_changed", {"invoice": inv["id"],
                                                    "to_agorot": doc.amount_agorot})
            return "changed"
        if r["block_reason"] in ("refresh_failed", "csv_stale"):
            self.db.x("UPDATE reminders SET block_reason=NULL WHERE id=?", (r["id"],))
        return "ok"

    def _mark_refresh_failed(self, r, why: str, err: str = "") -> None:
        self.db.x("UPDATE reminders SET block_reason=? WHERE id=?", (why, r["id"]))
        self.audit("system", why, {"reminder": r["id"], "error": err[:200]})

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

    @property
    def inbox(self):
        """מנוע השיחה (app/conversation.py) מחובר ל-DB (app/inbox.py). נוצר בפעם הראשונה."""
        if getattr(self, "_inbox", None) is None:
            from .inbox import ConversationInbox
            self._inbox = ConversationInbox(self)
        return self._inbox

    def inbound(self, channel: str, sender: str, text: str) -> dict:
        """תשובת לקוח ⇒ מנוע השיחה: עצירה/השהיה/הסלמה מיד, ותשובה = טיוטה לאישור בעל העסק.
        (assistant.py הוסר — docs/MIGRATION-assistant.md.)"""
        return self.inbox.handle(channel, sender, text)

    def _handle(self, cust, channel: str, text: str) -> dict:
        """channel='web' = פעולה מעמוד הקישור הקצר: אין טיוטת תשובה (העמוד עצמו מאשר),
        אבל כל ההשפעות (השהיה/הסדר/הסלמה) חלות כרגיל."""
        return self.inbox.handle_customer(cust, channel, text)

    # ---------- עמוד הקישור הקצר (/p/{code}) ----------
    def landing(self, code: str) -> dict:
        inv = self.db.one("SELECT * FROM invoices WHERE short_code=?", (code,))
        if not inv:
            raise KeyError(code)
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (inv["customer_id"],))
        return {"code": code, "business": self.s.business_name, "number": inv["number"],
                "amount": templates.fmt_amount(inv["amount_agorot"], inv["currency"]),
                "due": inv["due"], "open": inv["status"] == "open",
                "opted_out": bool(cust["opted_out"]),
                "pay_url": self._payment_link(inv) if inv["status"] == "open" else None,
                "_cust": cust}

    LANDING_TEXT = {"plan": "אני מבקש פריסה לתשלומים", "paid": "שילמתי"}

    def landing_action(self, code: str, action: str, installments: int | None = None) -> dict:
        info = self.landing(code)
        cust = info["_cust"]
        if action == "stop":
            self._opt_out(cust["id"], "landing")
            return {"action": "stop", "ok": True}
        if action not in self.LANDING_TEXT:
            raise ValueError("פעולה לא מוכרת")
        text = self.LANDING_TEXT[action]
        if action == "plan" and installments:
            text += f" ב-{int(installments)} תשלומים"
        res = self._handle(cust, "web", text)
        return {"action": action, "ok": True, **res}

    def email_webhook(self, sender: str, text: str, message_id: str = "") -> dict:
        """מייל נכנס (ספק inbound-parse כלשהו, מנורמל ל-from/text/message_id). אידמפוטנטי."""
        import hashlib

        from .channels import parse_address, strip_reply

        key = "mail:" + (message_id or hashlib.sha256(f"{sender}|{text}".encode()).hexdigest())
        if self.db.one("SELECT 1 FROM messages WHERE message_id=?", (key,)):
            return {"ok": True, "duplicate": True}
        addr, body = parse_address(sender), strip_reply(text)
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,message_id,created_at)"
                  " VALUES(NULL,'webhook','email','inbound',?,?)", (key, _iso(self.clock())))
        if not addr or not body:
            return {"ok": True, "ignored": True}
        return {"ok": True, **self.inbound("email", addr, body)}

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
        elif kind == "dlr":
            from .integrations.sms import parse_019_dlr
            pid, st = parse_019_dlr(f)
            res = {"ok": True, "kind": kind, **self.delivery_report("019", pid, st)} if pid \
                else {"ok": True, "kind": kind, "ignored": True}
        else:
            res = {"ok": True, "kind": kind, "ignored": True}
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,message_id,created_at)"
                  " VALUES(NULL,'webhook','sms',?,?,?)", (kind, key, _iso(self.clock())))
        return res

    def has_unsub_token(self, token: str) -> bool:
        return self._unsub_customer(token) is not None

    def unsubscribe(self, token: str) -> bool:
        c = self._unsub_customer(token)
        if not c:
            return False
        self._opt_out(c["id"], "link")
        return True

    def _opt_out(self, cid: int, how: str) -> None:
        self.db.x("UPDATE customers SET opted_out=1 WHERE id=?", (cid,))
        c = self.db.one("SELECT phone, email FROM customers WHERE id=?", (cid,))
        # ממצא 2.5: הסרה לפי כתובת, לא רק לפי רשומת לקוח (טלפון משותף / לקוח כפול)
        self.suppress("sms", c["phone"] or "", how)
        self.suppress("email", c["email"] or "", how)
        for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (cid,)):
            self._cancel_invoice(inv["id"], "opted_out")
        self.audit("customer", "opt_out", {"customer": cid, "via": how})

    def _reply(self, cust, channel: str, text: str, now: datetime) -> str | None:
        """שליחה ביוזמת בעל העסק (למשל אישור פריסה). עוברת בשער ונושאת קישור הסרה (ממצא 2.3.5).
        מחוץ לחלון ⇒ לא נשלחת עכשיו (None); המתקשר אחראי לתור."""
        unsub = self.unsub_url(self.new_unsub_token(cust["id"]))
        if channel == "sms":
            to = normalize_il_phone(cust["phone"])
            if not is_il_mobile(to):
                return None
            msg = Message("sms", to, f"{self.s.business_name}: {text} להסרה: {unsub}")
        else:
            if not valid_email(cust["email"]):
                return None
            msg = Message("email", cust["email"], f"{text}\n\nלהסרה מתזכורות: {unsub}",
                          subject=f"תשובה מ-{self.s.business_name}", unsubscribe_url=unsub)
        if self.gate(cust, channel, msg.to):
            return None
        mid = self.sender.send(msg)
        self._log_out(cust["id"], msg, mid, now)
        return mid

    def _log_out(self, cid: int, msg: Message, mid: str, now: datetime) -> None:
        provider, pid = getattr(self.sender, "provider_ids", {}).get(mid, (None, None))
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,message_id,payload,"
                  "created_at,provider,provider_id,delivery_status) VALUES(?,?,?,?,?,?,?,?,?,?)",
                  (cid, "out", msg.channel, msg.body, mid, message_to_json(msg), _iso(now),
                   provider, pid or None, "sent" if pid else None))

    def delivery_report(self, provider: str, provider_id: str, status: str) -> dict:
        """DLR מהספק ⇒ עדכון ההודעה היוצאת. 'failed' ⇒ התראה לבעל העסק (לא הסרה אוטומטית:
        מספר שלא קיבל יכול להיות תקלה זמנית אצל המפעיל — ההחלטה של בעל העסק)."""
        row = self.db.one("SELECT * FROM messages WHERE direction='out' AND provider=? AND "
                          "provider_id=?", (provider, provider_id)) if provider_id else None
        if row is None:
            return {"matched": False}
        if row["delivery_status"] in ("delivered", "failed"):
            return {"matched": True, "status": row["delivery_status"], "final": True}
        now = _iso(self.clock())
        self.db.x("UPDATE messages SET delivery_status=?, delivery_at=? WHERE id=?",
                  (status, now, row["id"]))
        if status == "failed":
            self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                      "created_at) VALUES(?,'system','sms',?, 'sms_undelivered', 1, ?)",
                      (row["customer_id"], "ה-SMS לא נמסר ללקוח (דוח מסירה מהספק). "
                       "כדאי לבדוק את המספר בחשבונית ירוקה.", now))
            self.audit("system", "sms_undelivered", {"message": row["id"], "provider": provider})
        return {"matched": True, "status": status}

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
                "customer_id": r["customer_id"], "paused_reason": r["paused_reason"],
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
        closed = self.db.q("SELECT amount_agorot, closed_at FROM invoices WHERE status='closed'")
        collected = sum(r["amount_agorot"] for r in closed)
        open_amt = sum(x["amount_agorot"] for x in open_rows)
        late = [x["days_overdue"] for x in open_rows if x["days_overdue"] > 0]
        messaged = {r["customer_id"] for r in self.db.q(
            "SELECT DISTINCT customer_id FROM messages WHERE direction='out' AND customer_id IS NOT NULL")}
        replied = {r["customer_id"] for r in self.db.q(
            "SELECT DISTINCT customer_id FROM messages WHERE direction='in' AND customer_id IS NOT NULL")}
        replied &= messaged
        rich = {
            "collected_agorot": collected,
            "recovery_rate_pct": round(100 * collected / (collected + open_amt)) if collected + open_amt else 0,
            "avg_days_overdue": round(sum(late) / len(late)) if late else 0,
            "at_risk_agorot": sum(x["amount_agorot"] for x in open_rows if x["days_overdue"] > 60),
            "reminders_sent": self.db.one("SELECT COUNT(*) n FROM reminders WHERE "
                                          "status='sent_dry_run'")["n"],
            "customers_messaged": len(messaged),
            "reply_rate_pct": round(100 * len(replied) / len(messaged)) if messaged else 0,
        }
        return {
            "series": self._collection_series(today, closed),
            "today": today.isoformat(),
            "trial": self.trial(),
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
                                           "needs_owner=1")["n"],
                # review חור 7: חשבוניות CSV פתוחות שלא הופיעו בייבוא האחרון (אולי שולמו)
                "csv_unverified": self._csv_unverified(), **rich},
            "invoices": rows}

    def _collection_series(self, today: date, closed) -> list[dict]:
        """גבייה לפי שבוע, 8 השבועות האחרונים (ראשון–שבת), מ-closed_at. שבוע בלי גבייה = 0."""
        start = today - timedelta(days=(today.weekday() + 1) % 7)   # ראשון של השבוע הנוכחי
        weeks = [start - timedelta(weeks=i) for i in range(7, -1, -1)]
        out = [{"week": w.isoformat(), "collected_agorot": 0, "count": 0} for w in weeks]
        for r in closed:
            if not r["closed_at"]:
                continue
            d = datetime.fromisoformat(r["closed_at"]).date()
            idx = (d - weeks[0]).days // 7
            if 0 <= idx < len(out):
                out[idx]["collected_agorot"] += r["amount_agorot"]
                out[idx]["count"] += 1
        return out

    # ---------- עמוד החייב (/pay/{code}) — ציבורי, מינימום מידע ----------
    PAY_METHODS = ("bit", "apple_pay", "card")

    def payer_view(self, code: str) -> dict:
        """רק מה שהחייב צריך: שם העסק, מספר, סכום, מועד, מצב. בלי טלפון/מייל/טוקן הסרה."""
        info = self.landing(code)
        inv = self.db.one("SELECT amount_agorot, currency FROM invoices WHERE short_code=?", (code,))
        return {"code": code, "business": info["business"], "number": info["number"],
                "amount": info["amount"], "amount_agorot": inv["amount_agorot"],
                "currency": inv["currency"], "due": info["due"], "open": info["open"],
                "opted_out": info["opted_out"], "can_pay": bool(info["pay_url"]),
                "methods": list(self.PAY_METHODS) if info["pay_url"] else [],
                "plan_options": [2, 3, 4, 6], "dry_run": True}

    def payer_go(self, code: str, method: str) -> str:
        """בחירת אמצעי תשלום ⇒ דף התשלום המאובטח (חשבונית ירוקה תומכת ב-Bit/Apple Pay/כרטיס).
        יעד מאומת מול רשימת הדומיינים; גבי לא נוגע בפרטי תשלום."""
        if method not in self.PAY_METHODS:
            raise ValueError("אמצעי תשלום לא מוכר")
        info = self.landing(code)
        if not info["pay_url"]:
            raise ValueError("אין קישור תשלום זמין")
        self.audit("customer", "pay_click", {"invoice": info["number"], "method": method})
        return info["pay_url"]

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
        self._supersede_plan_drafts(plan_id)
        # ממצא מבקר 2.4: אישור פריסה נשלח דרך תור הטיוטות ⇒ אותו שער (הסרה, שבת/חג/שעות, ניסיון)
        # ובחלון סגור ממתין לחלון הבא במקום להישלח בשבת.
        channel = "sms" if is_il_mobile(normalize_il_phone(cust["phone"])) else "email"
        unsub = self.unsub_url(self.new_unsub_token(cust["id"]))
        body = (f"{self.s.business_name}: {text} להסרה: {unsub}" if channel == "sms"
                else f"{text}\n\nלהסרה מתזכורות: {unsub}")
        did = self.db.x(
            "INSERT INTO drafts(customer_id,channel,to_addr,body,intent,status,escalate,"
            "owner_summary,owner_actions,plan_id,created_at,decided_at,decided_by) "
            "VALUES(?,?,?,?, 'plan_offer', 'approved', 'none', ?, '[]', ?, ?, ?, ?)",
            (cust["id"], channel, self.inbox._addr(cust, channel), body,
             "הצעת פריסה שאושרה", plan_id, _iso(self.clock()), _iso(self.clock()), actor))
        sent = self.inbox._try_send(did)
        dr = self.db.one("SELECT status, message_id FROM drafts WHERE id=?", (did,))
        self.audit(actor, "plan_approved", {"plan": plan_id, "draft": did,
                                            "message_id": dr["message_id"]})
        return {"plan_id": plan_id, "message_id": dr["message_id"], "channel": channel,
                "text": text, "queued": not sent, "draft_status": dr["status"]}

    def _supersede_plan_drafts(self, plan_id: int) -> None:
        """אישור הפריסה ב-/plans שולח את ההצעה ללקוח, ולכן טיוטת plan_request המקבילה
        (תור «תשובות לקוחות») נסגרת — אחרת בעל העסק יכול לאשר אותה ולשלוח הצעה פעמיים."""
        try:
            self.db.x("UPDATE drafts SET status='superseded', decided_by='system:plan_approved' "
                      "WHERE plan_id=? AND status IN ('pending_approval','needs_owner')",
                      (plan_id,))
        except sqlite3.OperationalError:   # טבלת הטיוטות נוצרת רק עם מנוע השיחה
            return
        self.audit("system", "plan_drafts_superseded", {"plan": plan_id})

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


def _rebuild_keep_log(old: DryRunSender, s: Settings) -> DryRunSender:
    new = build_dry_sender(s)
    new.sent = old.sent          # יומן ה-dry-run נשמר
    return new


def _sha(payload: str) -> str:
    return hashlib.sha256((payload or "").encode()).hexdigest()


__all__ = ["CollectService", "build_dry_sender", "message_from_json"]
