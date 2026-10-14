/**
 * 🏭 המפעל · ארגון "מטולטל" מעל כל DB (ATOMS-FACTORY, 14.10.2026) — לחיבורים של המנועים שנמצאו אוטומטית.
 *
 * המחולל של המאמת (`randomOrgDb`) בונה ארגון-אירוח/פרנסה׳לע. המנועים שהמפרק מצא קוראים **כל** אוסף ב-Db (תורמים, חוגים,
 * משפחות, קופות, חנות, לוח, חלוקה…), ולכן כאן מחולל כללי שעובר על כל אוסף בבסיס (הדמו הציבורי) ומטלטל אותו לפי הצורה:
 *  · רשומות נשמטות, משוכפלות (מזהה חדש) ומתערבבות; רשימות מוטמעות (`donations[]`, `members[]`, `payments[]`) — אותו דבר;
 *  · תאריך ⇒ זז ±400 יום, או סוף-חודש/29.2/מעבר-שעון, ולפעמים ריק או פגום ("2026-13-40");
 *  · שעה ⇒ כל דקה ביממה, ולפעמים פגומה ("25:00" / "xx");
 *  · מספר ⇒ 0, אגורות, שלילי, עד ₪999,999.99;
 *  · **שמות של אנשים** (משפחות, בני-משפחה, תורמים, מורים, מתנדבים, רכזים, אורחים, מבקשים) ⇒ שם-משפחה ייחודי; טלפון/מייל/ת״ז ⇒
 *    חדשים; בריאות/הערות/תיאור ⇒ משפט עם השם והטלפון — **כל אחד נרשם כסוד** (`secrets`), כדי שהמאמת יחפש אותו בכל שורה.
 * דטרמיניסטי (זרע). לא נכנס לבנדל — רק המפעל והבדיקות.
 */
import type { Db } from '../../../types/domain';
import { HARD_ISO, rng, type OrgSecrets, type Rng } from './gen';

const DAY_MS = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ISO_AT = /^\d{4}-\d{2}-\d{2}T/;
const CLOCK = /^\d{1,2}:\d{2}$/;

/** שמות-משפחה ייחודיים (לא מילים רגילות) — נבדקים כמילה שלמה בכל שורה. */
export const PERTURB_SURNAMES = ['שפרינצלר', 'גוטפרוינד', 'הורוביצקי', 'פרנקנטל', 'ליכטנשטט', 'רבינוביצר', 'אוירבכר', 'טויבנהויז', 'קלוגמן', 'זוננפלד'];
const FIRST = ['שפרה', 'מנחם', 'רייזל', 'שמעיה', 'פייגא', 'אלחנן', 'טובה', 'זכריה'];

/** שדות של שם-אדם, לפי האוסף (רק שם — ברשומה של אדם). */
const PERSON_NAME = /^(name|first|father|mother|last|surname|fullName|contact|advertiser)$/;
/** אוספים שהרשומות בהם הן אנשים (או משפחות). */
const PERSON_ENTITIES = new Set(['families', 'supporters', 'teachers', 'volunteers', 'tzCoordinators', 'deliveries', 'prRequests', 'shopAssignments', 'distributionDays']);
/** תתי-רשימות של אנשים בתוך רשומה. */
const PERSON_LISTS = new Set(['members', 'kids', 'children', 'contacts', 'guests']);
const PHONE_F = /^(phone\d?|phones|whatsapp|mobile|tel)$/;
const EMAIL_F = /^(email|mail)$/;
const ID_F = /^(idNum|fatherId|motherId|tz|teudat)$/;
const PRIVATE_TEXT = /^(health|notes?|desc|description|body|text|reason|nextNote|answeredNote|forWho|designation|address|story)$/;

const pad = (n: number, w = 2): string => String(n).padStart(w, '0');
const isoOf = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

function phoneOf(r: Rng): string {
  return '05' + r.int(0, 8) + '-' + pad(r.int(0, 9999999), 7);
}

function idOf(r: Rng): string {
  return String(r.int(100000000, 999999999));
}

function shiftIso(r: Rng, iso: string): string {
  const roll = r.next();
  if (roll < 0.05) return '';
  if (roll < 0.08) return '2026-13-40';
  if (roll < 0.25) return r.pick(HARD_ISO);
  const t = Date.parse(iso + 'T12:00:00Z');
  return Number.isFinite(t) ? isoOf(t + r.int(-400, 400) * DAY_MS) : iso;
}

function shiftAt(r: Rng, s: string): string {
  const t = Date.parse(s);
  if (!Number.isFinite(t) || r.bool(0.05)) return s;
  return new Date(t + r.int(-400 * 24, 400 * 24) * 3_600_000 + r.int(0, 59) * 60_000).toISOString();
}

function clock(r: Rng): string {
  if (r.bool(0.05)) return r.pick(['25:00', 'xx', '']);
  return pad(r.int(0, 23)) + ':' + pad(r.pick([0, 0, 15, 30, 45, r.int(0, 59)]));
}

function amountLike(r: Rng, v: number): number {
  const roll = r.next();
  if (roll < 0.08) return 0;
  if (roll < 0.14) return -Math.round(r.next() * 50000) / 100;
  if (roll < 0.3) return Math.round(r.next() * 99999999) / 100;
  if (roll < 0.5) return Math.round(v * (0.5 + r.next()) * 100) / 100;
  if (Number.isInteger(v) && Math.abs(v) < 1000 && r.bool(0.5)) return r.int(0, Math.max(1, Math.abs(v) * 2));
  return v;
}

interface Ctx {
  r: Rng;
  secrets: OrgSecrets;
  n: number;
}

/** שם ייחודי לאדם ⇒ נרשם (השם המלא + שם-המשפחה כמילה). */
function personName(c: Ctx, field: string): string {
  const sur = PERTURB_SURNAMES[c.n++ % PERTURB_SURNAMES.length];
  const v = field === 'first' ? c.r.pick(FIRST) + ' ' + sur : c.r.bool(0.5) ? 'משפחת ' + sur : c.r.pick(FIRST) + ' ' + sur;
  c.secrets.names.push(v, sur);
  return v;
}

function mutateValue(c: Ctx, key: string, v: unknown, person: boolean, depth: number): unknown {
  const { r } = c;
  if (typeof v === 'string') {
    if (PHONE_F.test(key)) {
      const p = phoneOf(r);
      c.secrets.phones.push(p);
      return p;
    }
    if (EMAIL_F.test(key)) {
      const e = 'p' + c.n++ + '_' + r.int(0, 999) + '@example.net';
      c.secrets.emails.push(e);
      return e;
    }
    if (ID_F.test(key)) return idOf(r);
    if (person && PERSON_NAME.test(key)) return personName(c, key);
    if (PRIVATE_TEXT.test(key) && (person || r.bool(0.5))) {
      const sur = PERTURB_SURNAMES[c.n++ % PERTURB_SURNAMES.length];
      const p = phoneOf(r);
      const t = 'סוד אישי של ' + sur + ' טלפון ' + p;
      c.secrets.names.push(sur);
      c.secrets.phones.push(p);
      c.secrets.texts.push(t);
      return t;
    }
    if (ISO.test(v)) return r.bool(0.6) ? shiftIso(r, v) : v;
    if (ISO_AT.test(v)) return r.bool(0.6) ? shiftAt(r, v) : v;
    if (CLOCK.test(v)) return r.bool(0.6) ? clock(r) : v;
    return v;
  }
  if (typeof v === 'number') return Number.isFinite(v) && r.bool(0.6) ? amountLike(r, v) : v;
  if (Array.isArray(v)) return mutateList(c, key, v, person || PERSON_LISTS.has(key), depth + 1);
  if (v && typeof v === 'object' && depth < 4) return mutateRecord(c, v as Record<string, unknown>, person, depth + 1);
  return v;
}

function mutateRecord(c: Ctx, o: Record<string, unknown>, person: boolean, depth: number): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o)) out[k] = mutateValue(c, k, o[k], person, depth);
  return out;
}

function mutateList(c: Ctx, key: string, list: unknown[], person: boolean, depth: number): unknown[] {
  const { r } = c;
  if (depth > 4) return list;
  const items = list.slice(0, 400);
  // רשימת ערכים פשוטים (תאריכים, מילים) — רק הערכים
  if (!items.some((x) => x && typeof x === 'object')) return items.filter(() => r.bool(0.9)).map((x) => mutateValue(c, key, x, person, depth));
  const out: unknown[] = [];
  for (const x of items) {
    if (r.bool(0.12)) continue; // נשמט
    out.push(x && typeof x === 'object' && !Array.isArray(x) ? mutateRecord(c, x as Record<string, unknown>, person, depth) : x);
    if (r.bool(0.1) && x && typeof x === 'object' && !Array.isArray(x)) {
      const dup = mutateRecord(c, x as Record<string, unknown>, person, depth);
      if (typeof dup.id === 'string') dup.id = dup.id + '_d' + c.n++;
      out.push(dup);
    }
  }
  // ערבוב קל (שומר על סדר-יציב לזרע)
  for (let i = out.length - 1; i > 0; i--) if (r.bool(0.3)) {
    const j = r.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** "עכשיו" של עולם מטולטל: רגע-הבסיס ±60 יום, לפעמים סביב מעבר-שעון / סוף-שנה. */
function nowNear(r: Rng, baseMs: number): number {
  if (r.bool(0.25)) return Date.parse(r.pick(HARD_ISO) + 'T00:00:00Z') + r.int(0, 47) * 1_800_000;
  return baseMs + r.int(-60 * 24, 60 * 24) * 3_600_000 + r.int(0, 59) * 60_000;
}

/**
 * ארגון מטולטל מעל `base`: כל אוסף-מערך עובר `mutateList` (אוספי-אנשים — עם שמות/טלפונים/ת״ז/טקסט סודיים), `ui` נשאר.
 * `secrets` = כל מה שנכנס ואסור שיופיע. דטרמיניסטי.
 */
export function perturbDb(base: Partial<Db>, baseNowMs: number, seed: number): { db: Db; nowMs: number; secrets: OrgSecrets } {
  const r = rng(seed);
  const secrets: OrgSecrets = { names: [], phones: [], emails: [], texts: [] };
  const c: Ctx = { r, secrets, n: seed % 7 };
  const out: Record<string, unknown> = {};
  const src = (base ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(src).sort()) {
    const v = src[k];
    if (k === 'hostRecords' && Array.isArray(v)) {
      // רק רשומת-אורח היא אדם פרטי; צוות ועסקים — ציבוריים
      out[k] = v.map((x) => (x && typeof x === 'object' ? mutateRecord(c, x as Record<string, unknown>, (x as { kind?: string }).kind === 'guest', 0) : x));
      continue;
    }
    out[k] = Array.isArray(v) && k !== 'audit' && k !== 'delLog' ? mutateList(c, k, v, PERSON_ENTITIES.has(k), 0) : v;
  }
  return { db: out as unknown as Db, nowMs: nowNear(r, baseNowMs), secrets };
}
