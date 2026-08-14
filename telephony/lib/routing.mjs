// ─────────────────────────────────────────────────────────────────────────────
// telephony · routing — עומק-ניתוב: IVR · תור · אסטרטגיות · חסימה · חיוג-מהיר.
// טהור. מנרמל את מקטעי-הניתוב האופציונליים של הלקוח ומחזיר {routing, warnings}.
// כל מקטע גם מגודר-דגל בגנרטור ⇒ חסר/כבוי = ביט-זהה למנוע-הבסיס.
// ─────────────────────────────────────────────────────────────────────────────

import { toE164 } from './normalize.mjs';

const RING_STRATEGIES = ['simultaneous', 'sequential', 'enterprise'];
const DEST_TYPES = ['ext', 'ringgroup', 'number', 'voicemail', 'ivr', 'hangup'];

function cleanExt(v) {
  return typeof v === 'string' && /^[0-9]{2,6}$/.test(v) ? v : null;
}

/** מנרמל יעד-ניתוב {type,value}. מחזיר null אם לא-תקין. */
function normDest(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!DEST_TYPES.includes(raw.type)) return null;
  const d = { type: raw.type };
  if (raw.type === 'ext') {
    d.value = cleanExt(raw.value);
    if (!d.value) return null;
  } else if (raw.type === 'number') {
    d.value = toE164(raw.value);
    if (!d.value) return null;
  } else if (raw.type === 'ringgroup') {
    const list = Array.isArray(raw.value) ? raw.value.map(cleanExt).filter(Boolean) : [];
    if (!list.length) return null;
    d.value = list;
  } else if (raw.type === 'voicemail') {
    d.value = cleanExt(raw.value) || '100';
  } else if (raw.type === 'ivr') {
    // חיטוי: רק טוקן בטוח (מונע הזרקת-transfer/שבירת-בידוד רב-דיירים). כרגע רק ivr_menu.
    d.value = /^[a-z0-9_]{1,32}$/.test(raw.value) ? raw.value : 'ivr_menu';
  } // hangup: no value
  return d;
}

/**
 * מנרמל את כל מקטעי-הניתוב. שדות-קלט אפשריים תחת raw:
 *   ivr {greeting, options:[{digit,label,dest}], timeout, invalidMax}
 *   queue {music, maxWaitSec, announcePosition}
 *   ringStrategy 'simultaneous'|'sequential'|'enterprise'
 *   blocklist [e164]  · allowlist [e164]
 *   dnd bool
 *   speedDial [{code,e164,label}]
 *   overflow [ext]  (גלישה מדורגת אחרי המשרד)
 *   internal bool (חיוג-פנימי בין שלוחות)
 * @returns {{routing:object, warnings:string[]}}
 */
export function normalizeRouting(raw = {}) {
  const warnings = [];
  const routing = {};

  // IVR
  if (raw.ivr && typeof raw.ivr === 'object') {
    const opts = [];
    const seen = new Set();
    for (const o of Array.isArray(raw.ivr.options) ? raw.ivr.options : []) {
      const digit = String(o?.digit ?? '');
      if (!/^[0-9]$/.test(digit)) { warnings.push(`ivr: ספרה לא-תקינה "${digit}" — דילוג.`); continue; }
      if (seen.has(digit)) { warnings.push(`ivr: ספרה כפולה "${digit}" — דילוג.`); continue; }
      const dest = normDest(o?.dest);
      if (!dest) { warnings.push(`ivr: יעד לא-תקין לספרה ${digit} — דילוג.`); continue; }
      seen.add(digit);
      opts.push({ digit, label: String(o?.label || ''), dest });
    }
    if (opts.length) {
      routing.ivr = {
        greeting: typeof raw.ivr.greeting === 'string' ? raw.ivr.greeting : '',
        timeout: Math.max(1, Number.isInteger(raw.ivr.timeout) ? raw.ivr.timeout : 5),
        invalidMax: Math.max(1, Number.isInteger(raw.ivr.invalidMax) ? raw.ivr.invalidMax : 3),
        options: opts.sort((a, b) => a.digit.localeCompare(b.digit)),
      };
    } else {
      warnings.push('ivr: אין אף אפשרות תקינה — IVR מדולג.');
    }
  }

  // Queue
  if (raw.queue && typeof raw.queue === 'object') {
    routing.queue = {
      music: typeof raw.queue.music === 'string' && raw.queue.music ? raw.queue.music : '$${hold_music}',
      maxWaitSec: Math.max(1, Number.isInteger(raw.queue.maxWaitSec) ? raw.queue.maxWaitSec : 300),
      announcePosition: raw.queue.announcePosition !== false,
    };
  }

  // אסטרטגיית-צלצול
  if (raw.ringStrategy) {
    if (RING_STRATEGIES.includes(raw.ringStrategy)) routing.ringStrategy = raw.ringStrategy;
    else warnings.push(`ringStrategy לא-מוכר "${raw.ringStrategy}" — ברירת-מחדל simultaneous.`);
  }

  // חסימה/היתר
  const cleanList = (arr, tag) =>
    (Array.isArray(arr) ? arr : []).map((x) => { const e = toE164(x); if (!e) warnings.push(`${tag}: "${x}" לא-ניתן-לנרמול — דילוג.`); return e; }).filter(Boolean);
  const bl = cleanList(raw.blocklist, 'blocklist');
  const al = cleanList(raw.allowlist, 'allowlist');
  if (bl.length) routing.blocklist = [...new Set(bl)].sort();
  if (al.length) routing.allowlist = [...new Set(al)].sort();

  // נא-לא-להפריע
  if (raw.dnd === true) routing.dnd = true;

  // חיוג-מהיר
  const sd = [];
  const RESERVED = /^(\*20|\*98|700|[12]\d\d)$/; // *20=תור · *98=תא-קולי · 700=חניה · 1XX/2XX=פנימי
  const seenCodes = new Set();
  for (const s of Array.isArray(raw.speedDial) ? raw.speedDial : []) {
    const code = typeof s?.code === 'string' && /^[0-9*#]{1,4}$/.test(s.code) ? s.code : null;
    const e164 = toE164(s?.e164);
    if (!code || !e164) { warnings.push(`speedDial: רשומה לא-תקינה — דילוג.`); continue; }
    if (RESERVED.test(code) || /#/.test(code)) {
      warnings.push(`speedDial: קוד "${code}" מתנגש עם קוד-שמור (*20/*98/700/1XX/2XX/N#) — לא ינותב. בחר קוד אחר.`);
      continue;
    }
    if (seenCodes.has(code)) { warnings.push(`speedDial: קוד כפול "${code}" — דילוג.`); continue; }
    seenCodes.add(code);
    sd.push({ code, e164, label: String(s?.label || '') });
  }
  if (sd.length) routing.speedDial = sd.sort((a, b) => a.code.localeCompare(b.code));

  // מוקד-מצוקה (priority): מתקשרים-בסיכון עוקפים שעות/IVR → אחראי ישירות 24/7.
  // הרשימה מוזרעת ממאור (משפחות-בסיכון) או ידנית. ext = האחראי-התורן.
  if (raw.priority && typeof raw.priority === 'object') {
    const nums = cleanList(raw.priority.numbers, 'priority');
    const ext = cleanExt(raw.priority.ext);
    if (nums.length && ext) {
      routing.priority = {
        numbers: [...new Set(nums)].sort(),
        ext,
        ...(Number.isInteger(raw.priority.ringSeconds) && raw.priority.ringSeconds > 0 ? { ringSeconds: raw.priority.ringSeconds } : {}),
      };
    } else if (raw.priority.numbers || raw.priority.ext) {
      warnings.push('priority: דורש numbers (מספרים תקינים) + ext (אחראי) — מדולג.');
    }
  }

  // גלישה מדורגת
  const ov = (Array.isArray(raw.overflow) ? raw.overflow : []).map(cleanExt).filter(Boolean);
  if (ov.length) routing.overflow = ov;

  // חיוג-פנימי
  if (raw.internal === true) routing.internal = true;

  return { routing, warnings };
}

/** בונה ביטוי-regex מ-alternation של מספרים (לרשימת-חסימה/היתר). */
export function numbersAlternation(list) {
  return list.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
}
