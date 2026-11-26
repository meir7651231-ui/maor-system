"""FastAPI — "גבי – תזכורות תשלום".

הפעלה: uvicorn app.main:_lazy_app --factory (dry-run בלבד).
"""
from __future__ import annotations

import gzip
import hmac
import json
import logging
import os
import re
from datetime import timedelta
from html import escape as html_escape
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response
from pydantic import BaseModel, Field

from . import csp, dbcrypt, security
from .config import SafetyError, Settings, load_settings
from .db import DB
from .greeninvoice import GreenInvoiceClient
from .integrations.base import jstr
from .ratelimit import RateLimiter, group_for
from .service import SYNC_PAGE_CAP_MSG, CollectService, OwnerOnly, RealDataBlocked, is_page_cap
from .templates import SLOGAN, TAGLINE
from .users import Users

# הפעלה 170: `/ui` מבקש בכל רענון (גם אחרי כל פעולה) את `/dashboard` ואת `/reminders` — על 5,000 חשבוניות
# 2.46MB + 0.5MB, לא דחוסים. JSON כזה נדחס פי ~20 (מפתחות חוזרים). הדחיסה רק לתשובות הגדולות שהדפים טוענים
# בכל רענון (`/ui`: שתי תצוגות `view=list`; `/app/`, הפעלה 173: `/dashboard` המלא ו-`/reminders?view=summary`),
# לא לכל האפליקציה: אין שם סוד שמשתקף לצד קלט של תוקף (BREACH), כי ההרשאה ב-Bearer מ-sessionStorage ולא בעוגייה.
GZIP_MIN = 1400


def _accepts_gzip(request: Request) -> bool:
    for part in request.headers.get("accept-encoding", "").lower().split(","):
        name, _, params = part.strip().partition(";")
        if name.strip() in ("gzip", "*"):
            q = params.replace(" ", "")
            try:
                return not q.startswith("q=") or float(q[2:]) > 0     # gzip;q=0 = «לא לדחוס»
            except ValueError:
                return False
    return False


def _cacheable_static(path: str) -> bool:
    """רק נכסי ה-build של /app/ (קבצים עם סיומת, בלי נתוני לקוחות) רשאים להישמר במטמון.
    /app/ עצמו (index.html) לא: אחרת דפדפן עלול להחזיק דף ישן אחרי פריסה."""
    if not path.startswith("/app/"):
        return False
    last = path.rsplit("/", 1)[-1]
    return "." in last and not last.endswith(".html")


def gzip_json(request: Request, data) -> Response:
    """JSON רגיל (אותו גוף כמו תשובה רגילה של FastAPI), דחוס ב-gzip כשהלקוח מקבל ושווה לדחוס."""
    resp = JSONResponse(data)
    if len(resp.body) < GZIP_MIN or not _accepts_gzip(request):
        resp.headers["Vary"] = "Accept-Encoding"
        return resp
    return Response(gzip.compress(resp.body, 5), media_type="application/json",
                    headers={"Content-Encoding": "gzip", "Vary": "Accept-Encoding"})

UI_HTML = (Path(__file__).parent / "ui.html").read_text(encoding="utf-8")
UI_CSP = csp.inline_script_csp(UI_HTML)


MAX_WEBHOOK_BODY = 16 * 1024


class EmailIn(BaseModel):
    sender: str
    text: str
    message_id: str = ""
    # critic 3.6.7: כותרת Authentication-Results כפי שספק ה-inbound-parse מעביר (שם השדה לאמת לכל ספק)
    auth_results: str = Field(default="", max_length=4000)
    # critic סבב 125: נושא המייל — משמש רק כשהגוף ריק אחרי הסרת הציטוט («הסר» בשורת הנושא)
    subject: str = Field(default="", max_length=998)


class DraftEdit(BaseModel):
    body: str | None = None
    confirm_amount: bool = False   # critic סבב 48: סכום חריג ⇒ אישור מפורש


class EmailBounceIn(BaseModel):
    confirm: bool                     # True = הכתובת לא תקינה (חסימת מייל) · False = המיילים חוזרים


class HoldIn(BaseModel):
    reason: Literal["minor", "deceased", "insolvency"]
    note: str = Field("", max_length=500)


class LegalHoldIn(BaseModel):
    note: str | None = Field(None, max_length=500)   # None/"" ⇒ ביטול


# מסכים שמחזירים מידע אישי של לקוחות (שם/טלפון/מייל/סכום/תוכן הודעות) ⇒ כל צפייה נרשמת
PII_READ_ROUTES = frozenset({
    "/reminders", "/reminders/{rid}/preview", "/dashboard", "/customers", "/outbox",
    "/owner/inbox", "/plans", "/audit", "/conversation/drafts", "/access-log",
    "/open-list",    # שער רשימת הפתוחות: שמות לקוחות + סכומים
    "/customers/{cid}/data", "/export",
    "/dsr"})   # מרשם בקשות עיון/תיקון/מחיקה (שם לקוח + מועדים)   # מנהל 309: ייצוא לבקשת עיון (סעיף 13)


class DsrOpenIn(BaseModel):
    kind: Literal["access", "correction", "deletion"]
    note: str = Field("", max_length=500)


class DsrDoneIn(BaseModel):
    note: str = Field(..., min_length=5, max_length=500)


class InboundIn(BaseModel):
    channel: Literal["sms", "email"] = "sms"
    sender: str = Field(max_length=254)
    text: str = Field(max_length=4000)


class _RedactQueryKey(logging.Filter):
    """uvicorn (לוג גישה) ו-httpx (בקשות יוצאות) כותבים URL מלא ⇒ סוד ב-query
    (?k=..., token=, key=, secret=, password=) היה דולף ללוג. ארגומנטים שאינם מחרוזת
    (httpx.URL) מומרים למחרוזת רק אם יש בהם מה להסוות."""

    _K = re.compile(r"(?i)([?&](?:k|key|token|secret|password|api_?key|sig)=)[^&\s\"]+")

    def _red(self, a):
        s = a if isinstance(a, str) else (str(a) if not isinstance(a, (int, float)) else None)
        if s is None or not self._K.search(s):
            return a
        return self._K.sub(r"\1***", s)

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple):
            record.args = tuple(self._red(a) for a in record.args)
        if isinstance(record.msg, str) and self._K.search(record.msg):
            record.msg = self._K.sub(r"\1***", record.msg)
        return True


def _install_log_redaction() -> None:
    for name in ("uvicorn.access", "uvicorn.error", "httpx", "httpx2", "httpcore"):
        lg = logging.getLogger(name)
        if not any(isinstance(f, _RedactQueryKey) for f in lg.filters):
            lg.addFilter(_RedactQueryKey())


_UNSUB_INVALID = ("<h1>הקישור אינו תקף</h1><p>ייתכן שהקישור הועתק חלקית או שכבר אינו בשימוש. "
                  "כדי להפסיק תזכורות — השיבו «הסר» להודעה או פנו ישירות לבעל העסק.</p>")


def _unsub_page(body: str, status: int = 200) -> HTMLResponse:
    # critic סבב 41: אותה תבנית כמו /p/ (מצב כהה, משתנים, כפתורים 48px) — היה HTML בלי עיצוב
    return HTMLResponse(_PAGE.format(title="הפסקת תזכורות", body=body),
                        status_code=status,
                        headers={"Cache-Control": "no-store", "X-Robots-Tag": "noindex",
                                 "Referrer-Policy": "no-referrer"})



class OrbitSecretIn(BaseModel):
    org: str = Field(max_length=63)


class LoginIn(BaseModel):
    email: str = Field(max_length=200)
    password: str = Field(max_length=200)
    code: str = Field(max_length=12)

def create_app(service: CollectService | None = None, *, owner_token: str | None = None,
               webhook_secret: str | None = None,
               limiter: RateLimiter | None = None) -> FastAPI:
    """אימות: כל נקודה מלבד /health, /ui, /u/{token} ו-webhook של 019 (שיש לו מפתח משלו)
    דורשת `Authorization: Bearer <OWNER_API_TOKEN>`. /inbound מקבל גם חתימת HMAC
    (X-Collect-Timestamp + X-Collect-Signature). טוקן חסר/חלש ⇒ האפליקציה לא עולה."""
    demo_service = False
    built_from_env = service is None   # נתיב הפריסה (uvicorn --factory); בבדיקות השירות מוזרק
    if service is None and os.environ.get("DEMO") == "1":
        from .demo import demo_service_ready  # נתוני דמו בדויים + sandbox מדומה, בלי רשת
        service = demo_service_ready()
        demo_service = True
    if service is None:
        s: Settings = load_settings()
        gi = (GreenInvoiceClient(s.greeninvoice_base_url, s.greeninvoice_api_id,
                                 s.greeninvoice_api_secret)
              if s.greeninvoice_api_id else None)
        service = CollectService(s, DB(s.db_path), gi=gi)
    svc = service
    token = owner_token if owner_token is not None else (
        svc.s.owner_api_token or os.environ.get("OWNER_API_TOKEN", ""))
    wh_secret = webhook_secret if webhook_secret is not None else svc.s.inbound_webhook_secret
    if not security.strong_token(token):
        raise SafetyError("OWNER_API_TOKEN חסר או חלש (נדרשים 32+ תווים) — ה-API לא יעלה בלי אימות")
    _install_log_redaction()
    docs = os.environ.get("EXPOSE_DOCS") == "1"
    app = FastAPI(title=SLOGAN + " (dry-run)", docs_url="/docs" if docs else None,
                  redoc_url=None, openapi_url="/openapi.json" if docs else None)
    app.state.svc = svc
    web_dist = Path(os.environ.get("WEB_DIST", Path(__file__).resolve().parent.parent / "web" / "dist"))
    rl = limiter if limiter is not None else RateLimiter()
    app.state.limiter = rl
    trust_proxy = os.environ.get("TRUST_PROXY_HEADERS") == "1"

    def client_ip(request: Request) -> str:
        if trust_proxy:  # רק מאחורי proxy שלנו: הכתובת הימנית = מה שה-proxy ראה בפועל
            xff = [x.strip() for x in request.headers.get("x-forwarded-for", "").split(",")]
            if xff and xff[-1]:
                return xff[-1]
        return request.client.host if request.client else "unknown"

    def too_many(retry: float) -> JSONResponse:
        return JSONResponse({"detail": "יותר מדי בקשות, נסו שוב בעוד רגע"}, status_code=429,
                            headers={"Retry-After": str(int(retry) + 1)})

    @app.middleware("http")
    async def rate_limit(request: Request, call_next):
        ip = client_ip(request)
        group = group_for(request.url.path)
        if group:
            retry = rl.check(group, ip)
            if retry is not None:
                return too_many(retry)
        if request.url.path == "/webhooks/greeninvoice" or \
                request.url.path.startswith("/webhooks/source/"):
            retry = rl.check("gi_webhook_global", "*")  # כל קריאה = sync מלא
            if retry is not None:
                return too_many(retry)
        if group is None and request.url.path not in ("/health",):
            retry = rl.blocked("auth_fail", ip)
            if retry is not None:
                return too_many(retry)
        resp = await call_next(request)
        if resp.status_code == 401:
            rl.check("auth_fail", ip)  # רושמים כשל אימות (ניחוש טוקן)
        return resp

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        resp = await call_next(request)
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "no-referrer")
        # critic סבב 70: עמוד החייב /p/ ו-/api/pay/ (סכום + מספר חשבונית) נשלחו בלי noindex; רק /u/ סומן. גבי אינו
        # אתר תוכן ⇒ ברירת מחדל לכל תשובה (קישור שהועבר/פורסם לא יאונדקס)
        resp.headers.setdefault("X-Robots-Tag", "noindex, nofollow")
        # הפעלה 172 (פתוח מביקורת 170): תשובות ה-API ועמודי /p/ מכילים שמות, טלפונים וסכומי חוב.
        # בלי Cache-Control דפדפן/פרוקסי רשאי לשמור אותן (מטמון היוריסטי, כפתור «אחורה» אחרי
        # יציאה). ברירת מחדל no-store לכל דבר; חריג יחיד: נכסי /app/ הסטטיים (JS/CSS בלי נתונים).
        if not _cacheable_static(request.url.path):
            resp.headers.setdefault("Cache-Control", "no-store")
        # הפעלה 193 (critic סבב 70 💡): CSP לכל HTML. עמוד שלא קבע מדיניות משלו ⇒ לפי הנתיב (csp.for_path):
        # עמודי החייב בלי סקריפט בכלל; /app/ ו-/pay/ סקריפטים מ-self בלבד
        if (resp.headers.get("content-type") or "").startswith("text/html"):
            resp.headers.setdefault("Content-Security-Policy", csp.for_path(request.url.path))
        return resp

    users = Users(svc.db, svc.clock)
    require_login = os.environ.get("REQUIRE_USER_LOGIN") == "1"
    if built_from_env and getattr(svc.s, "real_data_allowed", False) and not require_login:
        # critic סבב 17 (פתוח מסבב 7): נתוני חייבים אמיתיים (שער 4) עם הטוקן המשותף פתוח = גישה
        # בלי עובד מזוהה ובלי 2FA (שער 6). נכשל סגור בנתיב הפריסה: לא עולים בשילוב הזה.
        # (שירות מוזרק = בדיקות הלוגיקה עם הטוקן המשותף; השער עצמו נבדק ב-test_users_2fa.)
        raise SafetyError("REAL_DATA_ALLOWED=1 מחייב REQUIRE_USER_LOGIN=1 (משתמש לכל עובד + 2FA, "
                          "בלי טוקן משותף) — legal/BETA-GATE.md שער 6")
    if (built_from_env and getattr(svc.s, "real_data_allowed", False)
            and dbcrypt.mode() != dbcrypt.SQLCIPHER and os.environ.get("ACK_PLAINTEXT_DB") != "1"):
        # critic סבב 22: נתוני חייבים אמיתיים (שער 4) על DB גלוי (DB_ENCRYPTION כבוי) עלו בשקט, אף ששער 5
        # דורש DB מוצפן במנוחה. נכשל סגור; חריגה רק בהחלטה מפורשת (ACK_PLAINTEXT_DB=1 — שער 5 🟡 עם תוכנית).
        raise SafetyError("REAL_DATA_ALLOWED=1 על DB לא מוצפן — הגדירו DB_ENCRYPTION=sqlcipher, "
                          "או ACK_PLAINTEXT_DB=1 בהחלטה מפורשת — legal/BETA-GATE.md שער 5")
    if built_from_env and getattr(svc.s, "real_data_allowed", False) and os.environ.get("ACK_NO_OPTOUT_LEDGER") != "1":
        # critic סבב 176: יומן ההסרות (OPTOUT_LEDGER, מחוץ ל-DB) הוא מה ששחזור גיבוי מחיל כדי לא להחזיר הסרות
        # (ממצא 175). נתונים אמיתיים עלו בלעדיו בשקט ⇒ אחרי שחזור בעל העסק «מאשר שהחיל הסרות» בלי מקור.
        # נכשל סגור, כמו שער 5; חריגה רק בהחלטה מפורשת (ACK_NO_OPTOUT_LEDGER=1) — legal/BETA-GATE.md שער 5א.
        ledger = (svc.s.optout_ledger or "").strip()
        if not ledger:
            raise SafetyError("REAL_DATA_ALLOWED=1 בלי OPTOUT_LEDGER — שחזור גיבוי לא יחזיר הסרות שהתבקשו אחריו. "
                              "הגדירו OPTOUT_LEDGER לקובץ מחוץ לתיקיית ה-DB והגיבויים, "
                              "או ACK_NO_OPTOUT_LEDGER=1 בהחלטה מפורשת — legal/BETA-GATE.md שער 5א")
        lp = Path(ledger)
        if not lp.parent.is_dir() or not os.access(lp.parent, os.W_OK) or (lp.exists() and not os.access(lp, os.W_OK)):
            # תיקייה חסרה / בלי הרשאת כתיבה ⇒ כל הסרה הייתה נכשלת ביומן. עדיף לא לעלות מאשר לגלות בשחזור.
            raise SafetyError(f"OPTOUT_LEDGER לא ניתן לכתיבה ({lp.parent}) — צרו את התיקייה עם הרשאת כתיבה")
    # critic סבב 8: עובד הדמו (סיסמה ידועה מהסביבה + סוד TOTP בקובץ) נוצר על **כל** שירות כש-DEMO=1,
    # גם על DB אמיתי. אם הסביבה דולפת לפרודקשן, זו דלת אחורית. וגם: הפעלה מחדש עם DB קבוע קרסה
    # («משתמש כבר קיים»). עכשיו: רק על שירות הדמו שנבנה כאן, אף פעם לא בבטא אמיתית, ורק אם לא קיים.
    if demo_service and os.environ.get("DEMO_USER_EMAIL") and \
            os.environ.get("REQUIRE_USER_LOGIN") != "1" and \
            not svc.db.one("SELECT 1 FROM users WHERE email=?",
                           (os.environ["DEMO_USER_EMAIL"].strip().lower(),)):
        reg = users.create(os.environ["DEMO_USER_EMAIL"], "עובד דמו",
                           os.environ.get("DEMO_USER_PASSWORD", ""))
        if os.environ.get("DEMO_USER_SECRET_FILE"):
            Path(os.environ["DEMO_USER_SECRET_FILE"]).write_text(reg["totp_secret"])
    # מנהל 330: עובדת דמו שנייה (תמיד staff) — כדי שמסע הדפדפן של «צוות ותפקידים» ילחץ על הכפתורים
    # (מינוי/הורדה/השבתה/הפעלה מחדש) ולא רק יראה את הבעלים האחרון. אותם שומרים בדיוק: שירות דמו בלבד,
    # לא בבטא אמיתית, ורק אחרי שבעל העסק כבר קיים (אחרת היא הייתה הופכת לבעלים הראשון).
    if demo_service and os.environ.get("DEMO_STAFF_EMAIL") and \
            os.environ.get("REQUIRE_USER_LOGIN") != "1" and \
            svc.db.one("SELECT 1 FROM users WHERE role='owner' AND active=1") and \
            not svc.db.one("SELECT 1 FROM users WHERE email=?",
                           (os.environ["DEMO_STAFF_EMAIL"].strip().lower(),)):
        users.create(os.environ["DEMO_STAFF_EMAIL"], "עובדת דמו",
                     os.environ.get("DEMO_STAFF_PASSWORD", ""), role="staff")

    def owner(request: Request) -> None:
        presented = security.bearer(request.headers.get("authorization"))
        actor = users.actor(presented) if presented else None
        if actor is None:
            # הטוקן המשותף נשאר לתאימות לאחור; REQUIRE_USER_LOGIN=1 (בטא אמיתית) סוגר אותו
            if require_login or not security.token_ok(presented, token):
                raise HTTPException(401, "נדרש אימות", headers={"WWW-Authenticate": "Bearer"})
            actor = "owner"
        request.state.actor = actor
        # critic 179: «בעל העסק» = הטוקן המשותף **או** עובד מחובר בתפקיד owner (בבטא הטוקן המשותף סגור)
        request.state.is_owner = actor == "owner" or (presented is not None and users.is_owner(presented))
        # תיעוד צפייה במידע אישי (legal/BETA-GATE.md שער 6): השחקן הוא העובד המחובר
        route = getattr(request.scope.get("route"), "path", "")
        if request.method == "GET" and route in PII_READ_ROUTES:
            svc.log_access(actor, "GET", route, request.url.path)

    auth_dep = [Depends(owner)]

    @app.post("/auth/login")
    def auth_login(body: LoginIn, request: Request):
        tok = users.login(body.email, body.password, body.code, ip=client_ip(request))
        if tok is None:
            # critic סבב 7: השדה נקרא email_sha אבל הכיל מייל מוסווה ("w***@biz.example") ביומן שלא נמחק
            import hashlib as _h
            svc.audit("anon", "login_failed", {"email_sha": _h.sha256(
                body.email.strip().lower().encode()).hexdigest()[:16]})
            # מסך ההתחברות (שער 6): נעילת (מייל, IP) ⇒ 429 עם Retry-After, כדי שהעובדת תדע לחכות
            # במקום לנחש שוב. הנעילה נספרת גם למייל שאינו קיים ⇒ ה-429 לא מגלה קיום חשבון.
            left = users.ip_locked_for(body.email, client_ip(request))
            if left:
                return JSONResponse({"detail": "יותר מדי ניסיונות כניסה. הכניסה ננעלה זמנית"},
                                    status_code=429, headers={"Retry-After": str(left)})
            raise HTTPException(401, "פרטי ההתחברות או קוד האימות שגויים")
        svc.audit(users.actor(tok) or "user:?", "login", None)   # פסאודונים, לא מייל (critic סבב 10)
        return {"token": tok, "expires_hours": 12}

    @app.get("/auth/me", dependencies=auth_dep)
    def auth_me(request: Request):
        """מי מחובר (לממשק): עובד ⇒ שם התצוגה שלו; טוקן משותף ⇒ owner. לא נרשם ביומן הצפייה."""
        t = security.bearer(request.headers.get("authorization"))
        me = users.whoami(t) if t else None
        return me or {"actor": request.state.actor, "kind": "owner", "name": "", "owner": True}

    @app.post("/auth/logout")
    def auth_logout(request: Request):
        t = security.bearer(request.headers.get("authorization"))
        if t:
            actor = users.actor(t)
            users.logout(t)
            if actor:
                svc.audit(actor, "logout", None)
        return {"ok": True}

    async def owner_or_signed(request: Request) -> None:
        if security.token_ok(security.bearer(request.headers.get("authorization")), token):
            return
        body = await request.body()
        if security.verify_webhook(wh_secret, request.headers.get("x-collect-timestamp"),
                                   request.headers.get("x-collect-signature"), body):
            return
        raise HTTPException(401, "חתימה לא תקינה")

    auth = [Depends(owner)]

    def guard(fn, *a):
        try:
            return fn(*a)
        except RealDataBlocked as e:   # מבקר 222: שער בטא 4 גם ב-POST /sync ⇒ 403 כמו ב-CSV (לא 500)
            raise HTTPException(403, str(e)) from e
        except KeyError:
            raise HTTPException(404, "לא נמצא") from None
        except ValueError as e:
            # הפעלה 146: אותה הכרעה שוב (אישור שכבר נרשם) ⇒ 409 עם כותרת שהממשק מזהה ומציג «כבר אושרה»
            state = getattr(e, "state", None)
            # הפעלה 149: אישור על נוסח ישן (seen_hash) ⇒ כותרת שהממשק מזהה וטוען את התצוגה המקדימה מחדש
            stale = getattr(e, "stale", None)
            headers = {**({"X-Gabi-Already": state} if state else {}), **({"X-Gabi-Stale": stale} if stale else {})}
            raise HTTPException(409, str(e), headers=headers or None) from e
        except RuntimeError as e:
            # מנהל 431: תקרת עמודים ⇒ הסבר בעברית במקום «page_cap: more than 200 pages (types=…)»
            raise HTTPException(503, SYNC_PAGE_CAP_MSG if is_page_cap(e) else str(e)) from e

    @app.get("/health")
    def health():
        return {"status": "ok", "product": SLOGAN, "tagline": TAGLINE, "send_mode": svc.s.send_mode,
                "greeninvoice_env": svc.s.greeninvoice_env, "dry_run": svc.s.dry_run,
                "channels": list(svc.s.channels), "sms_provider": svc.s.sms_provider,
                "trial": svc.trial(),
                # הממשק: כש-True מוצגת רק כניסת עובד (מייל+סיסמה+קוד), בלי «קוד גישה משותף»
                "login_required": require_login}

    @app.get("/", response_class=HTMLResponse)
    @app.get("/ui", response_class=HTMLResponse)
    def ui():
        return HTMLResponse(UI_HTML, headers={"Content-Security-Policy": UI_CSP})

    # הכרעת מאיר 6.11: הדף המעוצב ב-/app/ הוא דף הנחיתה היחיד. /landing = הפניה מקומית בלבד
    # (התוכן הייחודי שלו הועבר ל-web/src/pages/Landing.tsx). בלי build — נופלים ל-/ui.
    @app.get("/landing")
    def landing():
        built = (web_dist / "index.html").is_file()
        return RedirectResponse("/app/" if built else "/ui", status_code=307)

    @app.post("/sync", dependencies=auth)
    def sync():
        return guard(svc.sync)

    @app.post("/plan", dependencies=auth)
    def plan():
        return {"created": svc.plan()}

    # מנהל 337: הזזת שעון ההדגמה — כדי ש-e2e בדפדפן יכסה מצבים שתלויים בזמן (הסדר «הוחמץ» אחרי 7 ימי חסד),
    # שעד היום כוסו רק ב-pytest. קיים **רק** בשירות דמו (DEMO=1: מסד בזיכרון, נתונים בדויים, dry-run) ורק עם
    # opt-in נוסף DEMO_CLOCK=1; בכל מקרה אחר הנתיב לא נרשם בכלל (404). רק קדימה, 1–90 ימים, עם אימות בעלים.
    # השעון משותף ל-Users (סשנים/TOTP) — הזזה ארוכה עלולה לפוג סשן של עובד דמו; הבדיקות עובדות עם טוקן הבעלים.
    if demo_service and os.environ.get("DEMO_CLOCK") == "1":
        from .demo import FixedClock

        @app.post("/demo/advance", dependencies=auth)
        def demo_advance(days: int, request: Request):
            # מבקר 188: `auth` מקבל גם עובד/ת מחובר/ת בתפקיד staff — «אימות בעלים» לא נאכף, ועובדת דמו הזיזה את
            # השעון לכולם (ופגה את הסשנים שלהם). עכשיו בעל העסק בלבד, כמו /team ו-restore-hold.
            if not request.state.is_owner:
                raise HTTPException(403, "רק בעל העסק מזיז את שעון ההדגמה")
            if not isinstance(svc.clock, FixedClock):
                raise HTTPException(409, "שעון ההדגמה לא קבוע")
            if not 1 <= days <= 90:
                raise HTTPException(422, "days: 1–90")
            svc.clock.now += timedelta(days=days)
            # מבקר 188: השחקן האמיתי (פסאודונים user:N או owner), לא «owner:demo» קבוע — אחרת היומן לא מגלה מי הזיז
            svc.audit(request.state.actor, "demo_clock_advanced", {"days": days})
            # הניסיון של הדמו (14 יום מ-DEMO_TRIAL_START) נגמר אחרי הזזה ארוכה ⇒ svc.plan() לא רץ בכלל. מחזירים את
            # המצב כדי שבדיקה תיכשל בהסבר ולא ב«ההסדר לא הוחמץ» (מסלול שנמצא בכתיבת הבדיקה הזו).
            return {"today": svc.clock().date().isoformat(), "trial_active": bool(svc.trial()["active"])}

    @app.get("/reminders", dependencies=auth)
    def reminders(request: Request, status: str | None = None, view: str | None = None):
        if view == "list":
            # הפעלה 162: `/ui` טען את `/reminders` המלא בכל רענון (27MB על 5,000 לקוחות: גוף + payload + HTML
            # של המייל), ומשתמש רק בשורת הרשימה. עכשיו: שדות הרשימה בלבד, בשאילתה אחת עם שם הלקוח ומספר העוגן.
            q = ("SELECT r.id, r.invoice_id, r.block_reason, r.status, r.step, r.amount_agorot, i.number, "
                 "c.name customer_name FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                 "JOIN customers c ON c.id=i.customer_id")
            rows = (svc.db.q(q + " WHERE r.status=? ORDER BY r.id", (status,)) if status
                    else svc.db.q(q + " ORDER BY r.id"))
            # הפעלה 169: חיפוש בתור של `/ui` (168) מצא תזכורת מאוחדת רק לפי מספר העוגן. `numbers` = כל מספרי
            # החשבוניות בתזכורת (לפי מועד, העוגן ראשון), בשאילתה אחת לכל הרשימה — לא אחת לכל תזכורת.
            # הפעלה 179: כל השדות הנגזרים בשתי שאילתות (`reminder_extras_many`), לא ~3.5 שאילתות לכל תזכורת
            ex = svc.reminder_extras_many(rows)
            out = []
            for r in rows:
                e = ex[r["id"]]
                row = {k: r[k] for k in ("id", "invoice_id", "block_reason", "status", "step", "number",
                                         "customer_name")}
                out.append({**row, "invoice_ids": e["invoice_ids"], "invoice_count": e["invoice_count"],
                            "total_text": e["total_text"], "amount_drift": e["amount_drift"],
                            "numbers": e["numbers"] or [r["number"]]})
            return gzip_json(request, out)
        if view == "summary":
            # critic סבב 37: הממשק צריך 4 שדות; התשובה המלאה (גוף + payload + HTML) הייתה 12MB ב-5,000 לקוחות
            q = "SELECT id, invoice_id, block_reason, status, amount_agorot FROM reminders"
            rows = svc.db.q(q + " WHERE status=? ORDER BY id", (status,)) if status else svc.db.q(q + " ORDER BY id")
            # הפעלה 135: תור האישורים ב-`/app/` צריך לדעת שתזכורת כוללת כמה חשבוניות ומה הסה״כ שלה
            ex = svc.reminder_extras_many(rows)   # הפעלה 179: שתי שאילתות לכל הרשימה
            out = []
            for r in rows:
                e = ex[r["id"]]
                row = {k: r[k] for k in ("id", "invoice_id", "block_reason", "status")}
                # הפעלה 159: אותו amount_drift כמו בתצוגה המלאה (157), כדי שהתצוגה המקוצרת לא תסמן
                # תזכורת מאושרת שהסכום שלה השתנה במקור כ«מאושרת» רגילה. מחושב רק לתזכורת מאושרת.
                out.append({**row, "invoice_ids": e["invoice_ids"], "invoice_count": e["invoice_count"],
                            "total_text": e["total_text"], "amount_drift": e["amount_drift"]})
            # הפעלה 173: `/app/` טוען את התצוגה הזו בכל רענון של לוח הבקרה ⇒ אותה דחיסה כמו של `/ui` (170)
            return gzip_json(request, out)
        sql, args = ("SELECT r.*, i.number, i.amount_agorot, i.currency, c.name customer_name "
                     "FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                     "JOIN customers c ON c.id=i.customer_id"), ()
        if status:
            sql, args = sql + " WHERE r.status=?", (status,)
        rows = svc.db.q(sql + " ORDER BY r.id", args)
        # תזכורת מאוחדת (critic 15.1/2.12): כל החשבוניות שבהודעה; invoice_id = העוגן
        ex = svc.reminder_extras_many(rows)   # הפעלה 179: אותם שדות, שתי שאילתות לכל הרשימה
        return [{**dict(r), "payload": json.loads(r["payload"]),
                 "invoice_ids": ex[r["id"]]["invoice_ids"],
                 # הפעלה 134: number/currency הם של העוגן בלבד; הרשימה מציגה כמה חשבוניות ואת הסה״כ לפי מטבע
                 "invoice_count": ex[r["id"]]["invoice_count"], "total_text": ex[r["id"]]["total_text"],
                 # הפעלה 157: תזכורת מאושרת שהסכום שלה השתנה במקור ⇒ הרשימה מסמנת שהיא תחזור לאישור
                 "amount_drift": ex[r["id"]]["amount_drift"]} for r in rows]

    @app.get("/reminders/{rid}/preview", dependencies=auth)
    def preview(rid: int):
        return guard(svc.preview, rid)

    @app.post("/reminders/{rid}/approve", dependencies=auth)
    async def approve(rid: int, request: Request):
        body = {}
        if await request.body():
            try:
                body = await request.json()
            except ValueError:
                raise HTTPException(400, "JSON לא תקין") from None
        body = body if isinstance(body, dict) else {}
        return guard(lambda: svc.approve(rid, request.state.actor,
                                         confirm_open=body.get("confirm_open") is True,
                                         confirm_amount=body.get("confirm_amount") is True,
                                         seen_hash=body["seen_hash"] if isinstance(body.get("seen_hash"), str)
                                         else None))

    @app.post("/reminders/{rid}/reject", dependencies=auth)
    def reject(rid: int, request: Request):
        return guard(svc.reject, rid, request.state.actor)

    @app.post("/dispatch", dependencies=auth)
    def dispatch():
        return {"dry_run": True, "sent": svc.dispatch()}

    # ---------- שער «אישור רשימת הפתוחות» (לפני תזכורת ראשונה) ----------
    @app.get("/open-list", dependencies=auth)
    def open_list():
        return svc.open_list()

    @app.post("/open-list/confirm", dependencies=auth)
    async def open_list_confirm(request: Request):
        try:
            body = await request.json()
        except ValueError:
            raise HTTPException(400, "JSON לא תקין") from None
        if not isinstance(body, dict) or set(body) - {"still_open", "paid", "due"}:
            raise HTTPException(422, "גוף: {still_open: [id], paid: [id], due?: {id: YYYY-MM-DD}}")
        ids = {k: body.get(k, []) for k in ("still_open", "paid")}
        if not all(isinstance(v, list) and all(isinstance(i, int) and not isinstance(i, bool)
                                               for i in v) for v in ids.values()):
            raise HTTPException(422, "still_open/paid: רשימות של מזהי חשבונית (מספרים)")
        # הכרעת רכז: תיקון מועד (בעיקר «מועד מוערך») לפני האישור. JSON ⇒ מפתחות מחרוזת
        raw_due = body.get("due", {})
        if not isinstance(raw_due, dict) or not all(
                isinstance(k, str) and k.isdigit() and isinstance(v, str) for k, v in raw_due.items()):
            raise HTTPException(422, "due: {מזהה חשבונית: YYYY-MM-DD}")
        due = {int(k): v for k, v in raw_due.items()}
        return guard(lambda: svc.confirm_open_list(ids["still_open"], ids["paid"], due=due))

    @app.get("/dashboard", dependencies=auth)
    def dashboard(request: Request, view: str | None = None):
        # הפעלה 170: `view=list` = השדות ש-`/ui` מציג בלבד (כמו `/reminders?view=list`, 162), דחוס
        if view == "list":
            return gzip_json(request, svc.dashboard("list"))
        # הפעלה 173: `/dashboard` המלא (של `/app/`) — אותו תוכן, דחוס כשהדפדפן מקבל (2.46MB על 5,000 חשבוניות)
        return gzip_json(request, svc.dashboard())

    @app.get("/customers", dependencies=auth)
    def customers():
        return [dict(r) for r in svc.db.q("SELECT * FROM customers ORDER BY id")]

    @app.get("/dsr", dependencies=auth)
    def dsr_list():
        from . import dsr
        return dsr.listing(svc)

    @app.post("/customers/{cid}/dsr", dependencies=auth)
    def dsr_open(cid: int, b: DsrOpenIn, request: Request):   # בקשה שהגיעה בטלפון / בכתב לעסק
        from . import dsr
        if not svc.db.one("SELECT 1 FROM customers WHERE id=?", (cid,)):
            raise HTTPException(404, "לא נמצא")
        if b.kind == "deletion":
            # הכרעת ראש צוות (ממצא QA, סט #22b): מחיקת לקוח = בעל העסק בלבד — גם פתיחת בקשת המחיקה ידנית. בקשה שהגיעה
            # בהודעה מהלקוח עדיין נרשמת אוטומטית (dsr.detect), כך שהבקשה לא אובדת והמועד נספר
            owner_only(request, "dsr_deletion_open", {"customer": cid}, "רק בעל העסק פותח בקשת מחיקה")
        # מבקר 192: היומן רשם «owner» קבוע גם כשעובד/ת פתח/ה או סגר/ה בקשת פרטיות — השחקן האמיתי (שער 6)
        rid = guard(lambda: dsr.open_request(svc, cid, b.kind, "owner", b.note, actor=request.state.actor))
        if rid is None:
            raise HTTPException(409, "כבר קיימת בקשה פתוחה מסוג זה ללקוח")
        return {"id": rid}

    def owner_only(request: Request, action: str, detail: dict, msg: str) -> None:
        """הכרעת ראש צוות (ממצא QA, 20.11 — דפוס 190ב/191): מחיקת לקוח, ייצוא נתונים ותחזוקה = בעל העסק בלבד.
        עובד/ת ⇒ 403 + audit של הניסיון עם השחקן האמיתי."""
        if not request.state.is_owner:
            svc.audit(request.state.actor, action + "_refused", detail)
            raise HTTPException(403, msg)

    @app.post("/dsr/{rid}/done", dependencies=auth)
    def dsr_done(rid: int, b: DsrDoneIn, request: Request):
        from . import dsr
        row = svc.db.one("SELECT kind FROM dsr WHERE id=?", (rid,)) if svc._table_exists("dsr") else None
        if row and row["kind"] == "deletion":
            # סגירת בקשת מחיקה = אישור שהמחיקה בוצעה ⇒ בעל העסק בלבד. פתיחת בקשה (רישום מה שהלקוח ביקש) — פתוחה
            owner_only(request, "dsr_deletion_close", {"dsr": rid}, "רק בעל העסק סוגר בקשת מחיקה (מאשר שהמחיקה בוצעה)")
        return guard(dsr.close_request, svc, rid, b.note, request.state.actor)

    @app.get("/customers/{cid}/data", dependencies=auth)
    def customer_data(cid: int, request: Request):                     # מנהל 309: זכות עיון
        # הכרעת ראש צוות (20.11): ייצוא כל המידע על לקוח = בעל העסק בלבד (בעל השליטה; מזעור גישה לפי תקנות
        # האבטחה). עובד/ת ⇒ 403 + audit. בקשת העיון עצמה נרשמת במרשם (dsr) והמועד נספר — בעל העסק מייצא ומשיב.
        if not request.state.is_owner:
            svc.audit(request.state.actor, "data_export_refused", {"customer": cid})
            raise HTTPException(403, "רק בעל העסק מייצא את המידע על לקוח (בקשת עיון)")
        return guard(svc.customer_data_export, cid, request.state.actor)

    @app.post("/invoices/{iid}/mark-paid", dependencies=auth)
    def mark_paid(iid: int, request: Request):
        return guard(svc.mark_paid_outside, iid, request.state.actor)

    @app.post("/customers/{cid}/resume", dependencies=auth)
    def resume(cid: int, request: Request):
        # critic סבב 191א: השהיה שבעל העסק סימן (OWNER_HOLDS — קטין/פטירה/חדלות פירעון, ר-6 «השהיה קשה») בוטלה ע״י
        # עובד/ת בשקט ⇒ תזכורות למשפחת נפטר/ת. ביטול השהיית-בעלים = בעל העסק בלבד; השהיות אחרות — כמו קודם
        from .policy import OWNER_HOLDS
        c = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))
        if c and (c["paused_reason"] or "").split(":", 1)[0] in OWNER_HOLDS and not request.state.is_owner:
            svc.audit(request.state.actor, "owner_hold_resume_refused", {"customer": cid})
            raise HTTPException(403, "רק בעל העסק יכול לבטל השהיה שהוא סימן (קטין / פטירה / חדלות פירעון)")
        return guard(svc.resume_customer, cid, request.state.actor)

    @app.post("/customers/{cid}/lift-inherited-optout", dependencies=auth)
    def lift_inherited_optout(cid: int, request: Request):
        # מנהל 405 (מבקר 240א): ביטול הסרה = הכרעה משפטית (§30א) ⇒ בעל העסק בלבד, כמו ביטול השהיית-בעלים (191א)
        if not request.state.is_owner:
            svc.audit(request.state.actor, "inherited_optout_lift_refused", {"customer": cid})
            raise HTTPException(403, "רק בעל העסק מבטל הסרה שעברה בירושה")
        return guard(svc.lift_inherited_optout, cid, request.state.actor)

    @app.post("/customers/{cid}/email-bounce", dependencies=auth)
    def customer_email_bounce(cid: int, b: EmailBounceIn, request: Request):   # q22-04: הכרעת בעל העסק
        return guard(svc.confirm_email_bounce, cid, b.confirm, request.state.actor)

    # הכרעת ראש צוות q21-19: «בדוק ואשר» על מועד הבטחה שמעבר ל-max_defer_days ⇒ {"approve": true|false}
    @app.post("/customers/{cid}/promise-request", dependencies=auth)
    async def promise_request_decide(cid: int, request: Request):
        try:
            body = await request.json()
        except ValueError:
            raise HTTPException(400, "JSON לא תקין") from None
        approve = body.get("approve") if isinstance(body, dict) else None
        if not isinstance(approve, bool):
            raise HTTPException(422, "approve: true (לאשר את המועד המבוקש) או false (לסרב)")
        # מבקר 201🟠: עובד/ת אישר/ה מועד מעבר ל-max_defer_days (בלי תקרה) והלקוח קיבל «בעל העסק אישר».
        # q21-19 = הכרעת **בעל העסק** ⇒ עובד/ת ⇒ 403 + audit (שם נפרד — לא «promise_request_refused», שמשמעו הכרעה)
        if not request.state.is_owner:
            svc.audit(request.state.actor, "promise_request_refused_staff", {"customer": cid, "approve": approve})
            raise HTTPException(403, "רק בעל העסק מאשר או מסרב למועד שמעבר ל-14 יום")
        return guard(svc.decide_promise_request, cid, approve, request.state.actor)

    @app.post("/customers/{cid}/opt-out", dependencies=auth)
    def customer_opt_out(cid: int, request: Request):                  # critic סבב 97
        return guard(svc.owner_opt_out, cid, request.state.actor)

    @app.post("/customers/{cid}/hold", dependencies=auth)
    def customer_hold(cid: int, b: HoldIn, request: Request):          # ר-6
        return guard(svc.set_hold, cid, b.reason, b.note, request.state.actor)

    @app.post("/customers/{cid}/legal-hold", dependencies=auth)
    def customer_legal_hold(cid: int, b: LegalHoldIn, request: Request):   # ר-10
        # critic סבב 190ב (🔴): עובד/ת ביטל/ה legal hold בשקט ⇒ ה-purge האוטומטי (בכל plan) מתמם תיק משפטי.
        # **ביטול** = בעל העסק בלבד; **הצבת** hold (מגן בלבד) מותרת לכל מי שמחובר.
        if not (b.note or "").strip() and not request.state.is_owner:
            svc.audit(request.state.actor, "legal_hold_lift_refused", {"customer": cid})
            raise HTTPException(403, "רק בעל העסק יכול לבטל עצירת מחיקה משפטית")
        return guard(svc.set_legal_hold, cid, b.note, request.state.actor)

    @app.post("/maintenance/purge", dependencies=auth)
    def purge(request: Request):                     # ר-10 (רץ גם בכל plan)
        owner_only(request, "maintenance_purge", {}, "רק בעל העסק מריץ פעולות תחזוקה")
        return svc.purge_closed(request.state.actor)   # critic סבב 73: מי הפעיל

    @app.get("/outbox", dependencies=auth)
    def outbox(limit: int | None = None):
        # הפעלה 181: ה-SPA מציג רק את 6 האחרונות אבל משך את כל היומן בכל רענון (5,000 חשבוניות שיצאו ⇒ 2.2MB,
        # ~250ms). ?limit=N ⇒ N האחרונות בלבד (בסדר הכרונולוגי) + total. בלי limit ⇒ כמו קודם, ביט-זהה.
        sent = svc.sender.sent
        if limit is None:
            return {"dry_run": True, "messages": sent}
        if not 1 <= limit <= 500:
            raise HTTPException(400, "limit: 1–500")
        # total = לכל חיי התהליך (היומן עצמו בתקרה, הפעלה 182)
        return {"dry_run": True, "messages": sent[-limit:], "total": getattr(sent, "total", len(sent))}

    @app.post("/inbound", dependencies=[Depends(owner_or_signed)])
    def inbound(m: InboundIn):
        return guard(svc.inbound, m.channel, m.sender, m.text)

    @app.post("/webhooks/email")
    def email_webhook(m: EmailIn, k: str = ""):
        import hmac

        if not svc.s.email_webhook_key or not hmac.compare_digest(
                k.encode("utf-8"), svc.s.email_webhook_key.encode("utf-8")):
            raise HTTPException(403, "forbidden")
        return svc.email_webhook(m.sender, m.text, m.message_id, auth_results=m.auth_results,
                                 subject=m.subject)

    @app.post("/webhooks/greeninvoice")
    async def gi_webhook(request: Request, k: str = ""):
        """אירוע מסמך מ-morning (למשל קבלה נוצרה = שולם) ⇒ סנכרון מיידי במקום לחכות לסבב.

        morning לא מתעדת חתימה ל-webhook (לאמת) ⇒ סוד ב-URL, כמו ב-019. התוכן לא נחשב אמת:
        הוא רק טריגר; מצב החשבוניות נקרא מחדש מה-API המאומת (sync)."""
        if not svc.s.gi_webhook_key or not hmac.compare_digest(
                k.encode("utf-8"), svc.s.gi_webhook_key.encode("utf-8")):
            raise HTTPException(403, "forbidden")
        raw = await request.body()
        if len(raw) > MAX_WEBHOOK_BODY:
            raise HTTPException(413, "too large")
        try:
            ev = json.loads(raw or b"{}")
        except ValueError:
            raise HTTPException(400, "invalid json") from None
        if not isinstance(ev, dict) or not ev.get("id"):
            raise HTTPException(400, "missing document id")
        svc.audit("greeninvoice", "gi_webhook", {"document": jstr(ev.get("id"))[:64],
                                                 "type": ev.get("type")})
        try:
            res = svc.sync()
        except Exception as e:  # noqa: BLE001 — morning מנסים שוב; לא חושפים פרטים
            svc.audit("system", "gi_webhook_sync_failed", {"error": type(e).__name__})
            return {"ok": False}
        return {"ok": True, "sync": res}

    @app.post("/webhooks/source/{system}")
    async def source_webhook(system: str, request: Request, k: str = ""):
        """webhook ממערכת חשבוניות שאינה חשבונית ירוקה (iCount מתעדת webhook; רווחית/EZcount לא).
        כמו ב-morning: סוד ב-URL (SOURCE_WEBHOOK_KEY), התוכן **רק טריגר** — המצב נקרא מחדש מה-API
        המאומת (sync). מערכת שאינה המקור הנבחר ⇒ 404 (לא מסנכרנים ממקור שלא נבחר)."""
        from .integrations.sources import SOURCE_SYSTEMS
        if not svc.s.source_webhook_key or not hmac.compare_digest(
                k.encode("utf-8"), svc.s.source_webhook_key.encode("utf-8")):
            raise HTTPException(403, "forbidden")
        sysdef = SOURCE_SYSTEMS.get(system)
        if sysdef is None or sysdef.webhook != "trigger" or system == "greeninvoice" or \
                system != svc.s.source_system:
            raise HTTPException(404, "not found")
        raw = await request.body()
        if len(raw) > MAX_WEBHOOK_BODY:
            raise HTTPException(413, "too large")
        try:
            ev = json.loads(raw or b"{}")
        except ValueError:
            raise HTTPException(400, "invalid json") from None
        if not isinstance(ev, dict):
            raise HTTPException(400, "invalid payload")
        svc.audit(system, "source_webhook", {"system": system,
                                             "ref": str(ev.get("docnum") or ev.get("id") or "")[:64]})
        try:
            res = svc.sync()
        except Exception as e:  # noqa: BLE001 — הספק ינסה שוב; לא חושפים פרטים
            svc.audit("system", "source_webhook_sync_failed", {"error": type(e).__name__})
            return {"ok": False}
        return {"ok": True, "sync": res}

    @app.post("/webhooks/sms/019")
    async def sms019_webhook(request: Request):
        """019 שולחים form-urlencoded (incoming_sms: message/phone/dest; גם dlr/blacklist).

        עונים 200 מהר ותמיד (אחרת 019 מנסים שוב ובסוף מפסיקים); כפילויות מסוננות ב-hash.
        """
        key = request.query_params.get("k", "")
        if not svc.s.sms_webhook_key or not hmac.compare_digest(
                key.encode("utf-8"), svc.s.sms_webhook_key.encode("utf-8")):
            raise HTTPException(403, "forbidden")
        raw = await request.body()
        if len(raw) > MAX_WEBHOOK_BODY:
            raise HTTPException(413, "too large")
        # 019 מגדירים URL לכל סוג push (dlr/incoming_sms/blacklist) ובגוף אין type ⇒ ?type= ב-URL שמוגדר אצלם
        hint = request.query_params.get("type", "")
        return svc.sms_webhook_019(raw, type_hint=hint if hint in ("dlr", "incoming_sms", "blacklist") else "")

    @app.post("/webhooks/sms/inforu")
    async def inforu_webhook(request: Request):
        """דוחות מסירה של InforU (ספק הגיבוי). אותו מפתח כמו 019 (SMS_WEBHOOK_KEY), עונים 200 מהר."""
        key = request.query_params.get("k", "")
        if not svc.s.sms_webhook_key or not hmac.compare_digest(
                key.encode("utf-8"), svc.s.sms_webhook_key.encode("utf-8")):
            raise HTTPException(403, "forbidden")
        raw = await request.body()
        if len(raw) > MAX_WEBHOOK_BODY:
            raise HTTPException(413, "too large")
        return svc.sms_webhook_inforu(raw)

    # ---------- קישור קצר מה-SMS: עמוד תשלום + פריסה + "שילמתי" + הפסקה ----------
    @app.get("/p/{code}", response_class=HTMLResponse)
    def paylink(code: str):
        try:
            info = svc.landing(code)
        except KeyError:
            return HTMLResponse(landing_page(None), status_code=404)
        return HTMLResponse(landing_page(info))

    @app.get("/p/{code}/pay")
    def paylink_pay(code: str):
        try:
            info = svc.landing(code)
        except KeyError:
            raise HTTPException(404, "לא נמצא") from None
        if not info["pay_url"]:
            raise HTTPException(409, "אין קישור תשלום זמין")
        svc.audit("customer", "pay_click", {"invoice": info["number"]})
        return RedirectResponse(info["pay_url"], status_code=302)  # יעד מאומת מול רשימת דומיינים

    @app.post("/p/{code}/{action}", response_class=HTMLResponse)
    async def paylink_post(code: str, action: str, request: Request):
        from urllib.parse import parse_qs

        form = {k: v[0] for k, v in parse_qs((await request.body()).decode()).items()}
        n = form.get("n", "")
        try:
            res = svc.landing_action(code, action, int(n) if n.isdigit() else None)
        except KeyError:
            raise HTTPException(404, "לא נמצא") from None
        except ValueError as e:
            raise HTTPException(400, str(e)) from e
        # הפעלה 209 (PRG): עמוד ישיר מ-POST ⇒ רענון/«חזרה» בדפדפן שולח את הטופס שוב (טיוטת «שילמתי»
        # או בקשת פריסה כפולה אצל בעל העסק). 303 ⇒ GET על עמוד תוצאה שלא משנה כלום.
        from urllib.parse import quote
        return RedirectResponse(f"/p/{quote(code, safe='')}/done?a={res['action']}", status_code=303)

    @app.get("/p/{code}/done", response_class=HTMLResponse)
    def paylink_done(code: str, a: str = ""):
        """עמוד התוצאה של PRG. GET בלבד, ולכן לא משנה מצב (סורקי-קישורים). קוד לא קיים ⇒ 404.
        פעולה לא מוכרת, או «הופסקו» כשהלקוח לא הוסר ⇒ חזרה ל-/p, כדי שקישור מפוברק לא יציג
        «התזכורות הופסקו» כשהן עדיין פעילות."""
        try:
            info = svc.landing(code)
        except KeyError:
            return HTMLResponse(landing_page(None), status_code=404)
        if a not in ("plan", "paid", "stop") or (a == "stop" and not info["opted_out"]):
            from urllib.parse import quote
            return RedirectResponse(f"/p/{quote(code, safe='')}", status_code=303)
        return HTMLResponse(landing_done(a, {}, svc.s.business_name))

    @app.get("/u/{token}", response_class=HTMLResponse)
    def unsubscribe_page(token: str):
        """GET לא מסיר! סורקי-קישורים (Outlook Safe Links, תצוגה מקדימה של SMS, אנטי-וירוס)
        פותחים כל קישור ⇒ הסרה ב-GET הייתה מסירה לקוחות שלא ביקשו. כפתור אחד ⇒ POST."""
        if not svc.has_unsub_token(token):
            # הפעלה 208 (בדיקת עין): היה משפט בודד בלי כותרת ובלי מה-עושים. עכשיו כמו /p לא-תקף + הכוונה.
            return _unsub_page(_UNSUB_INVALID, 404)
        from . import legal
        biz = svc.s.business_name
        return _unsub_page(
            f'<h1 style="font-size:20px">{html_escape(biz)} — הפסקת תזכורות</h1>'
            f"<p>{legal.why_you_got_this(biz)}</p>"
            "<p>להפסיק לקבל תזכורות אוטומטיות על חשבוניות? ההסרה חלה על כל הערוצים (SMS ומייל). "
            "החשבונית עצמה לא נמחקת, ובעל העסק עשוי לפנות אליכם אישית.</p>"
            '<form method="post"><button type="submit" class="b p">כן, הסירו אותי</button></form>'
            + legal.privacy_html(biz) + legal.draft_footer())

    @app.post("/u/{token}")
    def unsubscribe_one_click(token: str, request: Request):  # RFC 8058 + כפתור הדף
        if not svc.unsubscribe(token):
            raise HTTPException(404, "לא נמצא")
        if "text/html" in request.headers.get("accept", ""):
            # הפעלה 213 (PRG, כמו /p ב-209): עמוד ישיר מ-POST ⇒ רענון/«חזרה» בדפדפן מציג «לשלוח שוב
            # את הטופס?» ושולח POST נוסף (audit opt_out כפול). 303 ⇒ GET על עמוד תוצאה שלא משנה כלום.
            # לקוח RFC 8058 (List-Unsubscribe-Post, בלי Accept של HTML) ממשיך לקבל JSON 200 כמו קודם.
            from urllib.parse import quote
            return RedirectResponse(f"/u/{quote(token, safe='')}/done", status_code=303)
        return {"unsubscribed": True}

    @app.get("/u/{token}/done", response_class=HTMLResponse)
    def unsubscribe_done(token: str):
        """עמוד התוצאה של PRG. GET בלבד ⇒ לא מסיר (סורקי-קישורים). טוקן לא קיים ⇒ 404.
        «הוסרתם» מוצג רק אם הלקוח באמת מוסר; אחרת (קישור מפוברק, או «חידוש» אחרי ההסרה) ⇒ חזרה
        לעמוד ההסרה, כדי שלא נציג «הוסרתם» כשהתזכורות פעילות."""
        state = svc.unsub_opted_out(token)
        if state is None:
            return _unsub_page(_UNSUB_INVALID, 404)
        if not state:
            from urllib.parse import quote
            return RedirectResponse(f"/u/{quote(token, safe='')}", status_code=303)
        from . import legal
        biz = html_escape(svc.s.business_name)
        return _unsub_page(f"<h1 style='font-size:20px'>הוסרתם</h1><p>לא יישלחו אליכם עוד "
                           f"תזכורות אוטומטיות מטעם {biz}. בעל העסק ייצור קשר במידת הצורך.</p>"
                           + legal.draft_footer())

    # ---------- הגדרות עסק (תיאום עם web/: מסך הגדרות) ----------
    @app.get("/api/settings", dependencies=auth)
    def get_settings():
        return svc.settings_view()

    @app.put("/api/settings", dependencies=auth)
    async def put_settings(request: Request):
        try:
            raw = await request.json()
        except ValueError:
            raise HTTPException(400, "JSON לא תקין") from None
        try:
            return svc.update_settings(raw, request.state.actor, request.state.is_owner)
        except OwnerOnly as e:
            raise HTTPException(403, str(e)) from e
        except PermissionError as e:
            raise HTTPException(422, str(e)) from e
        except (ValueError, TypeError) as e:
            raise HTTPException(422, str(e)) from e

    # חוזה העיצוב (DESIGN.md §3ב) — אותה לוגיקה, אותה ולידציה, צורה שטוחה למסך ההגדרות
    @app.get("/settings", dependencies=auth)
    def get_design_settings():
        return svc.design_settings()

    @app.put("/settings", dependencies=auth)
    async def put_design_settings(request: Request):
        try:
            raw = await request.json()
        except ValueError:
            raise HTTPException(400, "JSON לא תקין") from None
        try:
            return svc.update_design_settings(raw, request.state.actor, request.state.is_owner)
        except OwnerOnly as e:
            raise HTTPException(403, str(e)) from e
        except (PermissionError, ValueError, TypeError) as e:
            raise HTTPException(422, str(e)) from e

    @app.post("/settings/source/key", dependencies=auth)
    async def settings_source_key():
        """שלב 1: לא קולטים מפתחות אמיתיים (business_secrets.py; אין הרשמה/חיבור אמיתי).
        הגוף לא נקרא ולא נשמר — 501 מפורש, כדי שהממשק יציג «בקרוב»."""
        from .integrations.sources import SOURCE_SYSTEMS
        label = SOURCE_SYSTEMS[svc.s.source_system].label
        raise HTTPException(501, f"שלב 1 (בטא, dry-run): חיבור מפתח API של {label} עדיין "
                                 "לא פעיל. הנתונים מגיעים מה-mock או מ-CSV. המפתח לא נשמר.")

    @app.post("/settings/source/csv", dependencies=auth)
    async def settings_source_csv(request: Request):
        try:
            r = svc.import_csv(await request.body(), request.state.actor)
        except RealDataBlocked as e:
            raise HTTPException(403, str(e)) from e
        except (ValueError, UnicodeDecodeError) as e:
            raise HTTPException(400, str(e)) from e
        return {"imported": r["imported"], "credits": r.get("credits", 0),   # critic סבב 35: זיכויים ⇒ בדיקה
                "closed": r.get("closed", 0),                                # מנהל 374: «שולם» סגר קיימת
                "date_order": r.get("date_order", "dmy"),                    # הפעלה 112
                "amount_check": r.get("amount_check", []),                   # הפעלה 124
                "rejected": [{"row": e["row"], "reason": e["error"]} for e in r["errors"]]}

    @app.post("/import/csv", dependencies=auth)
    async def import_csv(request: Request):
        """API תחילה; CSV = חלופה (ייצוא מ-morning/Excel). גוף הבקשה = תוכן הקובץ."""
        raw = await request.body()
        try:
            return svc.import_csv(raw, request.state.actor)
        except RealDataBlocked as e:
            raise HTTPException(403, str(e)) from e
        except (ValueError, UnicodeDecodeError) as e:
            raise HTTPException(400, str(e)) from e

    @app.get("/owner/inbox", dependencies=auth)
    def owner_inbox():
        return [dict(r) for r in svc.db.q(
            "SELECT * FROM messages WHERE needs_owner=1 ORDER BY id DESC")]

    @app.post("/owner/inbox/{mid}/done", dependencies=auth)
    def owner_inbox_done(mid: int, request: Request):   # critic סבב 34: «טופל» ⇒ יורד מ«דורש טיפול שלך»
        try:
            return guard(svc.owner_message_done, mid, request.state.actor)
        except OwnerOnly as e:   # מבקר 195א: התראת-ביטחון של בעל העסק — עובד/ת ⇒ 403
            raise HTTPException(403, str(e)) from e

    @app.post("/owner/inbox/{mid}/accept-close", dependencies=auth)
    def owner_accept_mass_close(mid: int, request: Request):
        """מנהל 416 (מבקר 249🟠): «כולן באמת שולמו» על כרטיס api_mass_vanish ⇒ סגירה. בעל העסק בלבד (עובד/ת ⇒ 403)."""
        try:
            return guard(svc.accept_mass_close, mid, request.state.actor)
        except OwnerOnly as e:
            raise HTTPException(403, str(e)) from e

    @app.get("/plans", dependencies=auth)
    def list_plans():
        def check(r):   # critic סבב 49: הסדר מוצע על סכום חריג ⇒ הדשבורד מציג תיבת אישור
            if r["status"] != "proposed":
                return []
            invs = svc.db.q("SELECT * FROM invoices WHERE customer_id=? AND status='open'", (r["customer_id"],))
            return [{"number": i["number"], "amount_agorot": i["amount_agorot"], "usual_agorot": u,
                     "currency": i["currency"]} for i, u in svc._amount_outliers(invs)]
        def progress(r):   # מנהל 334: הסדר שאושר/הוחמץ/הושלם — כמה שולם ומה הבא, לכרטיס «הסדרי תשלומים»
            return svc.plan_progress(r) if r["status"] in ("approved", "missed", "completed") else None
        # מנהל 336: `customer` = שם הלקוח לכרטיס ההסדרים ב-/ui (שאין לו רשימת לקוחות משלו); נמחק (§14) ⇒ ""
        names = {c["id"]: c["name"] or "" for c in svc.db.q(
            "SELECT id, name FROM customers WHERE id IN (SELECT customer_id FROM plans)")}
        return [{**dict(r), "installments": json.loads(r["installments"]), "amount_check": check(r),
                 "progress": progress(r), "currency": svc.plan_currency(r),
                 "customer": names.get(r["customer_id"], "")}
                for r in svc.db.q("SELECT * FROM plans ORDER BY id")]

    @app.post("/plans/{pid}/approve", dependencies=auth)
    def approve_plan(pid: int, request: Request, e: DraftEdit | None = None):
        return guard(lambda: svc.approve_plan(pid, request.state.actor,
                                              confirm_amount=bool(e and e.confirm_amount)))

    @app.get("/access-log", dependencies=auth)
    def access_log():
        return [dict(r) for r in svc.db.q("SELECT * FROM access_log ORDER BY id DESC LIMIT 500")]

    @app.get("/audit", dependencies=auth)
    def audit(request: Request, all: int = 0):   # noqa: A002 — שם הפרמטר בכתובת (?all=1)
        # מנהל 429 (מבקר 259🟡): ?all=1 = היומן המלא (TERMS §9 «היומן מיוצא לעסק») — בעל העסק בלבד, נרשם ב-audit.
        # בלי הפרמטר — 200 אחרונות כמו קודם (גם לעובד/ת). limit/page לא נתמכים במכוון: מסלול מלא אחד, מבוקר.
        if all:
            if not request.state.is_owner:
                svc.audit(request.state.actor, "audit_export_refused", {})
                raise HTTPException(403, "רק בעל העסק מייצא את יומן הביקורת המלא")
            rows = [dict(r) for r in svc.db.q("SELECT * FROM audit ORDER BY id DESC")]
            svc.audit(request.state.actor, "audit_export", {"rows": len(rows)})
            return rows
        return [dict(r) for r in svc.db.q("SELECT * FROM audit ORDER BY id DESC LIMIT 200")]

    @app.get("/export", dependencies=auth)
    def business_export(request: Request):
        # מנהל 429 (מבקר 259🟡): ייצוא עסקי מלא בסיום התקשרות (TERMS §9, DPA 4.3) — בעל העסק בלבד, כמו ייצוא לקוח
        if not request.state.is_owner:
            svc.audit(request.state.actor, "business_export_refused", {})
            raise HTTPException(403, "רק בעל העסק מייצא את כל נתוני העסק")
        return svc.business_export(request.state.actor)

    # ---------- כניסה מאורביט (חוזה-המסירה v1, app/orbit_connect.py) ----------
    from .orbit_connect import CONNECT_PAGE, HandoffRejected, OrbitConnect
    from .orbit_entitlement import EntitlementRejected, OrbitEntitlements
    from .secretbox import SecretError
    orbit = OrbitConnect(svc.db)
    app.state.orbit = orbit
    entitlements = OrbitEntitlements(svc.db)
    app.state.orbit_entitlements = entitlements
    connect_next = "/app/#/dashboard" if (web_dist / "index.html").is_file() else "/ui"
    connect_html = CONNECT_PAGE.replace("__NEXT__", connect_next)
    connect_csp = csp.inline_script_csp(connect_html)   # ה-hash אחרי ההחלפה — זה מה שהדפדפן מקבל

    @app.get("/connect/orbit", response_class=HTMLResponse)
    def connect_orbit_page():
        """ציבורי: דף סטטי. הטוקן ב-fragment (#h=…) — לא מגיע לשרת; הדף שולח אותו ב-POST."""
        return HTMLResponse(connect_html,
                            headers={"Cache-Control": "no-store", "X-Robots-Tag": "noindex",
                                     "Referrer-Policy": "no-referrer", "Content-Security-Policy": connect_csp})

    @app.post("/api/connect/orbit")
    async def connect_orbit_verify(request: Request):
        """אימות טוקן-המסירה. הצלחה ⇒ ארגון+מייל בלבד (למילוי מראש) — **לא** סשן: הכניסה
        עצמה עוברת /auth/login (סיסמה+TOTP, שער 6). כל כשל ⇒ 401 אחיד; הסיבה רק ב-audit."""
        if request.url.query:   # טוקן לעולם לא ב-query (לוגי-גישה/Referer)
            raise HTTPException(400, "הטוקן נשלח בגוף הבקשה בלבד")
        raw = await request.body()
        if len(raw) > 6144:   # מסירה (≤2048) + זכאות (≤2048) + מעטפת
            raise HTTPException(413, "too large")
        try:
            body = json.loads(raw or b"{}")
        except ValueError:
            raise HTTPException(400, "JSON לא תקין") from None
        tok = body.get("token") if isinstance(body, dict) else None
        import hashlib as _h
        try:
            c = orbit.verify(tok if isinstance(tok, str) else "", int(svc.clock().timestamp()))
        except HandoffRejected as e:
            svc.audit("orbit", "orbit_handoff_rejected", {"reason": e.reason})
            raise HTTPException(401, "הקישור אינו תקף או שפג תוקפו") from None
        except SecretError:
            svc.audit("orbit", "orbit_handoff_rejected", {"reason": "no_master_key"})
            raise HTTPException(503, "החיבור מאורביט אינו זמין כרגע") from None
        svc.audit("orbit", "orbit_handoff_ok", {"org": c.org, "email_sha": _h.sha256(
            c.email.encode()).hexdigest()[:16]})
        out = {"ok": True, "org": c.org, "email": c.email, "next": "login"}
        # זכאות (חיוב דרך אורביט, הכרעת מאיר 8.11): טוקן נפרד, חתום במפתח-פלטפורמה, רק אחרי
        # מסירה תקינה ורק לאותו ארגון. כשל בזכאות לא מכשיל את הכניסה (הסיבה ב-audit בלבד).
        ent = body.get("ent")
        if isinstance(ent, str) and ent:
            try:
                e = entitlements.ingest(ent, int(svc.clock().timestamp()), org=c.org,
                                        at=svc.clock().isoformat())
            except EntitlementRejected as er:
                svc.audit("orbit", "orbit_entitlement_rejected", {"reason": er.reason})
                out["entitlement"] = "ignored"
            else:
                svc.audit("orbit", "orbit_entitlement_ok", {"org": c.org, "plan": e.get("plan"),
                                                            "status": e.get("status"),
                                                            "paid_until": e.get("paid_until")})
                out["entitlement"] = "updated"
        return JSONResponse(out, headers={"Cache-Control": "no-store"})

    @app.get("/orbit/entitlement", dependencies=auth)
    def orbit_entitlement_view(request: Request):
        """הזכאות האחרונה מאורביט + המצב המחושב (מה שקובע אם גבי מתכנן/שולח). בעלים בלבד."""
        from .orbit_entitlement import current
        ent = current(svc.db)
        svc.audit(request.state.actor, "orbit_entitlement_viewed", {"present": ent is not None})
        link = orbit.link()
        return JSONResponse({"linked": bool(link), "entitlement": ent,
                             "billing": svc.trial() if ent else None,
                             "source": "orbit" if ent else "local"},
                            headers={"Cache-Control": "no-store"})

    @app.get("/orbit/link", dependencies=auth)
    def orbit_link_status():
        """מצב הקישור לאורביט — ארגון ותאריכים בלבד, לעולם לא הסוד."""
        link = orbit.link()
        return {"linked": bool(link), **(link or {})}

    @app.post("/orbit/link/secret", dependencies=auth)
    def orbit_link_secret(b: OrbitSecretIn, request: Request):
        """הנפקה/רוטציה של סוד-המסירה (מוחזר **פעם אחת**; המנהל מדביק אותו באורביט).
        רוטציה מבטלת את הסוד הקודם מיד."""
        # critic סבב 191ב: עובד/ת הנפיק/ה סוד-מסירה לכל org (רוטציה מבטלת את הסוד של בעל העסק) ⇒ בעלים בלבד
        if not request.state.is_owner:
            svc.audit(request.state.actor, "orbit_secret_refused", {})
            raise HTTPException(403, "רק בעל העסק מקשר את גבי לאורביט")
        rotating = bool(orbit.link())
        try:
            secret = orbit.issue_secret(b.org, at=svc.clock().isoformat())
        except ValueError as e:
            raise HTTPException(409, str(e)) from e
        except SecretError:
            raise HTTPException(503, "אין מפתח הצפנה (COLLECT_MASTER_KEYS) — הסוד לא נשמר") from None
        svc.audit(request.state.actor, "orbit_secret_rotated" if rotating else "orbit_secret_issued",
                  {"org": b.org.strip().lower()})
        return JSONResponse({"org": b.org.strip().lower(), "secret": secret, "shown_once": True},
                            headers={"Cache-Control": "no-store"})

    @app.post("/orbit/link/unlink", dependencies=auth)
    def orbit_unlink(request: Request):
        if not request.state.is_owner:   # critic סבב 191ב
            svc.audit(request.state.actor, "orbit_unlink_refused", {})
            raise HTTPException(403, "רק בעל העסק מבטל את הקישור לאורביט")
        link = orbit.link()
        try:
            done = orbit.unlink()
            if done:
                entitlements.delete()   # ביטול קישור ⇒ חזרה להתנהגות של היום (זכאות לא נגררת)
        except SecretError:
            raise HTTPException(503, "אין מפתח הצפנה (COLLECT_MASTER_KEYS)") from None
        if done:
            svc.audit(request.state.actor, "orbit_unlinked", {"org": link["org"] if link else ""})
            # critic סבב 73: ניתוק יכול לעצור את השירות (68–69) ⇒ בעל העסק יודע מי ניתק
            svc.notify_owner_sensitive(f"הקישור לאורביט נותק על ידי {request.state.actor} (ארגון: "
                                       f"{link['org'] if link else '—'}). החיוב והזכאות כבר לא מתעדכנים. "
                                       "אם לא אתם ניתקתם — בדקו מיד.", request.state.actor)
        return {"unlinked": done}

    # ---------- מנוע השיחה (app/conversation.py + app/inbox.py) ----------
    # מופע יחיד: אותה תיבה שמשמשת את /inbound, את ה-webhooks (019, מייל), את /dispatch (flush)
    # ואת /plans. היה: מופע שני כאן ⇒ /conversation/* עקף מדיניות או LLM שהוגדרו על svc.inbox.
    inbox = svc.inbox
    app.state.inbox = inbox

    @app.post("/conversation/inbound", dependencies=[Depends(owner_or_signed)])
    def conversation_inbound(m: InboundIn):
        """תשובת חייב ⇒ השפעות מיידיות + טיוטת תשובה לאישור (לא נשלח כלום בלי אישור)."""
        return guard(inbox.handle, m.channel, m.sender, m.text)

    @app.get("/conversation/drafts", dependencies=auth)
    def conversation_drafts(status: str | None = "queue"):
        return inbox.drafts(status)

    # שער 6: אישור/דחיית טיוטת תשובה נרשמים ב-audit על שם העובד המחובר, לא «owner»
    @app.post("/conversation/drafts/{did}/approve", dependencies=auth)
    def conversation_approve(did: int, request: Request, e: DraftEdit | None = None):
        return guard(lambda: inbox.approve_draft(did, body=e.body if e else None,
                                                 actor=request.state.actor,
                                                 confirm_amount=bool(e and e.confirm_amount)))

    # נושא 5: כרטיס דחוף מכתובת משותפת ⇒ בעל העסק בוחר למי ההודעה שייכת (customer_id=null ⇒ «אף אחד מהם»)
    @app.post("/owner/shared-cards/{card_id}/assign", dependencies=auth)
    async def shared_card_assign(card_id: int, request: Request):
        try:
            body = await request.json()
        except ValueError:
            raise HTTPException(400, "JSON לא תקין") from None
        cid = body.get("customer_id") if isinstance(body, dict) else "bad"
        if cid is not None and (not isinstance(cid, int) or isinstance(cid, bool)):
            raise HTTPException(422, "customer_id: מספר לקוח או null")
        return guard(lambda: inbox.assign_shared_card(card_id, cid, actor=request.state.actor))

    # critic 175: DB ששוחזר מגיבוי עולה עם שליחה עצורה עד שבעל העסק מאשר שהחיל מחדש הסרות/מחיקות מאז הגיבוי
    @app.get("/owner/restore-hold", dependencies=auth)
    def restore_hold_status():
        return {"hold": svc.restore_hold()}

    @app.post("/owner/restore-hold/release", dependencies=auth)
    async def restore_hold_release(request: Request):
        if not request.state.is_owner:
            raise HTTPException(403, "רק בעל העסק מחדש שליחה אחרי שחזור")
        try:
            body = await request.json()
        except ValueError:
            raise HTTPException(400, "JSON לא תקין") from None
        note = body.get("note") if isinstance(body, dict) else None
        if not isinstance(note, str):
            raise HTTPException(422, "note: תיעוד של מה שהוחל מחדש")
        try:
            return svc.release_restore_hold(note, actor=request.state.actor)
        except KeyError:
            raise HTTPException(404, "אין עצירת שחזור פעילה") from None
        except ValueError as e:
            raise HTTPException(422, str(e)) from e

    # ---------- מנהל 328: «צוות ותפקידים» — עד היום רק CLI (פתוח מ-327) ----------
    def _owner_only(request: Request, what: str) -> None:
        if not request.state.is_owner:
            raise HTTPException(403, f"רק בעל העסק {what}")

    def _me_id(request: Request) -> int | None:
        a = request.state.actor
        return int(a.split(":", 1)[1]) if isinstance(a, str) and a.startswith("user:") else None

    @app.get("/team", dependencies=auth)
    def team(request: Request):
        _owner_only(request, "רואה את רשימת העובדים")
        return {"users": users.listing(), "me": _me_id(request)}

    @app.post("/team/{uid}/role", dependencies=auth)
    async def team_role(uid: int, request: Request):
        _owner_only(request, "משנה תפקידים")
        try:
            body = await request.json()
        except ValueError:
            raise HTTPException(400, "JSON לא תקין") from None
        role = body.get("role") if isinstance(body, dict) else None
        if role not in ("owner", "staff"):
            raise HTTPException(422, "role: owner / staff")
        try:
            r = users.set_role_id(uid, role, actor=request.state.actor)
        except KeyError:
            raise HTTPException(404, "אין עובד כזה") from None
        except ValueError as e:
            raise HTTPException(422, str(e)) from e
        if r["from"] != r["to"]:
            actor = request.state.actor
            # ה-audit (פסאודונים) נרשם ב-Users.set_role; השם רק בהודעה לבעל העסק, שנמחקת עם העסק
            label = {"owner": "בעל העסק", "staff": "עובד"}
            svc.notify_owner_sensitive(
                f"תפקיד שונה על ידי {actor}: {r['name']} — «{label[r['from']]}» ⇒ «{label[r['to']]}». "
                "בעל עסק יכול לחדש שליחה אחרי שחזור ולנהל את הצוות. אם לא אתם שיניתם — בדקו מיד.", actor)
        return {"users": users.listing(), "me": _me_id(request)}

    @app.post("/team/{uid}/deactivate", dependencies=auth)
    def team_deactivate(uid: int, request: Request):
        _owner_only(request, "משבית עובדים")
        try:
            r = users.deactivate_id(uid, actor=request.state.actor)
        except KeyError:
            raise HTTPException(404, "אין עובד כזה") from None
        except ValueError as e:
            raise HTTPException(422, str(e)) from e
        if r["was_active"]:
            actor = request.state.actor
            svc.notify_owner_sensitive(
                f"עובד הושבת על ידי {actor}: {r['name']} — כל הכניסות הפתוחות שלו נותקו. "
                "אם לא אתם השבתתם — בדקו מיד.", actor)
        return {"users": users.listing(), "me": _me_id(request)}

    @app.post("/team/{uid}/reactivate", dependencies=auth)
    def team_reactivate(uid: int, request: Request):
        """מנהל 329: עובד שהושבת בטעות/חזר — בלי CLI. חוזר כעובד; התראה לבעל העסק שהמפעיל לא סוגר."""
        _owner_only(request, "מפעיל עובדים מחדש")
        try:
            r = users.reactivate_id(uid, actor=request.state.actor)
        except KeyError:
            raise HTTPException(404, "אין עובד כזה") from None
        if not r["was_active"]:
            actor = request.state.actor
            svc.notify_owner_sensitive(
                f"עובד הופעל מחדש על ידי {actor}: {r['name']} — חזר כ«עובד» ויכול להיכנס שוב עם הסיסמה "
                "והאימות הדו-שלבי שלו. אם לא אתם הפעלתם — בדקו מיד.", actor)
        return {"users": users.listing(), "me": _me_id(request)}

    @app.post("/conversation/drafts/{did}/reject", dependencies=auth)
    def conversation_reject(did: int, request: Request):
        return guard(lambda: inbox.reject_draft(did, actor=request.state.actor))

    @app.post("/conversation/flush", dependencies=auth)
    def conversation_flush():
        return {"sent": inbox.flush()}

    web_dist = Path(os.environ.get("WEB_DIST", Path(__file__).resolve().parent.parent / "web" / "dist"))
    # ---------- עמוד החייב v2 (/pay/{code}) — ציבורי, מינימום מידע, בלי טוקן בעלים ----------
    def _web_index() -> str | None:
        f = web_dist / "index.html"
        if not f.is_file():
            return None
        # ה-build משתמש בנתיבים יחסיים (./assets) ⇒ <base> כדי שיעבדו גם מתחת ל-/pay/{code}
        return f.read_text(encoding="utf-8").replace("<head>", '<head><base href="/app/">', 1)

    @app.get("/pay/{code}", response_class=HTMLResponse)
    def pay_page(code: str):
        try:
            svc.landing(code)
        except KeyError:
            return HTMLResponse(landing_page(None), status_code=404)
        html = _web_index()
        if html is None:   # בלי build של web/ — העמוד המוגש מהשרת ממשיך לעבוד
            return RedirectResponse(f"/p/{code}", status_code=302)
        return HTMLResponse(html, headers={"Cache-Control": "no-store", "X-Robots-Tag": "noindex"})

    @app.get("/api/pay/{code}")
    def pay_api(code: str):
        try:
            view = svc.payer_view(code)
        except KeyError:
            raise HTTPException(404, "לא נמצא") from None
        from . import legal
        # ר-13: גם עמוד ה-web של החייב מציג «למה קיבלתם» ופרטיות (כמו /p ו-/u) — מאותו מקור
        return {**view, "legal": legal.privacy_points(view["business"])}

    @app.get("/pay/{code}/go")
    def pay_go(code: str, method: str = "page"):
        try:
            url = svc.payer_go(code, method)
        except KeyError:
            raise HTTPException(404, "לא נמצא") from None
        except ValueError as e:
            raise HTTPException(409, str(e)) from e
        return RedirectResponse(url, status_code=302)   # יעד מאומת מול רשימת דומיינים

    @app.post("/api/pay/{code}/{action}")
    def pay_action(code: str, action: str, body: dict | None = None):
        n = (body or {}).get("installments")
        try:
            res = svc.landing_action(code, action, int(n) if isinstance(n, int) or str(n).isdigit() else None)
        except KeyError:
            raise HTTPException(404, "לא נמצא") from None
        except ValueError as e:
            raise HTTPException(400, str(e)) from e
        return {"action": action, "ok": bool(res.get("ok"))}   # בלי פרטי השיחה הפנימיים

    # הממשק המעוצב (web/, React) — מוגש מ-/app/ אם נבנה (`npm run build`). אותו origin ⇒ הממשק
    # מזהה את השרת ועובד "חי" מול ה-API (dry-run). בלי build — /ui הרזה ממשיך לעבוד כרגיל.
    if (web_dist / "index.html").is_file():
        from fastapi.staticfiles import StaticFiles
        app.mount("/app", StaticFiles(directory=web_dist, html=True), name="web")

    return app


_PAGE = ('<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">'
         '<meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title>'
         '<style>:root{{--bg:#f6f7f9;--card:#fff;--ink:#111827;--muted:#6b7280;--line:#e5e7eb;'
         '--brand:#0f766e;--brand-ink:#fff}}@media (prefers-color-scheme:dark){{:root{{--bg:#0b1220;'
         '--card:#121a2b;--ink:#e5e7eb;--muted:#9aa4b2;--line:#243049;--brand:#2dd4bf;'
         '--brand-ink:#04211d}}}}*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);'
         'color:var(--ink);font:16px/1.6 system-ui,Arial,sans-serif;padding:16px}}'
         '.c{{max-width:440px;margin:24px auto;background:var(--card);border:1px solid var(--line);'
         'border-radius:16px;padding:22px}}h1{{font-size:20px;margin:0 0 4px}}.m{{color:var(--muted);'
         'font-size:14px}}.amt{{font-size:30px;font-weight:700;margin:14px 0}}'
         '.b{{display:block;width:100%;text-align:center;padding:13px;border-radius:12px;'
         'border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;'
         'text-decoration:none;margin-top:10px;cursor:pointer;min-height:48px}}'
         '.p{{background:var(--brand);border-color:var(--brand);color:var(--brand-ink);font-weight:700}}'
         'form{{margin:0}}select{{font:inherit;padding:8px;min-height:48px;border-radius:8px;width:100%;margin-top:8px;'
         'background:var(--card);color:var(--ink);border:1px solid var(--line)}}'
         '.f{{margin-top:18px;font-size:12px;color:var(--muted)}}'
         # הפעלה 188: קישור «לתשלום» לכל חשבונית בהודעה מאוחדת — יעד-לחיצה 40px במובייל (היה 17)
         '.l{{display:inline-flex;align-items:center;min-height:40px;padding:0 12px;color:var(--brand)}}'
         # הפעלה 207 (בדיקת עין של server-p-mobile.png): ב-390px השורה נשברה באמצע («· לתשלום» בשורה לבד,
         # «· 2026-11-20» בתחילת שורה). עכשיו כל חשבונית = שורה: פרטים (כל מקטע לא נשבר) + כפתור «לתשלום» מסומן.
         '.iv{{list-style:none;padding:0;margin:12px 0 0}}.iv li{{display:flex;flex-wrap:wrap;align-items:center;'
         'justify-content:space-between;gap:4px 8px;padding:6px 0;border-top:1px solid var(--line)}}'
         '.iv .n{{white-space:nowrap}}.iv .l{{border:1px solid var(--brand);border-radius:10px;'
         'text-decoration:none;font-weight:600}}</style></head>'
         '<body><main class="c">{body}<p class="f">הודעה אוטומטית מטעם העסק. '
         'הקישור אישי — אל תעבירו אותו.</p></main></body></html>')


def landing_page(info: dict | None) -> str:
    from html import escape as e

    from .templates import fmt_due

    if info is None:
        return _PAGE.format(title="קישור לא תקף", body="<h1>הקישור אינו תקף</h1>")
    items = info.get("invoices") or []
    if len(items) > 1:   # הודעה מאוחדת (critic 15.1/2.12): כל החשבוניות שבה + סה״כ
        head = f'<h1>{e(info["business"])}</h1><div class="m">{len(items)} חשבוניות פתוחות</div>'
    else:
        head = (f'<h1>{e(info["business"])}</h1><div class="m">חשבונית {e(info["number"] or "(ללא מספר)")}'
                + (f' · מועד {e(fmt_due(info["due"]))}' if info["due"] else "") + "</div>")
    if not info["open"]:
        return _PAGE.format(title="שולם", body=head + "<p>החשבונית סגורה. תודה רבה!</p>")
    base = f'/p/{e(info["code"])}'
    amount = info["amount"]
    if len(items) > 1:
        amount = info["total"]
        rows = "".join(
            f'<li><span><span class="n">חשבונית {e(i["number"] or "(ללא מספר)")}</span>'
            f' — <span class="n">{e(i["amount"])}</span>'
            + (f' · <span class="n">מועד {e(fmt_due(i["due"]))}</span>' if i["due"] else "") + "</span>"
            + ("" if info["pay_shared"] or not i["can_pay"] else
               f'<a class="l" href="/p/{e(i["code"])}/pay">לתשלום</a>') + "</li>" for i in items)
        head += f'<ul class="m iv" data-testid="landing-invoices">{rows}</ul>'
        pay = (f'<a class="b p" href="{base}/pay">לתשלום מאובטח</a>' if info["pay_shared"]
               else "" if any(i["can_pay"] for i in items)
               else '<p class="m">בעל העסק יעדכן אתכם לגבי אפשרויות התשלום.</p>')
    else:
        pay = (f'<a class="b p" href="{base}/pay">לתשלום מאובטח</a>' if info["pay_url"]
               else '<p class="m">בעל העסק יעדכן אתכם לגבי אפשרויות התשלום.</p>')
    if info.get("held"):   # critic 166: השהיה מגינה ⇒ בלי תשלום/פריסה/«שילמתי»; הסרה נשארת
        pay = '<p class="m" data-testid="landing-held">בעל העסק ייצור איתכם קשר אישית.</p>'
    opts = "".join(f'<option value="{n}">{n} תשלומים</option>' for n in (2, 3, 4, 6))
    stop = ('<p class="m">התזכורות האוטומטיות הופסקו.</p>' if info["opted_out"] else
            f'<form method="post" action="{base}/stop"><button class="b">הפסקת תזכורות</button></form>')
    actions = "" if info.get("held") else (
        f'<form method="post" action="{base}/plan"><select name="n" aria-label="מספר תשלומים">'
        + opts + '</select><button class="b">בקשת פריסה ללא תוספת</button></form>'
        + f'<form method="post" action="{base}/paid"><button class="b">כבר שילמתי</button></form>')
    body = head + f'<div class="amt">{e(amount)}</div>' + pay + actions + stop
    # ר-13 (critic סבב 2): זה העמוד שקישור ה-SMS מוביל אליו («להפסקה: בקישור»), ולכן גם בו —
    # כמו ב-/u — למה קיבלתם, מי בעל השליטה ופרטיות (טיוטה לעו״ד)
    from . import legal
    body += (f'<p class="m">{legal.why_you_got_this(info["business"])}</p>'
             + legal.privacy_html(info["business"]) + legal.draft_footer())
    return _PAGE.format(title=f'תשלום · {e(info["business"])}', body=body)


def landing_done(action: str, res: dict, business: str = "") -> str:
    """הפעלה 208 (בדיקת עין): העמוד היה «התקבל» בלבד — בלי שם העסק (החייב לא יודע מול מי) ובלי כותרת
    שאומרת מה קרה. עכשיו: שם העסק כמו ב-/p, כותרת לפי הפעולה, ומשפט «מה הלאה»."""
    from html import escape as e
    head, msg = {"plan": ("בקשת הפריסה התקבלה", "בעל העסק יחזור אליכם עם הצעה ללא תוספת."),
                 "paid": ("תודה, הדיווח התקבל", "העברנו לבעל העסק לבדיקה, והתזכורות נעצרו בינתיים."),
                 "stop": ("התזכורות הופסקו", "התזכורות האוטומטיות על החשבונית הופסקו. "
                                             "בעל העסק עשוי לפנות אליכם אישית.")}[action]
    biz = f'<div class="m">{e(business)}</div>' if business else ""
    return _PAGE.format(title=f"{head} · {e(business)}" if business else head,
                        body=f"<h1>{head}</h1>{biz}<p>{msg}</p>")


def _lazy_app() -> FastAPI:
    return create_app()
