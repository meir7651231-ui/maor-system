/**
 * ייצוא-המודיעין — שורות-CSV של כל התורמים עם עומק-הנתונים המלא (RFM · LTV · תחזית ·
 * סיכון · קצב-עונתי · אותות). מרכז כל המנועים הטהורים לשורה-לתורם. טהור ודטרמיניסטי.
 */
import type { Supporter } from '../../types/domain';
import { donorIntel } from './intel';
import { supTier } from './lib';
import { donorRhythm } from './seasonality';
import { donorSignals, type SignalKind } from './signals';

const MONTHS_HE = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
const SIGNAL_HE: Record<SignalKind, string> = {
  drop: 'ירידה', jump: 'קפיצה', reactivated: 'חזרה', firstgift: 'חדש', lapsing: 'גולש',
};

/** כותרת + שורה-לתורם (רק תורמים עם היסטוריית-נתינה). */
export function intelCsvRows(supporters: readonly Supporter[], todayIso: string, rate = 3.7): string[][] {
  const head = [
    'שם', 'קטגוריה', 'טלפון', 'אימייל', 'מתנות', 'ציון RFM', 'דרגה', 'LTV (₪)',
    'מתנה ממוצעת', 'סיכון נטישה %', 'תחזית סכום', 'תחזית תאריך', 'ביטחון %',
    'חודש שיא', 'עונתי', 'אותות',
  ];
  const rows: string[][] = [head];
  for (const sp of supporters) {
    const intel = donorIntel(sp, todayIso, rate);
    if (intel.scan.count === 0) continue;
    const tier = supTier(intel.rfm.score);
    const rhythm = donorRhythm(sp, rate);
    const sigs = donorSignals(sp, todayIso, rate).map((s) => SIGNAL_HE[s.kind]);
    rows.push([
      sp.name || 'ללא שם',
      sp.cat || '',
      sp.phone || '',
      sp.email || '',
      String(intel.scan.count),
      String(intel.rfm.score),
      tier.label,
      String(intel.ltv),
      String(intel.avgGift),
      String(intel.churn),
      intel.forecast ? String(intel.forecast.amount) : '',
      intel.forecast ? intel.forecast.dueIso : '',
      intel.forecast ? String(intel.forecast.confidence) : '',
      rhythm.topMonth ? MONTHS_HE[rhythm.topMonth - 1] : '',
      rhythm.seasonal ? 'כן' : '',
      sigs.join(' · '),
    ]);
  }
  return rows;
}
