/**
 * ratchet — זיהוי-שיחה-נכנסת (screen-pop): "מה קובע שלקוח מתקשר".
 *
 * ההכרעה = התאמת-מספר: phoneKey מנרמל (972/0 מוביל, סימנים) ו-findCaller מחפש
 * לפי סדר-עדיפות (משפחה→בן-משפחה→תורם→מתנדב→רכז). הגנות: פורמט-בינ"ל שונה עדיין
 * מתאים, מספר-קצר/לא-מזוהה ⇒ null (בלי false-positive), וה-App מחווט #call=
 * דרך findCaller מגודר telephonyOn.
 */
import { describe, expect, it } from 'vitest';
import { emptyDb } from '../../types/domain';
import { phoneKey, findCaller } from '../callerId';
import type { Db, Family, Supporter, Volunteer, TzCoordinator } from '../../types/domain';
import appSrc from '../../App.tsx?raw';
import lookupSrc from '../../components/CallerLookup.tsx?raw';
import widgetsSrc from '../../components/home/widgets.tsx?raw';

function db(): Db {
  const d = emptyDb();
  d.families = [
    { id: 'f1', name: 'כהן', phone: '050-1234567', phone2: '', members: [{ id: 'm1', first: 'דוד', phone: '052-7654321', phone2: '' }] } as unknown as Family,
    { id: 'f2', name: 'לוי', phone: '02-5551234', phone2: '', members: [] } as unknown as Family,
  ];
  d.supporters = [{ id: 's1', name: 'תורם טוב', phone: '054-1112222' } as unknown as Supporter];
  d.volunteers = [{ id: 'v1', name: 'מתנדב', phone: '053-9990000' } as unknown as Volunteer];
  d.tzCoordinators = [{ id: 'c1', name: 'רכז', phone: '058-8887777' } as unknown as TzCoordinator];
  return d;
}

describe('callerId — זיהוי-שיחה-נכנסת', () => {
  it('phoneKey מנרמל 972/0 מוביל וסימנים', () => {
    expect(phoneKey('050-123-4567')).toBe('501234567');
    expect(phoneKey('+972 50 1234567')).toBe('501234567');
    expect(phoneKey('0050-1234567')).toBe('501234567'); // 00 בינ"ל
    expect(phoneKey('02-555-1234')).toBe('25551234'); // קווי
    expect(phoneKey('')).toBe('');
  });

  it('מזהה משפחה גם בפורמט-מתקשר שונה (בינ"ל מול מקומי-שמור)', () => {
    const c = findCaller(db(), '+972501234567');
    expect(c?.kind).toBe('family');
    expect(c?.famId).toBe('f1');
    expect(c?.name).toBe('כהן');
    expect(c?.view).toBe('families');
  });

  it('מזהה בן-משפחה ומנתב לכרטיס-המשפחה (famId)', () => {
    const c = findCaller(db(), '0527654321');
    expect(c?.kind).toBe('member');
    expect(c?.famId).toBe('f1');
  });

  it('מזהה תורם/מתנדב/רכז', () => {
    expect(findCaller(db(), '054-111-2222')?.kind).toBe('supporter');
    expect(findCaller(db(), '0539990000')?.kind).toBe('volunteer');
    expect(findCaller(db(), '058-8887777')?.kind).toBe('coordinator');
  });

  it('לא-מזוהה / קצר-מדי / ריק ⇒ null (בלי false-positive)', () => {
    expect(findCaller(db(), '050-0000000')).toBeNull();
    expect(findCaller(db(), '12345')).toBeNull();
    expect(findCaller(db(), '')).toBeNull();
  });

  it('עדיפות: אותו מספר גם במשפחה וגם בתורם ⇒ המשפחה ראשונה', () => {
    const d = db();
    (d.supporters as unknown as Supporter[]).push({ id: 's2', name: 'כפול', phone: '050-1234567' } as unknown as Supporter);
    expect(findCaller(d, '0501234567')?.kind).toBe('family');
  });

  it('App מחווט #call= דרך findCaller, מגודר telephonyOn', () => {
    expect(appSrc).toContain("startsWith('#call=')");
    expect(appSrc).toContain('findCaller(');
    expect(appSrc).toContain('telephonyOn(st.config)');
  });

  it('תיבת "מי מתקשר?" — #caller פותח CallerLookup (מגודר telephonyOn), על אותו findCaller', () => {
    expect(appSrc).toContain("=== '#caller'");
    expect(appSrc).toContain('<CallerLookup');
    expect(appSrc).toContain('callerOpen && telephonyOn(config)');
    expect(lookupSrc).toContain('findCaller('); // אותו מנוע כמו השיחה-האוטומטית
    expect(widgetsSrc).toContain("'#caller'"); // כפתור-הבית פותח את התיבה
    expect(widgetsSrc).toContain('מי מתקשר?');
  });
});
