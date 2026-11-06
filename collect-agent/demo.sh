#!/usr/bin/env bash
# גבי — הדגמה מקצה לקצה בפקודה אחת (מקומי, dry-run, נתוני דמו בדויים, בלי רשת חיצונית).
#
#   ./demo.sh            מרים את השרת עם 6 חשבוניות פתוחות מזויפות, מריץ תזכורות dry-run
#                        (כל SMS/מייל מודפס ללוג עם קישור תשלום דמו), ומגיש את הדשבורד:
#                        http://127.0.0.1:${PORT:-8000}/ui   (Ctrl+C לעצירה)
#   ./demo.sh --check    אותו דבר, מאמת את ה-API והדשבורד, ויוצא (0 = הכול עובד). ל-CI.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8000}"
python3 -c "import fastapi, httpx, uvicorn" 2>/dev/null || pip install -q -e '.[dev]'

if [[ "${1:-}" != "--check" ]]; then
  echo "▶ דשבורד: http://127.0.0.1:${PORT}/ui"
  echo "▶ טיוטת דף נחיתה: http://127.0.0.1:${PORT}/landing"
  exec env DEMO=1 python3 -m uvicorn app.main:_lazy_app --factory --host 127.0.0.1 --port "$PORT" --log-level warning
fi

LOG="$(mktemp)"
DEMO=1 python3 -m uvicorn app.main:_lazy_app --factory --host 127.0.0.1 --port "$PORT" --log-level warning >"$LOG" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true; rm -f "$LOG"' EXIT
for _ in $(seq 1 60); do curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null && break; sleep 0.25; done
cat "$LOG"
python3 - "$PORT" <<'PY'
import json, sys, urllib.request
base = f"http://127.0.0.1:{sys.argv[1]}"
get = lambda p: urllib.request.urlopen(base + p, timeout=5).read().decode()
h = json.loads(get("/health")); assert h["dry_run"] is True, h
d = json.loads(get("/dashboard")); t = d["totals"]
assert t["open_invoices"] == 5 and t["closed_invoices"] == 1, t
assert t["sent_sms"] >= 3 and t["sent_email"] >= 3 and t["pending_approval"] >= 1, t
out = json.loads(get("/outbox"))["messages"]
assert all(m["channel"] in ("sms", "email") for m in out)
assert any("pay.example/gabi-demo" in m["body"] for m in out), "חסר קישור תשלום דמו"
ui = get("/ui"); assert 'id="debts"' in ui and 'id="kpis"' in ui
lp = get("/landing"); assert "119 ₪" in lp and 'href="/ui"' in lp and "noindex" in lp
print(f"✅ בדיקת ההדגמה עברה: {t}")
PY
