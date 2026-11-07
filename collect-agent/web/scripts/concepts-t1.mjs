// כיוון חדש (הכרעת-בעלים: «א · מגש-חיוך»): "טיפלתי בזה. הנה הכסף."
// קו מעוקל אחד = כף יד פתוחה / מגש / החיוך הרגוע של גבי (מהתמונה) — ועליו המטבע הירוק, מוגש אליך.
// בלי אות בסמל. השם «גבי» נכתב לצידו באותיות הגאומטריות מסבבים 22–27 (בלי דגשים).
import { readFileSync } from 'node:fs';
const L = JSON.parse(readFileSync(new URL('./concepts-t1-letters.json', import.meta.url), 'utf8'));
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#059669' };
const f = v => +v.toFixed(3);
// מגש: קשת ממרכז (32,TRAY.cy) ברדיוס R, בין הזוויות a0..a1 (y למטה), עובי t, קצוות עגולים — צורה סגורה אחת (מילוי, לא קו)
export const TRAY = { cx: 32, cy: 20.4, R: 22, t: 7.5, a0: 35, a1: 145 };
export const COIN = { cx: 32, cy: 26.4, r: 8.5 };
const P = (a, r, T = TRAY) => [f(T.cx + r * Math.cos(a * Math.PI / 180)), f(T.cy + r * Math.sin(a * Math.PI / 180))];
export const trayPath = (T = TRAY) => {
  const ro = T.R + T.t / 2, ri = T.R - T.t / 2, h = T.t / 2;
  const [o0, o1, i1, i0] = [P(T.a0, ro, T), P(T.a1, ro, T), P(T.a1, ri, T), P(T.a0, ri, T)];
  return `M${o0} A${ro} ${ro} 0 0 1 ${o1} A${h} ${h} 0 0 1 ${i1} A${ri} ${ri} 0 0 0 ${i0} A${h} ${h} 0 0 1 ${o0}Z`.replace(/,/g, ' ');
};
export const mark = (ink, coin) => `<path d="${trayPath()}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R26 = { id: 'tray-coin-1', name: 'מגש-חיוך — "טיפלתי בזה. הנה הכסף."',
  story: 'קו אחד רגוע — כף יד פתוחה, מגש וחיוך — שמגיש לך את המטבע הירוק. גבי טיפל בזה; הכסף שלך מוגש לך, בלי מרדף.' };
const svgOpen = (w, h, px, label = 'גבי') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${px}" height="${+(px * h / w).toFixed(1)}" role="img" aria-label="${label}">`;
const centered = (ink, coin, s) => `<g transform="translate(${f(32 - 32 * s)} ${f(32 - 32 * s)}) scale(${s})">${mark(ink, coin)}</g>`;
export const tileSvg = (px = 1024) => `${svgOpen(64, 64, px)}<rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 1)}</svg>`;
export const iosDarkSvg = () => `${svgOpen(64, 64, 1024)}${centered(C.cream, C.green, 1)}</svg>`;
export const adaptiveFg = () => `${svgOpen(64, 64, 432)}${centered(C.cream, C.green, 0.72)}</svg>`;
export const adaptiveBg = () => `${svgOpen(64, 64, 432)}<rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `${svgOpen(64, 64, 432)}${centered('#000000', '#000000', 0.72)}</svg>`;
// 16: מאסטר פיקסלים — מטבע 4×4 מלא (פינות חתוכות נקראו כ"+"), מגש בעובי 2 בקשת; ערוץ נייבי של 1+ סביב המטבע
export const PIX = {
  ink: [[2, 8, 2, 2], [3, 10, 2, 2], [4, 11, 2, 2], [6, 12, 4, 2], [10, 11, 2, 2], [11, 10, 2, 2], [12, 8, 2, 2]],
  dot: [[6, 4, 4, 4]],
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="גבי"><rect width="16" height="16" rx="3.5" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
const favVec = (px, rx, s) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" rx="${rx}" fill="${C.navy}"/>${centered(C.cream, C.green, s)}</svg>`;
export const fav32 = (px = 32) => favVec(px, 14, 1.18);
export const fav48 = (px = 48) => favVec(px, 14, 1.1);
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenOnLight) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
};
export const svgR26 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '6 6 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
// סימן משולב (RTL): הסמל מימין, «גבי» משמאל. אותיות: x −34.5…48.5, y 7…55.2 (הזזה +38.5,−3) ⇒ 4…87.
// הסמל בקנה 1.3, ממורכז אנכית על גובה-האותיות; רווח 12.
export const LOCKUP_MIN_PX = 32;
const MS = 1.3, MX = 99 - 10.5 * MS, LW = MX + 53.5 * MS + 4;
const word = (ink, coin) => `<g transform="translate(38.5 -3)"><path d="${L.gimel}" fill="${ink}"/><path d="${L.bet}" fill="${ink}"/><path d="${L.yod}" fill="${ink}"/></g>
<g transform="translate(${f(MX)} ${f(28.1 - 31.6 * MS)}) scale(${MS})">${mark(ink, coin)}</g>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(LW)} 56.2" height="${h}" width="${(h * LW / 56.2).toFixed(1)}" role="img" aria-label="גבי">${word(ink, coin)}</svg>`;
export const filingSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(LW)} 56.2" width="${Math.round(LW * 20)}" height="1124">${word('#000000', '#000000')}</svg>`;
