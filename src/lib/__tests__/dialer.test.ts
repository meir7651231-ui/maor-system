/**
 * רצ'ט — מנוע החייגן-המונחה (lib/dialer) + מתאם-הנהג (telephony/driver).
 * מכונת-המצב: תור לפי-סדר, תוצאה-סופית מסירה, לא-ענה/דלג מחזירים לסוף-התור,
 * מדד-התקדמות. הנהג-הידני = tel: בלבד (downstream, בלי autoDial/record) — כדי
 * שהמעבר לקופסת-GSM עתידית יהיה החלפת-נהג ולא בנייה-מחדש.
 */
import { describe, expect, it } from 'vitest';
import { startCampaign, currentId, applyOutcome, progress, isDone, REQUEUE_OUTCOMES, TERMINAL_OUTCOMES } from '../dialer';
import { manualDriver, activeDriver } from '../telephony/driver';
import dialerSrc from '../../components/dialer/DialerModal.tsx?raw';
import supViewSrc from '../../components/supporters/SupportersView.tsx?raw';

const T = '2026-08-16T10:00:00.000Z';

describe('☎️ חייגן-מונחה — מכונת-המצב', () => {
  it('startCampaign: דדופ + שמירת-סדר + total', () => {
    const c = startCampaign('קמפיין', ['a', 'b', '', 'a', 'c'], T);
    expect(c.queue).toEqual(['a', 'b', 'c']);
    expect(c.total).toBe(3);
    expect(c.log).toEqual([]);
    expect(currentId(c)).toBe('a');
  });

  it('תוצאה-סופית (תרם) מסירה מהתור ומקדמת', () => {
    let c = startCampaign('k', ['a', 'b'], T);
    c = applyOutcome(c, 'donated', 'תרם 100', T);
    expect(c.queue).toEqual(['b']);
    expect(currentId(c)).toBe('b');
    expect(c.log[0]).toMatchObject({ id: 'a', outcome: 'donated', note: 'תרם 100' });
  });

  it('לא-ענה/דלג מחזירים את המתקשר לסוף-התור (requeue)', () => {
    let c = startCampaign('k', ['a', 'b'], T);
    c = applyOutcome(c, 'noanswer', '', T);
    expect(c.queue).toEqual(['b', 'a']); // a חזר לסוף
    c = applyOutcome(c, 'skip', '', T);
    expect(c.queue).toEqual(['a', 'b']); // b חזר לסוף
    expect(REQUEUE_OUTCOMES).toContain('noanswer');
    expect(TERMINAL_OUTCOMES).toContain('donated');
  });

  it('progress: finalized/remaining/counts', () => {
    let c = startCampaign('k', ['a', 'b', 'c'], T);
    c = applyOutcome(c, 'donated', '', T); // a נסגר
    c = applyOutcome(c, 'noanswer', '', T); // b חזר לתור
    let p = progress(c);
    expect(p.total).toBe(3);
    expect(p.remaining).toBe(2); // b (חזר) + c
    expect(p.finalized).toBe(1); // רק a
    expect(p.counts.donated).toBe(1);
    expect(p.counts.noanswer).toBe(1);
  });

  it('זרימה מלאה — כולל סגירת מי-שחזר-לתור', () => {
    let c = startCampaign('k', ['a', 'b', 'c'], T);
    c = applyOutcome(c, 'noanswer', '', T); // a→סוף: [b,c,a]
    c = applyOutcome(c, 'donated', '', T); // b נסגר: [c,a]
    c = applyOutcome(c, 'refused', '', T); // c נסגר: [a]
    expect(isDone(c)).toBe(false);
    c = applyOutcome(c, 'callback', '', T); // a נסגר: []
    expect(isDone(c)).toBe(true);
    expect(currentId(c)).toBeNull();
    const p = progress(c);
    expect(p.finalized).toBe(3);
    expect(p.remaining).toBe(0);
  });

  it('applyOutcome בלי מתקשר-נוכחי = no-op', () => {
    const c = startCampaign('k', [], T);
    expect(applyOutcome(c, 'donated', '', T)).toBe(c);
  });
});

describe('☎️ מתאם-הנהג (adapter)', () => {
  it('נהג-ידני: tel: בלבד, בלי autoDial/record (downstream)', () => {
    expect(activeDriver()).toBe(manualDriver);
    expect(manualDriver.capabilities.autoDial).toBe(false);
    expect(manualDriver.capabilities.record).toBe(false);
    expect(manualDriver.capabilities.screenPop).toBe(true);
    expect(manualDriver.callHref('050-1234567')).toMatch(/^tel:/);
    expect(manualDriver.callHref('123')).toBeNull(); // מספר-קצר לא-תקין
  });

  it('🔒 הגנת-מקור: החייגן דרך termOf, מגודר telephonyOn, נהג במתאם', () => {
    // התוויות עוברות מילון-המונחים (לא "תורם" קשיח)
    expect(dialerSrc).toContain("termOf(config, 'entity.supporter'");
    expect(dialerSrc).toContain('activeDriver()');
    expect(dialerSrc).not.toContain('window.confirm'); // בלי דיאלוג ילידי
    // הכניסה מגודרת מודול-הטלפוניה
    expect(supViewSrc).toContain('telephonyOn(config)');
    expect(supViewSrc).toContain('dialerStart(');
  });
});
