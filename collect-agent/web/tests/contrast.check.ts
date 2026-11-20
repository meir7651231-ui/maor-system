// ניגודיות AA לתגיות-סטטוס ולטקסט בצבעי-סטטוס — מחושבת מה-tokens עצמם (tokens.css + פלטת Tailwind), לא מצילום.
// נכשלת אם: תגית סטטוס (StatusBadge) <4.5:1 · טקסט *-ink <4.5:1 על לבן/שמנת · מישהו כותב text-due/late/critical
// (גוון-מילוי) במקום *-ink · סטטוס חדש ב-STATUS בלי שנבדק כאן.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WEB = new URL('..', import.meta.url).pathname;
const css = readFileSync(join(WEB, 'src/brand/tokens.css'), 'utf8') + readFileSync(join(WEB, 'node_modules/tailwindcss/theme.css'), 'utf8');
const token = (name: string): string => {
  if (name === 'white') return '#ffffff';
  const m = css.match(new RegExp(`--color-${name}:\\s*([^;]+);`));
  assert.ok(m, `token חסר: --color-${name}`);
  return m![1].trim();
};
// oklch → sRGB (CSS Color 4)
const oklch = (L: number, C: number, H: number): number[] => {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return lin.map(v => Math.min(1, Math.max(0, v)));              // ליניארי, חתוך לטווח
};
const linear = (v: string): number[] => {
  const o = v.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/);
  if (o) return oklch(+o[1] / 100, +o[2], +o[3]);
  const h = v.match(/^#([0-9a-f]{6})$/i); assert.ok(h, `צבע לא נתמך: ${v}`);
  return [0, 2, 4].map(i => { const c = parseInt(h![1].slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
};
const lum = (name: string) => { const [r, g, b] = linear(token(name)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (fg: string, bg: string) => { const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };

test('כל תגית ב-StatusBadge עוברת AA (טקסט קטן מודגש ⇒ 4.5:1)', () => {
  const ui = readFileSync(join(WEB, 'src/components/ui.tsx'), 'utf8');
  const block = ui.match(/const STATUS[\s\S]*?\n\};/)![0];
  const rows = [...block.matchAll(/(\w+): \['([^']+)', 'bg-([\w-]+) text-([\w-]+)/g)];
  assert.ok(rows.length >= 5, 'לא נמצאו שורות STATUS');
  for (const [, key, label, bg, fg] of rows) {
    const r = ratio(fg, bg);
    assert.ok(r >= 4.5, `${key} «${label}»: ${fg} על ${bg} = ${r.toFixed(2)}:1 < 4.5`);
  }
});

test('טקסט בצבעי-סטטוס (*-ink) עובר AA על לבן ועל שמנת', () => {
  for (const fg of ['due-ink', 'late-ink', 'critical-ink', 'info-ink', 'brand-700', 'ink-500'])
    for (const bg of ['white', 'cream', 'red-50']) {
      const r = ratio(fg, bg);
      assert.ok(r >= 4.5, `${fg} על ${bg} = ${r.toFixed(2)}:1`);
    }
});

test('גווני-המילוי due/late/critical/info אינם עוברים AA כטקסט — ולכן אסור text-due/late/critical/info בקוד', () => {
  for (const f of ['due', 'late', 'critical', 'info']) assert.ok(ratio(f, 'white') < 4.5, `${f} כבר עובר — אפשר לפשט`);
  const files: string[] = [];
  const walk = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(n)) files.push(p); } };
  walk(join(WEB, 'src'));
  const bad = files.flatMap(p => [...readFileSync(p, 'utf8').matchAll(/\btext-(due|late|critical|info)\b(?!-ink)/g)].map(m => `${p.replace(WEB, '')}: ${m[0]}`));
  assert.deepEqual(bad, [], 'טקסט בגוון-מילוי (השתמשו ב-*-ink)');
});

test('באנר פקיעת לוח החגים: כל צירוף טקסט/רקע במחלקות הרכיב ≥4.5:1', () => {
  const src = readFileSync(join(WEB, 'src/components/HolidayBanner.tsx'), 'utf8');
  for (const bg of ['amber-50', 'red-50']) assert.ok(src.includes(`bg-${bg}`), `הרכיב לא משתמש ב-bg-${bg}`);
  for (const fg of ['ink-900', 'due-ink', 'critical-ink']) assert.ok(src.includes(`text-${fg}`), `הרכיב לא משתמש ב-text-${fg}`);
  for (const [fg, bg] of [['ink-900', 'amber-50'], ['due-ink', 'amber-50'], ['ink-900', 'red-50'], ['critical-ink', 'red-50']]) {
    const r = ratio(fg, bg);
    assert.ok(r >= 4.5, `${fg} על ${bg} = ${r.toFixed(2)}:1`);
  }
  assert.doesNotMatch(src, /text-(amber|orange|red)-[3-5]00\b/, 'גוון טקסט בהיר מדי בבאנר');
});

// גבי עיצוב: משטחים שמופיעים רק במצבים מסוימים (שחזור מגיבוי, DSR, התראות, באנרים) לא נראים בסריקת הדפדפן
// של הדמו ⇒ סריקה סטטית: כל bg-X + text-Y באותו className (בלי וריאנטים hover:/sm:) בכל src/**/*.tsx ≥4.5:1.
const COLOR = '(?:[a-z]+-(?:50|100|200|300|400|500|600|700|800|900|950)|brand|cream|white|paid|due|late|critical|info|(?:due|late|critical)-ink|ink-\\d+|brand-\\d+)';
export function staticPairs(src: string): { fg: string; bg: string; r: number; cls: string }[] {
  const out: { fg: string; bg: string; r: number; cls: string }[] = [];
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const cls = m[1] ?? m[2], c = cls.split(/\s+/).filter(x => !x.includes(':'));
    const pick = (p: string) => c.map(x => x.match(new RegExp(`^${p}-(${COLOR})$`))?.[1]).filter((x): x is string => !!x);
    for (const bg of pick('bg')) for (const fg of pick('text')) {
      let r: number; try { r = ratio(fg, bg); } catch { continue; }   // צבע שאינו token (למשל text-white/80) ⇒ לא נבדק
      out.push({ fg, bg, r, cls });
    }
  }
  return out;
}

test('סריקה סטטית: כל bg/text באותו className ב-src עוברים AA (כולל משטחים מותנים)', () => {
  const files: string[] = [];
  const walk = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.tsx')) files.push(p); } };
  walk(join(WEB, 'src'));
  const all = files.flatMap(f => staticPairs(readFileSync(f, 'utf8')).map(x => ({ ...x, f: f.replace(WEB, '') })));
  assert.ok(all.length >= 40, `נבדקו רק ${all.length} צירופים — הסריקה לא רצה?`);
  const bad = all.filter(x => x.r < 4.5).map(x => `${x.f}: text-${x.fg} על bg-${x.bg} = ${x.r.toFixed(2)}`);
  assert.deepEqual(bad, []);
  // הסורק עצמו תופס הפרה (מוטציה): אפור בהיר על לבן, ירוק-מילוי על שמנת
  const planted = staticPairs('<p className="bg-white text-ink-400 p-2">x</p><b className={`bg-cream text-brand ${y}`}>y</b>');
  assert.deepEqual(planted.filter(x => x.r < 4.5).map(x => x.fg), ['ink-400', 'brand']);
});
