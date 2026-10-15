/**
 * SP-FAIR hidden — sealed test set. Same shape as ../targets.mjs: { id, sig, he, f, known? }.
 * Written before any run; not to be read by the engine. null = undefined (empty / non-finite / bad input).
 * sig: 'nums>num' · 'nums>nums' · 'num>num' (f(n)) · 'num,num>num' (f(a, b)).
 */
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const fins = (xs) => (xs.every((x) => Number.isFinite(x)) ? xs : null);
const mean = (xs) => xs.reduce((a, x) => a + x, 0) / xs.length;
const asc = (xs) => [...xs].sort((a, b) => a - b);
const nat = (n) => Number.isInteger(n) && n >= 0;

/** nums ⇒ num */
export const NUM_TARGETS = {
  sumPositives: { he: 'סכום החיוביים', f: (xs) => fin(xs.reduce((a, x) => (x > 0 ? a + x : a), 0)) },
  countEvens: { he: 'כמה זוגיים', f: (xs) => xs.filter((x) => Number.isInteger(x) && x % 2 === 0).length },
  secondSmallest: { he: 'השני-בקטנותו', f: (xs) => (xs.length < 2 ? null : fin(asc(xs)[1])) },
  maxMinusFirst: { he: 'מקסימום פחות הראשון', f: (xs) => (xs.length ? fin(Math.max(...xs) - xs[0]) : null) },
  adjacentChanges: { he: 'כמה שינויים בין סמוכים', f: (xs) => { let c = 0; for (let i = 1; i < xs.length; i++) if (xs[i] !== xs[i - 1]) c++; return c; } },
  localMaxima: { he: 'כמה פסגות פנימיות', f: (xs) => { let c = 0; for (let i = 1; i < xs.length - 1; i++) if (xs[i] > xs[i - 1] && xs[i] > xs[i + 1]) c++; return c; } },
  meanFirstHalf: { he: 'ממוצע החצי הראשון', f: (xs) => { const h = xs.slice(0, xs.length >> 1); return h.length ? fin(mean(h)) : null; } },
  dotReversed: { he: 'מכפלה-סקלרית עם ההפוך', f: (xs) => fin(xs.reduce((a, x, i) => a + x * xs[xs.length - 1 - i], 0)) },
  sumAboveMean: { he: 'סכום מה שמעל הממוצע', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return fin(xs.reduce((a, x) => (x > m ? a + x : a), 0)); } },
  closestToMean: { he: 'הערך הקרוב ביותר לממוצע (הראשון)', f: (xs) => { if (!xs.length) return null; const m = mean(xs); let b = xs[0]; for (const x of xs) if (Math.abs(x - m) < Math.abs(b - m)) b = x; return fin(b); } },
  argmaxAbs: { he: 'מקום הגדול-בערכו-המוחלט (הראשון)', f: (xs) => { if (!xs.length) return null; let bi = 0; for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i]) > Math.abs(xs[bi])) bi = i; return bi; } },
  longestRise: { he: 'אורך הרצף העולה הארוך ביותר', f: (xs) => { if (!xs.length) return 0; let best = 1, cur = 1; for (let i = 1; i < xs.length; i++) { cur = xs[i] > xs[i - 1] ? cur + 1 : 1; if (cur > best) best = cur; } return best; } },
  maxDrop: { he: 'הירידה הגדולה ביותר משיא קודם', f: (xs) => { if (!xs.length) return null; let peak = xs[0], d = 0; for (const x of xs) { if (x > peak) peak = x; if (peak - x > d) d = peak - x; } return fin(d); } },
};
/** nums ⇒ nums */
export const LIST_TARGETS = {
  doubleEach: { he: 'כפול שתיים', f: (xs) => fins(xs.map((x) => 2 * x)) },
  keepPositives: { he: 'רק החיוביים', f: (xs) => xs.filter((x) => x > 0) },
  pairDiffs: { he: 'הפרשים בין סמוכים', f: (xs) => fins(xs.slice(1).map((x, i) => x - xs[i])) },
  runningMax: { he: 'מקסימום-מצטבר', f: (xs) => { let m = -Infinity; return xs.map((x) => (m = Math.max(m, x))); } },
  uniqueOrder: { he: 'בלי כפולים, לפי הסדר', f: (xs) => [...new Set(xs)] },
  clampToMean: { he: 'חיתוך לטווח [0, ממוצע]', f: (xs) => { if (!xs.length) return []; const m = mean(xs); if (m < 0) return null; return fins(xs.map((x) => Math.min(Math.max(x, 0), m))); } },
  argsort: { he: 'מקומות לפי סדר עולה (יציב)', f: (xs) => xs.map((x, i) => i).sort((a, b) => xs[a] - xs[b] || a - b) },
  sqDeviations: { he: 'ריבוע הסטייה מהממוצע', f: (xs) => { if (!xs.length) return []; const m = mean(xs); return fins(xs.map((x) => (x - m) ** 2)); } },
  signVsMean: { he: 'סימן ביחס לממוצע (1/0/−1)', f: (xs) => { if (!xs.length) return []; const m = mean(xs); return xs.map((x) => (x > m ? 1 : x < m ? -1 : 0)); } },
  prefixMin: { he: 'מינימום-מצטבר', f: (xs) => { let m = Infinity; return xs.map((x) => (m = Math.min(m, x))); } },
};
/** num(s) ⇒ num */
export const SCALAR_TARGETS = {
  digitSum: { sig: 'num>num', he: 'סכום ספרות', f: (n) => { if (!nat(n)) return null; let s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } return s; } },
  isqrt: { sig: 'num>num', he: 'שורש שלם (רצפה)', f: (n) => { if (!nat(n)) return null; let r = 0; while ((r + 1) * (r + 1) <= n) r++; return r; } },
  collatzSteps: { sig: 'num>num', he: 'צעדי קולץ עד 1', f: (n) => { if (!Number.isInteger(n) || n < 1) return null; let c = 0; while (n !== 1 && c < 100000) { n = n % 2 ? 3 * n + 1 : n / 2; c++; } return n === 1 ? c : null; } },
  triangular: { sig: 'num>num', he: 'מספר משולשי', f: (n) => (nat(n) ? (n * (n + 1)) / 2 : null) },
  halvingSteps: { sig: 'num>num', he: 'כמה חציות-רצפה עד 0', f: (n) => { if (!nat(n)) return null; let c = 0; while (n > 0) { n = Math.floor(n / 2); c++; } return c; } },
  gcdSub: { sig: 'num,num>num', he: 'מחלק משותף מקסימלי (בחיסור חוזר)', f: (a, b) => { if (!nat(a) || !nat(b)) return null; if (a === 0) return b; if (b === 0) return a; while (a !== b) { if (a > b) a -= b; else b -= a; } return a; } },
  minOf2: { sig: 'num,num>num', he: 'הקטן מבין שניים', f: (a, b) => fin(Math.min(a, b)) },
  absDiff: { sig: 'num,num>num', he: 'הפרש מוחלט', f: (a, b) => fin(Math.abs(a - b)) },
};
export const TARGETS = [
  ...Object.entries(NUM_TARGETS).map(([id, x]) => ({ id, sig: 'nums>num', ...x })),
  ...Object.entries(LIST_TARGETS).map(([id, x]) => ({ id, sig: 'nums>nums', ...x })),
  ...Object.entries(SCALAR_TARGETS).map(([id, x]) => ({ id, ...x })),
];
