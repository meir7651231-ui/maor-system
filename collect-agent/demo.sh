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
# הממשק המעוצב (web/) — נבנה פעם אחת אם יש Node, ומוגש מ-/app/ (חי מול ה-API, dry-run).
if [[ ! -f web/dist/index.html ]] && command -v npm >/dev/null 2>&1 && [[ "${SKIP_WEB:-}" != "1" ]]; then
  echo "▶ בונה את הממשק (web/)…"; (cd web && npm ci --no-audit --no-fund --silent && npm run build --silent) >/dev/null
fi

if [[ "${1:-}" != "--check" ]]; then
  [[ -f web/dist/index.html ]] && echo "▶ ממשק גבי: http://127.0.0.1:${PORT}/app/#/dashboard"
  echo "▶ דשבורד: http://127.0.0.1:${PORT}/ui  ·  דף נחיתה (טיוטה): http://127.0.0.1:${PORT}/landing"
  exec env DEMO=1 python3 -m uvicorn app.main:_lazy_app --factory --host 127.0.0.1 --port "$PORT" --log-level warning
fi

LOG="$(mktemp)"
DEMO=1 python3 -m uvicorn app.main:_lazy_app --factory --host 127.0.0.1 --port "$PORT" --log-level warning >"$LOG" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true; rm -f "$LOG"' EXIT
for _ in $(seq 1 60); do curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null && break; sleep 0.25; done
cat "$LOG"
python3 - "$PORT" <<'PY'
import json, sys, urllib.error, urllib.request
base = f"http://127.0.0.1:{sys.argv[1]}"
get = lambda p: urllib.request.urlopen(base + p, timeout=5).read().decode()
h = json.loads(get("/health")); assert h["dry_run"] is True, h
d = json.loads(get("/dashboard")); t = d["totals"]
assert t["open_invoices"] == 5 and t["closed_invoices"] == 1, t
assert t["sent_sms"] >= 3 and t["sent_email"] >= 3 and t["pending_approval"] >= 1, t
out = json.loads(get("/outbox"))["messages"]
assert all(m["channel"] in ("sms", "email") for m in out)
assert any("pay.example/gabi-demo" in m["body"] for m in out if m["channel"] == "email"), "חסר קישור תשלום דמו"
sms = [m for m in out if m["channel"] == "sms" and "/p/" in m["body"]]
assert sms and all(m["length"]["segments"] <= 2 for m in sms), "SMS ארוך מ-2 חלקים"
code = sms[0]["body"].split("/p/")[1].split()[0]
page = get(f"/p/{code}"); assert "לתשלום מאובטח" in page and "הפסקת תזכורות" in page
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
try:
    urllib.request.build_opener(NoRedirect).open(f"{base}/p/{code}/pay", timeout=5); loc = None
except urllib.error.HTTPError as e:
    loc = e.headers.get("location")
assert loc and loc.startswith("https://pay.example/gabi-demo"), loc
ui = get("/ui"); assert 'id="debts"' in ui and 'id="kpis"' in ui
la = get("/landing"); assert "₪119" in la and 'href="/ui"' in la, "דף הנחיתה לא תקין"
import os
if os.path.isfile("web/dist/index.html"):
    assert "גבי" in get("/app/"), "הממשק המעוצב לא מוגש ב-/app/"
    print("✅ הממשק המעוצב מוגש ב-/app/")
print(f"✅ בדיקת ההדגמה עברה: {t}")
PY
