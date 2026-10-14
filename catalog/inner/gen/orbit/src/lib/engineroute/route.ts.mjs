// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/engineroute/route.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const uniqSorted = (xs) => [...new Set(xs)].sort(cmp);
const int = (v, dflt, min) => typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.floor(v)) : dflt;
const popcount = (x) => {
    let c = 0;
    for (; x; x &= x - 1)
        c++;
    return c;
};
export function inner$findRoutes$maxDepth(p) {
    const maxDepth = Math.min(int(p.maxDepth, 4, 0), 8);
    return maxDepth;
}
export function inner$findRoutes$maxRoutes(p) {
    const maxRoutes = int(p.maxRoutes, 5, 1);
    return maxRoutes;
}
export function inner$findRoutes$startIds(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
    return startIds;
}
export function inner$findRoutes$startIds$$step(p, byId) {
    const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
    return startIds;
}
export function inner$findRoutes$arr(giversOf, g) {
    const arr = giversOf.get(g);
    return arr;
}
export function inner$findRoutes$goal(p) {
    const goal = uniqSorted(p.goalPlugs);
    return goal;
}
export function inner$findRoutes$plugList(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const goal = uniqSorted(p.goalPlugs);
    const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
    return plugList;
}
export function inner$findRoutes$plugList$$step(byId, goal) {
    const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
    return plugList;
}
export function inner$findRoutes$bit(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const goal = uniqSorted(p.goalPlugs);
    const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
    const bit = new Map(plugList.map((plug, i) => [plug, i]));
    return bit;
}
export function inner$findRoutes$bit$$step(plugList) {
    const bit = new Map(plugList.map((plug, i) => [plug, i]));
    return bit;
}
export function inner$findRoutes$W(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const goal = uniqSorted(p.goalPlugs);
    const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
    const W = Math.max(1, Math.ceil(plugList.length / 32));
    return W;
}
export function inner$findRoutes$W$$step(plugList) {
    const W = Math.max(1, Math.ceil(plugList.length / 32));
    return W;
}
export function inner$findRoutes$maskOf$i(bit, plug) {
    const i = bit.get(plug);
    return i;
}
export function inner$findRoutes$cand(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
    const startSet = new Set(startIds);
    const cand = [...byId.keys()].filter((id) => !startSet.has(id)).sort(cmp);
    return cand;
}
export function inner$findRoutes$cand$$step(byId, startSet) {
    const cand = [...byId.keys()].filter((id) => !startSet.has(id)).sort(cmp);
    return cand;
}
export function inner$findRoutes$idxOf(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
    const startSet = new Set(startIds);
    const cand = [...byId.keys()].filter((id) => !startSet.has(id)).sort(cmp);
    const idxOf = new Map(cand.map((id, i) => [id, i]));
    return idxOf;
}
export function inner$findRoutes$idxOf$$step(cand) {
    const idxOf = new Map(cand.map((id, i) => [id, i]));
    return idxOf;
}
export function inner$findRoutes$ownLinks(p, nobodyM, gm, nm) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
    const startSet = new Set(startIds);
    const goal = uniqSorted(p.goalPlugs);
    const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
    const W = Math.max(1, Math.ceil(plugList.length / 32));
    const cand = [...byId.keys()].filter((id) => !startSet.has(id)).sort(cmp);
    const ownLinks = cand.map((_, i) => {
        let c = 0;
        for (let w = 0; w < W; w++)
            c += popcount(nm[i][w] & ~gm[i][w] & ~nobodyM[w]);
        return c;
    });
    return ownLinks;
}
export function inner$findRoutes$ownLinks$$step(W, nobodyM, cand, gm, nm) {
    const ownLinks = cand.map((_, i) => {
        let c = 0;
        for (let w = 0; w < W; w++)
            c += popcount(nm[i][w] & ~gm[i][w] & ~nobodyM[w]);
        return c;
    });
    return ownLinks;
}
export function inner$findRoutes$giversIdx(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
    const startSet = new Set(startIds);
    const giversOf = new Map();
    for (const id of [...byId.keys()].sort(cmp)) {
        if (startSet.has(id))
            continue;
        for (const g of new Set(byId.get(id).gives)) {
            const arr = giversOf.get(g);
            if (arr)
                arr.push(id);
            else
                giversOf.set(g, [id]);
        }
    }
    const goal = uniqSorted(p.goalPlugs);
    const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
    const cand = [...byId.keys()].filter((id) => !startSet.has(id)).sort(cmp);
    const idxOf = new Map(cand.map((id, i) => [id, i]));
    const giversIdx = plugList.map((plug) => (giversOf.get(plug) ?? []).map((id) => idxOf.get(id)));
    return giversIdx;
}
export function inner$findRoutes$giversIdx$$step(giversOf, plugList, idxOf) {
    const giversIdx = plugList.map((plug) => (giversOf.get(plug) ?? []).map((id) => idxOf.get(id)));
    return giversIdx;
}
export function inner$findRoutes$numericKeys(p, N) {
    const maxDepth = Math.min(int(p.maxDepth, 4, 0), 8);
    const numericKeys = Math.pow(N + 1, maxDepth) < Number.MAX_SAFE_INTEGER;
    return numericKeys;
}
export function inner$findRoutes$numericKeys$$step(maxDepth, N) {
    const numericKeys = Math.pow(N + 1, maxDepth) < Number.MAX_SAFE_INTEGER;
    return numericKeys;
}
export function inner$findRoutes$masksOf$ga(gm, ZERO, st) {
    const ga = st.parent ? gm[st.g] : ZERO;
    return ga;
}
export function inner$findRoutes$masksOf$na(nm, ZERO, st) {
    const na = st.parent ? nm[st.g] : ZERO;
    return na;
}
export function inner$findRoutes$evaluate$ga(gm, ZERO, parent, g) {
    const ga = parent ? gm[g] : ZERO;
    return ga;
}
export function inner$findRoutes$evaluate$na(nm, ZERO, parent, g) {
    const na = parent ? nm[g] : ZERO;
    return na;
}
export function inner$findRoutes$evaluate$x(nobodyM, gm, nm, ZERO, parent, g, base, w) {
    const ga = parent ? gm[g] : ZERO;
    const na = parent ? nm[g] : ZERO;
    let x = (base.want[w] | na[w]) & ~(base.avail[w] | ga[w]) & ~nobodyM[w];
    return x;
}
export function inner$findRoutes$evaluate$x$$step(nobodyM, base, ga, na, w) {
    let x = (base.want[w] | na[w]) & ~(base.avail[w] | ga[w]) & ~nobodyM[w];
    return x;
}
export function inner$findRoutes$evaluate$low(x) {
    const low = x & -x;
    return low;
}
export function inner$findRoutes$evaluate$i(w, x) {
    const low = x & -x;
    const i = (w << 5) + 31 - Math.clz32(low);
    return i;
}
export function inner$findRoutes$evaluate$i$$step(w, low) {
    const i = (w << 5) + 31 - Math.clz32(low);
    return i;
}
export function inner$findRoutes$evaluate$avail(gm, ZERO, parent, g, base, w) {
    const ga = parent ? gm[g] : ZERO;
    const avail = base.avail[w] | ga[w];
    return avail;
}
export function inner$findRoutes$evaluate$avail$$step(base, ga, w) {
    const avail = base.avail[w] | ga[w];
    return avail;
}
export function inner$findRoutes$evaluate$fresh(startAvail, gm, ZERO, parent, g, base, w) {
    const ga = parent ? gm[g] : ZERO;
    const avail = base.avail[w] | ga[w];
    const fresh = avail & ~startAvail[w];
    return fresh;
}
export function inner$findRoutes$evaluate$fresh$$step(startAvail, w, avail) {
    const fresh = avail & ~startAvail[w];
    return fresh;
}
export function inner$findRoutes$evaluate$added(cand, idx) {
    const added = idx.map((i) => cand[i]);
    return added;
}
export function inner$findRoutes$level(root) {
    let level = root ? [root] : [];
    return level;
}
export function inner$findRoutes$checkSubsets(solvedKeys) {
    const checkSubsets = solvedKeys.size > 0;
    return checkSubsets;
}
export function inner$findRoutes$left(p, depth) {
    const maxDepth = Math.min(int(p.maxDepth, 4, 0), 8);
    const left = maxDepth - depth - 1;
    return left;
}
export function inner$findRoutes$left$$step(maxDepth, depth) {
    const left = maxDepth - depth - 1;
    return left;
}
export function inner$findRoutes$grown(st, g) {
    const grown = [...st.idx, g].sort((a, b) => a - b);
    return grown;
}
export function inner$findRoutes$linksOf$g(byId, added, plug) {
    const g = added.find((id) => byId.get(id).gives.includes(plug));
    return g;
}
export function inner$findRoutes$linksOf$g_L360(byId, added, n) {
    const addedSet = new Set(added);
    const g = added.find((a) => addedSet.has(a) && byId.get(a).gives.includes(n));
    return g;
}
export function inner$findRoutes$linksOf$g_L360$$step(byId, added, addedSet, n) {
    const g = added.find((a) => addedSet.has(a) && byId.get(a).gives.includes(n));
    return g;
}
export function inner$findRoutes$toRoute$pos(order) {
    const pos = new Map(order.map((id, i) => [id, i]));
    return pos;
}
export function inner$findRoutes$toRoute$steps(order) {
    const steps = order.map((add) => ({ add, links: [] }));
    return steps;
}
export function inner$findRoutes$byId$$after_loop(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    return byId;
}
export function inner$findRoutes$startGives$$after_loop(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
    const startGives = new Set();
    for (const id of startIds)
        for (const g of byId.get(id).gives)
            startGives.add(g);
    return startGives;
}
export function inner$findRoutes$giversOf$$after_loop(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
    const startSet = new Set(startIds);
    const giversOf = new Map();
    for (const id of [...byId.keys()].sort(cmp)) {
        if (startSet.has(id))
            continue;
        for (const g of new Set(byId.get(id).gives)) {
            const arr = giversOf.get(g);
            if (arr)
                arr.push(id);
            else
                giversOf.set(g, [id]);
        }
    }
    return giversOf;
}
export function inner$findRoutes$maxGives$$after_loop(p) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    let maxGives = 1;
    for (const part of byId.values())
        maxGives = Math.max(maxGives, new Set(part.gives).size);
    return maxGives;
}
export function inner$findRoutes$maskOf$m$$after_loop(bit, W, plugs) {
    const m = new Uint32Array(W);
    for (const plug of plugs) {
        const i = bit.get(plug);
        m[i >>> 5] |= 1 << (i & 31);
    }
    return m;
}
export function inner$findRoutes$plugsIn$out$$after_loop(plugList, m) {
    const out = [];
    for (let i = 0; i < plugList.length; i++)
        if (m[i >>> 5] & (1 << (i & 31)))
            out.push(plugList[i]);
    return out;
}
export function inner$findRoutes$map$c$$after_loop(W, nobodyM, gm, nm, i) {
    let c = 0;
    for (let w = 0; w < W; w++)
        c += popcount(nm[i][w] & ~gm[i][w] & ~nobodyM[w]);
    return c;
}
export function inner$findRoutes$goalLinks$$after_loop(p, startAvail, goalM) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const goal = uniqSorted(p.goalPlugs);
    const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
    const W = Math.max(1, Math.ceil(plugList.length / 32));
    let goalLinks = 0;
    for (let w = 0; w < W; w++)
        goalLinks += popcount(goalM[w] & ~startAvail[w]);
    return goalLinks;
}
export function inner$findRoutes$keyOf$k$$after_loop(N, idx) {
    let k = 0;
    for (const i of idx)
        k = k * (N + 1) + i + 1;
    return k;
}
export function inner$findRoutes$hasSolvedSubset$sub$$after_loop(idx, n, m) {
    const sub = [];
    for (let i = 0; i < n; i++)
        if (m & (1 << i))
            sub.push(idx[i]);
    return sub;
}
export function inner$findRoutes$masksOf$avail$$after_loop(W, gm, nm, ZERO, st, base) {
    const ga = st.parent ? gm[st.g] : ZERO;
    const na = st.parent ? nm[st.g] : ZERO;
    const avail = [];
    const want = [];
    for (let w = 0; w < W; w++) {
        avail.push(base.avail[w] | ga[w]);
        want.push(base.want[w] | na[w]);
    }
    return avail;
}
export function inner$findRoutes$masksOf$want$$after_loop(W, gm, nm, ZERO, st, base) {
    const ga = st.parent ? gm[st.g] : ZERO;
    const na = st.parent ? nm[st.g] : ZERO;
    const avail = [];
    const want = [];
    for (let w = 0; w < W; w++) {
        avail.push(base.avail[w] | ga[w]);
        want.push(base.want[w] | na[w]);
    }
    return want;
}
export function inner$findRoutes$evaluate$openCount$$after_loop(W, nobodyM, gm, nm, giversIdx, ZERO, parent, g, base) {
    const ga = parent ? gm[g] : ZERO;
    const na = parent ? nm[g] : ZERO;
    let openCount = 0;
    let pivot = -1;
    for (let w = 0; w < W; w++) {
        let x = (base.want[w] | na[w]) & ~(base.avail[w] | ga[w]) & ~nobodyM[w];
        while (x) {
            const low = x & -x;
            const i = (w << 5) + 31 - Math.clz32(low);
            x ^= low;
            openCount++;
            // מתפצלים על התקע הפתוח עם הכי מעט נותנים (שלם באותה מידה, הרבה פחות ענפים); תיקו ⇒ הראשון לפי מזהה.
            if (pivot < 0 || giversIdx[i].length < giversIdx[pivot].length)
                pivot = i;
        }
    }
    return openCount;
}
export function inner$findRoutes$evaluate$pivot$$after_loop(W, nobodyM, gm, nm, giversIdx, ZERO, parent, g, base) {
    const ga = parent ? gm[g] : ZERO;
    const na = parent ? nm[g] : ZERO;
    let openCount = 0;
    let pivot = -1;
    for (let w = 0; w < W; w++) {
        let x = (base.want[w] | na[w]) & ~(base.avail[w] | ga[w]) & ~nobodyM[w];
        while (x) {
            const low = x & -x;
            const i = (w << 5) + 31 - Math.clz32(low);
            x ^= low;
            openCount++;
            // מתפצלים על התקע הפתוח עם הכי מעט נותנים (שלם באותה מידה, הרבה פחות ענפים); תיקו ⇒ הראשון לפי מזהה.
            if (pivot < 0 || giversIdx[i].length < giversIdx[pivot].length)
                pivot = i;
        }
    }
    return pivot;
}
export function inner$findRoutes$childOpen$$after_loop(p, nobodyM, gm, nm, base, g) {
    const byId = new Map();
    for (const part of p.parts)
        if (!byId.has(part.id))
            byId.set(part.id, part);
    const goal = uniqSorted(p.goalPlugs);
    const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
    const W = Math.max(1, Math.ceil(plugList.length / 32));
    let childOpen = 0;
    for (let w = 0; w < W; w++) {
        childOpen += popcount((base.want[w] | nm[g][w]) & ~(base.avail[w] | gm[g][w]) & ~nobodyM[w]);
    }
    return childOpen;
}

export const SIGS = {
  inner$findRoutes$maxDepth: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$maxRoutes: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$startIds: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$startIds$$step: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false}],
  inner$findRoutes$arr: [{"name":"giversOf","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"g","d":{"t":"str"},"opt":false}],
  inner$findRoutes$goal: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$plugList: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$plugList$$step: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"goal","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$findRoutes$bit: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$bit$$step: [{"name":"plugList","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$findRoutes$W: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$W$$step: [{"name":"plugList","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$findRoutes$maskOf$i: [{"name":"bit","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false},{"name":"plug","d":{"t":"str"},"opt":false}],
  inner$findRoutes$cand: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$cand$$step: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"startSet","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$findRoutes$idxOf: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$idxOf$$step: [{"name":"cand","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$findRoutes$ownLinks: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"nobodyM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false}],
  inner$findRoutes$ownLinks$$step: [{"name":"W","d":{"t":"num"},"opt":false},{"name":"nobodyM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"cand","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false}],
  inner$findRoutes$giversIdx: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$giversIdx$$step: [{"name":"giversOf","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"plugList","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"idxOf","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false}],
  inner$findRoutes$numericKeys: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"N","d":{"t":"num"},"opt":false}],
  inner$findRoutes$numericKeys$$step: [{"name":"maxDepth","d":{"t":"num"},"opt":false},{"name":"N","d":{"t":"num"},"opt":false}],
  inner$findRoutes$masksOf$ga: [{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"st","d":{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]},"opt":false}],
  inner$findRoutes$masksOf$na: [{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"st","d":{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]},"opt":false}],
  inner$findRoutes$evaluate$ga: [{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"parent","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]}]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$na: [{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"parent","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]}]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$x: [{"name":"nobodyM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"parent","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]}]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false},{"name":"w","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$x$$step: [{"name":"nobodyM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false},{"name":"ga","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"na","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"w","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$low: [{"name":"x","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$i: [{"name":"w","d":{"t":"num"},"opt":false},{"name":"x","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$i$$step: [{"name":"w","d":{"t":"num"},"opt":false},{"name":"low","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$avail: [{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"parent","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]}]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false},{"name":"w","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$avail$$step: [{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false},{"name":"ga","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"w","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$fresh: [{"name":"startAvail","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"parent","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]}]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false},{"name":"w","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$fresh$$step: [{"name":"startAvail","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"w","d":{"t":"num"},"opt":false},{"name":"avail","d":{"t":"num"},"opt":false}],
  inner$findRoutes$evaluate$added: [{"name":"cand","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"idx","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$findRoutes$level: [{"name":"root","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]}]},"opt":false}],
  inner$findRoutes$checkSubsets: [{"name":"solvedKeys","d":{"t":"set","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$findRoutes$left: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"depth","d":{"t":"num"},"opt":false}],
  inner$findRoutes$left$$step: [{"name":"maxDepth","d":{"t":"num"},"opt":false},{"name":"depth","d":{"t":"num"},"opt":false}],
  inner$findRoutes$grown: [{"name":"st","d":{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false}],
  inner$findRoutes$linksOf$g: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"added","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"plug","d":{"t":"str"},"opt":false}],
  inner$findRoutes$linksOf$g_L360: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"added","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"n","d":{"t":"str"},"opt":false}],
  inner$findRoutes$linksOf$g_L360$$step: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"added","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"addedSet","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"n","d":{"t":"str"},"opt":false}],
  inner$findRoutes$toRoute$pos: [{"name":"order","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$findRoutes$toRoute$steps: [{"name":"order","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$findRoutes$byId$$after_loop: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$startGives$$after_loop: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$giversOf$$after_loop: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$maxGives$$after_loop: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$findRoutes$maskOf$m$$after_loop: [{"name":"bit","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false},{"name":"W","d":{"t":"num"},"opt":false},{"name":"plugs","d":{"t":"obj","n":"Iterable","p":[]},"opt":false}],
  inner$findRoutes$plugsIn$out$$after_loop: [{"name":"plugList","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"m","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$findRoutes$map$c$$after_loop: [{"name":"W","d":{"t":"num"},"opt":false},{"name":"nobodyM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$findRoutes$goalLinks$$after_loop: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"startAvail","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"goalM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$findRoutes$keyOf$k$$after_loop: [{"name":"N","d":{"t":"num"},"opt":false},{"name":"idx","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$findRoutes$hasSolvedSubset$sub$$after_loop: [{"name":"idx","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false}],
  inner$findRoutes$masksOf$avail$$after_loop: [{"name":"W","d":{"t":"num"},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"st","d":{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false}],
  inner$findRoutes$masksOf$want$$after_loop: [{"name":"W","d":{"t":"num"},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"st","d":{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false}],
  inner$findRoutes$evaluate$openCount$$after_loop: [{"name":"W","d":{"t":"num"},"opt":false},{"name":"nobodyM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"giversIdx","d":{"t":"arr","of":{"t":"arr","of":{"t":"num"}}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"parent","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]}]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false}],
  inner$findRoutes$evaluate$pivot$$after_loop: [{"name":"W","d":{"t":"num"},"opt":false},{"name":"nobodyM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"giversIdx","d":{"t":"arr","of":{"t":"arr","of":{"t":"num"}}},"opt":false},{"name":"ZERO","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"parent","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[["idx",{"t":"arr","of":{"t":"num"}},false],["parent",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"State","p":[]}]},false],["g",{"t":"num"},false],["avail",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["want",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"num"}}]},false],["pivot",{"t":"num"},false],["openCount",{"t":"num"},false]]}]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false}],
  inner$findRoutes$childOpen$$after_loop: [{"name":"p","d":{"t":"obj","n":"FindRoutesInput","p":[["parts",{"t":"arr","of":{"t":"obj","n":"RoutePart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["gives",{"t":"arr","of":{"t":"str"}},false],["needs",{"t":"arr","of":{"t":"str"}},false]]}},false],["start",{"t":"arr","of":{"t":"str"}},false],["goalPlugs",{"t":"arr","of":{"t":"str"}},false],["maxDepth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["maxRoutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"nobodyM","d":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"gm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"nm","d":{"t":"arr","of":{"t":"obj","n":"Uint32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"or","of":[{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},{"t":"obj","n":"SharedArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]}},"opt":false},{"name":"base","d":{"t":"obj","p":[["avail",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false],["want",{"t":"obj","n":"ArrayLike","p":[["length",{"t":"num"},false]]},false]]},"opt":false},{"name":"g","d":{"t":"num"},"opt":false}],
};
