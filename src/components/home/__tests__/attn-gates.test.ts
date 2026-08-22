/**
 * ratchet · שערי-דגלים בפריטי "דורש טיפול" (swarm-audit 21.8.2026):
 *
 * #1 סיכון-נטישה — opt-in מפורש: הפריט נדחף רק כש-supporters.cockpit/intel
 *    דלוקים **במפורש** (=== true). לפני התיקון featureOn (חסר=פעיל) הדליק את
 *    הבינה ה"דורמנטית" לכל לקוח-חי — בניגוד לחוזה optIn:true של הדגלים.
 * #2 מדד-אמינות-אדום — מגודר families.cred (ורטיקל מסחרי מכבה אותו: המדד לא
 *    מוצג בשום מסך ⇒ הפריט היה crit ללא-מוצא) + המונח דרך termOf('entity.cred').
 * #3 ספח-ת"ז — מגודר core.taxreceipt (ספח ת"ז = עמותה ישראלית בלבד; בוורטיקל
 *    מסחרי fullSefach חסר=false ⇒ הפריט דלק שם לתמיד וללא-משמעות).
 */
import { describe, expect, it } from 'vitest';
import { attentionItems } from '../homeData';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, emptyFamily, type Db, type Supporter } from '../../../types/domain';

const NOW = new Date('2026-07-21T10:00:00');

const cfg = (features: Record<string, boolean>, terms: Record<string, string> = {}): OrgConfig => ({
  ...DEFAULT_CONFIG,
  features,
  terms,
});

/** תורם שנתן לפני שנה, בלי יעד-קשר ⇒ עונה על cockpitAtRisk (שקט מעל הסף). */
function riskDb(): Db {
  return {
    ...emptyDb(),
    supporters: [
      {
        id: 's1',
        name: 'תורם שקט',
        nextDate: '',
        count: 1, // supCount קורא את המונה השמור (+hist) — לא את אורך-donations
        last: '2025-01-01', // supLast קורא את השדה השמור (לא את תאריכי-התרומות)
        donations: [{ rid: 'D-1', date: '2025-01-01', amount: 100, cur: '₪', cat: '' }],
      } as unknown as Supporter,
    ],
  };
}

describe('🛡 ratchet · שערי-דגלים ב"דורש טיפול"', () => {
  it('#1 סיכון-נטישה: חסר-דגל (ברירת-מחדל, לקוח-חי) ⇒ אין פריט — דורמנטי', () => {
    const items = attentionItems(riskDb(), NOW, {}, DEFAULT_CONFIG);
    expect(items.find((x) => x.key.startsWith('suprisk:'))).toBeUndefined();
  });

  it('#1 סיכון-נטישה: opt-in מפורש (cockpit או intel === true) ⇒ הפריט מופיע', () => {
    const viaCockpit = attentionItems(riskDb(), NOW, {}, cfg({ 'supporters.cockpit': true }));
    expect(viaCockpit.find((x) => x.key.startsWith('suprisk:'))).toBeTruthy();
    const viaIntel = attentionItems(riskDb(), NOW, {}, cfg({ 'supporters.intel': true }));
    expect(viaIntel.find((x) => x.key.startsWith('suprisk:'))).toBeTruthy();
  });

  const credDb = (): Db => ({
    ...emptyDb(),
    families: [{ ...emptyFamily(), id: 'f1', status: 'active', cred: { score: 100 } }] as Db['families'],
  });

  it('#2 מדד-אדום: families.cred כבוי ⇒ אין פריט-crit ללא-מוצא; דלוק (חסר) ⇒ מופיע', () => {
    const off = attentionItems(credDb(), NOW, {}, cfg({ 'families.cred': false }));
    expect(off.find((x) => x.key === 'redcred:families')).toBeUndefined();
    const on = attentionItems(credDb(), NOW, {}, DEFAULT_CONFIG);
    expect(on.find((x) => x.key === 'redcred:families')).toBeTruthy();
  });

  it('#2 מדד-אדום: המונח דרך termOf(entity.cred) — לא "מדד אמינות" קשיח', () => {
    const items = attentionItems(credDb(), NOW, {}, cfg({}, { 'entity.cred': 'דירוג לקוח' }));
    const it2 = items.find((x) => x.key === 'redcred:families');
    expect(it2?.title).toContain('דירוג לקוח');
    expect(it2?.title).not.toContain('מדד אמינות');
  });

  const sefachDb = (): Db => ({
    ...emptyDb(),
    families: [{ ...emptyFamily(), id: 'f1', status: 'active', fullSefach: false }] as Db['families'],
  });

  it('#3 ספח-ת"ז: core.taxreceipt כבוי (ורטיקל מסחרי) ⇒ אין פריט; עמותתי ⇒ מופיע', () => {
    const off = attentionItems(sefachDb(), NOW, {}, cfg({ 'core.taxreceipt': false }));
    expect(off.find((x) => x.key === 'sefach:families')).toBeUndefined();
    const on = attentionItems(sefachDb(), NOW, {}, DEFAULT_CONFIG);
    expect(on.find((x) => x.key === 'sefach:families')).toBeTruthy();
  });
});
