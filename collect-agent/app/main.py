"""FastAPI — "גבי – העוזר לגביית חובות".

הפעלה: uvicorn app.main:_lazy_app --factory (dry-run בלבד).
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from .config import Settings, load_settings
from .db import DB
from .greeninvoice import GreenInvoiceClient
from .service import CollectService
from .templates import SLOGAN

UI_HTML = (Path(__file__).parent / "ui.html").read_text(encoding="utf-8")
LANDING_HTML = (Path(__file__).parent / "landing.html").read_text(encoding="utf-8")  # טיוטה, noindex


class InboundIn(BaseModel):
    channel: Literal["sms", "email"] = "sms"
    sender: str
    text: str


def create_app(service: CollectService | None = None) -> FastAPI:
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
    app = FastAPI(title=SLOGAN + " (dry-run)")
    app.state.svc = svc

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

    @app.get("/landing", response_class=HTMLResponse)
    def landing():
        return LANDING_HTML

    @app.post("/sync")
    def sync():
        return guard(svc.sync)

    @app.post("/plan")
    def plan():
        return {"created": svc.plan()}

    @app.get("/reminders")
    def reminders(status: str | None = None):
        sql, args = ("SELECT r.*, i.number, i.amount_agorot, i.currency, c.name customer_name "
                     "FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                     "JOIN customers c ON c.id=i.customer_id"), ()
        if status:
            sql, args = sql + " WHERE r.status=?", (status,)
        rows = svc.db.q(sql + " ORDER BY r.id", args)
        return [{**dict(r), "payload": json.loads(r["payload"])} for r in rows]

    @app.get("/reminders/{rid}/preview")
    def preview(rid: int):
        return guard(svc.preview, rid)

    @app.post("/reminders/{rid}/approve")
    def approve(rid: int):
        return guard(svc.approve, rid)

    @app.post("/reminders/{rid}/reject")
    def reject(rid: int):
        return guard(svc.reject, rid)

    @app.post("/dispatch")
    def dispatch():
        return {"dry_run": True, "sent": svc.dispatch()}

    @app.get("/dashboard")
    def dashboard():
        return svc.dashboard()

    @app.get("/customers")
    def customers():
        return [dict(r) for r in svc.db.q("SELECT * FROM customers ORDER BY id")]

    @app.post("/customers/{cid}/resume")
    def resume(cid: int):
        return guard(svc.resume_customer, cid)

    @app.get("/outbox")
    def outbox():
        return {"dry_run": True, "messages": svc.sender.sent}

    @app.post("/inbound")
    def inbound(m: InboundIn):
        return guard(svc.inbound, m.channel, m.sender, m.text)

    @app.post("/webhooks/sms/019")
    async def sms019_webhook(request: Request):
        """019 שולחים form-urlencoded (incoming_sms: message/phone/dest; גם dlr/blacklist).

        עונים 200 מהר ותמיד (אחרת 019 מנסים שוב ובסוף מפסיקים); כפילויות מסוננות ב-hash.
        """
        import hmac

        key = request.query_params.get("k", "")
        if not svc.s.sms_webhook_key or not hmac.compare_digest(key, svc.s.sms_webhook_key):
            raise HTTPException(403, "forbidden")
        raw = await request.body()
        return svc.sms_webhook_019(raw)

    @app.get("/u/{token}", response_class=HTMLResponse)
    def unsubscribe_page(token: str):
        ok = svc.unsubscribe(token)
        msg = "הוסרתם מתזכורות אוטומטיות. בעל העסק ייצור קשר במידת הצורך." if ok else \
            "הקישור אינו תקף."
        return HTMLResponse(f'<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8">'
                            f'<meta name="viewport" content="width=device-width">'
                            f'<body style="font-family:Arial;padding:24px">{msg}</body></html>',
                            status_code=200 if ok else 404)

    @app.post("/u/{token}")
    def unsubscribe_one_click(token: str):  # RFC 8058 List-Unsubscribe-Post
        if not svc.unsubscribe(token):
            raise HTTPException(404, "לא נמצא")
        return {"unsubscribed": True}

    @app.get("/owner/inbox")
    def owner_inbox():
        return [dict(r) for r in svc.db.q(
            "SELECT * FROM messages WHERE needs_owner=1 ORDER BY id DESC")]

    @app.get("/plans")
    def list_plans():
        return [{**dict(r), "installments": json.loads(r["installments"])}
                for r in svc.db.q("SELECT * FROM plans ORDER BY id")]

    @app.post("/plans/{pid}/approve")
    def approve_plan(pid: int):
        return guard(svc.approve_plan, pid)

    @app.get("/audit")
    def audit():
        return [dict(r) for r in svc.db.q("SELECT * FROM audit ORDER BY id DESC LIMIT 200")]

    return app


def _lazy_app() -> FastAPI:
    return create_app()
