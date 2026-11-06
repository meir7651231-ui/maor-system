"""FastAPI — "גבי – העוזר לגביית חובות".

הפעלה: uvicorn app.main:_lazy_app --factory (dry-run בלבד).
"""
from __future__ import annotations

import hmac
import json
import logging
import os
import re
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from . import security
from .config import SafetyError, Settings, load_settings
from .db import DB
from .greeninvoice import GreenInvoiceClient
from .service import CollectService
from .templates import SLOGAN

UI_HTML = (Path(__file__).parent / "ui.html").read_text(encoding="utf-8")


MAX_WEBHOOK_BODY = 16 * 1024


class InboundIn(BaseModel):
    channel: Literal["sms", "email"] = "sms"
    sender: str = Field(max_length=254)
    text: str = Field(max_length=4000)


class _RedactQueryKey(logging.Filter):
    """uvicorn כותב ללוג הגישה את ה-URL המלא ⇒ הסוד ?k=... של ה-webhook היה דולף ללוג."""

    _K = re.compile(r"([?&]k=)[^&\s\"]+")

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple):
            record.args = tuple(self._K.sub(r"\1***", a) if isinstance(a, str) else a
                                for a in record.args)
        return True


def _install_log_redaction() -> None:
    lg = logging.getLogger("uvicorn.access")
    if not any(isinstance(f, _RedactQueryKey) for f in lg.filters):
        lg.addFilter(_RedactQueryKey())


def _unsub_page(body: str, status: int = 200) -> HTMLResponse:
    return HTMLResponse('<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8">'
                        '<meta name="viewport" content="width=device-width">'
                        f'<body style="font-family:Arial;padding:24px">{body}</body></html>',
                        status_code=status,
                        headers={"Cache-Control": "no-store", "X-Robots-Tag": "noindex",
                                 "Referrer-Policy": "no-referrer"})


def create_app(service: CollectService | None = None, *, owner_token: str | None = None,
               webhook_secret: str | None = None) -> FastAPI:
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

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        resp = await call_next(request)
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "no-referrer")
        return resp

    def owner(request: Request) -> None:
        if not security.token_ok(security.bearer(request.headers.get("authorization")), token):
            raise HTTPException(401, "נדרש אימות", headers={"WWW-Authenticate": "Bearer"})

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
        return {"status": "ok", "product": SLOGAN, "send_mode": svc.s.send_mode,
                "greeninvoice_env": svc.s.greeninvoice_env, "dry_run": svc.s.dry_run,
                "channels": list(svc.s.channels), "sms_provider": svc.s.sms_provider}

    @app.get("/", response_class=HTMLResponse)
    @app.get("/ui", response_class=HTMLResponse)
    def ui():
        return UI_HTML

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
    def approve(rid: int):
        return guard(svc.approve, rid)

    @app.post("/reminders/{rid}/reject", dependencies=auth)
    def reject(rid: int):
        return guard(svc.reject, rid)

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
    def resume(cid: int):
        return guard(svc.resume_customer, cid)

    @app.get("/outbox", dependencies=auth)
    def outbox():
        return {"dry_run": True, "messages": svc.sender.sent}

    @app.post("/inbound", dependencies=[Depends(owner_or_signed)])
    def inbound(m: InboundIn):
        return guard(svc.inbound, m.channel, m.sender, m.text)

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

    @app.get("/u/{token}", response_class=HTMLResponse)
    def unsubscribe_page(token: str):
        """GET לא מסיר! סורקי-קישורים (Outlook Safe Links, תצוגה מקדימה של SMS, אנטי-וירוס)
        פותחים כל קישור ⇒ הסרה ב-GET הייתה מסירה לקוחות שלא ביקשו. כפתור אחד ⇒ POST."""
        if not svc.has_unsub_token(token):
            return _unsub_page("הקישור אינו תקף.", 404)
        return _unsub_page('<p>להפסיק לקבל תזכורות אוטומטיות על חשבוניות?</p>'
                           '<form method="post"><button type="submit" style="font-size:18px;'
                           'padding:10px 24px">כן, הסירו אותי</button></form>')

    @app.post("/u/{token}")
    def unsubscribe_one_click(token: str, request: Request):  # RFC 8058 + כפתור הדף
        if not svc.unsubscribe(token):
            raise HTTPException(404, "לא נמצא")
        if "text/html" in request.headers.get("accept", ""):
            return _unsub_page("הוסרתם מתזכורות אוטומטיות. בעל העסק ייצור קשר במידת הצורך.")
        return {"unsubscribed": True}

    @app.get("/owner/inbox", dependencies=auth)
    def owner_inbox():
        return [dict(r) for r in svc.db.q(
            "SELECT * FROM messages WHERE needs_owner=1 ORDER BY id DESC")]

    @app.get("/plans", dependencies=auth)
    def list_plans():
        return [{**dict(r), "installments": json.loads(r["installments"])}
                for r in svc.db.q("SELECT * FROM plans ORDER BY id")]

    @app.post("/plans/{pid}/approve", dependencies=auth)
    def approve_plan(pid: int):
        return guard(svc.approve_plan, pid)

    @app.get("/audit", dependencies=auth)
    def audit():
        return [dict(r) for r in svc.db.q("SELECT * FROM audit ORDER BY id DESC LIMIT 200")]

    return app


def _lazy_app() -> FastAPI:
    return create_app()
