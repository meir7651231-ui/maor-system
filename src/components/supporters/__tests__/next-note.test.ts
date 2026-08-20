/**
 * ratchet — "על מה לדבר בפעם הבאה" (nextNote): תזכורת-אג'נדה חופשית לקשר-הבא בתורמים.
 * שדה additive על Supporter (אפס מיגרציה); נערך בכרטיס "קשר הבא", מוצג בקוקפיט ובחייגן.
 * הבקשה: "בתורמים בקשר הבא שיהיה אפשרות להקלדה על מה צריך לדבר / מה התזכורת".
 */
import { describe, expect, it } from 'vitest';
import domainSrc from '../../../types/domain.ts?raw';
import detailSrc from '../SupporterDetail.tsx?raw';
import dialerSrc from '../../dialer/DialerModal.tsx?raw';
import cockpitSrc from '../cockpit.ts?raw';

describe('📝 ratchet — תזכורת קשר-הבא (nextNote)', () => {
  it('domain: Supporter קיבל nextNote אופציונלי (additive, ליד nextDate)', () => {
    expect(domainSrc).toMatch(/nextNote\?:\s*string/);
  });

  it('SupporterDetail: שדה-הקלדה "על מה לדבר בפעם הבאה" + שמירה ב-blur + תצוגה', () => {
    expect(detailSrc).toContain('על מה לדבר בפעם הבאה');
    expect(detailSrc).toContain('nextNoteDraft');
    expect(detailSrc).toContain('saveNextNote');
    expect(detailSrc).toContain('onBlur={saveNextNote}');
    // התזכורת נכנסת גם ל-notes של אירוע-הלוח המקושר (מה, לא רק מתי)
    expect(detailSrc).toContain('nextEventNotes(');
    // תצוגת התזכורת כשקיימת
    expect(detailSrc).toMatch(/sp\.nextNote \?/);
  });

  it('DialerModal: התזכורת מוצגת לפני החיוג ("לדבר על")', () => {
    expect(dialerSrc).toContain('sp.nextNote');
    expect(dialerSrc).toContain('לדבר על');
  });

  it('cockpit: התזכורת מצטרפת לסיבת-המשימה (📝)', () => {
    expect(cockpitSrc).toMatch(/sp\.nextNote \? ' · 📝 ' \+ sp\.nextNote/);
  });
});
