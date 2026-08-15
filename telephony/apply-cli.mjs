#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// telephony · apply-cli — **הוצא-משימוש (נחיל-9).**
//
// היסטורית זה היה כלי-החלה עצמאי, אך הוא התפצל מ-`tel.mjs apply` וצבר סחף מסוכן:
//   · בנה **בלי anchorDate** ⇒ סגירות-חג/זמנים נעלמו בשקט (המרכזייה עונה ביום-כיפור).
//   · חסר **4 שערי-בטיחות** שקיימים ב-`tel.mjs apply`: auditRoutes (ניתוב-יתום),
//     crossTenantLeakScan (דליפת-סוד חוצה-דייר), secretPreflight (שער-דומם),
//     ו-migrationRisk pre-pass אטומי (שינוי-הרסני על לקוח-חי).
//   · הפירוק (prune) לא סימן reloadxml.
//
// כדי שלא ייווצר סחף עתידי (שני מסלולי-החלה שמתפצלים), הכלי **מנתב ל-`tel.mjs apply`** —
// מקור-האמת היחיד להחלה. הארגומנטים תואמים (`<tenantsDir> <configRoot> [--write] [--prune]
// [--anchor YYYY-MM-DD] [--strict-secrets] [--allow-destructive]`). pure-downstream נשמר.
// ─────────────────────────────────────────────────────────────────────────────

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
console.error('⚠️  apply-cli הוצא-משימוש — מריץ דרך "tel.mjs apply" (כולל הזרקת-anchor + 4 שערי-בטיחות).');
const r = spawnSync(process.execPath, [join(here, 'tel.mjs'), 'apply', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status == null ? 1 : r.status);
