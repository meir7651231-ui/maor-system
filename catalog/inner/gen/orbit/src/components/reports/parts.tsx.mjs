// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/reports/parts.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function sortKeyOf(c) {
    if (typeof c === 'number')
        return { n: c, s: '' };
    const t = String(c).trim();
    const dm = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dm)
        return { n: null, s: dm[3] + '-' + dm[2].padStart(2, '0') + '-' + dm[1].padStart(2, '0') };
    const nm = t.match(/-?\d+(\.\d+)?/);
    if (nm && /^[-\d.,%/\s₪$]*$/.test(t))
        return { n: parseFloat(nm[0]), s: '' };
    return { n: null, s: t };
}
export function inner$sortKeyOf$t(c) {
    const t = String(c).trim();
    return t;
}
export function inner$sortKeyOf$dm(c) {
    const t = String(c).trim();
    const dm = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return dm;
}
export function inner$sortKeyOf$dm$$step(t) {
    const dm = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return dm;
}
export function inner$sortKeyOf$nm(c) {
    const t = String(c).trim();
    const nm = t.match(/-?\d+(\.\d+)?/);
    return nm;
}
export function inner$sortKeyOf$nm$$step(t) {
    const nm = t.match(/-?\d+(\.\d+)?/);
    return nm;
}
export function inner$cellMatch$k(c) {
    const k = sortKeyOf(c);
    return k;
}
export function inner$ReportTable$active(filters) {
    const active = Object.entries(filters).filter(([, v]) => v.trim());
    return active;
}
export function inner$ReportTable$sorted(sort, filtered) {
    const sorted = sort
        ? [...filtered].sort((a, b) => {
            const ka = sortKeyOf(a.cells[sort.i] ?? '');
            const kb = sortKeyOf(b.cells[sort.i] ?? '');
            const c = ka.n !== null && kb.n !== null ? ka.n - kb.n : (ka.s || String(ka.n)).localeCompare(kb.s || String(kb.n), 'he');
            return c * sort.dir;
        })
        : filtered;
    return sorted;
}
export function inner$ReportTable$sort$ka(sort, a) {
    const ka = sortKeyOf(a.cells[sort.i] ?? '');
    return ka;
}
export function inner$ReportTable$sort$kb(sort, b) {
    const kb = sortKeyOf(b.cells[sort.i] ?? '');
    return kb;
}
export function inner$ReportTable$sort$c(sort, a, b) {
    const ka = sortKeyOf(a.cells[sort.i] ?? '');
    const kb = sortKeyOf(b.cells[sort.i] ?? '');
    const c = ka.n !== null && kb.n !== null ? ka.n - kb.n : (ka.s || String(ka.n)).localeCompare(kb.s || String(kb.n), 'he');
    return c;
}
export function inner$ReportTable$sort$c$$step(ka, kb) {
    const c = ka.n !== null && kb.n !== null ? ka.n - kb.n : (ka.s || String(ka.n)).localeCompare(kb.s || String(kb.n), 'he');
    return c;
}
export function inner$ReportTable$clickable(sort, drilldownOn, filtered) {
    const sorted = sort
        ? [...filtered].sort((a, b) => {
            const ka = sortKeyOf(a.cells[sort.i] ?? '');
            const kb = sortKeyOf(b.cells[sort.i] ?? '');
            const c = ka.n !== null && kb.n !== null ? ka.n - kb.n : (ka.s || String(ka.n)).localeCompare(kb.s || String(kb.n), 'he');
            return c * sort.dir;
        })
        : filtered;
    const clickable = drilldownOn && sorted.some((r) => r.open);
    return clickable;
}
export function inner$ReportTable$clickable$$step(drilldownOn, sorted) {
    const clickable = drilldownOn && sorted.some((r) => r.open);
    return clickable;
}
export function inner$ReportTable$map$open(drilldownOn, r) {
    const open = drilldownOn ? r.open : undefined;
    return open;
}

export const SIGS = {
  inner$sortKeyOf$t: [{"name":"c","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
  inner$sortKeyOf$dm: [{"name":"c","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
  inner$sortKeyOf$dm$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$sortKeyOf$nm: [{"name":"c","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
  inner$sortKeyOf$nm$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$cellMatch$k: [{"name":"c","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
  inner$ReportTable$active: [{"name":"filters","d":{"t":"obj","n":"Record","p":[]},"opt":false}],
  inner$ReportTable$sorted: [{"name":"sort","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["i",{"t":"num"},false],["dir",{"t":"lit","v":[1,-1]},false]]}]},"opt":false},{"name":"filtered","d":{"t":"arr","of":{"t":"obj","n":"Row","p":[["cells",{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["warn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["open",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}},"opt":false}],
  inner$ReportTable$sort$ka: [{"name":"sort","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["i",{"t":"num"},false],["dir",{"t":"lit","v":[1,-1]},false]]}]},"opt":false},{"name":"a","d":{"t":"obj","n":"Row","p":[["cells",{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["warn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["open",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]},"opt":false}],
  inner$ReportTable$sort$kb: [{"name":"sort","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["i",{"t":"num"},false],["dir",{"t":"lit","v":[1,-1]},false]]}]},"opt":false},{"name":"b","d":{"t":"obj","n":"Row","p":[["cells",{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["warn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["open",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]},"opt":false}],
  inner$ReportTable$sort$c: [{"name":"sort","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["i",{"t":"num"},false],["dir",{"t":"lit","v":[1,-1]},false]]}]},"opt":false},{"name":"a","d":{"t":"obj","n":"Row","p":[["cells",{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["warn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["open",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]},"opt":false},{"name":"b","d":{"t":"obj","n":"Row","p":[["cells",{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["warn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["open",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]},"opt":false}],
  inner$ReportTable$sort$c$$step: [{"name":"ka","d":{"t":"obj","p":[["n",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["s",{"t":"str"},false]]},"opt":false},{"name":"kb","d":{"t":"obj","p":[["n",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["s",{"t":"str"},false]]},"opt":false}],
  inner$ReportTable$clickable: [{"name":"sort","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["i",{"t":"num"},false],["dir",{"t":"lit","v":[1,-1]},false]]}]},"opt":false},{"name":"drilldownOn","d":{"t":"bool"},"opt":false},{"name":"filtered","d":{"t":"arr","of":{"t":"obj","n":"Row","p":[["cells",{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["warn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["open",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}},"opt":false}],
  inner$ReportTable$clickable$$step: [{"name":"drilldownOn","d":{"t":"bool"},"opt":false},{"name":"sorted","d":{"t":"arr","of":{"t":"obj","n":"Row","p":[["cells",{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["warn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["open",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}},"opt":false}],
  inner$ReportTable$map$open: [{"name":"drilldownOn","d":{"t":"bool"},"opt":false},{"name":"r","d":{"t":"obj","n":"Row","p":[["cells",{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["warn",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["open",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]},"opt":false}],
};
