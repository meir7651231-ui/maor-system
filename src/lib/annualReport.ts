/**
 * 📄 דוח-שנתי-לתורם (ROADMAP-100 ‏#4) — מסמך מרוכז של כל תרומות שנת-המס
 * (שנה לועזית — כך דורש מס-הכנסה) לתורם/ת: טבלת-תרומות, סיכומי ₪/$,
 * ואזכור-§46 כשמספר-העמותה קיים. אותה תבנית-טקסט כמו הקבלות (BOM, Notepad).
 *
 * ⚠️ גבול-תפקיד: זה **דוח-ריכוז** לנוחות התורם/הרו"ח — לא קבלה חדשה ולא
 * תחליף-קבלות; מספרי-הקבלות המקוריים (D-/R-) מוצגים בכל שורה.
 */
import { guardExport } from './exportGate';

export interface AnnualDonation {
  date: string;
  amount: number;
  /** '₪' (ברירת-מחדל) או '$'. */
  cur?: string;
  rid?: string;
  designation?: string;
}

export interface AnnualReportInput {
  orgName: string;
  orgTaxId?: string;
  supporterName: string;
  payerId?: string;
  /** שנת-מס לועזית 'YYYY'. */
  year: string;
  donations: AnnualDonation[];
  site?: string;
  /**
   * נחיל ב׳ (3.9 · TP-15): מונחי-ורטיקל אופציונליים — חבילות מסחריות מחליפות 'תרומות' ב'רכישות'/
   * 'תשלומים' (entity.donations) אך הדוח-להורדה נשאר 'תרומות'. חסר ⇒ ביט-זהה ללקוח-החי.
   * ⚠️ שורות-§46 (סעיף 46 / "אינו קבלה") = נוסח-משפטי, לא עוברות termOf (הכרעת-בעלים/רו"ח).
   */
  terms?: AnnualReportTerms;
}

/** מונחים לדוח-השנתי — ברירות-המחדל = הליטרלים ההיסטוריים ('תרומות' / 'התורם/ת' / 'תורמים'). */
export interface AnnualReportTerms {
  donations?: string;
  supporter?: string;
  supporters?: string;
}

/** השנים שבהן יש לתורם/ת תרומות — יורד (החדשה ראשונה). */
export function donationYears(donations: AnnualDonation[]): string[] {
  return [...new Set(donations.map((d) => (d.date || '').slice(0, 4)).filter((y) => /^\d{4}$/.test(y)))].sort().reverse();
}

/** תרומות השנה בלבד, ממוינות עולה לפי תאריך. */
export function donationsOfYear(donations: AnnualDonation[], year: string): AnnualDonation[] {
  return donations.filter((d) => (d.date || '').startsWith(year + '-')).sort((a, b) => a.date.localeCompare(b.date));
}

function money(amount: number, cur?: string): string {
  return (cur === '$' ? '$' : '₪') + amount.toLocaleString('he-IL');
}

/** שורות-הדוח — טהור (בלי DOM); נבדק שורה-שורה. */
export function annualReportLines(inp: AnnualReportInput): string[] {
  const rows = donationsOfYear(inp.donations, inp.year);
  const ils = rows.filter((d) => d.cur !== '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
  const usd = rows.filter((d) => d.cur === '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
  // מונחים (TP-15): חסר ⇒ הליטרל ההיסטורי — הפלט ביט-זהה
  const D = inp.terms?.donations ?? 'תרומות';
  const S = inp.terms?.supporter ?? 'התורם/ת';
  const out: string[] = [
    '='.repeat(46),
    '        דוח ' + D + ' שנתי — שנת ' + inp.year,
    '='.repeat(46),
    '',
    'הארגון: ' + inp.orgName,
    ...(inp.orgTaxId ? ['מס׳ עמותה/מלכ"ר: ' + inp.orgTaxId] : []),
    S + ': ' + inp.supporterName + (inp.payerId ? ' · ת"ז ' + inp.payerId : ''),
    '',
    '-'.repeat(46),
  ];
  if (rows.length === 0) {
    out.push('אין ' + D + ' רשומות בשנת ' + inp.year + '.');
  } else {
    for (const d of rows) {
      out.push(
        d.date + '  ' + money(d.amount, d.cur).padStart(12) + (d.rid ? '  קבלה ' + d.rid : '') + (d.designation ? '  · ' + d.designation : ''),
      );
    }
  }
  out.push('-'.repeat(46));
  out.push('סה"כ ' + rows.length + ' ' + D + ' בשנת ' + inp.year);
  if (ils > 0) out.push('סה"כ בשקלים: ' + money(ils));
  if (usd > 0) out.push('סה"כ בדולרים: ' + money(usd, '$'));
  if (inp.orgTaxId) {
    out.push('');
    out.push('לארגון אישור מוסד ציבורי לעניין תרומות לפי סעיף 46 לפקודת מס הכנסה.');
    out.push('דוח-ריכוז זה אינו קבלה — הקבלות המקוריות צוינו לצד כל תרומה.');
  }
  if (inp.site) {
    out.push('');
    out.push(inp.site);
  }
  return out;
}

/** דוח-מרוכז לכל התורמים של שנה — מקטע לכל תורם/ת עם מפריד-עמוד. */
export function annualAllLines(
  orgName: string,
  orgTaxId: string | undefined,
  year: string,
  supporters: Array<{ name: string; idNum?: string; donations: AnnualDonation[] }>,
  site?: string,
  terms?: AnnualReportTerms,
): string[] {
  const out: string[] = [];
  let count = 0;
  for (const sp of supporters) {
    if (donationsOfYear(sp.donations, year).length === 0) continue;
    if (count > 0) out.push('', '\f', '');
    out.push(
      ...annualReportLines({ orgName, orgTaxId, supporterName: sp.name, payerId: sp.idNum, year, donations: sp.donations, site, terms }),
    );
    count++;
  }
  // TP-15: פרמטר-זנב אופציונלי — חסר ⇒ 'תורמים'/'תרומות' ההיסטוריים (ביט-זהה)
  if (count === 0) out.push('אין ' + (terms?.supporters ?? 'תורמים') + ' עם ' + (terms?.donations ?? 'תרומות') + ' בשנת ' + year + '.');
  return out;
}

/** הורדת-קובץ עם BOM (עברית ב-Notepad) — כמו הקבלות. */
export function downloadAnnualReport(filename: string, lines: string[]): void {
  if (!guardExport()) return; // 🔐 שער יציאת-מידע (core.export כבוי בכרטיס-העובד)
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
