/**
 * ratchet · לוח-לקריאה + צ'יפי-שכבות בפאנל-הקרובים (swarm-audit 21.8.2026):
 *
 * #6 calendar.addevent ("כיבוי = לוח לקריאה") גידר רק את ➕ הכותרת — נשארו שני
 *    נתיבי-יצירה עוקפים: ➕ של תצוגת-היום (DayModal), ולחיצת-תא כש-dayview כבוי
 *    (פתחה מודאל-יצירה ישירות). עכשיו כל נתיבי-היצירה חסומים; **עריכת אירוע
 *    קיים נשארת** (גלולות/קרובים/DayModal onEdit) — הדגל חוסם יצירה בלבד.
 * #7 פאנל-הקרובים הבסיסי (upcomingRows, כש-calendar.upcoming כבוי) התעלם
 *    מצ'יפי-השכבות שסיננו את הגריד — עכשיו עובר אותו allowItem כמו upcoming30.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../CalendarView.tsx?raw';
import daySrc from '../DayModal.tsx?raw';
import { allowItem, DEFAULT_FILTERS, type DayItem } from '../calLib';

describe('🛡 ratchet · לוח-לקריאה (calendar.addevent חוסם את כל נתיבי-היצירה)', () => {
  it('#6 CalendarView: לחיצת-תא כש-dayview כבוי לא פותחת יצירה כשגם addevent כבוי', () => {
    expect(viewSrc).toContain("const addeventOn = featureOn(config, 'calendar.addevent');");
    expect(viewSrc).toContain(
      'onOpen={() => (dayviewOn ? setDayIso(cell.iso) : addeventOn ? setModal({ ev: null, date: cell.iso }) : undefined)}',
    );
  });

  it('#6 DayModal: גם ה-➕ של תצוגת-היום מגודר addevent', () => {
    expect(daySrc).toContain("featureOn(config, 'calendar.addevent') && (");
    // כפתור-היצירה לא מרונדר ללא-תנאי (הדפוס הישן)
    expect(daySrc).not.toMatch(/<span style=\{\{ flex: 1 \}\} \/>\s*<Btn kind="primary" sm onClick=\{\(\) => onAdd\(iso\)\}/);
  });

  it('#6 עריכה נשארת: נתיבי-העריכה (ev קיים) לא נגעו — הדגל חוסם יצירה בלבד', () => {
    // גלולות/קרובים פותחים ev קיים; DayModal מעביר onEdit — כולם ללא גידור addevent
    expect(viewSrc).toContain('onEdit={(ev) => setModal({ ev, date: ev.date })}');
    expect(daySrc).toContain('onEdit(it.ev)');
  });

  it('#7 פאנל-הקרובים הבסיסי עובר allowItem עם effFilters (כמו upcoming30)', () => {
    expect(viewSrc).toMatch(/upcomingRows\(db, 14\)\.filter\(\(u\) =>\s*allowItem\(/);
    expect(viewSrc).toMatch(/\[db, effFilters\],?\s*\)/);
  });

  it('#7 allowItem מסנן שורת-קרובים לפי סוג האירוע (טלפונים כבויים ⇒ שורת-call נופלת)', () => {
    const callRow: DayItem = {
      key: 'k',
      label: 'שיחה',
      title: 'שיחה',
      bg: '',
      c: '',
      typeLabel: 'טלפון',
      sort: 1,
      prC: 'transparent',
      ev: { id: 'e1', type: 'call', priority: 'none' } as unknown as DayItem['ev'],
    };
    expect(allowItem(callRow, DEFAULT_FILTERS)).toBe(true);
    expect(allowItem(callRow, { ...DEFAULT_FILTERS, calls: false })).toBe(false);
  });
});
