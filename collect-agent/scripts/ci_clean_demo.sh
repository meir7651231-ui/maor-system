#!/usr/bin/env bash
# הפעלה 192 — ההדגמה במכונה נקייה (QA מ-191). רץ בתוך container של הפצה (debian/ubuntu), בלי setup-python:
# פייתון של המערכת + חבילת cryptography של ההפצה (זו שחסמה שדרוג ב-191) ⇒ demo.sh חייב לעבור דרך ה-.venv
# שלו. ב-CI הרגיל setup-python מסתיר את המצב הזה (pip=python, הכול מותקן מראש) — לכן הג'וב הזה קיים.
#
#   bash scripts/ci_clean_demo.sh            (בתוך container כ-root; מקומית: docker run … debian:bookworm)
#
# שלבים: (1) חבילות מערכת בלבד; (2) מוודאים שהמכונה באמת «נקייה» — לפייתון של המערכת חסר fastapi;
# (3) ./demo.sh --check ⇒ חייב ליצור .venv ולעבור; (4) ריצה שנייה ⇒ חייבת לעבור מה-.venv הקיים בלי ליצור מחדש.
set -euo pipefail
cd "$(dirname "$0")/.."
export DEBIAN_FRONTEND=noninteractive SKIP_WEB=1
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq --no-install-recommends python3 python3-venv python3-pip python3-cryptography \
    curl ca-certificates >/dev/null
fi
SYS_PY="$(command -v python3)"
echo "▶ $(python3 --version) · $SYS_PY · cryptography של המערכת: $(python3 -c 'import cryptography;print(cryptography.__version__)' 2>/dev/null || echo —)"
if python3 -c 'import fastapi' 2>/dev/null; then
  echo "❌ המכונה לא נקייה: fastapi כבר מותקן לפייתון של המערכת — הבדיקה לא בודקת את מסלול ה-.venv" >&2; exit 1
fi
rm -rf .venv
echo "▶ ריצה 1: מכונה נקייה"
./demo.sh --check
[[ -x .venv/bin/python3 ]] || { echo "❌ demo.sh עבר בלי ליצור .venv — מסלול ההתקנה לא נבדק" >&2; exit 1; }
STAMP="$(stat -c %Y .venv/bin/python3)"
echo "▶ ריצה 2: .venv קיים"
OUT="$(./demo.sh --check 2>&1)" || { echo "$OUT"; exit 1; }
echo "$OUT" | tail -n 3
if echo "$OUT" | grep -q "יוצר סביבה מקומית"; then echo "❌ ריצה 2 יצרה .venv מחדש" >&2; exit 1; fi
[[ "$(stat -c %Y .venv/bin/python3)" == "$STAMP" ]] || { echo "❌ .venv הוחלף בריצה 2" >&2; exit 1; }
echo "✅ ההדגמה עוברת במכונה נקייה (פעמיים)"
