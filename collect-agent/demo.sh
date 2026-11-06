#!/usr/bin/env bash
# גבי — הדגמה מקצה לקצה בפקודה אחת (מקומי, dry-run, נתוני דמו בדויים, בלי רשת חיצונית).
#
#   ./demo.sh            מרים את השרת עם 6 חשבוניות פתוחות מזויפות, מריץ תזכורות dry-run
#                        (כל SMS/מייל מודפס ללוג עם קישור תשלום דמו), ומגיש את הדשבורד:
#                        http://127.0.0.1:${PORT:-8000}/ui   (Ctrl+C לעצירה)
#   ./demo.sh --check    אותו דבר, מאמת את ה-API והדשבורד, ויוצא (0 = הכול עובד). ל-CI.
#
# חשבונית ירוקה = שרת mock מלא (app/gi_mock.py) על 127.0.0.1:${GI_PORT:-PORT+1}: טוקן, חיפוש מסמכים,
# לקוחות, דף תשלום, ו-webhook «מסמך נוצר» שנשלח לשרת שלנו כשחשבונית משולמת.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8000}"
python3 -c "import fastapi, httpx, uvicorn" 2>/dev/null || pip install -q -e '.[dev]'
# הממשק המעוצב (web/) — נבנה פעם אחת אם יש Node, ומוגש מ-/app/ (חי מול ה-API, dry-run).
if [[ ! -f web/dist/index.html ]] && command -v npm >/dev/null 2>&1 && [[ "${SKIP_WEB:-}" != "1" ]]; then
  echo "▶ בונה את הממשק (web/)…"; (cd web && npm ci --no-audit --no-fund --silent && npm run build --silent) >/dev/null
fi
# ה-API דורש טוקן בעלים (team/qa.md S1). להדגמה: טוקן חד-פעמי אקראי, אלא אם הוגדר.
export OWNER_API_TOKEN="${OWNER_API_TOKEN:-$(python3 -c 'import secrets;print(secrets.token_urlsafe(32))')}"

# --- mock של חשבונית ירוקה (תהליך נפרד, HTTP אמיתי) ---
GI_PORT="${GI_PORT:-$((PORT + 1))}"
export GI_WEBHOOK_KEY="${GI_WEBHOOK_KEY:-$(python3 -c 'import secrets;print(secrets.token_urlsafe(24))')}"
export GREENINVOICE_ENV=mock GREENINVOICE_MOCK_URL="http://127.0.0.1:${GI_PORT}/api/v1"
GI_LOG="$(mktemp)"
python3 -m app.gi_mock --port "$GI_PORT" --seed demo \
  --webhook "http://127.0.0.1:${PORT}/webhooks/greeninvoice?k=${GI_WEBHOOK_KEY}" >"$GI_LOG" 2>&1 &
GI_PID=$!
cleanup() { kill "${PID:-}" "$GI_PID" 2>/dev/null || true; rm -f "${LOG:-}" "$GI_LOG"; }
trap cleanup EXIT INT TERM
for _ in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:${GI_PORT}/api/v1/users/me" && break; sleep 0.25; done
cat "$GI_LOG"

if [[ "${1:-}" != "--check" ]]; then
  [[ -f web/dist/index.html ]] && echo "▶ ממשק גבי (v2): http://127.0.0.1:${PORT}/app/#/dashboard?token=${OWNER_API_TOKEN}" \
    && echo "▶ דף נחיתה v2: http://127.0.0.1:${PORT}/app/  ·  עמוד החייב: http://127.0.0.1:${PORT}/pay/<קוד מה-SMS בלוג>"
  echo "▶ דשבורד: http://127.0.0.1:${PORT}/ui  ·  /landing מפנה ל-/app/"
  echo "🔑 קוד גישה לדשבורד (מודבק פעם אחת בחלון שיקפוץ): ${OWNER_API_TOKEN}"
  echo "▶ חשבונית ירוקה (mock): ${GREENINVOICE_MOCK_URL}"
  DEMO=1 python3 -m uvicorn app.main:_lazy_app --factory --host 127.0.0.1 --port "$PORT" --log-level warning
  exit $?
fi

LOG="$(mktemp)"
DEMO=1 python3 -m uvicorn app.main:_lazy_app --factory --host 127.0.0.1 --port "$PORT" --log-level warning >"$LOG" 2>&1 &
PID=$!
for _ in $(seq 1 60); do curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null && break; sleep 0.25; done
cat "$LOG"
python3 - "$PORT" <<'PY'
import json, os, sys, urllib.error, urllib.request
base = f"http://127.0.0.1:{sys.argv[1]}"
AUTH = {"Authorization": "Bearer " + os.environ["OWNER_API_TOKEN"]}
get = lambda p, h=AUTH: urllib.request.urlopen(
    urllib.request.Request(base + p, headers=h), timeout=5).read().decode()
h = json.loads(get("/health")); assert h["dry_run"] is True, h
try:
    get("/dashboard", {}); raise AssertionError("/dashboard פתוח בלי טוקן")
except urllib.error.HTTPError as e:
    assert e.code == 401, e.code
d = json.loads(get("/dashboard")); t = d["totals"]
assert t["open_invoices"] == 5 and t["closed_invoices"] == 1, t
# חשבונית ירוקה הגיעה דרך שרת ה-mock ב-HTTP, וה-webhook של «מסמך נוצר» (קבלה) הגיע אלינו
import time
for _ in range(40):
    audit = json.loads(get("/audit"))
    if any(a["action"] == "gi_webhook" for a in audit):
        break
    time.sleep(0.25)
else:
    raise AssertionError("webhook מה-mock של חשבונית ירוקה לא הגיע")
gi = os.environ["GREENINVOICE_MOCK_URL"]
dl = json.loads(urllib.request.urlopen(gi + "/_mock/deliveries", timeout=5).read())["deliveries"]
assert dl and dl[0]["payload"]["type"] == 400 and dl[0]["ok"], dl
print(f"✅ חשבונית ירוקה (mock HTTP): סנכרון + webhook קבלה {dl[0]['payload']['number']} התקבל")
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
import os
if os.path.isfile("web/dist/index.html"):
    assert "גבי" in get("/app/"), "הממשק המעוצב לא מוגש ב-/app/"
    print("✅ הממשק המעוצב מוגש ב-/app/")
# עמוד החייב v2: ציבורי, בלי פרטי קשר, אמצעי תשלום Bit/Apple Pay/כרטיס
pv = json.loads(get(f"/api/pay/{code}", {}))
assert pv["methods"] == ["bit", "apple_pay", "card"] and pv["open"] and "phone" not in pv, pv
if os.path.isfile("web/dist/index.html"):
    assert '<base href="/app/">' in get(f"/pay/{code}", {}), "עמוד החייב לא מוגש"
    print(f"✅ עמוד החייב v2: /pay/{code} ({pv['amount']})")
d2 = json.loads(get("/dashboard"))
assert len(d2["series"]) == 8 and d2["totals"]["collected_agorot"] > 0, d2["totals"]
import http.client
hc = http.client.HTTPConnection("127.0.0.1", int(sys.argv[1]), timeout=5); hc.request("GET", "/landing")
loc = hc.getresponse().getheader("location"); assert loc in ("/app/", "/ui"), f"/landing לא מפנה: {loc}"
print(f"✅ בדיקת ההדגמה עברה: {t}")
PY
