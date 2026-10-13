/**
 * ratchet — נחיל ב׳ (3.9.2026): צרור תיקוני-ביקורת ב-store/App/ui.
 *  · MN-1 bulkRecordHok — hok עם סכום 0/NaN/שלילי (גיבוי/ענן פגום) צרך מספרי-D- (§46).
 *  · A1 flush ביציאה לפני סיום init דרס את maor_db ב-DB ריק.
 *  · S1 מצבת-מחיקה — ה-db שבזיכרון נכתב חזרה אחרי wipeLocalOrgData.
 *  · S2 דגלי-הפתיחה של הסשן גלובליים בעוד הנעילה פר-ארגון.
 *  · F4 איפוס/שחזור בארגון-ענן בלי סמכות-מנהל.
 *  · F3 צ׳וק-מורה · N1/N3 מסכי-נעילה · N2/A-5/A-8 ui.tsx · DS-1 מזהי-תבנית גולמיים.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db, Hok, Supporter } from '../../types/domain';
import { HOK_CAT } from '../../components/supporters/lib';
import useAppSrc from '../useApp.ts?raw';
import appSrc from '../../App.tsx?raw';
import uiSrc from '../../components/ui.tsx?raw';

const TODAY = '2026-07-15';
const hok = (amount: number, cur: '₪' | '$' = '₪'): Hok => ({
  amount, cur, day: 5, method: 'bank', note: '', active: true, startedAt: '2025-01-01',
});
function sup(id: string, h: Hok | undefined, donations: Supporter['donations'] = []): Supporter {
  return {
    id, name: 'תורם ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: donations.length, ils: 0, usd: 0, first: '', last: '', nextDate: '',
    donations, ...(h ? { hok: h } : {}),
  } as Supporter;
}
function seed(): Db {
  return {
    ...emptyDb(),
    supporters: [
      sup('z', hok(0)),     // סכום 0 — פגום
      sup('n', hok(NaN)),   // NaN — פגום
      sup('neg', hok(-50)), // שלילי — פגום
      sup('a', hok(100)),   // תקין · טרם נרשמה
    ],
  };
}
const db = () => useApp.getState().db;
const donsOf = (id: string) => db().supporters.find((s) => s.id === id)!.donations;

beforeEach(() => {
  useApp.getState().setDb(() => ({ ...seed(), donationSeq: 1 }));
});

describe('🔁 🐛 נחיל ב׳ MN-1 — bulkRecordHok: שער-סכום לפני צריכת-D-', () => {
  it('0/NaN/-50 מדולגים ככשל; רק 100 נרשם; donationSeq מתקדם ב-1 בלבד', () => {
    const res = useApp.getState().bulkRecordHok(['z', 'n', 'neg', 'a'], TODAY);
    expect(res.done).toBe(1);
    expect(res.failed).toBe(3);
    expect(db().donationSeq).toBe(2);
    expect(donsOf('z').length).toBe(0);
    expect(donsOf('n').length).toBe(0);
    expect(donsOf('neg').length).toBe(0);
    expect(donsOf('a')[0]).toMatchObject({ rid: 'D-1', amount: 100, cat: HOK_CAT, date: TODAY });
  });
});

describe('🛡 נחיל ב׳ — הגנות-מקור (store)', () => {
  it('A1: flush ביציאה מגודר ready/needDecrypt — ושורת-staleTab המקורית ביט-זהה', () => {
    expect(useAppSrc).toMatch(/const flush = \(\) => \{[\s\S]{0,700}if \(!s\.ready \|\| s\.needDecrypt\) return;\s*\n\s*if \(!s\.staleTab\) flushSaveSync\(s\.db\);/);
  });
  it('S1: שני אתרי wipeLocalOrgData(cfg.slug) מסמנים staleTab', () => {
    const m = useAppSrc.match(/wipeLocalOrgData\(cfg\.slug\)\)[\s\S]{0,200}?staleTab: true/g);
    expect(m?.length).toBe(2);
  });
  it('S2: דגלי-הסשן ממורחבי-שמות (nsLsKey) בקריאה-מחדש ב-init ובכתיבות', () => {
    expect(useAppSrc).toContain('readSess(nsLsKey(SESS.p))');
    expect(useAppSrc).toContain("writeSess(nsLsKey(SESS.p), '1')");
  });
  it('F4: resetAll ו-restoreDb מגודרים isAdminAuthority', () => {
    expect((useAppSrc.match(/isAdminAuthority\(/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
  it('DS-1: מזהי-תבנית לא נטבעים גולמיים', () => {
    expect(useAppSrc).not.toContain("'qt' + db.seq");
    expect(useAppSrc).not.toContain("'an' + (base + k++)");
    expect(useAppSrc).toContain("makeId('qt', db.seq, deviceTag())");
  });
});

describe('🛡 נחיל ב׳ — הגנות-מקור (App/ui)', () => {
  it('F3: צ׳וק-מורה — settings ⇒ home', () => {
    expect(appSrc).toContain("if (isTeacherUser && view === 'settings') go('home');");
  });
  it('N3: אזור wizard נאכף', () => {
    expect(appSrc).toContain("adminNeededFor('wizard')");
  });
  it('N1: לכל מסכי-האין-הרשאה יש כפתור-חזרה', () => {
    expect(appSrc).toContain('denyBackBtn(() => setPlatformOpen(false))');
    expect((appSrc.match(/denyBackBtn\(\(\) => setBuilderOpen\(false\)\)/g) ?? []).length).toBe(2);
  });
  it('N2/A-5/A-8: ui.tsx', () => {
    expect(uiSrc).toContain('if (!isTop()) return;');
    expect(uiSrc).toContain('aria-pressed={props.on === undefined ? undefined : props.on}');
    expect(uiSrc).toContain('aria-label={props.ariaLabel}');
  });
});
