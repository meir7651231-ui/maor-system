/**
 * 🧩 נתוני-דוגמה לארגז המנועים — **לבדיקות בלבד**. קוד-ייצור לעולם לא מייבא את
 * הקובץ הזה (ratchet ב-enginebox-guards.test). לא .test ⇒ לא נאסף כקובץ-בדיקות.
 */
import type { BoxFuture, BoxOption, BoxPart, BoxProduct, EngineBoxSource } from '../types';

export const P_DIR: BoxPart = { id: 'dir', name: 'מדריך עסקים', emoji: '📒', from: 'פרנסה׳לע', what: 'רשימת בעלי-מקצוע בקהילה' };
export const P_BOARD: BoxPart = { id: 'board', name: 'לוח קהילה', emoji: '📌', from: 'פרנסה׳לע', what: 'זמנים, מניינים והודעות' };
export const P_HOST: BoxPart = { id: 'host', name: 'אירוח', emoji: '🏡', from: 'אירוח משפחתי', what: 'יחידות פנויות ושיבוץ אורחים' };
export const P_LINE: BoxPart = { id: 'line', name: 'קו טלפוני', emoji: '☎️', from: 'פרנסה׳לע', what: 'אמרו או הקישו — והקו מחבר' };
export const P_LONE: BoxPart = { id: 'lone', name: 'מנוע בודד', emoji: '🧪', from: 'ניסוי', what: 'עוד לא מתחבר לכלום' };

export const PRODUCT: BoxProduct = { id: 'parnasa', name: 'פרנסה׳לע', emoji: '📒', parts: [P_DIR, P_BOARD] };

export interface FixtureLog { connect: string[]; disconnect: string[] }

export function fixtureSource(opts: { canEdit?: boolean; empty?: boolean } = {}): EngineBoxSource & { log: FixtureLog } {
  const linked = new Set<string>(['host>board']);
  const log: FixtureLog = { connect: [], disconnect: [] };
  const all: BoxOption[] = [
    { key: 'host>board', giver: P_HOST, needer: P_BOARD, plugLabel: 'יחידות פנויות', result: 'הלוח מראה איפה יש מקום לישון הלילה', side: 'into', linked: false },
    { key: 'dir>host', giver: P_DIR, needer: P_HOST, plugLabel: 'בעלי-מקצוע', result: 'המארח רואה חשמלאי זמין ליד היחידה', side: 'from', linked: false },
  ];
  const fut: BoxFuture[] = [
    { giver: P_HOST, needer: P_DIR, plugLabel: 'ביקורות', result: 'דירוג מארחים במדריך' },
  ];
  return {
    log,
    canEdit: opts.canEdit ?? true,
    products: () => (opts.empty ? [] : [PRODUCT]),
    parts: () => (opts.empty ? [] : [P_DIR, P_BOARD, P_HOST, P_LINE, P_LONE]),
    options: (start, picked) =>
      start === 'parnasa' && picked === 'host' ? all.map((o) => ({ ...o, linked: linked.has(o.key) })) : [],
    future: (start, picked) => (start === 'parnasa' && picked === 'host' ? fut : []),
    linkedCount: (start) => (start === 'parnasa' ? linked.size : 0),
    connect: (k) => { log.connect.push(k); linked.add(k); },
    disconnect: (k) => { log.disconnect.push(k); linked.delete(k); },
  };
}
