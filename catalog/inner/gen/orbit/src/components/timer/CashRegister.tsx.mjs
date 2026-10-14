// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/timer/CashRegister.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$DenomPad$map$map$n(counts, d) {
    const n = counts[String(d)] || 0;
    return n;
}
export function inner$CashRegister$mkBump$fn$setter$n(d, by, c) {
    const n = Math.max(0, (c[String(d)] || 0) + by);
    return n;
}
export function inner$CashRegister$dueNum(due, cart, cartTotal) {
    const dueNum = cart.length ? cartTotal : Math.max(0, Number(due) || 0);
    return dueNum;
}
export function inner$CashRegister$diff(due, cart, cartTotal, received) {
    const dueNum = cart.length ? cartTotal : Math.max(0, Number(due) || 0);
    const diff = Math.round((received - dueNum) * 100) / 100;
    return diff;
}
export function inner$CashRegister$diff$$step(dueNum, received) {
    const diff = Math.round((received - dueNum) * 100) / 100;
    return diff;
}
export function inner$CashRegister$addItem$amt(itemAmt) {
    const amt = Math.round((Number(itemAmt) || 0) * 100) / 100;
    return amt;
}
export function inner$CashRegister$bump$setCounts$n(d, by, c) {
    const n = Math.max(0, (c[String(d)] || 0) + by);
    return n;
}
export function inner$CashRegister$exact$rem(dueNum) {
    let rem = Math.round(dueNum * 100);
    return rem;
}
export function inner$CashRegister$exact$cents(d) {
    const cents = Math.round(d * 100);
    return cents;
}
export function inner$CashRegister$exact$n(rem, d) {
    const cents = Math.round(d * 100);
    const n = Math.floor(rem / cents);
    return n;
}
export function inner$CashRegister$exact$n$$step(rem, cents) {
    const n = Math.floor(rem / cents);
    return n;
}
export function inner$CashRegister$diffLabel(z) {
    const diffLabel = z.diff === 0 ? 'מאוזן ✓' : z.diff > 0 ? 'עודף' : 'חוסר';
    return diffLabel;
}
export function inner$CashRegister$diffColor(z) {
    const diffColor = z.diff === 0 ? '#12803c' : z.diff > 0 ? '#9a6414' : '#b91c1c';
    return diffColor;
}
export function inner$CashRegister$todayTotal(today) {
    const todayTotal = today.reduce((a, r) => a + r.due, 0);
    return todayTotal;
}
export function inner$CashRegister$exact$rem$$after_loop(COINS, BILLS, dueNum) {
    let rem = Math.round(dueNum * 100);
    const next = {};
    for (const d of [...BILLS, ...COINS].sort((a, b) => b - a)) {
        const cents = Math.round(d * 100);
        const n = Math.floor(rem / cents);
        if (n > 0) {
            next[String(d)] = n;
            rem -= n * cents;
        }
    }
    return rem;
}
export function inner$CashRegister$exact$next$$after_loop(COINS, BILLS, dueNum) {
    let rem = Math.round(dueNum * 100);
    const next = {};
    for (const d of [...BILLS, ...COINS].sort((a, b) => b - a)) {
        const cents = Math.round(d * 100);
        const n = Math.floor(rem / cents);
        if (n > 0) {
            next[String(d)] = n;
            rem -= n * cents;
        }
    }
    return next;
}

export const SIGS = {
  inner$DenomPad$map$map$n: [{"name":"counts","d":{"t":"rec","of":{"t":"num"}},"opt":false},{"name":"d","d":{"t":"lit","v":[1,2,50,20,100,10,5,0.5,200,0.1]},"opt":false}],
  inner$CashRegister$mkBump$fn$setter$n: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"by","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"rec","of":{"t":"num"}},"opt":false}],
  inner$CashRegister$dueNum: [{"name":"due","d":{"t":"str"},"opt":false},{"name":"cart","d":{"t":"arr","of":{"t":"obj","n":"CartItem","p":[["name",{"t":"str"},false],["amount",{"t":"num"},false]]}},"opt":false},{"name":"cartTotal","d":{"t":"num"},"opt":false}],
  inner$CashRegister$diff: [{"name":"due","d":{"t":"str"},"opt":false},{"name":"cart","d":{"t":"arr","of":{"t":"obj","n":"CartItem","p":[["name",{"t":"str"},false],["amount",{"t":"num"},false]]}},"opt":false},{"name":"cartTotal","d":{"t":"num"},"opt":false},{"name":"received","d":{"t":"num"},"opt":false}],
  inner$CashRegister$diff$$step: [{"name":"dueNum","d":{"t":"num"},"opt":false},{"name":"received","d":{"t":"num"},"opt":false}],
  inner$CashRegister$addItem$amt: [{"name":"itemAmt","d":{"t":"str"},"opt":false}],
  inner$CashRegister$bump$setCounts$n: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"by","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"rec","of":{"t":"num"}},"opt":false}],
  inner$CashRegister$exact$rem: [{"name":"dueNum","d":{"t":"num"},"opt":false}],
  inner$CashRegister$exact$cents: [{"name":"d","d":{"t":"lit","v":[1,2,50,20,100,10,5,0.5,200,0.1]},"opt":false}],
  inner$CashRegister$exact$n: [{"name":"rem","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"lit","v":[1,2,50,20,100,10,5,0.5,200,0.1]},"opt":false}],
  inner$CashRegister$exact$n$$step: [{"name":"rem","d":{"t":"num"},"opt":false},{"name":"cents","d":{"t":"num"},"opt":false}],
  inner$CashRegister$diffLabel: [{"name":"z","d":{"t":"obj","n":"ShiftClose","p":[["closedAt",{"t":"str"},false],["openedAt",{"t":"str"},false],["float",{"t":"num"},false],["sales",{"t":"num"},false],["count",{"t":"num"},false],["counted",{"t":"num"},false],["diff",{"t":"num"},false],["openChecks",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["closeChecks",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["openOther",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["closeOther",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$CashRegister$diffColor: [{"name":"z","d":{"t":"obj","n":"ShiftClose","p":[["closedAt",{"t":"str"},false],["openedAt",{"t":"str"},false],["float",{"t":"num"},false],["sales",{"t":"num"},false],["count",{"t":"num"},false],["counted",{"t":"num"},false],["diff",{"t":"num"},false],["openChecks",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["closeChecks",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["openOther",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["closeOther",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$CashRegister$todayTotal: [{"name":"today","d":{"t":"arr","of":{"t":"obj","n":"Receipt","p":[["num",{"t":"num"},false],["at",{"t":"str"},false],["client",{"t":"str"},false],["due",{"t":"num"},false],["received",{"t":"num"},false],["change",{"t":"num"},false],["items",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CartItem","p":[["name",{"t":"str"},false],["amount",{"t":"num"},false]]}}]},true]]}},"opt":false}],
  inner$CashRegister$exact$rem$$after_loop: [{"name":"COINS","d":{"t":"arr","of":{"t":"lit","v":[1,2,10,5,0.5,0.1]}},"opt":false},{"name":"BILLS","d":{"t":"arr","of":{"t":"lit","v":[50,20,100,200]}},"opt":false},{"name":"dueNum","d":{"t":"num"},"opt":false}],
  inner$CashRegister$exact$next$$after_loop: [{"name":"COINS","d":{"t":"arr","of":{"t":"lit","v":[1,2,10,5,0.5,0.1]}},"opt":false},{"name":"BILLS","d":{"t":"arr","of":{"t":"lit","v":[50,20,100,200]}},"opt":false},{"name":"dueNum","d":{"t":"num"},"opt":false}],
};
