/**
 * 🧬 נתוני-המבחן של התצוגות החדשות (ATOMS-PREVIEWS, 14.10.2026) — לא קובץ-בדיקה.
 * הבסיס: הארגון של המרכזייה (צימרי הגליל + פרנסה׳לע, `switchboard/__tests__/fixture`), "עכשיו" = רביעי 14.10.2026 12:00 ישראל.
 * נוסף: לוי חוזר לשהייה צמודה (18–20/10) · תקלה דחופה בצימר הגפן · אינסטלטור שלישי (שעות אחה״צ) · בקשה שקטה עם טלפון בגוף
 * הטקסט · בקשה עם שגיאת כתיב · שלוש פרסומות. הסודות (שמות/טלפונים של מבקשים, הטקסט השקט) מיוצאים כדי שהבדיקות יחפשו אותם.
 */
import type { Db, PrAd, PrRequest } from '../../../types/domain';
import { B, F, fixtureDb, L, NOW_MS, PR_REQUESTS } from '../../switchboard/__tests__/fixture';
import type { AtomId } from '../contract';
import { previewOf, type PreviewCtx } from '../preview';

export { NOW_MS };

export const AD = (o: Partial<PrAd>): PrAd => ({
  id: 'a', slot: 'board', kind: 'line', target: '', advertiser: 'x', headline: '', body: '', phone: '', from: '', to: '',
  price: 0, paid: false, paidAt: '', active: true, createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...o,
});

const REQ = (o: Partial<PrRequest>): PrRequest => ({
  id: 'pq', text: '', category: '', area: '', urgent: false, quiet: false, job: false, requester: { name: '', phone: '' },
  status: 'open', responses: [], createdAt: '2026-10-14T07:00:00.000Z', updatedAt: '2026-10-14T07:00:00.000Z', ...o,
});

/** הטקסט של הבקשה השקטה — אסור שיופיע (גם לא חלקו) בשום תצוגה. */
export const QUIET_TEXT = 'יש לי חובות כבדים ואני צריך ייעוץ דחוף 050-9999999';
export const QUIET_WORDS = ['חובות', 'כבדים', '050-9999999', '9999999'];
/** פרטי המבקשים — אסור שיופיעו בשום תצוגה. */
export const REQUESTERS = ['יעקב לוי', '052-1111111', 'שמעון סודי', '053-9999999', 'רחל ברגר', '054-2222222', 'rachel@example.com'];
/** הטקסטים הגולמיים של הבקשות (לא שקטות) — גם הם לא מוצגים: 🔍 על הטקסט מראה מקצועות ומונים בלבד. */
export const RAW_TEXTS = [PR_REQUESTS[0].text, 'דולפת לי האסלה כל הלילה', 'מחפש אינסטלטר'];

export function richDb(over: Partial<Db> = {}): Db {
  const base = fixtureDb();
  return {
    ...base,
    hostBookings: [...base.hostBookings, B({ id: 'hb9', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-18', checkOut: '2026-10-20' })],
    hostRecords: [...base.hostRecords, F({ id: 'hf9', unitId: 'hu1', category: 'חשמל', priority: 1, blocked: true, status: 'open', desc: 'משפחת לוי דיווחו על קצר', createdAt: '2026-10-13T08:00:00.000Z' })],
    prListings: [...base.prListings, L({ id: 'pl103', dialCode: '103', name: 'אינסטלציה גולדשטיין', title: 'אינסטלטור', category: 'elec', hours: [{ dow: 3, from: '16:00', to: '20:00' }] })],
    prRequests: [
      ...base.prRequests,
      REQ({ id: 'pq2', text: QUIET_TEXT, category: 'fin', quiet: true, requester: { name: 'שמעון סודי', phone: '053-9999999' }, createdAt: '2026-10-14T06:00:00.000Z' }),
      REQ({ id: 'pq3', text: RAW_TEXTS[1], category: 'elec', requester: { name: 'רחל ברגר', phone: '054-2222222' } }),
      REQ({ id: 'pq4', text: RAW_TEXTS[2], category: 'elec', requester: { name: 'rachel@example.com', phone: '' }, createdAt: '2026-10-14T07:30:00.000Z' }),
    ],
    prAds: [
      AD({ id: 'a1', advertiser: 'מאפיית הלחם', price: 1200 }),
      AD({ id: 'a2', advertiser: 'ספרי אור', price: 1234.5 }),
      AD({ id: 'a3', advertiser: 'גני ילדים', slot: 'booklet', price: 500, paid: true }),
    ],
    ...over,
  };
}

export const ctxOf = (db: Partial<Db> | null = richDb(), nowMs = NOW_MS): PreviewCtx => ({ db, nowMs });
export const PV = (place: string, atom: AtomId | string, params: Record<string, number | string> = {}, c: PreviewCtx = ctxOf()) =>
  previewOf({ place, atom: atom as AtomId, params }, c);
