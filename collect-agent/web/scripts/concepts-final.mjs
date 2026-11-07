// סופי (7.11): עיצוב-הבעלים בלי שינוי מראה; תיקונים טכניים בלבד — רווח מטבע↔ארנק ≥1px בגדלים קטנים, 16 ממורכז, מזהים ייחודיים, PNG להגשה.
// סבב 2 (ערכי-בעלים שניים, 7.11): היד מורחקת, אגודל 6°, המטבע חצי בתוך הארנק.
// כיוון «יד-ג מגישה לארנק» (הכרעת-בעלים, כוונן בלייב 7.11): היד של גבי — כף כלפי מטה, נקראת כ-ג מהצד —
// משחררת את המטבע הירוק אל הארנק של הלקוח. "טיפלתי בזה. הנה הכסף."
// ערכי-הבעלים מהכלי: handRot 51.5 · thumbRot 15 · cuffGap 1.6 · cuffW 6.5 · coin (0.3,52) r6 · wallet (−15.7,62.8) 27×17
import { readFileSync } from 'node:fs';
const L = JSON.parse(readFileSync(new URL('./concepts-t1-letters.json', import.meta.url), 'utf8'));
const B = JSON.parse(readFileSync(new URL('./concepts-t3-bbox.json', import.meta.url), 'utf8')); // תיבת-התוכן (נמדדה בדפדפן)
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#059669' };
export const P = { handX: 11.1, handY: -14.8, handRot: 25, thumbRot: 6, cuffGap: 2.8, cuffW: 6.5, coinX: 22.5, coinY: 55, coinR: 6, coinIn: 1, coinGap: 1.6, walX: 8.4, walY: 56.1, walW: 27, walH: 17 };
const PALM = 'M9 31 C9 28.5 12.5 27.8 14 30 C16.5 35 20.5 37.8 26 37.8 C31 37.8 34.5 35.5 36.6 31.5 C38.4 28.6 41.6 28.4 43.4 30.6 C44.6 32.4 45.6 33.8 47.5 34.2 L52 35 L52 46.6 C45 46.6 40 46.4 35 46.6 C22 47.2 12 42 9.5 35 C9.2 33.8 9 32.4 9 31 Z';
const THUMB = 'M35.6 33.5 L35 22.5 C34.7 20.2 37.6 19 39 20.8 L42.4 30.5 L43.2 34 Z';
// ארנק: גוף + פתח + לשונית עם כפתור — החורים דרך mask (מילוי בלבד, בלי קווים; רקע שקוף נשאר שקוף)
const W = (() => { const { walX: x, walY: y, walW: w, walH: h } = P; return { x, y, w, h,
  body: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`,
  slot: `<rect x="${x + 3.6}" y="${y + 3.8}" width="${w - 7.2}" height="2.4" rx="1.2"/>`,
  tabOut: `<rect x="${x + w - 10.4}" y="${y + h / 2 - 4.9}" width="13.8" height="9.8" rx="4.9"/>`,
  tab: `<rect x="${x + w - 8.6}" y="${y + h / 2 - 3.1}" width="10.2" height="6.2" rx="3.1"/>`,
  dot: `<circle cx="${x + w - 3.8}" cy="${y + h / 2}" r="1.7"/>` }; })();
const MASKF = (id) => `<defs><mask id="gw${id}" maskUnits="userSpaceOnUse" x="-100" y="-100" width="300" height="300"><g fill="#fff">${W.body}${W.tabOut}</g><g fill="#000">${W.slot}${W.tabOut}</g><g fill="#fff">${W.tab}</g><g fill="#000">${W.dot}</g></mask></defs>`;
let UID = 0;
const inner = (ink, coin, gap = P.coinGap) => { const id = ++UID; return `${MASKF(id)}<clipPath id="gcin${id}"><rect x="-300" y="-300" width="600" height="${300 + P.walY - gap}"/></clipPath><g transform="translate(${P.handX} ${P.handY}) rotate(${P.handRot} 32 32) translate(0 82) scale(1 -1)" fill="${ink}"><path d="${PALM}"/><path d="${THUMB}" transform="rotate(${P.thumbRot} 39.4 31)"/><rect x="${52 + P.cuffGap}" y="33" width="${P.cuffW}" height="16" rx="2.4"/></g>`
  + `<rect x="${W.x - 5}" y="${W.y - 6}" width="${W.w + 12}" height="${W.h + 12}" fill="${ink}" mask="url(#gw${id})"/><circle cx="${P.coinX}" cy="${P.coinY}" r="${P.coinR}" fill="${coin}" clip-path="url(#gcin${id})"/>`; };
const f = v => +v.toFixed(3);
// רווחים פר-נכס שנמצאו במיטוב פיקסלים (concepts-final-gaps.mjs) — שורת-פיקסל נקייה בין המטבע לארנק
let G = {}; try { G = JSON.parse(readFileSync(new URL('./concepts-final-gaps.json', import.meta.url), 'utf8')); } catch {}
export const setGaps = g => { G = g; };
// ממקמים את תיבת-התוכן במרכז (cx,cy) בגודל-צלע מקסימלי s
const place = (s, cx = 32, cy = 32) => { const k = s / Math.max(B.w, B.h); return `translate(${f(cx - k * (B.x + B.w / 2))} ${f(cy - k * (B.y + B.h / 2))}) scale(${f(k)})`; };
export const mark = (ink, coin, s = 52, gap) => `<g transform="${place(s)}">${inner(ink, coin, gap)}</g>`;
// רווח מטבע↔ארנק ביחידות-מקור כך שיהיה ≥ minPx פיקסלים בגודל-תצוגה px (s = גודל הסמל בלוח 64)
export const gapFor = (px, s, minPx = 1.25) => Math.max(P.coinGap, +(minPx / ((px / 64) * (s / Math.max(B.w, B.h)))).toFixed(2));
export const R26 = { id: 'gabi-logo', name: 'יד-ג מגישה לארנק — "טיפלתי בזה. הנה הכסף."',
  story: 'היד של גבי — כף כלפי מטה, נקראת כ-ג מהצד — משחררת את המטבע הירוק אל הארנק שלך. גבי נותן; הכסף שלך חוזר אליך.' };
const svgOpen = (w, h, px, label = 'גבי') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${px}" height="${+(px * h / w).toFixed(1)}" role="img" aria-label="${label}">`;
export const tileSvg = (px = 1024) => `${svgOpen(64, 64, px)}<rect width="64" height="64" fill="${C.navy}"/>${mark(C.cream, C.green, 46, G.tile ?? gapFor(40, 46))}</svg>`;
export const iosDarkSvg = () => `${svgOpen(64, 64, 1024)}${mark(C.cream, C.green, 46, G.tile ?? gapFor(40, 46))}</svg>`;
export const adaptiveFg = () => `${svgOpen(64, 64, 432)}${mark(C.cream, C.green, 34, G.ad ?? gapFor(48, 34))}</svg>`;
export const adaptiveBg = () => `${svgOpen(64, 64, 432)}<rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `${svgOpen(64, 64, 432)}${mark('#000000', '#000000', 34, G.ad ?? gapFor(48, 34))}</svg>`;
// 16: מאסטר פיקסלים מופשט — רק הארנק והמטבע (היד לא נקראת ב-16); מטבע 4×4 מלא (פינות חתוכות נקראות כ-+), ארנק 10×6 עם פס-פתח
export const PIX = {
  ink: [[3, 6, 10, 1], [2, 7, 12, 5], [3, 12, 10, 1]],
  hole: [[4, 8, 6, 1], [11, 9, 2, 1]],
  dot: [[6, 3, 4, 2]], // חצי-מטבע מעל שפת הארנק, רווח שורה 5; תוכן בשורות 3–12 (ממורכז)
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="גבי"><rect width="16" height="16" rx="3.5" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.hole.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.navy}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
const favVec = (px, s) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" rx="14" fill="${C.navy}"/>${mark(C.cream, C.green, s, G['f' + px] ?? gapFor(px, s))}</svg>`;
export const fav32 = (px = 32) => favVec(px, 56);
export const fav48 = (px = 48) => favVec(px, 54);
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenOnLight) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
};
export const svgR26 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
// סימן משולב (RTL): הסמל מימין, «גבי» משמאל. אותיות x 4…87, y 4…52.2 (הזזה +38.5,−3); הסמל בגובה ~48 ממורכז אנכית
export const LOCKUP_MIN_PX = 32;
const MS = 50, MX = 87 + 12 + MS / 2, LW = 87 + 12 + MS + 4;
const word = (ink, coin) => `<g transform="translate(38.5 -3)"><path d="${L.gimel}" fill="${ink}"/><path d="${L.bet}" fill="${ink}"/><path d="${L.yod}" fill="${ink}"/></g>
<g transform="translate(${f(MX - 32)} ${f(28.1 - 32)})">${mark(ink, coin, MS, G.lock ?? gapFor(32 * 64 / 56.2, MS))}</g>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LW} 56.2" height="${h}" width="${(h * LW / 56.2).toFixed(1)}" role="img" aria-label="גבי">${word(ink, coin)}</svg>`;
export const filingSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LW} 56.2" width="${LW * 20}" height="1124">${word('#000000', '#000000')}</svg>`;
