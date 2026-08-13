// ─────────────────────────────────────────────────────────────────────────────
// telephony · hebcal — לוח עברי טהור על Intl בלבד (כמו maor/hebrew.ts).
// נותן, לתאריך לועזי, סיווג יום-טוב/שבת/ערב-חג/חול-המועד/צום/ראש-חודש +
// סיבת-סגירה לניתוב-המרכזייה. אפס-תלויות. ברירת-מחדל ארץ-ישראל (diaspora=false).
//
// הסגירה מחושבת מראש (precompute) לחלון-תאריכים ונצרבת לדיאלפלן כטווחי-date-time
// (FreeSWITCH לא יודע לוח-עברי) — ראה hebrewClosedDates.
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = {
  Tishri: 'תשרי', Heshvan: 'חשוון', Kislev: 'כסלו', Tevet: 'טבת', Shevat: 'שבט',
  Adar: 'אדר', 'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳', Nisan: 'ניסן', Iyar: 'אייר',
  Sivan: 'סיוון', Tammuz: 'תמוז', Av: 'אב', Elul: 'אלול',
};

// מטמון-פורמטרים פר-אזור-זמן (Intl יקר ליצירה).
const _fmt = new Map();
function fmtFor(tz) {
  let f = _fmt.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-u-ca-hebrew-nu-latn', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: tz,
    });
    _fmt.set(tz, f);
  }
  return f;
}

/** תאריך-עברי {day,monthName,year} לתאריך-ISO לועזי (בצהריים מקומי). */
export function hebParts(iso, tz = 'Asia/Jerusalem') {
  const d = new Date(`${iso}T12:00:00Z`);
  const parts = fmtFor(tz).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const monthName = get('month');
  return {
    day: Number(get('day')),
    monthName,
    monthHe: MONTHS[monthName] || monthName,
    year: Number(get('year')),
    dow: d.getUTCDay(), // 0=ראשון..6=שבת (הצהריים UTC שומר על היום)
  };
}

const isAdar = (m) => m === 'Adar' || m === 'Adar II';

/**
 * סיווג-יום מלא. מחזיר yomTov/shabbat/erevChag/cholHamoed/fast/roshChodesh +
 * name (עברי) + closedReason (הסיבה החזקה-ביותר לסגירה, או null).
 * @param {string} iso
 * @param {{diaspora?:boolean, tz?:string}} [opt]
 */
export function classifyDay(iso, opt = {}) {
  const diaspora = !!opt.diaspora;
  const tz = opt.tz || 'Asia/Jerusalem';
  const { day: d, monthName: m, dow, monthHe } = hebParts(iso, tz);
  const shabbat = dow === 6;

  let yomTov = null;
  let cholHamoed = null;
  let fast = null;
  let erevChag = null;

  // ── ימים-טובים ──
  if (m === 'Tishri') {
    if (d === 1 || d === 2) yomTov = 'ראש השנה';
    else if (d === 10) yomTov = 'יום כיפור';
    else if (d === 15) yomTov = 'סוכות';
    else if (diaspora && d === 16) yomTov = 'סוכות (ב׳)';
    else if ((diaspora ? d >= 17 : d >= 16) && d <= 21) cholHamoed = 'חול המועד סוכות';
    else if (d === 22) yomTov = diaspora ? 'שמיני עצרת' : 'שמיני עצרת · שמחת תורה';
    else if (diaspora && d === 23) yomTov = 'שמחת תורה';
  } else if (m === 'Nisan') {
    if (d === 15) yomTov = 'פסח';
    else if (diaspora && d === 16) yomTov = 'פסח (ב׳)';
    else if ((diaspora ? d >= 17 : d >= 16) && d <= 20) cholHamoed = 'חול המועד פסח';
    else if (d === 21) yomTov = 'שביעי של פסח';
    else if (diaspora && d === 22) yomTov = 'אחרון של פסח';
  } else if (m === 'Sivan') {
    if (d === 6) yomTov = 'שבועות';
    else if (diaspora && d === 7) yomTov = 'שבועות (ב׳)';
  }

  // ── ערב-חג (יום לפני יו״ט הראשון) ──
  if (!yomTov) {
    if (m === 'Elul' && d === 29) erevChag = 'ערב ראש השנה';
    else if (m === 'Tishri' && d === 9) erevChag = 'ערב יום כיפור';
    else if (m === 'Tishri' && d === 14) erevChag = 'ערב סוכות';
    else if (m === 'Nisan' && d === 14) erevChag = 'ערב פסח';
    else if (m === 'Sivan' && d === 5) erevChag = 'ערב שבועות';
  }

  // ── צומות (עם דיני-דחייה; יו״כ מסווג כיו״ט אך גם צום) ──
  const isFast =
    (m === 'Tishri' && d === 10) || // יום כיפור
    (m === 'Tishri' && d === 3 && dow !== 6) || (m === 'Tishri' && d === 4 && dow === 0) || // צום גדליה
    (m === 'Tevet' && d === 10) || // עשרה בטבת
    (isAdar(m) && d === 13 && dow !== 6) || (isAdar(m) && d === 11 && dow === 4) || // תענית אסתר (נדחית לחמישי כש-י״ג בשבת)
    (m === 'Tammuz' && d === 17 && dow !== 6) || (m === 'Tammuz' && d === 18 && dow === 0) || // י״ז בתמוז
    (m === 'Av' && d === 9 && dow !== 6) || (m === 'Av' && d === 10 && dow === 0); // ט׳ באב (נדחה)
  if (isFast) {
    if (m === 'Tishri' && d === 10) fast = 'יום כיפור';
    else if (m === 'Tishri') fast = 'צום גדליה';
    else if (m === 'Tevet') fast = 'עשרה בטבת';
    else if (isAdar(m)) fast = 'תענית אסתר';
    else if (m === 'Tammuz') fast = 'שבעה עשר בתמוז';
    else if (m === 'Av') fast = dow === 0 ? 'תשעה באב (נדחה)' : 'תשעה באב';
  }

  const roshChodesh = (d === 1 && m !== 'Tishri') || d === 30;

  // ── סיבת-סגירה חזקה-ביותר ──
  let closedReason = null;
  if (yomTov) closedReason = yomTov;
  else if (shabbat) closedReason = 'שבת';

  return {
    iso, monthHe, day: d, dow,
    shabbat,
    yomTov: yomTov || null,
    erevChag: erevChag || null,
    cholHamoed: cholHamoed || null,
    fast: fast || null,
    roshChodesh: !!roshChodesh,
    name: yomTov || cholHamoed || fast || erevChag || (shabbat ? 'שבת' : roshChodesh ? `ראש חודש ${monthHe}` : null),
    closedReason,
  };
}

/** צעד-יום על ISO (בלי Date.now — פרסור מפורש). */
function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * מחשב מראש את ימי-הסגירה (יו״ט) בחלון, לצריבה לדיאלפלן. שבת מטופלת ב-wday
 * ולכן לא נכללת כאן (למניעת-כפילות). כל פריט = {iso, reason}.
 * @param {string} fromIso תאריך-עוגן (חובה — דטרמיניזם, אין Date.now)
 * @param {number} windowDays אורך-החלון (ברירת-מחדל 400 — מכסה שנה+אדר-מעובר)
 * @param {{diaspora?:boolean, tz?:string, includeErev?:boolean, includeCholHamoed?:boolean}} [opt]
 */
export function hebrewClosedDates(fromIso, windowDays = 400, opt = {}) {
  const out = [];
  for (let i = 0; i < windowDays; i++) {
    const iso = addDays(fromIso, i);
    const c = classifyDay(iso, opt);
    if (c.yomTov) out.push({ iso, reason: c.yomTov, kind: 'yomtov' });
    else if (opt.includeCholHamoed && c.cholHamoed) out.push({ iso, reason: c.cholHamoed, kind: 'cholhamoed' });
    else if (opt.includeErev && c.erevChag) out.push({ iso, reason: c.erevChag, kind: 'erev' });
    else if (opt.includeFasts && c.fast && !c.shabbat) out.push({ iso, reason: c.fast, kind: 'fast' });
  }
  return out;
}
