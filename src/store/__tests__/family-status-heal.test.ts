/**
 * ratchet — 🛡 רשומת-משפחה אחת עם סטטוס לא-מוכר/חסר הפילה את **כל האפליקציה**
 * (ביקורת-e2e 1.9): STATUS_META[f.status] → undefined → .bg זורק → error-boundary
 * על כל המסך. שתי שכבות-הגנה: (1) migrate מרפא סטטוס לא-תקין ל-'active' (ערכים
 * תקינים ביט-זהים); (2) 4 אתרי-הרינדור עם `?? STATUS_META.active` — גם נתון
 * שהגיע בלי migrate (סנכרון-ענן/restoreDb) לא קורס.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import { emptyDb } from '../../types/domain';
import { STATUS_META } from '../../components/families/lib';
import widgetsSrc from '../../components/home/widgets.tsx?raw';
import famViewSrc from '../../components/families/FamiliesView.tsx?raw';
import famDetailSrc from '../../components/families/FamilyDetail.tsx?raw';

let n = 0;
const fam = (status: unknown) => ({
  id: 'f' + ++n, name: 'משפחת כהן', father: '', fatherId: '', mother: '', motherId: '', phone: '050', phone2: '',
  email: '', city: '', address: '', community: '', maritalStatus: '', language: '', tzedaka: '', fullSefach: false,
  discount: '', status, notes: '', members: [], docs: [], cred: { score: 700, log: [] }, createdAt: '2026-01-01',
});

describe('🛡 ratchet — סטטוס-משפחה לא-תקין לא מקריס', () => {
  it('migrate: סטטוס לא-מוכר/חסר ⇒ active; תקין נשמר ביט-זהה', () => {
    const m = migrate({ ...emptyDb(), families: [fam('bogus'), fam(undefined), fam('pending'), fam('inactive')] } as unknown)!;
    expect(m.families.map((f) => f.status)).toEqual(['active', 'active', 'pending', 'inactive']);
  });

  it('כל סטטוס שיוצא מ-migrate קיים ב-STATUS_META (אין מפתח שיזרוק)', () => {
    const m = migrate({ ...emptyDb(), families: [fam('???'), fam(null), fam(42)] } as unknown)!;
    for (const f of m.families) expect(STATUS_META[f.status]).toBeTruthy();
  });

  it('🛡 הגנת-מקור: 4 אתרי-הרינדור עם fallback ל-active', () => {
    expect(widgetsSrc).toContain('(ST_META[f.status] ?? ST_META.active)');
    expect((famViewSrc.match(/STATUS_META\[f\.status\] \?\? STATUS_META\.active/g) ?? []).length).toBe(2);
    expect(famDetailSrc).toContain('STATUS_META[fam.status] ?? STATUS_META.active');
    // אין יותר גישה חשופה שתזרוק
    expect(widgetsSrc).not.toMatch(/ST_META\[f\.status\]\.(bg|c|label)/);
  });
});
