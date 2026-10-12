/**
 * ⏱ כלי-מדידה — ביצועי טאב התורמים (SupportersView) בקנה-מידה, עם האטת-CPU ופרופיל-CPU.
 *
 * ⚠️ זהו כלי-מדידה, לא שער: לא רץ ב-verify / CI, לא מכשיל כלום — מדפיס מספרים ומייצר JSON+פרופיל
 * ב-OUT להשוואה לפני/אחרי. נכתב 12.10.2026 סביב הלקוח האמיתי (16,000 תורמים · 34MB JSON · ×4 האטה:
 * הקשה 1.1–1.4s · מיון 1.0s · פתיחת-טאב 2.1s · עריכה⇒שמירה 5.4s · טעינה 3.3s · localStorage זורק
 * QuotaExceeded בכל שמירה).
 *
 * שימוש (משורש הריפו; דורש build עם sourcemaps):
 *   npx vite build --sourcemap --outDir <DIST> && cp -r public/c <DIST>/
 *   SCALE=16000 DON=5 HIST=8 PHOTOS=0 THROTTLE=4 PORT=8701 DIST=<DIST> OUT=<outdir> node e2e/perf-supporters.mjs
 *
 * משתני-סביבה:
 *   SCALE    מספר תורמים (ברירת-מחדל 500)
 *   DON      תרומות לתורם (ממוצע; ±30% ריצוד) (15)
 *   HIST     שורות hist לתורם (20)
 *   PHOTOS   0/1 — תמונת data:URI ‎~60KB ל-20% מהתורמים (0)
 *   THROTTLE קצב האטת-CPU דרך CDP Emulation.setCPUThrottlingRate (4; ‏1 = בלי)
 *   PORT     פורט לשרת הסטטי המובנה (8311)
 *   DIST     תיקיית הבנייה להגשה (<repo>/dist-perf)
 *   OUT      תיקיית פלט ל-JSON גולמי + פרופילים (<repo>/e2e/.tmp-perf)
 *   CHROME   קובץ-ההרצה של chromium (/opt/pw-browsers/chromium-1194/chrome-linux/chrome)
 *   ORG      slug ל-‎?org=‎ (demo) — מפתח ה-localStorage הופך ל-`maor_db:<slug>`
 *   SEED     זרע PRNG (42)
 *   AUTOEXP  1 = לתת לגיבוי-סוף-היום (exportBackupFile) לרוץ באמצע המדידה (0: מסומן-כבוצע מראש)
 *   LSNOTICE 1 = לתת להודעה החד-פעמית "הנתונים גדולים — IDB בלבד" לקפוץ (0: מסומנת-כנצפתה מראש)
 *   REAGG    1 = בלי דפדפן; צבירה-מחדש של profile-*.cpuprofile.json ב-OUT לתוך run-*.json
 *
 * מה הוא עושה:
 *   1. מחולל Db סינתטי (צורת emptyDb(), ‏DB_VERSION 6) ב-Node: SCALE תורמים עם שמות עבריים, טלפונים
 *      05x/+1, תרומות משובצות (4 שנים, ₪/$), שורות hist, הו"ק (10%), nextDate (5%), ayin (10%),
 *      תמונות (20% כש-PHOTOS=1); ‏~200 משפחות; ‏~300 אירועים.
 *   2. מגיש את DIST על PORT; מגיש את קונפיג-השורש החי (public/config.json בלי firebase, slug משוכתב ל-ORG)
 *      ב-/c/<ORG>/config.json כך שהדגלים תואמים ללקוח האמיתי; מזריק אותו גם ל-localStorage 'maor_org_config'.
 *      זורע את ה-Db ל-localStorage `maor_db:<ORG>` (+ IndexedDB `maor:<ORG>` store 'db' key 'current'
 *      כנפילה כשמכסת-LS נגמרת) מדף ריק באותו origin לפני הניווט הראשון לאפליקציה.
 *   3. מודד עם performance.now() בתוך הדף + MutationObserver + PerformanceObserver(longtask), עוטף את
 *      Storage.prototype.setItem ו-IDBObjectStore.prototype.put/get כדי לתזמן את כתיבת/קריאת ה-DB; ‏CDP Profiler לכל צעד.
 *      (12.10) צעד-העריכה מקבל גם את משטר-המכסה: כשהמסמך גדול מ-LS אין ניסיון setItem כלל — ממתינים ל-put של IDB.
 *   4. ממפה את פריימי-הפרופיל המוקטנים למקור דרך קובצי ה-.js.map שליד הבנדלים.
 *
 * "היום" לדטרמיניזם: 2026-10-12 (התאריכים מחוללים יחסית לקבוע הזה).
 * תלות: חבילת source-map (תלות-עקיפה הקיימת ב-node_modules) — למיפוי הפרופיל למקור.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join, extname, dirname, resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';
import { SourceMapConsumer } from 'source-map';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' ? process.env[k] : d);
const SCALE = +env('SCALE', 500);
const DON = +env('DON', 15);
const HIST = +env('HIST', 20);
const PHOTOS = +env('PHOTOS', 0) === 1;
const THROTTLE = +env('THROTTLE', 4);
const PORT = +env('PORT', 8311);
const DIST = resolve(env('DIST', join(ROOT, 'dist-perf')));
const OUT = resolve(env('OUT', join(ROOT, 'e2e', '.tmp-perf')));
const CHROME = env('CHROME', process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const ORG = env('ORG', 'demo');
const SEED = +env('SEED', 42);
const TODAY = '2026-10-12';
const DB_KEY = ORG === 'default' ? 'maor_db' : `maor_db:${ORG}`;
const IDB_NAME = ORG === 'default' ? 'maor' : `maor:${ORG}`;
const RUN_ID = `s${SCALE}-d${DON}-h${HIST}-p${PHOTOS ? 1 : 0}-t${THROTTLE}`;
const STEP_TIMEOUT = +env('STEP_TIMEOUT', 240000);

mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(`[perf ${RUN_ID}]`, ...a);

/* ───────────────────────── 1 · synthetic Db ───────────────────────── */
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const ri = (n) => Math.floor(rnd() * n);
const pick = (arr) => arr[ri(arr.length)];
const chance = (p) => rnd() < p;
const digits = (n) => Array.from({ length: n }, () => ri(10)).join('');
function isoOffset(days) {
  const d = new Date(TODAY + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const FIRST_M = ['אברהם', 'יצחק', 'יעקב', 'משה', 'אהרן', 'דוד', 'שלמה', 'יוסף', 'בנימין', 'ראובן', 'שמעון', 'לוי', 'יהודה', 'נפתלי', 'מאיר', 'חיים', 'ישראל', 'מרדכי', 'אליהו', 'שמואל', 'נתן', 'צבי', 'אריה', 'ברוך', 'פנחס', 'אלימלך', 'זאב', 'יחיאל', 'שלום', 'מנחם'];
const FIRST_F = ['שרה', 'רבקה', 'רחל', 'לאה', 'מרים', 'חנה', 'אסתר', 'דבורה', 'רות', 'נעמי', 'יהודית', 'תמר', 'מלכה', 'ציפורה', 'בתיה', 'חיה', 'שושנה', 'פנינה', 'גילה', 'ברכה'];
const LAST = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דהן', 'אברהם', 'פרידמן', 'מלכה', 'אזולאי', 'כץ', 'יוסף', 'דוד', 'עמר', 'אוחיון', 'חדד', 'גבאי', 'בן דוד', 'אדרי', 'שפירא', 'וייס', 'קליין', 'רוזנברג', 'גולדברג', 'ברקוביץ', 'הורוביץ', 'שטרן', 'גרינברג', 'רוט', 'זילברמן', 'אלבז', 'טל', 'ברוך', 'סבג', 'שלום', 'נחום', 'בוזגלו', 'אסולין', 'ממן', 'חזן'];
const CITIES = ['ירושלים', 'בני ברק', 'בית שמש', 'אלעד', 'מודיעין עילית', 'ביתר עילית', 'אשדוד', 'חיפה', 'פתח תקווה', 'נתניה', 'רחובות', 'צפת'];
const STREETS = ['רבי עקיבא', 'חזון איש', 'הרב קוק', 'ז׳בוטינסקי', 'הרצל', 'בן גוריון', 'מלכי ישראל', 'שמואל הנביא', 'סורוצקין', 'הפלמ״ח'];
const SUP_CAT = ['קבוע', 'חד-פעמי', 'חבר', 'VIP', 'ארה"ב', 'הו"ק', 'משפחה'];
const FOR_WHO = ['כללי', 'קמחא דפסחא', 'חתונות', 'מלגות', 'סלי מזון', '', 'אלמנות ויתומים'];
const DON_CAT = ['כללי', 'קמחא דפסחא', 'חתונה', 'סל מזון', 'מלגה', 'נדבה', 'הו"ק'];
const AMOUNTS_ILS = [36, 50, 100, 100, 180, 200, 250, 360, 500, 500, 720, 1000, 1800, 2500, 5000];
const AMOUNTS_USD = [18, 36, 50, 100, 100, 180, 250, 500, 1000];
const NOTES = ['תורם ותיק, מעדיף שיחה אחרי 20:00', 'לשלוח קבלה במייל', 'מבקש עדכון שנתי', 'גיס של הרב', 'תורם דרך נדרים', '', '', ''];
const EV_TYPES = ['reminder', 'call', 'wedding', 'memorial', 'anniversary', 'bday', 'org', 'custom'];
const TRANSLIT = ['cohen', 'levi', 'mizrahi', 'peretz', 'biton', 'dahan', 'friedman', 'katz', 'amar', 'hadad', 'gabai', 'shapira', 'weiss', 'klein', 'stern', 'roth', 'tal', 'sabag', 'mamann', 'hazan'];

/** ~60KB base64 PNG with random RGB pixels (incompressible) — minimal encoder, no deps. */
function makePng(w = 125, h = 120) {
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c; }
  const crc32 = (buf) => { let c = -1; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  const r2 = mulberry32(7);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w * 3; x++) raw[y * (w * 3 + 1) + 1 + x] = Math.floor(r2() * 256); }
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 1 })), chunk('IEND', Buffer.alloc(0))]);
  return 'data:image/png;base64,' + png.toString('base64');
}

function genDb() {
  const db = {
    v: 6, savedAt: new Date().toISOString(), seq: 100, receiptSeq: 1, donationSeq: 1, shopReceiptSeq: 1,
    families: [], enrollments: [], courses: [], events: [], rooms: [], teachers: [], supporters: [],
    tzCoordinators: [], tzBoxes: [], tzCampaigns: [], tzEvents: [],
    shopItems: [], shopProducts: [], shopStores: [], shopCriteria: [], shopAssignments: [], shopEvents: [], shopIntakes: [],
    volunteers: [], distributionDays: [], deliveries: [], tasks: [], warehouse: [],
    orgName: 'מאור החסד', orgSite: '', orgDonate: '', orgGoal: 0, budget: 0, usdRate: 3.7,
    notif: { email: true, push: false, sms: true, strong: false },
    reports: { daily: true, weekly: true, monthly: false, quarterly: false },
    ui: { famView: 'list', crsView: 'grid' }, attnDone: {}, security: {},
  };
  const png = PHOTOS ? makePng() : null;
  let rid = 1;
  let photoCount = 0;
  for (let i = 0; i < SCALE; i++) {
    const male = chance(0.7);
    const last = pick(LAST);
    const name = chance(0.3) ? `משפחת ${last}` : `${male ? pick(FIRST_M) : pick(FIRST_F)} ${last}`;
    const usa = chance(0.2);
    const phone = usa ? `+1${pick(['212', '718', '347', '917', '732', '845'])}${digits(7)}` : `05${pick(['0', '2', '3', '4', '5', '8'])}-${digits(7)}`;
    const nDon = Math.max(0, Math.round(DON * (0.7 + rnd() * 0.6)));
    const donations = [];
    for (let k = 0; k < nDon; k++) {
      const dollar = usa ? chance(0.8) : chance(0.1);
      donations.push({ rid: `D-${rid++}`, date: isoOffset(-ri(1460)), amount: dollar ? pick(AMOUNTS_USD) : pick(AMOUNTS_ILS), cur: dollar ? '$' : '₪', cat: pick(DON_CAT) });
    }
    donations.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    let ils = 0, usd = 0;
    for (const d of donations) { if (d.cur === '$') usd += d.amount; else ils += d.amount; }
    const nHist = Math.max(0, Math.round(HIST * (0.7 + rnd() * 0.6)));
    const hist = [];
    for (let k = 0; k < nHist; k++) {
      hist.push({ d: isoOffset(-ri(1460)), a: pick(AMOUNTS_ILS), c: '₪', ref: digits(8), txn: digits(9), receipt: digits(6), brand: pick(['ויזה', 'מסטרכרד', 'ישראכרט']), last4: digits(4), clearer: 'נדרים פלוס', pays: 1, status: 'אושר' });
    }
    hist.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
    const sp = {
      id: `sp${i + 1}`, name, phone, email: chance(0.7) ? `${pick(TRANSLIT)}${i}@gmail.com` : '',
      address: `${pick(STREETS)} ${1 + ri(120)}`, city: pick(CITIES), idNum: chance(0.5) ? digits(9) : '',
      cat: pick(SUP_CAT), forWho: pick(FOR_WHO), notes: pick(NOTES),
      count: donations.length, ils, usd, first: donations[0]?.date ?? '', last: donations[donations.length - 1]?.date ?? '',
      nextDate: '', donations,
    };
    if (hist.length) sp.hist = hist;
    if (chance(0.1)) sp.phones = [{ id: `sph${i}`, num: `05${pick(['2', '3', '4'])}-${digits(7)}`, label: 'וואטסאפ', wa: true }];
    if (chance(0.1)) sp.hok = { amount: pick([50, 100, 180, 200, 360, 500]), cur: '₪', day: 1 + ri(28), method: pick(['card', 'bank']), note: '', active: chance(0.85), startedAt: isoOffset(-ri(900)) };
    if (chance(0.05)) { sp.nextDate = isoOffset(ri(90) - 30); sp.nextNote = pick(['לעדכן על הקבלה', 'לבקש חידוש הו״ק', 'לברר כתובת', 'להודות על התרומה הגדולה']); }
    if (chance(0.1)) {
      sp.ayin = { stage: pick(['new', 'lead', 'eyes', 'answer', 'done']), note: '', answeredNote: '', answerPushed: false, nextTalk: '', nextTalkTime: '', lastTouch: chance(0.3) ? TODAY : isoOffset(-ri(60)), names: [], answers: [], log: [], time: [], mat: [] };
      for (let k = 0; k < 3; k++) sp.ayin.names.push({ id: `ayn${i}_${k}`, name: `${pick(FIRST_M)} בן ${pick(FIRST_F)}`, eyes: chance(0.5) ? ri(40) : '', done: chance(0.3) });
    }
    if (png && chance(0.2)) { sp.photos = [png]; photoCount++; }
    db.supporters.push(sp);
  }
  db.donationSeq = rid;
  for (let i = 0; i < 200; i++) {
    const last = pick(LAST);
    const fam = {
      id: `f${i + 1}`, name: `משפחת ${last}`, father: pick(FIRST_M), fatherId: digits(9), mother: pick(FIRST_F), motherId: digits(9),
      phone: `05${pick(['0', '2', '3', '4'])}-${digits(7)}`, phone2: '', email: '', city: pick(CITIES), address: `${pick(STREETS)} ${1 + ri(80)}`,
      community: 'כללי', maritalStatus: pick(['אלמנה', 'אלמן', 'גרושה', '']), language: 'עברית', tzedaka: '', fullSefach: chance(0.5), discount: '',
      status: 'active', notes: '', kidsHome: 0, members: [], docs: [], cred: { score: 700, log: [] }, createdAt: isoOffset(-ri(2000)),
    };
    const n = 2 + ri(5);
    for (let k = 0; k < n; k++) {
      const g = chance(0.5) ? 'm' : 'f';
      fam.members.push({ id: `m${i + 1}_${k + 1}`, first: g === 'm' ? pick(FIRST_M) : pick(FIRST_F), gender: g, birth: `${2005 + ri(18)}-${String(1 + ri(12)).padStart(2, '0')}-${String(1 + ri(28)).padStart(2, '0')}`, idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '' });
    }
    fam.kidsHome = n;
    db.families.push(fam);
  }
  for (let i = 0; i < 300; i++) {
    const type = pick(EV_TYPES);
    const off = ri(730) - 365;
    db.events.push({ id: `ev${i + 1}`, title: pick(['תזכורת', 'שיחה', 'אזכרה', 'יום הולדת', 'חתונה', 'אירוע ארגוני']) + ' ' + pick(LAST), date: isoOffset(off), time: `${String(8 + ri(12)).padStart(2, '0')}:00`, type, customType: type === 'custom' ? 'אחר' : '', notes: '', price: 0, roomId: '', famId: chance(0.5) ? `f${1 + ri(200)}` : '', priority: pick(['red', 'orange', 'green']), done: off < 0 && chance(0.6) });
  }
  db.seq = 100000;
  return { db, photoCount };
}

/* ───────────────────────── 2 · static server ───────────────────────── */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json' };
const liveCfg = JSON.parse(readFileSync(join(ROOT, 'public', 'config.json'), 'utf8'));
delete liveCfg.firebase; // cloud off ⇒ no login gate; the rest of the live root config (opt-in flags, telephony, integrations) as in production
const orgCfg = { ...liveCfg, slug: ORG };
const BLANK_HTML = '<!doctype html><html><head><meta charset="utf-8"><title>seed</title></head><body>seed</body></html>';
let seedJson = '';
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (url === '/__blank.html') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(BLANK_HTML); }
  if (url === '/__seed.json') { res.setHeader('Content-Type', 'application/json'); return res.end(seedJson); }
  if (url === `/c/${ORG}/config.json`) { res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); return res.end(JSON.stringify(orgCfg)); }
  let p = join(DIST, url);
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});

/* ───────────────────────── 3 · in-page instrumentation ───────────────────────── */
const INIT_SCRIPT = `(() => {
  const DBKEY = ${JSON.stringify(DB_KEY)};
  const S = { lt: [], ls: [], navT: null, mainT: null, keyT: 0, clickT: 0, blurT: 0, frames: null };
  window.__pw = S;
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) S.lt.push({ s: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: true });
  } catch {}
  const origSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    const t0 = performance.now();
    let ok = true;
    try { return origSet.call(this, k, v); } catch (e) { ok = false; throw e; } finally { if (k === DBKEY) S.ls.push({ t0, t: performance.now(), len: String(v).length, ok }); }
  };
  S.idb = [];
  try {
    S.idbGet = [];
    const origGet = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (k) {
      const req = origGet.apply(this, arguments);
      if (k === 'current') { const t0 = performance.now(); req.addEventListener('success', () => S.idbGet.push({ t0, t: performance.now() })); }
      return req;
    };
    const origPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (v, k) {
      const t0 = performance.now();
      const req = origPut.apply(this, arguments);
      if (k === 'current') {
        req.addEventListener('success', () => S.idb.push({ t0, t: performance.now(), ok: true }));
        req.addEventListener('error', () => S.idb.push({ t0, t: performance.now(), ok: false }));
      }
      return req;
    };
  } catch {}
  window.addEventListener('keydown', () => { S.keyT = performance.now(); }, true);
  // Playwright types non-layout chars (Hebrew) via insertText => no keydown; beforeinput fires for both paths
  window.addEventListener('beforeinput', () => { S.inputT = performance.now(); }, true);
  S.inputT = 0;
  S.lastInput = () => Math.max(S.keyT, S.inputT);
  window.addEventListener('pointerdown', () => { S.clickT = performance.now(); }, true);
  window.addEventListener('focusout', () => { S.blurT = performance.now(); }, true);
  // resolves with performance.now() at the first DOM mutation after which pred() is truthy (or immediately)
  S.when = (pred, timeout) => new Promise((res, rej) => {
    const f = typeof pred === 'string' ? () => document.querySelector(pred) : pred;
    if (f()) return res({ t: performance.now(), immediate: true });
    const mo = new MutationObserver(() => { if (f()) { mo.disconnect(); clearTimeout(tm); res({ t: performance.now(), immediate: false }); } });
    mo.observe(document, { childList: true, subtree: true, characterData: true, attributes: true });
    const tm = setTimeout(() => { mo.disconnect(); rej(new Error('when() timeout')); }, timeout || 240000);
  });
  // resolves with performance.now() when snap() returns a different value than at arm-time
  S.whenChange = (snap, timeout) => new Promise((res, rej) => {
    const base = snap();
    const mo = new MutationObserver(() => { if (snap() !== base) { mo.disconnect(); clearTimeout(tm); res({ t: performance.now() }); } });
    mo.observe(document, { childList: true, subtree: true, characterData: true, attributes: true });
    const tm = setTimeout(() => { mo.disconnect(); rej(new Error('whenChange() timeout')); }, timeout || 240000);
  });
  S.rowsSnap = () => { const tb = document.querySelector('main table.table tbody'); return tb ? tb.childElementCount + '|' + tb.textContent : 'none'; };
  S.when('nav').then((r) => { S.navT = r.t; }).catch(() => {});
  S.when(() => document.querySelector('nav') && document.querySelector('main') && !document.querySelector('main .empty')).then((r) => { S.mainT = r.t; }).catch(() => {});
  S.startFrames = () => { S.frames = []; S.framesOn = true; const loop = (ts) => { if (!S.framesOn) return; S.frames.push(ts); requestAnimationFrame(loop); }; requestAnimationFrame(loop); };
  S.stopFrames = () => { S.framesOn = false; return S.frames; };
})();`;

/* ───────────────────────── 4 · profile aggregation (+ sourcemaps) ───────────────────────── */
const mapCache = new Map();
function consumerFor(url) {
  if (mapCache.has(url)) return mapCache.get(url);
  let c = null;
  try {
    const file = join(DIST, new URL(url).pathname);
    const mapFile = file + '.map';
    if (existsSync(mapFile)) c = new SourceMapConsumer(JSON.parse(readFileSync(mapFile, 'utf8')));
  } catch { /* no map */ }
  mapCache.set(url, c);
  return c;
}
function mapFrame(cf) {
  const minUrl = cf.url ? basename(cf.url) : '';
  if (!cf.url || !cf.url.startsWith('http')) return { fn: cf.functionName || '(anonymous)', url: minUrl ? `${minUrl}:${cf.lineNumber + 1}:${cf.columnNumber}` : '', src: '' };
  const c = consumerFor(cf.url);
  if (!c) return { fn: cf.functionName || '(anonymous)', url: `${minUrl}:${cf.lineNumber + 1}:${cf.columnNumber}`, src: '' };
  const pos = c.originalPositionFor({ line: cf.lineNumber + 1, column: cf.columnNumber });
  if (!pos || !pos.source) return { fn: cf.functionName || '(anonymous)', url: `${minUrl}:${cf.lineNumber + 1}:${cf.columnNumber}`, src: '' };
  const src = pos.source.replace(/^.*?(?=(?:src|node_modules)\/)/, '').replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
  let fn = pos.name || '';
  if (!fn) {
    // sourcemap has no name at this position (function declarations / arrows) — guess from the original source line
    try {
      const content = c.sourceContentFor(pos.source, true);
      const lineText = content ? content.split('\n')[pos.line - 1] || '' : '';
      fn = guessName(lineText, pos.column);
    } catch { /* no sourcesContent */ }
  }
  if (!fn) fn = (cf.functionName || '(anonymous)') + '?';
  return { fn, url: `${src}:${pos.line}:${pos.column}`, src, min: `${minUrl}:${cf.lineNumber + 1}:${cf.columnNumber}` };
}
function guessName(lineText, col) {
  const after = lineText.slice(col);
  const before = lineText.slice(0, col);
  let m = after.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/);
  if (m) return m[1];
  if (/function\s*\*?\s*$/.test(before)) { m = after.match(/^([A-Za-z_$][\w$]*)/); if (m) return m[1]; } // position at the name after `function `
  m = after.match(/^([A-Za-z_$][\w$]*)\s*\(/); // method shorthand / class method (only at a definition position, not a call)
  if (m && /(?:^|[{,;]|async)\s*$/.test(before) && !['if', 'for', 'while', 'switch', 'return', 'function', 'catch'].includes(m[1])) return m[1];
  m = after.match(/^(?:async\s*)?\(?[^()=]*\)?\s*=>/) ? null : null;
  m = before.match(/([A-Za-z_$][\w$]*)\s*[:=]\s*(?:async\s*)?$/); // const x = ... / key: ...
  if (m) return m[1];
  m = before.match(/\.([A-Za-z_$][\w$]*)\s*\(\s*(?:async\s*)?$/); // .map(... => callback
  if (m) return m[1] + '-callback';
  m = before.match(/([A-Za-z_$][\w$]*)\s*\(\s*(?:async\s*)?$/); // useMemo(... / useEffect(...
  if (m) return m[1] + '-callback';
  return '';
}
/** self time (ms) per callFrame key from a CDP Profiler profile. */
function selfTimes(profile) {
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const { samples = [], timeDeltas = [] } = profile;
  for (let i = 0; i < samples.length; i++) {
    const dt = (timeDeltas[i] ?? 0) / 1000; // µs → ms (delta precedes sample i in CDP; good enough for aggregation)
    const n = byId.get(samples[i]);
    if (!n) continue;
    const cf = n.callFrame;
    const key = `${cf.functionName}|${cf.url}|${cf.lineNumber}|${cf.columnNumber}`;
    const e = self.get(key) ?? { cf, ms: 0, n: 0 };
    e.ms += dt; e.n++;
    self.set(key, e);
  }
  return self;
}
function aggregate(selfMaps, topN = 20) {
  const merged = new Map();
  for (const m of selfMaps) for (const [k, e] of m) { const x = merged.get(k) ?? { cf: e.cf, ms: 0, n: 0 }; x.ms += e.ms; x.n += e.n; merged.set(k, x); }
  let total = 0, idle = 0;
  for (const e of merged.values()) { total += e.ms; if (e.cf.functionName === '(idle)') idle += e.ms; }
  const busy = total - idle;
  const rows = [...merged.values()].filter((e) => e.cf.functionName !== '(idle)' && e.cf.functionName !== '(root)').sort((a, b) => b.ms - a.ms).slice(0, topN).map((e) => {
    const m = mapFrame(e.cf);
    return { fn: m.fn, url: m.url, min: m.min ?? '', self_ms: +e.ms.toFixed(1), pct: +((100 * e.ms) / busy).toFixed(2), samples: e.n };
  });
  // by source file
  const byFile = new Map();
  for (const e of merged.values()) { if (e.cf.functionName === '(idle)' || e.cf.functionName === '(root)') continue; const m = mapFrame(e.cf); const f = m.src || m.url.split(':')[0] || e.cf.functionName; byFile.set(f, (byFile.get(f) ?? 0) + e.ms); }
  const files = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([file, ms]) => ({ file, self_ms: +ms.toFixed(1), pct: +((100 * ms) / busy).toFixed(2) }));
  return { total_ms: +total.toFixed(1), busy_ms: +busy.toFixed(1), idle_ms: +idle.toFixed(1), top: rows, files };
}

/* ───────────────────────── 5 · the scenario ───────────────────────── */
const ltIn = (lt, a, b) => { const xs = lt.filter((e) => e.s >= a && e.s <= b); return { count: xs.length, max_ms: +Math.max(0, ...xs.map((e) => e.d)).toFixed(1), total_ms: +xs.reduce((s, e) => s + e.d, 0).toFixed(1) }; };

function reaggregate() {
  const { readdirSync } = require_fs();
  for (const f of readdirSync(OUT).filter((x) => x.startsWith('profile-') && x.endsWith('.cpuprofile.json'))) {
    const id = f.slice('profile-'.length, -'.cpuprofile.json'.length);
    const runPath = join(OUT, `run-${id}.json`);
    if (!existsSync(runPath)) continue;
    const profiles = JSON.parse(readFileSync(join(OUT, f), 'utf8'));
    const selfMaps = {};
    for (const [name, prof] of Object.entries(profiles)) selfMaps[name] = selfTimes(prof);
    const run = JSON.parse(readFileSync(runPath, 'utf8'));
    run.profile = aggregate(Object.values(selfMaps), 20);
    run.profile_per_step = {};
    for (const [name, m] of Object.entries(selfMaps)) run.profile_per_step[name] = aggregate([m], 12);
    writeFileSync(runPath, JSON.stringify(run, null, 2));
    log('re-aggregated', runPath);
  }
}
function require_fs() { return { readdirSync }; }

async function main() {
  if (process.env.REAGG === '1') { reaggregate(); return; }
  const t0 = Date.now();
  log('generating db…');
  const { db, photoCount } = genDb();
  const seedObj = { ...db, savedAt: new Date().toISOString() };
  seedJson = JSON.stringify(seedObj);
  const seedInfo = { chars: seedJson.length, utf8_mb: +(Buffer.byteLength(seedJson, 'utf8') / 1e6).toFixed(2), chars_mb: +(seedJson.length / 1e6).toFixed(2), supporters: db.supporters.length, donations: db.supporters.reduce((a, s) => a + s.donations.length, 0), hist: db.supporters.reduce((a, s) => a + (s.hist?.length ?? 0), 0), photos: photoCount, families: db.families.length, events: db.events.length };
  log('db generated:', JSON.stringify(seedInfo), `(${Date.now() - t0}ms)`);

  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  const base = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'he-IL', timezoneId: 'UTC' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(STEP_TIMEOUT);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });

  // seed from a same-origin blank page (no app code running) — LS first, IDB mirror as fallback
  await page.goto(`${base}/__blank.html`);
  const seedRes = await page.evaluate(async ({ key, idbName, today, cfg, autoexp, lsnotice }) => {
    localStorage.clear();
    localStorage.setItem('maor_org_config', JSON.stringify(cfg));
    const ns = (k) => (key === 'maor_db' ? k : k + ':' + key.split(':')[1]);
    localStorage.setItem(ns('maor_day'), today); // day already opened ⇒ no "פתיחת יום" modal
    // end-of-day auto backup (App.tsx maor_autoexp — once a day after maor_dayend, default 17:00) stringifies the whole DB
    // and downloads it; it would land randomly inside one step. Pre-marked as done unless AUTOEXP=1.
    if (!autoexp) localStorage.setItem(ns('maor_autoexp'), today);
    // (12.10) ההודעה החד-פעמית "הנתונים גדולים — IDB בלבד" (persist.takeLsDroppedNotice) מסומנת-כנצפתה מראש —
    // היא קורית פעם-אחת-למכשיר אצל הלקוח, ולא מה שמודדים. LSNOTICE=1 נותן לה לקפוץ (למדידת המסלול הראשון).
    if (!lsnotice) localStorage.setItem(ns('maor_lsdrop_noticed'), '1');
    const tf = performance.now();
    const txt = await (await fetch('/__seed.json')).text();
    const tFetch = performance.now() - tf;
    let lsOk = true, lsErr = '';
    const tl = performance.now();
    try { localStorage.setItem(key, txt); } catch (e) { lsOk = false; lsErr = String(e && e.name); }
    const tLs = performance.now() - tl;
    const tp = performance.now();
    const obj = JSON.parse(txt);
    const tParse = performance.now() - tp;
    const ti = performance.now();
    await new Promise((res) => { const d = indexedDB.deleteDatabase(idbName); d.onsuccess = d.onerror = d.onblocked = () => res(); });
    await new Promise((res, rej) => {
      const req = indexedDB.open(idbName, 1);
      req.onupgradeneeded = () => { const d = req.result; d.createObjectStore('db'); d.createObjectStore('snapshots'); };
      req.onerror = () => rej(req.error);
      req.onsuccess = () => { const d = req.result; const tx = d.transaction('db', 'readwrite'); tx.objectStore('db').put(obj, 'current'); tx.oncomplete = () => { d.close(); res(); }; tx.onerror = () => rej(tx.error); };
    });
    const tIdb = performance.now() - ti;
    return { lsOk, lsErr, tFetch: +tFetch.toFixed(0), tLs: +tLs.toFixed(0), tParse: +tParse.toFixed(0), tIdb: +tIdb.toFixed(0), chars: txt.length };
  }, { key: DB_KEY, idbName: IDB_NAME, today: TODAY, cfg: orgCfg, autoexp: env('AUTOEXP', '0') === '1', lsnotice: env('LSNOTICE', '0') === '1' });
  log('seeded:', JSON.stringify(seedRes));

  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await page.addInitScript(INIT_SCRIPT);

  const steps = {}; // name → { ms, lt, extra }
  const profiles = {}; // name → profile
  const now = () => page.evaluate(() => performance.now());
  const lt = () => page.evaluate(() => window.__pw.lt);
  const profStart = () => cdp.send('Profiler.start');
  const profStop = async (name) => { const { profile } = await cdp.send('Profiler.stop'); profiles[name] = profile; };

  /* (a) page load → interactive */
  await profStart();
  const navStart = Date.now();
  await page.goto(`${base}/?org=${ORG}`, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__pw && window.__pw.mainT !== null, null, { timeout: STEP_TIMEOUT });
  const loadInfo = await page.evaluate(() => {
    const nt = performance.getEntriesByType('navigation')[0];
    return { navT: window.__pw.navT, mainT: window.__pw.mainT, domInteractive: nt?.domInteractive, loadEventEnd: nt?.loadEventEnd, responseEnd: nt?.responseEnd };
  });
  await profStop('load');
  const ltAll0 = await lt();
  steps.load = { ms: +loadInfo.mainT.toFixed(1), nav_ms: +loadInfo.navT.toFixed(1), timing: loadInfo, lt: ltIn(ltAll0, 0, loadInfo.mainT), wall_ms: Date.now() - navStart };
  log('load:', JSON.stringify(steps.load));
  // "פתיחת יום" modal fallback (should be pre-skipped by maor_day key)
  const dayBtn = page.locator('.modal-back button', { hasText: 'פתיחת יום' });
  if (await dayBtn.count()) { await dayBtn.first().click(); await page.waitForTimeout(300); }
  await page.waitForTimeout(1500); // let lazy view prefetch (warm) settle

  /* (b) donors tab → first rows */
  await profStart();
  const tb0 = await now();
  const pRows = page.evaluate(() => window.__pw.when(() => document.querySelector('input[aria-label="חיפוש"]') && document.querySelector('main table.table tbody tr')));
  await page.locator('nav >> text=תורמים').first().click();
  const rRows = await pRows;
  const clickT1 = await page.evaluate(() => window.__pw.clickT);
  const tb1 = await now();
  await profStop('tab');
  steps.tab = { ms: +(rRows.t - clickT1).toFixed(1), lt: ltIn(await lt(), tb0, tb1), rows_rendered: await page.locator('main table.table tbody tr').count() };
  log('tab:', JSON.stringify(steps.tab));
  await page.waitForTimeout(800);

  /* (c) search — 3 keystrokes */
  const search = page.locator('input[aria-label="חיפוש"]');
  await search.click();
  await page.waitForTimeout(300);
  const keys = ['כ', 'ה', 'ן'];
  steps.search = { keys: [] };
  await profStart();
  const ts0 = await now();
  for (const ch of keys) {
    const p = page.evaluate(() => window.__pw.whenChange(window.__pw.rowsSnap));
    await page.keyboard.type(ch);
    const r = await p;
    const keyT = await page.evaluate(() => window.__pw.lastInput());
    const tEnd = await now();
    const cnt = await page.locator('main table.table tbody tr').count();
    steps.search.keys.push({ ch, ms: +(r.t - keyT).toFixed(1), rows: cnt, lt: ltIn(await lt(), keyT, tEnd) });
    await page.waitForTimeout(700);
  }
  const ts1 = await now();
  await profStop('search');
  steps.search.ms_avg = +(steps.search.keys.reduce((a, k) => a + k.ms, 0) / keys.length).toFixed(1);
  steps.search.ms_max = Math.max(...steps.search.keys.map((k) => k.ms));
  steps.search.lt = ltIn(await lt(), ts0, ts1);
  log('search:', JSON.stringify(steps.search));
  // clear the search (select-all + delete) and wait for the full list back
  {
    const p = page.evaluate(() => window.__pw.whenChange(window.__pw.rowsSnap));
    await search.press('Control+a');
    await search.press('Backspace');
    const r = await p;
    const keyT = await page.evaluate(() => window.__pw.lastInput());
    steps.clear = { ms: +(r.t - keyT).toFixed(1) };
    await page.waitForTimeout(800);
  }

  /* (d) sort header click → update (numeric column "סה"כ ₪", then name) */
  steps.sort = {};
  await profStart();
  for (const [key, label] of [['ils', 'סה"כ ₪'], ['name', 'תומכ/ת']]) {
    const th = page.locator('main table.table thead th[aria-sort]', { hasText: label }).first();
    const t0s = await now();
    const p = page.evaluate(() => window.__pw.whenChange(window.__pw.rowsSnap));
    await th.click();
    const r = await p;
    const clickT = await page.evaluate(() => window.__pw.clickT);
    const t1s = await now();
    steps.sort[key] = { ms: +(r.t - clickT).toFixed(1), lt: ltIn(await lt(), t0s, t1s) };
    await page.waitForTimeout(800);
  }
  await profStop('sort');
  log('sort:', JSON.stringify(steps.sort));

  /* (g) scroll 10 screens — avg frame time (rAF deltas) */
  await profStart();
  const scrollInfo0 = await page.evaluate(() => {
    const se = document.scrollingElement;
    const main = document.querySelector('main');
    const cand = [se, main, main?.parentElement].filter(Boolean).find((el) => el.scrollHeight > el.clientHeight + 50);
    return { which: cand === se ? 'document' : cand ? cand.tagName + '.' + cand.className : 'none', h: cand ? cand.clientHeight : window.innerHeight, scrollHeight: cand ? cand.scrollHeight : 0 };
  });
  const rowsBefore = await page.locator('main table.table tbody tr').count();
  await page.mouse.move(683, 500);
  const tg0 = await now();
  await page.evaluate(() => window.__pw.startFrames());
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, scrollInfo0.h);
    await page.waitForTimeout(300);
  }
  const frames = await page.evaluate(() => window.__pw.stopFrames());
  const scrollY = await page.evaluate(() => Math.round(document.scrollingElement.scrollTop));
  const tg1 = await now();
  await profStop('scroll');
  const deltas = frames.slice(1).map((t, i) => t - frames[i]);
  const rowsAfter = await page.locator('main table.table tbody tr').count();
  steps.scroll = { frame_avg_ms: +(deltas.reduce((a, b) => a + b, 0) / Math.max(1, deltas.length)).toFixed(1), frame_max_ms: +Math.max(0, ...deltas).toFixed(1), frames: deltas.length, frames_over_50ms: deltas.filter((d) => d > 50).length, duration_ms: +(tg1 - tg0).toFixed(0), lt: ltIn(await lt(), tg0, tg1), container: scrollInfo0, rows_before: rowsBefore, rows_after: rowsAfter, scrollY_after: scrollY };
  log('scroll:', JSON.stringify(steps.scroll));
  await page.mouse.wheel(0, -scrollInfo0.h * 12);
  await page.waitForTimeout(600);

  /* (e) open first donor card */
  await profStart();
  const te0 = await now();
  const pCard = page.evaluate(() => window.__pw.when(() => !document.querySelector('input[aria-label="חיפוש"]') && document.querySelector('main textarea')));
  await page.locator('main table.table tbody tr').first().click();
  const rCard = await pCard;
  const clickT2 = await page.evaluate(() => window.__pw.clickT);
  const te1 = await now();
  await profStop('card');
  steps.card = { ms: +(rCard.t - clickT2).toFixed(1), lt: ltIn(await lt(), te0, te1) };
  log('card:', JSON.stringify(steps.card));
  await page.waitForTimeout(800);

  /* (f) edit a harmless field (nextNote textarea) → blur ⇒ setDb ⇒ debounce 500ms ⇒ saveDb ⇒ localStorage write */
  await profStart();
  const ta = page.locator('main textarea[placeholder^="למשל: לעדכן"]').first();
  await ta.click();
  await ta.fill('בדיקת ביצועים ' + Date.now());
  const before = await page.evaluate(() => ({ ls: window.__pw.ls.length, idb: window.__pw.idb.length, idbGet: window.__pw.idbGet.length }));
  const tf0 = await now();
  await page.keyboard.press('Tab'); // blur ⇒ onBlur ⇒ saveNextNote ⇒ setDb ⇒ 500ms debounce ⇒ saveDb (LS setItem, then IDB put)
  // (12.10) במשטר-המכסה (מסמך > 4M תווים / QuotaExceeded שנלמד) persist מדלג על setItem לגמרי ⇒ ממתינים ל-LS **או** ל-IDB put
  await page.waitForFunction((b) => window.__pw.ls.length > b.ls || window.__pw.idb.length > b.idb, before, { timeout: STEP_TIMEOUT, polling: 50 });
  let idbDone = true;
  try { await page.waitForFunction((b) => window.__pw.idb.length > b.idb, before, { timeout: STEP_TIMEOUT, polling: 50 }); } catch { idbDone = false; }
  await page.waitForTimeout(300); // let a trailing LS write (after the IDB put) land before reading the records
  const lsRec = await page.evaluate((b) => ({ blurT: window.__pw.blurT, w: window.__pw.ls.length > b.ls ? window.__pw.ls[window.__pw.ls.length - 1] : null, i: window.__pw.idb.length > b.idb ? window.__pw.idb[window.__pw.idb.length - 1] : null, gets: window.__pw.idbGet.length - b.idbGet, lsAttempts: window.__pw.ls.length - b.ls }), before);
  const tf1 = await now();
  await profStop('edit');
  const doneT = Math.max(lsRec.w ? lsRec.w.t : 0, idbDone && lsRec.i ? lsRec.i.t : 0);
  steps.edit = { ms: +(doneT - lsRec.blurT).toFixed(1), ms_minus_debounce: +(doneT - lsRec.blurT - 500).toFixed(1), ls_attempted: lsRec.lsAttempts > 0, ls_write_done_ms: lsRec.w ? +(lsRec.w.t - lsRec.blurT).toFixed(1) : null, setItem_ms: lsRec.w ? +(lsRec.w.t - lsRec.w.t0).toFixed(1) : null, ls_ok: lsRec.w ? lsRec.w.ok : false, idb_put_ms: lsRec.i ? +(lsRec.i.t - lsRec.i.t0).toFixed(1) : null, idb_ok: lsRec.i ? lsRec.i.ok : null, idb_done: idbDone, idb_gets_during_save: lsRec.gets, json_chars: lsRec.w ? lsRec.w.len : seedJson.length, json_mb_chars: +((lsRec.w ? lsRec.w.len : seedJson.length) / 1e6).toFixed(2), lt: ltIn(await lt(), tf0, tf1) };
  log('edit:', JSON.stringify(steps.edit));
  await page.waitForTimeout(1000);
  const lsLenFinal = await page.evaluate((k) => { try { return (localStorage.getItem(k) || '').length; } catch { return -1; } }, DB_KEY);

  /* profile aggregation */
  const selfMaps = {};
  for (const [name, prof] of Object.entries(profiles)) selfMaps[name] = selfTimes(prof);
  const overall = aggregate(Object.values(selfMaps), 20);
  const perStep = {};
  for (const [name, m] of Object.entries(selfMaps)) perStep[name] = aggregate([m], 12);

  const result = {
    run: RUN_ID, scale: { supporters: SCALE, donations_per: DON, hist_per: HIST, photos: PHOTOS, events: 300, families: 200 }, cpu_throttle: THROTTLE, today: TODAY, org: ORG, db_key: DB_KEY,
    seed: { ...seedInfo, ...seedRes, ls_len_final: lsLenFinal },
    metrics_ms: {
      page_load_to_interactive: steps.load.ms,
      tab_open_to_rows: steps.tab.ms,
      search_keystroke_to_update: steps.search.ms_avg,
      search_keystroke_max: steps.search.ms_max,
      sort_click_to_update: steps.sort.ils.ms,
      sort_name_click_to_update: steps.sort.name.ms,
      card_open: steps.card.ms,
      edit_to_persist_done: steps.edit.ms,
      scroll_frame_avg: steps.scroll.frame_avg_ms,
    },
    db_json_mb: steps.edit.json_mb_chars,
    long_tasks: (() => { const all = Object.values(steps).flatMap((s) => (s.lt ? [s.lt] : [])); return { count: all.reduce((a, l) => a + l.count, 0), max_ms: Math.max(0, ...all.map((l) => l.max_ms)), total_ms: +all.reduce((a, l) => a + l.total_ms, 0).toFixed(1) }; })(),
    steps, profile: overall, profile_per_step: perStep, errors, wall_ms: Date.now() - t0,
  };
  const rawPath = join(OUT, `run-${RUN_ID}.json`);
  writeFileSync(rawPath, JSON.stringify(result, null, 2));
  writeFileSync(join(OUT, `profile-${RUN_ID}.cpuprofile.json`), JSON.stringify(profiles));
  log('wrote', rawPath, `wall ${(result.wall_ms / 1000).toFixed(0)}s`);
  console.log(JSON.stringify({ run: RUN_ID, metrics_ms: result.metrics_ms, db_json_mb: result.db_json_mb, long_tasks: result.long_tasks, top5: overall.top.slice(0, 5) }, null, 1));
  await browser.close();
  server.close();
}

main().catch((e) => { console.error('[perf] FAILED', e); try { server.close(); } catch {} process.exit(1); });
