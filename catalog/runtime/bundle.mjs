#!/usr/bin/env node
/**
 * 📦 חבילת-מוצר (PRODUCT, 14.10.2026) — ההרכבה של מילה ⇒ קובץ סטטי אחד שהדף מייבא.
 *
 * לכל מוצר ב-PRODUCTS: המכונה מרכיבה את המילה (manifest.mjs), ו-rolldown אורז **רק** את החלקים שההרכבה בחרה —
 * מהקוד המקורי (הליבות ב-catalog/core, קבצי-המקור של אורביט, המודולים הפנימיים מ-catalog/inner/gen) — יחד עם
 * זמן-הריצה (runtime.mjs) ועם המניפסט עצמו. כך לדף אין תלות-ריצה בקבצים שלא בגיט (gen/ נוצר לפי דרישה).
 *
 *   node catalog/runtime/bundle.mjs            # כותב catalog/products/<id>/{assembly.json, parts.bundle.mjs}
 *   node catalog/runtime/bundle.mjs --check    # יציאה 1 אם לא מעודכן
 *
 * הייצוא של החבילה: `ASSEMBLY` (המניפסט) · `PARTS` (מזהה-חלק ⇒ פונקציה) · `makeRuntime` · `runtime()` = makeRuntime(ASSEMBLY, PARTS).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

const SUM = 'inner-orbit:src/lib/atoms/verify/generic.ts#waitingLines.sum:step';
const GAP = 'inner-orbit:src/components/wheel/CourseWheel.tsx#CourseWheel.spin.delta:step';
const PCT = 'inner-orbit:src/components/wall/wallData.ts#buildWallData.retention:step';
const MAX = 'inner-orbit:src/components/hosting/StaffModals.tsx#StaffDialog.maxL:step';
/**
 * המוצרים: מזהה-תיקייה ⇒ המילה במילון-המטרות, ו"כלי-המדידה" של המסך (PRODUCT-V2) — חלקים מוכחים שנבחרו ביד לכל מספר
 * שמוצג (סכום, הפרש, אחוז, הגדול-מבין). manifest.mjs › extraOf בודק שכל אחד מוכח לתפקיד שלו.
 */
export const PRODUCTS = [{
  id: 'distribution', word: 'מוקד-חלוקה', extras: [
    { key: 'sum', part: SUM, role: 'sum', says: 'סך הק״מ, סך הדקות' },
    { key: 'gap', part: GAP, role: 'gap', says: 'כמה ק״מ נחסכו (לפני פחות אחרי) · כמה הגיעו בזמן (הכול פחות המאחרים)' },
    { key: 'pct', part: PCT, role: 'ratio', says: 'אחוז החיסכון · אחוז בזמן' },
    { key: 'max', part: MAX, role: 'extreme', says: 'העומס הגדול ביותר (קנה-המידה של פסי-העומס)' },
  ],
}];

/** טקסט-המניפסט (קנוני: JSON.stringify(…, null, 1) + שורה ריקה). */
export async function assemblyText(word, extras = []) {
  await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true });
  const { productManifest } = await import('./manifest.mjs');
  return JSON.stringify(productManifest(word, extras), null, 1) + '\n';
}

/** אורז: נקודת-כניסה וירטואלית שמייבאת כל חלק בשמו, ומייצאת PARTS + ASSEMBLY + זמן-הריצה. */
export async function bundleText(assembly) {
  const { rolldown } = await import('rolldown');
  const steps = [...new Map([...assembly.needs.flatMap((n) => n.steps), ...(assembly.extras || [])].map((s) => [s.key, s])).values()];
  const lines = ["export { makeRuntime, makeExtras, needFunction } from './catalog/runtime/runtime.mjs';", "import { makeRuntime, makeExtras } from './catalog/runtime/runtime.mjs';"];
  steps.forEach((s, k) => lines.push('import { ' + s.export + ' as p' + k + " } from './" + s.module + "';"));
  lines.push('export const PARTS = {');
  steps.forEach((s, k) => lines.push('  ' + JSON.stringify(s.key) + ': p' + k + ','));
  lines.push('};');
  lines.push('export const ASSEMBLY = ' + JSON.stringify(assembly) + ';');
  lines.push('export const runtime = () => makeRuntime(ASSEMBLY, PARTS);');
  lines.push('export const extras = () => makeExtras(ASSEMBLY, PARTS);');
  const ENTRY = path.join(ROOT, '__product_entry__.mjs');
  const b = await rolldown({
    input: ENTRY, cwd: ROOT, platform: 'browser', logLevel: 'silent', treeshake: true,
    plugins: [{ name: 'product-entry', resolveId: (id) => (id === ENTRY ? ENTRY : null), load: (id) => (id === ENTRY ? lines.join('\n') + '\n' : null) }],
    resolve: { extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.json'] },
  });
  try {
    const { output } = await b.generate({ format: 'esm', codeSplitting: false });
    const head = '// 📦 נוצר אוטומטית ע"י catalog/runtime/bundle.mjs מתוך ההרכבה של «' + assembly.word + '» — לא לערוך ביד.\n'
      + '// כל פונקציה כאן היא החלק המוכח עצמו, מהקוד המקורי (הליבות · אורביט · החלקים הפנימיים); זמן-הריצה רק מחבר.\n';
    return head + output[0].code;
  } finally {
    await b.close();
  }
}

if (process.argv[1] && process.argv[1].endsWith('bundle.mjs')) {
  const CHECK = process.argv.includes('--check');
  let stale = false;
  for (const p of PRODUCTS) {
    const dir = path.join(ROOT, 'catalog/products', p.id);
    const aText = await assemblyText(p.word, p.extras);
    const bText = await bundleText(JSON.parse(aText));
    const files = { 'assembly.json': aText, 'parts.bundle.mjs': bText };
    for (const [f, t] of Object.entries(files)) {
      const abs = path.join(dir, f);
      const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
      if (cur === t) continue;
      if (CHECK) { console.error('✗ catalog/products/' + p.id + '/' + f + ' לא מעודכן — הריצו node catalog/runtime/bundle.mjs'); stale = true; continue; }
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(abs, t);
    }
    const a = JSON.parse(aText);
    console.log('📦 ' + p.id + ' «' + p.word + '» · ' + a.counts.needs + ' צרכים (✅ ' + a.counts.proven + ' · פנימי ' + a.counts.inner + ' · 🧩 ' + a.counts.combo + ' · פתוח ' + a.counts.open + ') · ' + Math.round(bText.length / 1024) + 'KB');
  }
  if (stale) process.exit(1);
}
