/**
 * 🕎 ratchet — מנוע-העיתוי העברי (VISION-LIGHT ‏#37, 23.8.2026).
 *
 * הבידול: הנתינה היהודית חיה על הלוח העברי, וכל מנועי-ה-CRM חושבים בלועזי.
 * המנוע מזהה פר-תורם את החודש-העברי שבו הוא נוהג לתת (2+ שנים עבריות שונות)
 * ומרים משימה בדיוק כשהחודש מגיע — אלא-אם כבר נתן בו השנה.
 * טהור · היום-מוזרק · דין-אדר · opt-in מפורש.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { hebSeasonOf, hebTimingTasks, HEB_SEASONS } from '../hebTiming';
import type { Supporter } from '../../../types/domain';

/** תומך-בדיקה מינימלי — רק השדות שהמנוע קורא. */
function sup(id: string, name: string, dates: string[], hist: { d: string; a: number; status?: string }[] = []): Supporter {
  return {
    id, name, phone: '050-0000000', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '',
    donations: dates.map((d, i) => ({ rid: 'D-' + id + i, date: d, amount: 100, cur: '₪' as const, cat: '', method: '' })),
    hist: hist.map((h) => ({ d: h.d, a: h.a, status: h.status })),
  } as unknown as Supporter;
}

// עוגני-אמת ללוח: א' תשרי תשפ"ו = 23.9.2025 · 23.8.2026 = אלול תשפ"ו
const ELUL_5786 = '2026-08-23';

describe('🕎 עיתוי-עברי — hebSeasonOf', () => {
  it('עוגן-לוח: ראש-השנה תשפ"ו = תשרי; ‏23.8.2026 = אלול (עונת-נתינה)', () => {
    expect(hebSeasonOf('2025-09-23').monthEn).toBe('Tishri');
    const now = hebSeasonOf(ELUL_5786);
    expect(now.monthEn).toBe('Elul');
    expect(now.monthHe).toBe('אלול');
    expect(now.season).toBe(HEB_SEASONS.Elul);
  });
});

describe('🕎 עיתוי-עברי — hebTimingTasks', () => {
  it('הרגל של 2+ שנים עבריות באותו חודש-עברי ⇒ משימה; שנה אחת ⇒ לא', () => {
    // אלול תשפ"ד ≈ ספטמבר 2024 · אלול תשפ"ה ≈ ספטמבר 2025 (לפני 23.9 = עדיין אלול/תחילת-תשרי?)
    // עוגנים בטוחים: 2024-09-10 ו-2025-09-10 שניהם באלול (ר"ה תשפ"ה=3.10.24, תשפ"ו=23.9.25)
    const habitual = sup('a', 'רגיל', ['2024-09-10', '2025-09-10']);
    const oneOff = sup('b', 'חד-פעמי', ['2025-09-10']);
    const tasks = hebTimingTasks([habitual, oneOff], ELUL_5786);
    expect(tasks.map((t) => t.supId)).toEqual(['a']);
    expect(tasks[0].timesInMonth).toBe(2);
    expect(tasks[0].reason).toContain('אלול');
  });

  it('כבר נתן בחודש-העברי הזה השנה ⇒ אין משימה (לא מטרידים פעמיים)', () => {
    const gave = sup('a', 'נתן', ['2024-09-10', '2025-09-10', '2026-08-20']); // 20.8.2026 = אלול תשפ"ו
    expect(hebTimingTasks([gave], ELUL_5786)).toEqual([]);
  });

  it('היסטוריית-סליקה נספרת; חיוב שנדחה — לא', () => {
    const viaHist = sup('a', 'סליקה', [], [
      { d: '2024-09-10', a: 180, status: 'אושר' },
      { d: '2025-09-10', a: 180, status: 'אושר' },
      { d: '2023-09-12', a: 180, status: 'נדחה' }, // לא נספר — אבל יש כבר 2
    ]);
    const declinedOnly = sup('b', 'נדחים', [], [
      { d: '2024-09-10', a: 180, status: 'נדחה' },
      { d: '2025-09-10', a: 180, status: 'נדחה' },
    ]);
    const tasks = hebTimingTasks([viaHist, declinedOnly], ELUL_5786);
    expect(tasks.map((t) => t.supId)).toEqual(['a']);
  });

  it('דטרמיניסטי: מיון לפי חוזק-ההרגל ואז שם; cap נאכף', () => {
    const strong = sup('s', 'אאא', ['2022-09-15', '2023-09-12', '2024-09-10', '2025-09-10']);
    const weak = sup('w', 'בבב', ['2024-09-10', '2025-09-10']);
    const tasks = hebTimingTasks([weak, strong], ELUL_5786);
    expect(tasks[0].supId).toBe('s');
    expect(hebTimingTasks([weak, strong], ELUL_5786, 1)).toHaveLength(1);
  });

  it('🔒 הגנת-מקור: opt-in מפורש בקוקפיט + באנר-עונה + אותה קבוצת-משימות', () => {
    const cockpit = readFileSync('src/components/supporters/SupportersCockpit.tsx', 'utf8');
    expect(cockpit).toContain("props.config.features?.['supporters.hebtiming'] === true");
    expect(cockpit).toContain('hebTimingTasks(props.supporters, today)');
    expect(cockpit).toContain('העונה שלהם');
    // המנוע טהור — בלי Date.now (היום מוזרק)
    const engine = readFileSync('src/components/supporters/hebTiming.ts', 'utf8');
    expect(engine).not.toMatch(/Date\.now\(/);
    expect(engine).toContain('adarNorm');
  });
});
