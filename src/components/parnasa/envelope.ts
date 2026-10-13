/**
 * 📒 פרנסה׳לע — "המעטפת" של עסק (המקור, design pass): מי בקהילה עומד מאחוריו ולמי הוא עוזר — שותפים טבעיים
 * (עבודה מביאה עבודה), לקוחות עסקיים, מקצועי/שיווק/תפעול, עמיתים — וכמה "מקומות פנויים" (תפקידים שאין עדיין
 * באלפון). הטבלאות (ENV_P / ENV_C / ENV_ROLES / ENV_G) מילה-במילה מהמקור; טהור — רק עסקים מאושרים.
 * משמש את "עובדים לצידו" בדף-העסק, את "המעטפת של העסק" (רק הגבאי רואה) ואת "המעטפת שלי" בהעסק שלי.
 */
import type { PrListing } from '../../types/domain';
import { categoryOf } from './lib';

type Role = 'partners' | 'clients' | 'pro' | 'mkt' | 'ops' | 'peers';

/** שותפים טבעיים לפי שער: [שער, למה, מסנן-כותרת אופציונלי]. */
const ENV_P: Readonly<Record<string, ReadonlyArray<readonly [string, string, RegExp?]>>> = {
  elec: [['build', 'אחרי תיקון צריך טיח, צבע וריצוף'], ['home', 'ניקיון אחרי הצפה או עבודה', /ניקי/], ['car', 'הובלת דודים וציוד כבד', /הובל/]],
  build: [['elec', 'חשמל ואינסטלציה בכל שיפוץ'], ['home', 'ניקיון אחרי שיפוץ', /ניקי/], ['car', 'פינוי פסולת והובלת חומרים', /הובל/]],
  car: [['home', 'ניקיון לפני ואחרי מעבר דירה', /ניקי/], ['build', 'שיפוץ בדירה החדשה'], ['elec', 'חיבור מזגנים ודודים בדירה החדשה']],
  fin: [['realestate', 'חוזים ומשכנתאות'], ['tech', 'מערכות הנהלת חשבונות']],
  tech: [['fin', 'הנהלת חשבונות לעסקים'], ['events', 'עיצוב הזמנות ומדיה לשמחות']],
  edu: [['stam', 'ספרים ותשמישי קדושה'], ['tech', 'עזרי לימוד ומחשבים']],
  stam: [['edu', 'בר מצווה: מלמד ותפילין יחד'], ['events', 'שמחות: מזוזות לבית החדש']],
  // מפתח-השער 'events' (שמחות) במירכאות — שער, לא אירועי-הלוח (סריקת-הבידוד)
  'events': [['food', 'קייטרינג ומאפים לשמחה'], ['fashion', 'בגדים ופאות לשמחה'], ['car', 'הסעות לאורחים'], ['events', 'צלם, תזמורת וקייטרינג באותה שמחה']],
  health: [['fin', 'ניהול חשבונות לקליניקה'], ['tech', 'תורים ומערכות']],
  fashion: [['events', 'לקוחות לקראת שמחות'], ['trade', 'בדים ואביזרים']],
  home: [['build', 'תיקונים שמתגלים בניקיון'], ['elec', 'תקלות שמתגלות בבית'], ['car', 'הובלות ופינוי', /הובל/]],
  food: [['events', 'שמחות וקידושים'], ['car', 'משלוחים']],
  realestate: [['build', 'שיפוץ לפני מכירה או השכרה'], ['car', 'מעבר דירה', /הובל/], ['fin', 'עו״ד ורו״ח לעסקה']],
  trade: [['car', 'משלוחים והובלות'], ['tech', 'קופה ואתר']],
  other: [],
};
/** לקוחות עסקיים לפי שער ('*' = כל השערים). */
const ENV_C: Readonly<Record<string, readonly string[]>> = {
  elec: ['food', 'events', 'realestate', 'health'],
  build: ['realestate', 'food', 'trade'],
  car: ['trade', 'food', 'realestate'],
  fin: ['*'],
  tech: ['*'],
  home: ['realestate', 'health', 'food'],
  'events': ['edu', 'stam'],
  food: ['events', 'edu'],
  stam: ['edu', 'events'],
  realestate: ['build'],
  trade: ['food', 'events'],
  fashion: ['events'],
  edu: ['stam'],
  health: [],
  other: [],
};
/** מה כל עסק צריך כדי לעמוד על הרגליים: [תווית, מבחן, למה, קבוצה, שער-ההזמנה]. */
const tx = (e: PrListing): string => (e.title || '') + (e.name || '');
const ENV_ROLES: ReadonlyArray<readonly [string, (e: PrListing) => boolean, string, Role, string]> = [
  ['רואה חשבון', (e) => e.category === 'fin' && /חשבון|רו״ח|רו"ח|מס/.test(tx(e)), 'פתיחת תיק, דוחות ומע״מ', 'pro', 'fin'],
  ['סוכן ביטוח', (e) => /ביטוח/.test(tx(e)), 'ביטוח לעסק ולציוד', 'pro', 'fin'],
  ['רב לשאלות הלכה בעסקים', (e) => /הלכה|דיין|בורר|בית דין/.test((e.title || '') + (e.desc || '')), 'היתר עסקא, שותפויות, השגת גבול', 'pro', 'stam'],
  ['מעצב גרפי', (e) => /מעצב|עיצוב|גרפ|לוגו/.test(tx(e)), 'לוגו, כרטיס ביקור ומגנט למקרר', 'mkt', 'tech'],
  ['צלם', (e) => /צלם|צילום/.test(tx(e)), 'תמונות עבודה לדף העסק', 'mkt', 'events'],
  ['דפוס', (e) => /דפוס|הדפס/.test(tx(e)), 'עלונים, מגנטים וכרטיסים', 'mkt', 'trade'],
  ['הובלות', (e) => e.category === 'car' && /הובל/.test(tx(e)), 'הובלת ציוד וחומרים', 'ops', 'car'],
];
/** הקבוצות (ENV_G): מפתח · אימוג'י · כותרת · משנה. */
export const ENV_G: ReadonlyArray<readonly [Role, string, string, string]> = [
  ['partners', '🔧', 'שותפים טבעיים', 'עבודה מביאה עבודה'],
  ['clients', '🏪', 'עסקים שצריכים אתכם', 'גם עסקים הם לקוחות'],
  ['pro', '📋', 'מקצועי והלכה', 'שהניירת תהיה מסודרת'],
  ['mkt', '📸', 'שיווק', 'שיראו אתכם'],
  ['ops', '🚚', 'תפעול', 'שהעבודה תזרום'],
  ['peers', '🤝', 'באותו תחום', 'מפנים עבודה עודפת אחד לשני'],
];

export interface PnEnvItem {
  e: PrListing;
  why: string;
  r?: number;
}
export interface PnEnvMiss {
  l: string;
  why: string;
  grp: Role;
  cc: string;
}
export interface PnEnv {
  g: Record<Role, PnEnvItem[]>;
  miss: PnEnvMiss[];
  /** קרוב (אותה עיר / אותו אזור) לעסק. */
  near: (e: PrListing) => boolean;
  pct: number;
}

/** envOf של המקור: הקבוצות (עד 4 בכל אחת, קרובים קודם), המקומות-הפנויים ואחוז-המעטפת. */
export function envOf(b: PrListing, listings: readonly PrListing[]): PnEnv {
  const all = listings.filter((e) => e.status === 'approved' && e.id !== b.id);
  const near = (e: PrListing): boolean => !!((e.city && e.city === b.city) || (e.area && b.area && e.area === b.area));
  const g: Record<Role, PnEnvItem[]> = { partners: [], clients: [], pro: [], mkt: [], ops: [], peers: [] };
  const cat = categoryOf(b.category).key as string;
  const ttl = (e: PrListing): string => (e.title || '') + ' ' + (e.name || '');
  const P = ENV_P[cat] ?? [];
  P.forEach(([c, why, re], ri) => {
    if (c === cat) return;
    for (const e of all) if (e.category === c && (!re || re.test(ttl(e)))) g.partners.push({ e, why, r: ri });
  });
  const self = P.find(([c]) => c === cat);
  if (self) for (const e of all) if (e.category === cat && e.title !== b.title) g.partners.push({ e, why: self[1] });
  const cl = ENV_C[cat] ?? [];
  for (const e of all) if ((cl.includes('*') || cl.includes(e.category)) && e.category !== cat) g.clients.push({ e, why: 'לקוח עסקי · ' + (e.title || categoryOf(e.category).name) });
  const miss: PnEnvMiss[] = [];
  let slots = 0;
  let filled = 0;
  for (const [l, t, why, grp, cc] of ENV_ROLES) {
    if (t(b)) continue;
    slots++;
    const hit = all.filter(t);
    if (hit.length) {
      filled++;
      for (const e of hit) g[grp].push({ e, why: l + ' · ' + why });
    } else miss.push({ l, why, grp, cc });
  }
  for (const [c] of P) {
    slots++;
    if (all.some((e) => e.category === c)) filled++;
  }
  for (const e of all) if (e.category === cat) g.peers.push({ e, why: e.title || '' });
  for (const k of Object.keys(g) as Role[]) {
    const seen = new Set<string>();
    g[k] = g[k]
      .filter((x) => !seen.has(x.e.id) && !!seen.add(x.e.id))
      .sort((x, y) => (x.r ?? 0) - (y.r ?? 0) || Number(near(y.e)) - Number(near(x.e)) || (x.e.name || '').localeCompare(y.e.name || '', 'he'))
      .slice(0, 4);
  }
  return { g, miss, near, pct: slots ? Math.round((filled / slots) * 100) : 100 };
}

/** "עובדים לצידו" (nearRow): שותפים + עמיתים, בלי כפילות, עד 6. */
export function nearOf(b: PrListing, listings: readonly PrListing[]): PnEnvItem[] {
  const { g } = envOf(b, listings);
  const xs = [...g.partners, ...g.peers];
  return xs.filter((x, i) => xs.findIndex((y) => y.e.id === x.e.id) === i).slice(0, 6);
}

/** שורת-המעטפת (envRow): האחוז · כמה קשרים · כמה מקומות פנויים. */
export function envSummary(b: PrListing, listings: readonly PrListing[]): { pct: number; have: number; miss: number } {
  const { g, miss, pct } = envOf(b, listings);
  return { pct, have: new Set(Object.values(g).flat().map((x) => x.e.id)).size, miss: miss.length };
}

export interface PnEnvNode {
  /** עסק (או מקום-פנוי m). */
  e?: PrListing;
  m?: PnEnvMiss;
  why: string;
  /** טבעת 0–2. */
  ri: number;
  x: number;
  y: number;
}

/** קבוצת-הכוכבים (envHTML): שלוש טבעות סביב העסק — שותפים · לקוחות ועמיתים · מקצועי/שיווק/תפעול + מקומות פנויים. */
export function envLayout(b: PrListing, listings: readonly PrListing[]): { nodes: PnEnvNode[]; pct: number; have: number; miss: number; near: (e: PrListing) => boolean } {
  const { g, miss, near, pct } = envOf(b, listings);
  const uniq = (xs: PnEnvItem[]): PnEnvItem[] => xs.filter((x, i) => xs.findIndex((y) => y.e.id === x.e.id) === i);
  const rings: Array<Array<{ e?: PrListing; m?: PnEnvMiss; why: string }>> = [
    g.partners.slice(0, 5),
    uniq([...g.clients, ...g.peers]).slice(0, 8),
    [...uniq([...g.pro, ...g.mkt, ...g.ops]).slice(0, 9 - Math.min(miss.length, 6)), ...miss.slice(0, 6).map((m) => ({ m, why: m.why }))],
  ];
  const seen = new Set<string>();
  for (const r of rings)
    for (let i = r.length - 1; i >= 0; i--) {
      const k = r[i].e?.id;
      if (k) {
        if (seen.has(k)) r.splice(i, 1);
        else seen.add(k);
      }
    }
  const R = [22, 32.5, 41.5];
  const nodes: PnEnvNode[] = [];
  rings.forEach((ring, ri) => {
    const st = (2 * Math.PI) / Math.max(ring.length, 1);
    ring.forEach((x, i) => {
      const a = -Math.PI / 2 + i * st + ri * 0.55;
      let best = a;
      let bd = -1;
      // כל מטבע נדחף למקום הרחוק ביותר מהמטבעות שכבר הונחו
      for (const o of [0, -0.33, 0.33, -0.5, 0.5]) {
        const t = a + o * st;
        const px = 50 + Math.cos(t) * R[ri];
        const py = 50 + Math.sin(t) * R[ri];
        const d = nodes.reduce((m, n) => Math.min(m, Math.hypot(n.x - px, n.y - py)), 99);
        if (d > bd + 0.5) {
          bd = d;
          best = t;
        }
        if (d > 17) break;
      }
      nodes.push({ ...x, ri, x: 50 + Math.cos(best) * R[ri], y: 50 + Math.sin(best) * R[ri] });
    });
  });
  return { nodes, pct, have: nodes.filter((n) => n.e).length, miss: miss.length, near };
}

/** הזמנה לעסק שחסר (envInvite) — בלי קישור-ציבורי (אין לפורט קישור כזה; המקור נופל לנקודה). */
export function envInvite(label: string, brand: string): string {
  return 'שלום! בקהילה שלנו חסר ' + label + ' באלפון ' + brand + '. הרבה עסקים מהקהילה צריכים בדיוק אותך. ההצטרפות בחינם.';
}
