/**
 * 🪙 gabiHandoff — חתימת טוקן-המסירה לגבי **בשרת** (v2 של הסוד, 7.11.2026 · לא פרוס).
 *
 * למה: ב-v1 הסוד-המשותף ישב ב-localStorage של מכשיר-המנהל והחתימה רצה בדפדפן ⇒ כל מי
 * שניגש למכשיר ראה את הסוד, והמייל שבטוקן היה "נטען-לקוח". כאן:
 *   • הסוד בכספת `orgSecrets/{slug}.gabiHandoff` (Rules: read:false מהדפדפן — רק Admin SDK).
 *   • המייל = מה-ID-token המאומת של Firebase (לא מהבקשה), והמבקש חייב להיות מנהל-הארגון
 *     (platformOrgs/{slug}.manager) או מייל-על.
 *   • ההרחבה חייבת להיות דלוקה במפורש (config.integrations.gabi.enabled === true) עם baseUrl https.
 *   • אותו פורמט-טוקן בדיוק כמו src/lib/gabi.ts (חוזה v1) — וקטור-זהב משותף בבדיקות
 *     (gabiHandoff.test.mjs ↔ collect-agent/tests/test_orbit_connect.py).
 *
 * מה עובר לגבי: org + email + iat/exp + nonce — **אפס נתוני-לקוחות/כסף**.
 * דורמנטי: בלי פריסה אין endpoint; בלי סוד בכספת ⇒ 412; בלי הדגל ⇒ 403.
 * הליבה הטהורה (buildClaims/signToken/connectUrl/handoffUrl) מיוצאת ונבדקת ביחידה בלי firebase.
 */
'use strict';

const crypto = require('crypto');

const VERSION = 1;
const SIG_CONTEXT = 'gabi-handoff-v1.';
const TTL = 120;
const MAX_TTL = 300;
const SECRET_MIN_LEN = 32;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NONCE_RE = /^[A-Za-z0-9_-]{16,64}$/;

const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** claims קנוניים — זהה ל-buildGabiHandoffClaims (gabi.ts). קלט פסול ⇒ null. */
function buildClaims({ slug, email, nowSec, nonce, ttlSec }) {
  const org = clean(slug).toLowerCase();
  const mail = clean(email).toLowerCase();
  const ttl = ttlSec === undefined ? TTL : ttlSec;
  if (!SLUG_RE.test(org) || org === 'default' || org === 'demo' || org === 'root') return null;
  if (!EMAIL_RE.test(mail) || mail.length > 254) return null;
  if (!Number.isInteger(nowSec) || nowSec <= 0) return null;
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > MAX_TTL) return null;
  if (!NONCE_RE.test(nonce || '')) return null;
  return { v: VERSION, iss: 'orbit', aud: 'gabi', org, email: mail, iat: nowSec, exp: nowSec + ttl, nonce };
}

/** סדר-שדות קנוני (JSON.stringify, בלי רווחים) ⇒ payload.sig. סוד חלש ⇒ null. */
function signToken(c, secret) {
  const s = clean(secret);
  if (s.length < SECRET_MIN_LEN) return null;
  const json = JSON.stringify({ v: c.v, iss: c.iss, aud: c.aud, org: c.org, email: c.email, iat: c.iat, exp: c.exp, nonce: c.nonce });
  const payload = b64url(Buffer.from(json, 'utf8'));
  const sig = b64url(crypto.createHmac('sha256', s).update(SIG_CONTEXT + payload).digest());
  return payload + '.' + sig;
}

/** https בלבד, בלי user:pass, בלי רווחים — כמו safeHttpsUrl בצד-הלקוח. */
function safeHttps(raw) {
  const t = clean(raw);
  if (!t || /[\s\u0000-\u001f\u007f]/.test(t)) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== 'https:' || !u.hostname || u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

/** `{base}/connect/orbit#h={token}` — זהה ל-gabiConnectUrl (gabi.ts): query מנוקה, הטוקן ב-fragment. */
function connectUrl(baseUrl, token) {
  const u = safeHttps(baseUrl);
  if (!u || !token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  u.pathname = u.pathname.replace(/\/+$/, '') + '/connect/orbit';
  u.search = '';
  u.hash = 'h=' + token;
  return u.toString();
}

function newNonce() {
  return b64url(crypto.randomBytes(16));
}

/** מסירה מלאה: claims → חתימה → כתובת; כל כשל ⇒ null. */
function handoffUrl({ baseUrl, slug, email, secret, nowSec, nonce, ttlSec }) {
  if (!safeHttps(baseUrl)) return null;
  const c = buildClaims({ slug, email, nowSec, nonce, ttlSec });
  if (!c) return null;
  const t = signToken(c, secret);
  return t ? { url: connectUrl(baseUrl, t), exp: c.exp } : null;
}

/* ── זכאות (חיוב דרך אורביט, הכרעת-בעלים 8.11.2026) ─────────────────────────────
 * אורביט מחייב את העסק על גבי; גבי לומד את מצב-המנוי מטוקן-זכאות חתום וקצר-מועד שמצורף
 * ל-fragment של המסירה (`#h={handoff}&e={entitlement}`). המקור: `platformOrgs/{slug}.billing.gabi`
 * (כתיבה = מייל-על בלבד; Rules קיימים). **המפתח = GABI_ENTITLEMENT_KEY (env, פלטפורמה)** —
 * לא סוד-המסירה הפר-ארגוני: את זה הלקוח המשלם עצמו מדביק, והוא היה יכול לחתום לעצמו "active".
 * חוזה: knowledge/BUILD-ORDER-GABI-STORE-2026-11-07.md §7 · מאמת: collect-agent/app/orbit_entitlement.py. */
const ENT_CONTEXT = 'gabi-entitlement-v1.';
const ENT_TTL = 120;
const PLANS = ['monthly', 'yearly'];
const STATUSES = ['trial', 'active', 'past_due', 'cancelled'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (s) => DATE_RE.test(s) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s;

/** חיטוי רשומת-המנוי — זהה ל-normalizeGabiSubscription (src/lib/gabiBilling.ts). פסול ⇒ null. */
function normalizeSubscription(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const plan = clean(raw.plan);
  const status = clean(raw.status);
  if (!PLANS.includes(plan) || !STATUSES.includes(status)) return null;
  const trialStart = clean(raw.trialStart);
  const paidUntil = clean(raw.paidUntil);
  if (trialStart && !validDate(trialStart)) return null;
  if (paidUntil && !validDate(paidUntil)) return null;
  if (status === 'trial' && !trialStart) return null;
  if ((status === 'active' || status === 'past_due') && !paidUntil) return null;
  return { plan, status, trialStart, paidUntil };
}

/** הקישור "חזרה לחיוב באורביט" שגבי מציג לבעל העסק — https בלבד, ?org= של הארגון. */
function billingUrlFor(appUrl, slug) {
  const u = safeHttps(appUrl);
  if (!u || !SLUG_RE.test(slug)) return '';
  u.search = '?org=' + slug;
  u.hash = '';
  return u.toString();
}

/** claims קנוניים של הזכאות; קלט פסול ⇒ null. */
function entitlementClaims({ slug, sub, billingUrl, nowSec, ttlSec }) {
  const org = clean(slug).toLowerCase();
  const s = normalizeSubscription(sub);
  const ttl = ttlSec === undefined ? ENT_TTL : ttlSec;
  if (!s || !SLUG_RE.test(org) || org === 'default' || org === 'demo' || org === 'root') return null;
  if (!Number.isInteger(nowSec) || nowSec <= 0 || !Number.isInteger(ttl) || ttl < 1 || ttl > MAX_TTL) return null;
  const bu = clean(billingUrl);
  if (bu && !safeHttps(bu)) return null;
  return { v: 1, iss: 'orbit', aud: 'gabi', typ: 'entitlement', org, plan: s.plan, status: s.status,
    trial_start: s.trialStart, paid_until: s.paidUntil, billing_url: bu, iat: nowSec, exp: nowSec + ttl };
}

/** חתימת-הזכאות (סדר-שדות קנוני). מפתח < 32 ⇒ null (אין זכאות — גבי נשאר במצבו). */
function signEntitlement(c, key) {
  const k = clean(key);
  if (!c || k.length < SECRET_MIN_LEN) return null;
  const json = JSON.stringify({ v: c.v, iss: c.iss, aud: c.aud, typ: c.typ, org: c.org, plan: c.plan, status: c.status,
    trial_start: c.trial_start, paid_until: c.paid_until, billing_url: c.billing_url, iat: c.iat, exp: c.exp });
  const payload = b64url(Buffer.from(json, 'utf8'));
  return payload + '.' + b64url(crypto.createHmac('sha256', k).update(ENT_CONTEXT + payload).digest());
}

/** כתובת-המסירה + זכאות (אם יש רשומה ומפתח). בלי אחד מהם ⇒ הכתובת של v1 ביט-זהה. */
function withEntitlement(url, ent) {
  return ent && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ent) ? url + '&e=' + ent : url;
}

module.exports = {
  buildClaims, signToken, connectUrl, handoffUrl, newNonce, GABI_MAX_TTL: MAX_TTL,
  normalizeSubscription, billingUrlFor, entitlementClaims, signEntitlement, withEntitlement,
};

// ── חיווט-השרת (נטען רק בסביבת-Functions; מדולג בבדיקות-יחידה) ────────────────
if (process.env.FUNCTIONS_EMULATOR !== undefined || process.env.K_SERVICE || process.env.GCLOUD_PROJECT) {
  try {
    const { onRequest } = require('firebase-functions/v2/https');
    const { getFirestore } = require('firebase-admin/firestore');
    require('firebase-admin/app');
    // מיילי-העל: env + עוגן-קשיח (כמו gcontactsSync) — התאמה-מלאה.
    const superSet = () => new Set(['meir7651231@gmail.com', ...String(process.env.SUPER_ADMIN_EMAILS || '').toLowerCase().split(/[,\s]+/).filter(Boolean)]);

    // ⚠️ module.exports (לא exports): השורה למעלה החליפה את module.exports — `exports` מצביע לאובייקט הישן
    module.exports.gabiHandoff = onRequest({ timeoutSeconds: 30, memory: '128MiB', cors: true }, async (req, res) => {
      res.set('Cache-Control', 'no-store');
      try {
        if (req.method !== 'POST') { res.status(405).json({ error: 'post-only' }); return; }
        // ה-org מהגוף בלבד (לא query) — אין סיבה שמזהים יגיעו ללוגי-גישה
        const slug = clean((req.body || {}).org).toLowerCase();
        if (!SLUG_RE.test(slug) || slug === 'default' || slug === 'demo' || slug === 'root') { res.status(400).json({ error: 'bad-org' }); return; }
        const bearer = /^Bearer (.+)$/.exec(req.get('authorization') || '');
        const { getAuth } = require('firebase-admin/auth');
        let email = '';
        if (bearer) { try { email = (await getAuth().verifyIdToken(bearer[1])).email || ''; } catch { /* invalid */ } }
        if (!email) { res.status(401).json({ error: 'unauthorized' }); return; }
        const el = email.toLowerCase();
        const db = getFirestore();
        const orgDoc = await db.doc('platformOrgs/' + slug).get();
        if (!orgDoc.exists) { res.status(404).json({ error: 'no-org' }); return; }
        const od = orgDoc.data() || {};
        if (od.deleted === true) { res.status(404).json({ error: 'no-org' }); return; }
        const isMgr = clean(od.manager).toLowerCase() === el;
        if (!isMgr && !superSet().has(el)) { res.status(403).json({ error: 'forbidden' }); return; }
        const g = ((od.config || {}).integrations || {}).gabi || {};
        if (g.enabled !== true) { res.status(403).json({ error: 'gabi-disabled' }); return; }
        if (!safeHttps(g.baseUrl)) { res.status(412).json({ error: 'no-base-url' }); return; }
        const vault = await db.doc('orgSecrets/' + slug).get();
        const secret = clean(vault.exists ? (vault.data() || {}).gabiHandoff : '');
        if (secret.length < SECRET_MIN_LEN) { res.status(412).json({ error: 'no-secret' }); return; }
        const nowSec = Math.floor(Date.now() / 1000);
        const out = handoffUrl({ baseUrl: g.baseUrl, slug, email: el, secret, nowSec, nonce: newNonce() });
        if (!out || !out.url) { res.status(422).json({ error: 'cannot-sign' }); return; }
        // זכאות (חיוב דרך אורביט): רק עם רשומת-מנוי תקינה + מפתח-פלטפורמה. אחרת — v1 ביט-זהה.
        const ent = signEntitlement(entitlementClaims({
          slug, sub: ((od.billing || {}).gabi), nowSec,
          billingUrl: billingUrlFor(process.env.ORBIT_APP_URL || 'https://orbit-il.com/', slug),
        }), process.env.GABI_ENTITLEMENT_KEY);
        // ללא לוג של הכתובת/הטוקן — רק עובדת-ההנפקה
        console.log('gabiHandoff issued org=' + slug + (ent ? ' +entitlement' : ''));
        res.json({ ok: true, url: withEntitlement(out.url, ent), exp: out.exp });
      } catch (e) {
        console.error('gabiHandoff: ' + String(e).slice(0, 200));
        res.status(500).json({ error: 'failed' });
      }
    });
  } catch (e) {
    console.error('gabiHandoff wiring: ' + String(e).slice(0, 200));
  }
}
