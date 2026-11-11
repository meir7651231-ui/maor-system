"""תזמור: סנכרון ⇒ תכנון תור ⇒ אישור בעלים ⇒ שליחה (dry-run, SMS+מייל) ⇒ מענה לתשובות."""
from __future__ import annotations

import hashlib
import json
import re
import secrets
from collections.abc import Callable
from dataclasses import replace
from datetime import date, datetime, time, timedelta
from typing import Any

from . import compliance, orbit_entitlement, paylinks, plans, templates
from .channels import (
    DryRunSender,
    Message,
    build_adapters,
    clean_email,
    is_il_mobile,
    message_from_json,
    message_to_json,
    normalize_il_phone,
    valid_email,
)
from .config import SafetyError, Settings
from .db import DB, token_hash
from .greeninvoice import AS_OF, GreenInvoiceClient, Invoice, issued_in_far_future
from .integrations.base import IntegrationError
from .integrations.sources import (
    SOURCE_SYSTEMS,
    CreditAmbiguous,
    InvoiceSource,
    provider_of,
    source_provider,
)
from .policy import (
    APPROVAL_VALID_DAYS,
    MAX_REMINDERS_PER_INVOICE,
    OWNER_HOLDS,
    RETENTION_DAYS,
    TZ,
    Policy,
    amount_outlier,
    customer_blocked,
    gap_ok,
    invoice_too_old,
)
from .security import clean_client_name

# ימים אחרי מועד-התשלום לכל שלב
STEP_OFFSETS_DAYS = (1, 7, 14)   # 3 תזכורות לכל היותר (הכרעת מאיר) ⇒ עצירה + התראה לבעל העסק
ACTIVE = ("pending_approval", "approved")
AMOUNT_CHECK = "amount_check"   # הפעלה 123: סכום חריג ⇒ אישור מפורש (לא חסימה קשה)
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


TRIAL_WARN_DAYS = 3

class RealDataBlocked(PermissionError):
    """שער בטא 4: נתונים שאינם דמו מסומן נחסמים כל עוד REAL_DATA_ALLOWED כבוי."""


REAL_DATA_MSG = ("שלב בטא (dry-run): מותרים רק נתוני דמו מסומנים (טלפון 05X-000XXXX, מייל בדומיין example.*). "
                 "נתונים אמיתיים חסומים עד שמתקיימים שערי legal/BETA-GATE.md. לא נשמר דבר.")
_SYN_PHONE = re.compile(r"^(?:\+?972|0)5\d0000\d{3}$")


def _closable_by(provider: str, external_id: str) -> bool:
    """סנכרון מלא סוגר רק חשבוניות שהמקור הזה אחראי להן. חשבונית ירוקה — כמו תמיד (הכול, חוץ
    מחשבוניות של adapter אחר); iCount/רווחית/EZcount — רק חשבוניות עם הקידומת שלהם."""
    owner = provider_of(external_id)
    if provider == "greeninvoice":
        return owner in ("greeninvoice", "csv")
    return owner == provider


def is_synthetic_contact(phone: str, email: str) -> bool:
    """טלפון בטווח הדמו 05X-000XXXX (או ריק) ומייל בדומיין example.* (או ריק). חייב לפחות אחד."""
    ph = re.sub(r"[\s\-()]", "", phone or "")
    em = (email or "").strip().lower()
    ok_p = not ph or bool(_SYN_PHONE.match(ph))
    ok_e = not em or bool(re.fullmatch(r"[^@\s]+@(?:[\w-]+\.)*example\.(?:com|org|net)", em))
    return ok_p and ok_e


def _missing_doc_id(ext: str) -> bool:
    """מזהה מסמך ריק/חסר: "" · "None" · קידומת מקור בלבד ("ezcount:") · "ezcount:None"."""
    tail = (ext or "").split(":", 1)[-1].strip()
    return tail in ("", "None", "null")


class CollectService:
    def __init__(self, settings: Settings, db: DB, *, sender: DryRunSender | None = None,
                 gi: GreenInvoiceClient | InvoiceSource | None = None,
                 clock: Callable[[], datetime] | None = None,
                 source_factory: Callable[[str], InvoiceSource | None] | None = None) -> None:
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
        # מקור החשבוניות (app/integrations/sources.py). `gi` נשאר שם השדה מטעמי תאימות; הוא כל
        # InvoiceSource. מקורות שנבנו נשמרים, כך שחזרה למקור קודם לא מאבדת את החיבור שלו.
        self._sources: dict[str, InvoiceSource] = {source_provider(gi): gi} if gi is not None else {}
        self._source_factory = source_factory
        self.gi = gi
        self.policy = Policy(frozenset(settings.holidays))
        self.clock = clock or (lambda: datetime.now(TZ))
        if gi is not None and settings.source_system != source_provider(gi):
            self._switch_source(settings.source_system)

    # ---------- מקור החשבוניות ----------
    def _switch_source(self, system: str) -> None:
        """בחירת מקור. CSV ⇒ אין API. מקור שלא חובר (אין סודות/factory) ⇒ None ⇒ «לא מחובר»."""
        if system == "csv":
            self.gi = None
            return
        if system not in self._sources and self._source_factory is not None:
            built = self._source_factory(system)
            if built is not None:
                self._sources[system] = built
        self.gi = self._sources.get(system)

    @property
    def source_system(self) -> str:
        return self.s.source_system

    def _source_owns(self, external_id: str) -> bool:
        """רענון רק מול המקור שממנו הגיעה החשבונית. מזהה של ספק אחר ⇒ לא שואלים (ולא סוגרים)."""
        return _closable_by(source_provider(self.gi), external_id)

    # ---------- הגדרות עסק (API מאומת) ----------
    def settings_view(self) -> dict:
        from . import settings_api
        return {**settings_api.public_view(self.s), "profile": settings_api.profile(self.db)}

    def design_settings(self) -> dict:
        from . import settings_api
        has_csv = self.db.one("SELECT 1 FROM invoices WHERE source='csv' LIMIT 1") is not None
        connected = self.gi is not None and source_provider(self.gi) == self.s.source_system
        return settings_api.design_view(self.s, self.db, api_connected=connected, has_csv=has_csv)

    def update_design_settings(self, body: dict, actor: str = "owner") -> dict:
        from . import settings_api
        if isinstance(body, dict):
            bad = settings_api.reject_secret_fields(body)
            if bad:
                raise PermissionError("סודות לא נשלחים דרך ה-API: " + ", ".join(bad))
        self.update_settings(settings_api.from_design(body), actor)
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
        switched = new.source_system != self.s.source_system
        self.s = new
        if switched:
            self._switch_source(new.source_system)
            self.audit(actor, "source_system_changed", {"to": new.source_system,
                                                        "connected": self.gi is not None})
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

    # ---------- תיעוד גישה (תקנות אבטחת מידע) ----------
    def log_access(self, actor: str, method: str, route: str, path: str) -> None:
        self.db.x("INSERT INTO access_log(at,actor,method,route,path) VALUES(?,?,?,?,?)",
                  (_iso(self.clock()), actor, method, route, path[:300]))

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

    @staticmethod
    def _norm_name(name: str | None) -> str:
        # הפעלה 115: אותו ניקוי כמו בתזכורת — "\\u200fדוד כהן" ו-"None" לא מפצלים לקוח בשקר
        return clean_client_name(name)

    def _customer_key_db(self, inv: Invoice) -> str:
        """critic סבב 26 (2.11): בלי מזהה לקוח, המפתח הוא מייל/טלפון — ושני אנשים שונים עם אותו
        טלפון (משפחה, משרד) התמזגו: השם נדרס והתזכורת המאוחדת חשפה את החוב של אחד לשני. עכשיו: אם
        כבר קיים לקוח במפתח הזה **בשם אחר** ⇒ מפתח נפרד לפי השם, והודעה אחת לבעל העסק. אותו שם (גם
        עם רווחים שונים) או לקוח קיים בלי שם ⇒ אותו מפתח, כך שמיפויים קיימים לא זזים."""
        key = self.customer_key(inv)
        if inv.client_external_id or key.startswith("doc:"):
            return key
        name = self._norm_name(inv.client_name)
        row = self.db.one("SELECT name FROM customers WHERE external_id=?", (key,))
        if row is None or not name or not self._norm_name(row["name"]) \
                or self._norm_name(row["name"]) == name:
            return key
        alt = f"{key}|name:{name}"
        if not self.db.one("SELECT 1 FROM customers WHERE external_id=?", (alt,)):
            self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                      "message_id,created_at) VALUES(NULL,'system','owner',?,'shared_contact',1,?,?)",
                      (f"חשבונית {inv.number}: שני לקוחות בשמות שונים עם אותו טלפון/מייל ובלי מזהה לקוח נשמרו כלקוחות "
                       "נפרדים (לא מאחדים חובות של אנשים שונים). אם זה אותו אדם — אחדו את השם "
                       "במערכת החשבוניות.", "shared:" + hashlib.sha256(alt.encode()).hexdigest()[:24],
                       _iso(self.clock())))
            self.audit("system", "shared_contact_split", {})
        return alt

    def ingest(self, invoices: list[Invoice], *, source: str = "api",
               full: bool = True, review: list[tuple[Invoice, str]] = (),
               provider: str | None = None) -> dict[str, int]:
        """upsert. full=True (סנכרון API מלא): חשבונית פתוחה שנעלמה ⇒ נסגרה ⇒ ביטול תזכורות.
        ייבוא CSV חלקי (full=False) לא סוגר חשבוניות שלא הופיעו בקובץ.
        review (ממצא 2.16): זיכוי/המרה שלא שויכו בביטחון ⇒ הלקוח מושהה לבדיקת בעל העסק."""
        # critic סבב 38: טרנזקציה אחת — commit לכל שורה עלה 7 שנ׳ ל-5,000 בדיסק, וסנכרון שנפל באמצע
        # השאיר חלק מהחשבוניות מעודכנות. עכשיו: הכול או כלום (והרבה יותר מהר).
        with self.db.batch():
            return self._ingest_rows(invoices, source=source, full=full, review=review,
                                     provider=provider)

    def _ingest_rows(self, invoices: list[Invoice], *, source: str, full: bool,
                     review: list[tuple[Invoice, str]], provider: str | None) -> dict[str, int]:
        now = _iso(self.clock())
        seen: set[str] = set()
        no_id = 0
        for inv in invoices:
            if _missing_doc_id(inv.external_id):
                # critic סבב 43: מסמך בלי מזהה (id=null ב-GI, doc_uuid חסר ב-EZcount) ⇒ "" / "ezcount:" /
                # "ezcount:None" — ושני כאלה התמזגו לחשבונית אחת. בלי מזהה אין רענון מהמקור (ר-4) ⇒ מדלגים.
                no_id += 1
                continue
            if inv.status != 0 or inv.amount_agorot <= 0:
                continue   # ממצא 2.10: רק «פתוח» עם יתרה חיובית הוא חוב
            if not self._merge_csv_twin(inv, source):
                continue
            seen.add(inv.external_id)
            cust_ext = self._customer_key_db(inv)
            self.db.x(
                "INSERT INTO customers(external_id,name,phone,email) "
                "VALUES(?,?,?,?) ON CONFLICT(external_id) DO UPDATE SET "
                # הפעלה 115: שם ריק/ממלא-מקום ("None") לא מוחק שם אמיתי שכבר ידוע
                "name=COALESCE(NULLIF(excluded.name,''), customers.name), "
                # ר-3: טלפון/מייל שסומנו «מספר שגוי» לא חוזרים, גם אם עדיין רשומים בחשבונית ירוקה
                "phone=CASE WHEN customers.blocked_phone=excluded.phone THEN NULL "
                "ELSE excluded.phone END, "
                "email=CASE WHEN customers.blocked_email=excluded.email THEN NULL "
                "ELSE excluded.email END",
                (cust_ext, clean_client_name(inv.client_name), inv.client_phone, inv.client_email))
            cid = self.db.one("SELECT id FROM customers WHERE external_id=?", (cust_ext,))["id"]
            self.db.x(
                "INSERT INTO invoices(external_id,number,doc_type,amount_agorot,currency,issued,"
                "due,customer_id,status,payment_url,synced_at,source,credit_agorot) "
                "VALUES(?,?,?,?,?,?,?,?, 'open', ?, ?, ?, ?) "
                "ON CONFLICT(external_id) DO UPDATE SET amount_agorot=excluded.amount_agorot, "
                "due=excluded.due, status='open', synced_at=excluded.synced_at, "
                "source=excluded.source, credit_agorot=excluded.credit_agorot, "
                # סכום השתנה (תשלום חלקי) ⇒ טופס התשלום השמור נבנה על הסכום הישן ⇒ לא בשימוש
                "payment_url=CASE WHEN invoices.amount_agorot<>excluded.amount_agorot "
                "THEN NULLIF(excluded.payment_url,'') "
                "ELSE COALESCE(NULLIF(excluded.payment_url,''), invoices.payment_url) END",
                (inv.external_id, inv.number, inv.doc_type, inv.amount_agorot, inv.currency,
                 inv.issued.isoformat() if inv.issued else None,
                 inv.due.isoformat() if inv.due else None, cid, inv.payment_url, now, source,
                 inv.credit_agorot))
        held = self._hold_for_credit_review(review)
        if no_id:
            self._notify_docs_without_id(no_id)
        closed = 0
        if not full:
            self.audit("system", "import", {"source": source, "rows": len(seen)})
            return {"open": len(seen), "closed": 0}
        for row in self.db.q("SELECT id, external_id FROM invoices WHERE status='open'"):
            if provider is not None and not _closable_by(provider, row["external_id"]):
                continue   # חשבונית של מקור אחר — העדרה מהסנכרון הזה לא אומר שנסגרה
            if row["external_id"] not in seen:
                self.db.x("UPDATE invoices SET status='closed', closed_at=? WHERE id=?",
                          (now, row["id"]))
                self._cancel_invoice(row["id"], "invoice_closed")
                closed += 1
        self.audit("system", "sync", {"open": len(seen), "closed": closed, "review": held})
        out = {"open": len(seen), "closed": closed}
        if held:
            out["review"] = held   # לקוחות שהושהו לבדיקת זיכוי (2.16) — רק כשיש
        return out

    def _notify_malformed(self, n: int) -> None:
        key = "malformed:" + self.clock().date().isoformat()
        if self.db.one("SELECT 1 FROM messages WHERE intent='doc_malformed' AND message_id=?", (key,)):
            return
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(NULL,'system','owner',?,'doc_malformed',1,?,?)",
                  (f"{n} מסמכים ממערכת החשבוניות הגיעו עם נתון לא תקין (סכום או תאריך), ולכן דולגו. "
                   "בסנכרון הזה גבי לא סגרה אף חשבונית, כדי לא לסמן בטעות חוב פתוח כשולם.", key,
                   _iso(self.clock())))
        self.audit("system", "doc_malformed", {"count": n})

    def _notify_docs_without_id(self, n: int) -> None:
        """התראה אחת ליום (בלי PII) — לא בכל סנכרון."""
        key = "noid:" + self.clock().date().isoformat()
        if self.db.one("SELECT 1 FROM messages WHERE intent='doc_without_id' AND message_id=?", (key,)):
            return
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(NULL,'system','owner',?,'doc_without_id',1,?,?)",
                  (f"{n} מסמכים ממערכת החשבוניות הגיעו בלי מזהה, ולכן גבי לא שולחת עליהם תזכורות "
                   "(אי אפשר לאמת מולם סכום לפני שליחה). בדקו אותם במערכת החשבוניות.", key,
                   _iso(self.clock())))
        self.audit("system", "doc_without_id", {"count": n})

    def _merge_csv_twin(self, inv: Invoice, source: str) -> bool:
        """critic 3.6.4: אותה חשבונית מ-CSV (`csv:{מספר}`) ומה-API היו שני שרשורים. סנכרון API מלא
        «סגר» את עותק ה-CSV ⇒ נספר כ«נגבה» בדשבורד, ומונה 3 התזכורות התחיל מאפס בשרשור החדש.
        API: עותק CSV פתוח באותו מספר (חשבונית 305) מאומץ — מקבל את המזהה של ה-API, וההיסטוריה,
        הלקוח ומצבו (השהיה/מחלוקת/הסרה) נשמרים. CSV: מספר שכבר מגיע מה-API ⇒ השורה מדולגת
        (ה-API הוא מקור האמת). False ⇒ לדלג על השורה."""
        if source == "csv":
            return self.db.one("SELECT 1 FROM invoices WHERE number=? AND doc_type=? AND "
                               "source!='csv'", (inv.number, inv.doc_type)) is None
        if inv.doc_type != 305 or self.db.one("SELECT 1 FROM invoices WHERE external_id=?",
                                              (inv.external_id,)):
            return True
        twin = self.db.one("SELECT id FROM invoices WHERE external_id=? AND status='open'",
                           ("csv:" + inv.number,))
        if twin:
            self.db.x("UPDATE invoices SET external_id=?, source=? WHERE id=?",
                      (inv.external_id, source, twin["id"]))
            self.audit("system", "csv_invoice_adopted_by_api", {"invoice": twin["id"]})
        return True

    def sync(self) -> dict[str, int]:
        if self.s.source_system == "csv":
            raise RuntimeError("מקור החשבוניות הוא קובץ CSV — אין סנכרון API (ייבוא דרך /settings/source/csv)")
        if self.gi is None:
            if self.s.source_system == "greeninvoice":
                raise RuntimeError("לא הוגדר חיבור Green Invoice (sandbox)")
            raise RuntimeError(f"לא הוגדר חיבור ל-{SOURCE_SYSTEMS[self.s.source_system].label} "
                               "(שלב 1: mock בלבד)")
        provider = source_provider(self.gi)
        self.gi.__dict__["malformed"] = 0
        # הפעלה 121: "היום" של חישוב המועד = שעון השירות (הנפקה רחוקה בעתיד = טעות בשנה)
        as_of_token = AS_OF.set(self.clock().date())
        try:
            if hasattr(self.gi, "open_debts"):   # ממצא 2.16: החוב אחרי קיזוז זיכויים והמרות 300⇒305
                net = self.gi.open_debts()
                invs, review = net.invoices, net.review
            else:
                invs, review = list(self.gi.iter_open_invoices()), []
        finally:
            AS_OF.reset(as_of_token)
        # critic סבב 44: מסמך פגום (סכום/תאריך לא תקין) דולג. ייתכן שזה מסמך פתוח שכבר אצלנו ⇒
        # בסנכרון הזה לא סוגרים כלום (אחרת הוא ייראה «שולם»), ובעל העסק מקבל התראה.
        bad = self.gi.__dict__.get("malformed", 0)
        if bad:
            self._notify_malformed(bad)
        return self.ingest(invs, review=review, provider=provider, full=not bad)

    CREDIT_REVIEW = "credit_review"

    def _hold_for_credit_review(self, review: list[tuple[Invoice, str]]) -> int:
        """ממצא 2.16 (שמרני): זיכוי שלא ניתן לשייך לחשבונית ⇒ לא מנחשים את הסכום. הלקוח מושהה
        (paused_reason=credit_review, משתחרר רק ב-resume של בעל העסק) + התראה אחת לבעל העסק.
        התראה לכל צירוף מסמכים — אחרי resume אותו זיכוי לא משהה שוב; זיכוי חדש כן.
        זיכוי שלא מזוהה לשום לקוח קיים (אין מזהה/מייל/טלפון תואם) ⇒ התראה כללית לבעל העסק, בלי
        השהיה של אף לקוח (לא מנחשים למי הוא שייך)."""
        by_cust: dict[str, dict[str, str]] = {}
        for doc, why in review:
            by_cust.setdefault(self.customer_key(doc), {})[doc.external_id] = why
        held = 0
        for key, docs in by_cust.items():
            cust = self.db.one("SELECT * FROM customers WHERE external_id=?", (key,))
            if not cust:
                self._orphan_credit_alert(docs)
                continue
            held += self._hold_customer_for_credit(cust, docs)
        return held

    def _hold_customer_for_credit(self, cust, docs: dict[str, str]) -> int:
        """1 ⇒ הלקוח הושהה עכשיו (חדש). 0 ⇒ אין חוב פתוח, או שבעל העסק כבר קיבל התראה על אותם
        מסמכים (ואם חידש — זו הכרעה שלו, לא משהים שוב)."""
        if not self.db.one("SELECT 1 FROM invoices WHERE customer_id=? AND status='open'",
                           (cust["id"],)):
            return 0   # אין חוב פתוח ללקוח ⇒ אין על מה להזכיר
        mid = f"credit:{cust['id']}:" + ",".join(sorted(docs))
        if self.db.one("SELECT 1 FROM messages WHERE intent=? AND message_id=?",
                       (self.CREDIT_REVIEW, mid)):
            return 0
        if not cust["paused_reason"]:
            self.db.x("UPDATE customers SET paused_reason=? WHERE id=?",
                      (self.CREDIT_REVIEW, cust["id"]))
        for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (cust["id"],)):
            self._cancel_invoice(inv["id"], self.CREDIT_REVIEW)
        label = SOURCE_SYSTEMS[self.s.source_system].label
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(?,'system','owner',?,?,1,?,?)",
                  (cust["id"], f"ל{cust['name'] or 'לקוח'} יש זיכוי או המרת מסמך שלא הצלחנו "
                   "לשייך בוודאות לחשבונית. כדי לא לדרוש סכום שגוי, התזכורות ללקוח הזה "
                   f"נעצרו. בדקו ב{label} ואז חדשו את התזכורות.", self.CREDIT_REVIEW,
                   mid, _iso(self.clock())))
        self.audit("system", "credit_review", {"customer": cust["id"],
                                               "reasons": sorted(set(docs.values()))})
        return 1

    def _orphan_credit_alert(self, docs: dict[str, str]) -> None:
        mid = "credit:orphan:" + ",".join(sorted(docs))
        if self.db.one("SELECT 1 FROM messages WHERE intent=? AND message_id=?",
                       (self.CREDIT_REVIEW, mid)):
            return
        label = SOURCE_SYSTEMS[self.s.source_system].label
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(NULL,'system','owner',?,?,1,?,?)",
                  (f"נמצא ב{label} זיכוי שלא הצלחנו לשייך לשום לקוח (אין מזהה, מייל או טלפון "
                   "תואמים). בדקו למי הוא שייך, ואם צריך — השהו את התזכורות ללקוח הזה.",
                   self.CREDIT_REVIEW, mid, _iso(self.clock())))
        self.audit("system", "credit_review_orphan", {"docs": len(docs),
                                                      "reasons": sorted(set(docs.values()))})

    def import_csv(self, raw: bytes, actor: str = "owner") -> dict:
        """חלופה ל-API: ייבוא חלקי (לא סוגר חשבוניות שלא בקובץ). שגיאות לפי שורה."""
        from . import csv_import
        res = csv_import.parse(raw, today=self.clock().date())
        if not self.s.real_data_allowed:
            bad = [i.number for i in res.invoices if not is_synthetic_contact(i.client_phone, i.client_email)]
            if bad:
                self.audit(actor, "csv_import_blocked", {"rows": len(bad)})
                raise RealDataBlocked(REAL_DATA_MSG)
        counts = self.ingest(res.invoices, source="csv", full=False,
                             review=[(c, "csv_negative_balance") for c in res.credits])
        self.audit(actor, "csv_import", {"rows": len(res.invoices), "errors": len(res.errors),
                                         "credits": len(res.credits)})
        return {"imported": counts["open"], "errors": res.errors, "credits": len(res.credits),
                "date_order": res.date_order}

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
    def build_messages(self, invs, cust, step_idx: int,
                       link: str) -> tuple[list[Message], str | None]:
        """invs = החשבוניות שהתזכורת כוללת (לפי מועד; הראשונה = עוגן). אחת ⇒ הנוסח הרגיל, אות-באות.
        כמה ⇒ נוסח מאוחד (critic 15.1/2.12): סה״כ + מספרים (או כמה, אם ארוך), קישור קצר אחד לעמוד
        שמפרט את כולן. במייל המאוחד הקישור הוא אותו עמוד (כל חשבונית וקישור התשלום שלה שם)."""
        if not isinstance(invs, (list, tuple)):
            invs = [invs]
        inv_row = invs[0]
        unsub = self.unsub_url(self.new_unsub_token(cust["id"]))
        short = self.short_url(inv_row)
        step: templates.Step | templates.MultiStep
        if len(invs) == 1:
            step = templates.STEPS[step_idx]
            f = templates.fields(biz=self.s.business_name, name=cust["name"], num=inv_row["number"],
                                 amount_agorot=inv_row["amount_agorot"],
                                 currency=inv_row["currency"], link=link, unsub=unsub, short=short,
                                 two_way=self.s.sms_two_way)
        else:
            step = templates.STEPS_MULTI[step_idx]
            link = short
            f = templates.fields_multi(biz=self.s.business_name, name=cust["name"],
                                       invoices=[(r["number"], r["amount_agorot"]) for r in invs],
                                       currency=inv_row["currency"], link=link, unsub=unsub,
                                       short=short, two_way=self.s.sms_two_way)
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
            # ר-1 גם על המייל (מבקר סבב 3 🟠): שם לקוח מ-CSV עם «תביעה»/קישור זר נחסם
            bad = compliance.violations(subj + "\n" + text, compliance.Rules(
                business="", payment_link=link, unsubscribe_url=unsub, channel="email",
                own_name=self.s.business_name, allow_debt_word=step.key not in ("friendly", "second")))
            if bad:
                return [], "compliance"
            msgs.append(Message("email", cust["email"], text, subject=subj, html=html,
                                unsubscribe_url=unsub))
        if msgs:
            return msgs, None
        return msgs, ("no_reply_to" if email_ok else "no_contact")

    # ---------- שער שליחה יחיד (ממצא מבקר 2.6 §5) ----------
    @staticmethod
    def addr_hash(channel: str, addr: str) -> str:
        # הפעלה 117: אותו מנקה כמו בייבוא — "mailto:"/RLM/אותיות גדולות לא עוקפים הסרה
        norm = normalize_il_phone(addr) if channel == "sms" else (clean_email(addr) or (addr or "").strip().lower())
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
        """ניסיון: בסופו התזכורות נעצרות (הנתונים נשמרים) עד הצטרפות. אין trial_start ⇒ פעיל.

        הכרעת מאיר 8.11.2026 — חיוב דרך אורביט: עסק **מקושר** לאורביט שקיבל זכאות מאומתת ⇒ המצב
        נלקח ממנה (app/orbit_entitlement.py: ניסיון 14 יום מ-trial_start של אורביט · active עד
        paid_until · חסד 7 ימים · cancelled ⇒ עצירה). עסק לא-מקושר / בלי זכאות ⇒ כמו היום."""
        ent = orbit_entitlement.current(self.db)
        if ent is not None:
            return orbit_entitlement.evaluate(ent, self.clock().date(), trial_days=self.s.trial_days,
                                              price_ils_month=self.s.price_ils_month)
        info = {"price_ils_month": self.s.price_ils_month, "trial_days": self.s.trial_days}
        trial_start = self.s.trial_start
        if not trial_start:
            # critic סבב 21 (שוחזר): עסק מקושר לאורביט (חיוב דרך אורביט) שלא קיבל אף זכאות מאומתת היה
            # active לתמיד. הזכאות עוברת בדפדפן של הלקוח, ומספיק להסיר אותה. עכשיו: ניסיון מתאריך הקישור.
            try:
                link = self.db.one("SELECT created_at FROM orbit_links LIMIT 1")
            except Exception:   # noqa: BLE001 — טבלת הקישור נוצרת רק עם OrbitConnect (אין ⇒ לא מקושר)
                link = None
            if link and link["created_at"]:
                try:
                    trial_start = date.fromisoformat(str(link["created_at"])[:10]).isoformat()
                except ValueError:   # תאריך פגום לא מפיל את trial(); שמרני ⇒ הניסיון מתחיל היום
                    trial_start = self.clock().date().isoformat()
        if not trial_start:
            return {**info, "on_trial": False, "active": True, "days_left": None,
                    "ending_soon": False}
        start = date.fromisoformat(trial_start)
        left = self.s.trial_days - (self.clock().date() - start).days
        return {**info, "on_trial": True, "active": left > 0, "days_left": max(left, 0),
                "ending_soon": 0 < left <= TRIAL_WARN_DAYS,
                "ends": (start + timedelta(days=self.s.trial_days)).isoformat()}

    def _notify_trial_ending(self) -> None:
        """הכרעת מאיר: תזכורת לבעל העסק {TRIAL_WARN_DAYS} ימים לפני סוף הניסיון. פעם אחת."""
        t = self.trial()
        if not t.get("ending_soon"):
            return
        key = f"trial_end:{t['ends']}"
        if self.db.one("SELECT 1 FROM messages WHERE intent='trial_ending' AND message_id=?",
                       (key,)):
            return
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(NULL,'system','owner',?,'trial_ending',1,?,?)",
                  (f"תקופת הניסיון של גבי מסתיימת {_in_days(t['days_left'])} ({t['ends']}). "
                   "לאחריה התזכורות נעצרות (הנתונים נשמרים) עד שתבחרו להצטרף. "
                   "לא יבוצע חיוב אוטומטי." + _orbit_join(t), key,
                   _iso(self.clock())))
        self.audit("system", "trial_ending", {"ends": t["ends"]})

    def _notify_orbit_billing(self, t: dict) -> None:
        """חיוב דרך אורביט: חסד / סיום / ביטול ⇒ הודעה אחת לבעל העסק (עם קישור לחיוב באורביט)."""
        if t.get("source") != "orbit":
            return
        n = orbit_entitlement.notice(t)
        if not n:
            return
        key, body = n
        if self.db.one("SELECT 1 FROM messages WHERE intent='orbit_billing' AND message_id=?",
                       (key,)):
            return
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(NULL,'system','owner',?,'orbit_billing',1,?,?)",
                  (body, key, _iso(self.clock())))
        self.audit("system", "orbit_billing_notice", {"state": t.get("state"),
                                                      "ends": t.get("ends")})

    # ---------- planning ----------
    def plan(self) -> list[int]:
        now = self.clock()
        t = self.trial()
        self._notify_orbit_billing(t)   # גם (ובעיקר) כשהשליחה נעצרה — בעל העסק צריך לדעת למה
        if not t["active"]:
            return []
        # באג: release_expired_pauses לא נקרא מאף מקום ⇒ "אשלם בחמישי" שלא שולם השהה לנצח
        self.inbox.release_expired_pauses()
        self._notify_trial_ending()
        self.purge_closed()   # ר-10: זול, פעם בסבב
        self._roll_episodes(now)
        created: list[int] = []
        custs = self.db.q("SELECT DISTINCT customer_id FROM invoices WHERE status='open' "
                          "ORDER BY customer_id")
        # critic סבב 38: במנות של 200 לקוחות לטרנזקציה — commit לכל כתיבה עלה 17 שנ׳ ל-5,000 בדיסק
        for i in range(0, len(custs), 200):
            with self.db.batch():
                for c in custs[i:i + 200]:
                    rid = self._plan_customer(c["customer_id"], now)
                    if rid:
                        created.append(rid)
        if created:
            self.audit("system", "plan", {"created": created})
        return created

    # ---------- תזכורת מאוחדת ללקוח (critic 15.1/2.12, הכרעת מאיר 7.11.2026) ----------
    # הכלל (שמרני — אף לקוח לא מקבל יותר הודעות מבעבר):
    #   • הודעה אחת ללקוח בכל שלב, על כל החשבוניות הפתוחות שכבר עברו את מועד התזכורת הראשונה
    #     (מועד+1), באותו מטבע של החשבונית הוותיקה (אין סה״כ של שקל+דולר; מטבע אחר ממתין).
    #   • סולם 3 התזכורות (ידידותית +1 ⇒ פריסה +7 ⇒ אחרונה +14) נספר **ללקוח לאפיזודת חוב**:
    #     התזכורות שנשלחו ללקוח וכוללות חשבונית שעדיין פתוחה, או שנשלחו מאז תחילת האפיזודה
    #     (`customers.episode_since` — מתאפס רק כשאין ללקוח אף חשבונית פתוחה בסבב התכנון).
    #   • חשבונית חדשה שנוספה באמצע אפיזודה **מצטרפת לשלב הבא** — לא מתחילה מ-1. אחרי 3 — עצירה
    #     ללקוח כולו (גם חשבונית חדשה לא מתחילה סולם חדש עד שהחוב כולו נסגר) + התראה אחת לבעל העסק.
    #   • מועד השלב: מועד החשבונית הוותיקה שבהודעה + היסט השלב (כמו קודם), ו-72 שעות ללקוח.
    #   • דחייה של בעל העסק חלה על החשבוניות שבהודעה — הן לא ייכללו שוב (כמו קודם, לחשבונית).
    #   • נתונים ישנים (תזכורת לחשבונית) נספרים כמו שהם ⇒ 2 חשבוניות × 2 תזכורות = 4 ⇒ עצירה.
    def _roll_episodes(self, now: datetime) -> None:
        self.db.x("UPDATE customers SET episode_since=NULL WHERE episode_since IS NOT NULL AND id "
                  "NOT IN (SELECT customer_id FROM invoices WHERE status='open')")
        self.db.x("UPDATE customers SET episode_since=? WHERE episode_since IS NULL AND id IN "
                  "(SELECT customer_id FROM invoices WHERE status='open')", (_iso(now),))

    def reminder_invoice_ids(self, rid: int) -> list[int]:
        """החשבוניות שהתזכורת כוללת, לפי מועד (העוגן ראשון)."""
        return [r["id"] for r in self.db.q(
            "SELECT i.id FROM reminder_invoices x JOIN invoices i ON i.id=x.invoice_id "
            "WHERE x.reminder_id=? ORDER BY i.due, i.id", (rid,))]

    def _link_invoices(self, rid: int, ids: list[int]) -> None:
        self.db.x("DELETE FROM reminder_invoices WHERE reminder_id=?", (rid,))
        for iid in ids:
            self.db.x("INSERT OR IGNORE INTO reminder_invoices(reminder_id, invoice_id) VALUES(?,?)",
                      (rid, iid))

    def _customer_reminders(self, cid: int, statuses: tuple[str, ...] | None = None, *,
                            sent: bool = False) -> list:
        """כל התזכורות של הלקוח (לפי עוגן), לפי זמן שליחה. SQL קבוע (שער האבטחה), סינון בפייתון."""
        rows = self.db.q("SELECT r.* FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                         "WHERE i.customer_id=? ORDER BY r.sent_at, r.id", (cid,))
        return [r for r in rows if (statuses is None or r["status"] in statuses)
                and (not sent or str(r["status"]).startswith("sent")
                     or r["status"] == "send_unknown")]   # critic סבב 39: אולי יצאה ⇒ נספרת (שמרני)

    def episode_sent(self, cid: int) -> list:
        """התזכורות שנשלחו ללקוח באפיזודת החוב הנוכחית (ראו הכלל למעלה)."""
        cust = self.db.one("SELECT episode_since FROM customers WHERE id=?", (cid,))
        since = _dt(cust["episode_since"]) if cust else None
        open_ids = {r["id"] for r in self.db.q(
            "SELECT id FROM invoices WHERE customer_id=? AND status='open'", (cid,))}
        out = []
        for r in self._customer_reminders(cid, sent=True):
            sent_at = _dt(r["sent_at"])
            if set(self.reminder_invoice_ids(r["id"])) & open_ids or \
                    (since is not None and sent_at is not None and sent_at >= since):
                out.append(r)
        return out

    def _plan_customer(self, cid: int, now: datetime) -> int | None:
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (cid,))
        if self._customer_block(cid):
            return None
        rejected = {iid for r in self._customer_reminders(cid, ("rejected",))
                    for iid in self.reminder_invoice_ids(r["id"])}
        cands = []
        for r in self.db.q("SELECT * FROM invoices WHERE customer_id=? AND status='open' "
                           "ORDER BY due, id", (cid,)):
            if r["id"] in rejected:
                continue  # בעל העסק דחה ⇒ אין תזכורות נוספות לחשבונית הזו
            if invoice_too_old(r, now.date()):
                self._notify_too_old(r, cust)   # ר-7: אין שום אוטומציה, רק התראה אחת
                continue
            if r["due"]:
                cands.append(r)
            else:   # critic סבב 25: בלי שום תאריך ⇒ לא מתזמנים, אבל גם לא שותקים
                self._notify_no_due(r, cust)
        # מבקר סבב 3 (8): שלב נקבע לפי מה **שנשלח**, לא לפי תזכורות שבוטלו (השהיה/ביטול)
        done = len(self.episode_sent(cid))
        if done >= MAX_REMINDERS_PER_INVOICE:
            self._notify_exhausted(cust)
            return None

        def due_at(r) -> datetime:
            return datetime.combine(date.fromisoformat(r["due"]), time(10), TZ)

        ready = [r for r in cands if now >= due_at(r) + timedelta(days=STEP_OFFSETS_DAYS[0])]
        if not ready:
            return None
        ready = [r for r in ready if r["currency"] == ready[0]["currency"]]
        lead = ready[0]
        if self._customer_reminders(cid, ("sending",)):
            return None   # critic סבב 39: באמצע שליחה (או נתקעה) ⇒ לא בונים/משנים כלום עד שיוכרע
        act = self._customer_reminders(cid, ACTIVE)
        if act:   # הודעה אחת בתור ללקוח
            # חשבונית שהבשילה בזמן שהטיוטה ממתינה מצטרפת אליה (אותו שלב) ⇒ נבנית מחדש ולאישור מחדש
            covered = set(self.reminder_invoice_ids(act[0]["id"]))
            if act[0]["invoice_id"] == lead["id"] and {r["id"] for r in ready} > covered:
                self._rebuild_for_amount(act[0], ready, why="invoices_joined")
            return None
        if now < due_at(lead) + timedelta(days=STEP_OFFSETS_DAYS[done]):
            return None
        last = _dt(cust["last_sent_at"])
        earliest = max(now, last + timedelta(hours=72)) if last else now
        when = self.policy.next_allowed(earliest)
        step = templates.STEPS[done]
        links = [self._payment_link(r) for r in ready]
        msgs, block = self.build_messages(ready, cust, done, links[0] or "")
        if any(x is None for x in links):
            block = "no_payment_link"
        odd = self._amount_outliers(ready)
        for r, usual in odd:
            self._notify_amount_check(r, cust, usual)
        if odd and not block:
            block = AMOUNT_CHECK   # רך: מותר לאשר, רק עם confirm_amount (נבדק מחדש ב-approve)
        total = sum(r["amount_agorot"] for r in ready)
        # אישור פרטני (הכרעת מאיר, בטא = טיוטות בלבד): כל תזכורת ממתינה לאישור בעל העסק
        payload = "[" + ",".join(message_to_json(m) for m in msgs) + "]"
        vals = (step.key, _iso(when), "pending_approval", 1, msgs[0].body if msgs else "",
                payload, block, templates.template_version(), _sha(payload), total)
        old = self.db.one("SELECT id, status FROM reminders WHERE invoice_id=? AND step=?",
                          (lead["id"], done))
        if old and str(old["status"]).startswith("sent"):
            # לא אמור לקרות (תזכורת שנשלחה ומכסה חשבונית פתוחה נספרת ב-done); לא דורסים ראיה
            self.audit("system", "plan_conflict", {"reminder": old["id"]})
            return None
        if old:   # שלב שבוטל/נדחה קודם — נבנה מחדש באותה רשומה (UNIQUE(invoice_id, step))
            self.db.x("UPDATE reminders SET template_key=?, scheduled_for=?, status=?, "
                      "requires_approval=?, body=?, payload=?, block_reason=?, "
                      "template_version=?, body_hash=?, amount_agorot=?, approved_hash=NULL, "
                      "approved_version=NULL, approved_by=NULL, decided_at=NULL WHERE id=?",
                      (*vals, old["id"]))
            rid = old["id"]
        else:
            rid = self.db.x(
                "INSERT INTO reminders(invoice_id,step,template_key,scheduled_for,status,"
                "requires_approval,body,payload,block_reason,template_version,body_hash,"
                "amount_agorot) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (lead["id"], done, *vals))
        self._link_invoices(rid, [r["id"] for r in ready])
        return rid

    def _csv_unverified(self) -> int:
        last = self.db.one("SELECT MAX(synced_at) m FROM invoices WHERE source='csv'")["m"]
        if not last:
            return 0
        return self.db.one("SELECT COUNT(*) n FROM invoices WHERE source='csv' AND status='open' "
                           "AND synced_at < ?", (last,))["n"]

    def _notify_exhausted(self, cust) -> None:
        """אחרי 3 תזכורות שנשלחו ללקוח באפיזודה והחוב עדיין פתוח ⇒ עצירה + התראה אחת לבעל העסק."""
        sent = self.episode_sent(cust["id"])
        if len(sent) < MAX_REMINDERS_PER_INVOICE:
            return
        key = f"cust:{cust['id']}:{cust['episode_since'] or ''}"
        if self.db.one("SELECT 1 FROM messages WHERE intent='max_reminders' AND message_id=?",
                       (key,)):
            return
        nums = [r["number"] for r in self.db.q(
            "SELECT number FROM invoices WHERE customer_id=? AND status='open' ORDER BY due, id",
            (cust["id"],))]
        what = (f"לחשבונית {nums[0]}" if len(nums) == 1 else
                f"על {len(nums)} חשבוניות פתוחות ({', '.join(nums)})")
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(?,'system','owner',?,'max_reminders',1,?,?)",
                  (cust["id"], f"נשלחו {MAX_REMINDERS_PER_INVOICE} תזכורות {what} ({cust['name']}) "
                   "והחוב עדיין פתוח. התזכורות האוטומטיות נעצרו — מומלץ קשר אישי.", key,
                   _iso(self.clock())))
        self.audit("system", "max_reminders_reached", {"customer": cust["id"]})

    def owner_message_done(self, mid: int, actor: str = "owner") -> dict:
        """critic סבב 34: בעל העסק מסמן הודעה כ«טופל». רק needs_owner=1 ⇒ 0 (התוכן לא נמחק — ר-10 מטפל
        בזה). הדה-דופ של ההתראות (message_id) לא תלוי ב-needs_owner, ולכן היא לא נוצרת מחדש."""
        if not self.db.one("SELECT 1 FROM messages WHERE id=? AND needs_owner=1", (mid,)):
            raise KeyError(mid)
        self.db.x("UPDATE messages SET needs_owner=0 WHERE id=?", (mid,))
        self.audit(actor, "owner_message_done", {"message": mid})
        return {"id": mid, "done": True}

    def _notify_no_due(self, inv_row, cust) -> None:
        key = f"nodue:{inv_row['id']}"
        if self.db.one("SELECT 1 FROM messages WHERE intent='no_due_date' AND message_id=?", (key,)):
            return
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(?,'system','owner',?,'no_due_date',1,?,?)",
                  (cust["id"], self._no_due_text(inv_row, cust), key,
                   _iso(self.clock())))
        self.audit("system", "no_due_date", {"invoice": inv_row["id"]})

    def _no_due_text(self, inv_row, cust) -> str:
        issued = date.fromisoformat(inv_row["issued"]) if inv_row["issued"] else None
        if issued_in_far_future(issued, self.clock().date()):   # הפעלה 121: לא «אין תאריך» — תאריך שגוי
            return (f"לחשבונית {inv_row['number']} ({cust['name']}) תאריך הנפקה {issued:%d/%m/%Y} — רחוק "
                    "בעתיד, אולי טעות בשנה? — ואין מועד תשלום, ולכן גבי לא שולחת עליה תזכורות. "
                    "תקנו את התאריך במערכת החשבוניות.")
        return (f"לחשבונית {inv_row['number']} ({cust['name']}) אין תאריך הנפקה ואין מועד "
                "תשלום, ולכן גבי לא שולחת עליה תזכורות. השלימו תאריך במערכת החשבוניות.")

    # ---------- הפעלה 123: סכום חריג (נקודה עשרונית במקום הלא נכון?) ----------
    def _amount_outliers(self, invs) -> list[tuple]:
        """החשבוניות שבהודעה שסכומן חריג מול שאר החשבוניות של אותו לקוח (אותו מטבע) ⇒ [(row, רגיל)]."""
        out = []
        for inv in invs:
            hist = [h["amount_agorot"] for h in self.db.q(
                "SELECT amount_agorot FROM invoices WHERE customer_id=? AND currency=? AND id<>?",
                (inv["customer_id"], inv["currency"], inv["id"]))]
            usual = amount_outlier(inv["amount_agorot"], hist)
            if usual is not None:
                out.append((inv, usual))
        return out

    def _notify_amount_check(self, inv_row, cust, usual: int) -> None:
        """התראה אחת לחשבונית ולסכום (סכום אחר ⇒ התראה חדשה)."""
        key = f"amt:{inv_row['id']}:{inv_row['amount_agorot']}"
        if self.db.one("SELECT 1 FROM messages WHERE intent=? AND message_id=?", (AMOUNT_CHECK, key)):
            return
        cur = inv_row["currency"]
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(?,'system','owner',?,?,1,?,?)",
                  (cust["id"], f"לחשבונית {inv_row['number']} ({cust['name'] or 'לקוח'}) סכום "
                   f"{templates.fmt_amount(inv_row['amount_agorot'], cur)} — פי "
                   f"{inv_row['amount_agorot'] // usual} ויותר מהסכום הרגיל של הלקוח "
                   f"({templates.fmt_amount(usual, cur)}). אולי הנקודה העשרונית במקום הלא נכון? "
                   "גבי לא תשלח את התזכורת עד שתאשרו במפורש שהסכום נכון. אם הוא שגוי — "
                   "תקנו אותו במערכת החשבוניות.", AMOUNT_CHECK, key, _iso(self.clock())))
        self.audit("system", AMOUNT_CHECK, {"invoice": inv_row["id"]})

    def _notify_too_old(self, inv_row, cust) -> None:
        key = f"old:{inv_row['id']}"
        if self.db.one("SELECT 1 FROM messages WHERE intent='manual_only_old' AND message_id=?",
                       (key,)):
            return
        self._cancel_invoice(inv_row["id"], "manual_only_old")
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                  "message_id,created_at) VALUES(?,'system','owner',?,'manual_only_old',1,?,?)",
                  (cust["id"], self._too_old_text(inv_row, cust), key,
                   _iso(self.clock())))
        self.audit("system", "manual_only_old", {"invoice": inv_row["id"]})

    @staticmethod
    def _too_old_text(inv_row, cust) -> str:
        # הפעלה 122: התאריך + רמז לטעות — 2016 במקום 2026 נראה כמו חוב ישן, ובעל העסק צריך רק לתקן תאריך
        born = inv_row["issued"] or inv_row["due"]
        when = f" (מ-{date.fromisoformat(born):%d/%m/%Y})" if born else ""
        return (f"חשבונית {inv_row['number']} ({cust['name']}){when} בת יותר מ-3 שנים. "
                "גבי לא שולחת עליה תזכורות אוטומטיות — לטיפול ידני בלבד. "
                "אם התאריך שגוי (טעות בשנה?) — תקנו אותו במערכת החשבוניות.")

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
        אלא אם יש legal hold מתועד. רשימת ההסרה (suppressions, גיבוב בלבד) ו-audit נשארים.
        critic סבב 37: הכול בטרנזקציה אחת — אטומי (אין לקוח חצי-מותמם) ו-commit אחד במקום ~5 לחוב."""
        with self.db.batch():
            inv_n, cust_n, unk = self._purge_rows()
        if inv_n or cust_n or unk:
            self.audit("system", "retention_purge", {"invoices": inv_n, "customers": cust_n,
                                                     "unknown_messages": unk})
            self.db.scrub()   # critic סבב 24: גם דפים פנויים מלפני secure_delete (DB קיים)
        return {"invoices": inv_n, "customers": cust_n}

    def _purge_rows(self) -> tuple[int, int, int]:
        cutoff = _iso(self.clock() - timedelta(days=RETENTION_DAYS))
        now = _iso(self.clock())
        inv_n = cust_n = 0
        for r in self.db.q("SELECT i.id FROM invoices i JOIN customers c ON c.id=i.customer_id "
                           "WHERE i.status='closed' AND i.purged_at IS NULL AND i.closed_at "
                           "IS NOT NULL AND i.closed_at<=? AND c.legal_hold IS NULL", (cutoff,)):
            self.db.x("UPDATE reminders SET body='', payload='[]' WHERE invoice_id=? OR id IN "
                      "(SELECT reminder_id FROM reminder_invoices WHERE invoice_id=?)",
                      (r["id"], r["id"]))
            # critic סבב 28: גם הקוד של הקישור הקצר (/p/) — אחרת הוא חי לנצח אחרי המחיקה
            self.db.x("UPDATE invoices SET purged_at=?, payment_url=NULL, short_code=NULL WHERE id=?",
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
        # critic סבב 42 (ℹ️): מפתחות dedupe של webhooks גדלו לנצח. ספק לא שולח retry אחרי 90 יום,
        # ומזהה הודעת מייל יכול לשאת דומיין/שם שולח ⇒ אותו חלון שמירה.
        self.db.x("DELETE FROM webhook_dedupe WHERE at<=?", (cutoff,))
        return inv_n, cust_n, len(unk)

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
        invs = [self._invoice(i) for i in self.reminder_invoice_ids(reminder_id)] or \
            [self._invoice(r["invoice_id"])]
        msgs = [Message(**m) for m in json.loads(r["payload"])]
        return {"reminder_id": reminder_id, "status": r["status"],
                "block_reason": r["block_reason"], "template_key": r["template_key"],
                "scheduled_for": r["scheduled_for"],
                "amount_check": [{"number": i["number"], "amount_agorot": i["amount_agorot"],
                                  "usual_agorot": u, "currency": i["currency"]}
                                 for i, u in self._amount_outliers(invs)],
                "messages": [self.sender.preview(m) for m in msgs]}

    # ---------- owner decisions ----------
    def approve(self, reminder_id: int, actor: str = "owner", *, confirm_open: bool = False,
                confirm_amount: bool = False) -> dict:
        r = self._reminder(reminder_id)
        if r["status"] != "pending_approval":
            raise ValueError(f"לא ממתינה לאישור (status={r['status']})")
        invs = [self._invoice(i) for i in self.reminder_invoice_ids(reminder_id)] or \
            [self._invoice(r["invoice_id"])]
        if any(i["source"] == "csv" for i in invs) and not confirm_open:
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
        # הפעלה 123: נבדק מחדש על הסכומים של עכשיו (גם אחרי בנייה מחדש, כש-block_reason הוא amount_changed)
        if self._amount_outliers(invs) and not confirm_amount:
            raise ValueError("סכום חריג מאוד מהרגיל ללקוח (אולי נקודה עשרונית במקום הלא נכון?) — "
                             "יש לאשר במפורש שהסכום נכון (confirm_amount)")
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
                                      "confirm_open": bool(confirm_open),
                                      "confirm_amount": bool(confirm_amount)})
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
        # critic סבב 13: ה-cron היחיד במפרט הוא dispatch. תשובות והצעות פריסה שבעל העסק אישר מחוץ
        # לחלון חיכו ל-/conversation/flush ידני, כלומר בפועל לא יצאו לעולם. עכשיו גם הן יוצאות כאן,
        # דרך אותו שער שליחה (הסרה, שעות, שבת וחג, ניסיון).
        self.inbox.flush()
        self._recover_stuck_sends(now)
        rows = self.db.q("SELECT * FROM reminders WHERE status='approved' AND scheduled_for<=? "
                         "ORDER BY scheduled_for", (_iso(now),))
        for r in rows:
            # ר-12: אושר בדיוק הגוף הזה ובגרסת הנוסח הנוכחית? אחרת האישור בטל
            if r["approved_hash"] != _sha(r["payload"]) or \
                    (r["approved_version"] or "") != templates.template_version():
                self._invalidate(r, "approval_invalidated")
                continue
            # critic סבב 31: אישור שחיכה (סוף ניסיון/חסימה) יצא 22 יום אחר כך, עם כל התור באותו בוקר.
            # תקף APPROVAL_VALID_DAYS מהמאוחר מבין האישור והמועד המתוכנן (אישור מראש לעתיד נשמר).
            anchor = max(d for d in (_dt(r["decided_at"]), _dt(r["scheduled_for"])) if d is not None)
            if now - anchor > timedelta(days=APPROVAL_VALID_DAYS):
                self._invalidate(r, "approval_expired")
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
            if not self._claim_reminder(r["id"]):
                continue   # critic סבב 39: ריצה אחרת כבר תפסה אותה (אין שליחה כפולה במקביל)
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
                # שום הודעה לא יצאה ⇒ משחררים את התפיסה, וננסה בסבב הבא
                self.db.x("UPDATE reminders SET status='approved', claimed_at=NULL WHERE id=?", (r["id"],))
                continue
            if not ids:
                self.db.x("UPDATE reminders SET status='cancelled', block_reason='opted_out' "
                          "WHERE id=?", (r["id"],))
                continue
            self.db.x("UPDATE reminders SET status='sent_dry_run', sent_at=?, message_id=?, "
                      "payload=?, body=? WHERE id=?",
                      (_iso(now), ",".join(ids), redact_tokens(r["payload"]),
                       redact_tokens(r["body"]), r["id"]))
            self.db.x("UPDATE customers SET last_sent_at=? WHERE id=?", (_iso(now), cust["id"]))
            out.append({"reminder_id": r["id"], "message_ids": ids, "dry_run": True})
        if out:
            self.audit("system", "dispatch_dry_run", {"count": len(out)})
        return out

    CLAIM_STALE = timedelta(minutes=30)

    def _claim_reminder(self, rid: int) -> bool:
        """critic סבב 39: תפיסה אטומית לפני השליחה. False ⇒ מישהו אחר כבר תפס/שלח."""
        return self.db.update("UPDATE reminders SET status='sending', claimed_at=? "
                              "WHERE id=? AND status='approved'", (_iso(self.clock()), rid)) == 1

    def _recover_stuck_sends(self, now: datetime) -> None:
        """תזכורת שנתפסה ולא סומנה תוך 30 דק׳ = נפילה באמצע שליחה. **לא שולחים שוב** (אולי חלק יצא):
        send_unknown + הודעה לבעל העסק לבדוק ביומן היוצאים לפני שליחה ידנית."""
        cutoff = _iso(now - self.CLAIM_STALE)
        for r in self.db.q("SELECT id FROM reminders WHERE status='sending' AND claimed_at<=?", (cutoff,)):
            if self.db.update("UPDATE reminders SET status='send_unknown' WHERE id=? AND status='sending'",
                              (r["id"],)) != 1:
                continue
            inv = self._invoice(self._reminder(r["id"])["invoice_id"])
            self.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,"
                      "message_id,created_at) VALUES(?,'system','owner',?,'send_unknown',1,?,?)",
                      (inv["customer_id"] if inv else None,
                       f"שליחת תזכורת לחשבונית {inv['number'] if inv else ''} נקטעה באמצע. ייתכן שחלק "
                       "מההודעות יצא — היא לא תישלח שוב אוטומטית. בדקו ב«יומן יוצאים» לפני שליחה ידנית.",
                       f"sendunk:{r['id']}", _iso(now)))
            self.audit("system", "send_unknown", {"reminder": r["id"]})

    def _invalidate(self, r, why: str) -> None:
        self.db.x("UPDATE reminders SET status='pending_approval', approved_hash=NULL, "
                  "approved_version=NULL, approved_by=NULL, block_reason=? WHERE id=?",
                  (why, r["id"]))
        self.audit("system", why, {"reminder": r["id"]})

    def _refresh_before_send(self, r) -> str:
        """ר-4: הסכום, הסטטוס והקשר נבדקים מול המקור רגע לפני השליחה — לכל חשבונית שבהודעה.
        'ok' ⇒ אפשר לשלוח. אחרת התזכורת לא נשלחת:
          • העוגן נסגר/נמחק ⇒ בוטלה (התכנון הבא בונה הודעה חדשה על מה שנשאר, לאישור מחדש)
          • חשבונית אחרת בהודעה נסגרה, או סכום השתנה ⇒ נבנתה מחדש וחוזרת לאישור
          • כשל ברענון ⇒ נשארת מאושרת ולא נשלחת (block_reason=refresh_failed), ננסה שוב
          • CSV (אין API) ⇒ תקף 24 שעות מהייבוא; אחרי כן נדרש ייבוא חדש."""
        ids = self.reminder_invoice_ids(r["id"]) or [r["invoice_id"]]
        still: list = []
        for iid in ids:
            res = self._refresh_invoice(r, self._invoice(iid))
            if res == "failed":
                return "failed"
            if res == "open":
                still.append(self._invoice(iid))
        if not still or still[0]["id"] != r["invoice_id"]:
            self.db.x("UPDATE reminders SET status='cancelled', block_reason='invoice_closed' "
                      "WHERE id=?", (r["id"],))
            return "closed"
        total = sum(i["amount_agorot"] for i in still)
        sent_amount = r["amount_agorot"] if r["amount_agorot"] is not None else total
        # מבקר סבב 3 (🔴): משווים לסכום **שבהודעה שאושרה**, לא ל-invoices — אחרת sync() בין האישור
        # לשליחה עדכן את invoices, ההשוואה יצאה שווה, ונשלח הסכום הישן.
        if total != sent_amount or len(still) != len(ids):
            return self._rebuild_for_amount(r, still)
        if r["block_reason"] in ("refresh_failed", "csv_stale"):
            self.db.x("UPDATE reminders SET block_reason=NULL WHERE id=?", (r["id"],))
        return "ok"

    def _refresh_invoice(self, r, inv) -> str:
        """חשבונית אחת מתוך התזכורת ⇒ 'open' (הסכום ב-invoices מעודכן) · 'closed' · 'failed'."""
        if inv["status"] != "open":
            return "closed"
        if inv["source"] == "csv":
            # review חור 7: תוקף 24 שעות **מאישור «הסכום עדיין פתוח»**, לא מהייבוא. פג ⇒ חוזר לאישור
            approved = _dt(r["decided_at"])
            if approved is None or self.clock() - approved > timedelta(hours=24):
                self._invalidate(r, "csv_stale")
                return "failed"
            # review חור 7 (שארית, שוחזר): ייבוא CSV **אחרי** האישור שלא כלל את החשבונית = סימן
            # שהיא אולי שולמה. בלי זה נשלחה תזכורת ללקוח שבעל העסק כבר הוריד מהקובץ.
            last = self.db.one("SELECT MAX(synced_at) m FROM invoices WHERE source='csv'")["m"]
            if last and inv["synced_at"] and inv["synced_at"] < last and \
                    _dt(last) > approved:
                self._invalidate(r, "csv_missing_from_import")
                return "failed"
            return "open"   # ייבוא חוזר עם יתרה אחרת כבר עדכן את invoices (מבקר סבב 3)
        if self.gi is None or not self._source_owns(inv["external_id"]):
            self._mark_refresh_failed(r, "refresh_failed")
            return "failed"
        try:
            doc = self._fresh_doc(inv)
        except _CreditHeld:
            return "failed"     # הלקוח הושהה לבדיקת זיכוי; התזכורת בוטלה (credit_review)
        except Exception as e:  # noqa: BLE001 — כל כשל ברענון (כולל זיכויים) חוסם שליחה
            self._mark_refresh_failed(r, "refresh_failed", str(e))
            return "failed"
        if doc is None or doc.status != 0 or doc.amount_agorot <= 0:
            self.db.x("UPDATE invoices SET status='closed' WHERE id=?", (inv["id"],))
            self.audit("system", "refresh_closed", {"invoice": inv["id"]})
            return "closed"
        self.db.x("UPDATE invoices SET synced_at=? WHERE id=?", (_iso(self.clock()), inv["id"]))
        if doc.amount_agorot != inv["amount_agorot"]:
            self.db.x("UPDATE invoices SET amount_agorot=?, payment_url=NULL WHERE id=?",
                      (doc.amount_agorot, inv["id"]))
        return "open"

    def _rebuild_for_amount(self, r, invs: list, why: str = "amount_changed") -> str:
        """ההודעה נבנית מחדש על החשבוניות שעדיין פתוחות והסכומים העדכניים ⇒ חוזרת לאישור."""
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (invs[0]["customer_id"],))
        links = [self._payment_link(i) for i in invs]
        msgs, block = self.build_messages(invs, cust, r["step"], links[0] or "")
        if any(x is None for x in links):
            block = "no_payment_link"
        payload = "[" + ",".join(message_to_json(m) for m in msgs) + "]"
        total = sum(i["amount_agorot"] for i in invs)
        self.db.x("UPDATE reminders SET payload=?, body=?, body_hash=?, amount_agorot=? WHERE id=?",
                  (payload, msgs[0].body if msgs else "", _sha(payload), total, r["id"]))
        self._link_invoices(r["id"], [i["id"] for i in invs])
        self._invalidate(r, block if block in HARD_BLOCKS else why)
        self.audit("system", why, {"invoice": invs[0]["id"], "reminder": r["id"],
                                                "to_agorot": total, "invoices": len(invs)})
        return "changed"

    def _customer_row(self, cid: int):
        return self.db.one("SELECT * FROM customers WHERE id=?", (cid,))

    def _fresh_doc(self, inv) -> Invoice | None:
        """ר-4, **לכל מקור**: המסמך מהמקור + הזיכויים העדכניים שלו (critic סבב 20), כיתרה נטו.
        None ⇒ המסמך לא קיים. חריגה ⇒ אסור לשלוח: כשל רענון, או מקור בלי `credits_for`
        (credits_unverifiable — לא מניחים «אין זיכויים»).
        זיכוי שלא ניתן לשייך (CreditAmbiguous): חדש ⇒ הלקוח מושהה לבדיקת בעל העסק (`_CreditHeld`).
        אותו זיכוי שבעל העסק כבר בדק וחידש ⇒ מקזזים רק את מה שמשויך בוודאות (הכרעה שלו)."""
        try:
            doc = self.gi.get_document(inv["external_id"])
        except KeyError:
            return None
        if doc.status != 0 or doc.amount_agorot <= 0:
            return doc
        credits_for = getattr(self.gi, "credits_for", None)
        if credits_for is None:
            raise IntegrationError(f"credits_unverifiable: {source_provider(self.gi)}")
        try:
            credit = credits_for(inv["external_id"], since=doc.issued, doc=doc)
        except CreditAmbiguous as e:
            if self._hold_customer_for_credit(self._customer_row(inv["customer_id"]),
                                              {c.external_id: why for c, why in e.items}):
                raise _CreditHeld from e
            credit = e.certain
        return replace(doc, amount_agorot=doc.amount_agorot - credit)

    def refresh_customer(self, cid: int) -> bool:
        """ר-4 לטיוטות ולהסדרים (מבקר סבב 3): רענון כל החשבוניות הפתוחות של הלקוח מהמקור.
        True ⇒ הנתונים טריים (invoices עודכנו). False ⇒ כשל/אין מקור/זיכוי שלא שויך ⇒ אסור
        לשלוח טקסט עם כסף. אותו רענון כמו לפני תזכורת (`_fresh_doc`), כולל זיכויים — לכל מקור."""
        ok = True
        for inv in self.db.q("SELECT * FROM invoices WHERE customer_id=? AND status='open'", (cid,)):
            if inv["source"] == "csv":
                synced = _dt(inv["synced_at"])
                ok = ok and synced is not None and self.clock() - synced <= timedelta(hours=24)
                continue
            if self.gi is None or not self._source_owns(inv["external_id"]):
                return False
            try:
                doc = self._fresh_doc(inv)
            except _CreditHeld:
                return False
            except Exception as e:  # noqa: BLE001
                self.audit("system", "refresh_failed", {"invoice": inv["id"], "error": str(e)[:200]})
                return False
            if doc is None or doc.status != 0 or doc.amount_agorot <= 0:
                self.db.x("UPDATE invoices SET status='closed' WHERE id=?", (inv["id"],))
                self._cancel_invoice(inv["id"], "invoice_closed")
            elif doc.amount_agorot != inv["amount_agorot"]:
                self.db.x("UPDATE invoices SET amount_agorot=?, synced_at=? WHERE id=?",
                          (doc.amount_agorot, _iso(self.clock()), inv["id"]))
        return ok

    def _mark_refresh_failed(self, r, why: str, err: str = "") -> None:
        self.db.x("UPDATE reminders SET block_reason=? WHERE id=?", (why, r["id"]))
        self.audit("system", why, {"reminder": r["id"], "error": err[:200]})

    # ---------- inbound ----------
    def _find_customers(self, channel: str, sender: str) -> list:
        """כל הלקוחות עם הכתובת הזו (טלפון משותף / מייל משותף ⇒ יותר מאחד — סבב 26)."""
        if channel == "email":
            e = (sender or "").strip().lower()
            return self.db.q("SELECT * FROM customers WHERE lower(email)=? ORDER BY id", (e,)) if e else []
        norm = normalize_il_phone(sender)
        if not norm:
            return []
        return [c for c in self.db.q("SELECT * FROM customers ORDER BY id")
                if normalize_il_phone(c["phone"]) == norm]

    def _resolve_sender(self, channel: str, sender: str) -> tuple[Any, bool]:
        """critic סבב 27: ⇒ (לקוח, דו-משמעי). כמה לקוחות על אותה כתובת ⇒ מי שקיבל את ההודעה
        היוצאת האחרונה בערוץ הזה (התשובה היא לה). אף אחד לא קיבל ⇒ (None, True): לא מנחשים — היה
        «הראשון בטבלה», ו«איך משלמים?» של משה קיבל טיוטה עם החוב של רונית."""
        custs = self._find_customers(channel, sender)
        if len(custs) <= 1:
            return (custs[0] if custs else None), False
        last = {c["id"]: self.db.one("SELECT MAX(id) m FROM messages WHERE direction='out' AND "
                                     "channel=? AND customer_id=?", (channel, c["id"]))["m"] or 0
                for c in custs}
        best = max(last, key=last.get)
        if not last[best]:
            return None, True
        return next(c for c in custs if c["id"] == best), False

    def _find_customer(self, channel: str, sender: str):
        return self._resolve_sender(channel, sender)[0]

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
        if not inv or inv["purged_at"]:
            raise KeyError(code)
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (inv["customer_id"],))
        items = self._landing_items(inv)
        total = sum(i["amount_agorot"] for i in items)
        links = {i["pay_url"] for i in items}
        return {"code": code, "business": self.s.business_name, "number": inv["number"],
                "amount": templates.fmt_amount(inv["amount_agorot"], inv["currency"]),
                "due": inv["due"], "open": bool(items),
                "opted_out": bool(cust["opted_out"]),
                "pay_url": self._payment_link(inv) if inv["status"] == "open" else None,
                # critic 15.1/2.12: הודעה מאוחדת ⇒ העמוד מפרט את כל החשבוניות שבה, עם סה״כ
                "invoices": [{k: v for k, v in i.items() if k != "pay_url"}
                             | {"can_pay": bool(i["pay_url"])} for i in items],
                "count": len(items), "total_agorot": total,
                "total": templates.fmt_amount(total, inv["currency"]),
                # קישור תשלום אחד לכולן (עמוד קבוע של העסק) ⇒ כפתור אחד; אחרת כפתור לכל חשבונית
                "pay_shared": len(items) > 1 and len(links) == 1 and None not in links,
                "_cust": cust}

    def _landing_items(self, inv) -> list[dict]:
        """החשבוניות הפתוחות שבתזכורת האחרונה שכוללת את החשבונית של הקוד (לפי מועד). אין תזכורת
        (קישור מתשובה בשיחה) ⇒ החשבונית עצמה. סגורה ⇒ לא מוצגת לתשלום."""
        rem = self.db.one("SELECT r.id FROM reminders r JOIN reminder_invoices x ON "
                          "x.reminder_id=r.id WHERE x.invoice_id=? AND r.status NOT IN "
                          "('cancelled','rejected') ORDER BY r.id DESC LIMIT 1", (inv["id"],))
        ids = self.reminder_invoice_ids(rem["id"]) if rem else [inv["id"]]
        if inv["id"] not in ids:
            ids = [inv["id"], *ids]
        out = []
        for iid in ids:
            r = self._invoice(iid)
            if r is None or r["status"] != "open" or r["currency"] != inv["currency"]:
                continue
            out.append({"number": r["number"], "due": r["due"], "amount_agorot": r["amount_agorot"],
                        "amount": templates.fmt_amount(r["amount_agorot"], r["currency"]),
                        "code": self._short_code(r), "pay_url": self._payment_link(r)})
        return out

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

    def email_webhook(self, sender: str, text: str, message_id: str = "", *,
                      auth_results: str = "") -> dict:
        try:
            return self._email_webhook(sender, text, message_id, auth_results=auth_results)
        except Exception:
            self._release_webhook("mail:" + (message_id or hashlib.sha256(f"{sender}|{text}".encode()).hexdigest()))
            raise

    def _email_webhook(self, sender: str, text: str, message_id: str = "", *,
                       auth_results: str = "") -> dict:
        """מייל נכנס (ספק inbound-parse כלשהו, מנורמל ל-from/text/message_id). אידמפוטנטי.
        critic 3.6.7: מייל נכנס לא מאומת יכול להתחזות ללקוח. ההשפעות של מייל נכנס הן רק עצירה
        (השהיה/מחלוקת/הסרה — שמרני), ולכן לא חוסמים; אבל **מתעדים** את פסיקת SPF/DKIM/DMARC של
        הספק (`email_auth` ב-audit, בלי כתובות), ומייל שלא עבר אימות מסומן לבעל העסק."""
        import hashlib

        from .channels import parse_address, strip_reply

        key = "mail:" + (message_id or hashlib.sha256(f"{sender}|{text}".encode()).hexdigest())
        if not self._claim_webhook(key) or self.db.one("SELECT 1 FROM messages WHERE message_id=?", (key,)):
            return {"ok": True, "duplicate": True}
        addr, body = parse_address(sender), strip_reply(text)
        self.db.x("INSERT INTO messages(customer_id,direction,channel,body,message_id,created_at)"
                  " VALUES(NULL,'webhook','email','inbound',?,?)", (key, _iso(self.clock())))
        if not addr or not body:
            return {"ok": True, "ignored": True}
        auth = email_auth_verdict(auth_results)
        self.audit("system", "email_auth", {"message": key[:80], **auth})
        out = self.inbound("email", addr, body)
        if not auth["verified"] and out.get("draft_id"):
            # כרטיס/טיוטה: בעל העסק יודע שהמייל לא אומת אצל הספק (אולי התחזות)
            self.db.x("UPDATE drafts SET owner_summary=COALESCE(owner_summary,'') || ? WHERE id=?",
                      (" ⚠️ המייל לא עבר אימות שולח (SPF/DKIM) — ייתכן שלא נשלח ע״י הלקוח.",
                       out["draft_id"]))
        return {"ok": True, **out, "email_verified": auth["verified"]}

    def sms_webhook_019(self, raw: bytes) -> dict:
        try:
            return self._sms_webhook_019(raw)
        except Exception:
            self._release_webhook("019:" + hashlib.sha256(raw).hexdigest())
            raise

    def _sms_webhook_019(self, raw: bytes) -> dict:
        import hashlib
        from urllib.parse import parse_qs

        key = "019:" + hashlib.sha256(raw).hexdigest()
        # critic סבב 42: התפיסה לפני העיבוד (הרשומה ב-messages נכתבת רק בסוף ⇒ חלון לעיבוד כפול)
        if not self._claim_webhook(key) or self.db.one("SELECT 1 FROM messages WHERE message_id=?", (key,)):
            return {"ok": True, "duplicate": True}
        f = {k: v[0] for k, v in parse_qs(raw.decode("utf-8", "replace")).items()}
        kind = f.get("type", "incoming_sms")
        if kind == "blacklist" and f.get("phone"):
            # מבקר סבב 3: גם מספר שעוד לא ב-DB נחסם (לקוח שיתווסף אחר כך עם המספר לא יקבל SMS)
            self.suppress("sms", f["phone"], "carrier_blacklist")
            for cust in self._find_customers("sms", f["phone"]):   # טלפון משותף ⇒ כולם
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

    def _claim_webhook(self, key: str) -> bool:
        """critic סבב 42: True רק לבקשה הראשונה עם המפתח הזה (אטומי). retry של הספק / worker שני ⇒ False."""
        return self.db.update("INSERT OR IGNORE INTO webhook_dedupe(key, at) VALUES(?,?)",
                              (key, _iso(self.clock()))) == 1

    def _release_webhook(self, key: str) -> None:
        """עיבוד נכשל ⇒ משחררים את המפתח, כדי ש-retry של הספק יעובד («הסר» לא הולך לאיבוד)."""
        self.db.x("DELETE FROM webhook_dedupe WHERE key=?", (key,))

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
        # review חור 1 (הכרעת המבקר לפי הכללים, שמרני): לקוח אחר על אותו נייד/מייל הוא כמעט תמיד
        # אותו אדם או משק בית ⇒ «הסר» עוצר גם את שאר הערוצים שלו (היה: מייל לכתובת שלו נשלח).
        phone, email = normalize_il_phone(c["phone"]), (c["email"] or "").strip().lower()
        for o in self.db.q("SELECT id, phone, email FROM customers WHERE opted_out=0 AND id!=?",
                           (cid,)):
            if (phone and normalize_il_phone(o["phone"]) == phone) or \
                    (email and (o["email"] or "").strip().lower() == email):
                self.db.x("UPDATE customers SET opted_out=1 WHERE id=?", (o["id"],))
                self.suppress("sms", o["phone"] or "", how)
                self.suppress("email", o["email"] or "", how)
                for inv in self.db.q("SELECT id FROM invoices WHERE customer_id=?", (o["id"],)):
                    self._cancel_invoice(inv["id"], "opted_out")
                self.audit("customer", "opt_out", {"customer": o["id"], "via": how,
                                                    "shared_contact_of": cid})

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
                  (cid, "out", msg.channel, redact_tokens(msg.body), mid,
                   redact_tokens(message_to_json(msg)), _iso(now),
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
            # תזכורת מאוחדת נספרת בכל חשבונית שהיא כוללת (reminder_invoices)
            last = self.db.one("SELECT r.* FROM reminders r JOIN reminder_invoices x ON "
                               "x.reminder_id=r.id WHERE x.invoice_id=? ORDER BY r.step DESC, "
                               "r.id DESC LIMIT 1", (r["id"],))
            sent = self.db.one("SELECT COUNT(*) n FROM reminders r JOIN reminder_invoices x ON "
                               "x.reminder_id=r.id WHERE x.invoice_id=? AND "
                               # critic סבב 41: send_unknown נספרת כמו בתקרה (אולי יצאה)
                               "r.status IN ('sent_dry_run','send_unknown')", (r["id"],))["n"]
            due = date.fromisoformat(r["due"]) if r["due"] else None
            block = self._customer_block(r["customer_id"])
            rows.append({
                "invoice_id": r["id"], "number": r["number"], "customer": r["cname"],
                "customer_id": r["customer_id"], "paused_reason": r["paused_reason"],
                "phone": r["cphone"], "email": r["cemail"], "amount_agorot": r["amount_agorot"],
                "currency": r["currency"], "due": r["due"], "status": r["status"],
                # web: חשבונית CSV ⇒ תיבת «הסכום עדיין פתוח» לפני אישור (confirm_open)
                "source": r["source"],
                "days_overdue": (today - due).days if due and r["status"] == "open" else 0,
                "reminders_sent": sent,
                "last_reminder": None if not last else {
                    "id": last["id"], "step": last["step"], "status": last["status"],
                    "invoice_ids": self.reminder_invoice_ids(last["id"]),
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
        now = self.clock()
        closed_why = self.policy.reason_closed(now)
        try:
            next_ok: str | None = _iso(self.policy.next_allowed(now))
        except ValueError:   # לוח החגים פג (fail-closed) ⇒ אין חלון; הדשבורד לא קורס
            next_ok = None
        return {
            "series": self._collection_series(today, closed),
            "today": today.isoformat(),
            "trial": self.trial(),
            # critic 2.3.2: בשבת/בלילה/בחג «לא נשלח כלום» נראה כמו תקלה. מציגים מתי מותר ולמה
            "send_window": {"open_now": closed_why is None, "closed_reason": closed_why,
                            "next_allowed": next_ok},
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
    # review חור 4: היו כפתורי Bit/Apple Pay/כרטיס עם לוגואים וצבעי מותג, על הדומיין שלנו, ו«דרך
    # חשבונית ירוקה» קשיח — שימוש בסימני מסחר בלי הסכם, הבטחה לאמצעים שהעסק אולי לא מקבל, ונראה
    # כמו דף פישינג. עכשיו: כפתור ניטרלי אחד לעמוד התשלום של העסק + הדומיין המדויק של היעד.
    PAY_METHODS = ("page",)
    _PROVIDERS = {"greeninvoice.co.il": "חשבונית ירוקה", "morning.co": "morning",
                  "meshulam.co.il": "משולם", "grow.link": "Grow (משולם)", "bitpay.co.il": "ביט"}

    @classmethod
    def pay_destination(cls, url: str) -> tuple[str, str]:
        """(דומיין, שם ספק לתצוגה) — נגזר מהקישור בפועל, לא קשיח."""
        from urllib.parse import urlparse
        host = (urlparse(url).hostname or "").lower()
        name = next((v for d, v in cls._PROVIDERS.items() if host == d or host.endswith("." + d)),
                    host)
        return host, name

    def payer_view(self, code: str) -> dict:
        """רק מה שהחייב צריך: שם העסק, מספר, סכום, מועד, מצב. בלי טלפון/מייל/טוקן הסרה."""
        info = self.landing(code)
        inv = self.db.one("SELECT amount_agorot, currency FROM invoices WHERE short_code=?", (code,))
        return {"code": code, "business": info["business"], "number": info["number"],
                "amount": info["amount"], "amount_agorot": inv["amount_agorot"],
                "currency": inv["currency"], "due": info["due"], "open": info["open"],
                "opted_out": info["opted_out"], "can_pay": bool(info["pay_url"]),
                "invoices": info["invoices"], "count": info["count"],
                "total": info["total"], "total_agorot": info["total_agorot"],
                "pay_shared": info["pay_shared"],
                "methods": list(self.PAY_METHODS) if info["pay_url"] else [],
                "pay_host": self.pay_destination(info["pay_url"])[0] if info["pay_url"] else "",
                "pay_provider": self.pay_destination(info["pay_url"])[1] if info["pay_url"] else "",
                "plan_options": [2, 3, 4, 6], "dry_run": True}

    def payer_go(self, code: str, method: str) -> str:
        """⇒ עמוד התשלום של העסק (אמצעי התשלום נקבעים שם, לא אצלנו). יעד מאומת מול רשימת
        הדומיינים; גבי לא נוגע בפרטי תשלום."""
        if method not in self.PAY_METHODS:
            raise ValueError("אמצעי תשלום לא מוכר")
        info = self.landing(code)
        if not info["pay_url"]:
            raise ValueError("אין קישור תשלום זמין")
        self.audit("customer", "pay_click", {"invoice": info["number"], "method": method})
        return info["pay_url"]

    # ---------- plans ----------
    def open_debt(self, customer_id: int) -> tuple[list, int]:
        """מבקר §4.6: הסדר נבנה על **כל** החוב הפתוח של הלקוח, לא על החשבונית הוותיקה בלבד.
        ⇒ (החשבוניות הפתוחות לפי מועד, סה״כ באגורות). כמה מטבעות ⇒ סה״כ 0 (אין חיבור שקל+דולר)."""
        invs = self.db.q("SELECT * FROM invoices WHERE customer_id=? AND status='open' "
                         "ORDER BY due, id", (customer_id,))
        if len({r["currency"] for r in invs}) > 1:
            return invs, 0
        return invs, sum(r["amount_agorot"] for r in invs)

    def propose_plan(self, customer_id: int, installments: int | None = None) -> int | None:
        invs, total = self.open_debt(customer_id)
        if not invs or total <= 0:
            return None
        items = plans.propose(total, self.clock().date() + timedelta(days=7), installments)
        data = [{"n": i.n, "due": i.due.isoformat(), "amount_agorot": i.amount_agorot}
                for i in items]
        # invoice_id = החשבונית הוותיקה (עוגן, לתאימות); invoice_ids = כל מה שנכלל בהסדר
        pid = self.db.x("INSERT INTO plans(customer_id,invoice_id,installments,status,created_at,"
                        "invoice_ids) VALUES(?,?,?, 'proposed', ?, ?)",
                        (customer_id, invs[0]["id"], json.dumps(data), _iso(self.clock()),
                         json.dumps([r["id"] for r in invs])))
        self.audit("system", "plan_proposed", {"plan": pid, "invoices": len(invs)})
        return pid

    def approve_plan(self, plan_id: int, actor: str = "owner", *, confirm_amount: bool = False) -> dict:
        p0 = self.db.one("SELECT customer_id FROM plans WHERE id=?", (plan_id,))
        if p0 and not confirm_amount and self._amount_outliers(self.db.q(
                "SELECT * FROM invoices WHERE customer_id=? AND status='open'", (p0["customer_id"],))):
            # critic סבב 48: הצעת פריסה על סכום חריג (פי 50) — אותו כלל של הפעלה 123
            raise ValueError("סכום חריג מאוד מהרגיל ללקוח (אולי נקודה עשרונית במקום הלא נכון?) — "
                             "יש לאשר במפורש שהסכום נכון (confirm_amount)")
        # critic סבב 40: תפיסה אטומית proposed ⇒ approving. שני אישורים במקביל (לחיצה כפולה / שתי
        # לשוניות) עברו שניהם את הבדיקה ⇒ שתי טיוטות ⇒ שני אישורי הסדר ללקוח.
        if self.db.update("UPDATE plans SET status='approving' WHERE id=? AND status='proposed'",
                          (plan_id,)) != 1:
            raise ValueError("הסדר לא קיים או כבר הוכרע")
        try:
            return self._approve_plan_claimed(plan_id, actor)
        finally:   # כל יציאה שלא קבעה מצב סופי (שגיאת רענון וכד׳) ⇒ חוזר להצעה
            self.db.x("UPDATE plans SET status='proposed' WHERE id=? AND status='approving'", (plan_id,))

    def _approve_plan_claimed(self, plan_id: int, actor: str) -> dict:
        p = self.db.one("SELECT * FROM plans WHERE id=?", (plan_id,))
        cust = self.db.one("SELECT * FROM customers WHERE id=?", (p["customer_id"],))
        # ר-4 (מבקר סבב 3 🔴): הצעה של 3×400 נשלחה על חוב של 300 ⇒ רענון והשוואה לפני הכול
        if not self.refresh_customer(cust["id"]):
            raise ValueError("לא ניתן לאמת את הסכום מול המקור כרגע — ההסדר לא נשלח. נסו שוב")
        items = json.loads(p["installments"])
        if any(date.fromisoformat(i["due"]) < self.clock().date() for i in items):
            # critic סבב 30: הצעה ישנה ⇒ אישור ללקוח עם תאריכי תשלום שכבר עברו
            self.db.x("UPDATE plans SET status='superseded' WHERE id=?", (plan_id,))
            self.audit("system", "plan_dates_passed", {"plan": plan_id})
            raise ValueError("תאריכי התשלום בהצעה כבר עברו — נדרשת הצעה חדשה")
        total = sum(i["amount_agorot"] for i in items)
        if p["invoice_ids"]:
            # מבקר §4.6: ההסדר על כלל החוב ⇒ אותן חשבוניות פתוחות ואותו סה״כ, אחרת הצעה חדשה
            invs, now_total = self.open_debt(cust["id"])
            changed = (sorted(r["id"] for r in invs) != sorted(json.loads(p["invoice_ids"]))
                       or now_total != total)
        else:   # הסדר ישן (לפני invoice_ids) — על חשבונית אחת, כמו קודם
            invs = [self._invoice(p["invoice_id"])]
            now_total = invs[0]["amount_agorot"]
            changed = invs[0]["status"] != "open" or now_total != total
        if changed:
            self.db.x("UPDATE plans SET status='superseded' WHERE id=?", (plan_id,))
            self.audit("system", "plan_amount_changed", {"plan": plan_id, "plan_total": total,
                                                         "now": now_total})
            raise ValueError("היתרה השתנתה מאז שההסדר הוצע — נדרשת הצעה חדשה")
        what = (f"לחשבונית {invs[0]['number']}" if len(invs) == 1 else
                f"ל-{len(invs)} חשבוניות פתוחות ({', '.join(r['number'] for r in invs)}, "
                f"סה״כ {templates.fmt_amount(total)})")
        # ב-SMS בלי רשימת מספרים (אורך): רק כמה חשבוניות והסה״כ
        what_sms = what if len(invs) == 1 else \
            f"ל-{len(invs)} חשבוניות פתוחות (סה״כ {templates.fmt_amount(total)})"
        lines = "\n".join(f"{i['n']}. {i['due']} — {templates.fmt_amount(i['amount_agorot'])}"
                          for i in items)
        text = (f"שלום {cust['name']}, הצעת פריסה {what} ללא תוספת:\n{lines}\n"
                "השיבו \"מאשר\" ובעל העסק יאשר סופית.")
        channel = "sms" if is_il_mobile(normalize_il_phone(cust["phone"])) else "email"
        unsub = self.unsub_url(self.new_unsub_token(cust["id"]))
        if channel == "sms":
            # מבקר סבב 3 (🔴): לוח מלא של 6 תשלומים = 4+ חלקי SMS ⇒ קריסה. ב-SMS נוסח מקוצר
            first, rest = items[0]["amount_agorot"], items[-1]["amount_agorot"]
            sched = (f"{len(items)} תשלומים של {templates.fmt_amount(rest)}" if first == rest else
                     f"{len(items)} תשלומים: {templates.fmt_amount(first)} ואז {templates.fmt_amount(rest)}")
            body = (f"{self.s.business_name}: הצעת פריסה {what_sms} ללא תוספת: {sched}, "
                    f"החל מ-{items[0]['due']}. להסרה: {unsub}")
        else:
            body = f"{text}\n\nלהסרה מתזכורות: {unsub}"
        # ר-1 על כל טקסט יוצא (מבקר סבב 3 🟠): גם הצעת הפריסה עוברת במסנן
        bad = compliance.violations(body, compliance.Rules(
            business=self.s.business_name if channel == "sms" else "", unsubscribe_url=unsub,
            channel=channel, max_sms_chars=templates.SMS_HARD_MAX, own_name=self.s.business_name))
        if bad:
            raise ValueError(f"נוסח ההצעה נחסם במסנן הניסוח: {', '.join(bad)}")
        self._supersede_plan_drafts(plan_id)
        did = self.db.x(
            "INSERT INTO drafts(customer_id,channel,to_addr,body,intent,status,escalate,"
            "owner_summary,owner_actions,plan_id,created_at,decided_at,decided_by,total_agorot) "
            "VALUES(?,?,?,?, 'plan_offer', 'approved', 'none', ?, '[]', ?, ?, ?, ?, ?)",
            (cust["id"], channel, self.inbox._addr(cust, channel), body,
             "הצעת פריסה שאושרה", plan_id, _iso(self.clock()), _iso(self.clock()), actor,
             self.inbox._open_total(cust["id"])))
        self.db.x("UPDATE plans SET status='approved' WHERE id=?", (plan_id,))
        sent = self.inbox._try_send(did)
        dr = self.db.one("SELECT status, message_id FROM drafts WHERE id=?", (did,))
        if dr["status"] == "rejected":            # לא יצא (שגיאת ספק/כתובת) ⇒ ההסדר לא נעול
            self.db.x("UPDATE plans SET status='proposed' WHERE id=?", (plan_id,))
        self.audit(actor, "plan_approved", {"plan": plan_id, "draft": did,
                                            "message_id": dr["message_id"]})
        return {"plan_id": plan_id, "message_id": dr["message_id"], "channel": channel,
                "text": text, "queued": not sent and dr["status"] == "approved",
                "draft_status": dr["status"]}

    def _supersede_plan_drafts(self, plan_id: int) -> None:
        """אישור הפריסה ב-/plans שולח את ההצעה ללקוח, ולכן טיוטת plan_request המקבילה
        (תור «תשובות לקוחות») נסגרת — אחרת בעל העסק יכול לאשר אותה ולשלוח הצעה פעמיים."""
        try:
            self.db.x("UPDATE drafts SET status='superseded', decided_by='system:plan_approved' "
                      "WHERE plan_id=? AND status IN ('pending_approval','needs_owner')",
                      (plan_id,))
        except self.db.OperationalError:   # טבלת הטיוטות נוצרת רק עם מנוע השיחה
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
        """כל תזכורת פעילה **שכוללת** את החשבונית (גם מאוחדת) מבוטלת — הנוסח שלה כבר לא נכון.
        התכנון הבא בונה הודעה על מה שנשאר פתוח, לאישור מחדש."""
        self.db.x("UPDATE reminders SET status='cancelled', block_reason=? WHERE status IN (?,?) "
                  "AND (invoice_id=? OR id IN (SELECT reminder_id FROM reminder_invoices "
                  "WHERE invoice_id=?))", (reason, *ACTIVE, iid, iid))


def email_auth_verdict(header: str) -> dict:
    """טהור. Authentication-Results ⇒ {spf, dkim, dmarc, verified}. verified רק כש-DMARC עבר, או
    (בלי DMARC) SPF או DKIM עברו. כותרת חסרה ⇒ לא מאומת (לא מניחים שעבר)."""
    h = (header or "").lower()
    res = {}
    for k in ("spf", "dkim", "dmarc"):
        m = re.search(rf"\b{k}=([a-z]+)", h)
        res[k] = m.group(1) if m else "none"
    ok = res["dmarc"] == "pass" or (res["dmarc"] == "none" and "pass" in (res["spf"], res["dkim"]))
    return {**res, "verified": ok}


class _CreditHeld(Exception):  # noqa: N818
    """רענון גילה זיכוי חדש שלא ניתן לשייך ⇒ הלקוח הושהה (credit_review). פנימי לשירות."""


def _rebuild_keep_log(old: DryRunSender, s: Settings) -> DryRunSender:
    new = build_dry_sender(s)
    new.sent = old.sent          # יומן ה-dry-run נשמר
    return new


def _orbit_join(t: dict) -> str:
    """עסק שמשלם דרך אורביט: ההצטרפות היא שם, לא בגבי."""
    if t.get("source") != "orbit":
        return ""
    url = t.get("billing_url")
    return f" ההצטרפות והתשלום — דרך אורביט: {url}" if url else " ההצטרפות והתשלום — דרך אורביט."


def _in_days(n: int) -> str:
    """עברית תקינה: מחר / בעוד יומיים / בעוד N ימים (לא "בעוד 1 ימים")."""
    return {1: "מחר", 2: "בעוד יומיים"}.get(n, f"בעוד {n} ימים")


_UNSUB_TOKEN = re.compile(r"(/u/)[A-Za-z0-9_-]{16,}")


def redact_tokens(text):
    """critic סבב 6 (R3 של QA לא הושלם): טוקן ההסרה נשמר כ-hash ב-link_tokens, אבל הגלוי נשאר
    בעותקים של ההודעות שנשלחו (messages.body/payload, reminders.payload). מי שקורא את ה-DB יכול
    להסיר כל לקוח. אחרי השליחה שומרים רק מסווה. הקישור עצמו ממשיך לעבוד דרך ה-hash."""
    return _UNSUB_TOKEN.sub(r"\1[redacted]", text) if text else text


def _sha(payload: str) -> str:
    return hashlib.sha256((payload or "").encode()).hexdigest()


__all__ = ["CollectService", "build_dry_sender", "message_from_json"]
