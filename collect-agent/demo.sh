#!/usr/bin/env bash
# גבי — הדגמה מקצה לקצה בפקודה אחת (מקומי, dry-run, נתוני דמו בדויים, בלי רשת חיצונית).
#
#   ./demo.sh            מרים את השרת עם 10 חשבוניות פתוחות מזויפות (8 לקוחות, אחת בדולר), מריץ תזכורות dry-run
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
cleanup() { kill "${PID:-}" "$GI_PID" 2>/dev/null || true; rm -f "${LOG:-}" "$GI_LOG" "${DEMO_USER_SECRET_FILE:-}"; }
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
# עובד דמו + סוד TOTP בקובץ זמני ⇒ בודקים כניסה אמיתית (מייל+סיסמה+קוד) מקצה לקצה
export DEMO_USER_EMAIL="dana@example.co.il" DEMO_USER_PASSWORD="demo-pass-12345" DEMO_USER_SECRET_FILE="$(mktemp)"
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
assert t["open_invoices"] == 8 and t["closed_invoices"] == 2, t
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
# הפעלה 125: סכום חריג בהדגמה — גל שרון, 2,490 במקום 24.90 ⇒ ממתינה לאישור מפורש + התראה בתיבה
odd = [r for r in json.loads(get("/reminders?status=pending_approval&view=summary"))
       if r["block_reason"] == "amount_check"]
assert len(odd) == 1, odd
pr = json.loads(get(f"/reminders/{odd[0]['id']}/preview"))
assert [(c["number"], c["amount_agorot"]) for c in pr["amount_check"]] == [("2009", 249000)], pr["amount_check"]
assert any(m["intent"] == "amount_check" for m in json.loads(get("/owner/inbox"))), "חסרה התראת סכום חריג"
print("✅ סכום חריג בהדגמה: חשבונית 2009 ממתינה לאישור «הסכום נכון» + התראה לבעל העסק")
ui = get("/ui"); assert 'id="debts"' in ui and 'id="kpis"' in ui
import os
if os.path.isfile("web/dist/index.html"):
    assert "גבי" in get("/app/"), "הממשק המעוצב לא מוגש ב-/app/"
    print("✅ הממשק המעוצב מוגש ב-/app/")
# עמוד החייב v2: ציבורי, בלי פרטי קשר. כפתור ניטרלי אחד + דומיין היעד (review חור 4)
pv = json.loads(get(f"/api/pay/{code}", {}))
assert pv["methods"] == ["page"] and pv["pay_host"] == "pay.example" and pv["open"] \
    and "phone" not in pv, pv
if os.path.isfile("web/dist/index.html"):
    assert '<base href="/app/">' in get(f"/pay/{code}", {}), "עמוד החייב לא מוגש"
    print(f"✅ עמוד החייב v2: /pay/{code} ({pv['amount']})")
# כניסת עובד מקצה לקצה: סיסמה שגויה ⇒ 401; סיסמה+קוד TOTP ⇒ טוקן סשן שעובד; יציאה ⇒ הטוקן נסגר
sys.path.insert(0, ".")
from app import totp
from app.demo import DEMO_NOW  # שעון הדמו קבוע ⇒ קוד ה-TOTP נגזר ממנו
def post(path, body, h=None):
    rq = urllib.request.Request(base + path, data=json.dumps(body).encode(), method="POST",
                                headers={"content-type": "application/json", **(h or {})})
    try:
        return 200, json.loads(urllib.request.urlopen(rq, timeout=5).read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, None
sec = open(os.environ["DEMO_USER_SECRET_FILE"]).read().strip()
em, pw = os.environ["DEMO_USER_EMAIL"], os.environ["DEMO_USER_PASSWORD"]
assert post("/auth/login", {"email": em, "password": "wrong-password-1", "code": totp.code_at(sec, DEMO_NOW.timestamp())})[0] == 401
code_, res = post("/auth/login", {"email": em, "password": pw, "code": totp.code_at(sec, DEMO_NOW.timestamp())})
assert code_ == 200 and len(res["token"]) >= 32, (code_, res)
tok = {"Authorization": "Bearer " + res["token"]}
assert json.loads(get("/dashboard", tok))["totals"]["open_invoices"] == 8
post("/auth/logout", {}, tok)
try:
    get("/dashboard", tok); raise AssertionError("הטוקן עדיין תקף אחרי יציאה")
except urllib.error.HTTPError as e:
    assert e.code == 401, e.code
print("✅ כניסת עובד (מייל+סיסמה+TOTP): כניסה, גישה ויציאה עובדים מקצה לקצה")
d2 = json.loads(get("/dashboard"))
assert len(d2["series"]) == 8 and d2["totals"]["collected_agorot"] > 0, d2["totals"]
# הפעלה 139: הלקוח בחו״ל שילם $500 ⇒ הדולר בנפרד (other_currency + other בשבוע), ה-₪ בלי שינוי
assert d2["totals"]["collected_agorot"] == 210000, d2["totals"]
assert [(o["currency"], o["collected_agorot"]) for o in d2["totals"]["other_currency"]] == [("USD", 50000)], d2["totals"]
wk = [p for p in d2["series"] if p.get("other")]
assert len(wk) == 1 and wk[0]["collected_agorot"] == 210000 \
    and wk[0]["other"] == [{"currency": "USD", "collected_agorot": 50000}], d2["series"]
print("✅ גבייה במטבע אחר: 2,100 ₪ בגרף + $500 בנפרד (בלי המרה, בלי חיבור)")
import http.client
hc = http.client.HTTPConnection("127.0.0.1", int(sys.argv[1]), timeout=5); hc.request("GET", "/landing")
loc = hc.getresponse().getheader("location"); assert loc in ("/app/", "/ui"), f"/landing לא מפנה: {loc}"
print(f"✅ בדיקת ההדגמה עברה: {t}")
PY
# גיבוי מוצפן מתוזמן + שחזור (CLI אמיתי על DB קובץ זמני): snapshot ⇒ restore ⇒ אותו תוכן, ואין טקסט גלוי בקובץ
BK="$(mktemp -d)"
export COLLECT_MASTER_KEYS="demo:$(python3 -c 'import base64,os;print(base64.b64encode(os.urandom(32)).decode())')"
python3 - "$BK/src.sqlite3" <<'PY'
import sqlite3, sys
c = sqlite3.connect(sys.argv[1]); c.execute("create table t(x text)"); c.execute("insert into t values ('סודי-דמו-123')"); c.commit()
PY
python3 -m app.backup snapshot "$BK/src.sqlite3" "$BK/snaps" 3 >/dev/null
SNAP="$(ls "$BK"/snaps/gabi-*.gbk | head -1)"
python3 -m app.backup restore "$SNAP" "$BK/restored.sqlite3" >/dev/null
python3 - "$BK" "$SNAP" <<'PY'
import sys
from app import dbcrypt
bk, snap = sys.argv[1], sys.argv[2]
assert dbcrypt.connect_existing(f"{bk}/restored.sqlite3").execute("select x from t").fetchone()[0] == "סודי-דמו-123"
assert "סודי-דמו-123".encode() not in open(snap, "rb").read(), "הגיבוי לא מוצפן"
if dbcrypt.mode() == dbcrypt.SQLCIPHER:   # שער 5: גם היעד המשוחזר מוצפן
    assert not dbcrypt.is_plaintext_sqlite(f"{bk}/restored.sqlite3"), "השחזור נכתב גלוי"
print("✅ גיבוי מוצפן + שחזור (CLI): תוכן זהה, אין טקסט גלוי בקובץ")
PY
rm -rf "$BK"
# מחיקת עסק שלם בסוף בטא (שער 8, CLI אמיתי): אין PII בקובץ אחרי, suppressions ו-audit נשארים, בלי אישור ⇒ לא נוגע
WP="$(mktemp -d)"
python3 - "$WP/live.db" <<'PY'
import sys
from app.db import DB
db = DB(sys.argv[1])
db.x("INSERT INTO customers(name,phone,email) VALUES('דנה-מחיקה','050-0007777','w@example.com')")
db.x("INSERT INTO suppressions(hash,channel,reason,created_at) VALUES('h1','sms','stop','t')")
db.conn.close()
PY
python3 -m app.wipe "$WP/live.db" >/dev/null 2>&1 && { echo "wipe רץ בלי --confirm"; exit 1; }
python3 -m app.wipe "$WP/live.db" --confirm WIPE >/dev/null
python3 - "$WP/live.db" <<'PY'
import sys
from app import dbcrypt
p = sys.argv[1]; c = dbcrypt.connect_existing(p)
if dbcrypt.mode() == dbcrypt.SQLCIPHER:
    assert not dbcrypt.is_plaintext_sqlite(p), "ה-DB אחרי wipe לא מוצפן"
assert c.execute("select count(*) from customers").fetchone()[0] == 0
assert c.execute("select count(*) from suppressions").fetchone()[0] == 1
assert "דנה-מחיקה".encode() not in open(p, "rb").read() and b"050-0007777" not in open(p, "rb").read(), "PII נשאר בקובץ"
print("✅ מחיקת עסק שלם (CLI): אין PII בקובץ, suppressions נשארו, בלי אישור לא נוגע")
PY
rm -rf "$WP"
# שער 5 · SQLCipher (רק כש-DB_ENCRYPTION=sqlcipher): מיגרציה של DB גלוי ⇒ מוצפן עם גיבוי מאומת, פעם שנייה מסרבת
if [[ "${DB_ENCRYPTION:-}" == "sqlcipher" ]]; then
  EN="$(mktemp -d)"
  DB_ENCRYPTION=off python3 - "$EN/live.db" <<'PY'
import sys
from app.db import DB
db = DB(sys.argv[1]); db.x("INSERT INTO customers(name,phone) VALUES('דנה-הצפנה','050-0008888')"); db.conn.close()
PY
  python3 -m app.db_encrypt "$EN/live.db" --confirm ENCRYPT --backup "$EN/pre.gbk" >/dev/null
  python3 -m app.db_encrypt "$EN/live.db" --confirm ENCRYPT >/dev/null 2>&1 && { echo "הצפנה כפולה לא נחסמה"; exit 1; }
  python3 - "$EN/live.db" <<'PY'
import sys
from app.db import DB
p = sys.argv[1]; raw = open(p, "rb").read()
assert raw[:16] != b"SQLite format 3\x00" and b"050-0008888" not in raw, "ה-DB לא מוצפן אחרי המיגרציה"
db = DB(p); assert db.encrypted and db.one("SELECT phone FROM customers")[0] == "050-0008888"
print("✅ SQLCipher: מיגרציה עם גיבוי מאומת, הקובץ מוצפן, נפתח במפתח, הצפנה כפולה נחסמה")
PY
  rm -rf "$EN"
fi
