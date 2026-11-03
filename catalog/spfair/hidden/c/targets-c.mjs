// מבחן נסתר ג׳ — מטרות שהמכונה לא ראתה. כל f טהורה; null = לא מוגדר.
const fin = (v) => (Number.isFinite(v) ? v : null);
const finPt = (p) => (Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x, y: p.y } : null);
const euc = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const man = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const asc = (a, b) => a - b;

export const TARGETS = [
  // ── nums>num ──
  { id: 'secondLargestDistinct', he: 'הערך השני-בגודלו מבין הערכים השונים', sig: 'nums>num', f: (xs) => {
    const u = [...new Set(xs)].sort(asc); return u.length < 2 ? null : u[u.length - 2]; } },
  { id: 'maxSubarraySum', he: 'הסכום הגדול ביותר של רצף רציף לא-ריק', sig: 'nums>num', f: (xs) => {
    if (!xs.length) return null; let best = xs[0], cur = xs[0];
    for (let i = 1; i < xs.length; i++) { cur = Math.max(xs[i], cur + xs[i]); best = Math.max(best, cur); } return fin(best); } },
  { id: 'longestRisingRun', he: 'אורך הרצף הרציף העולה-ממש הארוך ביותר', sig: 'nums>num', f: (xs) => {
    if (!xs.length) return null; let best = 1, cur = 1;
    for (let i = 1; i < xs.length; i++) { cur = xs[i] > xs[i - 1] ? cur + 1 : 1; if (cur > best) best = cur; } return best; } },
  { id: 'countInteriorPeaks', he: 'כמה פסגות פנימיות (גדול-ממש משני השכנים)', sig: 'nums>num', f: (xs) => {
    if (xs.length < 3) return null; let c = 0;
    for (let i = 1; i < xs.length - 1; i++) if (xs[i] > xs[i - 1] && xs[i] > xs[i + 1]) c++; return c; } },
  { id: 'modeSmallestOnTie', he: 'הערך השכיח ביותר; בתיקו — הקטן', sig: 'nums>num', f: (xs) => {
    if (!xs.length) return null; const m = new Map(); for (const x of xs) m.set(x, (m.get(x) || 0) + 1);
    let bv = null, bc = -1; for (const [v, c] of m) if (c > bc || (c === bc && v < bv)) { bv = v; bc = c; } return bv; } },
  { id: 'maxAdjacentJump', he: 'הקפיצה הגדולה ביותר (בערך מוחלט) בין שכנים', sig: 'nums>num', f: (xs) => {
    if (xs.length < 2) return null; let b = 0; for (let i = 1; i < xs.length; i++) b = Math.max(b, Math.abs(xs[i] - xs[i - 1])); return fin(b); } },
  { id: 'inversionCount', he: 'מספר הזוגות i<j שבהם הקודם גדול-ממש מהבא', sig: 'nums>num', f: (xs) => {
    let c = 0; for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) if (xs[i] > xs[j]) c++; return c; } },
  { id: 'alternatingSum', he: 'סכום לסירוגין: ראשון פחות שני ועוד שלישי...', sig: 'nums>num', f: (xs) => {
    if (!xs.length) return null; let s = 0; xs.forEach((x, i) => { s += i % 2 ? -x : x; }); return fin(s); } },
  { id: 'lowerMedian', he: 'החציון התחתון (באמצע אחרי מיון; בזוגי — הקטן מהשניים)', sig: 'nums>num', f: (xs) => {
    if (!xs.length) return null; const s = [...xs].sort(asc); return s[(s.length - 1) >> 1]; } },
  { id: 'longestEqualRun', he: 'אורך הרצף הארוך ביותר של ערך שחוזר ברצף', sig: 'nums>num', f: (xs) => {
    if (!xs.length) return null; let best = 1, cur = 1;
    for (let i = 1; i < xs.length; i++) { cur = xs[i] === xs[i - 1] ? cur + 1 : 1; if (cur > best) best = cur; } return best; } },
  { id: 'maxPairProduct', he: 'המכפלה הגדולה ביותר של שני איברים במקומות שונים', sig: 'nums>num', f: (xs) => {
    if (xs.length < 2) return null; const s = [...xs].sort(asc); const n = s.length;
    return fin(Math.max(s[0] * s[1], s[n - 1] * s[n - 2])); } },
  { id: 'minPairGap', he: 'ההפרש הקטן ביותר בין שני איברים במקומות שונים', sig: 'nums>num', f: (xs) => {
    if (xs.length < 2) return null; const s = [...xs].sort(asc); let b = Infinity;
    for (let i = 1; i < s.length; i++) b = Math.min(b, s[i] - s[i - 1]); return fin(b); } },
  { id: 'lisLength', he: 'אורך תת-הסדרה העולה-ממש הארוכה ביותר (לא בהכרח רציפה)', sig: 'nums>num', f: (xs) => {
    const t = []; for (const x of xs) { let lo = 0, hi = t.length; while (lo < hi) { const m = (lo + hi) >> 1; if (t[m] < x) lo = m + 1; else hi = m; } t[lo] = x; }
    return t.length; } },

  // ── nums>nums ──
  { id: 'runningMax', he: 'המקסימום המצטבר עד כל מקום', sig: 'nums>nums', f: (xs) => {
    const o = []; let m = -Infinity; for (const x of xs) { m = Math.max(m, x); o.push(m); } return o; } },
  { id: 'adjacentDiffs', he: 'הפרשים בין שכנים: הבא פחות הקודם', sig: 'nums>nums', f: (xs) => {
    if (!xs.length) return null; const o = []; for (let i = 1; i < xs.length; i++) { const d = xs[i] - xs[i - 1]; if (!Number.isFinite(d)) return null; o.push(d); } return o; } },
  { id: 'collapseRepeats', he: 'כיווץ חזרות רצופות לאיבר אחד', sig: 'nums>nums', f: (xs) => xs.filter((x, i) => i === 0 || x !== xs[i - 1]) },
  { id: 'denseRank', he: 'דרגה צפופה של כל איבר (0 = הקטן; שווים באותה דרגה)', sig: 'nums>nums', f: (xs) => {
    const u = [...new Set(xs)].sort(asc); const r = new Map(u.map((v, i) => [v, i])); return xs.map((x) => r.get(x)); } },
  { id: 'windowSums3', he: 'סכומי חלונות רציפים באורך 3', sig: 'nums>nums', f: (xs) => {
    if (xs.length < 3) return null; const o = []; for (let i = 0; i + 2 < xs.length; i++) { const s = xs[i] + xs[i + 1] + xs[i + 2]; if (!Number.isFinite(s)) return null; o.push(s); } return o; } },
  { id: 'sortByAbs', he: 'מיון לפי ערך מוחלט; בתיקו — השלילי קודם', sig: 'nums>nums', f: (xs) => [...xs].sort((a, b) => Math.abs(a) - Math.abs(b) || a - b) },
  { id: 'localMaxima', he: 'האיברים שגדולים-ממש מכל שכניהם (בקצה — משכן אחד)', sig: 'nums>nums', f: (xs) => {
    if (xs.length < 2) return null; return xs.filter((x, i) => (i === 0 || x > xs[i - 1]) && (i === xs.length - 1 || x > xs[i + 1])); } },
  { id: 'nextGreaterOrSelf', he: 'לכל איבר: הראשון מימינו שגדול-ממש ממנו, ואם אין — האיבר עצמו', sig: 'nums>nums', f: (xs) => {
    const o = xs.slice(); const st = []; for (let i = 0; i < xs.length; i++) { while (st.length && xs[st[st.length - 1]] < xs[i]) o[st.pop()] = xs[i]; st.push(i); } return o; } },
  { id: 'evensThenOdds', he: 'הזוגיים קודם ואחריהם האי-זוגיים, כל קבוצה בסדרה המקורי', sig: 'nums>nums', f: (xs) => {
    const ev = (x) => Number.isInteger(x) && x % 2 === 0; return [...xs.filter(ev), ...xs.filter((x) => !ev(x))]; } },
  { id: 'topThreeDesc', he: 'שלושת הגדולים בסדר יורד (פחות אם הרשימה קצרה)', sig: 'nums>nums', f: (xs) => {
    if (!xs.length) return null; return [...xs].sort((a, b) => b - a).slice(0, 3); } },

  // ── num>num / num,num>num ──
  { id: 'digitSum', he: 'סכום הספרות של החלק השלם בערך מוחלט', sig: 'num>num', f: (x) => {
    let n = Math.abs(Math.trunc(x)); if (!Number.isSafeInteger(n)) return null; let s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } return s; } },
  { id: 'gcdOf', he: 'המחלק המשותף הגדול של שני שלמים (בערך מוחלט)', sig: 'num,num>num', f: (a, b) => {
    let x = Math.abs(Math.trunc(a)), y = Math.abs(Math.trunc(b)); if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || (x === 0 && y === 0)) return null;
    while (y) { [x, y] = [y, x % y]; } return x; } },
  { id: 'collatzSteps', he: 'מספר צעדי קולץ עד 1 (לשלם חיובי)', sig: 'num>num', f: (x) => {
    if (!Number.isSafeInteger(x) || x < 1 || x > 1e12) return null; let n = x, c = 0; while (n !== 1) { n = n % 2 ? 3 * n + 1 : n / 2; c++; if (c > 100000 || !Number.isSafeInteger(n)) return null; } return c; } },
  { id: 'modPositive', he: 'שארית חלוקה שתמיד אי-שלילית (a מודולו |b|)', sig: 'num,num>num', f: (a, b) => {
    if (b === 0) return null; const m = Math.abs(b); return fin(((a % m) + m) % m); } },
  { id: 'integerSqrt', he: 'שורש שלם (רצפה) של מספר אי-שלילי', sig: 'num>num', f: (x) => {
    if (!(x >= 0) || !Number.isFinite(x)) return null; let r = Math.floor(Math.sqrt(x)); while (r * r > x) r--; while ((r + 1) * (r + 1) <= x) r++; return r; } },

  // ── nums,num ──
  { id: 'countAbove', he: 'כמה איברים גדולים-ממש מהסף', sig: 'nums,num>num', f: (xs, t) => xs.filter((x) => x > t).length },
  { id: 'closestValue', he: 'האיבר הקרוב ביותר למספר; בתיקו — הקטן', sig: 'nums,num>num', f: (xs, t) => {
    if (!xs.length) return null; let b = null, bd = Infinity;
    for (const x of xs) { const d = Math.abs(x - t); if (d < bd || (d === bd && x < b)) { b = x; bd = d; } } return b; } },
  { id: 'rotateRightBy', he: 'סיבוב הרשימה ימינה ב-k מקומות (k שלילי = שמאלה)', sig: 'nums,num>nums', f: (xs, k) => {
    if (!xs.length || !Number.isInteger(k)) return null; const n = xs.length; const r = ((k % n) + n) % n; return xs.slice(n - r).concat(xs.slice(0, n - r)); } },
  { id: 'chunkSums', he: 'סכומי מקטעים רצופים בגודל k (האחרון אולי קצר)', sig: 'nums,num>nums', f: (xs, k) => {
    if (!Number.isInteger(k) || k < 1) return null; const o = [];
    for (let i = 0; i < xs.length; i += k) { let s = 0; for (let j = i; j < Math.min(i + k, xs.length); j++) s += xs[j]; if (!Number.isFinite(s)) return null; o.push(s); } return o; } },
  { id: 'pairsSummingTo', he: 'כמה זוגות i<j שסכומם שווה למספר', sig: 'nums,num>num', f: (xs, t) => {
    const m = new Map(); let c = 0; for (const x of xs) { c += m.get(t - x) || 0; m.set(x, (m.get(x) || 0) + 1); } return c; } },

  // ── points ──
  { id: 'polylineLength', he: 'אורך המסלול העובר בנקודות לפי הסדר (אוקלידי)', sig: 'pts>num', f: (ps) => {
    if (ps.length < 2) return null; let s = 0; for (let i = 1; i < ps.length; i++) s += euc(ps[i - 1], ps[i]); return fin(s); } },
  { id: 'centroid', he: 'מרכז הכובד (ממוצע x וממוצע y)', sig: 'pts>pt', f: (ps) => {
    if (!ps.length) return null; let x = 0, y = 0; for (const p of ps) { x += p.x; y += p.y; } return finPt({ x: x / ps.length, y: y / ps.length }); } },
  { id: 'diameter', he: 'המרחק הגדול ביותר בין שתי נקודות (אוקלידי)', sig: 'pts>num', f: (ps) => {
    if (ps.length < 2) return null; let b = 0; for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) b = Math.max(b, euc(ps[i], ps[j])); return fin(b); } },
  { id: 'nearestTo', he: 'הנקודה הקרובה ביותר לנקודה נתונה (אוקלידי; בתיקו — הראשונה)', sig: 'pts,pt>pt', f: (ps, q) => {
    if (!ps.length) return null; let b = ps[0], bd = euc(ps[0], q); for (const p of ps) { const d = euc(p, q); if (d < bd) { b = p; bd = d; } } return { x: b.x, y: b.y }; } },
  { id: 'totalManhattanTo', he: 'סכום מרחקי מנהטן מכל הנקודות לנקודה נתונה', sig: 'pts,pt>num', f: (ps, q) => {
    if (!ps.length) return null; let s = 0; for (const p of ps) s += man(p, q); return fin(s); } },
  { id: 'polygonArea', he: 'שטח המצולע שקודקודיו הנקודות לפי הסדר (נוסחת השרוך, ערך מוחלט)', sig: 'pts>num', f: (ps) => {
    if (ps.length < 3) return null; let s = 0; for (let i = 0; i < ps.length; i++) { const a = ps[i], b = ps[(i + 1) % ps.length]; s += a.x * b.y - b.x * a.y; } return fin(Math.abs(s) / 2); } },
  { id: 'boundingBoxArea', he: 'שטח המלבן החוסם המקביל לצירים', sig: 'pts>num', f: (ps) => {
    if (!ps.length) return null; const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
    return fin((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))); } },
  { id: 'convexHull', he: 'קמור-המעטפת: הקודקודים נגד כיוון השעון מהנקודה השמאלית-תחתונה, בלי נקודות על צלעות', sig: 'pts>pts', f: (ps) => {
    if (!ps.length) return null; const s = [...new Map(ps.map((p) => [p.x + ',' + p.y, { x: p.x, y: p.y }])).values()].sort((a, b) => a.x - b.x || a.y - b.y);
    if (s.length < 3) return s; const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = []; for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    const up = []; for (let i = s.length - 1; i >= 0; i--) { const p = s[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    lo.pop(); up.pop(); return lo.concat(up); } },
  { id: 'manhattanBetween', he: 'מרחק מנהטן בין שתי נקודות', sig: 'pt,pt>num', f: (a, b) => fin(man(a, b)) },
  { id: 'sortByOriginDistance', he: 'מיון הנקודות לפי מרחק אוקלידי מהראשית; בתיקו לפי x ואז y', sig: 'pts>pts', f: (ps) => {
    if (ps.length < 2) return null; return ps.map((p) => ({ x: p.x, y: p.y })).sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) || a.x - b.x || a.y - b.y); } },
  { id: 'midpointOf', he: 'נקודת האמצע בין שתי נקודות', sig: 'pt,pt>pt', f: (a, b) => finPt({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }) },
  { id: 'greedyTourLength', he: 'אורך מסלול "השכן הקרוב" מהנקודה הראשונה דרך כל הנקודות (אוקלידי; בתיקו — האינדקס הקטן; בלי חזרה)', sig: 'pts>num', f: (ps) => {
    if (ps.length < 2) return null; const used = new Array(ps.length).fill(false); used[0] = true; let cur = 0, s = 0;
    for (let k = 1; k < ps.length; k++) { let b = -1, bd = Infinity; for (let j = 0; j < ps.length; j++) if (!used[j]) { const d = euc(ps[cur], ps[j]); if (d < bd) { bd = d; b = j; } }
      used[b] = true; s += bd; cur = b; } return fin(s); } },
  { id: 'medoid', he: 'הנקודה מהרשימה שסכום מרחקיה (אוקלידי) לכל האחרות מינימלי; בתיקו — הראשונה', sig: 'pts>pt', f: (ps) => {
    if (!ps.length) return null; let b = 0, bs = Infinity;
    for (let i = 0; i < ps.length; i++) { let s = 0; for (let j = 0; j < ps.length; j++) s += euc(ps[i], ps[j]); if (s < bs) { bs = s; b = i; } } return { x: ps[b].x, y: ps[b].y }; } },
  { id: 'countWithinManhattan5', he: 'כמה נקודות במרחק מנהטן של 5 לכל היותר מנקודה נתונה', sig: 'pts,pt>num', f: (ps, q) => ps.filter((p) => man(p, q) <= 5).length },
];
