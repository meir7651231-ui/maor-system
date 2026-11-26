#!/usr/bin/env bash
# הפעלה 421 (ביקורת 252 ⚠️): בונה את web/dist מחדש כשהוא ישן מהמקור.
#
# קודם demo.sh בנה רק כש-web/dist/index.html חסר ⇒ אחרי fetch/מיזוג, /app/ הגיש ממשק ישן (המבקר ראה
# «✓ טופל» גנרי במקום כרטיס חדש). עכשיו: dist חסר, או קובץ מקור (src/public/index.html/package*.json/
# vite.config.ts/tsconfig.json) חדש ממנו ⇒ build. npm ci רק כשאין node_modules או שהנעילה חדשה ממנו.
# build שנכשל (למשל tsc) ⇒ exit 1 עם הפלט — לא ממשיכים בשקט עם dist ישן.
#
#   scripts/web_build.sh [תיקיית-web]     (ברירת מחדל: web ליד התיקייה הזו)
#   WEB_BUILD=check ⇒ רק בודק: 0 = עדכני, 3 = ישן/חסר (בלי לבנות)
# תואם bash 3.2 + כלי BSD (macOS) — אותו מגן כמו demo.sh (tests/test_web_build_sh.py).
set -euo pipefail
WEB="${1:-$(cd "$(dirname "$0")/.." && pwd)/web}"
cd "$WEB"
DIST=dist/index.html
SRC_PATHS='src public index.html package.json package-lock.json vite.config.ts tsconfig.json'

stale() {
  [[ -f "$DIST" ]] || { echo "missing"; return 0; }
  local p hit
  for p in $SRC_PATHS; do
    [[ -e "$p" ]] || continue
    hit=$(find "$p" -newer "$DIST" -type f -print 2>/dev/null | head -n 1)
    [[ -n "$hit" ]] && { echo "$hit"; return 0; }
  done
  return 1
}

if ! why=$(stale); then
  [[ "${WEB_BUILD:-}" == "check" ]] && exit 0
  echo "▶ הממשק (web/dist) עדכני — לא בונים מחדש"; exit 0
fi
[[ "${WEB_BUILD:-}" == "check" ]] && { echo "$why"; exit 3; }

command -v npm >/dev/null 2>&1 || {
  echo "⚠️ web/dist ישן או חסר ($why) ואין npm — /app/ יגיש גרסה ישנה (או לא יוגש). התקינו Node ונסו שוב." >&2
  exit 2; }

LOG=$(mktemp "${TMPDIR:-/tmp}/gabi-web-build.XXXXXX")
trap 'rm -f "$LOG"' EXIT
if [[ ! -d node_modules ]] || [[ package-lock.json -nt node_modules ]]; then
  echo "▶ מתקין תלויות ממשק (npm ci)…"
  npm ci --no-audit --no-fund --silent >"$LOG" 2>&1 || { echo "❌ npm ci נכשל:" >&2; cat "$LOG" >&2; exit 1; }
  touch node_modules
fi
echo "▶ בונה את הממשק (web/) — $why חדש מה-build הקודם…"
npm run build --silent >"$LOG" 2>&1 || {
  echo "❌ בניית הממשק נכשלה (web/dist לא עודכן — לא מגישים ממשק ישן בשקט):" >&2; cat "$LOG" >&2; exit 1; }
[[ -f "$DIST" ]] || { echo "❌ npm run build הסתיים בלי $DIST" >&2; exit 1; }
touch "$DIST"
echo "✅ הממשק נבנה"
