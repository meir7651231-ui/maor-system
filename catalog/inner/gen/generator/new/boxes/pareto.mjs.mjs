// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/pareto.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$paretoReport$total(vals) {
    const total = vals.reduce((a, b) => a + b, 0);
    return total;
}
export function inner$paretoReport$desc(vals) {
    const desc = [...vals].sort((a, b) => b - a);
    return desc;
}
export function inner$paretoReport$donorPct(n, i) {
    const donorPct = ((i + 1) / n) * 100;
    return donorPct;
}
export function inner$paretoReport$moneyPct(vals, cum) {
    const total = vals.reduce((a, b) => a + b, 0);
    const moneyPct = (cum / total) * 100;
    return moneyPct;
}
export function inner$paretoReport$moneyPct$$step(total, cum) {
    const moneyPct = (cum / total) * 100;
    return moneyPct;
}
export function inner$paretoReport$asc(vals) {
    const asc = [...vals].sort((a, b) => a - b);
    return asc;
}
export function inner$paretoReport$gini(vals, n) {
    const total = vals.reduce((a, b) => a + b, 0);
    const asc = [...vals].sort((a, b) => a - b);
    let weighted = 0;
    for (let i = 0; i < n; i++)
        weighted += (i + 1) * asc[i];
    const gini = n > 1 ? (2 * weighted) / (n * total) - (n + 1) / n : 0;
    return gini;
}
export function inner$paretoReport$gini$$step(n, total, weighted) {
    const gini = n > 1 ? (2 * weighted) / (n * total) - (n + 1) / n : 0;
    return gini;
}
export function inner$paretoReport$curve$$after_loop(vals, n, M) {
    const total = vals.reduce((a, b) => a + b, 0);
    const desc = [...vals].sort((a, b) => b - a);
    const curve = [{ donorPct: 0, moneyPct: 0 }];
    let cum = 0;
    let top20Share = 0;
    let halfDonorPct = 0;
    let eightyDonorPct = 0;
    for (let i = 0; i < n; i++) {
        cum += desc[i];
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const donorPct = ((i + 1) / n) * 100;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const moneyPct = (cum / total) * 100;
        curve.push({ donorPct: Math.round(donorPct * 10) / 10, moneyPct: Math.round(moneyPct * 10) / 10 });
        if (top20Share === 0 && donorPct >= M.m1)
            top20Share = Math.round(moneyPct);
        if (halfDonorPct === 0 && moneyPct >= M.m2)
            halfDonorPct = Math.round(donorPct);
        if (eightyDonorPct === 0 && moneyPct >= M.m3)
            eightyDonorPct = Math.round(donorPct);
    }
    return curve;
}
export function inner$paretoReport$cum$$after_loop(vals, n, M) {
    const total = vals.reduce((a, b) => a + b, 0);
    const desc = [...vals].sort((a, b) => b - a);
    const curve = [{ donorPct: 0, moneyPct: 0 }];
    let cum = 0;
    let top20Share = 0;
    let halfDonorPct = 0;
    let eightyDonorPct = 0;
    for (let i = 0; i < n; i++) {
        cum += desc[i];
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const donorPct = ((i + 1) / n) * 100;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const moneyPct = (cum / total) * 100;
        curve.push({ donorPct: Math.round(donorPct * 10) / 10, moneyPct: Math.round(moneyPct * 10) / 10 });
        if (top20Share === 0 && donorPct >= M.m1)
            top20Share = Math.round(moneyPct);
        if (halfDonorPct === 0 && moneyPct >= M.m2)
            halfDonorPct = Math.round(donorPct);
        if (eightyDonorPct === 0 && moneyPct >= M.m3)
            eightyDonorPct = Math.round(donorPct);
    }
    return cum;
}
export function inner$paretoReport$top20Share$$after_loop(vals, n, M) {
    const total = vals.reduce((a, b) => a + b, 0);
    const desc = [...vals].sort((a, b) => b - a);
    const curve = [{ donorPct: 0, moneyPct: 0 }];
    let cum = 0;
    let top20Share = 0;
    let halfDonorPct = 0;
    let eightyDonorPct = 0;
    for (let i = 0; i < n; i++) {
        cum += desc[i];
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const donorPct = ((i + 1) / n) * 100;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const moneyPct = (cum / total) * 100;
        curve.push({ donorPct: Math.round(donorPct * 10) / 10, moneyPct: Math.round(moneyPct * 10) / 10 });
        if (top20Share === 0 && donorPct >= M.m1)
            top20Share = Math.round(moneyPct);
        if (halfDonorPct === 0 && moneyPct >= M.m2)
            halfDonorPct = Math.round(donorPct);
        if (eightyDonorPct === 0 && moneyPct >= M.m3)
            eightyDonorPct = Math.round(donorPct);
    }
    return top20Share;
}
export function inner$paretoReport$halfDonorPct$$after_loop(vals, n, M) {
    const total = vals.reduce((a, b) => a + b, 0);
    const desc = [...vals].sort((a, b) => b - a);
    const curve = [{ donorPct: 0, moneyPct: 0 }];
    let cum = 0;
    let top20Share = 0;
    let halfDonorPct = 0;
    let eightyDonorPct = 0;
    for (let i = 0; i < n; i++) {
        cum += desc[i];
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const donorPct = ((i + 1) / n) * 100;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const moneyPct = (cum / total) * 100;
        curve.push({ donorPct: Math.round(donorPct * 10) / 10, moneyPct: Math.round(moneyPct * 10) / 10 });
        if (top20Share === 0 && donorPct >= M.m1)
            top20Share = Math.round(moneyPct);
        if (halfDonorPct === 0 && moneyPct >= M.m2)
            halfDonorPct = Math.round(donorPct);
        if (eightyDonorPct === 0 && moneyPct >= M.m3)
            eightyDonorPct = Math.round(donorPct);
    }
    return halfDonorPct;
}
export function inner$paretoReport$eightyDonorPct$$after_loop(vals, n, M) {
    const total = vals.reduce((a, b) => a + b, 0);
    const desc = [...vals].sort((a, b) => b - a);
    const curve = [{ donorPct: 0, moneyPct: 0 }];
    let cum = 0;
    let top20Share = 0;
    let halfDonorPct = 0;
    let eightyDonorPct = 0;
    for (let i = 0; i < n; i++) {
        cum += desc[i];
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const donorPct = ((i + 1) / n) * 100;
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        const moneyPct = (cum / total) * 100;
        curve.push({ donorPct: Math.round(donorPct * 10) / 10, moneyPct: Math.round(moneyPct * 10) / 10 });
        if (top20Share === 0 && donorPct >= M.m1)
            top20Share = Math.round(moneyPct);
        if (halfDonorPct === 0 && moneyPct >= M.m2)
            halfDonorPct = Math.round(donorPct);
        if (eightyDonorPct === 0 && moneyPct >= M.m3)
            eightyDonorPct = Math.round(donorPct);
    }
    return eightyDonorPct;
}
export function inner$paretoReport$weighted$$after_loop(vals, n) {
    const asc = [...vals].sort((a, b) => a - b);
    let weighted = 0;
    for (let i = 0; i < n; i++)
        weighted += (i + 1) * asc[i];
    return weighted;
}

export const SIGS = {
  inner$paretoReport$total: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$paretoReport$desc: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$paretoReport$donorPct: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$paretoReport$moneyPct: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cum","d":{"t":"num"},"opt":false}],
  inner$paretoReport$moneyPct$$step: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"cum","d":{"t":"num"},"opt":false}],
  inner$paretoReport$asc: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$paretoReport$gini: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$paretoReport$gini$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"total","d":{"t":"num"},"opt":false},{"name":"weighted","d":{"t":"num"},"opt":false}],
  inner$paretoReport$curve$$after_loop: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$paretoReport$cum$$after_loop: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$paretoReport$top20Share$$after_loop: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$paretoReport$halfDonorPct$$after_loop: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$paretoReport$eightyDonorPct$$after_loop: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false]]},"opt":false}],
  inner$paretoReport$weighted$$after_loop: [{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
};
