/**
 * בדיקת ratchet — סף "משפחה בסיכון" אחיד: CRED_RED_THRESHOLD = 500.
 *
 * לגאסי: דרגת red אחידה <500 (legacy-main-script.js — tierOf, דרגות 950/800/500);
 * ב-React היו שני ספים סותרים (300 ב-homeData.ts redCred וב-useApp.ts טוסט הירידה,
 * מול 500 ב-tierOf). פער P0.2: יישור הכול לקבוע משותף אחד ב-families/lib.ts.
 * הבדיקה נועלת: score 450 הוא red וגם נספר ב-redCred של attentionItems; score 550 לא.
 */
import { describe, it, expect } from 'vitest';
import { CRED_RED_THRESHOLD, tierOf } from '../lib';
import { attentionItems } from '../../home/homeData';
import { emptyDb, emptyFamily, type Db, type Family } from '../../../types/domain';
import { DEFAULT_CONFIG } from '../../../types/config';

function famWithScore(id: string, score: number): Family {
  return {
    ...emptyFamily(),
    id,
    createdAt: '2026-01-01',
    name: 'משפחת בדיקה ' + id,
    cred: { score, log: [] },
  };
}

function dbWith(families: Family[]): Db {
  return { ...emptyDb(), families };
}

describe('סף מדד-אמינות "סיכון" משותף (P0.2)', () => {
  it('הקבוע מיושר ללגאסי — 500, לא 300', () => {
    expect(CRED_RED_THRESHOLD).toBe(500);
  });

  it('tierOf משתמש באותו סף: 450=red, 550=pale (לא red)', () => {
    expect(tierOf(CRED_RED_THRESHOLD - 50).key).toBe('red');
    expect(tierOf(CRED_RED_THRESHOLD + 50).key).toBe('pale');
    // גבול מדויק: בדיוק על הסף אינו red (כמו tierOf במקור: >=500 → pale)
    expect(tierOf(CRED_RED_THRESHOLD).key).toBe('pale');
    expect(tierOf(CRED_RED_THRESHOLD - 1).key).toBe('red');
  });

  it('redCred ב-attentionItems סופר משפחה עם 450 ולא משפחה עם 550', () => {
    const db = dbWith([famWithScore('f1', 450), famWithScore('f2', 550)]);
    const items = attentionItems(db, new Date('2026-07-21T10:00:00'), DEFAULT_CONFIG.modules, DEFAULT_CONFIG);
    const red = items.find((i) => i.key === 'redcred:families');
    expect(red).toBeDefined();
    // משפחה אחת בלבד מתחת לסף — הכותרת ביחיד והניווט אליה
    expect(red!.nav).toEqual({ kind: 'family', id: 'f1' });
    expect(red!.title).toContain('אחת');
  });

  it('אין פריט redCred כשכל המשפחות מעל הסף', () => {
    const db = dbWith([famWithScore('f1', 550), famWithScore('f2', 700)]);
    const items = attentionItems(db, new Date('2026-07-21T10:00:00'), DEFAULT_CONFIG.modules, DEFAULT_CONFIG);
    expect(items.find((i) => i.key === 'redcred:families')).toBeUndefined();
  });
});
