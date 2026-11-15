#!/usr/bin/env bash
# בדיקות החוזה מול ה-mock כשרתי HTTP אמיתיים על 127.0.0.1 (לא רק בתוך התהליך, כמו ב-pytest).
# חשבונית ירוקה (gi_mock) + 019 (sms019_mock). InforU רץ רק בתוך התהליך (אין לו שרת mock).
# אפס רשת חיצונית: הכול loopback. נכשל אם יש FAIL באחד מהדוחות.
# קבצים זמניים (לוגים של השרתים) נמחקים תמיד ב-cleanup — גם בכשל (מגן: tests/test_contract_checks_http_sh.py).
set -euo pipefail
cd "$(dirname "$0")/.."
GI_PORT="${GI_PORT:-18791}"; SMS_PORT="${SMS_PORT:-18795}"
# אתחול לריק ⇒ cleanup ⇒ trap ⇒ mktemp (הפעלה 221): כשל/אות בין היצירה לרישום לא משאיר קובץ, ולא מוחקים ערך
# שירשנו מהסביבה. INT/TERM ⇒ יציאה עם קוד-אות (cleanup עם rc=0 היה מסיים 0 אחרי Ctrl+C).
GI_LOG=""; SMS_LOG=""; GI=""; SMS=""
cleanup() {
  local rc=$?
  [[ -n "$GI" ]] && kill "$GI" 2>/dev/null || true
  [[ -n "$SMS" ]] && kill "$SMS" 2>/dev/null || true
  if [[ $rc -ne 0 ]]; then
    echo "--- לוג gi_mock ---"; tail -n 30 "${GI_LOG:-/dev/null}" 2>/dev/null || true
    echo "--- לוג sms019_mock ---"; tail -n 30 "${SMS_LOG:-/dev/null}" 2>/dev/null || true
  fi
  rm -f "${GI_LOG:-}" "${SMS_LOG:-}"
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
GI_LOG="$(mktemp)"
SMS_LOG="$(mktemp)"
python3 -m app.gi_mock --port "$GI_PORT" --seed demo >"$GI_LOG" 2>&1 & GI=$!
python3 -m app.sms019_mock --port "$SMS_PORT" >"$SMS_LOG" 2>&1 & SMS=$!
up() { curl -s -o /dev/null "http://127.0.0.1:$GI_PORT/api/v1/users/me" \
       && curl -s -o /dev/null -X POST "http://127.0.0.1:$SMS_PORT/api/test"; }
for _ in $(seq 60); do up && break; sleep 0.5; done
up || { echo "❌ שרתי ה-mock לא עלו"; exit 1; }
python3 -I scripts/gi_contract_check.py --mock-url "http://127.0.0.1:$GI_PORT/api/v1"
python3 -I scripts/sms019_contract_check.py --mock-url "http://127.0.0.1:$SMS_PORT"
python3 -I scripts/inforu_contract_check.py
echo "✅ בדיקות החוזה מול mock ב-HTTP: אין FAIL"
