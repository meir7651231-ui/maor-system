/** נחיל ב׳ (3.9) — ratchets: TP-2 · MN-5 · TP-9 · DS-1 · MN-3 · A6 · A-4 · A-2 */
import { describe, expect, it } from 'vitest';
import type { OrgConfig } from '../../types/config';
import type { Supporter } from '../../types/domain';
import { emptyDb, type Db } from '../../types/domain';
import { deliveriesCsvRows } from '../shop7/lib';
import { hokEffectivelyActive, hokRecordedThisMonth } from '../supporters/lib';
import { cockpitQueue } from '../supporters/cockpit';
import importSrc from '../settings/ImportSection.tsx?raw';
import supImportSrc from '../supporters/SupporterImport.tsx?raw';
import manageSrc from '../courses/ManageModal.tsx?raw';
import detailSrc from '../supporters/SupporterDetail.tsx?raw';
import supViewSrc from '../supporters/SupportersView.tsx?raw';
import coursesViewSrc from '../courses/CoursesView.tsx?raw';
import dashSrc from '../courses/CoursesDashboard.tsx?raw';

const cfg = (terms: Record<string, string>) => ({ terms } as unknown as OrgConfig);
const sp = (over: Partial<Supporter> = {}): Supporter => ({
  id: 'x', name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
  notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
}) as Supporter;
const hok = (over: Partial<NonNullable<Supporter['hok']>> = {}) => ({
  amount: 100, cur: '₪' as const, day: 10, method: 'card' as const, note: '', active: true, startedAt: '2025-01-01', kevaId: 'K1', ...over,
});

describe('TP-2 · deliveriesCsvRows — כותרת-מתנדב לפי מונח', () => {
  it("cfg עם entity.volunteer='שליח' ⇒ rows[0][3]==='שליח'; בלי cfg — 'מתנדב'", () => {
    const db: Db = emptyDb();
    expect(deliveriesCsvRows(db, cfg({ 'entity.volunteer': 'שליח' }))[0][3]).toBe('שליח');
    expect(deliveriesCsvRows(db)[0][3]).toBe('מתנדב');
  });
});

// 🐛 MN-5: זיכוי (a≤0) ב-hist נספר כ"חיוב-חי"/"נרשם החודש"
describe('MN-5 · זיכויים אינם חיובים', () => {
  it('חודש עם זיכוי-בלבד ⇒ hokRecordedThisMonth=false', () => {
    const s = sp({ hok: hok(), hist: [{ d: '2026-08-05', a: -100, c: '₪', clearer: 'נדרים' }] });
    expect(hokRecordedThisMonth(s, '2026-08-15')).toBe(false);
  });
  it('חיוב ישן (מרץ) + זיכוי החודש ⇒ hokEffectivelyActive=false', () => {
    const s = sp({ hok: hok(), hist: [{ d: '2026-03-10', a: 100, c: '₪', clearer: 'נדרים' }, { d: '2026-07-01', a: -100, c: '₪', clearer: 'נדרים' }] });
    expect(hokEffectivelyActive(s, '2026-07-15')).toBe(false);
  });
  it('חיוב חיובי החודש ⇒ עדיין פעילה ונרשמה (שימור)', () => {
    const s = sp({ hok: hok(), hist: [{ d: '2026-07-10', a: 100, c: '₪', clearer: 'נדרים' }] });
    expect(hokEffectivelyActive(s, '2026-07-15')).toBe(true);
    expect(hokRecordedThisMonth(s, '2026-07-15')).toBe(true);
  });
});

describe('TP-9 · cockpitQueue עם cfg — סיבת-השיחה במונח-הארגון', () => {
  const TODAY = '2026-08-19';
  const risk = sp({ id: 'r', name: 'שקט', count: 1, last: '2026-01-01', donations: [{ rid: 'D-1', date: '2026-01-01', amount: 100, cur: '₪', cat: '' } as unknown as Supporter['donations'][number]] });
  it("terms.entity.supporter='לקוח' ⇒ reason מתחיל ב-'לקוח'; בלי cfg — 'תורם/ת'", () => {
    const withCfg = cockpitQueue([risk], TODAY, 3.7, cfg({ 'entity.supporter': 'לקוח' })).calls;
    const noCfg = cockpitQueue([risk], TODAY).calls;
    expect(withCfg.length).toBeGreaterThan(0);
    expect(withCfg[0].reason.startsWith('לקוח')).toBe(true);
    expect(noCfg[0].reason.startsWith('תורם/ת')).toBe(true);
  });
});

describe('🛡 הגנות-מקור נחיל ב׳', () => {
  it('DS-1: ייבוא מטביע תג-מכשיר (makeId) — אין עוד prefix+seq גולמי', () => {
    for (const src of [importSrc, supImportSrc]) {
      expect(src).not.toMatch(/'[a-z]+' \+ seq\+\+/);
      expect(src).toContain('makeId(');
    }
    expect(importSrc).toContain("makeId('f', seq++, deviceTag())");
  });
  it('MN-3: סיכום-הקבלה מקבל סכום מעוגל', () => { expect(manageSrc).toContain('paidSoFar: paidNow'); });
  it('A6: מגני-כפילות SMS/מייל-קבלה', () => {
    expect(detailSrc).toMatch(/async function sendSms\(\) \{[\s\S]{0,220}if \(smsBusy\) return;/);
    expect(detailSrc).toContain('if (mailRcptBusy) return;');
  });
  it('A-4: קישור-tel פר-שורה עם className', () => { expect(supViewSrc).toContain('className="tel-link"'); });
  it('A-2: שורות-חוג נפתחות במקלדת', () => {
    expect(coursesViewSrc).toMatch(/<tr key=\{c\.id\}[\s\S]{0,200}?tabIndex=\{0\}[\s\S]{0,200}?onKeyDown/);
    expect(dashSrc).toMatch(/<tr key=\{r\.id\}[\s\S]{0,200}?tabIndex=\{0\}[\s\S]{0,200}?onKeyDown/);
  });
});
