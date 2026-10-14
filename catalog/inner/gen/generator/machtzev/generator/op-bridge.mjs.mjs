// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/op-bridge.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const TAG2MOD = { inv: 'schoolos.dart', stu: 'schoolos_students.dart', par: 'schoolos_parents.dart', att: 'schoolos_attendance.dart', crs: 'schoolos_courses.dart', tch: 'schoolos_teachers.dart', rm: 'schoolos_rooms.dart', fee: 'schoolos_fees.dart', dash: 'schoolos_dashboard.dart' };
const r3 = (x) => +x.toFixed(4);
export function inner$learn$map$frs(FR, tag) {
    const frs = FR.filter((f) => f.module === TAG2MOD[tag]);
    return frs;
}
export function inner$learn$g1All(mods) {
    const g1All = [...new Set(mods.flatMap((m) => Object.keys(m.tf)))].sort();
    return g1All;
}
export function inner$learn$g2All(mods) {
    const g2All = [...new Set(mods.flatMap((m) => m.g2))].sort();
    return g2All;
}
export function inner$learn$df(mods) {
    const g2All = [...new Set(mods.flatMap((m) => m.g2))].sort();
    const df = Object.fromEntries(g2All.map((g) => [g, mods.filter((m) => m.g2.includes(g)).length]));
    return df;
}
export function inner$learn$df$$step(mods, g2All) {
    const df = Object.fromEntries(g2All.map((g) => [g, mods.filter((m) => m.g2.includes(g)).length]));
    return df;
}
export function inner$learn$idf(mods) {
    const g1All = [...new Set(mods.flatMap((m) => Object.keys(m.tf)))].sort();
    const idf = Object.fromEntries(g1All.map((g) => [g, Math.log(1 + mods.length / mods.filter((m) => m.tf[g]).length)]));
    return idf;
}
export function inner$learn$idf$$step(mods, g1All) {
    const idf = Object.fromEntries(g1All.map((g) => [g, Math.log(1 + mods.length / mods.filter((m) => m.tf[g]).length)]));
    return idf;
}
export function inner$learn$top(mods) {
    const g1All = [...new Set(mods.flatMap((m) => Object.keys(m.tf)))].sort();
    const g2All = [...new Set(mods.flatMap((m) => m.g2))].sort();
    const df = Object.fromEntries(g2All.map((g) => [g, mods.filter((m) => m.g2.includes(g)).length]));
    const idf = Object.fromEntries(g1All.map((g) => [g, Math.log(1 + mods.length / mods.filter((m) => m.tf[g]).length)]));
    const affinity = {};
    for (const g2 of g2All) {
        affinity[g2] = {};
        for (const g1 of g1All) {
            let s = 0;
            for (const m of mods)
                if (m.g2.includes(g2) && m.tf[g1])
                    s += m.tf[g1];
            affinity[g2][g1] = r3(s / df[g2] * idf[g1]);
        }
    }
    const top = Object.fromEntries(g2All.map((g2) => [g2, Object.entries(affinity[g2]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}:${v}`)]));
    return top;
}
export function inner$learn$top$$step(g2All, affinity) {
    const top = Object.fromEntries(g2All.map((g2) => [g2, Object.entries(affinity[g2]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}:${v}`)]));
    return top;
}
export function inner$cos$ks(a, b) {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    return ks;
}
export function inner$map$frs(FR, tag) {
    const frs = FR.filter((f) => f.module === TAG2MOD[tag]);
    return frs;
}
export function inner$learn$affinity$$after_loop(mods) {
    const g1All = [...new Set(mods.flatMap((m) => Object.keys(m.tf)))].sort();
    const g2All = [...new Set(mods.flatMap((m) => m.g2))].sort();
    const df = Object.fromEntries(g2All.map((g) => [g, mods.filter((m) => m.g2.includes(g)).length]));
    const idf = Object.fromEntries(g1All.map((g) => [g, Math.log(1 + mods.length / mods.filter((m) => m.tf[g]).length)]));
    const affinity = {};
    for (const g2 of g2All) {
        affinity[g2] = {};
        for (const g1 of g1All) {
            let s = 0;
            for (const m of mods)
                if (m.g2.includes(g2) && m.tf[g1])
                    s += m.tf[g1];
            affinity[g2][g1] = r3(s / df[g2] * idf[g1]);
        }
    }
    return affinity;
}
export function inner$learn$s$$after_loop(mods, g2, g1) {
    let s = 0;
    for (const m of mods)
        if (m.g2.includes(g2) && m.tf[g1])
            s += m.tf[g1];
    return s;
}
export function inner$expectedOps$score$$after_loop(bridge, ops) {
    const score = {};
    for (const g2 of ops)
        for (const [g1, v] of Object.entries(bridge.affinity[g2] || {}))
            score[g1] = (score[g1] || 0) + v;
    return score;
}
export function inner$cos$d$$after_loop(a, b) {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    let d = 0;
    let na = 0;
    let nb = 0;
    for (const k of ks) {
        d += (a[k] || 0) * (b[k] || 0);
        na += (a[k] || 0) ** 2;
        nb += (b[k] || 0) ** 2;
    }
    return d;
}
export function inner$cos$na$$after_loop(a, b) {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    let d = 0;
    let na = 0;
    let nb = 0;
    for (const k of ks) {
        d += (a[k] || 0) * (b[k] || 0);
        na += (a[k] || 0) ** 2;
        nb += (b[k] || 0) ** 2;
    }
    return na;
}
export function inner$cos$nb$$after_loop(a, b) {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    let d = 0;
    let na = 0;
    let nb = 0;
    for (const k of ks) {
        d += (a[k] || 0) * (b[k] || 0);
        na += (a[k] || 0) ** 2;
        nb += (b[k] || 0) ** 2;
    }
    return nb;
}

export const SIGS = {
  inner$learn$map$frs: [{"name":"FR","d":{"t":"any"},"opt":false},{"name":"tag","d":{"t":"str"},"opt":false}],
  inner$learn$g1All: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false}],
  inner$learn$g2All: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false}],
  inner$learn$df: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false}],
  inner$learn$df$$step: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false},{"name":"g2All","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$learn$idf: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false}],
  inner$learn$idf$$step: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false},{"name":"g1All","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$learn$top: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false}],
  inner$learn$top$$step: [{"name":"g2All","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"affinity","d":{"t":"obj","n":"affinity","p":[]},"opt":false}],
  inner$cos$ks: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$map$frs: [{"name":"FR","d":{"t":"any"},"opt":false},{"name":"tag","d":{"t":"str"},"opt":false}],
  inner$learn$affinity$$after_loop: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false}],
  inner$learn$s$$after_loop: [{"name":"mods","d":{"t":"arr","of":{"t":"obj","p":[["tag",{"t":"str"},false],["g2",{"t":"arr","of":{"t":"any"}},false],["tf",{"t":"obj","n":"tf","p":[]},false]]}},"opt":false},{"name":"g2","d":{"t":"any"},"opt":false},{"name":"g1","d":{"t":"str"},"opt":false}],
  inner$expectedOps$score$$after_loop: [{"name":"bridge","d":{"t":"any"},"opt":false},{"name":"ops","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$cos$d$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$cos$na$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$cos$nb$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
};
