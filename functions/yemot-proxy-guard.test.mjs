/**
 * ratchet — סגירת-חשיפה (12.10.2026). שני באגים, נעולים ברמת-המקור:
 * 1. yemotProxy לא בדק מי קורא לו (CORS ‏*) ⇒ כל אחד באינטרנט יכל להפעיל פעולות
 *    בימות-המשיח עם הטוקן של הארגון. עכשיו: Bearer ID-token של מייל-על/מנהל/חבר.
 * 2. deploy-functions.yml (יעדי solapeek/solarun) הדפיס את גוף-התשובה של solaPull —
 *    כולל שמות/טלפונים/מיילים של תורמים — ליומני-ההרצה של ריפו ציבורי.
 *    עכשיו מודפס רק המבנה (shape), ויומני-הפונקציות רק זמן·חומרה·שם.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');

describe('🛡 ratchet — yemotProxy מאומת + יומני-CI בלי פרטי-תורמים', () => {
  const index = read('index.js');
  const start = index.indexOf('exports.yemotProxy');
  const proxy = index.slice(start, index.indexOf('\n});', start));

  it('yemotProxy בודק את הקורא לפני כל שימוש בטוקן', () => {
    expect(start).toBeGreaterThan(-1);
    const gate = proxy.indexOf('await yemotCallerOk(req, org)');
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(proxy.indexOf('orgSecretsOf('));
    expect(gate).toBeLessThan(proxy.indexOf('YEMOT_TOKEN ||'));
    expect(proxy).toContain("res.status(403)");
  });

  it('האימות הוא ID-token אמיתי, ובלי org (הטוקן הגלובלי) — מיילי-על בלבד', () => {
    const helper = index.slice(index.indexOf('async function yemotCallerOk'), start);
    expect(helper).toContain('getAuth().verifyIdToken(');
    expect(helper).toContain('if (!org) return false;');
    expect(helper).toContain("platformOrgs/");
  });

  it('הקורא לא יכול לדרוס את פרמטר-הטוקן', () => {
    expect(proxy).toContain("k !== 'token'");
  });

  it('deploy-functions.yml לא מדפיס גוף-תשובה של solaPull ולא תוכן-יומנים', () => {
    const wf = read('../.github/workflows/deploy-functions.yml');
    const curls = wf.split('\n').filter((l) => l.includes('cloudfunctions.net/solaPull'));
    expect(curls.length).toBeGreaterThan(0);
    for (const l of curls) {
      expect(l).not.toContain('head -c');
      expect(l.trim().endsWith('| shape')).toBe(true);
    }
    expect(wf).toContain("awk '{print $1, $2, $3}'");
  });
});
