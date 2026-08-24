/**
 * 🪦 ratchet — מצבות-מחיקה בסנכרון (ביקורת-האמון 24.8, לולאת-האמון 3).
 *
 * הבאג: באיחוד-ההתחברות, id-מקומי שחסר בענן נחשב תמיד "תוספת-אופליין" ונדחף
 * חזרה לענן — גם כשהוא נמחק בענן בזמן שהמכשיר היה אופליין. מחיקות קמו לתחייה.
 * התיקון: טבעת-מצבות delLog (additive, רוכבת על meta) — setDb מטביע מצבה לכל
 * רשומה שירדה מאוסף-ישות; איחוד-ההתחברות מסנן ids-מקומיים שיש להם מצבה;
 * מיזוג-meta מאחד טבעות (לא הענן-מנצח — מצבה מקומית טרייה חייבת לשרוד).
 */
import { describe, expect, it } from 'vitest';
import { DEL_LOG_CAP, mergeDelLogs, pushDelLog, type DelEntry } from '../../types/domain';
import syncSrc from '../cloudSync.ts?raw';
import mergeSrc from '../../lib/cloud-merge.ts?raw';
import diffSrc from '../../lib/cloud-diff.ts?raw';
import storeSrc from '../useApp.ts?raw';

const e = (id: string, at: string, col = 'families'): DelEntry => ({ at, col, id });

describe('🪦 pushDelLog / mergeDelLogs — טהורים', () => {
  it('דדופ לפי col|id — המצבה החדשה גוברת', () => {
    const out = pushDelLog([e('a', '2026-01-01')], [e('a', '2026-02-02'), e('b', '2026-02-03')]);
    expect(out).toHaveLength(2);
    expect(out.find((x) => x.id === 'a')?.at).toBe('2026-02-02');
  });
  it('טבעת: מעבר ל-DEL_LOG_CAP דוחק את הוותיקות', () => {
    const many = Array.from({ length: DEL_LOG_CAP + 40 }, (_, i) => e('id' + i, '2026-01-01'));
    expect(pushDelLog([], many)).toHaveLength(DEL_LOG_CAP);
  });
  it('mergeDelLogs: איחוד מקומי+ענן, undefined בטוח', () => {
    const out = mergeDelLogs([e('a', '2026-01-05')], [e('a', '2026-01-01'), e('b', '2026-01-02')]);
    expect(out).toHaveLength(2);
    expect(out.find((x) => x.id === 'a')?.at).toBe('2026-01-05');
    expect(mergeDelLogs(undefined, undefined)).toEqual([]);
  });
});

describe('🔒 החיווט — מקור נעול', () => {
  it('setDb מטביע מצבות לכל רשומה שירדה מאוסף-ישות', () => {
    expect(storeSrc).toContain('pushDelLog(');
    expect(storeSrc).toContain("dels.push({ at, col, id: x.id })");
  });
  it('איחוד-ההתחברות מסנן לפי מצבות — מחיקה לא קמה לתחייה', () => {
    expect(syncSrc).toContain("!tombs.has(col + '|' + x.id)");
    expect(syncSrc).toContain('merged.delLog = mergeDelLogs(local.delLog, cloudDb.delLog)');
  });
  it('delLog רוכב על meta (diff) וממוזג-איחוד (לא הענן-מנצח)', () => {
    expect(diffSrc).toContain("'delLog'");
    expect(diffSrc).toContain('delLog: db.delLog');
    expect(mergeSrc).toContain('mergeDelLogs(db.delLog, meta.delLog');
    // אסור שיחזור assign פשוט (הענן-מנצח היה מוחק מצבה מקומית טרייה)
    expect(mergeSrc).not.toContain("assign('delLog'");
  });
});
