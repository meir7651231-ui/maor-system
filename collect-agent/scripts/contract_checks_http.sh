#!/usr/bin/env bash
# בדיקות החוזה מול ה-mock כשרתי HTTP אמיתיים על 127.0.0.1 (לא רק בתוך התהליך, כמו ב-pytest).
# חשבונית ירוקה (gi_mock) + 019 (sms019_mock). InforU רץ רק בתוך התהליך (אין לו שרת mock).
# אפס רשת חיצונית: הכול loopback. נכשל אם יש FAIL באחד מהדוחות.
# קבצים זמניים (לוגים של השרתים) נמחקים תמיד ב-cleanup — גם בכשל (מגן: tests/test_contract_checks_http_sh.py).
set -euo pipefail
cd "$(dirname "$0")/.."
GI_PORT="${GI_PORT:-18791}"; SMS_PORT="${SMS_PORT:-18795}"
GI_LOG="$(mktemp)"
SMS_LOG="$(mktemp)"
GI=""; SMS=""
cleanup() {
  local rc=$?
  [[ -n "$GI" ]] && kill "$GI" 2>/dev/null || true
  [[ -n "$SMS" ]] && kill "$SMS" 2>/dev/null || true
  if [[ $rc -ne 0 ]]; then
    echo "--- לוג gi_mock ---"; tail -n 30 "$GI_LOG" 2>/dev/null || true
    echo "--- לוג sms019_mock ---"; tail -n 30 "$SMS_LOG" 2>/dev/null || true
  fi
  rm -f "$GI_LOG" "$SMS_LOG"
  exit "$rc"
}
trap cleanup EXIT INT TERM
python -m app.gi_mock --port "$GI_PORT" --seed demo >"$GI_LOG" 2>&1 & GI=$!
python -m app.sms019_mock --port "$SMS_PORT" >"$SMS_LOG" 2>&1 & SMS=$!
up() { curl -s -o /dev/null "http://127.0.0.1:$GI_PORT/api/v1/users/me" \
       && curl -s -o /dev/null -X POST "http://127.0.0.1:$SMS_PORT/api/test"; }
for _ in $(seq 60); do up && break; sleep 0.5; done
up || { echo "❌ שרתי ה-mock לא עלו"; exit 1; }
python -I scripts/gi_contract_check.py --mock-url "http://127.0.0.1:$GI_PORT/api/v1"
python -I scripts/sms019_contract_check.py --mock-url "http://127.0.0.1:$SMS_PORT"
python -I scripts/inforu_contract_check.py
echo "✅ בדיקות החוזה מול mock ב-HTTP: אין FAIL"
