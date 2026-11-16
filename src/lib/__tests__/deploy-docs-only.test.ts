/**
 * ratchet — issue #553: דחיפת-מסמכים ל-main לא מפעילה פריסה לפרודקשן.
 *
 * הבאג: deploy.yml האזין ל-`push: branches: [main]` בלי סינון-נתיבים. ב-14.11
 * נדחפו 25 commits של `BRIDGE/room-updates/*.md` ישר ל-main ⇒ 10 ריצות-פריסה,
 * 3 פרסומים ל-gh-pages ו-build-ID חדש (לשוניות פתוחות קיבלו "גרסה חדשה")
 * — בלי שורת-קוד אחת.
 *
 * התיקון: `paths-ignore` למסמכים בלבד. השמירה כאן:
 *  1. המסמכים ברשימה (BRIDGE / knowledge / *.md).
 *  2. אף נתיב שנכנס ל-build (src / public / index.html / package*) לא ברשימה —
 *     אחרת שינוי-קוד אמיתי היה נשאר בלי פריסה.
 *  3. שום מקור-build לא מייבא מ-knowledge/ או BRIDGE/ (אחרת הדילוג מסוכן).
 *  4. הפריסה הידנית (workflow_dispatch) נשארת.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');
const yml = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');

/** רשימת paths-ignore מתחת ל-push (פרסור-שורות מינימלי, בלי תלות-YAML). */
function pathsIgnore(text: string): string[] {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^\s+paths-ignore:\s*$/.test(l));
  if (start < 0) return [];
  const out: string[] = [];
  for (const l of lines.slice(start + 1)) {
    const m = l.match(/^\s+-\s+'([^']+)'\s*$/);
    if (!m) break;
    out.push(m[1]);
  }
  return out;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|mjs|js|html)$/.test(name)) acc.push(p);
  }
  return acc;
}

describe('deploy.yml — מסמכים בלבד לא נפרסים (issue #553)', () => {
  const ignored = pathsIgnore(yml);

  it('paths-ignore קיים תחת push ל-main ומכסה BRIDGE/knowledge/*.md', () => {
    expect(yml).toMatch(/push:\s*\n\s+branches: \[main\]\s*\n(?:\s*#.*\n)*\s+paths-ignore:/);
    expect(ignored).toEqual(expect.arrayContaining(['BRIDGE/**', 'knowledge/**', '**/*.md']));
  });

  it('שום נתיב-build לא מדולג', () => {
    for (const g of ignored) {
      expect(g, g).not.toMatch(/^(src|public|scripts|functions)\b|index\.html|package|vite\.config|\*\*\/\*\*?$|^\*\*$/);
    }
  });

  it('מקורות-ה-build לא מייבאים מ-knowledge/ או BRIDGE/', () => {
    const files = [...walk(join(root, 'src')), join(root, 'vite.config.ts'), join(root, 'index.html')];
    const bad = files.filter((f) =>
      /(?:from\s+['"]|import\(\s*['"])[^'"]*(?:knowledge|BRIDGE)\//.test(readFileSync(f, 'utf8')),
    );
    expect(bad).toEqual([]);
  });

  it('אין קובץ .md ב-public (היה מתפרסם ונשאר בלי פריסה)', () => {
    const md = readdirSync(join(root, 'public'), { recursive: true })
      .map(String)
      .filter((n) => n.endsWith('.md'));
    expect(md).toEqual([]);
  });

  it('פריסה ידנית נשארת (workflow_dispatch)', () => {
    expect(yml).toMatch(/^\s+workflow_dispatch:/m);
  });
});
