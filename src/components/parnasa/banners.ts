/**
 * 📒 פרנסה׳לע — באנרי-התמונה של המקור (עיצוב 2): התוצאות הן תמונת-המקצוע עצמה עם המילים של העסק עליה — המסגור פר-תמונה
 * (‎PBC: חיתוך viewBox, צד ורוחב פאנל-המידע, מוקד-הזום, אור חם/קר, צבע-הסיכה), שכבת-החיים (מים בבריכה, חלקיקים באור,
 * נורה מהבהבת… — SMIL של המקור; החלקיקים — bannerFx.ts), איזו תמונה לובש עסק (לפי השער ומילות-המקצוע) והתאמת-השם.
 * pbLayers מועתק מ-parnasale.html L2709–2781 כלשונו (נוצר ע"י סקריפט); רק המזהים והמחלקות בקידומת pn-. התמונות —
 * public/parnasa/photos (נטענות רק כשהבאנר מתקרב לחלון — data-h ⇒ href).
 */
import type { PrListing } from '../../types/domain';
import { prNorm } from './lib';

/** מסגור-תמונה: viewBox · פאנל-המידע מימין (r) · רוחב-הפאנל · מוקד-הזום · שכבת-החיים · חם/קר · צבע-הסיכה. */
export interface PnPbc {
  vb?: string;
  r?: 1;
  pw: string;
  o: string;
  fx: string;
  pin?: string;
  warm?: 1;
  cool?: 1;
}
export const PN_PBC: Readonly<Record<string, PnPbc>> = {
  plumb: { vb: '380 105 1028 560', r: 1, pw: '54%', o: '900px 430px', fx: 'water', pin: '#9fd7ef' },
  stam: { pw: '47%', o: '900px 380px', fx: 'stam', warm: 1 },
  move: { pw: '47%', o: '880px 420px', fx: 'move', warm: 1 },
  elec: { pw: '46%', o: '900px 300px', fx: 'elec', warm: 1 },
  ac: { pw: '41%', o: '760px 260px', fx: 'ac', pin: '#9fd7ef', cool: 1 },
  cater: { pw: '42%', o: '950px 400px', fx: 'cater', warm: 1 },
  learn: { pw: '42%', o: '950px 420px', fx: 'learn', warm: 1 },
  build: { pw: '42%', o: '950px 420px', fx: 'build', warm: 1 },
  photog: { pw: '38%', o: '1000px 420px', fx: 'photog', warm: 1 },
  health: { pw: '44%', o: '950px 450px', fx: 'health', pin: '#9fe0c8', cool: 1 },
  fashion: { pw: '44%', o: '950px 420px', fx: 'fashion', warm: 1 },
  clean: { pw: '44%', o: '950px 450px', fx: 'clean', pin: '#9fd7ef', cool: 1 },
  acct: { pw: '40%', o: '900px 420px', fx: 'acct', warm: 1 },
  tech: { pw: '40%', o: '950px 420px', fx: 'tech', pin: '#a9c4ff', cool: 1 },
  estate: { pw: '40%', o: '900px 450px', fx: 'estate', warm: 1 },
  shop: { pw: '40%', o: '950px 420px', fx: 'shop', warm: 1 },
  garden: { pw: '38%', o: '950px 420px', fx: 'garden', warm: 1, pin: '#cfe8a8' },
  bake: { pw: '38%', o: '900px 450px', fx: 'bake', warm: 1 },
};

/** איזו תמונה לובש עסק (photoOf במקור): לפי השער, מעודן לפי מילות-המקצוע; '' = בלי תמונה (סמל-המותג). */
export function photoOf(l: Pick<PrListing, 'category' | 'title'> & { tagline?: string }): string {
  const t = prNorm([l.title, l.tagline ?? ''].join(' '));
  switch (l.category) {
    case 'build':
      return 'build';
    case 'elec':
      return /נזיל|סתימ|דוד|אינסטל/.test(t) ? 'plumb' : /מזג[ןנ]|מיזוג|קירור|חימום/.test(t) ? 'ac' : 'elec';
    case 'car':
      return 'move';
    case 'fin':
      return 'acct';
    case 'tech':
      return 'tech';
    case 'edu':
      return 'learn';
    case 'stam':
      return 'stam';
    case 'events':
      return /צילו[םמ]|צל[םמ]/.test(t) ? 'photog' : 'cater';
    case 'health':
      return 'health';
    case 'fashion':
      return 'fashion';
    case 'home':
      return /גינ|גנ[ןנ]|השקי/.test(t) ? 'garden' : 'clean';
    case 'food':
      return 'bake';
    case 'realestate':
      return 'estate';
    case 'trade':
      return 'shop';
    default:
      return '';
  }
}

/** כתובת-התמונה (public/parnasa/photos — קבצים לצד האתר, נטענים לפי דרישה). */
export function photoUrl(k: string, base = './'): string {
  return k ? base + 'parnasa/photos/' + k + '.jpg' : '';
}

/** התאמת-השם (nameFit במקור): מילה ארוכה או שם ארוך ⇒ גופן קטן יותר. */
export function nameFit(n: string): '' | 'long' | 'xlong' {
  const s = String(n || '');
  const w = s.split(/[\s־-]+/).map((x) => [...x].length);
  const L = [...s].length;
  const m = Math.max(0, ...w);
  return m >= 9 || L > 24 ? 'xlong' : m >= 7 || L > 16 ? 'long' : '';
}

/** שכבת-הסצנה: תמונה + שכבת-החיים (SMIL), מחרוזת-SVG. תנועה-מופחתת ⇒ בלי <animate>. */
export function sceneSvg(c: PnPbc, src: string, reduced: boolean): string {
  const s = pbLayers(c, src);
  return reduced ? s.replace(/<animate\b[^>]*\/>/g, '') : s;
}

/* שכבות-החיים של המקור — כלשונן (נתוני-ציור) */
export function pbLayers(c: PnPbc, src: string): string {
  const im=(f?: string): string=>`<image data-h="${src}" x="0" y="0" width="1408" height="768" preserveAspectRatio="xMidYMid slice"${f?` filter="url(#pn-${f})"`:""}/>`,I=im();
  const tw=(x: number,y: number,r: number,dur: number,delay: number): string=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#pn-pbn-mote)" opacity="0"><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.15;.35;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
  const glow=(x: number,y: number,r: number,a: number,b: number,d: number): string=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#pn-pbn-sun)" opacity="${a}"><animate attributeName="opacity" values="${a};${b};${a}" dur="${d}s" repeatCount="indefinite"/></circle>`;
  const led=(x: number,y: number,col: string,d: number,bg: number): string=>`<circle cx="${x}" cy="${y}" r="4" fill="${col}" opacity="0"><animate attributeName="opacity" values="0;1;0;1;0;0" keyTimes="0;.1;.2;.3;.4;1" dur="${d}s" begin="${bg}s" repeatCount="indefinite"/></circle>`;
  const fxl=(clip: string,f: string): string=>`<g class="pn-pbn-fxl" clip-path="url(#pn-${clip})">${im(f)}</g>`,SC=`style="mix-blend-mode:screen"`;
  switch(c.fx){
  case"water":return I+fxl("pbn-poolC","pbn-wave")+fxl("pbn-streamC","pbn-stream")+`<g ${SC}>
      <ellipse cx="630" cy="580" rx="70" ry="30" fill="url(#pn-pbn-lamp)"><animate attributeName="opacity" values=".55;.9;.6;.95;.55" dur="3.4s" repeatCount="indefinite"/></ellipse>
      <ellipse cx="776" cy="549" rx="60" ry="26" fill="url(#pn-pbn-lamp)"><animate attributeName="opacity" values=".8;.5;.95;.6;.8" dur="2.7s" repeatCount="indefinite"/></ellipse>
    </g><g class="pn-pool"></g><g class="pn-mist" ${SC}></g>`;
  case"stam":return I+`<g ${SC}>
      <polygon points="1300,0 1408,0 1408,90 1010,640 760,640" fill="url(#pn-pbn-beam)"><animate attributeName="opacity" values=".7;1;.75;.95;.7" dur="7s" repeatCount="indefinite"/></polygon>
      <ellipse cx="1062" cy="322" rx="16" ry="9" fill="url(#pn-pbn-mote)"><animate attributeName="opacity" values="0;.9;0;0;0" dur="4.5s" repeatCount="indefinite"/></ellipse>
      <ellipse cx="895" cy="372" rx="30" ry="10" fill="url(#pn-pbn-mote)" opacity="0"><animate attributeName="opacity" values="0;0;.6;0;0" dur="5.5s" repeatCount="indefinite"/></ellipse>
    </g><g class="pn-motes" ${SC}></g>`;
  case"move":return I+fxl("pbn-roadC","pbn-haze")+`<g ${SC}><circle cx="1360" cy="20" r="230" fill="url(#pn-pbn-sun)"><animate attributeName="opacity" values=".55;.85;.6;.8;.55" dur="6s" repeatCount="indefinite"/></circle></g><g class="pn-petals"></g>`;
  case"elec":return I+`<g ${SC}>
      <circle class="pn-bulb" cx="768" cy="245" r="210" fill="url(#pn-pbn-sun)"/>
      <ellipse cx="1066" cy="478" rx="44" ry="20" fill="url(#pn-pbn-mote)"><animate attributeName="opacity" values=".15;.5;.2;.45;.15" dur="2.2s" repeatCount="indefinite"/></ellipse>
    </g><g class="pn-sparks" ${SC}></g><g class="pn-motes" ${SC}></g>`;
  case"ac":return I+fxl("pbn-mistC","pbn-haze")+`<g ${SC}>
      <polygon points="1060,60 1320,40 1320,560 1060,540 640,768 420,768" fill="url(#pn-pbn-beam)" opacity=".55"><animate attributeName="opacity" values=".4;.65;.45;.6;.4" dur="8s" repeatCount="indefinite"/></polygon>
    </g><g class="pn-wisps"></g><g class="pn-flakes" ${SC}></g>`;
  case"cater":return I+`<g ${SC}>
      <circle cx="940" cy="70" r="120" fill="url(#pn-pbn-sun)" opacity=".35"><animate attributeName="opacity" values=".3;.5;.35;.45;.3" dur="5s" repeatCount="indefinite"/></circle>
      ${tw(660,440,14,3.2,0)}${tw(785,405,12,3.8,1.1)}${tw(1182,448,13,4.1,2)}${tw(1232,392,10,3.5,.6)}${tw(920,300,16,4.6,1.7)}${tw(1240,520,9,3.9,2.6)}
      ${[620,690,760,830].map((x,i)=>tw(x,100+i*-6,9,2.8+i*.4,i*.7)).join("")}
    </g><g class="pn-steam"></g>`;
  case"learn":return I+`<g ${SC}>
      <circle cx="1165" cy="275" r="230" fill="url(#pn-pbn-sun)" opacity=".55"><animate attributeName="opacity" values=".5;.62;.52;.6;.5" dur="4s" repeatCount="indefinite"/></circle>
      <ellipse cx="752" cy="318" rx="80" ry="34" fill="url(#pn-pbn-mote)" opacity="0"><animate attributeName="opacity" values="0;.35;0;0" keyTimes="0;.2;.45;1" dur="5s" repeatCount="indefinite"/></ellipse>
    </g><g class="pn-motes" ${SC}></g>`;
  case"build":return I+`<g ${SC}>
      <polygon points="1180,80 1330,60 1330,470 1020,720 760,720" fill="url(#pn-pbn-beam)" opacity=".6"><animate attributeName="opacity" values=".45;.7;.5;.65;.45" dur="7s" repeatCount="indefinite"/></polygon>
      ${tw(1088,598,10,3.6,.4)}
    </g><g class="pn-motes" ${SC}></g>`;
  case"photog":return I+`<g ${SC}>
      <circle cx="640" cy="150" r="150" fill="url(#pn-pbn-sun)" opacity=".35"><animate attributeName="opacity" values=".3;.45;.32;.42;.3" dur="4s" repeatCount="indefinite"/></circle>
      ${tw(545,45,22,3.4,0)}${tw(955,70,24,4.2,1.2)}${tw(1345,195,16,3.7,2.1)}${tw(1042,232,12,4.4,.5)}${tw(992,600,16,5,1.6)}${tw(1262,610,12,4.8,3)}
      <rect class="pn-flash" x="0" y="0" width="1408" height="768" fill="#fff" opacity="0"/>
    </g>`;
  case"health":return I+fxl("pbn-curtC","pbn-haze")+`<g ${SC}>
      <polygon points="1000,0 1170,0 1170,520 860,768 560,768" fill="url(#pn-pbn-beam)" opacity=".5"><animate attributeName="opacity" values=".35;.55;.4;.5;.35" dur="8s" repeatCount="indefinite"/></polygon>
      <ellipse cx="1028" cy="587" rx="34" ry="16" fill="url(#pn-pbn-mote)" opacity="0"><animate attributeName="opacity" values="0;.7;0;.7;0;0" keyTimes="0;.08;.16;.24;.32;1" dur="2.4s" repeatCount="indefinite"/></ellipse>
    </g>
    <path class="pn-ecg" d="M560 720 H700 l14 -30 l14 60 l14 -90 l16 120 l14 -60 H900" fill="none" stroke="#bff3dc" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0" ${SC}/>`;
  case"fashion":return I+`<g ${SC}>
      <circle cx="700" cy="330" r="150" fill="url(#pn-pbn-sun)" opacity=".45"><animate attributeName="opacity" values=".4;.55;.42;.52;.4" dur="4.5s" repeatCount="indefinite"/></circle>
      <polygon points="1270,0 1408,0 1408,520 1100,768 900,768" fill="url(#pn-pbn-beam)" opacity=".4"/>
      ${tw(965,470,10,3.6,0)}${tw(1060,612,13,4.2,1.3)}${tw(1132,548,8,3.9,2.4)}${tw(1058,108,9,5,.8)}
    </g>`;
  case"clean":return I+`<g ${SC}>
      <polygon points="1000,40 1130,40 1130,340 640,640 380,640" fill="url(#pn-pbn-beam)" opacity=".55"><animate attributeName="opacity" values=".45;.7;.5;.65;.45" dur="6s" repeatCount="indefinite"/></polygon>
      ${tw(760,560,9,3.2,0)}${tw(905,610,11,3.8,1)}${tw(1003,575,8,3.4,1.9)}${tw(1090,640,10,4.1,.6)}${tw(840,490,7,3.6,2.6)}${tw(1180,700,9,4.4,1.4)}
    </g><g class="pn-bubbles"></g>`;
  case"acct":return I+`<g ${SC}>${glow(910,330,190,.4,.6,4.5)}
      <polygon points="1200,60 1360,60 1360,500 900,768 650,768" fill="url(#pn-pbn-beam)" opacity=".4"/>
      ${tw(905,525,9,3.6,0)}${tw(1250,470,11,4.2,1.2)}${tw(1015,465,7,4.8,2.2)}</g><g class="pn-motes" ${SC}></g>`;
  case"tech":return I+`<g ${SC}>${glow(670,275,150,.25,.4,5)}${glow(895,440,140,.25,.45,3.8)}${glow(1270,330,170,.25,.4,4.4)}
      ${led(887,212,"#7dff9c",2.2,0)}${led(903,212,"#7dff9c",2.6,.5)}${led(919,212,"#8ab4ff",1.8,1.1)}${led(887,238,"#7dff9c",2.4,.8)}${led(903,238,"#8ab4ff",3,0)}${led(919,238,"#7dff9c",2,1.4)}</g>`;
  case"estate":return I+`<g ${SC}>
      <polygon points="560,150 760,150 1100,560 620,560" fill="url(#pn-pbn-beam)" opacity=".35"><animate attributeName="opacity" values=".25;.45;.3;.4;.25" dur="7s" repeatCount="indefinite"/></polygon>
      ${tw(890,610,12,3.4,0)}${tw(935,630,9,4,1.3)}${glow(1350,250,180,.25,.4,6)}</g><g class="pn-motes" ${SC}></g>`;
  case"shop":return I+`<g ${SC}>${glow(930,330,220,.25,.45,4)}
      ${tw(985,560,9,3.6,0)}${tw(1080,580,8,4.1,1)}${tw(1120,600,10,3.8,2)}${tw(905,190,10,4.6,.6)}</g>`;
  case"garden":return I+fxl("pbn-sprayC","pbn-haze")+`<g ${SC}>${glow(1150,120,220,.35,.55,5)}
      ${tw(610,150,8,3.4,0)}${tw(660,250,9,4,1.2)}${tw(1255,310,8,3.8,2)}${tw(540,420,9,4.4,.8)}</g><g class="pn-motes" ${SC}></g>`;
  case"bake":return I+`<g ${SC}>
      <circle cx="750" cy="270" r="190" fill="url(#pn-pbn-sun)" opacity=".5"><animate attributeName="opacity" values=".45;.7;.5;.75;.55;.45" dur="3.2s" repeatCount="indefinite"/></circle>
      ${glow(1350,180,220,.3,.45,6)}
      ${tw(850,470,8,3.6,0)}${tw(960,510,9,4.2,1.1)}${tw(745,505,7,3.9,2)}</g><g class="pn-steam"></g><g class="pn-motes" ${SC}></g>`;
  default:return I}}
