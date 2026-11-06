#!/usr/bin/env bash
# בדיקת עשן לשרת אמיתי (uvicorn על 127.0.0.1 בלבד) — רץ ב-CI. dry-run, בלי Green Invoice.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8765}"
TMP="$(mktemp -d)"
trap 'kill "${PID:-0}" 2>/dev/null || true; rm -rf "$TMP"' EXIT
export OWNER_API_TOKEN="$(python3 -c 'import secrets;print(secrets.token_urlsafe(32))')"
export INBOUND_WEBHOOK_SECRET="$(python3 -c 'import secrets;print(secrets.token_urlsafe(32))')"
export SMS_WEBHOOK_KEY="$(python3 -c 'import secrets;print(secrets.token_urlsafe(24))')"
export DB_PATH="$TMP/smoke.sqlite3" SEND_MODE=dry_run GREENINVOICE_ENV=sandbox

fail() { echo "❌ $*"; exit 1; }

# 1. מעקה: בלי טוקן — השרת לא עולה
if OWNER_API_TOKEN= timeout 20 python3 -c 'from app.main import _lazy_app; _lazy_app()' 2>/dev/null; then
  fail "האפליקציה עלתה בלי OWNER_API_TOKEN"
fi
# 2. מעקה: SEND_MODE=live — קורס
if SEND_MODE=live timeout 20 python3 -c 'from app.main import _lazy_app; _lazy_app()' 2>/dev/null; then
  fail "האפליקציה עלתה עם SEND_MODE=live"
fi

python3 -m uvicorn app.main:_lazy_app --factory --host 127.0.0.1 --port "$PORT" \
  --log-level info >"$TMP/server.log" 2>&1 &
PID=$!
for _ in $(seq 1 50); do curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1 && break; sleep 0.2; done

H="$(curl -fsS "http://127.0.0.1:$PORT/health")"
echo "$H" | grep -q '"dry_run":true' || fail "/health לא מדווח dry_run: $H"
[ "$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://127.0.0.1:$PORT/dispatch")" = 401 ] \
  || fail "/dispatch בלי טוקן לא החזיר 401"
[ "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $OWNER_API_TOKEN" \
  "http://127.0.0.1:$PORT/reminders")" = 200 ] || fail "/reminders עם טוקן לא החזיר 200"
[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/docs")" = 404 ] \
  || fail "/docs חשוף"
[ "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'content-type: application/x-www-form-urlencoded' \
  --data 'type=dlr&phone=0501234567' "http://127.0.0.1:$PORT/webhooks/sms/019?k=$SMS_WEBHOOK_KEY")" = 200 ] \
  || fail "webhook 019 עם מפתח נכון לא החזיר 200"
[ "$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://127.0.0.1:$PORT/webhooks/sms/019?k=wrong")" = 403 ] \
  || fail "webhook 019 עם מפתח שגוי לא החזיר 403"
[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/ui")" = 200 ] || fail "/ui לא עולה"
sleep 0.3
grep -q "webhooks/sms/019" "$TMP/server.log" || fail "לוג הגישה ריק — בדיקת הדליפה לא בודקת כלום"
if grep -q "$SMS_WEBHOOK_KEY" "$TMP/server.log"; then fail "מפתח ה-webhook דלף ללוג הגישה"; fi
PERM="$(stat -c '%a' "$DB_PATH")"
[ "$PERM" = 600 ] || fail "הרשאות DB $PERM (צריך 600)"
if grep -q "$OWNER_API_TOKEN" "$TMP/server.log"; then fail "הטוקן דלף ללוג"; fi
grep "webhooks/sms/019" "$TMP/server.log" | head -2
echo "✅ smoke: עולה רק עם טוקן, dry-run, 401 בלי אימות, docs מוסתר, webhook 019 עם מפתח, DB 0600, אין דליפת טוקן/מפתח ללוג"
