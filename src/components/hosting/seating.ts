/**
 * 🏡 אירוח משפחתי — מנוע "מפקדת ההושבה" (BUILD-ORDER-HOSTING-2026-10-12, אשכול 3) — פורט של `seatingModal` במקור.
 *
 * תוכנית-הושבה לארוחה: משתתפים (מהמשפחות הסועדות או ידני) + שולחנות (עגול/מלבני/מרובע, כיסאות, 👑 ראש, הערה).
 * פעולות: ✨ מילוי אוטומטי (סבב) · 👪 לפי משפחות (משפחה ליד משפחה — לשולחן שמכיל את כולה אם יש) · ⚖️ איזון ·
 * 🔀 ערבוב (אקראיות מוזרקת ⇒ דטרמיניסטי בבדיקות) · 🧹 נקה · הושבה/הורדה ידנית · גאומטריית-הכיסאות.
 * המקור שינה את האובייקט במקום — כאן כל פעולה מחזירה תוכנית **חדשה** (טהור; ה-store שומר).
 */
import type { HostMeal, HostSeatPerson, HostSeatPlan, HostSeatTable, HostTableShape } from '../../types/domain';
import { dinersToPeople } from './kitchen';
import { nextLocalId } from './transitions';

export const SEAT_SHAPES: readonly (readonly [HostTableShape, string])[] = [
  ['round', 'עגול ⭕'],
  ['rect', 'מלבני ▭'],
  ['square', 'מרובע ◻'],
];
export const SEAT_CHAIRS: Readonly<Record<string, string>> = { 'כיסא': '🪑', 'כורסא': '🛋️', 'ספסל': '🟫', 'כיסא-בר': '🥂', 'כיסא-תינוק': '👶' };
/** צבעי-המשפחות (`SEAT_FAM_COLORS`). */
export const SEAT_FAM_COLORS = ['#2dd4bf', '#9d6bff', '#f2b84e', '#3a9bff', '#ff6f9f', '#31e39a', '#ff8f4d', '#5ad1ff', '#c084fc', '#ffd24d', '#7dd35b', '#ff6f6f'] as const;

/** עותק עמוק-מספיק לעבודה (מערכי-המושבים של השולחנות). */
function cloneTables(sp: HostSeatPlan): HostSeatTable[] {
  return sp.tables.map((t) => ({ ...t, seated: t.seated.slice() }));
}
function seatedSet(tables: readonly HostSeatTable[]): Set<string> {
  const s = new Set<string>();
  for (const t of tables) for (const id of t.seated) s.add(id);
  return s;
}
const free = (t: HostSeatTable) => Math.max(0, (t.cap || 0) - t.seated.length);

/** הממתינים (לא יושבים) — `seatPool`. */
export function seatPool(sp: HostSeatPlan): HostSeatPerson[] {
  const s = seatedSet(sp.tables);
  return sp.people.filter((p) => !s.has(p.id));
}

/** צבע לכל משפחה (לפי סדר-ההופעה) — `seatFamMap`. */
export function seatFamColors(sp: HostSeatPlan): Record<string, string> {
  const m: Record<string, string> = {};
  let i = 0;
  for (const p of sp.people) {
    const g = p.guestId || '';
    if (g && !(g in m)) m[g] = SEAT_FAM_COLORS[i++ % SEAT_FAM_COLORS.length];
  }
  return m;
}

/** צבע-המשתתף: צבע-המשפחה, אחרת ילד=info / מבוגר=brand (טוקני-הסקין). */
export function seatColorOf(p: HostSeatPerson, fm: Record<string, string>): string {
  return (p.guestId && fm[p.guestId]) || (p.kind === 'kid' ? 'var(--h-info)' : 'var(--h-brand)');
}

export interface SeatFamily {
  gid: string;
  name: string;
  color: string;
  total: number;
  waiting: number;
}

/** המשפחות בתוכנית (ידני = "__solo") — `seatFamilies`. */
export function seatFamilies(sp: HostSeatPlan, fm: Record<string, string>, guestName: (id: string) => string): SeatFamily[] {
  const order: string[] = [];
  for (const p of sp.people) {
    const g = p.guestId || '__solo';
    if (!order.includes(g)) order.push(g);
  }
  const s = seatedSet(sp.tables);
  return order.map((g) => {
    const ppl = sp.people.filter((p) => (p.guestId || '__solo') === g);
    return {
      gid: g,
      name: g === '__solo' ? 'ידני' : guestName(g) || 'משפחה',
      color: g === '__solo' ? 'var(--h-faint)' : fm[g] || 'var(--h-brand)',
      total: ppl.length,
      waiting: ppl.filter((p) => !s.has(p.id)).length,
    };
  });
}

/** הושבת משפחה אחת יחד (`seatOneFamily`): לשולחן שמכיל את כולה (הצפוף-ביותר שמתאים), אחרת לפי מקום-פנוי. */
export function seatOneFamily(sp: HostSeatPlan, gid: string): { plan: HostSeatPlan; placed: number } {
  const tables = cloneTables(sp);
  const s = seatedSet(tables);
  const waiting = sp.people.filter((p) => (p.guestId || '__solo') === gid && !s.has(p.id));
  if (!waiting.length) return { plan: sp, placed: 0 };
  const whole = tables.filter((t) => free(t) >= waiting.length).sort((a, b) => free(a) - free(b))[0];
  const order = (whole ? [whole] : tables.slice().sort((a, b) => free(b) - free(a))).concat(tables);
  let placed = 0;
  for (const p of waiting) {
    for (const t of order) {
      if (free(t) > 0) {
        t.seated.push(p.id);
        placed++;
        break;
      }
    }
  }
  return { plan: { ...sp, tables }, placed };
}

/** ✨ מילוי אוטומטי — סבב על השולחנות (`seatAuto`). */
export function seatAutoFill(sp: HostSeatPlan): HostSeatPlan {
  const tables = cloneTables(sp);
  if (!tables.length) return sp;
  const s = seatedSet(tables);
  let ti = 0;
  for (const p of sp.people) {
    if (s.has(p.id)) continue;
    for (let tries = 0; tries < tables.length; tries++) {
      const t = tables[ti % tables.length];
      ti++;
      if (t.seated.length < t.cap) {
        t.seated.push(p.id);
        break;
      }
    }
  }
  return { ...sp, tables };
}

/** 👪 לפי משפחות — כל משפחה ממתינה בתורה (`seatByFam`). */
export function seatByFamilies(sp: HostSeatPlan): { plan: HostSeatPlan; placed: number } {
  let plan = sp;
  let placed = 0;
  for (const f of seatFamilies(sp, seatFamColors(sp), () => '')) {
    const r = seatOneFamily(plan, f.gid);
    plan = r.plan;
    placed += r.placed;
  }
  return { plan, placed };
}

/** ⚖️ איזון — כל ממתין לשולחן הריק-ביותר שאינו מלא (`seatBalance`). */
export function seatBalance(sp: HostSeatPlan): HostSeatPlan {
  const tables = cloneTables(sp);
  for (const p of seatPool(sp)) {
    const t = tables.filter((x) => x.seated.length < x.cap).sort((a, b) => a.seated.length - b.seated.length)[0];
    if (t) t.seated.push(p.id);
  }
  return { ...sp, tables };
}

/** 🔀 ערבוב — ניקוי + ערבוב פישר-ייטס (אקראיות מוזרקת) + מילוי-בסבב (`seatShuffle`). */
export function seatShuffle(sp: HostSeatPlan, rand: () => number): HostSeatPlan {
  const tables = sp.tables.map((t) => ({ ...t, seated: [] as string[] }));
  if (!tables.length) return sp;
  const arr = sp.people.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  let ti = 0;
  for (const p of arr) {
    for (let tries = 0; tries < tables.length; tries++) {
      const t = tables[ti % tables.length];
      ti++;
      if (t.seated.length < t.cap) {
        t.seated.push(p.id);
        break;
      }
    }
  }
  return { ...sp, tables };
}

/** 🧹 נקה — כל השולחנות ריקים, המשתתפים נשארים. */
export function seatClear(sp: HostSeatPlan): HostSeatPlan {
  return { ...sp, tables: sp.tables.map((t) => ({ ...t, seated: [] })) };
}

/** 🔄 סנכרן מהסועדים — משתתפים מהמשפחות, השולחנות מתרוקנים (`seatFromDiners`). */
export function seatFromDiners(m: Pick<HostMeal, 'diners'>, sp: HostSeatPlan, guestName: (id: string) => string): HostSeatPlan {
  return { people: dinersToPeople(m, guestName), tables: sp.tables.map((t) => ({ ...t, seated: [] })) };
}

/* ═══════════════ משתתפים ═══════════════ */

export function seatAddPerson(sp: HostSeatPlan, name: string): HostSeatPlan {
  return { ...sp, people: [...sp.people, { id: nextLocalId('sp', sp.people), name }] };
}
/** 👥 מלא N מקומות — "אורח k" עד מס׳ הסועדים. */
export function seatFillTo(sp: HostSeatPlan, n: number): HostSeatPlan {
  let plan = sp;
  while (plan.people.length < n) plan = seatAddPerson(plan, 'אורח ' + (plan.people.length + 1));
  return plan;
}
export function seatRemovePerson(sp: HostSeatPlan, id: string): HostSeatPlan {
  return { people: sp.people.filter((p) => p.id !== id), tables: sp.tables.map((t) => ({ ...t, seated: t.seated.filter((s) => s !== id) })) };
}
export function seatUnseat(sp: HostSeatPlan, id: string): HostSeatPlan {
  return { ...sp, tables: sp.tables.map((t) => ({ ...t, seated: t.seated.filter((s) => s !== id) })) };
}
/** הושבה ידנית בשולחן (מוריד מכל שולחן אחר) — שולחן מלא ⇒ error. */
export function seatPlace(sp: HostSeatPlan, personId: string, tableId: string): { plan: HostSeatPlan; error?: 'full' | 'none' } {
  const tb = sp.tables.find((t) => t.id === tableId);
  if (!tb) return { plan: sp, error: 'none' };
  if (tb.seated.includes(personId)) return { plan: sp };
  if (tb.seated.length >= tb.cap) return { plan: sp, error: 'full' };
  return { plan: { ...sp, tables: sp.tables.map((t) => (t.id === tableId ? { ...t, seated: [...t.seated, personId] } : { ...t, seated: t.seated.filter((s) => s !== personId) })) } };
}

/* ═══════════════ שולחנות ═══════════════ */

export function seatAddTable(sp: HostSeatPlan, t: { name?: string; cap: number; shape?: HostTableShape; chair?: string; head?: boolean }): HostSeatPlan {
  const table: HostSeatTable = {
    id: nextLocalId('st', sp.tables),
    name: (t.name ?? '').trim() || 'שולחן ' + (sp.tables.length + 1),
    cap: Math.max(1, Math.floor(t.cap) || 8),
    shape: t.shape ?? 'round',
    chair: t.chair || 'כיסא',
    seated: [],
    head: !!t.head,
    note: '',
  };
  return { ...sp, tables: [...sp.tables, table] };
}
export function seatDupTable(sp: HostSeatPlan, id: string): HostSeatPlan {
  const t = sp.tables.find((x) => x.id === id);
  if (!t) return sp;
  return { ...sp, tables: [...sp.tables, { ...t, id: nextLocalId('st', sp.tables), name: t.name + ' (2)', seated: [], head: false }] };
}
export function seatDeleteTable(sp: HostSeatPlan, id: string): HostSeatPlan {
  return { ...sp, tables: sp.tables.filter((t) => t.id !== id) };
}
function patchTable(sp: HostSeatPlan, id: string, f: (t: HostSeatTable) => HostSeatTable): HostSeatPlan {
  return { ...sp, tables: sp.tables.map((t) => (t.id === id ? f(t) : t)) };
}
export function seatToggleHead(sp: HostSeatPlan, id: string): HostSeatPlan {
  return patchTable(sp, id, (t) => ({ ...t, head: !t.head }));
}
export function seatRename(sp: HostSeatPlan, id: string, name: string): HostSeatPlan {
  return name.trim() ? patchTable(sp, id, (t) => ({ ...t, name: name.trim() })) : sp;
}
/** מס׳ כיסאות (≥1); מי שמעבר לכיסאות החדשים — חוזר לממתינים. */
export function seatSetCap(sp: HostSeatPlan, id: string, raw: string | number): HostSeatPlan {
  return patchTable(sp, id, (t) => {
    const n = Math.max(1, parseInt(String(raw), 10) || t.cap);
    return { ...t, cap: n, seated: t.seated.slice(0, n) };
  });
}
export function seatSetNote(sp: HostSeatPlan, id: string, note: string): HostSeatPlan {
  return patchTable(sp, id, (t) => ({ ...t, note }));
}

/* ═══════════════ מדדים, טקסט וגאומטריה ═══════════════ */

/** מקומות · הושבו · ממתינים · ניצולת% · חוסר-מקומות. */
export function seatStats(sp: HostSeatPlan): { totSeats: number; seatedN: number; waiting: number; util: number; short: number } {
  const totSeats = sp.tables.reduce((s, t) => s + Math.max(0, t.cap || 0), 0);
  const waiting = seatPool(sp).length;
  const seatedN = sp.people.length - waiting;
  return { totSeats, seatedN, waiting, util: totSeats ? Math.round((seatedN / totSeats) * 100) : 0, short: Math.max(0, sp.people.length - totSeats) };
}

/** "⧉ העתק" / "💬 וואטסאפ" — נוסח-המקור (`seatText`). */
export function seatText(sp: HostSeatPlan, title: string): string {
  const parts = ['🪑 תוכנית הושבה · ' + (title || 'ארוחה')];
  const nameOf = (id: string) => sp.people.find((p) => p.id === id)?.name ?? '';
  for (const t of sp.tables) {
    parts.push('');
    parts.push('▪ ' + t.name + ' (' + t.seated.length + '/' + t.cap + ')' + (t.head ? ' 👑' : ''));
    t.seated.forEach((id, i) => parts.push(i + 1 + '. ' + nameOf(id)));
  }
  const pool = seatPool(sp);
  if (pool.length) {
    parts.push('');
    parts.push('⏳ ממתינים: ' + pool.map((p) => p.name).join(', '));
  }
  return parts.join('\n');
}

/** מיקומי-הכיסאות סביב השולחן (`seatPos`). */
export function seatPositions(shape: HostTableShape, cap: number, W: number, H: number): { x: number; y: number }[] {
  const pad = 20;
  const pts: { x: number; y: number }[] = [];
  if (shape === 'rect') {
    const top = Math.ceil(cap / 2);
    const bot = cap - top;
    for (let i = 0; i < top; i++) pts.push({ x: pad + (W - 2 * pad) * (top <= 1 ? 0.5 : i / (top - 1)), y: pad });
    for (let i = 0; i < bot; i++) pts.push({ x: pad + (W - 2 * pad) * (bot <= 1 ? 0.5 : i / (bot - 1)), y: H - pad });
  } else if (shape === 'square') {
    const c = [0, 0, 0, 0];
    for (let i = 0; i < cap; i++) c[i % 4]++;
    const line = (n: number, horiz: boolean, fix: number) => {
      for (let i = 0; i < n; i++) {
        const tt = n <= 1 ? 0.5 : i / (n - 1);
        pts.push(horiz ? { x: pad + (W - 2 * pad) * tt, y: fix } : { x: fix, y: pad + (H - 2 * pad) * tt });
      }
    };
    line(c[0], true, pad);
    line(c[1], true, H - pad);
    line(c[2], false, pad);
    line(c[3], false, W - pad);
  } else {
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) / 2 - pad;
    for (let i = 0; i < cap; i++) {
      const a = ((-90 + (i * 360) / cap) * Math.PI) / 180;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  }
  return pts;
}

/** מידות-השולחן ומשטחו + מיקומי-הכיסאות (`seatRingHtml`). */
export function seatRing(t: Pick<HostSeatTable, 'cap' | 'shape'>): {
  W: number;
  H: number;
  surf: { left: number; top: number; width: number; height: number; round: boolean };
  pts: { x: number; y: number }[];
} {
  const cap = Math.max(1, t.cap || 8);
  const shape = t.shape || 'round';
  let W: number;
  let H: number;
  let surf: { left: number; top: number; width: number; height: number; round: boolean };
  if (shape === 'rect') {
    const per = Math.ceil(cap / 2);
    W = Math.min(520, 120 + per * 42);
    H = 150;
    surf = { left: 30, top: 44, width: W - 60, height: 62, round: false };
  } else if (shape === 'square') {
    const side = Math.min(300, 150 + Math.ceil(cap / 4) * 32);
    W = H = side;
    const inner = Math.max(54, side - 100);
    surf = { left: (W - inner) / 2, top: (H - inner) / 2, width: inner, height: inner, round: false };
  } else {
    const r = Math.min(118, 40 + cap * 4);
    W = H = 2 * r + 36;
    const inner = Math.max(40, 2 * (r - 30));
    surf = { left: (W - inner) / 2, top: (H - inner) / 2, width: inner, height: inner, round: true };
  }
  return { W, H, surf, pts: seatPositions(shape, cap, W, H) };
}
