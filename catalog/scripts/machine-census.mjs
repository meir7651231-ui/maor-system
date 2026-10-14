#!/usr/bin/env node
/**
 * 🪞 מפקד המכונה עצמה (SELF, 14.10.2026) — כותב catalog/self/machine.json: החלקים של **הקוד של המכונה**
 * (catalog/lib · catalog/combiner · catalog/inner/lib · catalog/scripts), באותו פורמט-Part בדיוק.
 *
 * אותו מפקד: המחלץ של others-census (TypeScript compiler API — jsExtract) ואותו בונה-חלקים (buildParts: שם עברי,
 * טוהר טרנזיטיבי, דילוג על main/cli וכפולים). שום קוד לא מורץ כאן.
 *
 * למה ב-catalog/self ולא ב-catalog/sources: המכונה בודקת את עצמה — היא לא חומר למוצרים. מקור ב-sources נכנס לאינדקס
 * ולמצרף ומזיז את 990 הצרכים; כאן הוא רק נבדק (self-check.mjs) — אותו ארגז-חול, אותו זרע, אותם חוקים.
 *
 * ref = טביעת-תוכן של הקבצים שנקראו (לא sha של קומיט) ⇒ `--check` יציב בין קומיטים.
 *
 *   node catalog/scripts/machine-census.mjs           # כותב
 *   node catalog/scripts/machine-census.mjs --check   # יציאה 1 אם לא מעודכן
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsExtract, buildParts } from './others-census.mjs';
import { validateSource } from '../lib/check.mjs';
import { hashOf } from '../inner/lib/ensure-gen.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');
export const MACHINE_DIRS = ['catalog/lib', 'catalog/combiner', 'catalog/inner/lib', 'catalog/scripts', 'catalog/self'];
export const OUT = 'catalog/self/machine.json';

/** קובצי-הקוד של המכונה (בלי עובדים ו-cli: הם רק מריצים; בלי shots — דפדפן). ממוינים. */
export function machineFiles(root = ROOT) {
  const out = [];
  for (const d of MACHINE_DIRS) {
    if (!fs.existsSync(path.join(root, d))) continue;
    for (const f of fs.readdirSync(path.join(root, d)).sort()) {
      if (!f.endsWith('.mjs') || /worker|^cli\.mjs$|^shots\.mjs$|^vitest-setup\.mjs$/.test(f)) continue;
      out.push(d + '/' + f);
    }
  }
  return out.sort();
}

export function machineDoc(root = ROOT) {
  const files = machineFiles(root);
  const mods = jsExtract(root, files).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const cfg = { source: 'machine', repo: 'meir7651231-ui/maor-system', keepImpure: [] };
  const { parts } = buildParts({ cfg, mods });
  const ref = 'catalog@' + hashOf(files.map((f) => f + '\0' + fs.readFileSync(path.join(root, f), 'utf8')).join('\0')).slice(0, 12);
  // החוזה: שם בלי אותיות לטיניות, type תמיד מחרוזת (JS בלי טיפוסים ⇒ unknown — "עדיף unknown אמיתי על ניחוש")
  const heName = (n) => { const w = n.replace(/[A-Za-z][\w.]*/g, ' ').replace(/\s+/g, ' ').trim(); return w.split(' ').length > 1 ? w : (w || 'לחשב') + ' ערך'; };
  const KIND = /^(span|amount|number|times|date|sequence|list|waiting|text|bool|geo|image|sound|file|choice|ui|unknown|record:[a-z][A-Za-z0-9]*)$/;
  const ty = (t) => ({ ...t, kind: KIND.test(t.kind) ? t.kind : 'unknown', type: t.type ?? 'unknown' });
  return {
    source: 'machine', repo: cfg.repo, ref, generatedAt: null,
    parts: parts.map((p) => ({ ...p, lang: 'js', name: heName(p.name), takes: p.takes.map(ty), gives: ty(p.gives) })),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const doc = machineDoc();
  const v = validateSource(doc);
  if (v.length) { console.error('✗ החוזה:', v.slice(0, 5)); process.exit(1); }
  const text = JSON.stringify(doc, null, 1) + '\n';
  const abs = path.join(ROOT, OUT);
  if (CHECK) {
    if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text) { console.error('✗ ' + OUT + ' לא מעודכן — הרץ: node catalog/scripts/machine-census.mjs'); process.exit(1); }
    console.log('✓ machine מעודכן · ' + doc.parts.length + ' חלקים');
  } else {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
    console.log('✓ ' + OUT + ' · ' + doc.parts.length + ' חלקים (' + doc.parts.filter((p) => p.pure).length + ' טהורים) מ-' + machineFiles().length + ' קבצים');
  }
}
