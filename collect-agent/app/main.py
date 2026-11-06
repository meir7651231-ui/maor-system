"""FastAPI — "גבי – תזכורות תשלום".

הפעלה: uvicorn app.main:_lazy_app --factory (dry-run בלבד).
"""
from __future__ import annotations

import hmac
import json
import logging
import os
import re
from html import escape as html_escape
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, Field

from . import security
from .config import SafetyError, Settings, load_settings
from .db import DB
from .greeninvoice import GreenInvoiceClient
from .ratelimit import RateLimiter, group_for
from .service import CollectService, RealDataBlocked
from .templates import SLOGAN, TAGLINE
from .users import Users

UI_HTML = (Path(__file__).parent / "ui.html").read_text(encoding="utf-8")


MAX_WEBHOOK_BODY = 16 * 1024


class EmailIn(BaseModel):
    sender: str
    text: str
    message_id: str = ""


class DraftEdit(BaseModel):
    body: str | None = None


class HoldIn(BaseModel):
    reason: Literal["minor", "deceased", "insolvency"]
    note: str = Field("", max_length=500)


class LegalHoldIn(BaseModel):
    note: str | None = Field(None, max_length=500)   # None/"" ⇒ ביטול


# מסכים שמחזירים מידע אישי של לקוחות (שם/טלפון/מייל/סכום/תוכן הודעות) ⇒ כל צפייה נרשמת
PII_READ_ROUTES = frozenset({
    "/reminders", "/reminders/{rid}/preview", "/dashboard", "/customers", "/outbox",
    "/owner/inbox", "/plans", "/audit", "/conversation/drafts", "/access-log"})


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


def _unsub_page(body: str, status: int = 200) -> HTMLResponse:
    return HTMLResponse('<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8">'
                        '<meta name="viewport" content="width=device-width">'
                        f'<body style="font-family:Arial;padding:24px">{body}</body></html>',
                        status_code=status,
                        headers={"Cache-Control": "no-store", "X-Robots-Tag": "noindex",
                                 "Referrer-Policy": "no-referrer"})



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
    if service is None and os.environ.get("DEMO") == "1":
        from .demo import demo_service_ready  # נתוני דמו בדויים + sandbox מדומה, בלי רשת
        service = demo_service_ready()
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
        if request.url.path == "/webhooks/greeninvoice":
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
        return resp

    users = Users(svc.db, svc.clock)
    require_login = os.environ.get("REQUIRE_USER_LOGIN") == "1"

    def owner(request: Request) -> None:
        presented = security.bearer(request.headers.get("authorization"))
        actor = users.actor(presented) if presented else None
        if actor is None:
            # הטוקן המשותף נשאר לתאימות לאחור; REQUIRE_USER_LOGIN=1 (בטא אמיתית) סוגר אותו
            if require_login or not security.token_ok(presented, token):
                raise HTTPException(401, "נדרש אימות", headers={"WWW-Authenticate": "Bearer"})
            actor = "owner"
        request.state.actor = actor
        # תיעוד צפייה במידע אישי (legal/BETA-GATE.md שער 6): השחקן הוא העובד המחובר
        route = getattr(request.scope.get("route"), "path", "")
        if request.method == "GET" and route in PII_READ_ROUTES:
            svc.log_access(actor, "GET", route, request.url.path)

    @app.post("/auth/login")
    def auth_login(body: LoginIn):
        tok = users.login(body.email, body.password, body.code)
        if tok is None:
            svc.audit("anon", "login_failed", {"email_sha": security.redact(body.email)[:40]})
            raise HTTPException(401, "פרטי ההתחברות או קוד האימות שגויים")
        svc.audit(body.email.strip().lower(), "login", None)
        return {"token": tok, "expires_hours": 12}

    @app.post("/auth/logout")
    def auth_logout(request: Request):
        t = security.bearer(request.headers.get("authorization"))
        if t:
            users.logout(t)
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
        except KeyError:
            raise HTTPException(404, "לא נמצא") from None
        except ValueError as e:
            raise HTTPException(409, str(e)) from e
        except RuntimeError as e:
            raise HTTPException(503, str(e)) from e

    @app.get("/health")
    def health():
        return {"status": "ok", "product": SLOGAN, "tagline": TAGLINE, "send_mode": svc.s.send_mode,
                "greeninvoice_env": svc.s.greeninvoice_env, "dry_run": svc.s.dry_run,
                "channels": list(svc.s.channels), "sms_provider": svc.s.sms_provider,
                "trial": svc.trial()}

    @app.get("/", response_class=HTMLResponse)
    @app.get("/ui", response_class=HTMLResponse)
    def ui():
        return UI_HTML

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

    @app.get("/reminders", dependencies=auth)
    def reminders(status: str | None = None):
        sql, args = ("SELECT r.*, i.number, i.amount_agorot, i.currency, c.name customer_name "
                     "FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                     "JOIN customers c ON c.id=i.customer_id"), ()
        if status:
            sql, args = sql + " WHERE r.status=?", (status,)
        rows = svc.db.q(sql + " ORDER BY r.id", args)
        return [{**dict(r), "payload": json.loads(r["payload"])} for r in rows]

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
        confirm = bool(body.get("confirm_open")) if isinstance(body, dict) else False
        return guard(lambda: svc.approve(rid, request.state.actor, confirm_open=confirm))

    @app.post("/reminders/{rid}/reject", dependencies=auth)
    def reject(rid: int, request: Request):
        return guard(svc.reject, rid, request.state.actor)

    @app.post("/dispatch", dependencies=auth)
    def dispatch():
        return {"dry_run": True, "sent": svc.dispatch()}

    @app.get("/dashboard", dependencies=auth)
    def dashboard():
        return svc.dashboard()

    @app.get("/customers", dependencies=auth)
    def customers():
        return [dict(r) for r in svc.db.q("SELECT * FROM customers ORDER BY id")]

    @app.post("/customers/{cid}/resume", dependencies=auth)
    def resume(cid: int, request: Request):
        return guard(svc.resume_customer, cid, request.state.actor)

    @app.post("/customers/{cid}/hold", dependencies=auth)
    def customer_hold(cid: int, b: HoldIn, request: Request):          # ר-6
        return guard(svc.set_hold, cid, b.reason, b.note, request.state.actor)

    @app.post("/customers/{cid}/legal-hold", dependencies=auth)
    def customer_legal_hold(cid: int, b: LegalHoldIn, request: Request):   # ר-10
        return guard(svc.set_legal_hold, cid, b.note, request.state.actor)

    @app.post("/maintenance/purge", dependencies=auth)
    def purge():                                     # ר-10 (רץ גם בכל plan)
        return svc.purge_closed()

    @app.get("/outbox", dependencies=auth)
    def outbox():
        return {"dry_run": True, "messages": svc.sender.sent}

    @app.post("/inbound", dependencies=[Depends(owner_or_signed)])
    def inbound(m: InboundIn):
        return guard(svc.inbound, m.channel, m.sender, m.text)

    @app.post("/webhooks/email")
    def email_webhook(m: EmailIn, k: str = ""):
        import hmac

        if not svc.s.email_webhook_key or not hmac.compare_digest(
                k.encode("utf-8"), svc.s.email_webhook_key.encode("utf-8")):
            raise HTTPException(403, "forbidden")
        return svc.email_webhook(m.sender, m.text, m.message_id)

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
        svc.audit("greeninvoice", "gi_webhook", {"document": str(ev.get("id"))[:64],
                                                 "type": ev.get("type")})
        try:
            res = svc.sync()
        except Exception as e:  # noqa: BLE001 — morning מנסים שוב; לא חושפים פרטים
            svc.audit("system", "gi_webhook_sync_failed", {"error": type(e).__name__})
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
        return svc.sms_webhook_019(raw)

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
        return HTMLResponse(landing_done(action, res))

    @app.get("/u/{token}", response_class=HTMLResponse)
    def unsubscribe_page(token: str):
        """GET לא מסיר! סורקי-קישורים (Outlook Safe Links, תצוגה מקדימה של SMS, אנטי-וירוס)
        פותחים כל קישור ⇒ הסרה ב-GET הייתה מסירה לקוחות שלא ביקשו. כפתור אחד ⇒ POST."""
        if not svc.has_unsub_token(token):
            return _unsub_page("הקישור אינו תקף.", 404)
        from . import legal
        biz = svc.s.business_name
        return _unsub_page(
            f'<h1 style="font-size:20px">{html_escape(biz)} — הפסקת תזכורות</h1>'
            f"<p>{legal.why_you_got_this(biz)}</p>"
            "<p>להפסיק לקבל תזכורות אוטומטיות על חשבוניות? ההסרה חלה על כל הערוצים (SMS ומייל). "
            "החשבונית עצמה לא נמחקת, ובעל העסק עשוי לפנות אליכם אישית.</p>"
            '<form method="post"><button type="submit" style="font-size:18px;min-height:48px;'
            'padding:10px 24px">כן, הסירו אותי</button></form>'
            + legal.privacy_html(biz) + legal.draft_footer())

    @app.post("/u/{token}")
    def unsubscribe_one_click(token: str, request: Request):  # RFC 8058 + כפתור הדף
        if not svc.unsubscribe(token):
            raise HTTPException(404, "לא נמצא")
        if "text/html" in request.headers.get("accept", ""):
            from . import legal
            biz = html_escape(svc.s.business_name)
            return _unsub_page(f"<h1 style='font-size:20px'>הוסרתם</h1><p>לא יישלחו אליכם עוד "
                               f"תזכורות אוטומטיות מ-{biz}. בעל העסק ייצור קשר במידת הצורך.</p>"
                               + legal.draft_footer())
        return {"unsubscribed": True}

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
            return svc.update_settings(raw, request.state.actor)
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
            return svc.update_design_settings(raw, request.state.actor)
        except (PermissionError, ValueError, TypeError) as e:
            raise HTTPException(422, str(e)) from e

    @app.post("/settings/source/key", dependencies=auth)
    async def settings_source_key():
        """שלב 1: לא קולטים מפתחות אמיתיים (business_secrets.py; אין הרשמה/חיבור אמיתי).
        הגוף לא נקרא ולא נשמר — 501 מפורש, כדי שהממשק יציג «בקרוב»."""
        raise HTTPException(501, "שלב 1 (בטא, dry-run): חיבור מפתח API של חשבונית ירוקה עדיין "
                                 "לא פעיל. הנתונים מגיעים מה-mock או מ-CSV. המפתח לא נשמר.")

    @app.post("/settings/source/csv", dependencies=auth)
    async def settings_source_csv(request: Request):
        try:
            r = svc.import_csv(await request.body(), request.state.actor)
        except RealDataBlocked as e:
            raise HTTPException(403, str(e)) from e
        except (ValueError, UnicodeDecodeError) as e:
            raise HTTPException(400, str(e)) from e
        return {"imported": r["imported"],
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

    @app.get("/plans", dependencies=auth)
    def list_plans():
        return [{**dict(r), "installments": json.loads(r["installments"])}
                for r in svc.db.q("SELECT * FROM plans ORDER BY id")]

    @app.post("/plans/{pid}/approve", dependencies=auth)
    def approve_plan(pid: int, request: Request):
        return guard(svc.approve_plan, pid, request.state.actor)

    @app.get("/access-log", dependencies=auth)
    def access_log():
        return [dict(r) for r in svc.db.q("SELECT * FROM access_log ORDER BY id DESC LIMIT 500")]

    @app.get("/audit", dependencies=auth)
    def audit():
        return [dict(r) for r in svc.db.q("SELECT * FROM audit ORDER BY id DESC LIMIT 200")]

    # ---------- מנוע השיחה (app/conversation.py + app/inbox.py) ----------
    from .inbox import ConversationInbox
    inbox = ConversationInbox(svc)
    app.state.inbox = inbox

    @app.post("/conversation/inbound", dependencies=[Depends(owner_or_signed)])
    def conversation_inbound(m: InboundIn):
        """תשובת חייב ⇒ השפעות מיידיות + טיוטת תשובה לאישור (לא נשלח כלום בלי אישור)."""
        return guard(inbox.handle, m.channel, m.sender, m.text)

    @app.get("/conversation/drafts", dependencies=auth)
    def conversation_drafts(status: str | None = "queue"):
        return inbox.drafts(status)

    @app.post("/conversation/drafts/{did}/approve", dependencies=auth)
    def conversation_approve(did: int, e: DraftEdit | None = None):
        return guard(lambda: inbox.approve_draft(did, body=e.body if e else None))

    @app.post("/conversation/drafts/{did}/reject", dependencies=auth)
    def conversation_reject(did: int):
        return guard(inbox.reject_draft, did)

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
            return svc.payer_view(code)
        except KeyError:
            raise HTTPException(404, "לא נמצא") from None

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
         'form{{margin:0}}select{{font:inherit;padding:8px;border-radius:8px;width:100%;margin-top:8px;'
         'background:var(--card);color:var(--ink);border:1px solid var(--line)}}'
         '.f{{margin-top:18px;font-size:12px;color:var(--muted)}}</style></head>'
         '<body><main class="c">{body}<p class="f">הודעה אוטומטית מטעם העסק. '
         'הקישור אישי — אל תעבירו אותו.</p></main></body></html>')


def landing_page(info: dict | None) -> str:
    from html import escape as e

    if info is None:
        return _PAGE.format(title="קישור לא תקף", body="<h1>הקישור אינו תקף</h1>")
    head = (f'<h1>{e(info["business"])}</h1><div class="m">חשבונית {e(info["number"])}'
            + (f' · מועד {e(info["due"])}' if info["due"] else "") + "</div>")
    if not info["open"]:
        return _PAGE.format(title="שולם", body=head + "<p>החשבונית סגורה. תודה רבה!</p>")
    base = f'/p/{e(info["code"])}'
    pay = (f'<a class="b p" href="{base}/pay">לתשלום מאובטח</a>' if info["pay_url"]
           else '<p class="m">קישור התשלום יישלח בהקדם.</p>')
    opts = "".join(f'<option value="{n}">{n} תשלומים</option>' for n in (2, 3, 4, 6))
    stop = ('<p class="m">התזכורות האוטומטיות הופסקו.</p>' if info["opted_out"] else
            f'<form method="post" action="{base}/stop"><button class="b">הפסקת תזכורות</button></form>')
    body = (head + f'<div class="amt">{e(info["amount"])}</div>' + pay
            + f'<form method="post" action="{base}/plan"><select name="n" aria-label="מספר תשלומים">'
            + opts + '</select><button class="b">בקשת פריסה ללא תוספת</button></form>'
            + f'<form method="post" action="{base}/paid"><button class="b">כבר שילמתי</button></form>'
            + stop)
    return _PAGE.format(title=f'תשלום · {e(info["business"])}', body=body)


def landing_done(action: str, res: dict) -> str:
    msg = {"plan": "הבקשה לפריסה התקבלה. בעל העסק יחזור אליכם עם הצעה ללא תוספת.",
           "paid": "תודה! העברנו לבעל העסק לבדיקה, והתזכורות נעצרו בינתיים.",
           "stop": "התזכורות האוטומטיות הופסקו."}[action]
    return _PAGE.format(title="התקבל", body=f"<h1>התקבל</h1><p>{msg}</p>")


def _lazy_app() -> FastAPI:
    return create_app()
