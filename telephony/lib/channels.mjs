// ─────────────────────────────────────────────────────────────────────────────
// telephony · channels — המודל הרב-ערוצי, downstream לגמרי.
//
// קול מטופל בדיאלפלן (generate.mjs). כאן מוגדר איך הערוצים שאינם-קול מגיעים
// אלינו — בלי אף ספק, בלי Business API, בלי שער-SMS-מסחרי:
//   · ווצאפ = קישור-מכשיר (WhatsApp ריבוי-מכשירים). מקשרים את מכשיר-העמותה
//     כמכשיר-נלווה; ההודעות זורמות לתיבה-מאוחדת. לא Business API, לא מספר-חדש.
//   · SMS = דרך ה-SIM שכבר בשער-ה-GSM של הלקוח (שולח/מקבל SMS בערוץ שלו).
//
// כל הערוצים מתאחדים דרך אותו גשר-CTI (cti.mjs): הודעה ממספר-מוכר קופצת
// לאותו כרטיס Family/Supporter כמו שיחה. downstream: קריאה בלבד, אפס-ספק.
// ─────────────────────────────────────────────────────────────────────────────

import { toE164 } from './normalize.mjs';
import { buildDirectory, popPriorityFor } from './cti.mjs';

/**
 * בונה תוכנית-ערוצים לכל מספר שאינו-קול-בלבד. מחזיר את דרך-הטיפול downstream
 * וסימון-CTI. זהו הקלט של גשר-ההודעות (מודול-ריצה נפרד) ושל התיבה-המאוחדת.
 * @param {object} tenant  tenant מנורמל
 * @returns {{whatsapp:Array, sms:Array, unifiedInbox:object}}
 */
export function channelPlan(tenant) {
  const whatsapp = [];
  const sms = [];
  for (const n of tenant.numbers) {
    const ch = n.channels || [];
    if (ch.includes('whatsapp') || n.onramp === 'device-link') {
      whatsapp.push({
        id: n.id,
        e164: n.e164,
        label: n.label,
        method: 'device-link', // WhatsApp ריבוי-מכשירים — לא Business API
        provider: null, // אין ספק. downstream.
        setup: 'קשר את מכשיר-העמותה כמכשיר-נלווה (Linked Device) בתפריט ווצאפ.',
        cti: tenant.cti && tenant.cti.mode !== 'off',
      });
    }
    // SMS אמיתי רק דרך SIM-בשער. הפניית-לקוח (customer-forward) אינה מעבירה SMS.
    if (ch.includes('sms') && n.onramp === 'sim-in-gateway') {
      sms.push({
        id: n.id,
        e164: n.e164,
        label: n.label,
        method: 'sim-gateway',
        provider: null, // אין שער-SMS מסחרי. ה-SIM עצמו.
        ...(Number.isInteger(n.gatewayChannel) ? { gatewayChannel: n.gatewayChannel } : {}),
        cti: tenant.cti && tenant.cti.mode !== 'off',
      });
    }
  }
  return {
    whatsapp,
    sms,
    // כל הערוצים (קול+ווצאפ+SMS) מצליבים מול אותו directory של מאור.
    unifiedInbox: {
      cti: tenant.cti || { org: null, mode: 'off' },
      channels: [
        'voice',
        ...(whatsapp.length ? ['whatsapp'] : []),
        ...(sms.length ? ['sms'] : []),
      ],
    },
  };
}

/**
 * אינווריאנט-שמירה: מוודא שאין דליפת-ספק בתוכנית-הערוצים. כל provider חייב null.
 * @returns {boolean}
 */
// אסור: שם-שדה שמרמז על תלות-ספק. ערך לא-ריק בשדה כזה = דליפה.
const FORBIDDEN_KEY = /provider|trunk|apikey|api_key|sip_?host|sip_?uri|carrier|waba|business_?account|access_?token/i;
export function isPureDownstream(input) {
  // מצב א׳: תוכנית-ערוצים (whatsapp/sms) — provider חייב null, method לא-ספק.
  if (input && (Array.isArray(input.whatsapp) || Array.isArray(input.sms))) {
    const all = [...(input.whatsapp || []), ...(input.sms || [])];
    return all.every((x) => x.provider === null && x.method !== 'business-api' && x.method !== 'sms-provider');
  }
  // מצב ב׳: קונפיג/tenant גולמי — סריקה רקורסיבית לשדות-ספק אסורים (עם ערך).
  const scan = (obj, depth = 0) => {
    if (!obj || typeof obj !== 'object' || depth > 8) return true;
    for (const [k, v] of Object.entries(obj)) {
      if (FORBIDDEN_KEY.test(k) && v != null && v !== false && v !== '') return false;
      if (typeof v === 'object' && !scan(v, depth + 1)) return false;
    }
    return true;
  };
  return scan(input);
}

// ── 72. תבניות-הודעה עריכות (allowlist, כמו maor lib/templates) ───────────────
export const TEMPLATE_DEFS = {
  awayMessage: 'שלום, הגעתם ל%org%. אנו מחוץ לשעות הפעילות. נשוב אליכם בהקדם.',
  openReply: 'שלום, הגעתם ל%org%. נשמח לעזור — כתבו לנו וניצור קשר.',
  reminderGeneric: 'תזכורת מ%org%: %detail%',
  thanks: 'תודה רבה! %org%',
};
const TEMPLATE_KEYS = new Set(Object.keys(TEMPLATE_DEFS));
/** תבנית מותאמת מהקונפיג (config.templates[key]) אחרי trim, אחרת ברירת-המחדל. */
export function templateOf(config, key) {
  const v = config && config.templates && config.templates[key];
  if (typeof v === 'string' && v.trim()) return v.trim();
  return TEMPLATE_DEFS[key] ?? '';
}
/** מחטא מפת-תבניות (allowlist מפתחות + ערכי-מחרוזת). */
export function sanitizeTemplates(raw) {
  const out = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      if (TEMPLATE_KEYS.has(k) && typeof v === 'string') out[k] = v;
    }
  }
  return out;
}
/** מרנדר תבנית — מחליף %org%/%detail%/%name% וכו'. */
export function renderTemplate(text, vars = {}) {
  return String(text).replace(/%(\w+)%/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

// ── 71. מודל תיבה-מאוחדת ─────────────────────────────────────────────────────
/** מנרמל הודעה גולמית לרשומה-אחידה (קול/ווצאפ/SMS). */
export function normalizeMessage(raw) {
  return {
    id: String(raw.id ?? ''),
    channel: ['voice', 'whatsapp', 'sms'].includes(raw.channel) ? raw.channel : 'sms',
    direction: raw.direction === 'outbound' ? 'outbound' : 'inbound',
    from: toE164(raw.from) || raw.from || '',
    to: toE164(raw.to) || raw.to || '',
    text: typeof raw.text === 'string' ? raw.text : '',
    ts: raw.ts || '',
    ...(raw.contactRef ? { contactRef: raw.contactRef } : {}),
  };
}
/** תיבה-מאוחדת: כל ההודעות מנורמלות וממוינות (חדש→ישן). */
export function unifiedInboxOf(messages) {
  return (Array.isArray(messages) ? messages : [])
    .map(normalizeMessage)
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
}

// ── item 14 · ווצאפ ריבוי-מכשירים — טבלת-ניתוב (הגשר צורך; ה-bridge=runtime) ──
/**
 * טבלת-הניתוב שגשר-הווצאפ הדורמנטי צורך: לכל מספר-ווצאפ (device-link) — אילו
 * מכשירי-צוות מקבלים את ההודעה הנכנסת (fan-out) ובאיזו זהות עונים. **בלי Business
 * API, בלי עמלות** — קישור-מכשיר בלבד. זו שכבת-הלוגיקה הטהורה (נגזרת-קונפיג);
 * הגשר-החי שמקבל/שולח הודעות הוא runtime. downstream — מספר-הלקוח נשאר שלו.
 * @param {object} tenant tenant מנורמל
 * @returns {{lines:Array<{id,e164,label,agents:string[],replyAs:string}>, agents:string[], enabled:boolean}}
 */
export function whatsappRouting(tenant) {
  const office = (tenant.destinations && tenant.destinations.office && tenant.destinations.office.ext) || [];
  const manager = (tenant.destinations && tenant.destinations.manager && tenant.destinations.manager.ext) || '';
  const agents = [...new Set([...office, manager].filter(Boolean))]; // מכשירי-הצוות שמקבלים
  const waNums = (tenant.numbers || []).filter((n) => (n.channels || []).includes('whatsapp') || n.onramp === 'device-link');
  const lines = waNums.map((n) => ({
    id: n.id,
    e164: n.e164,
    label: n.label || '',
    agents, // fan-out לכל מכשירי-הצוות (ריבוי-מכשירים)
    replyAs: n.e164, // עונים מזהות מספר-הווצאפ של העמותה
  }));
  return { lines, agents, enabled: lines.length > 0 && agents.length > 0 };
}

// ── 73. מענה-אוטומטי לפי-שעה ──────────────────────────────────────────────────
/** ההודעה לשליחה-אוטומטית: מחוץ-לשעות=away, בתוך=open. null אם אין-צורך. */
export function autoReply(tenant, { nowIsOpen, sendOpenReply = false } = {}) {
  if (nowIsOpen) return sendOpenReply ? renderTemplate(templateOf(tenant, 'openReply'), { org: tenant.orgName }) : null;
  return renderTemplate(templateOf(tenant, 'awayMessage'), { org: tenant.orgName });
}

// ── 74. פנקס-הסכמה + STOP ────────────────────────────────────────────────────
/** מחיל פעולת-הסכמה. action: 'subscribe' | 'stop'. מחזיר ledger חדש. */
export function applyConsent(ledger, { number, action, ts = '' }) {
  const e164 = toE164(number) || number;
  const l = { ...(ledger || {}) };
  if (!e164) return l;
  l[e164] = { status: action === 'stop' ? 'stopped' : 'subscribed', ts };
  return l;
}
/** האם מותר לשלוח הודעה למספר (לא-סירב). */
export function canMessage(ledger, number) {
  const e164 = toE164(number) || number;
  return !(ledger && ledger[e164] && ledger[e164].status === 'stopped');
}

// ── 75. ניתוב-הודעה לנציג ────────────────────────────────────────────────────
/** בוחר נציג להודעה. strategy: 'roundrobin'|'first'. index נמסר (דטרמיניזם). */
export function assignMessage(agents, { index = 0, strategy = 'roundrobin' } = {}) {
  const list = Array.isArray(agents) ? agents.filter(Boolean) : [];
  if (!list.length) return null;
  if (strategy === 'first') return list[0];
  return list[index % list.length];
}

// ── 76. תזכורת-יוצאת (SMS דרך SIM, downstream) ───────────────────────────────
/** בונה רשומת-תזכורת-יוצאת. provider=null (SIM). template נבחר. */
export function reminderMessage(tenant, { number, detail = '', template = 'reminderGeneric', line = null, ts = '' }) {
  return {
    channel: 'sms',
    direction: 'outbound',
    method: 'sim-gateway',
    provider: null, // downstream — דרך ה-SIM
    to: toE164(number) || number || '',
    from: line,
    text: renderTemplate(templateOf(tenant, template), { org: tenant.orgName, detail }),
    ts,
  };
}

// ── 77. זהות-שולח פר-לקוח (בלי דליפה) ────────────────────────────────────────
/** זהות-השולח לערוץ. ווצאפ=שם-המכשיר · SMS=מספר-הלקוח (מה-SIM). לא חוצה-לקוחות. */
export function senderIdentity(tenant, channel) {
  if (channel === 'whatsapp') return { channel, name: tenant.orgName, method: 'device-link', provider: null };
  const sim = (tenant.numbers || []).find((n) => (n.channels || []).includes('sms') && n.onramp === 'sim-in-gateway');
  return { channel: 'sms', number: sim ? sim.e164 : null, method: 'sim-gateway', provider: null };
}

// ── 78. ציר-זמן-שיחה מאוחד פר-איש-קשר ────────────────────────────────────────
/** ממזג אירועים (קול callEvent + הודעות) לציר-זמן ממוין (חדש→ישן). */
export function conversationTimeline(events) {
  return (Array.isArray(events) ? events : [])
    .map((e) => ({ kind: e.type === 'call' ? 'call' : 'message', channel: e.channel || (e.type === 'call' ? 'voice' : 'sms'), ts: e.startedAt || e.ts || '', ...e }))
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
}

// ── 79. מדדי-שימוש פר-ערוץ (בלי חיוב-ספק) ────────────────────────────────────
/** ספירת-הודעות פר-ערוץ/כיוון. שקיפות-שימוש בלבד — אין חיוב-ספק. */
export function channelUsage(messages) {
  const u = { voice: { in: 0, out: 0 }, whatsapp: { in: 0, out: 0 }, sms: { in: 0, out: 0 }, total: 0 };
  for (const raw of Array.isArray(messages) ? messages : []) {
    const m = normalizeMessage(raw);
    if (!u[m.channel]) continue;
    u[m.channel][m.direction === 'outbound' ? 'out' : 'in']++;
    u.total++;
  }
  return u;
}

// ── 80. חיבור-מאור: הודעה↔משפחה/תורם ─────────────────────────────────────────
/**
 * מצרף contactRef להודעה לפי directory של מאור (הצד-השני של ה-from/to).
 * **נחיל-5 F10:** ה-primary נבחר בעדיפות-פר-ורטיקל (‏popPriorityFor) — זהה בדיוק ל-
 * screenPop של השיחה. בלי vertical (ברירת-מחדל) ⇒ POP_PRIORITY (ביט-זהה להתנהגות-הקודמת).
 * אחרת (למשל chesed) מספר-משותף family+supporter קופץ אותו כרטיס בהודעה כמו בשיחה.
 * @param {object} db @param {object} message @param {{vertical?:string}} [opt]
 */
export function matchMessageContact(db, message, opt = {}) {
  const m = normalizeMessage(message);
  const peer = m.direction === 'inbound' ? m.from : m.to;
  const e164 = toE164(peer);
  const prio = popPriorityFor(opt.vertical);
  const matches = [...((e164 && buildDirectory(db)[e164]) || [])]
    .sort((a, b) => (prio[a.kind] ?? 9) - (prio[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''));
  const primary = matches[0] || null;
  return { ...m, ...(primary ? { contactRef: { kind: primary.kind, id: primary.id, name: primary.name } } : {}) };
}
