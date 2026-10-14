/**
 * 🧬 מנועים וחלקים — מנוע שנוצר הוא מנוע שאפשר לבנות עליו (ATOMS-CHAIN, 14.10.2026).
 *
 * חזון-הבעלים: "התוצאה היא מנוע חדש שחוזר לארגז". כאן — המבנה בלבד (בלי נתונים, בלי חישוב):
 *  · מזהה של מנוע-בנוי = מזהה ההורה + '>' + החלק ("bookings:bookings.turnover:divide>merge") ⇒ הדור נקרא מהמזהה,
 *    ומעגל בלתי-אפשרי במבנה (ההורה תמיד קצר יותר); עד 3 דורות.
 *  · המקום היחיד של מנוע-בנוי = הפלט שלו, מסוג `outputKind` של החוזה ("התורים של מנוע תורים").
 *    חריג אחד, מתועד: 🔗 נותן קבוצות — כל קבוצה היא גם "מ… עד…", ולכן למנוע שנבנה על 🔗 בלילות יש גם מקום שני מסוג span
 *    (אחרת ✂️ לא יכול לחלק את הזמן הפנוי — 🔗⇒✂️ שהבעלים ביקש).
 *  · אילו חלקים מתחברים לכל פלט — רק מה שיש לו תוצאה אמיתית מחושבת (chainPreview.ts). אין תוצאה ⇒ לא מוצע.
 * טהור: בלי React/store/DOM/שעון. הצורה בבנדל-הראשי — capShape.ts (בלי שינוי).
 */
import { capabilityId, outputKind, type AtomId, type Capability, type EngineCard, type Kind, type Place } from './contract';
import { atomCard } from './cards';
import { engineCard, placeById } from './engines';
import { genPlace } from './engines/registry';

/** כמה מנועים לכל היותר בשרשרת (המנוע הראשון + שניים שבנויים עליו). */
export const MAX_GENERATIONS = 3;

/** מה הפלט של מנוע — לא הסוג (זה בחוזה) אלא מה הוא באמת, כדי לדעת מה אפשר לחשב ממנו. */
export type ChainValue = 'slots' | 'windows' | 'moments' | 'assigned' | 'pieces';

/** המנועים הראשונים שאפשר לבנות עליהם (מקום:חלק ⇒ מה יוצא). */
export const ROOT_VALUE: Readonly<Record<string, ChainValue>> = {
  'bookings.turnover:divide': 'slots',
  'bookings.nights:merge': 'windows',
  'bookings.arrivals:next': 'moments',
  'bookings.arrivals:offset': 'moments',
  'bookings.arrivals:round': 'moments',
  // FACTORY 14.10: סגירת הפער של C — גם מחשבון הזמנים ו"מה צריך?" נותנים פלט שאפשר לבנות עליו
  'zmanim.times:next': 'moments',
  'zmanim.times:offset': 'moments',
  'zmanim.times:round': 'moments',
  'zmanim.day:divide': 'slots',
  'whatNeed.openings:next': 'moments',
};

/**
 * FACTORY 14.10: מה יוצא מהמנוע הראשון — מקום-יד (ROOT_VALUE), או מקום שנמצא אוטומטית: רשימת-זמנים (⏭️ ⏱️ 🎯) ורשימה
 * מתוארכת (⏭️) נותנות זמנים, שעות-ביום מתחילה עד סוף (✂️) נותנות תורים. אחרת — אין על מה לבנות (null).
 */
export function rootValueOf(place: string, atom: AtomId | string): ChainValue | null {
  const v = ROOT_VALUE[place + ':' + atom];
  if (v) return v;
  const g = genPlace(place);
  if (!g || !g.results[atom as AtomId]) return null;
  if (g.kind === 'times' && (atom === 'next' || atom === 'offset' || (atom === 'round' && g.spec.unit === 'clock'))) return 'moments';
  if (g.kind === 'sequence' && atom === 'next') return 'moments';
  if (g.kind === 'span' && atom === 'divide' && g.spec.unit === 'clock') return 'slots';
  if (g.kind === 'amount' && atom === 'divide') return 'pieces';
  return null;
}

/** FACTORY 14.10: אילו חלקים מתחברים לפלט, לפי המנוע הראשון — 🔄 על תורים רק במנהל ההזמנות (יש לו אנשי ניקיון לתת להם). */
export function nextOf(rootPlace: string, v: ChainValue, atom: AtomId | string): ChainValue | undefined {
  if (v === 'slots' && atom === 'rotate' && !rootPlace.startsWith('bookings.')) return undefined;
  return NEXT_VALUE[v][atom as AtomId];
}
export const nextAtoms = (rootPlace: string, v: ChainValue): AtomId[] => (Object.keys(NEXT_VALUE[v]) as AtomId[]).filter((a) => !!nextOf(rootPlace, v, a));

/** איזה חלק מתחבר לכל פלט, ומה יוצא ממנו. */
export const NEXT_VALUE: Readonly<Record<ChainValue, Partial<Record<AtomId, ChainValue>>>> = {
  slots: { merge: 'slots', next: 'moments', rotate: 'assigned' },
  windows: { next: 'moments', rotate: 'assigned', divide: 'assigned' },
  moments: { offset: 'moments', round: 'moments', next: 'moments' },
  assigned: {},
  // FACTORY 14.10: סכום שחולק לתשלומים (מקום-סכום שנמצא אוטומטית) — כל תשלום לאיש צוות אחר, בתורות
  pieces: { rotate: 'assigned' },
};

/** המקום של הפלט: שם פשוט לכל פלט (ה-✨ ושם המנוע נכנסים במקום של {n}). */
const OUT_NAME: Readonly<Record<ChainValue, string>> = {
  slots: 'התורים של {n}',
  windows: 'החלונות הפנויים של {n}',
  moments: 'הזמנים של {n}',
  assigned: 'מה ש{n} נותן',
  pieces: 'התשלומים של {n}',
};
const SPAN_NAME = 'כל חלון פנוי של {n}, מתחילתו ועד סופו';

/** מה כל חלק עושה לכל פלט — משפט-התוצאה שליד האפשרות. */
const OUT_RESULT: Readonly<Record<ChainValue, Partial<Record<AtomId, string>>>> = {
  slots: {
    merge: 'מחבר תורים צמודים לתור אחד ארוך — תורים באורך משתנה',
    next: 'מוצא את התור הבא מעכשיו',
    rotate: 'נותן כל תור לאיש צוות אחר, בתורות',
  },
  windows: {
    next: 'מוצא את החלון הפנוי הבא שארוך מספיק',
    rotate: 'נותן כל חלון פנוי לאיש צוות אחר, בתורות',
    divide: 'מחלק כל חלון פנוי לחלקים שווים בין אנשי הצוות',
  },
  moments: {
    offset: 'קובע תזכורת לפני או אחרי כל אחד',
    round: 'מעגל כל שעה',
    next: 'מוצא את הבא מעכשיו',
  },
  assigned: {},
  pieces: {
    rotate: 'נותן כל תשלום לאיש צוות אחר לגבות, בתורות',
  },
};

export interface ParsedCapId {
  /** מזהה המנוע הראשון בשרשרת. */
  root: string;
  engine: string;
  /** המקום של המנוע הראשון (במנוע הגדול). */
  place: string;
  /** כל החלקים בשרשרת, מהראשון לאחרון. */
  atoms: AtomId[];
}

/** "bookings:bookings.turnover:divide>merge" ⇒ השורש, המקום והחלקים. לא-תקין ⇒ null. */
export function parseCapId(id: unknown): ParsedCapId | null {
  if (typeof id !== 'string') return null;
  const [root, ...rest] = id.split('>');
  const seg = root.split(':');
  if (seg.length !== 3) return null;
  const atoms = [seg[2], ...rest];
  if (!atoms.every((a) => !!atomCard(a))) return null;
  return { root, engine: seg[0], place: seg[1], atoms: atoms as AtomId[] };
}

/** הדור של מנוע: 1 = בנוי ישר על מנוע גדול. */
export function generationOf(id: string): number {
  return id.split('>').length;
}

/** המזהה של מנוע שבנוי על `parentId` עם החלק `atom`. */
export const childId = (parentId: string, atom: AtomId | string): string => parentId + '>' + atom;

/** המזהה של מקום-הפלט של מנוע. `span` = המקום השני של 🔗 (כל חלון מתחילתו ועד סופו). */
export const outPlaceId = (capId: string, span = false): string => 'out:' + capId + (span ? '#span' : '');

/** מה יוצא מהשרשרת שבמזהה (בלי נתונים) — null כשאי אפשר לבנות עליה. */
export function valueOf(id: string): ChainValue | null {
  const p = parseCapId(id);
  if (!p) return null;
  let v: ChainValue | undefined = rootValueOf(p.place, p.atoms[0]) ?? undefined;
  for (const a of p.atoms.slice(1)) v = v ? nextOf(p.place, v, a) : undefined;
  return v ?? null;
}

/** הסוג של הפלט, לפי החוזה (`outputKind` על כל חלק בשרשרת). */
export function outKindOf(id: string): Kind | null {
  const p = parseCapId(id);
  const place = p ? placeById(p.place) : null;
  if (!p || !place) return null;
  let k: Kind = place.kind;
  for (const a of p.atoms) k = outputKind(a, k);
  return k;
}

/** המקומות של מנוע שנוצר: הפלט שלו (ולמנוע של 🔗 בלילות — גם כל חלון מתחילתו ועד סופו). בדור האחרון / בלי תוצאות ⇒ []. */
export function outputPlaces(cap: Pick<Capability, 'id' | 'name'>): Place[] {
  const v = valueOf(cap.id);
  const k = outKindOf(cap.id);
  const p = parseCapId(cap.id);
  if (!v || !k || !p || generationOf(cap.id) >= MAX_GENERATIONS) return [];
  const engine = p.engine as Place['engine'];
  const fill = (t: string) => t.replace('{n}', cap.name);
  const results = OUT_RESULT[v];
  const seq: Partial<Record<AtomId, string>> = {};
  const span: Partial<Record<AtomId, string>> = {};
  for (const [a, r] of Object.entries(results) as [AtomId, string][]) {
    const card = atomCard(a);
    if (!card || !nextOf(p.place, v, a)) continue;
    if (card.worksOn.includes(k)) seq[a] = r;
    else if (v === 'windows' && card.worksOn.includes('span')) span[a] = r;
  }
  const out: Place[] = [];
  if (Object.keys(seq).length) out.push({ id: outPlaceId(cap.id), engine, name: fill(OUT_NAME[v]), kind: k, results: seq });
  if (Object.keys(span).length) out.push({ id: outPlaceId(cap.id, true), engine, name: fill(SPAN_NAME), kind: 'span', results: span });
  return out;
}

export type CapStatus = 'ok' | 'orphan' | 'bad';

/**
 * מצב של מנוע בתוך הרשימה: ok · orphan (המנוע שעליו הוא בנוי הוסר — או משהו בדרך אליו) · bad (לא מתאים בכלל).
 * בודק את כל השרשרת עד המנוע הראשון, עם שומר-מעגל ותקרת-דורות.
 */
export function capStatus(cap: Pick<Capability, 'id' | 'parent' | 'place' | 'atom'>, list: readonly Pick<Capability, 'id' | 'parent'>[]): CapStatus {
  if (!cap.parent) return 'ok';
  const byId = new Map(list.map((c) => [c.id, c]));
  const seen = new Set<string>([cap.id]);
  let cur: Pick<Capability, 'id' | 'parent'> = cap;
  for (let i = 0; cur.parent; i++) {
    if (i >= MAX_GENERATIONS || seen.has(cur.parent)) return 'bad';
    const up = byId.get(cur.parent);
    if (!up) return 'orphan';
    seen.add(up.id);
    cur = up;
  }
  return 'ok';
}

/**
 * בדיקת-שימוש למנוע שבנוי על מנוע (לפני יצירה): ההורה קיים ותקין, לא יותר מ-3 דורות, המקום הוא פלט של ההורה,
 * והחלק מתחבר אליו (סוג + תוצאה). תקין ⇒ null; אחרת — סיבה קצרה.
 */
export function childProblem(cap: Pick<Capability, 'id' | 'parent' | 'place' | 'atom'>, list: readonly Capability[]): string | null {
  if (!cap.parent) return null;
  const parent = list.find((c) => c.id === cap.parent);
  if (!parent) return 'parent';
  if (capStatus(parent, list) !== 'ok') return 'parent';
  if (generationOf(cap.id) > MAX_GENERATIONS || cap.id !== childId(parent.id, cap.atom)) return 'depth';
  const place = outputPlaces(parent).find((p) => p.id === cap.place);
  const a = atomCard(cap.atom);
  if (!place || !a || !place.results[a.id] || !a.worksOn.includes(place.kind)) return 'place';
  return null;
}

/** כרטיס-מנוע למנוע שנוצר — כדי שאותו מסלול (optionsFor) יעבוד עליו בלי שינוי. orphan/bad ⇒ null. */
export function capHostCard(cap: Capability, list: readonly Capability[]): EngineCard | null {
  if (capStatus(cap, list) !== 'ok') return null;
  const p = parseCapId(cap.id);
  const e = p ? engineCard(p.engine) : null;
  if (!p || !e) return null;
  const path = p.atoms.map((a) => atomCard(a)?.emoji ?? '🧩').join(' ← ');
  return {
    id: e.id,
    name: cap.name,
    emoji: '✨',
    from: e.name,
    computes: 'מנוע שיצרת: ' + e.emoji + ' ' + e.name + ' · ' + path,
    parts: [],
    places: outputPlaces(cap),
  };
}

/** היכולת של מנוע חדש שבנוי על `parent` (המזהה נגזר מההורה — לא מ-capabilityId). */
export function childCapability(parent: Pick<Capability, 'id' | 'engine'>, place: string, atom: AtomId, params: Capability['params'], name: string): Capability {
  return { id: childId(parent.id, atom), engine: parent.engine, place, atom, params, name, parent: parent.id };
}

/** המנועים שבנויים ישר על `id`. */
export function childrenOf(id: string, list: readonly Pick<Capability, 'id' | 'parent' | 'name'>[]): Pick<Capability, 'id' | 'parent' | 'name'>[] {
  return list.filter((c) => c.parent === id);
}

/** המזהה של המנוע הראשון בשרשרת (לבנייה מחדש של capabilityId). */
export const rootIdOf = (p: ParsedCapId): string => capabilityId(p.engine, p.place, p.atoms[0]);

/** המקום בפלט של `parent` שהחלק `atom` מתחבר אליו ("שמור כמנוע"). אין ⇒ undefined. */
export function outputPlaceFor(parent: Pick<Capability, 'id' | 'name'>, atom: AtomId): Place | undefined {
  const a = atomCard(atom);
  return a ? outputPlaces(parent).find((p) => !!p.results[a.id] && a.worksOn.includes(p.kind)) : undefined;
}
