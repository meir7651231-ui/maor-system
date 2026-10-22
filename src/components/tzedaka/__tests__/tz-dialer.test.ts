/**
 * ratchet — 📞 חייגן-הקופות + 🔐 ייעוד לקופה (בקשת-בעלים 22.10).
 * חויגים: המשפחה שהקופה אצלה. תוצאות: תואם ריקון ⇒ תזכורת · לא ענה ⇒ לסוף-התור · לחזור ⇒ תזכורת ·
 * אבדה ⇒ סטטוס · טופל · דילוג. ↩ ביטול מחזיר הכול. ייעוד: אותה רשימה כמו התורמים; עובד/ת מוגבל/ת
 * רואה רק קופות בייעוד שלו/ה, וקופה בלי ייעוד לא גלויה לו/ה — בכל משטח.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { tzApplyOutcome, tzBoxPhone, tzCampaignCsvRows, tzProgress, tzStartCampaign, tzUndoLast } from '../dialer';
import { tzBoxVisible, tzDesignations, visibleTzForDesignations } from '../lib';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, emptyFamily, type TzBox, type TzCoordinator, type TzEvent } from '../../../types/domain';
import homeTabSrc from '../HomeTab.tsx?raw';
import tabSrc from '../CoordinatorsTab.tsx?raw';
import cardSrc from '../CoordinatorCard.tsx?raw';
import calSrc from '../CalendarTab.tsx?raw';
import dialBtnSrc from '../TzDialButton.tsx?raw';
import homeViewSrc from '../../home/HomeView.tsx?raw';
import reportsSrc from '../../reports/ReportsView.tsx?raw';
import paletteSrc from '../../palette/CommandPalette.tsx?raw';

const box = (over: Partial<TzBox>): TzBox => ({ id: 'b1', num: '1', coordinatorId: 'c1', famId: 'f1', holderKind: '', since: '', status: 'home', notes: '', collections: [], ...over });
const coord = (over: Partial<TzCoordinator>): TzCoordinator => ({ id: 'c1', name: 'דוד', phone: '', famId: '', memberId: '', startDate: '', active: true, notes: '', score: 0, scoreLog: [], ...over } as TzCoordinator);
const ev = (over: Partial<TzEvent>): TzEvent => ({ id: 'e1', title: 'x', date: '2026-10-22', time: '', kind: 'reminder', coordinatorId: '', boxId: '', notes: '', done: false, ...over });

describe('📞 מנוע חייגן-הקופות', () => {
  it('פתיחה: דדופ וסינון-ריקים, הסדר נשמר', () => {
    expect(tzStartCampaign('x', ['b1', '', 'b2', 'b1'], 't').queue).toEqual(['b1', 'b2']);
  });
  it('לא ענה/דילוג ⇒ לסוף-התור; שאר התוצאות ⇒ יוצאים; ↩ מחזיר לחזית', () => {
    let c = tzStartCampaign('x', ['b1', 'b2', 'b3'], 't');
    c = tzApplyOutcome(c, { outcome: 'noanswer', at: 't1' });
    expect(c.queue).toEqual(['b2', 'b3', 'b1']);
    c = tzApplyOutcome(c, { outcome: 'scheduled', at: 't2', eventId: 'e9' });
    expect(c.queue).toEqual(['b3', 'b1']);
    expect(c.log[1]).toMatchObject({ id: 'b2', outcome: 'scheduled', eventId: 'e9' });
    c = tzUndoLast(c);
    expect(c.queue).toEqual(['b2', 'b3', 'b1']);
    c = tzUndoLast(c);
    expect(c.queue).toEqual(['b1', 'b2', 'b3']);
    expect(c.log).toHaveLength(0);
  });
  it('התקדמות: לא-ענה נספר פר-קופה ולא פר-ניסיון; CSV שורה פר-ניסיון', () => {
    let c = tzStartCampaign('x', ['b1', 'b2'], 't');
    c = tzApplyOutcome(c, { outcome: 'noanswer', at: 't' });
    c = tzApplyOutcome(c, { outcome: 'done', at: 't' });
    c = tzApplyOutcome(c, { outcome: 'noanswer', at: 't', note: 'שוב' });
    const p = tzProgress(c);
    expect(p.counts.noanswer).toBe(1);
    expect(p.counts.done).toBe(1);
    expect(p).toMatchObject({ total: 2, remaining: 1, finalized: 1 });
    expect(tzCampaignCsvRows(c, (id) => '#' + id)).toHaveLength(4);
  });
  it('הטלפון לחיוג = של המשפחה שהקופה אצלה', () => {
    const families = [{ ...emptyFamily(), id: 'f1', createdAt: '2026-01-01', phone: ' 050-1 ' }];
    expect(tzBoxPhone({ families }, { famId: 'f1' })).toBe('050-1');
    expect(tzBoxPhone({ families }, { famId: '' })).toBe('');
  });
});

describe('🔐 ייעוד לקופה — ראוּת', () => {
  const db = {
    tzBoxes: [box({ id: 'a', designation: 'ישיבה' }), box({ id: 'b', designation: 'כולל', coordinatorId: 'c2' }), box({ id: 'n' })],
    tzCoordinators: [coord({ id: 'c1' }), coord({ id: 'c2' }), coord({ id: 'c3' })],
    tzEvents: [ev({ id: 'ea', boxId: 'a' }), ev({ id: 'eb', boxId: 'b' }), ev({ id: 'ec2', coordinatorId: 'c2' }), ev({ id: 'eg' })],
  };
  it('בלי הגבלה ⇒ אותם מערכים בדיוק (ביט-זהה)', () => {
    const v = visibleTzForDesignations(db, null);
    expect(v.tzBoxes).toBe(db.tzBoxes);
    expect(v.tzEvents).toBe(db.tzEvents);
  });
  it('מוגבל/ת ל"ישיבה": רק קופות-ישיבה, רק הרכזים שלהן, רק האירועים שלהן (+ כלליים); בלי-ייעוד מוסתרת', () => {
    const v = visibleTzForDesignations(db, ['ישיבה']);
    expect(v.tzBoxes.map((b) => b.id)).toEqual(['a']);
    expect(v.tzCoordinators.map((c) => c.id)).toEqual(['c1']);
    expect(v.tzEvents.map((e) => e.id)).toEqual(['ea', 'eg']);
    expect(tzBoxVisible({ designation: '' }, ['ישיבה'])).toBe(false);
    expect(tzBoxVisible({ designation: ' ישיבה ' }, ['ישיבה'])).toBe(true);
    expect(tzDesignations(db.tzBoxes)).toEqual(['ישיבה', 'כולל']);
  });
  it('כל המשטחים קוראים דרך המסנן: מסכי-הקופות, הבית, הדוחות והחיפוש', () => {
    for (const src of [homeTabSrc, tabSrc, cardSrc, calSrc]) expect(src).toContain('useTzDb()');
    for (const src of [homeViewSrc, reportsSrc, paletteSrc]) expect(src).toContain('visibleTzForDesignations(db');
    expect(dialBtnSrc).toMatch(/telephonyOn\(config\) \|\| !featureOn\(config, 'tzedaka\.dialer'\)/);
  });
});

describe('📞 חייגן-הקופות — store', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      families: [{ ...emptyFamily(), id: 'f1', createdAt: '2026-01-01', name: 'כהן', phone: '050-1234567' }, { ...emptyFamily(), id: 'f2', createdAt: '2026-01-01', name: 'לוי', phone: '' }],
      tzCoordinators: [coord({})],
      tzBoxes: [box({ id: 'b1', num: '42' }), box({ id: 'b2', num: '43', famId: 'f2' }), box({ id: 'b3', num: '44', famId: '' })],
    }));
  });

  it('קופה בלי טלפון/משפחה מושמטת מהתור', () => {
    useApp.getState().tzDialerStart(['b1', 'b2', 'b3'], 'בדיקה');
    expect(useApp.getState().db.ui.tzDialer?.queue).toEqual(['b1']);
  });

  it('אף קופה עם טלפון ⇒ לא נפתח חייגן ריק (נמצא במעבר-הדפדפן: נפתח על "סיימתם")', () => {
    expect(useApp.getState().tzDialerStart(['b2', 'b3'], 'בדיקה')).toBe(0);
    expect(useApp.getState().db.ui.tzDialer).toBeUndefined();
    expect(useApp.getState().tzDialerStart(['b1'], 'בדיקה')).toBe(1);
  });

  it('תואם ריקון ⇒ תזכורת בלוח הקופות מקושרת לקופה; ↩ ביטול מוחק אותה', () => {
    useApp.getState().tzDialerStart(['b1'], 'בדיקה');
    useApp.getState().tzDialerOutcome('scheduled', 'יום שלישי', '2026-10-27');
    let db = useApp.getState().db;
    expect(db.tzEvents).toHaveLength(1);
    expect(db.tzEvents[0]).toMatchObject({ kind: 'reminder', boxId: 'b1', coordinatorId: 'c1', date: '2026-10-27', title: 'ריקון מתואם · יום שלישי' });
    expect(db.tzBoxes[0].notes).toContain('תואם ריקון: יום שלישי');
    expect(db.ui.tzDialer?.queue).toEqual([]);
    useApp.getState().tzDialerUndo();
    db = useApp.getState().db;
    expect(db.tzEvents).toHaveLength(0);
    expect(db.ui.tzDialer?.queue).toEqual(['b1']);
  });

  it('תואם/לחזור בלי תאריך נדחה בלי לגעת ב-db', () => {
    useApp.getState().tzDialerStart(['b1'], 'בדיקה');
    const before = useApp.getState().db;
    useApp.getState().tzDialerOutcome('callback', '', undefined);
    expect(useApp.getState().db).toEqual(before);
  });

  it('אבדה ⇒ הקופה מסומנת אבודה; ↩ ביטול מחזיר את הסטטוס הקודם', () => {
    useApp.getState().tzDialerStart(['b1'], 'בדיקה');
    useApp.getState().tzDialerOutcome('lost', '', undefined);
    expect(useApp.getState().db.tzBoxes[0].status).toBe('lost');
    useApp.getState().tzDialerUndo();
    expect(useApp.getState().db.tzBoxes[0].status).toBe('home');
  });

  it('🛡 בידוד: החייגן לא נוגע בחייגן-התורמים, בתרומות או בלוח הראשי', () => {
    const before = useApp.getState().db;
    useApp.getState().tzDialerStart(['b1'], 'בדיקה');
    useApp.getState().tzDialerOutcome('callback', 'מחר', '2026-10-23');
    useApp.getState().tzDialerStop();
    const after = useApp.getState().db;
    expect(after.ui.dialer).toBe(before.ui.dialer);
    expect(after.ui.tzDialer).toBeUndefined();
    expect(after.supporters).toEqual(before.supporters);
    expect(after.events).toEqual(before.events);
    expect(after.donationSeq).toBe(before.donationSeq);
  });
});
