// מבחן נסתר ג׳ — מטרות שהמכונה לא ראתה. כל f טהורה; null = לא מוגדר.
const okInt = (n) => Number.isSafeInteger(n) && Math.abs(n) <= 1e15;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pts = (p) => p;

export const TARGETS = [
  // ── nums > num ──
  { id: 'firstIndexOfMax', he: 'מקום הגדול ביותר (הראשון בשוויון)', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; let b = 0; for (let i = 1; i < xs.length; i++) if (xs[i] > xs[b]) b = i; return b; } },
  { id: 'lastIndexOfMin', he: 'מקום הקטן ביותר (האחרון בשוויון)', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; let b = 0; for (let i = 1; i < xs.length; i++) if (xs[i] <= xs[b]) b = i; return b; } },
  { id: 'longestRisingRun', he: 'אורך הרצף העולה (ממש) הארוך ביותר', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; let best = 1, cur = 1; for (let i = 1; i < xs.length; i++) { cur = xs[i] > xs[i - 1] ? cur + 1 : 1; if (cur > best) best = cur; } return best; } },
  { id: 'longestSameRun', he: 'אורך הרצף הארוך ביותר של ערך חוזר', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; let best = 1, cur = 1; for (let i = 1; i < xs.length; i++) { cur = xs[i] === xs[i - 1] ? cur + 1 : 1; if (cur > best) best = cur; } return best; } },
  { id: 'countPeaks', he: 'כמה פסגות פנימיות (גדול משני שכניו)', sig: 'nums>num', f: (xs) => { if (xs.length < 3) return null; let c = 0; for (let i = 1; i < xs.length - 1; i++) if (xs[i] > xs[i - 1] && xs[i] > xs[i + 1]) c++; return c; } },
  { id: 'maxNeighbourGap', he: 'הפער הגדול ביותר בין שכנים', sig: 'nums>num', f: (xs) => { if (xs.length < 2) return null; let m = 0; for (let i = 1; i < xs.length; i++) m = Math.max(m, Math.abs(xs[i] - xs[i - 1])); return m; } },
  { id: 'sumOfPositives', he: 'סכום החיוביים בלבד', sig: 'nums>num', f: (xs) => (xs.length ? xs.reduce((a, x) => a + (x > 0 ? x : 0), 0) : null) },
  { id: 'midRange', he: 'אמצע הטווח (מקס׳+מינ׳)/2', sig: 'nums>num', f: (xs) => (xs.length ? (Math.max(...xs) + Math.min(...xs)) / 2 : null) },
  { id: 'signFlips', he: 'כמה פעמים מתחלף הסימן (אפסים מדולגים)', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; let c = 0, prev = 0; for (const x of xs) { const s = Math.sign(x); if (s === 0) continue; if (prev && s !== prev) c++; prev = s; } return c; } },
  { id: 'secondSmallestDistinct', he: 'הערך השני-בקטנו (מבין השונים)', sig: 'nums>num', f: (xs) => { const u = [...new Set(xs)].sort((a, b) => a - b); return u.length >= 2 ? u[1] : null; } },
  { id: 'mostFrequent', he: 'הערך השכיח (בשוויון — הקטן)', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; const m = new Map(); for (const x of xs) m.set(x, (m.get(x) || 0) + 1); let b = null, bc = 0; for (const [v, c] of m) if (c > bc || (c === bc && v < b)) { b = v; bc = c; } return b; } },
  { id: 'countAboveMean', he: 'כמה גדולים מהממוצע', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return xs.filter((x) => x > m).length; } },
  { id: 'populationVariance', he: 'שונות (חלקי n)', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return xs.reduce((a, x) => a + (x - m) * (x - m), 0) / xs.length; } },
  { id: 'bestStretchSum', he: 'הסכום הגדול ביותר של קטע רציף (לא ריק)', sig: 'nums>num', f: (xs) => { if (!xs.length) return null; let best = xs[0], cur = xs[0]; for (let i = 1; i < xs.length; i++) { cur = Math.max(xs[i], cur + xs[i]); best = Math.max(best, cur); } return best; } },

  // ── nums > nums ──
  { id: 'runningMax', he: 'המקסימום עד כאן', sig: 'nums>nums', f: (xs) => { const o = []; let m = -Infinity; for (const x of xs) { m = Math.max(m, x); o.push(m); } return o; } },
  { id: 'runningTotal', he: 'סכום מצטבר', sig: 'nums>nums', f: (xs) => { const o = []; let s = 0; for (const x of xs) { s += x; o.push(s); } return o; } },
  { id: 'stepChanges', he: 'ההפרש מכל פריט לבא אחריו', sig: 'nums>nums', f: (xs) => xs.slice(1).map((x, i) => x - xs[i]) },
  { id: 'countSmallerThanEach', he: 'לכל פריט — כמה פריטים אחרים קטנים ממנו', sig: 'nums>nums', f: (xs) => xs.map((x) => xs.filter((y) => y < x).length) },
  { id: 'nextBiggerOrSelf', he: 'לכל פריט — הערך הגדול ממנו הבא מימינו, או הוא עצמו', sig: 'nums>nums', f: (xs) => xs.map((x, i) => { for (let j = i + 1; j < xs.length; j++) if (xs[j] > x) return xs[j]; return x; }) },
  { id: 'movingAverage3', he: 'ממוצע נע ברוחב 3', sig: 'nums>nums', f: (xs) => (xs.length < 3 ? null : xs.slice(2).map((x, i) => (xs[i] + xs[i + 1] + x) / 3)) },
  { id: 'runLengths', he: 'אורכי הרצפים של ערכים חוזרים', sig: 'nums>nums', f: (xs) => { const o = []; for (let i = 0; i < xs.length; i++) { if (i && xs[i] === xs[i - 1]) o[o.length - 1]++; else o.push(1); } return o; } },
  { id: 'squeezeRepeats', he: 'מחיקת חזרות צמודות', sig: 'nums>nums', f: (xs) => xs.filter((x, i) => i === 0 || x !== xs[i - 1]) },
  { id: 'positiveStreakAt', he: 'לכל מקום — כמה חיוביים ברצף עד כאן (מתאפס)', sig: 'nums>nums', f: (xs) => { const o = []; let c = 0; for (const x of xs) { c = x > 0 ? c + 1 : 0; o.push(c); } return o; } },
  { id: 'minFromHereOn', he: 'המינימום מכאן עד הסוף', sig: 'nums>nums', f: (xs) => { const o = new Array(xs.length); let m = Infinity; for (let i = xs.length - 1; i >= 0; i--) { m = Math.min(m, xs[i]); o[i] = m; } return o; } },
  { id: 'neighbourMax', he: 'הגדול מכל זוג שכנים', sig: 'nums>nums', f: (xs) => xs.slice(1).map((x, i) => Math.max(x, xs[i])) },
  { id: 'offsetFromMean', he: 'המרחק (עם סימן) של כל פריט מהממוצע', sig: 'nums>nums', f: (xs) => { if (!xs.length) return null; const m = mean(xs); return xs.map((x) => x - m); } },

  // ── num > num · num,num > num ──
  { id: 'digitSum', he: 'סכום הספרות (שלם אי-שלילי)', sig: 'num>num', f: (n) => { if (!okInt(n) || n < 0) return null; let s = 0; for (const c of String(n)) s += +c; return s; } },
  { id: 'digitCount', he: 'כמה ספרות (בלי סימן)', sig: 'num>num', f: (n) => (okInt(n) ? String(Math.abs(n)).length : null) },
  { id: 'reversedDigits', he: 'הספרות בסדר הפוך (שומר סימן)', sig: 'num>num', f: (n) => { if (!okInt(n)) return null; const r = +String(Math.abs(n)).split('').reverse().join(''); return n < 0 ? -r : r; } },
  { id: 'digitalRoot', he: 'סכום ספרות חוזר עד ספרה אחת', sig: 'num>num', f: (n) => { if (!okInt(n) || n < 0) return null; while (n >= 10) { let s = 0; for (const c of String(n)) s += +c; n = s; } return n; } },
  { id: 'collatzSteps', he: 'צעדים עד 1 (זוגי⇒חצי, אי-זוגי⇒3n+1)', sig: 'num>num', f: (n) => { if (!okInt(n) || n < 1) return null; let k = 0; while (n !== 1) { n = n % 2 ? 3 * n + 1 : n / 2; if (!Number.isSafeInteger(n)) return null; if (++k > 10000) return null; } return k; } },
  { id: 'greatestCommonDivisor', he: 'המחלק המשותף הגדול (שלמים, לא שניהם 0)', sig: 'num,num>num', f: (a, b) => { if (!okInt(a) || !okInt(b) || (a === 0 && b === 0)) return null; a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; } },
  { id: 'nearestMultiple', he: 'הכפולה הקרובה של b ל-a (חצי ⇒ למעלה)', sig: 'num,num>num', f: (a, b) => (b === 0 ? null : Math.floor(a / Math.abs(b) + 0.5) * Math.abs(b)) },

  // ── nums,num > … ──
  { id: 'windowSums', he: 'סכומי חלון ברוחב k (k גדול מהרשימה ⇒ כל הרשימה)', sig: 'nums,num>nums', f: (xs, k) => { if (!Number.isInteger(k) || k < 1 || !xs.length) return null; k = Math.min(k, xs.length); const o = []; let s = 0; for (let i = 0; i < xs.length; i++) { s += xs[i]; if (i >= k) s -= xs[i - k]; if (i >= k - 1) o.push(s); } return o; } },
  { id: 'bestWindowSum', he: 'הסכום הגדול ביותר של k צמודים (k גדול מהרשימה ⇒ כל הרשימה)', sig: 'nums,num>num', f: (xs, k) => { if (!Number.isInteger(k) || k < 1 || !xs.length) return null; k = Math.min(k, xs.length); let s = 0, best = -Infinity; for (let i = 0; i < xs.length; i++) { s += xs[i]; if (i >= k) s -= xs[i - k]; if (i >= k - 1) best = Math.max(best, s); } return best; } },
  { id: 'indexClosestTo', he: 'מקום הפריט הקרוב ביותר ל-t (הראשון בשוויון)', sig: 'nums,num>num', f: (xs, t) => { if (!xs.length) return null; let b = 0; for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - t) < Math.abs(xs[b] - t)) b = i; return b; } },
  { id: 'countAtLeast', he: 'כמה פריטים ≥ t', sig: 'nums,num>num', f: (xs, t) => (xs.length ? xs.filter((x) => x >= t).length : null) },
  { id: 'rotateLeftBy', he: 'סיבוב שמאלה ב-k מקומות', sig: 'nums,num>nums', f: (xs, k) => { if (!Number.isInteger(k)) return null; if (!xs.length) return []; const n = xs.length; const s = ((k % n) + n) % n; return [...xs.slice(s), ...xs.slice(0, s)]; } },

  // ── points ──
  { id: 'pathLength', he: 'אורך המסלול לפי הסדר', sig: 'pts>num', f: (ps) => { if (ps.length < 2) return null; let d = 0; for (let i = 1; i < ps.length; i++) d += Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y); return d; } },
  { id: 'farthestFromOriginIndex', he: 'מקום הנקודה הרחוקה מהראשית (ראשונה בשוויון)', sig: 'pts>num', f: (ps) => { if (!ps.length) return null; let b = 0; const r = (p) => p.x * p.x + p.y * p.y; for (let i = 1; i < ps.length; i++) if (r(ps[i]) > r(ps[b])) b = i; return b; } },
  { id: 'centroid', he: 'מרכז הכובד', sig: 'pts>pt', f: (ps) => (ps.length ? { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length } : null) },
  { id: 'cityBlockDistance', he: 'מרחק מנהטן', sig: 'pt,pt>num', f: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) },
  { id: 'nearestDistanceTo', he: 'המרחק מ-q לנקודה הקרובה אליו', sig: 'pts,pt>num', f: (ps, q) => (ps.length ? Math.min(...pts(ps).map((p) => Math.hypot(p.x - q.x, p.y - q.y))) : null) },
  { id: 'boundingBoxArea', he: 'שטח המלבן החוסם', sig: 'pts>num', f: (ps) => { if (!ps.length) return null; const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y); return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); } },
  { id: 'sortByXThenY', he: 'מיון לפי x ואז y', sig: 'pts>pts', f: (ps) => [...ps].sort((a, b) => a.x - b.x || a.y - b.y).map((p) => ({ x: p.x, y: p.y })) },
  { id: 'dropRepeatedStops', he: 'מחיקת נקודה שחוזרת צמוד', sig: 'pts>pts', f: (ps) => ps.filter((p, i) => i === 0 || p.x !== ps[i - 1].x || p.y !== ps[i - 1].y).map((p) => ({ x: p.x, y: p.y })) },
];
