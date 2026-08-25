/**
 * ratchet · שליחה-מרובה (בקשת-בעלים 26.8) — מגן על החיווט במסך-התורמים:
 * - הכפתורים גדורים ‏integrationOn(mail/whatsapp)+cloudOn+bulkGranted;
 * - הספירה על הכפתור משתמשת ברשימת-הנמענים-בפועל (bulkMailRecipients/bulkWaRecipients),
 *   לא ב-`selSet.size` הגולמי (חוזה: N בכפתור = מה-שיישלח בפועל, אחרי דדופ);
 * - שני המודאלים מרונדרים.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';

describe('💛 ratchet — שליחה-מרובה של מייל+וואטסאפ', () => {
  it('🛡 מייבא מהלוגיקה הטהורה', () => {
    expect(viewSrc).toContain("from '../../lib/bulkContact'");
    expect(viewSrc).toContain('bulkMailRecipients');
    expect(viewSrc).toContain('bulkWaRecipients');
    expect(viewSrc).toContain("from '../../lib/wa'");
    expect(viewSrc).toMatch(/import\s+\{\s*waLink\s*\}/);
  });

  it('🛡 כפתור-המייל דורש הרחבת-מייל+ענן+הרשאה', () => {
    // integrationOn(mail) & cloudOn & bulkGranted(bulkmail) — כולם ב-guard-אחד
    expect(viewSrc).toMatch(/integrationOn\(config, 'mail'\)\s*&&\s*cloudOn/);
    expect(viewSrc).toContain("bulkGranted('supporters.bulkmail')");
    expect(viewSrc).toContain('📧 מייל למסומנים · ');
  });

  it('🛡 כפתור-הוואטסאפ דורש הרחבת-וואטסאפ+הרשאה', () => {
    expect(viewSrc).toMatch(/integrationOn\(config, 'whatsapp'\)/);
    expect(viewSrc).toContain("bulkGranted('supporters.bulkwa')");
    expect(viewSrc).toContain('💬 וואטסאפ למסומנים · ');
  });

  it('🛡 חוזה-הספירה: N בכפתור = mails.length / was.length (לא selSet.size)', () => {
    // ‏selSet.size הוא רק guard-קדם; הספירה המוצגת = mails.length/was.length
    expect(viewSrc).toContain("'📧 מייל למסומנים · ' + mails.length");
    expect(viewSrc).toContain("'💬 וואטסאפ למסומנים · ' + was.length");
  });

  it('🛡 המודאלים מרונדרים כשמסמנים ומצבם מטופל', () => {
    expect(viewSrc).toContain('bulkMailOpen');
    expect(viewSrc).toContain('bulkWaOpen');
    // מייל: שולח דרך התור (writeMailOutbox) — ולא מייצר קבלה
    expect(viewSrc).toContain('writeMailOutbox');
    // וואטסאפ: wa.me עם anchor + סימון-נפתחו (bulkWaSent)
    expect(viewSrc).toContain('waLink(r.phone, text)');
    expect(viewSrc).toContain('bulkWaSent');
  });
});
