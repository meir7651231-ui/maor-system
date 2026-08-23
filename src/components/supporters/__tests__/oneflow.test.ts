/**
 * ▶ ratchet — "פעולה אחת עכשיו" (VISION-LIGHT ‏#16, 23.8.2026).
 *
 * מסך-מלא של משימה-אחת-בכל-רגע מעל תור-הקוקפיט הקיים. שלושה אינווריאנטים:
 * 1) ‏opt-in מפורש `=== true` — חסר-דגל = דורמנטי, הלקוח-החי ביט-זהה
 *    (לקח הקוקפיט: featureOn היה מדליק לכל לקוח-חי).
 * 2) קריאה-בלבד — אפס-כתיבה ל-DB: בוצע/דלג = מצב-סשן; רישום-כסף/קבלות
 *    נשאר בכרטיס (addDonation) בלבד.
 * 3) הדגל רשום ב-FEATURES עם optIn:true — אחרת האשף לא מציג אותו
 *    ואי-אפשר להדליק (לקח פאזה 10 של החוגים).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FEATURES } from '../../../types/features';

describe('▶ פעולה-אחת-עכשיו — אינווריאנטים', () => {
  const view = readFileSync('src/components/supporters/SupportersView.tsx', 'utf8');
  const flow = readFileSync('src/components/supporters/OneFlow.tsx', 'utf8');

  it('opt-in מפורש === true — לא featureOn; חסר-דגל = דורמנטי', () => {
    expect(view).toContain("config.features?.['supporters.oneflow'] === true");
    expect(view).not.toContain("featureOn(config, 'supporters.oneflow')");
    // הרינדור כפול-שער: גם הדגל וגם הפתיחה
    expect(view).toContain('oneflowOpen && oneflowOn &&');
  });

  it('הדגל רשום ב-FEATURES עם optIn:true (נראה באשף, כבוי-מלידה)', () => {
    const f = FEATURES.find((x) => x.key === 'supporters.oneflow');
    expect(f).toBeDefined();
    expect(f!.optIn).toBe(true);
    expect(f!.module).toBe('supporters');
  });

  it('קריאה-בלבד: אפס-כתיבה ל-DB — בוצע/דלג הם מצב-סשן', () => {
    expect(flow).not.toContain('setDb');
    expect(flow).not.toContain('addDonation');
    expect(flow).not.toContain('useApp(');
    // הרישום-בפועל מופנה לכרטיס
    expect(flow).toContain('onOpen(cur.supId)');
  });

  it('הזרימה: תור-הקוקפיט הקיים, דלג-לסוף כמו בחייגן, מקלדת 1/2/Esc', () => {
    expect(flow).toContain('cockpitQueue(props.supporters, today');
    expect(flow).toContain('[...queue.calls, ...queue.thanks, ...queue.hok]');
    // דלג ⇒ לסוף-התור (deferred) — לא נעלם
    expect(flow).toContain('fresh[0] ?? deferred[0] ?? null');
    expect(flow).toContain("e.key === '1'");
    expect(flow).toContain("e.key === '2'");
    expect(flow).toContain("e.key === 'Escape'");
  });
});
