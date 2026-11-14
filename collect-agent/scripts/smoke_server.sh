#!/usr/bin/env bash
# בדיקת עשן לשרת אמיתי (uvicorn על 127.0.0.1 בלבד) — רץ ב-CI וגם מקומית (team/qa.md §6). dry-run, בלי Green Invoice.
# תואם bash 3.2 + כלי BSD (macOS): בלי timeout ובלי stat -c — אחרת המעקות "עוברים" בשקט (exit 127). הפעלה 195.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8765}"
TMP="$(mktemp -d)"
# PID ריק עד שהשרת עולה — `kill 0` היה הורג את כל קבוצת התהליכים (המעטפת/pytest/ה-CI). הפעלה 195.
PID=""
trap 'if [ -n "$PID" ]; then kill "$PID" 2>/dev/null || true; fi; rm -rf "$TMP"' EXIT
export OWNER_API_TOKEN="$(python3 -c 'import secrets;print(secrets.token_urlsafe(32))')"
export INBOUND_WEBHOOK_SECRET="$(python3 -c 'import secrets;print(secrets.token_urlsafe(32))')"
export SMS_WEBHOOK_KEY="$(python3 -c 'import secrets;print(secrets.token_urlsafe(24))')"
export DB_PATH="$TMP/smoke.sqlite3" SEND_MODE=dry_run GREENINVOICE_ENV=sandbox

fail() { echo "❌ $*"; exit 1; }
# המפרש עצמו מגביל את זמנו (SIGALRM) — במקום timeout של GNU, שלא קיים ב-mac.
BOOT='import signal; signal.alarm(20); from app.main import _lazy_app; _lazy_app()'
python3 -c 'import app.main' 2>/dev/null || fail "python3 לא מייבא את app.main (חסרות תלויות? ./demo.sh יוצר .venv)"

# 1. מעקה: בלי טוקן — השרת לא עולה
if OWNER_API_TOKEN= python3 -c "$BOOT" 2>/dev/null; then
  fail "האפליקציה עלתה בלי OWNER_API_TOKEN"
fi
# 2. מעקה: SEND_MODE=live — קורס
if SEND_MODE=live python3 -c "$BOOT" 2>/dev/null; then
  fail "האפליקציה עלתה עם SEND_MODE=live"
fi

# 3. שער 5 (רק כש-DB_ENCRYPTION=sqlcipher): הצפנה דלוקה בלי COLLECT_MASTER_KEYS ⇒ לא עולה, ולא נוצר קובץ
if [[ "${DB_ENCRYPTION:-}" == "sqlcipher" ]]; then
  if COLLECT_MASTER_KEYS= DB_PATH="$TMP/nokey.sqlite3" python3 -c "$BOOT" 2>/dev/null; then
    fail "האפליקציה עלתה עם DB_ENCRYPTION=sqlcipher בלי מפתח"
  fi
  [ ! -e "$TMP/nokey.sqlite3" ] || fail "נוצר קובץ DB למרות שההצפנה נכשלה"
fi

python3 -m uvicorn app.main:_lazy_app --factory --host 127.0.0.1 --port "$PORT" \
  --log-level info >"$TMP/server.log" 2>&1 &
PID=$!
# הפעלה 197: הלולאה נגמרה בשקט כשהשרת קרס בעלייה ⇒ «curl: (7)» בלי הלוג. עכשיו: מת/לא עלה ⇒ fail עם הלוג.
UP=""
for _ in $(seq 1 50); do
  if curl -fsS -m 2 "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then UP=1; break; fi
  kill -0 "$PID" 2>/dev/null || { cat "$TMP/server.log"; fail "השרת יצא לפני שעלה (הלוג למעלה)"; }
  sleep 0.2
done
[ -n "$UP" ] || { cat "$TMP/server.log"; fail "השרת לא עלה תוך 10 שניות (הלוג למעלה)"; }

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
PERM="$(python3 -c 'import os,stat,sys; print(format(stat.S_IMODE(os.stat(sys.argv[1]).st_mode), "o"))' "$DB_PATH")"
[ "$PERM" = 600 ] || fail "הרשאות DB $PERM (צריך 600)"
if grep -q "$OWNER_API_TOKEN" "$TMP/server.log"; then fail "הטוקן דלף ללוג"; fi
if [[ "${DB_ENCRYPTION:-}" == "sqlcipher" ]]; then
  python3 -c 'import sys; from app import dbcrypt; dbcrypt.assert_encrypted_file(sys.argv[1])' "$DB_PATH" \
    || fail "DB_ENCRYPTION=sqlcipher אבל קובץ ה-DB של השרת לא מוצפן"
  echo "✅ smoke SQLCipher: בלי מפתח לא עולה; קובץ ה-DB של השרת מוצפן"
fi
grep "webhooks/sms/019" "$TMP/server.log" | head -2
echo "✅ smoke: עולה רק עם טוקן, dry-run, 401 בלי אימות, docs מוסתר, webhook 019 עם מפתח, DB 0600, אין דליפת טוקן/מפתח ללוג"
