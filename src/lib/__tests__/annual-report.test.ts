/**
 * ratchet — דוח-שנתי-לתורם (ROADMAP-100 ‏#4). דוח-ריכוז לשנת-מס לועזית:
 * סינון-שנה, סיכומי ₪/$ נפרדים, אזכור-הקבלות-המקוריות, נוסח-§46 רק כשיש
 * מספר-עמותה, והבהרת "אינו קבלה" (גבול-רגולציה — לא מנפיקים מסמך-מס חדש).
 */
import { describe, expect, it } from 'vitest';
import { annualAllLines, annualReportLines, donationYears, donationsOfYear } from '../annualReport';
import supDetailSrc from '../../components/supporters/SupporterDetail.tsx?raw';
import supViewSrc from '../../components/supporters/SupportersView.tsx?raw';

const DONS = [
  { date: '2026-01-05', amount: 200, cur: '₪', rid: 'D-3' },
  { date: '2026-07-10', amount: 100, cur: '$', rid: 'D-9' },
  { date: '2025-12-31', amount: 50, cur: '₪', rid: 'D-1' },
  { date: '2026-03-01', amount: 300, rid: 'R-2', designation: 'אמץ חתן' },
];

describe('📄 ratchet — דוח שנתי לתורם', () => {
  it('donationYears: שנים ייחודיות, החדשה ראשונה; donationsOfYear מסנן וממיין', () => {
    expect(donationYears(DONS)).toEqual(['2026', '2025']);
    const y26 = donationsOfYear(DONS, '2026');
    expect(y26.map((d) => d.rid)).toEqual(['D-3', 'R-2', 'D-9']); // ממוין עולה בתאריך
  });

  it('שורות-הדוח: כותרת-שנה, שורה-לתרומה עם קבלה+ייעוד, סיכומי ₪/$ נפרדים', () => {
    const lines = annualReportLines({
      orgName: 'מאור החסד', orgTaxId: '580123456', supporterName: 'ר׳ כהן', payerId: '012345678',
      year: '2026', donations: DONS,
    });
    const text = lines.join('\n');
    expect(text).toContain('דוח תרומות שנתי — שנת 2026');
    expect(text).toContain('ר׳ כהן · ת"ז 012345678');
    expect(text).toContain('קבלה D-3');
    expect(text).toContain('אמץ חתן');
    expect(text).not.toContain('D-1'); // תרומת 2025 לא בשנת 2026
    expect(text).toContain('סה"כ 3 תרומות בשנת 2026');
    expect(text).toContain('סה"כ בשקלים: ₪500');
    expect(text).toContain('סה"כ בדולרים: $100');
    // §46 + הבהרת אינו-קבלה — רק כשיש מספר-עמותה
    expect(text).toContain('סעיף 46');
    expect(text).toContain('אינו קבלה');
  });

  it('בלי מספר-עמותה — אין נוסח-§46; שנה ריקה — הודעה ברורה', () => {
    const noTax = annualReportLines({ orgName: 'א', supporterName: 'ב', year: '2026', donations: DONS }).join('\n');
    expect(noTax).not.toContain('סעיף 46');
    const empty = annualReportLines({ orgName: 'א', supporterName: 'ב', year: '2020', donations: DONS }).join('\n');
    expect(empty).toContain('אין תרומות רשומות בשנת 2020');
  });

  it('annualAllLines: מקטע רק למי-שתרם-בשנה; מפריד-עמוד; אפס-תורמים ⇒ הודעה', () => {
    const all = annualAllLines('ארגון', undefined, '2026', [
      { name: 'כהן', donations: DONS },
      { name: 'לוי', donations: [{ date: '2024-01-01', amount: 10 }] }, // לא ב-2026
    ]).join('\n');
    expect(all).toContain('כהן');
    expect(all).not.toContain('לוי');
    const none = annualAllLines('ארגון', undefined, '1999', [{ name: 'כהן', donations: DONS }]).join('\n');
    expect(none).toContain('אין תורמים עם תרומות בשנת 1999');
  });

  it('🛡 הגנת-מקור: שני הכפתורים מגודרים supporters.annualreport', () => {
    expect(supDetailSrc).toContain("featureOn(config, 'supporters.annualreport')");
    expect(supViewSrc).toContain("featureOn(config, 'supporters.annualreport')");
  });
});
