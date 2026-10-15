/**
 * ⚖️ SP-FAIR — מטרות שהמנוע לא כוון אליהן: מימושי-ייחוס פשוטים, **לכלי-המדידה בלבד**.
 * המנוע לא רואה את הקובץ הזה: hook.mjs חוסם קריאה וייבוא שלו כל עוד המנוע רץ (וגם בתהליכי-הצמיחה).
 * נכתבו לפני ההרצה הראשונה, ולא שונו אחריה (ראו הדוח). null = לא מוגדר (ריק / לא-סופי).
 *
 * חלק מהן הן פעלים שהמנוע כבר מכיר (מסומנות known) — נמדדות כבקרה, לא נספרות כ"חדשות".
 */
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const fins = (xs) => (xs.every((x) => Number.isFinite(x)) ? xs : null);
const mean = (xs) => xs.reduce((a, x) => a + x, 0) / xs.length;
const asc = (xs) => [...xs].sort((a, b) => a - b);

/** nums ⇒ num */
export const NUM_TARGETS = {
  median: { he: 'חציון', f: (xs) => { if (!xs.length) return null; const s = asc(xs); const h = s.length >> 1; return fin(s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2); } },
  range: { he: 'טווח (מקסימום − מינימום)', f: (xs) => (xs.length ? fin(Math.max(...xs) - Math.min(...xs)) : null) },
  variance: { he: 'שונות (של האוכלוסייה)', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return fin(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length); } },
  stdev: { he: 'סטיית-תקן', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return fin(Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length)); } },
  product: { he: 'מכפלה', f: (xs) => fin(xs.reduce((a, x) => a * x, 1)) },
  secondLargest: { he: 'השני-בגודלו', f: (xs) => (xs.length < 2 ? null : fin(asc(xs)[xs.length - 2])) },
  argmax: { he: 'מקום-המקסימום (הראשון)', f: (xs) => (xs.length ? xs.indexOf(Math.max(...xs)) : null) },
  argmin: { he: 'מקום-המינימום (הראשון)', f: (xs) => (xs.length ? xs.indexOf(Math.min(...xs)) : null) },
  countAboveMean: { he: 'כמה מעל הממוצע', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return xs.filter((x) => x > m).length; } },
  sumSquares: { he: 'סכום-ריבועים', f: (xs) => fin(xs.reduce((a, x) => a + x * x, 0)) },
  meanAbsDev: { he: 'סטייה-מוחלטת-ממוצעת', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return fin(xs.reduce((a, x) => a + Math.abs(x - m), 0) / xs.length); } },
  sumAbs: { he: 'סכום-ערכים-מוחלטים', f: (xs) => fin(xs.reduce((a, x) => a + Math.abs(x), 0)) },
  distinctCount: { he: 'כמה ערכים שונים', f: (xs) => new Set(xs).size },
  first: { he: 'הראשון', f: (xs) => (xs.length ? xs[0] : null) },
  last: { he: 'האחרון', f: (xs) => (xs.length ? xs[xs.length - 1] : null) },
  min: { he: 'מינימום', known: true, f: (xs) => (xs.length ? Math.min(...xs) : null) },
  max: { he: 'מקסימום', known: true, f: (xs) => (xs.length ? Math.max(...xs) : null) },
  mean: { he: 'ממוצע', known: true, f: (xs) => (xs.length ? fin(mean(xs)) : null) },
};
/** nums ⇒ nums */
export const LIST_TARGETS = {
  deviations: { he: 'סטייה מהממוצע (x − ממוצע)', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return fins(xs.map((x) => x - m)); } },
  shares: { he: 'נרמול (x ÷ סכום)', f: (xs) => { const s = xs.reduce((a, x) => a + x, 0); return xs.length && s !== 0 ? fins(xs.map((x) => x / s)) : null; } },
  cumsum: { he: 'סכום-מצטבר', f: (xs) => { let s = 0; return fins(xs.map((x) => (s += x))); } },
  sortDesc: { he: 'מיון יורד', f: (xs) => asc(xs).reverse() },
  squares: { he: 'ריבועים', f: (xs) => fins(xs.map((x) => x * x)) },
  aboveMean: { he: 'רק מה שמעל הממוצע', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return xs.filter((x) => x > m); } },
  minMaxScale: { he: 'נרמול לטווח 0–1', f: (xs) => { if (!xs.length) return null; const lo = Math.min(...xs); const hi = Math.max(...xs); return hi === lo ? null : fins(xs.map((x) => (x - lo) / (hi - lo))); } },
  sortAsc: { he: 'מיון עולה', known: true, f: (xs) => asc(xs) },
};
export const TARGETS = [
  ...Object.entries(NUM_TARGETS).map(([id, x]) => ({ id, sig: 'nums>num', ...x })),
  ...Object.entries(LIST_TARGETS).map(([id, x]) => ({ id, sig: 'nums>nums', ...x })),
];
