/**
 * 📒 פרנסה׳לע — המטבעה של המקור (עיצוב 2): כל פני-המטבעות (תאי-אמייל גרנט/ספיר/פנינה/אזמרגד/שחור מתחת לתבליט-זהב
 * מורם, viewBox 100), המתכות (זהב · כסף · פלטינה), השוליים (חרוזים · קליעת-סוכה · מסכות-פורים · מצות) והגב עם מספר
 * בעלי-המקצוע — מועתק מ-parnasale.html L3314–3480 כלשונו (נוצר ע"י סקריפט מהמקור); רק המזהים בקידומת pn- (‎#pn-c-*,
 * ב-svgDefs.ts) והמחלקות בקידומת pn-. הפלט = מחרוזות-SVG סטטיות ממחוללי-המקור (מוצגות דרך RawHtml); הקלט היחיד
 * מבחוץ — מונוגרמת-הנותן בחסות — עובר esc().
 */
import { esc } from './skin';

/** פני-מטבע: תאי-אמייל [צורה, צבע] + התבליט (קווי-זהב). */
export interface CoinIc {
  e: ReadonlyArray<readonly [string, string]>;
  m: string;
  flip?: boolean;
}

const CP = (d: string, w?: number): string => `<path d="${d}"${w ? ` stroke-width="${w}"` : ''}/>`;
const cDrop = (x: number, y: number, s: number): string =>
  `M${x} ${y} C${x - 3.6 * s} ${y + 5 * s} ${x - 5.4 * s} ${y + 7.6 * s} ${x - 5.4 * s} ${y + 10 * s} A${5.4 * s} ${5.4 * s} 0 0 0 ${x + 5.4 * s} ${y + 10 * s} C${x + 5.4 * s} ${y + 7.6 * s} ${x + 3.6 * s} ${y + 5 * s} ${x} ${y}Z`;
const CT = (x: number, y: number, ch: string, sz: number, rot?: string): string =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Frank Ruhl Libre, serif" font-weight="900" font-size="${sz}" fill="url(#pn-c-gm)" stroke="none"${rot ? ` transform="${rot}"` : ''}>${ch}</text>`;
const cLeaf = (cx: number, cy: number, rx: number, ry: number, a: number, w?: number): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${cx} ${cy})"${w ? ` stroke-width="${w}"` : ''}/>`;
const cLeaves = (arr: ReadonlyArray<readonly [number, number, number, number, number]>, w?: number): string => arr.map((l) => cLeaf(...l, w)).join('');
const cFlame = (x: number, y: number, s: number): string =>
  `M${x} ${y - 7 * s} C${x + 3.3 * s} ${y - 3 * s} ${x + 3.3 * s} ${y} ${x} ${y} C${x - 3.3 * s} ${y} ${x - 3.3 * s} ${y - 3 * s} ${x} ${y - 7 * s}Z`;
const cStar = (x: number, y: number, s: number): string =>
  `M${x} ${y - 7 * s} l${1.6 * s} ${5.4 * s} ${5.4 * s} ${1.6 * s} ${-5.4 * s} ${1.6 * s} ${-1.6 * s} ${5.4 * s} ${-1.6 * s} ${-5.4 * s} ${-5.4 * s} ${-1.6 * s} ${5.4 * s} ${-1.6 * s}z`;
const cStarG = (x: number, y: number, s: number): string => `<path d="${cStar(x, y, s)}" fill="url(#pn-c-gm)" stroke-width="1"/>`;
let C_FROND = '';
for (let i = 0; i < 4; i++) {
  const t = 0.2 + i * 0.2;
  const x = 27 + 46 * t;
  const y = 72 - 45 * t;
  C_FROND += cLeaf(x - 6.5, y - 3.5, 7.4, 3.2, -62) + cLeaf(x + 4, y + 6.5, 7.4, 3.2, 8);
}
const C_FRONDM = C_FROND.replace(/\/>/g, ' stroke-width="1.6"/>');
const C_ARMX = [26, 32, 38, 44, 56, 62, 68, 74];
const C_LOOP = (x: number, y: number): string => `M${x - 8} ${y} a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0z M${x - 4.4} ${y} a4.4 4.4 0 1 0 8.8 0 a4.4 4.4 0 1 0 -8.8 0z`;

/* פני-המטבעות של המקור — כלשונם (שורות ארוכות במכוון: נתוני-ציור) */
const COIN_IC: Readonly<Record<string, CoinIc>> = {
  /* ---- from the approved demo ---- */
  leak:{e:[["M50 27 h16 a8 8 0 0 1 8 8 v26 a8 8 0 0 1 -8 8 h-16 a8 8 0 0 1 -8 -8 v-26 a8 8 0 0 1 8 -8z","enB"],['<circle cx="58" cy="40" r="5.6"/>',"enI"],[cDrop(30,62,1.15),"enN"]],
    m:CP("M50 27 h16 a8 8 0 0 1 8 8 v26 a8 8 0 0 1 -8 8 h-16 a8 8 0 0 1 -8 -8 v-26 a8 8 0 0 1 8 -8z",3.4)+'<circle cx="58" cy="40" r="5.6" stroke-width="2.8"/>'+CP("M58 40 l2.6 -2.6",2.2)+CP("M42 54 H33 a3 3 0 0 0 -3 3 v1",4)+CP("M37 54 v-6 M32.5 47.5 h9",3.6)+CP(cDrop(30,62,1.15),2.6)},
  seal:{e:[["M50 27 L77 50 H23Z","enB"],["M31 50 h38 v21 h-38z","enI"],["M46 59 h8 v12 h-8z","enN"],[cDrop(35,15,.75)+" "+cDrop(65,15,.75),"enN"],[cDrop(20,56,.8),"enN"],[cDrop(80,56,.8),"enN"]],
    m:CP("M21 51 L50 26 L79 51",4.6)+CP("M31 51 V71 H69 V51",3.6)+CP("M46 71 v-12 h8 v12",3)+CP(cDrop(35,15,.75),2.2)+CP(cDrop(65,15,.75),2.2)+CP(cDrop(20,56,.8),2.2)+CP(cDrop(80,56,.8),2.2)},
  heat:{e:[["M27 51 a5 5 0 0 1 5 -5 h36 a5 5 0 0 1 5 5 v16 a5 5 0 0 1 -5 5 h-36 a5 5 0 0 1 -5 -5z","enB"]],
    m:CP("M27 51 a5 5 0 0 1 5 -5 h36 a5 5 0 0 1 5 5 v16 a5 5 0 0 1 -5 5 h-36 a5 5 0 0 1 -5 -5z",3.4)+CP("M36 51.5 v15 M45 51.5 v15 M54 51.5 v15 M63 51.5 v15",3)+CP("M33 72 v4 M67 72 v4",3.6)+CP("M27 66 h-4",3.2)+
      CP("M39 39 q4 -4 0 -8 q-4 -4 0 -8 M50 39 q4 -4 0 -8 q-4 -4 0 -8 M61 39 q4 -4 0 -8 q-4 -4 0 -8",3.6)},
  study:{e:[["M50 42 C42 37 32 37 24 41 V65 C32 61 42 61 50 66Z","enI"],["M50 42 C58 37 68 37 76 41 V65 C68 61 58 61 50 66Z","enI"],["M52 64 h7 v14 l-3.5 -3.5 l-3.5 3.5z","enB"]],
    m:CP("M50 42 C42 37 32 37 24 41 V65 C32 61 42 61 50 66 M50 42 C58 37 68 37 76 41 V65 C68 61 58 61 50 66",3.6)+CP("M50 42 V66",3.2)+CP("M30 47 c5 -2 10 -2 14 0 M30 54 c5 -2 10 -2 14 0 M56 47 c4 -2 9 -2 14 0 M56 54 c4 -2 9 -2 14 0",2.3)+CP("M52 64 h7 v14 l-3.5 -3.5 l-3.5 3.5z",2.2)},
  melamed:{e:[["M51 44 h21 v22 h-21z","enB"],["M51 44 l5 -5 h21 l-5 5z","enI"],["M25 50 h21 v22 h-21z","enN"],["M25 50 l5 -5 h21 l-5 5z","enI"]],
    m:CP("M51 44 h21 v22 h-21z M51 44 l5 -5 h21 l-5 5 M72 66 l5 -5 v-22",3)+'<path d="M72 44 l5 -5 v22 l-5 5z" fill="url(#pn-c-gm)" stroke-width="2"/>'+CP("M25 50 h21 v22 h-21z M25 50 l5 -5 h21 l-5 5 M46 72 l5 -5 v-22",3)+'<path d="M46 50 l5 -5 v22 l-5 5z" fill="url(#pn-c-gm)" stroke-width="2"/>'+CT(61.5,62.5,"א",19)+CT(35.5,68.5,"ב",19)},
  move:{e:[["M45 29 h31 v31 h-31z","enI"],["M57 29 h7 v13 h-7z","enB"],["M20 60 V46 q0 -5 5 -5 h11 l7 9 v10z","enB"],["M25 45 h10 l4.6 6 h-14.6z","enN"]],
    m:CP("M45 29 h31 v31 h-31z",3.6)+CP("M57 29 v13 h7 v-13",2.2)+CP("M20 60 V46 q0 -5 5 -5 h11 l7 9 v10",3.4)+CP("M18 61 H80",4.4)+'<circle cx="31" cy="67" r="6" stroke-width="3.8"/><circle cx="66" cy="67" r="6" stroke-width="3.8"/><circle cx="31" cy="67" r="1.7" fill="url(#pn-c-gm)"/><circle cx="66" cy="67" r="1.7" fill="url(#pn-c-gm)"/>'},
  sukkah:{e:[["M30 47 h40 v25 h-40z","enI"],["M44 57 h12 v15 h-12z","enB"],["M25 46 q1 -9 7 -7 q3 -7 9 -3 q4 -7 9.5 -2 q5 -6 9.5 0 q5 -5 8.5 2 q6 -1 5 10z","enG"]],
    m:CP("M30 47 V72 H70 V47",3.4)+CP("M44 72 V57 h12 v15",2.8)+CP("M23 47 H77",3.4)+CP("M25 46 q1 -9 7 -7 q3 -7 9 -3 q4 -7 9.5 -2 q5 -6 9.5 0 q5 -5 8.5 2 q6 -1 5 10",2)+CP("M20 74 H80",3)+
      '<g transform="rotate(-38 72 26) translate(2 -3)"><rect x="62" y="20" width="16" height="7" rx="1.6" fill="url(#pn-c-gm)" stroke-width="2"/><path d="M70 27 V40" stroke-width="3.6"/></g>'},
  schach:{e:[[C_FROND,"enG"]],m:CP("M21 45 H79 M21 63 H79",3)+CP("M27 72 C40 60 54 46 73 27",3.2)+C_FRONDM},
  species:{e:[["M45 15 C50.5 27 51.5 48 50.5 77 h-10 C39.5 48 39.5 27 45 15Z","enG"],[cLeaves([[33.5,50,4.6,2.5,-40],[33.5,58,4.6,2.5,-40],[33.5,66,4.6,2.5,-40]]),"enG"],['<ellipse cx="63" cy="60" rx="13" ry="10.5" transform="rotate(-22 63 60)"/>',"enI"]],
    m:CP("M45 15 C50.5 27 51.5 48 50.5 77 h-10 C39.5 48 39.5 27 45 15Z",2.8)+CP("M45.4 24 V58",1.6)+CP("M39.6 63 h11.6 M39.6 69.5 h11.6",3)+cLeaves([[33.5,50,4.6,2.5,-40],[33.5,58,4.6,2.5,-40],[33.5,66,4.6,2.5,-40]],1.5)+
      '<ellipse cx="63" cy="60" rx="13" ry="10.5" transform="rotate(-22 63 60)" stroke-width="3.2"/>'+CP("M75 53.5 l3.2 -2.2",3.2)+CP("M48 77 l2 3",2)},
  light:{e:[["M50 40 a14 14 0 0 1 9 24.7 v4.3 h-18 v-4.3 a14 14 0 0 1 9 -24.7z","enI"],["M52.5 45 L44.5 56 h5.5 l-2.5 9 l8.5 -11.5 h-5.5 l3 -8.5z","enB"],['<circle cx="30" cy="31" r="3"/><circle cx="70" cy="31" r="3"/>',"enB"]],
    m:CP("M22 26 Q36 37 50 27 Q64 37 78 26",2.6)+CP("M50 27 V35",2.6)+CP("M44.5 35 h11 v5 h-11z",2.8)+CP("M50 40 a14 14 0 0 1 9 24.7 v4.3 h-18 v-4.3 a14 14 0 0 1 9 -24.7z",3.2)+CP("M43 73 h14",3)+CP("M52.5 45 L44.5 56 h5.5 l-2.5 9 l8.5 -11.5 h-5.5 l3 -8.5z",1.6)+
      '<circle cx="30" cy="31" r="3" stroke-width="1.8"/><circle cx="70" cy="31" r="3" stroke-width="1.8"/>'+CP("M28 52 h-5 M72 52 h5 M31.5 41 l-4 -3 M68.5 41 l4 -3",3)},
  catering:{e:[["M27 60 a23 23 0 0 1 46 0z","enB"],["M33 54 a17 17 0 0 1 9 -10","enI"]],
    m:CP("M27 60 a23 23 0 0 1 46 0",3.4)+CP("M21 61.5 H79",4.6)+CP("M30 67 h40",3)+'<circle cx="50" cy="34" r="3.6" fill="url(#pn-c-gm)" stroke-width="2.4"/>'+CP("M37 31 q-3 -3.5 0 -7 M63 31 q3 -3.5 0 -7",2.8)},
  menorah:{e:[[C_ARMX.map(x=>cFlame(x,47.5,.85)).join(" ")+" "+cFlame(50,36.5,.85),"enI"],["M39 77 h22 l-4 -6 h-14z","enN"]],
    m:CP(C_ARMX.map(x=>`M50 ${50+Math.abs(x-50)*.75} L${x} 50`).join(" "),2.6)+CP("M50 39 V71",3.4)+CP(C_ARMX.map(x=>`M${x-2.8} 50 h5.6`).join(" ")+" M47.2 39 h5.6",2.8)+CP("M39 77 h22 l-4 -6 h-14z",2.4)+CP(C_ARMX.map(x=>cFlame(x,47.5,.85)).join(" ")+" "+cFlame(50,36.5,.85),1.1)},
  donut:{e:[['<ellipse cx="50" cy="69" rx="27" ry="5"/>',"enN"],["M28 61 C28 37 72 37 72 61 C72 69 28 69 28 61Z","enI"],["M44 40 C46 34 56 34 58 40 C58 44 55 43 54 47 C53 49 51 49 50.5 46 C50 43 44 44 44 40Z","enJ"]],
    m:'<ellipse cx="50" cy="69" rx="27" ry="5" stroke-width="2.6"/>'+CP("M28 61 C28 37 72 37 72 61 C72 69 28 69 28 61Z",3.2)+CP("M44 40 C46 34 56 34 58 40 C58 44 55 43 54 47 C53 49 51 49 50.5 46 C50 43 44 44 44 40Z",1.6)+
      CP("M35 53 h1 M40 47.5 h1 M62 49 h1 M66 56 h1 M45 56 h1 M56 57 h1 M38 60 h1 M61 61 h1",2.4)+CP("M30 62 C40 66 60 66 70 62",1.6)},
  camera:{e:[["M24 45 a5 5 0 0 1 5 -5 h8 l4 -6 h18 l4 6 h8 a5 5 0 0 1 5 5 v22 a5 5 0 0 1 -5 5 h-42 a5 5 0 0 1 -5 -5z","enB"],['<circle cx="50" cy="55" r="11.5"/>',"enI"],['<circle cx="50" cy="55" r="6"/>',"enK"]],
    m:CP("M24 45 a5 5 0 0 1 5 -5 h8 l4 -6 h18 l4 6 h8 a5 5 0 0 1 5 5 v22 a5 5 0 0 1 -5 5 h-42 a5 5 0 0 1 -5 -5z",3.2)+'<circle cx="50" cy="55" r="11.5" stroke-width="3"/><circle cx="50" cy="55" r="6" stroke-width="1.6"/>'+
      '<rect x="63" y="44" width="6" height="3.6" rx="1" fill="url(#pn-c-gm)" stroke-width="1"/>'+CP("M29 40 v-3 h5 v3",2)},
  bus:{flip:true,e:[["M22 62 V43 a6 6 0 0 1 6 -6 h37 a9 9 0 0 1 8.3 5.5 L77 52 V62z","enB"],['<rect x="27" y="42" width="10" height="9" rx="1.5"/><rect x="40" y="42" width="10" height="9" rx="1.5"/><rect x="53" y="42" width="9" height="9" rx="1.5"/>',"enI"],["M66 42 h0.5 a5 5 0 0 1 4.6 3 L73.5 51 H66z","enN"]],
    m:CP("M22 62 V43 a6 6 0 0 1 6 -6 h37 a9 9 0 0 1 8.3 5.5 L77 52 V62",3.2)+'<rect x="27" y="42" width="10" height="9" rx="1.5" stroke-width="1.8"/><rect x="40" y="42" width="10" height="9" rx="1.5" stroke-width="1.8"/><rect x="53" y="42" width="9" height="9" rx="1.5" stroke-width="1.8"/>'+
      CP("M66 42 h0.5 a5 5 0 0 1 4.6 3 L73.5 51 H66z",1.8)+CP("M20 62.5 H80",4)+CP("M22 56 H62",1.8)+'<circle cx="33" cy="65" r="5.8" stroke-width="3.6"/><circle cx="67" cy="65" r="5.8" stroke-width="3.6"/><circle cx="33" cy="65" r="1.6" fill="url(#pn-c-gm)"/><circle cx="67" cy="65" r="1.6" fill="url(#pn-c-gm)"/>'},
  basket:{e:[["M43 30 h6 v6 c3 2 4.5 4 4.5 7.5 V52 h-15 v-8.5 C38.5 40 40 38 43 36z","enN"],['<circle cx="63" cy="45" r="7.5"/>',"enG"],['<circle cx="32" cy="46" r="6"/>',"enI"],["M24 52 h52 l-6 21 h-40z","enB"]],
    m:CP("M43 30 h6 v6 c3 2 4.5 4 4.5 7.5 V52 M38.5 52 v-8.5 C38.5 40 40 38 43 36z",2.4)+'<circle cx="63" cy="45" r="7.5" stroke-width="2.4"/><circle cx="32" cy="46" r="6" stroke-width="2.2"/>'+CP("M63 37.5 q3 -4 6 -3",2)+CP("M29 46 q3 -3 6 0",1.6)+
      CP("M24 52 h52 l-6 21 h-40z",3.2)+CP("M27 59 h46 M29 66 h42",2)+CP("M40 52 l-2 21 M50 52 v21 M60 52 l2 21",1.6)},
  mask:{e:[['<path fill-rule="evenodd" d="M22 46 C32 39 44 43 50 47 C56 43 68 39 78 46 C78 58 70 64 62 62 C56 60 54 56 50 56 C46 56 44 60 38 62 C30 64 22 58 22 46Z M31 51 a6 3.8 0 1 0 12 0 a6 3.8 0 1 0 -12 0Z M57 51 a6 3.8 0 1 0 12 0 a6 3.8 0 1 0 -12 0Z"/>',"enB"],["M66 44 C71 37 73 31 71 26 C65 30 62 37 66 44Z","enI"]],
    m:CP("M22 46 C32 39 44 43 50 47 C56 43 68 39 78 46 C78 58 70 64 62 62 C56 60 54 56 50 56 C46 56 44 60 38 62 C30 64 22 58 22 46Z",3.2)+CP("M31 51 a6 3.8 0 1 0 12 0 a6 3.8 0 1 0 -12 0Z M57 51 a6 3.8 0 1 0 12 0 a6 3.8 0 1 0 -12 0Z",2.2)+CP("M66 44 C71 37 73 31 71 26 C65 30 62 37 66 44Z",1.8)+CP("M67 61 L73 75",3.6)},
  music:{e:[['<ellipse cx="36" cy="66" rx="7.5" ry="5.4" transform="rotate(-20 36 66)"/><ellipse cx="63" cy="59" rx="7.5" ry="5.4" transform="rotate(-20 63 59)"/>',"enN"]],
    m:'<ellipse cx="36" cy="66" rx="7.5" ry="5.4" transform="rotate(-20 36 66)" stroke-width="2.6"/><ellipse cx="63" cy="59" rx="7.5" ry="5.4" transform="rotate(-20 63 59)" stroke-width="2.6"/>'+CP("M42.4 63.5 V35 M69.4 56.5 V28",3.2)+'<path d="M41 33 L71 25 V33 L41 41Z" fill="url(#pn-c-gm)" stroke-width="1.6"/>'},
  clean:{e:[['<circle cx="40" cy="42" r="5.5"/><circle cx="51" cy="38" r="7"/><circle cx="61.5" cy="43" r="4.5"/>',"enI"],["M30 47 h40 l-4.5 26 h-31z","enN"]],
    m:'<circle cx="40" cy="42" r="5.5" stroke-width="2"/><circle cx="51" cy="38" r="7" stroke-width="2"/><circle cx="61.5" cy="43" r="4.5" stroke-width="2"/>'+CP("M30 47 h40 l-4.5 26 h-31z",3.2)+CP("M32 55 h36",2.2)+cStarG(71,30,.9)+cStarG(28,33,.55)},
  paint:{e:[['<rect x="26" y="25" width="41" height="15" rx="5"/>',"enB"],[cDrop(33,41,.55)+" "+cDrop(42,41,.42),"enB"],['<rect x="45.5" y="57" width="9" height="19" rx="3"/>',"enI"]],
    m:'<rect x="26" y="25" width="41" height="15" rx="5" stroke-width="3.2"/>'+CP(cDrop(33,41,.55)+" "+cDrop(42,41,.42),1.4)+CP("M67 32.5 H74 V48 H50 V57",3.4)+'<rect x="45.5" y="57" width="9" height="19" rx="3" stroke-width="2.8"/>'},
  kasher:{e:[["M28 51 h44 v13 a8 8 0 0 1 -8 8 h-28 a8 8 0 0 1 -8 -8z","enN"]],
    m:CP("M60 50 L72 31",3)+'<circle cx="72.5" cy="30" r="2.4" fill="url(#pn-c-gm)" stroke-width="1.2"/>'+CP("M28 51 V64 a8 8 0 0 0 8 8 h28 a8 8 0 0 0 8 -8 V51",3.2)+CP("M24.5 51 H75.5",3.8)+CP("M28 56 h-4 M72 56 h4",3.2)+
      '<circle cx="40" cy="46" r="2.2" stroke-width="1.6"/><circle cx="49" cy="44.5" r="2.7" stroke-width="1.6"/><circle cx="57" cy="46.5" r="1.8" stroke-width="1.6"/>'+CP("M37 39 q3 -3 0 -6 q-3 -3 0 -6 M47 37 q3 -3 0 -6 q-3 -3 0 -6",2.6)},
  plug:{e:[['<rect x="37" y="40" width="26" height="22" rx="5"/>',"enN"],["M52.5 43.5 L45.5 52.5 h4.5 l-2 6 l7 -9 h-4.5 z","enI"]],
    m:CP("M44 40 V27 M56 40 V27",4.2)+'<rect x="37" y="40" width="26" height="22" rx="5" stroke-width="3.2"/>'+CP("M52.5 43.5 L45.5 52.5 h4.5 l-2 6 l7 -9 h-4.5 z",1.3)+CP("M50 62 V66 C50 74 37 71 32 77",3.2)},
  gift:{e:[["M30 48 h40 v25 h-40z","enN"],["M27 40 h46 v8 h-46z","enN"],["M46.5 40 h7 v33 h-7z","enI"]],
    m:CP("M30 48 V73 H70 V48",3.2)+'<rect x="27" y="40" width="46" height="8" rx="1.5" stroke-width="3.2"/>'+CP("M46.5 40 V73 M53.5 40 V73",1.8)+CP("M50 40 C44 29 33 31 37.5 37.5 C40 41 46 40 50 40 C54 40 60 41 62.5 37.5 C67 31 56 29 50 40",2.8)},
  /* ---- drawn for the app's other seasons and the trades ---- */
  dreidel:{ /* sevivon, mid-spin, a gold nun on garnet */
    e:[['<g transform="rotate(-12 50 50)"><path d="M31 37 h38 v17 L50 77 L31 54z"/></g>',"enB"]],
    m:'<g transform="rotate(-12 50 50)">'+CP("M31 37 h38 v17 L50 77 L31 54z",3.2)+CP("M31 37 l4.5 -5 h29 l4.5 5",2.4)+'<rect x="46" y="20" width="8" height="12" rx="3" fill="url(#pn-c-gm)" stroke-width="2"/>'+CT(50,56.5,"נ",19)+'</g>'+CP("M21 64 q-3 -6 0 -12 M79 50 q3 -6 0 -12",2.4)},
  cup:{ /* kiddush cup with wine and a sparkle: a simcha */
    e:[["M35.5 32 h29 c-.5 11.5 -5.5 19.5 -14.5 21.5 c-9 -2 -14 -10 -14.5 -21.5z","enB"]],
    m:CP("M33 27 h34 c0 15 -6.5 25 -17 27.5 c-10.5 -2.5 -17 -12.5 -17 -27.5z",3.2)+CP("M50 55 v11",3.8)+'<path d="M38 75 h24 l-3.5 -8 h-17z" fill="url(#pn-c-gm)" stroke-width="2.4"/>'+cStarG(73,30,.8)+cStarG(26,46,.55)},
  megillah:{ /* megillat esther unrolled from its roller */
    e:[["M26 34 h38 v34 h-38 q4 -4.25 0 -8.5 q-4 -4.25 0 -8.5 q4 -4.25 0 -8.5 q-4 -4.25 0 -8.5z","enI"]],
    m:CP("M26 34 h38 M26 68 h38",2.4)+CP("M26 34 q-4 4.25 0 8.5 q4 4.25 0 8.5 q-4 4.25 0 8.5 q4 4.25 0 8.5",2.2)+'<rect x="64" y="28" width="10" height="46" rx="5" fill="url(#pn-c-gm)" stroke-width="2.4"/>'+CP("M69 23 v5 M69 74 v5",3.6)+
      CP("M33 41.5 h24 M35 47.5 h22 M33 53.5 h24 M35 59.5 h18",1.9)},
  tefillin:{ /* tefillin: black bayit with a gold shin, the straps */
    e:[['<rect x="36" y="27" width="28" height="29" rx="2.5"/>',"enK"],['<rect x="31" y="56" width="38" height="8" rx="1.5"/>',"enK"]],
    m:'<rect x="36" y="27" width="28" height="29" rx="2.5" stroke-width="2.6"/><rect x="31" y="56" width="38" height="8" rx="1.5" stroke-width="2.4"/>'+CT(50,50.5,"ש",23)+CP("M39 64 C32 68 29 72 28 77 M61 64 C68 68 71 72 72 77",3.6)},
  ring:{ /* wedding ring with a diamond */
    e:[["M41 34 h18 l6 7 l-15 14 l-15 -14z","enI"]],
    m:'<circle cx="50" cy="63" r="14.5" stroke-width="5.2"/>'+CP("M41 34 h18 l6 7 l-15 14 l-15 -14z",2.4)+CP("M35 41 h30 M45.5 34 l-2.5 7 l7 14 l7 -14 l-2.5 -7",1.2)+cStarG(72,30,.7)+cStarG(27,40,.45)},
  scissors:{ /* scissors with garnet finger loops */
    e:[['<path fill-rule="evenodd" d="'+C_LOOP(36,68)+" "+C_LOOP(64,68)+'"/>',"enB"]],
    m:'<circle cx="36" cy="68" r="8" stroke-width="3"/><circle cx="64" cy="68" r="8" stroke-width="3"/>'+CP("M41 61.5 L64 26",4.6)+CP("M59 61.5 L36 26",4.6)+'<circle cx="50" cy="47.6" r="2.6" fill="url(#pn-c-gm)" stroke-width="1.4"/>'},
  ac:{ /* wall air-conditioner blowing cool air */
    e:[['<rect x="21" y="27" width="58" height="22" rx="6"/>',"enI"],['<circle cx="70" cy="34.5" r="2.2"/>',"enN"]],
    m:'<rect x="21" y="27" width="58" height="22" rx="6" stroke-width="3.2"/>'+CP("M27 42.5 h46",2.4)+CP("M33 56 q-3 4.5 0 9 q3 4.5 0 9 M67 56 q3 4.5 0 9 q-3 4.5 0 9",3)+CP("M50 57 v17 M42.6 61.2 l14.8 8.6 M42.6 69.8 l14.8 -8.6",2.6)},
  tent:{ /* summer camp tent with a pennant */
    e:[["M50 30 L77 72 H23Z","enG"],["M50 46 L59 72 H41Z","enI"],["M50 18 h12 l-3.5 4 l3.5 4 h-12z","enB"]],
    m:CP("M50 30 L77 72 H23Z",3.2)+CP("M50 46 L59 72 H41Z",2.2)+CP("M50 30 V17",2.6)+CP("M50 18 h12 l-3.5 4 l3.5 4 h-12",1.6)+CP("M19 73 H81",3.4)},
  mezuzah:{ /* mezuzah case with a shin, checked under a magnifier */
    e:[['<rect x="35" y="21" width="15" height="50" rx="4" transform="rotate(-16 42.5 46)"/>',"enN"],['<circle cx="64" cy="62" r="10"/>',"enI"]],
    m:'<g transform="rotate(-16 42.5 46)"><rect x="35" y="21" width="15" height="50" rx="4" stroke-width="3"/>'+CT(42.5,41,"ש",14)+CP("M39 51 h7 M39 57 h7",1.6)+'</g><circle cx="64" cy="62" r="10" stroke-width="3.4"/>'+CP("M71.2 69.2 L77 75",5)},
  hammer:{ /* builder's hammer */
    e:[['<rect x="46" y="41" width="8" height="37" rx="3" transform="rotate(35 50 50)"/>',"enB"]],
    m:'<g transform="rotate(35 50 50)"><rect x="46" y="41" width="8" height="37" rx="3" stroke-width="2.6"/><path d="M31 29 h31 a4 4 0 0 1 4 4 v5 a4 4 0 0 1 -4 4 h-31z" fill="url(#pn-c-gm)" stroke-width="2.6"/><path d="M31 30 q-7 1 -10 8 M31 41 q-4 -.5 -6 1.5" stroke-width="3"/></g>'},
  calc:{ /* calculator */
    e:[['<rect x="32" y="22" width="36" height="56" rx="5"/>',"enN"],['<rect x="37" y="28" width="26" height="12" rx="1.5"/>',"enI"]],
    m:'<rect x="32" y="22" width="36" height="56" rx="5" stroke-width="3"/><rect x="37" y="28" width="26" height="12" rx="1.5" stroke-width="1.6"/>'+[41,50,59].map(x=>[49,58,67].map(y=>`<circle cx="${x}" cy="${y}" r="2.7" fill="url(#pn-c-gm)" stroke-width="1"/>`).join("")).join("")+CP("M47 34 h12",1.8)},
  laptop:{ /* laptop */
    e:[['<rect x="29" y="30" width="42" height="28" rx="2.5"/>',"enN"]],
    m:'<rect x="29" y="30" width="42" height="28" rx="2.5" stroke-width="3"/><path d="M20 63 h60 l-5 7 h-50z" fill="url(#pn-c-gm)" stroke-width="2.4"/>'+CP("M45 66.5 h10",1.6)+CP("M35 39 l8 -4 M35 46 l14 -7",1.8)},
  quill:{ /* scribe's quill and inkwell */
    e:[["M41 64 C44 47 55 32 72 24 C67 41 57 55 41 64Z","enI"],["M24 62 h20 v12 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3z","enK"]],
    m:CP("M41 64 C44 47 55 32 72 24 C67 41 57 55 41 64Z",2.6)+CP("M41 64 L67 30",1.6)+CP("M48 55 l-1.5 -6 M54 48 l-1.5 -6.5 M60 41 l-1 -6",1.4)+CP("M24 62 h20 v12 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3z",3)+CP("M22 62 h24",3.4)+CP("M41 64 L36 69",2.4)},
  health:{ /* heart with a pulse line */
    e:[["M50 75 C27 60 22 46 29 37 C36 28 46 31 50 38 C54 31 64 28 71 37 C78 46 73 60 50 75Z","enB"]],
    m:CP("M50 75 C27 60 22 46 29 37 C36 28 46 31 50 38 C54 31 64 28 71 37 C78 46 73 60 50 75Z",3.2)+CP("M20 53 h13 l4 -8 l6 16 l5 -13 l3 5 h29",2.8)},
  house:{ /* house with a key: real estate */
    e:[["M31 49 h38 v19 h-38z","enI"],["M25 51 L50 29 L75 51z","enB"],['<rect x="44" y="54" width="12" height="14"/>',"enN"]],
    m:CP("M22 52 L50 27 L78 52",4.2)+CP("M31 50 V68 H69 V50",3.2)+'<rect x="44" y="54" width="12" height="14" stroke-width="2"/>'+'<circle cx="34" cy="76" r="4.5" stroke-width="2.6"/>'+CP("M38.5 76 H66 M60 76 v4 M65 76 v4",2.8)},
  bag:{ /* shopping bag */
    e:[["M28 41 h44 l-3 35 h-38z","enB"]],
    m:CP("M28 41 h44 l-3 35 h-38z",3.2)+CP("M40 41 v-6 a10 10 0 0 1 20 0 v6",3.2)+'<circle cx="40" cy="47" r="1.8" fill="url(#pn-c-gm)" stroke-width="1"/><circle cx="60" cy="47" r="1.8" fill="url(#pn-c-gm)" stroke-width="1"/>'+cStarG(50,60,.8)},
  other:{ /* three enamel gems: everything else */
    e:[['<circle cx="32" cy="52" r="8"/>',"enB"],['<circle cx="50" cy="52" r="8"/>',"enN"],['<circle cx="68" cy="52" r="8"/>',"enG"]],
    m:'<circle cx="32" cy="52" r="8" stroke-width="2.6"/><circle cx="50" cy="52" r="8" stroke-width="2.6"/><circle cx="68" cy="52" r="8" stroke-width="2.6"/>'+CP("M30 35 h40 M30 69 h40",2.4)}
};

/** מונוגרמת-הנותן בחסות (שתי אותיות על אמייל שחור) — מטבע-הפלטינה. */
export function monoIcon(txt: string): CoinIc {
  return {
    e: [['<circle cx="50" cy="51" r="23.5"/>', 'enK']],
    m:
      '<circle cx="50" cy="51" r="24.5" stroke-width="2"/><circle cx="50" cy="51" r="21" stroke-width=".9"/>' +
      CT(50, 59.5, esc(txt), [...txt].length > 3 ? 19 : 23).replace('<text ', '<text direction="rtl" unicode-bidi="bidi-override" ') +
      '<path d="M50 23.5 l2.6 3.2 -2.6 3.2 -2.6 -3.2z" fill="url(#pn-c-gm)" stroke-width=".8"/>',
  };
}

/* ═══════════════ מתכות · שוליים · פנים · גב ═══════════════ */

export type PnMetal = 'gold' | 'silver' | 'plat';
export type PnRim = 'beads' | 'weave' | 'masks' | 'matzah';
interface Metal {
  gm: string;
  relief: string;
  /** צבעי-הקצה (כהה/בהיר) לטבעת-התלת-ממד בהיפוך. */
  seg: readonly [readonly [number, number, number], readonly [number, number, number]];
  bead: readonly [string, string];
  back: string;
  swap?: Readonly<Record<string, string>>;
}
export const PN_METALS: Readonly<Record<PnMetal, Metal>> = {
  gold: { gm: 'pn-c-gm', relief: 'pn-c-relief', seg: [[120, 80, 18], [250, 214, 128]], bead: ['#7c5412', '#fff0bf'], back: '' },
  silver: { gm: 'pn-c-gmS', relief: 'pn-c-reliefS', seg: [[104, 112, 124], [246, 248, 252]], bead: ['#4b5462', '#ffffff'], back: ' pn-sap', swap: { enB: 'enN' } },
  plat: { gm: 'pn-c-gmP', relief: 'pn-c-reliefS', seg: [[112, 122, 140], [252, 253, 255]], bead: ['#59627a', '#ffffff'], back: '' },
};
const cRing = (r: number, n: number, fn: (x: string, y: string, a: string, i: number) => string, off = 0): string => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = ((i + off) / n) * Math.PI * 2 - Math.PI / 2;
    s += fn((50 + r * Math.cos(a)).toFixed(2), (50 + r * Math.sin(a)).toFixed(2), ((a * 180) / Math.PI + 90).toFixed(1), i);
  }
  return s;
};
const cBeads = (m: Metal): string => {
  const d = cRing(38.2, 44, (x, y) => `<circle cx="${x}" cy="${y}" r=".95"/>`);
  return `<g fill="${m.bead[0]}" opacity=".55" transform="translate(.35 .5)">${d}</g><g fill="${m.bead[1]}" opacity=".8">${d}</g>`;
};
const dots = (r: number, n: number, off = 0): string => cRing(r, n, (x, y) => `<circle cx="${x}" cy="${y}" r=".62"/>`, off);
const RIMS: Readonly<Record<PnRim, (m: Metal) => string>> = {
  beads: (m) => cBeads(m),
  weave: (m) => {
    const c1 = ((Math.PI * 2 * 43.7) / 40 / 2).toFixed(3);
    const c2 = ((Math.PI * 2 * 47) / 40 / 2).toFixed(3);
    return (
      cBeads(m) +
      `<g fill="none" stroke-width="3.2"><circle cx="50" cy="50" r="43.7" stroke="#8a5a14"/><circle cx="50" cy="50" r="43.7" stroke="url(#pn-c-straw)" stroke-dasharray="${c1} ${c1}"/><circle cx="50" cy="50" r="47" stroke="#8a5a14"/><circle cx="50" cy="50" r="47" stroke="url(#pn-c-straw)" stroke-dasharray="${c2} ${c2}" stroke-dashoffset="${c2}"/><circle cx="50" cy="50" r="45.35" stroke="#5e3a08" stroke-width=".45" opacity=".8"/></g>` +
      cRing(45.3, 4, (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><ellipse rx="5" ry="2.3" fill="url(#pn-c-enG)" stroke="#f6dc94" stroke-width=".6"/><path d="M-4 0 H4" stroke="#bfe6c9" stroke-width=".4"/></g>`, 0.5)
    );
  },
  masks: (m) =>
    cBeads(m) +
    cRing(
      45.4,
      8,
      (x, y, a, i) =>
        `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-3.9 -1.5 Q0 -.4 3.9 -1.5 Q4.1 2 1.5 2.2 Q0 1 -1.5 2.2 Q-4.1 2 -3.9 -1.5Z" fill="url(#pn-c-${i % 2 ? 'enN' : 'enB'})" stroke="#fbe7a8" stroke-width=".55"/><circle cx="-1.7" cy=".2" r=".7" fill="#2a0a08"/><circle cx="1.7" cy=".2" r=".7" fill="#2a0a08"/></g>`,
    ) +
    cRing(45.4, 8, (x, y) => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff3c8"/>`, 0.5),
  matzah: (m) =>
    cBeads(m) +
    `<g opacity=".9">` +
    cRing(45, 9, (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2" transform="rotate(${a} ${x} ${y})" fill="#7a4a12" opacity=".22"/>`, 0.3) +
    `</g>` +
    `<g fill="#fff4cf" opacity=".7" transform="translate(-.25 -.35)">${dots(43.5, 52)}${dots(46.9, 56, 0.5)}</g>` +
    `<g fill="#4e2c06" opacity=".8">${dots(43.5, 52)}${dots(46.9, 56, 0.5)}</g>`,
};

const C_CACHE = new Map<string, string>();
/** הפנים: שוליים + תאי-אמייל + תבליט (נבנה פעם אחת לכל אייקון×מתכת×שוליים). */
export function coinFront(key: string | null, metal: PnMetal, rim: PnRim, ic0?: CoinIc): string {
  const ck = key + '|' + metal + '|' + rim;
  const hit = !ic0 && key ? C_CACHE.get(ck) : undefined;
  if (hit) return hit;
  const ic = ic0 ?? (key ? COIN_IC[key] : undefined) ?? COIN_IC.other;
  const M = PN_METALS[metal] ?? PN_METALS.gold;
  const en = ic.e
    .map(([sh, c]) => {
      const col = M.swap?.[c] ?? c;
      return `<g fill="url(#pn-c-${col})">${sh.startsWith('<') ? sh : `<path d="${sh}"/>`}</g>`;
    })
    .join('');
  const m = ic.m.replace(/url\(#pn-c-gm\)/g, `url(#${M.gm})`);
  const wrap = (s: string): string => (ic.flip ? `<g transform="translate(100 0) scale(-1 1)">${s}</g>` : s);
  const out = `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${(RIMS[rim] ?? RIMS.beads)(M)}<g filter="url(#pn-c-enamel)">${wrap(en)}</g><g filter="url(#${M.relief})" fill="none" stroke="url(#${M.gm})" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${wrap(m)}</g></svg>`;
  if (key && !ic0) C_CACHE.set(ck, out);
  return out;
}

/** הגב: המספר האמיתי של בעלי-המקצוע (n=null ⇒ "…"; גודל-הספרות לפי האורך — cnCount במקור). */
export function coinBack(metal: PnMetal, n: number | null): string {
  const M = PN_METALS[metal] ?? PN_METALS.gold;
  const s = n == null ? '…' : String(n);
  const L = s.length;
  const unit = n === 1 ? 'בעל מקצוע' : 'בעלי מקצוע';
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${cBeads(M)}<g filter="url(#${M.relief})"><text class="pn-cn-n" x="50" y="${L >= 3 ? 57 : L === 2 ? 59 : 61}" text-anchor="middle" font-family="Frank Ruhl Libre, serif" font-weight="900" font-size="${L >= 3 ? 30 : L === 2 ? 40 : 44}" fill="url(#${M.gm})">${s}</text></g>
  <text class="pn-cn-u" x="50" y="74.5" text-anchor="middle" font-family="Assistant, sans-serif" font-weight="800" font-size="11.5" fill="#0a0410" opacity=".6" transform="translate(.4 .7)">${unit}</text>
  <text class="pn-cn-u" x="50" y="74.5" text-anchor="middle" font-family="Assistant, sans-serif" font-weight="800" font-size="11.5" fill="${metal === 'gold' ? '#f6dc94' : '#eef2f8'}">${unit}</text></svg>`;
}

/** המטבע השלם (coinHTML במקור): הטיה › סיבוב › פנים (+גב, לא במיני) עם השדה, הברק וההבהוב. */
export function coinHTML(key: string | null, metal: PnMetal = 'gold', rim: PnRim = 'beads', o: { mini?: boolean; ic?: CoinIc; n?: number | null } = {}): string {
  const back = PN_METALS[metal]?.back ?? '';
  return (
    `<span class="pn-cn pn-${metal}${o.mini ? ' pn-cn-m' : ''}" data-metal="${metal}"${o.mini ? '' : ` data-coin="${key || 'mono'}"`}><span class="pn-cn-tilt"><span class="pn-cn-spin"><span class="pn-cn-face pn-cn-front"><span class="pn-cn-field"></span>${coinFront(o.ic ? null : key, metal, rim, o.ic)}<i class="pn-cn-spec"></i>${o.mini ? '' : `<i class="pn-cn-spec pn-cn-hot"></i><i class="pn-cn-glint"></i>`}</span>` +
    (o.mini ? '' : `<span class="pn-cn-face pn-cn-back"><span class="pn-cn-field pn-en${back}"></span>${coinBack(metal, o.n ?? null)}<i class="pn-cn-spec"></i><i class="pn-cn-spec pn-cn-hot"></i></span>`) +
    `</span></span></span>`
  );
}
/** מטבע-מיני (מסילת-התחומים, שורות-הניהול). */
export const miniCoin = (key: string | null, metal: PnMetal = 'gold', ic?: CoinIc): string => coinHTML(key, metal, 'beads', { mini: true, ic });

/** מונוגרמה מהשם (monoOf במקור): שתי אותיות, עם גרשיים בעברית ("א״ש"). */
export function monoOf(mono: string | undefined, name: string): string {
  const letters = (s: string): string => s.replace(/[^\p{L}]/gu, '');
  let t = letters(String(mono ?? ''));
  if (!t) {
    const w = String(name || '').replace(/^(ר׳|ר'|הרב|גב׳|גב'|מרת|הגב׳)\s+/, '').replace(/[״"׳']/g, '').trim().split(/\s+/).filter(Boolean);
    t = letters((w[0]?.[0] ?? '') + (w[1]?.[0] ?? ''));
  }
  t = [...t].slice(0, 2).join('');
  return /^[א-ת]{2}$/.test(t) ? t[0] + '״' + t[1] : t;
}
