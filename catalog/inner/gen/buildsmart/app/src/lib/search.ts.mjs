// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/lib/search.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function normalize(s) {
    return s.toLocaleLowerCase('he');
}
function editDistance(a, b) {
    if (a === b)
        return 0;
    const m = a.length;
    const n = b.length;
    if (!m)
        return n;
    if (!n)
        return m;
    let prev = new Array(n + 1);
    let cur = new Array(n + 1);
    for (let j = 0; j <= n; j++)
        prev[j] = j;
    for (let i = 1; i <= m; i++) {
        cur[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        }
        [prev, cur] = [cur, prev];
    }
    return prev[n];
}
export function inner$searchExact$q(query) {
    const q = normalize(query.trim());
    return q;
}
export function inner$searchExact$pos(query, kw) {
    const q = normalize(query.trim());
    const pos = normalize(kw).indexOf(q);
    return pos;
}
export function inner$searchExact$pos$$step(q, kw) {
    const pos = normalize(kw).indexOf(q);
    return pos;
}
export function inner$searchExact$bucket(query, prefix, contains, hit) {
    const q = normalize(query.trim());
    let bestPos = -1;
    for (const kw of hit.keywords) {
        const pos = normalize(kw).indexOf(q);
        if (pos >= 0 && (bestPos < 0 || pos < bestPos))
            bestPos = pos;
    }
    const bucket = bestPos === 0 ? prefix : contains;
    return bucket;
}
export function inner$searchExact$bucket$$step(prefix, contains, bestPos) {
    const bucket = bestPos === 0 ? prefix : contains;
    return bucket;
}
export function inner$editDistance$prev(n) {
    let prev = new Array(n + 1);
    return prev;
}
export function inner$editDistance$cur(n) {
    let cur = new Array(n + 1);
    return cur;
}
export function inner$editDistance$cost(a, b, i, j) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    return cost;
}
export function inner$searchFuzzy$q(query) {
    const q = normalize(query.trim());
    return q;
}
export function inner$searchFuzzy$tolerance(query) {
    const q = normalize(query.trim());
    const tolerance = Math.floor(q.length / 3) + 1;
    return tolerance;
}
export function inner$searchFuzzy$tolerance$$step(q) {
    const tolerance = Math.floor(q.length / 3) + 1;
    return tolerance;
}
export function inner$searchFuzzy$norm(kw) {
    const norm = normalize(kw);
    return norm;
}
export function inner$searchFuzzy$window(query, kw) {
    const q = normalize(query.trim());
    const tolerance = Math.floor(q.length / 3) + 1;
    const norm = normalize(kw);
    const window = Math.min(norm.length, q.length + tolerance);
    return window;
}
export function inner$searchFuzzy$window$$step(q, tolerance, norm) {
    const window = Math.min(norm.length, q.length + tolerance);
    return window;
}
export function inner$searchFuzzy$slice(query, kw, start) {
    const q = normalize(query.trim());
    const tolerance = Math.floor(q.length / 3) + 1;
    const norm = normalize(kw);
    const window = Math.min(norm.length, q.length + tolerance);
    const slice = norm.slice(start, start + window);
    return slice;
}
export function inner$searchFuzzy$slice$$step(norm, window, start) {
    const slice = norm.slice(start, start + window);
    return slice;
}
export function inner$searchFuzzy$d(query, kw, start) {
    const q = normalize(query.trim());
    const tolerance = Math.floor(q.length / 3) + 1;
    const norm = normalize(kw);
    const window = Math.min(norm.length, q.length + tolerance);
    const slice = norm.slice(start, start + window);
    const d = editDistance(q, slice);
    return d;
}
export function inner$searchFuzzy$d$$step(q, slice) {
    const d = editDistance(q, slice);
    return d;
}
export function inner$searchExact$bestPos$$after_loop(query, hit) {
    const q = normalize(query.trim());
    let bestPos = -1;
    for (const kw of hit.keywords) {
        const pos = normalize(kw).indexOf(q);
        if (pos >= 0 && (bestPos < 0 || pos < bestPos))
            bestPos = pos;
    }
    return bestPos;
}
export function inner$searchFuzzy$bestDist$$after_loop(query, hit) {
    const q = normalize(query.trim());
    const tolerance = Math.floor(q.length / 3) + 1;
    let bestDist = Infinity;
    for (const kw of hit.keywords) {
        const norm = normalize(kw);
        const window = Math.min(norm.length, q.length + tolerance);
        for (let start = 0; start + q.length - tolerance <= norm.length; start++) {
            const slice = norm.slice(start, start + window);
            const d = editDistance(q, slice);
            if (d < bestDist)
                bestDist = d;
            if (bestDist <= tolerance)
                break;
        }
        if (bestDist <= tolerance)
            break;
    }
    return bestDist;
}

export const SIGS = {
  inner$searchExact$q: [{"name":"query","d":{"t":"str"},"opt":false}],
  inner$searchExact$pos: [{"name":"query","d":{"t":"str"},"opt":false},{"name":"kw","d":{"t":"str"},"opt":false}],
  inner$searchExact$pos$$step: [{"name":"q","d":{"t":"str"},"opt":false},{"name":"kw","d":{"t":"str"},"opt":false}],
  inner$searchExact$bucket: [{"name":"query","d":{"t":"str"},"opt":false},{"name":"prefix","d":{"t":"arr","of":{"t":"obj","p":[["hit",{"t":"obj","n":"SearchHit","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["screen","cat","prod"]},false],["label",{"t":"str"},false],["path",{"t":"str"},false],["emoji",{"t":"str"},false],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["target",{"t":"or","of":[{"t":"obj","p":[["type",{"t":"lit","v":["screen"]},false],["key",{"t":"lit","v":["home","projects","cart","settings","notifications","orders","profile"]},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["cat"]},false],["categoryId",{"t":"str"},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["prod"]},false],["productId",{"t":"str"},false]]}]},false],["keywords",{"t":"arr","of":{"t":"str"}},false]]},false],["score",{"t":"num"},false]]}},"opt":false},{"name":"contains","d":{"t":"arr","of":{"t":"obj","p":[["hit",{"t":"obj","n":"SearchHit","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["screen","cat","prod"]},false],["label",{"t":"str"},false],["path",{"t":"str"},false],["emoji",{"t":"str"},false],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["target",{"t":"or","of":[{"t":"obj","p":[["type",{"t":"lit","v":["screen"]},false],["key",{"t":"lit","v":["home","projects","cart","settings","notifications","orders","profile"]},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["cat"]},false],["categoryId",{"t":"str"},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["prod"]},false],["productId",{"t":"str"},false]]}]},false],["keywords",{"t":"arr","of":{"t":"str"}},false]]},false],["score",{"t":"num"},false]]}},"opt":false},{"name":"hit","d":{"t":"obj","n":"SearchHit","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["screen","cat","prod"]},false],["label",{"t":"str"},false],["path",{"t":"str"},false],["emoji",{"t":"str"},false],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["target",{"t":"or","of":[{"t":"obj","p":[["type",{"t":"lit","v":["screen"]},false],["key",{"t":"lit","v":["home","projects","cart","settings","notifications","orders","profile"]},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["cat"]},false],["categoryId",{"t":"str"},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["prod"]},false],["productId",{"t":"str"},false]]}]},false],["keywords",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$searchExact$bucket$$step: [{"name":"prefix","d":{"t":"arr","of":{"t":"obj","p":[["hit",{"t":"obj","n":"SearchHit","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["screen","cat","prod"]},false],["label",{"t":"str"},false],["path",{"t":"str"},false],["emoji",{"t":"str"},false],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["target",{"t":"or","of":[{"t":"obj","p":[["type",{"t":"lit","v":["screen"]},false],["key",{"t":"lit","v":["home","projects","cart","settings","notifications","orders","profile"]},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["cat"]},false],["categoryId",{"t":"str"},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["prod"]},false],["productId",{"t":"str"},false]]}]},false],["keywords",{"t":"arr","of":{"t":"str"}},false]]},false],["score",{"t":"num"},false]]}},"opt":false},{"name":"contains","d":{"t":"arr","of":{"t":"obj","p":[["hit",{"t":"obj","n":"SearchHit","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["screen","cat","prod"]},false],["label",{"t":"str"},false],["path",{"t":"str"},false],["emoji",{"t":"str"},false],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["target",{"t":"or","of":[{"t":"obj","p":[["type",{"t":"lit","v":["screen"]},false],["key",{"t":"lit","v":["home","projects","cart","settings","notifications","orders","profile"]},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["cat"]},false],["categoryId",{"t":"str"},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["prod"]},false],["productId",{"t":"str"},false]]}]},false],["keywords",{"t":"arr","of":{"t":"str"}},false]]},false],["score",{"t":"num"},false]]}},"opt":false},{"name":"bestPos","d":{"t":"num"},"opt":false}],
  inner$editDistance$prev: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$editDistance$cur: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$editDistance$cost: [{"name":"a","d":{"t":"str"},"opt":false},{"name":"b","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$searchFuzzy$q: [{"name":"query","d":{"t":"str"},"opt":false}],
  inner$searchFuzzy$tolerance: [{"name":"query","d":{"t":"str"},"opt":false}],
  inner$searchFuzzy$tolerance$$step: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$searchFuzzy$norm: [{"name":"kw","d":{"t":"str"},"opt":false}],
  inner$searchFuzzy$window: [{"name":"query","d":{"t":"str"},"opt":false},{"name":"kw","d":{"t":"str"},"opt":false}],
  inner$searchFuzzy$window$$step: [{"name":"q","d":{"t":"str"},"opt":false},{"name":"tolerance","d":{"t":"num"},"opt":false},{"name":"norm","d":{"t":"str"},"opt":false}],
  inner$searchFuzzy$slice: [{"name":"query","d":{"t":"str"},"opt":false},{"name":"kw","d":{"t":"str"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false}],
  inner$searchFuzzy$slice$$step: [{"name":"norm","d":{"t":"str"},"opt":false},{"name":"window","d":{"t":"num"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false}],
  inner$searchFuzzy$d: [{"name":"query","d":{"t":"str"},"opt":false},{"name":"kw","d":{"t":"str"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false}],
  inner$searchFuzzy$d$$step: [{"name":"q","d":{"t":"str"},"opt":false},{"name":"slice","d":{"t":"str"},"opt":false}],
  inner$searchExact$bestPos$$after_loop: [{"name":"query","d":{"t":"str"},"opt":false},{"name":"hit","d":{"t":"obj","n":"SearchHit","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["screen","cat","prod"]},false],["label",{"t":"str"},false],["path",{"t":"str"},false],["emoji",{"t":"str"},false],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["target",{"t":"or","of":[{"t":"obj","p":[["type",{"t":"lit","v":["screen"]},false],["key",{"t":"lit","v":["home","projects","cart","settings","notifications","orders","profile"]},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["cat"]},false],["categoryId",{"t":"str"},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["prod"]},false],["productId",{"t":"str"},false]]}]},false],["keywords",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$searchFuzzy$bestDist$$after_loop: [{"name":"query","d":{"t":"str"},"opt":false},{"name":"hit","d":{"t":"obj","n":"SearchHit","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["screen","cat","prod"]},false],["label",{"t":"str"},false],["path",{"t":"str"},false],["emoji",{"t":"str"},false],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["target",{"t":"or","of":[{"t":"obj","p":[["type",{"t":"lit","v":["screen"]},false],["key",{"t":"lit","v":["home","projects","cart","settings","notifications","orders","profile"]},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["cat"]},false],["categoryId",{"t":"str"},false]]},{"t":"obj","p":[["type",{"t":"lit","v":["prod"]},false],["productId",{"t":"str"},false]]}]},false],["keywords",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
};
