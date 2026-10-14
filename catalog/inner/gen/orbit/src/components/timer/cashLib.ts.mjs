// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/timer/cashLib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const CASH_DENOMS = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.1];
export function inner$changeBreakdown$rem(amount) {
    let rem = Math.round((Number(amount) || 0) * 100);
    return rem;
}
export function inner$changeBreakdown$cents(d) {
    const cents = Math.round(d * 100);
    return cents;
}
export function inner$changeBreakdown$n(rem, d) {
    const cents = Math.round(d * 100);
    const n = Math.floor(rem / cents);
    return n;
}
export function inner$changeBreakdown$n$$step(rem, cents) {
    const n = Math.floor(rem / cents);
    return n;
}
export function inner$cashSuggestions$name(c) {
    const name = (c.name || '').trim();
    return name;
}
export function inner$filterCashSuggest$words(q) {
    const words = (q || '').trim().toLowerCase().split(/\s+/u).filter(Boolean);
    return words;
}
export function inner$filterCashSuggest$filter$n(s) {
    const n = s.name.toLowerCase();
    return n;
}
export function inner$payerSuggestions$push$nm(name) {
    const nm = (name || '').trim();
    return nm;
}
export function inner$payerSuggestions$fname(f) {
    const fname = (f.name || '').trim();
    return fname;
}
export function inner$payerSuggestions$fsub(f) {
    const fsub = (f.city || '').trim() || (f.phone || '').trim();
    return fsub;
}
export function inner$payerSuggestions$first(m) {
    const first = (m.first || '').trim();
    return first;
}
export function inner$changeBreakdown$rem$$after_loop(amount) {
    let rem = Math.round((Number(amount) || 0) * 100);
    const out = [];
    for (const d of CASH_DENOMS) {
        const cents = Math.round(d * 100);
        const n = Math.floor(rem / cents);
        if (n > 0) {
            out.push({ denom: d, count: n });
            rem -= n * cents;
        }
    }
    return rem;
}
export function inner$changeBreakdown$out$$after_loop(amount) {
    let rem = Math.round((Number(amount) || 0) * 100);
    const out = [];
    for (const d of CASH_DENOMS) {
        const cents = Math.round(d * 100);
        const n = Math.floor(rem / cents);
        if (n > 0) {
            out.push({ denom: d, count: n });
            rem -= n * cents;
        }
    }
    return out;
}
export function inner$cashSuggestions$seen$$after_loop(courses) {
    const seen = new Set();
    const out = [];
    for (const c of courses || []) {
        const name = (c.name || '').trim();
        if (!name || seen.has(name))
            continue;
        seen.add(name);
        out.push({ name, amount: Number.isFinite(c.price) ? c.price : 0, hint: 'חוג' });
    }
    return seen;
}
export function inner$cashSuggestions$out$$after_loop(courses) {
    const seen = new Set();
    const out = [];
    for (const c of courses || []) {
        const name = (c.name || '').trim();
        if (!name || seen.has(name))
            continue;
        seen.add(name);
        out.push({ name, amount: Number.isFinite(c.price) ? c.price : 0, hint: 'חוג' });
    }
    return out;
}

export const SIGS = {
  inner$changeBreakdown$rem: [{"name":"amount","d":{"t":"num"},"opt":false}],
  inner$changeBreakdown$cents: [{"name":"d","d":{"t":"lit","v":[1,2,50,20,100,10,5,0.5,200,0.1]},"opt":false}],
  inner$changeBreakdown$n: [{"name":"rem","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"lit","v":[1,2,50,20,100,10,5,0.5,200,0.1]},"opt":false}],
  inner$changeBreakdown$n$$step: [{"name":"rem","d":{"t":"num"},"opt":false},{"name":"cents","d":{"t":"num"},"opt":false}],
  inner$cashSuggestions$name: [{"name":"c","d":{"t":"obj","p":[["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$filterCashSuggest$words: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$filterCashSuggest$filter$n: [{"name":"s","d":{"t":"tp","id":"T","of":{"t":"obj","p":[["name",{"t":"str"},false]]}},"opt":false}],
  inner$payerSuggestions$push$nm: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$payerSuggestions$fname: [{"name":"f","d":{"t":"obj","n":"PayerFamily","p":[["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["phone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["first",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true]]},"opt":false}],
  inner$payerSuggestions$fsub: [{"name":"f","d":{"t":"obj","n":"PayerFamily","p":[["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["phone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["members",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["first",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true]]},"opt":false}],
  inner$payerSuggestions$first: [{"name":"m","d":{"t":"obj","p":[["first",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["isParent",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$changeBreakdown$rem$$after_loop: [{"name":"amount","d":{"t":"num"},"opt":false}],
  inner$changeBreakdown$out$$after_loop: [{"name":"amount","d":{"t":"num"},"opt":false}],
  inner$cashSuggestions$seen$$after_loop: [{"name":"courses","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}},"opt":false}],
  inner$cashSuggestions$out$$after_loop: [{"name":"courses","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}},"opt":false}],
};
