/**
 * מנוע בדיקת תקינות הנתונים (פורט נאמן מ-runAudit באב-הטיפוס):
 * סורק משפחות · בני משפחה · שיבוצים · תומכים ומחזיר ממצאים ב-8 קטגוריות —
 * כפילויות, ת"ז, טלפון, אימייל, כתובת, לוגיקה, ילדים, קשר. פונקציה טהורה
 * (בלי store/DOM) כדי שתהיה ניתנת לבדיקה ולהרצה חוזרת.
 */
import type { Db, Family } from '../types/domain';
import { validIsraeliId, normName } from './validate';
import { ageOf } from '../components/families/lib';

export type AuditCategory =
  | 'כפילות'
  | 'ת"ז'
  | 'טלפון'
  | 'אימייל'
  | 'כתובת'
  | 'לוגיקה'
  | 'ילדים'
  | 'קשר';

export interface AuditIssue {
  cat: AuditCategory;
  title: string;
  /** מזהה משפחה לפתיחת הכרטיס מהממצא (אם רלוונטי). */
  famId?: string;
  /** מזהה תומך/ת לפתיחת הכרטיס מהממצא (אם רלוונטי). */
  spId?: string;
}

/** צבעי הקטגוריות (רקע · דיו) — זהים לאב-הטיפוס. */
export const AUDIT_CAT_COLORS: Record<AuditCategory, [string, string]> = {
  כפילות: ['#fdeaea', '#b91c1c'],
  'ת"ז': ['#fdf1d4', '#9a6414'],
  טלפון: ['#e7edf5', '#3a5a86'],
  אימייל: ['#efe7f3', '#7c3aed'],
  כתובת: ['#eceae2', '#4d463c'],
  לוגיקה: ['#dff0ec', '#0f766e'],
  ילדים: ['#fbeef3', '#be185d'],
  קשר: ['#f6ead1', '#9a6414'],
};

export const AUDIT_CATEGORIES: AuditCategory[] = [
  'כפילות',
  'ת"ז',
  'טלפון',
  'אימייל',
  'כתובת',
  'לוגיקה',
  'ילדים',
  'קשר',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digits = (x: string | undefined): string => (x || '').replace(/\D/g, '');

/** אבחון תקינות מספר טלפון — מחזיר תיאור הבעיה או null אם תקין. */
export function phoneIssue(p: string | undefined): string | null {
  if (!p || p === '-') return null;
  const d = digits(p);
  if ((d.length === 9 || d.length === 10) && d[0] === '0') return null;
  if (d.length === 8) return 'כנראה חסרה ספרת 0 מובילה: ' + p;
  if (d.length < 7) return 'קצר מדי: ' + p;
  if (d[0] !== '0') return 'לא מתחיל ב-0: ' + p;
  return 'אורך חריג (' + d.length + ' ספרות): ' + p;
}

/**
 * הרצת הביקורת — מחזירה את כל הממצאים (לא ממוינים). הקיבוץ לקטגוריות
 * נעשה בתצוגה. הלוגיקה זהה לאב-הטיפוס עד לפרטי הניסוח.
 */
export function runAudit(db: Db): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const add = (cat: AuditCategory, title: string, famId?: string) => issues.push({ cat, title, famId });
  // הגנה מפני נתונים מיובאים פגומים — כלי הבדיקה לעולם לא קורס על מה שהוא בודק
  const members = (f: Family) => (Array.isArray(f.members) ? f.members : []);

  // ——— כפילויות משפחה: שם+אם · טלפון משותף · ת"ז משותפת ———
  const g1: Record<string, Family[]> = {};
  const g2: Record<string, Family[]> = {};
  const g3: Record<string, Family[]> = {};
  for (const f of (Array.isArray(db.families) ? db.families : [])) {
    const k1 = normName(f.name) + '|' + normName(f.mother || '');
    (g1[k1] = g1[k1] || []).push(f);
    for (const p of [f.phone, f.phone2]) {
      const d = digits(p);
      if (d.length >= 7) (g2[d] = g2[d] || []).push(f);
    }
    for (const idn of [f.fatherId, f.motherId]) {
      const d = digits(idn);
      if (d.length >= 5) (g3[d] = g3[d] || []).push(f);
    }
  }
  for (const k in g1) {
    const a = g1[k];
    if (a.length > 1 && !k.endsWith('|'))
      add('כפילות', 'שם + שם האם זהים: "' + a[0].name + '" — ' + a.length + ' רשומות', a[0].id);
  }
  const seenPair = new Set<string>();
  for (const k in g2) {
    const a = [...new Set(g2[k])];
    if (a.length > 1) {
      const key = a.map((f) => f.id).sort().join();
      if (!seenPair.has(key)) {
        seenPair.add(key);
        add('כפילות', 'טלפון ' + k + ' משותף ל-' + a.length + ' משפחות: ' + a.map((f) => f.name).slice(0, 3).join(', '), a[0].id);
      }
    }
  }
  for (const k in g3) {
    const a = [...new Set(g3[k])];
    if (a.length > 1) add('כפילות', 'ת"ז ' + k + ' מופיעה ב-' + a.length + ' משפחות: ' + a.map((f) => f.name).slice(0, 2).join(', '), a[0].id);
  }

  // ——— בדיקות פר-משפחה ———
  for (const f of (Array.isArray(db.families) ? db.families : [])) {
    for (const [idn, who] of [[f.fatherId, 'אב'], [f.motherId, 'אם']] as [string, string][]) {
      const d = digits(idn);
      if (d.length && !validIsraeliId(d)) add('ת"ז', 'משפחת ' + f.name + ': ת"ז ' + who + ' לא עוברת ספרת ביקורת (' + idn + ')', f.id);
    }
    for (const p of [f.phone, f.phone2]) {
      const pi = phoneIssue(p);
      if (pi) add('טלפון', 'משפחת ' + f.name + ': ' + pi, f.id);
    }
    if (f.email && !EMAIL_RE.test(f.email)) add('אימייל', 'משפחת ' + f.name + ': אימייל לא תקין (' + f.email + ')', f.id);
    if (f.status !== 'inactive') {
      if (!f.city) add('כתובת', 'משפחת ' + f.name + ': חסרה עיר', f.id);
      else if (!f.address) add('כתובת', 'משפחת ' + f.name + ': יש עיר אבל חסרה כתובת', f.id);
    }
    const single = f.maritalStatus === 'אלמן/ה' || f.maritalStatus === 'גרושים' || f.maritalStatus === 'פרודים';
    if (single && f.father && f.mother)
      add('לוגיקה', 'משפחת ' + f.name + ': מסומנת "' + f.maritalStatus + '" — אמורה להיות בלי בן/בת זוג, אבל רשומים שניים (' + f.father + ' + ' + f.mother + ')', f.id);
    else if (single && digits(f.fatherId) && digits(f.motherId))
      add('לוגיקה', 'משפחת ' + f.name + ': מסומנת "' + f.maritalStatus + '" אבל רשומות שתי תעודות זהות של בני זוג', f.id);
    if (f.maritalStatus === 'נשואים' && f.status === 'active' && !f.father && !f.mother)
      add('לוגיקה', 'משפחת ' + f.name + ': מסומנת נשואים אבל לא רשום אף בן זוג', f.id);
    if (!digits(f.phone) && !digits(f.phone2) && !f.email) add('קשר', 'משפחת ' + f.name + ': אין שום פרט קשר (טלפון או אימייל)', f.id);

    const seenKid = new Set<string>();
    for (const m of members(f)) {
      if (m.isParent) {
        if (m.idNum && !validIsraeliId(m.idNum)) add('ת"ז', 'משפחת ' + f.name + ': ת"ז של ' + m.first + ' (הורה) לא תקינה', f.id);
        continue;
      }
      if (!m.birth) add('ילדים', 'משפחת ' + f.name + ': ל' + m.first + ' אין תאריך לידה', f.id);
      else {
        const a = ageOf(m.birth);
        if (a != null && (a < 0 || a > 25)) add('ילדים', 'משפחת ' + f.name + ': גיל חריג ל' + m.first + ' (' + a + ')', f.id);
      }
      if (m.idNum && !validIsraeliId(m.idNum)) add('ת"ז', 'משפחת ' + f.name + ': ת"ז של ' + m.first + ' לא תקינה', f.id);
      const mp = phoneIssue(m.phone);
      if (mp) add('טלפון', 'משפחת ' + f.name + ': טלפון של ' + m.first + ' — ' + mp, f.id);
      const kk = m.first + '|' + (m.birth || '');
      if (seenKid.has(kk)) add('כפילות', 'משפחת ' + f.name + ': הילד/ה ' + m.first + ' מופיע/ה פעמיים', f.id);
      seenKid.add(kk);
    }
  }

  // ——— לוגיקה: תשלום-יתר בשיבוצים ———
  for (const e of (Array.isArray(db.enrollments) ? db.enrollments : [])) {
    const paid = (e.payments || []).reduce((a, x) => a + x.amount, 0);
    if (e.totalDue && paid > e.totalDue) {
      const fam = db.families.find((f2) => members(f2).some((m2) => m2.id === e.memberId));
      if (fam) add('לוגיקה', 'משפחת ' + fam.name + ': שולם ₪' + paid + ' — יותר מסה"כ העסקה (₪' + e.totalDue + '). בדקו החזר או עדכנו את הסכום', fam.id);
    }
  }

  // ——— תומכים: ת"ז לא תקינה · טלפון · כפילות שם · אי-התאמת מצבור/פירוט ———
  const supByName: Record<string, string[]> = {};
  for (const sp of (Array.isArray(db.supporters) ? db.supporters : [])) {
    if (sp.idNum && digits(sp.idNum).length && !validIsraeliId(sp.idNum))
      issues.push({ cat: 'ת"ז', title: 'תומכ/ת ' + sp.name + ': ת"ז לא תקינה (' + sp.idNum + ')', spId: sp.id });
    const pi = phoneIssue(sp.phone);
    if (pi) issues.push({ cat: 'טלפון', title: 'תומכ/ת ' + sp.name + ': ' + pi, spId: sp.id });
    if (sp.email && !EMAIL_RE.test(sp.email)) issues.push({ cat: 'אימייל', title: 'תומכ/ת ' + sp.name + ': אימייל לא תקין (' + sp.email + ')', spId: sp.id });
    // עקביות מצבור מול פירוט התרומות — הכרטיס מציג sp.ils/usd אך לוח הבית סוכם את
    // sp.donations; פער ביניהם (מיובא/נערך ידנית) גורם לשני מסכים להראות סכומים שונים.
    const dons = Array.isArray(sp.donations) ? sp.donations : [];
    const sumIls = dons.filter((d) => d.cur !== '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    const sumUsd = dons.filter((d) => d.cur === '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    const off = (a: number, b: number) => Math.abs((a || 0) - (b || 0)) > 0.5;
    if (off(sp.ils, sumIls) || off(sp.usd, sumUsd) || (sp.count || 0) !== dons.length)
      issues.push({
        cat: 'לוגיקה',
        title:
          'תומכ/ת ' + sp.name + ': הסכום המצטבר הרשום (₪' + (sp.ils || 0) +
          (sp.usd ? ' + $' + sp.usd : '') + ' · ' + (sp.count || 0) + ' תרומות) לא תואם את פירוט התרומות (₪' +
          sumIls + (sumUsd ? ' + $' + sumUsd : '') + ' · ' + dons.length + ' תרומות)',
        spId: sp.id,
      });
    const nk = normName(sp.name);
    if (nk) (supByName[nk] = supByName[nk] || []).push(sp.id);
  }
  for (const k in supByName) {
    if (supByName[k].length > 1) {
      const sp = db.supporters.find((x) => x.id === supByName[k][0]);
      if (sp) issues.push({ cat: 'כפילות', title: 'תומכ/ת בשם "' + sp.name + '" מופיע/ה ' + supByName[k].length + ' פעמים', spId: sp.id });
    }
  }

  return issues;
}

/** שורות דוח טקסט לייצוא (exportAudit). */
export function auditReportLines(orgName: string, issues: AuditIssue[], nowLabel: string): string[] {
  const L = ['דוח תקינות נתונים — ' + (orgName || 'מאור החסד'), 'הופק: ' + nowLabel, ''];
  for (const i of issues) L.push('[' + i.cat + '] ' + i.title);
  return L;
}
