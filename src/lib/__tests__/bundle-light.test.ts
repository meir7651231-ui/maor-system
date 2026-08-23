/**
 * ⚡ ratchet — הקלת-הבנדל (VISION-LIGHT ‏#1, 23.8.2026).
 *
 * הבאג: שני import-ים סטטיים "תמימים" (OrgSecretsSection ⇒ lib/cloudConfig,
 * ‏IcsFeedModal ⇒ lib/icsFeed) גררו את **כל Firebase** ‏(Firestore+Auth,
 * ‏~190KB gzip) לבנדל הראשי של כל לקוח — כולל לקוחות local-first בלי ענן.
 * התיקון: ייבוא דינמי (import()) ⇒ ‏Firebase חי ב-chunk עצל שנטען רק בשימוש;
 * הבנדל הראשי ירד ‏688⇒498KB gzip.
 *
 * הנעילה כאן — סריקת-מקור על כל src/: ייבוא-ערך סטטי של firebase/* או של
 * מודולי-הענן מותר **רק** בתוך אשכול-הענן עצמו. ‏import type = חינם ומותר.
 * (התקרה המספרית נאכפת ב-scripts/bundle-budget.mjs שרץ postbuild.)
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** אשכול-הענן — הקבצים היחידים שמותר להם לגעת ב-firebase/מודולי-ענן סטטית. */
const CLOUD_CLUSTER = new Set([
  'src/lib/cloud.ts',
  'src/lib/cloudConfig.ts',
  'src/lib/icsFeed.ts',
  'src/lib/appCheck.ts',
  'src/store/cloudSync.ts',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === '__tests__' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

describe('⚡ bundle-light — Firebase מחוץ לבנדל הראשי', () => {
  it('אין ייבוא-ערך סטטי של firebase/מודולי-ענן מחוץ לאשכול-הענן', () => {
    const offenders: string[] = [];
    for (const file of walk('src')) {
      const rel = file.replace(/\\/g, '/');
      if (CLOUD_CLUSTER.has(rel)) continue;
      const src = readFileSync(file, 'utf8');
      for (const line of src.split('\n')) {
        const t = line.trim();
        // רק הצהרות ייבוא/ייצוא סטטיות; import('...') דינמי לא נתפס כאן במכוון
        if (!t.startsWith('import ') && !t.startsWith('export ')) continue;
        if (t.startsWith('import type ') || t.startsWith('export type ')) continue; // נמחק בקומפילציה
        if (
          /from\s+['"]firebase\//.test(t) ||
          /from\s+['"][^'"]*\/lib\/cloud['"]/.test(t) ||
          /from\s+['"][^'"]*\/lib\/cloudConfig['"]/.test(t) ||
          /from\s+['"][^'"]*\/lib\/icsFeed['"]/.test(t) ||
          /from\s+['"][^'"]*\/store\/cloudSync['"]/.test(t)
        ) {
          offenders.push(rel + ' ⇒ ' + t);
        }
      }
    }
    expect(offenders, 'ייבוא סטטי שמחזיר את Firebase לבנדל הראשי — המירו ל-import() דינמי').toEqual([]);
  });

  it('שני המדליפים ההיסטוריים תוקנו — ייבוא דינמי בפועל', () => {
    const secrets = readFileSync('src/components/settings/OrgSecretsSection.tsx', 'utf8');
    expect(secrets).toContain("import type { OrgSecretKey } from '../../lib/cloudConfig'");
    expect(secrets).toContain("import('../../lib/cloudConfig')");
    const ics = readFileSync('src/components/calendar/IcsFeedModal.tsx', 'utf8');
    expect(ics).toContain("await import('../../lib/icsFeed')");
    expect(ics).not.toMatch(/^import \{[^}]*publishIcsFeed/m);
  });

  it('שער-התקציב מחווט: postbuild מריץ את bundle-budget עם תקרה יורדת-בלבד', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
    expect(pkg.scripts.postbuild).toBe('node scripts/bundle-budget.mjs');
    const budget = readFileSync('scripts/bundle-budget.mjs', 'utf8');
    const m = /ENTRY_GZIP_BUDGET = ([\d_]+)/.exec(budget);
    expect(m).not.toBeNull();
    // ratchet: התקרה לעולם לא עולה מעל נקודת-הפתיחה (520KB); הקטנה = מותרת ורצויה
    expect(Number(m![1].replace(/_/g, ''))).toBeLessThanOrEqual(520_000);
  });
});
