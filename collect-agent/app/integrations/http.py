"""בסיס משותף ל-adapters מבוססי HTTP: dry-run, מניעת כפילויות, סיווג שגיאות."""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

import httpx

from .base import (
    ProviderError,
    SendResult,
    classify_status,
    guard_transport,
    request_preview,
)

TIMEOUT = httpx.Timeout(15.0, connect=5.0)


class HttpAdapter:
    provider = "base"
    channel = "sms"

    def __init__(self, *, transport: httpx.BaseTransport | None = None) -> None:
        self._transport = guard_transport(transport)
        self._client = (httpx.Client(transport=self._transport, timeout=TIMEOUT)
                        if self._transport else None)
        self._seen: dict[str, SendResult] = {}
        self.outbox: list[dict[str, Any]] = []   # מה *היה* נשלח (dry-run) / נשלח (mock)

    @property
    def dry_run(self) -> bool:
        return self._client is None

    def _secrets(self) -> tuple[str, ...]:
        return ()

    def _execute(self, req: httpx.Request, idem: str,
                 parse: Callable[[httpx.Response], str]) -> SendResult:
        if idem and idem in self._seen:
            prev = self._seen[idem]
            return SendResult(ok=prev.ok, provider=self.provider, channel=self.channel,
                              dry_run=prev.dry_run, message_id=prev.message_id,
                              duplicate=True, preview=prev.preview)
        preview = request_preview(req, secrets=self._secrets())
        self.outbox.append(preview)
        if self._client is None:
            res = SendResult(ok=True, provider=self.provider, channel=self.channel,
                             dry_run=True, message_id=f"dryrun.{self.provider}.{len(self.outbox)}",
                             preview=preview)
        else:
            try:
                r = self._client.send(req)
                if r.status_code >= 400:
                    raise classify_status(self.provider, r)
                mid = parse(r)
                res = SendResult(ok=True, provider=self.provider, channel=self.channel,
                                 dry_run=False, message_id=mid, preview=preview)
            except ProviderError as e:
                return SendResult(ok=False, provider=self.provider, channel=self.channel,
                                  dry_run=False, error=str(e), retryable=e.retryable,
                                  preview=preview)
            except (httpx.TimeoutException, httpx.TransportError) as e:
                # לא יודעים אם נשלח ⇒ retryable, אבל לא נרשם כ-seen (מניעת כפילות בצד הספק
                # דרך idempotency-key היכן שנתמך)
                return SendResult(ok=False, provider=self.provider, channel=self.channel,
                                  dry_run=False, error=f"{type(e).__name__}: {e}",
                                  retryable=True, preview=preview)
            except (ValueError, KeyError) as e:
                return SendResult(ok=False, provider=self.provider, channel=self.channel,
                                  dry_run=False, error=f"תשובה לא צפויה: {e}",
                                  preview=preview)
        if idem:
            self._seen[idem] = res
        return res
