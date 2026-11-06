"""FastAPI. הפעלה: uvicorn app.main:_lazy_app --factory (dry-run בלבד)."""
from __future__ import annotations

import json

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .config import Settings, load_settings
from .db import DB
from .greeninvoice import GreenInvoiceClient
from .service import CollectService


class InboundIn(BaseModel):
    phone: str
    text: str


def create_app(service: CollectService | None = None) -> FastAPI:
    if service is None:
        s: Settings = load_settings()
        gi = (GreenInvoiceClient(s.greeninvoice_base_url, s.greeninvoice_api_id,
                                 s.greeninvoice_api_secret)
              if s.greeninvoice_api_id else None)
        service = CollectService(s, DB(s.db_path), gi=gi)
    svc = service
    app = FastAPI(title="Collect Agent (dry-run)")
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
        return {"status": "ok", "send_mode": svc.s.send_mode,
                "greeninvoice_env": svc.s.greeninvoice_env, "dry_run": svc.s.dry_run}

    @app.post("/sync")
    def sync():
        return guard(svc.sync)

    @app.post("/plan")
    def plan():
        return {"created": svc.plan()}

    @app.get("/reminders")
    def reminders(status: str | None = None):
        sql, args = "SELECT * FROM reminders", ()
        if status:
            sql, args = sql + " WHERE status=?", (status,)
        rows = svc.db.q(sql + " ORDER BY id", args)
        return [{**dict(r), "payload": json.loads(r["payload"])} for r in rows]

    @app.post("/reminders/{rid}/approve")
    def approve(rid: int):
        return guard(svc.approve, rid)

    @app.post("/reminders/{rid}/reject")
    def reject(rid: int):
        return guard(svc.reject, rid)

    @app.post("/dispatch")
    def dispatch():
        return {"dry_run": True, "sent": svc.dispatch()}

    @app.get("/outbox")
    def outbox():
        return {"dry_run": True, "messages": svc.sender.sent}

    @app.post("/inbound")
    def inbound(m: InboundIn):
        return svc.inbound(m.phone, m.text)

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


app = None  # נבנה ב-uvicorn דרך --factory: uvicorn app.main:_lazy_app --factory
