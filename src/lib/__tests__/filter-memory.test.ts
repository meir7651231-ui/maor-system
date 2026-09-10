/**
 * ratchet — זיכרון-סינון בין מסכים (בקשת-בעלים 10.9 "שימור גם את הסינון כמו בחזרה"):
 * מצב-הסינון של תורמים/משפחות/חוגים היה useState מקומי ⇒ מעבר ללוח וחזרה איפס הכול.
 * עכשיו useRemembered (זיכרון-סשן בזיכרון, כמו scrollMemory).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { _resetFilterMemory, recallFilter } from '../filterMemory';

const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('filterMemory — ליבה', () => {
  it('ריק בהתחלה; איפוס מנקה', () => {
    _resetFilterMemory();
    expect(recallFilter('sup.q')).toBeUndefined();
  });
  it('useRemembered: useState + effect שכותב לזיכרון; ה-initial רק בפעם הראשונה (הגנת-מקור)', () => {
    const s = src('../filterMemory.ts');
    expect(s).toContain("useState<T>(() => (mem.has(key) ? (mem.get(key) as T) : typeof initial === 'function' ? (initial as () => T)() : initial))");
    expect(s).toContain('mem.set(key, v);');
  });
});

describe('חיווט — כל מסנני שלוש הרשימות זכורים', () => {
  const sup = src('../../components/supporters/SupportersView.tsx');
  const fam = src('../../components/families/FamiliesView.tsx');
  const crs = src('../../components/courses/CoursesView.tsx');
  it('תורמים: 17 מסננים/מיון דרך useRemembered, אפס useState עבורם', () => {
    for (const k of ['q', 'cat', 'regionF', 'purposeF', 'tierF', 'colF', 'ayinF', 'nextF', 'hokF', 'monthF', 'acqYearF', 'gaveYearF', 'periodMode', 'lastF', 'advOpen', 'sort', 'segF']) {
      expect(sup, k).toMatch(new RegExp(`const \\[${k}, set[A-Za-z]+\\] = useRemembered(<[^\\n]*>)?\\('sup\\.${k}'`));
    }
    // בקשת-סגמנט מהבית (חד-פעמית) עדיין מכובדת
    expect(sup).toContain('const req = takeSupportersSegment();\n    if (req) setSegF(req);');
  });
  it('משפחות: 10 מסננים זכורים', () => {
    for (const k of ['q', 'status', 'city', 'comm', 'sort', 'colFOn', 'colF', 'advOn', 'adv', 'commMulti']) {
      expect(fam, k).toMatch(new RegExp(`const \\[${k}, set[A-Za-z]+\\] = useRemembered(<[^\\n]*>)?\\('fam\\.${k}'`));
    }
  });
  it('חוגים: 9 מסננים זכורים', () => {
    for (const k of ['q', 'cat', 'sem', 'dayF', 'teacherF', 'histF', 'sort', 'colFOn', 'colF']) {
      expect(crs, k).toMatch(new RegExp(`const \\[${k}, set[A-Za-z]+\\] = useRemembered(<[^\\n]*>)?\\('crs\\.${k}'`));
    }
  });
  it('מפתחות ייחודיים בין הרשימות (sup./fam./crs.)', () => {
    const keys = [...(sup + fam + crs).matchAll(/useRemembered(?:<[^\n]*>)?\('([a-z]+\.[A-Za-z]+)'/g)].map((m) => m[1]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBe(17 + 10 + 9);
  });
});
