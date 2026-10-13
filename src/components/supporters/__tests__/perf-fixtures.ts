/**
 * מחולל-תורמים דטרמיניסטי (PRNG זרוע) לבדיקות-השקילות של צינור-הרשימה (⚡ 12.10.2026)
 * ולמדידת-הביצועים. מכסה את מקרי-הקצה של הסכימה החיה: hist ריק/חסר, שורות '$',
 * סכומים שליליים/אפס (זיכויים), שדות חסרים (ils/usd/count/last/cat/email/phone),
 * טלפונים ישראל/חו"ל/נוספים, הו"ק ידנית ונדרים, מעקב-טיפול, יעדי-קשר שעברו/עתידיים.
 */
import type { Supporter } from '../../../types/domain';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['כהן', 'לוי', 'מזרחי', 'Goldberg', 'פרץ', 'בן-דוד', 'אברהם', 'Schwartz', 'דוד', 'חיים'];
const FIRST = ['משה', 'שרה', 'יוסף', 'רחל', 'David', 'לאה', 'אהרן', 'Miriam'];
const CATS = ['', 'חברים', 'משפחה', 'עסקים', 'קהילה'];
const PURPOSES = ['', '', 'חתונות', 'קמחא דפסחא', 'בניין'];
const IL_PHONES = ['050-1234567', '03-5551234', '0541112222', '+972 52 333 4444', ''];
const INTL_PHONES = ['+1 212 555 0100', '001-718-5550123', '+44 20 7946 0958'];
const ISO = (r: () => number, y0 = 2018, y1 = 2026): string => {
  const y = y0 + Math.floor(r() * (y1 - y0 + 1));
  const m = 1 + Math.floor(r() * 12);
  const d = 1 + Math.floor(r() * 28);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

export function randomSupporter(r: () => number, i: number, today = '2026-10-12'): Supporter {
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const name = pick(FIRST) + ' ' + pick(NAMES) + (r() < 0.3 ? ' ' + i : '');
  const nDon = r() < 0.25 ? 0 : Math.floor(r() * 6);
  const donations = Array.from({ length: nDon }, (_, k) => ({
    rid: 'D-' + (i * 10 + k),
    date: ISO(r),
    amount: Math.round(r() * 3000),
    cur: (r() < 0.2 ? '$' : '₪') as '$' | '₪',
    cat: r() < 0.1 ? 'הו"ק' : pick(CATS),
    ...(r() < 0.3 ? { purpose: pick(PURPOSES) } : {}),
  }));
  const nHist = r() < 0.4 ? -1 : Math.floor(r() * 5);
  const hist =
    nHist < 0
      ? undefined
      : Array.from({ length: nHist }, () => {
          const a = r() < 0.1 ? -Math.round(r() * 500) : r() < 0.05 ? 0 : Math.round(r() * 2500);
          const row: NonNullable<Supporter['hist']>[number] = { d: ISO(r), a };
          if (r() < 0.3) row.c = '$';
          else if (r() < 0.5) row.c = '₪';
          if (r() < 0.3) row.clearer = r() < 0.5 ? 'נדרים' : 'סולה';
          return row;
        });
  const phoneIl = r() < 0.75;
  const phone = phoneIl ? pick(IL_PHONES) : pick(INTL_PHONES);
  const sp: Supporter = {
    id: 's' + i,
    name,
    cat: pick(CATS),
    forWho: pick(PURPOSES),
    notes: '',
    count: r() < 0.1 ? (undefined as unknown as number) : Math.floor(r() * 12),
    ils: r() < 0.1 ? (undefined as unknown as number) : Math.round(r() * 12000),
    usd: r() < 0.5 ? 0 : Math.round(r() * 2000),
    first: '',
    last: r() < 0.3 ? '' : ISO(r, 2020, 2026),
    nextDate: r() < 0.6 ? '' : r() < 0.5 ? ISO(r, 2025, 2026) : today,
    donations,
    hist,
    phone,
    email: r() < 0.4 ? '' : 'u' + i + '@example.com',
    address: r() < 0.5 ? '' : 'רחוב ' + pick(NAMES) + ' ' + i,
  } as unknown as Supporter;
  if (r() < 0.3) {
    sp.phones = [{ id: 'p' + i, num: r() < 0.5 ? pick(INTL_PHONES) : '052-9876543', label: 'בית' }];
  }
  if (r() < 0.25) {
    sp.hok = {
      amount: pick([100, 180, 250, 500]),
      cur: r() < 0.2 ? '$' : '₪',
      day: 1 + Math.floor(r() * 28),
      method: 'card',
      note: '',
      active: r() < 0.8,
      startedAt: ISO(r, 2023, 2026),
      ...(r() < 0.4 ? { kevaId: 'k' + i } : {}),
    };
  }
  if (r() < 0.3) {
    sp.ayin = {
      stage: pick(['new', 'lead', 'eyes', 'answer', 'done'] as const),
      note: '',
      answeredNote: '',
      paid: r() < 0.3,
      answerPushed: false,
      nextTalk: '',
      nextTalkTime: '',
      lastTouch: r() < 0.3 ? today : ISO(r),
      names: r() < 0.5 ? [] : [{ id: 'n' + i, name: 'x', eyes: Math.floor(r() * 5) }],
      answers: [],
      log: r() < 0.2 ? [{ date: today, text: 'טופל' }] : [],
    } as unknown as Supporter['ayin'];
  }
  return sp;
}

export function randomSupporters(n: number, seed = 1, today = '2026-10-12'): Supporter[] {
  const r = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => randomSupporter(r, i, today));
}
