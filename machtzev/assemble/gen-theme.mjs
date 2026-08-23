#!/usr/bin/env node
/** מחצב · מחולל קופסת-הערכה — פיגמנטים טהורים (אטום) + חיווט תפקיד⇒פיגמנט (קופסה).
 *  קירוב v1: ערך-ראשון=אור, ערך-אחרון-שונה=חושך (הקשר-סלקטור מלא — בגל הבא). */
import fs from 'node:fs';
const atoms = JSON.parse(fs.readFileSync(new URL('../registry/atoms-L0-maor.json', import.meta.url)));
const colors = atoms.filter(a => a.kind === 'color' && a.values.some(v => /^#|^rgb|^hsl|^oklch/.test(v.value)));
const pig = new Map(); // ערך ⇒ מזהה-פיגמנט
const keyOf = v => { const k = 'p_' + v.toLowerCase().replace(/[^a-z0-9]/g, ''); if (!pig.has(v.toLowerCase())) pig.set(v.toLowerCase(), k); return pig.get(v.toLowerCase()); };
const wiring = { light: {}, dark: {} };
for (const a of colors) {
  const lits = a.values.map(v => v.value).filter(v => /^#|^rgb|^hsl|^oklch/.test(v));
  if (!lits.length) continue;
  wiring.light[a.name] = keyOf(lits[0]);
  wiring.dark[a.name] = keyOf(lits[lits.length - 1]);
}
const palette = Object.fromEntries([...pig.entries()].map(([v, k]) => [k, v]));
fs.writeFileSync(new URL('../new/atoms/palette.mjs', import.meta.url),
`/** אטום · פלטה — פיגמנטים טהורים בלבד. אפס ידע-תפקיד (חוק-5). חוזה: palette.contract.md
 *  חולץ מ-atoms-L0-maor (‏${Object.keys(palette).length} ערכים ייחודיים מ-${colors.length} תפקידים). */
export const PALETTE = ${JSON.stringify(palette, null, 1)};
`);
fs.writeFileSync(new URL('../new/boxes/theme.mjs', import.meta.url),
`/** קופסת-חיבורים · ערכה — מחווטת תפקיד⇒פיגמנט. חוזה: theme.contract.md
 *  התפקידים חיים כאן (שקעים), לא באטומים. מצב-לילה = תוכנית-חיווט שנייה. */
import { PALETTE } from '../atoms/palette.mjs';

export const WIRING = ${JSON.stringify(wiring, null, 1)};

/** מרכיב CSS מלא למצב נתון; overrides = כפתור-הצבע: { pigmentKey: ערך-חדש }. */
export function cssFor(mode, overrides = {}) {
  const plan = WIRING[mode];
  if (!plan) throw new Error('מצב לא-מוכר: ' + mode);
  const pal = { ...PALETTE, ...overrides };
  const missing = Object.values(plan).filter(k => !(k in pal));
  if (missing.length) throw new Error('חיווט לפיגמנט-לא-קיים: ' + missing.join(','));
  return ':root {\\n' + Object.entries(plan).map(([role, k]) => '  ' + role + ': ' + pal[k] + ';').join('\\n') + '\\n}';
}
`);
console.log(`פלטה: ${Object.keys(palette).length} פיגמנטים · חיווט: ${Object.keys(wiring.light).length} תפקידים × 2 מצבים`);
