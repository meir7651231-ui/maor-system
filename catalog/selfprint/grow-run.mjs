#!/usr/bin/env node
/**
 * 🌱 ריצת-צמיחה אחת של GROW3 (mode score, הקוד של catalog/grow/grow.mjs כמו שהוא — בלי שינוי) בתקציב נתון,
 * בתהליך נפרד: הצמיחה טוענת את catalog/blueprints/search.mjs (ודרכו את shapes.mjs — לא משתמשת בהם), ולכן היא רצה
 * כאן ולא בתהליך של מנוע-השרטוטים-העצמי (שחוסם את הטעינה הזו). הפלט: המדף + המדדים, ל-JSON.
 *
 *   GROW_BUDGET=<קובץ-תקציב> node catalog/selfprint/grow-run.mjs <פלט.json>
 */
import fs from 'node:fs';
const out = process.argv[2];
if (!process.env.GROW_BUDGET || !out) { console.error('GROW_BUDGET=<קובץ> node grow-run.mjs <פלט.json>'); process.exit(2); }
const { grow } = await import('../grow/grow.mjs');
const r = await grow({ mode: 'score', log: (s) => console.error(s) });
fs.writeFileSync(out, JSON.stringify({ metrics: r.metrics, shelfFiles: r.shelfFiles }));
console.error('✓ ' + out);
