/**
 * מנוע-האותות — **מה השתנה** אצל התורם. מזהה חריגות-דפוס שה-RFM הסטטי מפספס:
 * מתנה שצנחה מול הממוצע האישי, קפיצה חריגה, חזרה-אחרי-נטישה, תורם-חדש-לטיפוח, וגולש.
 *
 * טהור ודטרמיניסטי — כל אות נגזר מרצף-הנתינה הממוין של התורם (בלי Date.now). מעבר
 * פר-תורם O(אירועיו) ⇒ O(סה"כ) למסך שלם, מתאים לעשרות-אלפי תרומות.
 */
import type { Supporter } from '../../types/domain';
import { dayDiff } from './intel';

export type SignalKind = 'drop' | 'jump' | 'reactivated' | 'firstgift' | 'lapsing';

export interface DonorSignal {
  id: string;
  name: string;
  kind: SignalKind;
  /** תיאור-אנוש קצר (עברית). */
  detail: string;
  /** עוצמת-האות למיון (גדול=דחוף/משמעותי יותר). */
  magnitude: number;
  /** שווי-חיים (ש"ח-שקול) — לתעדוף לפי-כסף. */
  ils: number;
}

interface Ev { date: string; ils: number; }

function events(sp: Supporter, rate: number): Ev[] {
  const out: Ev[] = [];
  const push = (date: string, amount: number, cur?: string) => {
    if (!date) return;
    out.push({ date: date.slice(0, 10), ils: (cur || '₪') === '$' ? amount * rate : amount });
  };
  const dons = sp.donations;
  for (let i = 0; i < dons.length; i++) push(dons[i].date, dons[i].amount, dons[i].cur);
  const hist = sp.hist;
  if (hist) for (let i = 0; i < hist.length; i++) push(hist[i].d, hist[i].a, hist[i].c);
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/** ספים (מיוצאים לבדיקות/כוונון). */
export const SIGNAL = {
  RECENT_DAYS: 90,      // "טרי" = מתנה ב-90 יום
  GAP_DAYS: 365,        // "חזרה" = פער ≥ שנה ואז מתנה טרייה
  DROP_RATIO: 0.5,      // מתנה < 50% מהממוצע-הקודם
  JUMP_RATIO: 2,        // מתנה > פי-2 מהממוצע-הקודם
  LAPSING_DAYS: 240,    // תורם-ותיק ששקט מעל 240 יום
} as const;

/** האותות של תורם-יחיד (0 או יותר). */
export function donorSignals(sp: Supporter, todayIso: string, rate = 3.7): DonorSignal[] {
  const ev = events(sp, rate);
  if (ev.length === 0) return [];
  const id = sp.id, name = sp.name || 'ללא שם';
  const total = ev.reduce((a, e) => a + e.ils, 0);
  const last = ev[ev.length - 1];
  const sinceLast = dayDiff(last.date, todayIso);
  const out: DonorSignal[] = [];

  // תורם-חדש — מתנה יחידה וטרייה (לטיפוח).
  if (ev.length === 1 && sinceLast <= SIGNAL.RECENT_DAYS) {
    out.push({ id, name, kind: 'firstgift', detail: 'תורם חדש · מתנה ראשונה', magnitude: 40, ils: total });
  }

  if (ev.length >= 2) {
    const prev = ev.slice(0, -1);
    const prevAvg = prev.reduce((a, e) => a + e.ils, 0) / prev.length;
    const gapBeforeLast = dayDiff(prev[prev.length - 1].date, last.date);

    // חזרה-אחרי-נטישה — פער גדול לפני המתנה-האחרונה, והיא טרייה.
    if (gapBeforeLast >= SIGNAL.GAP_DAYS && sinceLast <= SIGNAL.RECENT_DAYS) {
      out.push({ id, name, kind: 'reactivated', detail: 'חזר לתת אחרי ' + Math.round(gapBeforeLast / 30) + ' חודשי-שקט', magnitude: 70, ils: total });
    }
    // נפילת-מתנה — האחרונה קטנה משמעותית מהממוצע (רק על ותק ≥3, לצמצום-רעש).
    if (ev.length >= 3 && prevAvg > 0 && last.ils < prevAvg * SIGNAL.DROP_RATIO) {
      const pct = Math.round((1 - last.ils / prevAvg) * 100);
      out.push({ id, name, kind: 'drop', detail: 'מתנה אחרונה נמוכה ב-' + pct + '% מהרגיל', magnitude: 55 + Math.min(30, pct / 2), ils: total });
    }
    // קפיצה — האחרונה גדולה משמעותית (הזדמנות).
    if (prevAvg > 0 && last.ils > prevAvg * SIGNAL.JUMP_RATIO) {
      const mult = (last.ils / prevAvg).toFixed(1);
      out.push({ id, name, kind: 'jump', detail: 'מתנה אחרונה פי-' + mult + ' מהרגיל', magnitude: 50, ils: total });
    }
    // גולש — תורם-ותיק ששקט הרבה (לא מתנה-בודדת ולא חדש).
    if (sinceLast >= SIGNAL.LAPSING_DAYS) {
      out.push({ id, name, kind: 'lapsing', detail: 'שקט ' + Math.round(sinceLast / 30) + ' חודשים', magnitude: 45 + Math.min(35, sinceLast / 30), ils: total });
    }
  }

  return out;
}

export interface PortfolioSignals {
  /** מונה פר-סוג-אות. */
  counts: Record<SignalKind, number>;
  /** ה"מזיזים" — כל האותות ממויינים לפי עוצמה×כסף (החשובים ראשונים). */
  movers: DonorSignal[];
  /** סה"כ אותות. */
  total: number;
}

/** אגרגציית-אותות על כל התיק. movers מוגבל ל-limit (ברירת-מחדל 40) לתצוגה. */
export function portfolioSignals(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
  limit = 40,
): PortfolioSignals {
  const counts: Record<SignalKind, number> = { drop: 0, jump: 0, reactivated: 0, firstgift: 0, lapsing: 0 };
  const all: DonorSignal[] = [];
  for (const sp of supporters) {
    const sigs = donorSignals(sp, todayIso, rate);
    for (const s of sigs) { counts[s.kind]++; all.push(s); }
  }
  // דירוג: עוצמה ראשית, ואז כסף — כדי שה"מזיזים" הגדולים יצופו ראשונים.
  all.sort((a, b) => (b.magnitude - a.magnitude) || (b.ils - a.ils));
  return { counts, movers: all.slice(0, limit), total: all.length };
}
