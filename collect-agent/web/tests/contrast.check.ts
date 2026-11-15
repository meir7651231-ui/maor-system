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
  for (const fg of ['due-ink', 'late-ink', 'critical-ink', 'brand-700', 'ink-500'])
    for (const bg of ['white', 'cream', 'red-50']) {
      const r = ratio(fg, bg);
      assert.ok(r >= 4.5, `${fg} על ${bg} = ${r.toFixed(2)}:1`);
    }
});

test('גווני-המילוי due/late/critical אינם עוברים AA כטקסט — ולכן אסור text-due/late/critical בקוד', () => {
  for (const f of ['due', 'late', 'critical']) assert.ok(ratio(f, 'white') < 4.5, `${f} כבר עובר — אפשר לפשט`);
  const files: string[] = [];
  const walk = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(n)) files.push(p); } };
  walk(join(WEB, 'src'));
  const bad = files.flatMap(p => [...readFileSync(p, 'utf8').matchAll(/\btext-(due|late|critical)\b(?!-ink)/g)].map(m => `${p.replace(WEB, '')}: ${m[0]}`));
  assert.deepEqual(bad, [], 'טקסט בגוון-מילוי (השתמשו ב-*-ink)');
});
