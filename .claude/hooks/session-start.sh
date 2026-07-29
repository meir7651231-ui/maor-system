#!/bin/bash
# מאור החסד — אתחול סביבת עבודה לסשן Claude Code (רץ אוטומטית בתחילת כל סשן)
set -euo pipefail

REPO="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"

# רץ רק בסביבה מרוחקת (Claude Code on the web) — מקומית אין מה לאתחל
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$REPO"

# תלויות — npm install מנצל את ה-cache של הקונטיינר; מהיר כשהכול קיים
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund 2>&1 | tail -2
fi

echo ""
echo "════════════════════════════════════════"
echo "  מאור החסד — סביבה מוכנה"
echo "════════════════════════════════════════"
BRANCH=$(git branch --show-current 2>/dev/null || echo "לא ידוע")
if [[ "$BRANCH" == claude/* ]]; then
  echo "✅ ענף: $BRANCH"
else
  echo "⚠️  ענף: $BRANCH — עבודה רק על ענף claude/*"
fi
UNPUSHED=$(git rev-list "origin/$BRANCH..HEAD" --count 2>/dev/null || echo "0")
if [[ "$UNPUSHED" -gt 0 ]]; then
  echo "📦 $UNPUSHED שמירות ממתינות לדחיפה"
fi
echo "🔁 שרשרת אימות: npm run verify (typecheck + lint + test + build)"
echo "🎭 e2e: npm run e2e — ⚠️ חסום כרגע ע\"י מסך התחברות ענן (ראה CLAUDE.md)"
echo "════════════════════════════════════════"
