"""שכבת שליחה. בשלב 1 קיימת רק DryRunSender — אין בקוד הזה שום קריאת רשת.

`build_template_payload` בונה את גוף הבקשה המדויק ל-WhatsApp Cloud API
(POST /{phone_number_id}/messages) כדי שה-dry-run יציג בדיוק מה *היה* נשלח.
"""
from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from typing import Any


def normalize_il_phone(raw: str) -> str | None:
    """'050-1234567' / '+972 50 1234567' ⇒ '972501234567' (פורמט WhatsApp). לא-תקין ⇒ None."""
    d = re.sub(r"\D", "", raw or "")
    if d.startswith("00"):
        d = d[2:]
    if d.startswith("0") and len(d) in (9, 10):
        d = "972" + d[1:]
    if not d.startswith("972") or len(d) not in (11, 12):
        return None
    return d


def build_template_payload(to: str, template_name: str, params: list[str],
                           lang: str = "he") -> dict[str, Any]:
    return {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": lang},
            "components": [{"type": "body",
                            "parameters": [{"type": "text", "text": p} for p in params]}],
        },
    }


def build_text_payload(to: str, text: str) -> dict[str, Any]:
    # הודעת טקסט חופשי מותרת רק בתוך חלון 24 שעות מהודעת הלקוח
    return {"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": text}}


@dataclass
class DryRunSender:
    """שומרת כל "שליחה" בזיכרון ומחזירה מזהה מדומה. לא נוגעת ברשת."""

    sent: list[dict[str, Any]] = field(default_factory=list)
    mode: str = "dry_run"

    def send(self, payload: dict[str, Any]) -> str:
        msg_id = f"dryrun.{uuid.uuid4().hex[:12]}"
        self.sent.append({"id": msg_id, "payload": payload})
        return msg_id
