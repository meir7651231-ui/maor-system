#!/usr/bin/env node
/** מחצב · שומר-הסחף — המחצבה חיה: אם ריפו-מקור זז מאז המפקד, מתריעים
 *  כמה קומיטים חדשים לא-רשומים נוספו. סחף = exit 1 (להריץ run.mjs מחדש). */
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const R = new URL('./registry/', import.meta.url).pathname;
let drift = 0;
for (const f of fs.readdirSync(R).filter(f => f.startsWith('census-'))) {
  const c = JSON.parse(fs.readFileSync(R + f));
  if (!c.head) { console.log(`· ${c.repo}: מפקד ישן בלי חותמת-HEAD — ירוענן בריצה הבאה`); continue; }
  let now = null, count = 0;
  try {
    now = execSync(`git -C ${JSON.stringify(c.root)} rev-parse HEAD`).toString().trim();
    if (now !== c.head) count = +execSync(`git -C ${JSON.stringify(c.root)} rev-list --count ${c.head}..HEAD`).toString().trim();
  } catch { console.log(`· ${c.repo}: לא נגיש לבדיקת-סחף`); continue; }
  if (now === c.head) console.log(`✓ ${c.repo}: המחצבה במקום (${c.head.slice(0,8)})`);
  else { console.error(`🚨 סחף ב-${c.repo}: ‏${count} קומיטים חדשים מאז המפקד — קוד חדש לא-רשום! הרץ run.mjs`); drift = 1; }
}
process.exit(drift);
