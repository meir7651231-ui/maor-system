// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/Ambient.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$GoldDust$useEffect$size$n(w, h) {
    const n = Math.round(Math.min(46, (w * h) / 14000));
    return n;
}
export function inner$GoldDust$useEffect$loop$dt(lt, t) {
    const dt = Math.min(0.05, (t - lt) / 1000);
    return dt;
}
export function inner$GoldDust$useEffect$loop$i(parts) {
    let i = parts.length - 1;
    return i;
}
export function inner$GoldDust$useEffect$loop$tw(p) {
    const tw = 0.45 + 0.55 * Math.sin(p.ph);
    return tw;
}
export function inner$GoldDust$useEffect$loop$a(dark, p) {
    const light = !dark.current;
    const tw = 0.45 + 0.55 * Math.sin(p.ph);
    const a = (p.b ? Math.min(1, p.life) : 0.2 + 0.5 * p.z) * tw * (light ? 0.5 : 0.9);
    return a;
}
export function inner$GoldDust$useEffect$loop$a$$step(light, p, tw) {
    const a = (p.b ? Math.min(1, p.life) : 0.2 + 0.5 * p.z) * tw * (light ? 0.5 : 0.9);
    return a;
}
export function inner$GoldDust$useEffect$loop$s(p) {
    const s = p.r * (p.b ? 3.2 : 3);
    return s;
}
export function inner$PnIntro$useEffect$land$k(to, from) {
    const k = to.height / from.height;
    return k;
}
export function inner$PnIntro$useEffect$land$tx(to, from) {
    const tx = to.left + to.width / 2 - (from.left + from.width / 2);
    return tx;
}
export function inner$PnIntro$useEffect$land$ty(to, from) {
    const ty = to.top + to.height / 2 - (from.top + from.height / 2);
    return ty;
}

export const SIGS = {
  inner$GoldDust$useEffect$size$n: [{"name":"w","d":{"t":"num"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false}],
  inner$GoldDust$useEffect$loop$dt: [{"name":"lt","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$GoldDust$useEffect$loop$i: [{"name":"parts","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["vx",{"t":"num"},false],["vy",{"t":"num"},false],["z",{"t":"num"},false],["r",{"t":"num"},false],["ph",{"t":"num"},false],["life",{"t":"num"},false],["b",{"t":"bool"},false]]}},"opt":false}],
  inner$GoldDust$useEffect$loop$tw: [{"name":"p","d":{"t":"obj","n":"Part","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["vx",{"t":"num"},false],["vy",{"t":"num"},false],["z",{"t":"num"},false],["r",{"t":"num"},false],["ph",{"t":"num"},false],["life",{"t":"num"},false],["b",{"t":"bool"},false]]},"opt":false}],
  inner$GoldDust$useEffect$loop$a: [{"name":"dark","d":{"t":"obj","n":"RefObject","p":[["current",{"t":"bool"},false]]},"opt":false},{"name":"p","d":{"t":"obj","n":"Part","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["vx",{"t":"num"},false],["vy",{"t":"num"},false],["z",{"t":"num"},false],["r",{"t":"num"},false],["ph",{"t":"num"},false],["life",{"t":"num"},false],["b",{"t":"bool"},false]]},"opt":false}],
  inner$GoldDust$useEffect$loop$a$$step: [{"name":"light","d":{"t":"bool"},"opt":false},{"name":"p","d":{"t":"obj","n":"Part","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["vx",{"t":"num"},false],["vy",{"t":"num"},false],["z",{"t":"num"},false],["r",{"t":"num"},false],["ph",{"t":"num"},false],["life",{"t":"num"},false],["b",{"t":"bool"},false]]},"opt":false},{"name":"tw","d":{"t":"num"},"opt":false}],
  inner$GoldDust$useEffect$loop$s: [{"name":"p","d":{"t":"obj","n":"Part","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["vx",{"t":"num"},false],["vy",{"t":"num"},false],["z",{"t":"num"},false],["r",{"t":"num"},false],["ph",{"t":"num"},false],["life",{"t":"num"},false],["b",{"t":"bool"},false]]},"opt":false}],
  inner$PnIntro$useEffect$land$k: [{"name":"to","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]}]},"opt":false},{"name":"from","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]}]},"opt":false}],
  inner$PnIntro$useEffect$land$tx: [{"name":"to","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]}]},"opt":false},{"name":"from","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]}]},"opt":false}],
  inner$PnIntro$useEffect$land$ty: [{"name":"to","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]}]},"opt":false},{"name":"from","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]}]},"opt":false}],
};
