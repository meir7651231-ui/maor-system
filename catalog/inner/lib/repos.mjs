/**
 * 🔓 איפה כל ריפו ואילו קבצים פותחים (INNER, 14.10.2026).
 * אורביט = הריפו הזה. השאר = שכפולי-קריאה ב-../catsrc (אותו מקום כמו של קורא-ההתנהגות), ב-ref של המפקד.
 * הפותח עובר על **כל** קובצי ה-JS/TS של הריפו (לא רק אלה שבקטלוג): ערך פנימי יכול להסתתר גם ברכיב-מסך
 * שהקטלוג לא מנה. ההורה של חלק כזה מסומן `parent:uncataloged`.
 */
import fs from 'node:fs';
import path from 'node:path';

/** source ⇒ { catalog: שם קובץ-המקור בקטלוג, dir: תיקייה ב-catsrc (null = הריפו הזה), roots: תיקיות-שורש לסריקה } */
export const REPOS = {
  orbit: { catalog: 'orbit', dir: null, roots: ['src', 'telephony', 'functions'] },
  buildsmart: { catalog: 'buildsmart', dir: 'buildsmart', roots: ['.'] },
  generator: { catalog: 'generator', dir: 'generator', roots: ['.'] },
  '14kk': { catalog: '14kk', dir: '14kk', roots: ['.'] },
  mmmm: { catalog: 'mmmm', dir: 'mmmm', roots: ['.'] },
  'yoman-habina': { catalog: 'yoman-habina', dir: 'yoman', roots: ['.'] },
  yeshiva: { catalog: 'yeshiva', dir: 'yeshiva', roots: ['.'] },
};
export const ORDER = Object.keys(REPOS);

const EXT = /\.(ts|tsx|mts|js|mjs|jsx)$/;
const SKIP_DIR = /^(node_modules|dist|build|coverage|\.git|\.next|out|vendor|__tests__|__mocks__|generated|\.cache|tmp|public)$/;
const SKIP_FILE = /\.(test|spec)\.|\.d\.ts$|\.min\.js$|(^|\/)(vite|vitest|eslint|tailwind|postcss|playwright|jest|babel|webpack|rollup)\.config\./;
const MAX_BYTES = 300_000;

/** כל קובצי-המקור (יחסיים, ממוינים) — דטרמיניסטי. */
export function sourceFiles(base, roots) {
  const out = [];
  const walk = (rel) => {
    const abs = path.join(base, rel);
    let ents;
    try { ents = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
    for (const e of ents.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const r = rel === '.' ? e.name : path.posix.join(rel, e.name);
      if (e.isDirectory()) { if (!SKIP_DIR.test(e.name)) walk(r); continue; }
      if (!e.isFile() || !EXT.test(e.name) || SKIP_FILE.test(r)) continue;
      try { if (fs.statSync(path.join(base, r)).size > MAX_BYTES) continue; } catch { continue; }
      out.push(r);
    }
  };
  for (const root of roots) walk(root);
  return [...new Set(out)].sort();
}
