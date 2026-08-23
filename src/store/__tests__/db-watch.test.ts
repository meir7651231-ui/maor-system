/**
 * ⚡ ratchet — מנוי-DB ממוקד (VISION-LIGHT ‏#14, 23.8.2026).
 *
 * הבאג: ‏72 מנויי `useApp((s) => s.db)` — כל שינוי-DB (כולל כתיבת-audit של
 * פעולה במסך אחר) רינדר-מחדש את המסך הפתוח כולו. התיקון: ‏useDbWatch —
 * אותו db מלא, השוואה רק על מפתחות-הצפייה; ‏17 רכיבים "צרים-טהורים" הומרו.
 *
 * שתי נעילות:
 * 1) הקפאה-יורדת: מספר המנויים-המלאים לא עולה (רכיב חדש = useDbWatch או
 *    סלקטור צר; מנוי-מלא נשאר לגיטימי רק למסכים שמזינים מנוע-שלם).
 * 2) שלמות-אוטומטית לכל קובץ שמשתמש ב-useDbWatch (גם עתידיים):
 *    · כל `db.<key>` שנקרא ⊆ רשימת-הצפייה (מפתח חסר = UI-עומד-בשקט!)
 *    · אין `db` חשוף (העברת ה-DB השלם לפונקציה עוקפת את הצפייה)
 *    · אין גישה דינמית `db[...]` (לא ניתנת לאימות סטטי)
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** תקרת המנויים-המלאים — יורדת-בלבד (הייתה 72 לפני ההמרה). */
const FULL_SUB_CAP = 56;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === '__tests__' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

describe('⚡ db-watch — מנוי-DB ממוקד', () => {
  const files = walk('src');

  it('הקפאה-יורדת: מנויי-DB-מלאים ≤ ' + FULL_SUB_CAP, () => {
    let n = 0;
    for (const f of files) n += (readFileSync(f, 'utf8').match(/useApp\(\(s\) => s\.db\)/g) ?? []).length;
    expect(n, 'נוסף מנוי-DB-מלא חדש — השתמשו ב-useDbWatch או בסלקטור צר').toBeLessThanOrEqual(FULL_SUB_CAP);
  });

  it('שלמות-הצפייה: כל קובץ-useDbWatch רושם כל מפתח שהוא קורא, בלי db חשוף', () => {
    const problems: string[] = [];
    let converted = 0;
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      const call = /useDbWatch\(([^)]*)\)/.exec(src);
      if (!call || f.endsWith('dbWatch.ts')) continue;
      converted++;
      const watched = new Set([...call[1].matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
      // כל db.<key> חייב להיות ברשימת-הצפייה
      for (const m of src.matchAll(/\bdb\.([A-Za-z0-9_]+)/g)) {
        if (!watched.has(m[1])) problems.push(f + ' ⇒ קורא db.' + m[1] + ' שאינו נצפה');
      }
      // גישה דינמית — לא ניתנת לאימות
      if (/\bdb\[/.test(src)) problems.push(f + ' ⇒ גישה דינמית db[...]');
      // db חשוף (מועבר הלאה) — אחרי הסרת ההצהרה והגישות-הנקודתיות
      const stripped = src
        .replace(/useDbWatch\([^)]*\)/g, '')
        .replace(/\bdb\.[A-Za-z0-9_]+/g, '')
        .replace(/\bconst db =/g, '');
      if (/\bdb\b/.test(stripped)) problems.push(f + ' ⇒ db חשוף (מועבר לפונקציה?) — חוזרים למנוי-מלא או צופים בכל המפתחות');
    }
    expect(problems).toEqual([]);
    expect(converted, '17 הרכיבים שהומרו נשארים מומרים').toBeGreaterThanOrEqual(17);
  });

  it('🔒 המנוע: השוואה על מפתחות-הצפייה בלבד, על useSyncExternalStore ילידי', () => {
    // לקח 23.8: ‏zustand/traditional מושך את use-sync-external-store שאינו
    // מותקן — עבר typecheck ובדיקות-יחידה ונפל רק בדפדפן (71 כשלי-e2e).
    const src = readFileSync('src/store/dbWatch.ts', 'utf8');
    expect(src).toContain('useSyncExternalStore');
    expect(src).not.toMatch(/from 'zustand\/traditional'/);
    expect(src).toContain("keysRef.current.some((k) => !Object.is(prev[k], cur[k]))");
    // הרפרנס-המוטמן מוחזר כשאין שינוי-נצפה — React מדלג על הרינדור
    expect(src).toContain('cache.current');
  });
});
