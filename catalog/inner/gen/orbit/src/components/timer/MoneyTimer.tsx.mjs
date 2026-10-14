// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/timer/MoneyTimer.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function money(n) {
    return '₪' + (Math.round(n * 100) / 100).toLocaleString('he-IL');
}
export function inner$loadCollections$arr(raw) {
    const arr = raw ? JSON.parse(raw) : [];
    return arr;
}
export function inner$fmtDur$s(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    return s;
}
export function inner$fmtDur$h(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(s / 3600);
    return h;
}
export function inner$fmtDur$h$$step(s) {
    const h = Math.floor(s / 3600);
    return h;
}
export function inner$fmtDur$m(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const m = Math.floor((s % 3600) / 60);
    return m;
}
export function inner$fmtDur$m$$step(s) {
    const m = Math.floor((s % 3600) / 60);
    return m;
}
export function inner$fmtDur$ss(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const ss = s % 60;
    return ss;
}
export function inner$fmtDur$ss$$step(s) {
    const ss = s % 60;
    return ss;
}
export function inner$MoneyTimer$defaultRate(rooms) {
    const defaultRate = rooms.find((r) => r.rate && r.rate > 0)?.rate ?? 0;
    return defaultRate;
}
export function inner$MoneyTimer$running(startTs) {
    const running = startTs !== null;
    return running;
}
export function inner$MoneyTimer$elapsedSec(accumSec, startTs, now) {
    const elapsedSec = accumSec + (startTs !== null ? Math.max(0, (now - startTs) / 1000) : 0);
    return elapsedSec;
}
export function inner$MoneyTimer$rateNum(rate) {
    const rateNum = Math.max(0, Number(rate) || 0);
    return rateNum;
}
export function inner$MoneyTimer$timerTargetSec(timerMin) {
    const timerTargetSec = Math.max(0, (Number(timerMin) || 0) * 60);
    return timerTargetSec;
}
export function inner$MoneyTimer$shownSec(mode, timerMin, accumSec, startTs, now) {
    const elapsedSec = accumSec + (startTs !== null ? Math.max(0, (now - startTs) / 1000) : 0);
    const timerTargetSec = Math.max(0, (Number(timerMin) || 0) * 60);
    const shownSec = mode === 'timer' ? Math.max(0, timerTargetSec - elapsedSec) : elapsedSec;
    return shownSec;
}
export function inner$MoneyTimer$shownSec$$step(mode, elapsedSec, timerTargetSec) {
    const shownSec = mode === 'timer' ? Math.max(0, timerTargetSec - elapsedSec) : elapsedSec;
    return shownSec;
}
export function inner$MoneyTimer$amount(rate, accumSec, startTs, now) {
    const elapsedSec = accumSec + (startTs !== null ? Math.max(0, (now - startTs) / 1000) : 0);
    const rateNum = Math.max(0, Number(rate) || 0);
    const amount = rateNum * (elapsedSec / 3600);
    return amount;
}
export function inner$MoneyTimer$amount$$step(elapsedSec, rateNum) {
    const amount = rateNum * (elapsedSec / 3600);
    return amount;
}
export function inner$MoneyTimer$useEffect$timeCapSec(mode, timeCapMin) {
    const timeCapSec = mode === 'stopwatch' ? (Number(timeCapMin) || 0) * 60 : 0;
    return timeCapSec;
}
export function inner$MoneyTimer$useEffect$moneyCapNum(moneyCap) {
    const moneyCapNum = Number(moneyCap) || 0;
    return moneyCapNum;
}
export function inner$MoneyTimer$useEffect$timerDone(mode, elapsedSec, timerTargetSec) {
    const timerDone = mode === 'timer' && elapsedSec >= timerTargetSec && timerTargetSec > 0;
    return timerDone;
}
export function inner$MoneyTimer$useEffect$timeCapDone(mode, timeCapMin, elapsedSec) {
    const timeCapSec = mode === 'stopwatch' ? (Number(timeCapMin) || 0) * 60 : 0;
    const timeCapDone = timeCapSec > 0 && elapsedSec >= timeCapSec;
    return timeCapDone;
}
export function inner$MoneyTimer$useEffect$timeCapDone$$step(elapsedSec, timeCapSec) {
    const timeCapDone = timeCapSec > 0 && elapsedSec >= timeCapSec;
    return timeCapDone;
}
export function inner$MoneyTimer$useEffect$moneyCapDone(moneyCap, amount) {
    const moneyCapNum = Number(moneyCap) || 0;
    const moneyCapDone = moneyCapNum > 0 && amount >= moneyCapNum;
    return moneyCapDone;
}
export function inner$MoneyTimer$useEffect$moneyCapDone$$step(amount, moneyCapNum) {
    const moneyCapDone = moneyCapNum > 0 && amount >= moneyCapNum;
    return moneyCapDone;
}
export function inner$MoneyTimer$collect$amt(rateNum, secs) {
    const amt = Math.round(rateNum * (secs / 3600) * 100) / 100;
    return amt;
}
export function inner$MoneyTimer$collect$next(collections, rec) {
    const next = [rec, ...collections].slice(0, 100);
    return next;
}
export function inner$MoneyTimer$bigMoney(rate, accumSec, startTs, now) {
    const elapsedSec = accumSec + (startTs !== null ? Math.max(0, (now - startTs) / 1000) : 0);
    const rateNum = Math.max(0, Number(rate) || 0);
    const amount = rateNum * (elapsedSec / 3600);
    const bigMoney = money(amount);
    return bigMoney;
}
export function inner$MoneyTimer$bigMoney$$step(amount) {
    const bigMoney = money(amount);
    return bigMoney;
}

export const SIGS = {
  inner$loadCollections$arr: [{"name":"raw","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$fmtDur$s: [{"name":"totalSec","d":{"t":"num"},"opt":false}],
  inner$fmtDur$h: [{"name":"totalSec","d":{"t":"num"},"opt":false}],
  inner$fmtDur$h$$step: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$fmtDur$m: [{"name":"totalSec","d":{"t":"num"},"opt":false}],
  inner$fmtDur$m$$step: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$fmtDur$ss: [{"name":"totalSec","d":{"t":"num"},"opt":false}],
  inner$fmtDur$ss$$step: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$defaultRate: [{"name":"rooms","d":{"t":"arr","of":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]}},"opt":false}],
  inner$MoneyTimer$running: [{"name":"startTs","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$MoneyTimer$elapsedSec: [{"name":"accumSec","d":{"t":"num"},"opt":false},{"name":"startTs","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$rateNum: [{"name":"rate","d":{"t":"str"},"opt":false}],
  inner$MoneyTimer$timerTargetSec: [{"name":"timerMin","d":{"t":"str"},"opt":false}],
  inner$MoneyTimer$shownSec: [{"name":"mode","d":{"t":"lit","v":["timer","stopwatch"]},"opt":false},{"name":"timerMin","d":{"t":"str"},"opt":false},{"name":"accumSec","d":{"t":"num"},"opt":false},{"name":"startTs","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$shownSec$$step: [{"name":"mode","d":{"t":"lit","v":["timer","stopwatch"]},"opt":false},{"name":"elapsedSec","d":{"t":"num"},"opt":false},{"name":"timerTargetSec","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$amount: [{"name":"rate","d":{"t":"str"},"opt":false},{"name":"accumSec","d":{"t":"num"},"opt":false},{"name":"startTs","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$amount$$step: [{"name":"elapsedSec","d":{"t":"num"},"opt":false},{"name":"rateNum","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$useEffect$timeCapSec: [{"name":"mode","d":{"t":"lit","v":["timer","stopwatch"]},"opt":false},{"name":"timeCapMin","d":{"t":"str"},"opt":false}],
  inner$MoneyTimer$useEffect$moneyCapNum: [{"name":"moneyCap","d":{"t":"str"},"opt":false}],
  inner$MoneyTimer$useEffect$timerDone: [{"name":"mode","d":{"t":"lit","v":["timer","stopwatch"]},"opt":false},{"name":"elapsedSec","d":{"t":"num"},"opt":false},{"name":"timerTargetSec","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$useEffect$timeCapDone: [{"name":"mode","d":{"t":"lit","v":["timer","stopwatch"]},"opt":false},{"name":"timeCapMin","d":{"t":"str"},"opt":false},{"name":"elapsedSec","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$useEffect$timeCapDone$$step: [{"name":"elapsedSec","d":{"t":"num"},"opt":false},{"name":"timeCapSec","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$useEffect$moneyCapDone: [{"name":"moneyCap","d":{"t":"str"},"opt":false},{"name":"amount","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$useEffect$moneyCapDone$$step: [{"name":"amount","d":{"t":"num"},"opt":false},{"name":"moneyCapNum","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$collect$amt: [{"name":"rateNum","d":{"t":"num"},"opt":false},{"name":"secs","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$collect$next: [{"name":"collections","d":{"t":"arr","of":{"t":"obj","n":"TimerCollection","p":[["id",{"t":"str"},false],["at",{"t":"str"},false],["seconds",{"t":"num"},false],["rate",{"t":"num"},false],["amount",{"t":"num"},false],["client",{"t":"str"},false]]}},"opt":false},{"name":"rec","d":{"t":"obj","n":"TimerCollection","p":[["id",{"t":"str"},false],["at",{"t":"str"},false],["seconds",{"t":"num"},false],["rate",{"t":"num"},false],["amount",{"t":"num"},false],["client",{"t":"str"},false]]},"opt":false}],
  inner$MoneyTimer$bigMoney: [{"name":"rate","d":{"t":"str"},"opt":false},{"name":"accumSec","d":{"t":"num"},"opt":false},{"name":"startTs","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$MoneyTimer$bigMoney$$step: [{"name":"amount","d":{"t":"num"},"opt":false}],
};
