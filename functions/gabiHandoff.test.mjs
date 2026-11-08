/**
 * בדיקות-יחידה · gabiHandoff (חתימת המסירה לגבי בשרת, v2 של הסוד).
 * הליבה הטהורה חייבת להפיק **בדיוק** את אותו טוקן כמו src/lib/gabi.ts (חוזה v1) — וקטור-הזהב
 * כאן זהה לזה של collect-agent/tests/test_orbit_connect.py (שם גבי מאמת אותו בפייתון).
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { buildGabiHandoffClaims, signGabiHandoff, gabiConnectUrl, verifyGabiHandoff } from '../src/lib/gabi';
import { normalizeGabiSubscription, verifyGabiEntitlement } from '../src/lib/gabiBilling';

const require = createRequire(import.meta.url);
const {
  buildClaims, signToken, connectUrl, handoffUrl, newNonce,
  normalizeSubscription, billingUrlFor, entitlementClaims, signEntitlement, withEntitlement,
} = require('./gabiHandoff.js');

const GOLDEN_SECRET = 'orbit-gabi-golden-vector-secret-0123456789';
const GOLDEN_TOKEN =
  'eyJ2IjoxLCJpc3MiOiJvcmJpdCIsImF1ZCI6ImdhYmkiLCJvcmciOiJhY21lLXN0dWRpbyIsImVtYWlsIjoi' +
  'bWFuYWdlckBhY21lLmV4YW1wbGUiLCJpYXQiOjE3NjI1MDAwMDAsImV4cCI6MTc2MjUwMDEyMCwibm9uY2Ui' +
  'OiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFBIn0.ZAD99oyloCiyaJ1KsJ5OE7LVS16Pv2etdBADqXByHCM';
const IN = { slug: 'acme-studio', email: 'manager@acme.example', nowSec: 1762500000, nonce: 'A'.repeat(22) };

describe('🪙 gabiHandoff — ליבה טהורה', () => {
  it('וקטור-זהב: השרת (Node crypto) = הדפדפן (WebCrypto, gabi.ts) = גבי (Python)', async () => {
    const server = signToken(buildClaims(IN), GOLDEN_SECRET);
    const client = await signGabiHandoff(buildGabiHandoffClaims(IN), GOLDEN_SECRET);
    expect(server).toBe(GOLDEN_TOKEN);
    expect(client).toBe(GOLDEN_TOKEN);
    expect((await verifyGabiHandoff(server, GOLDEN_SECRET, IN.nowSec + 1)).ok).toBe(true);
  });

  it('claims זהים ל-gabi.ts, כולל נרמול וקלט פסול', () => {
    const raw = { slug: ' Acme ', email: ' Boss@Acme.org ', nowSec: 1800000000, nonce: 'AbCdEfGhIjKlMnOpQrStUv' };
    expect(buildClaims(raw)).toEqual(buildGabiHandoffClaims(raw));
    for (const bad of [{ slug: 'default' }, { slug: 'demo' }, { slug: 'root' }, { email: 'nope' }, { ttlSec: 301 }, { ttlSec: 0 }, { nonce: 'short' }, { nowSec: 1.5 }]) {
      expect(buildClaims({ ...IN, ...bad }), JSON.stringify(bad)).toBeNull();
    }
    expect(signToken(buildClaims(IN), 'short')).toBeNull();
  });

  it('כתובת: זהה ל-gabiConnectUrl — https בלבד, query מנוקה, הטוקן ב-fragment', () => {
    for (const base of ['https://gabi.example', 'https://gabi.example/app/', 'https://gabi.example?x=1']) {
      expect(connectUrl(base, 'a.b')).toBe(gabiConnectUrl(base, 'a.b'));
    }
    expect(connectUrl('http://gabi.example', 'a.b')).toBeNull();
    expect(connectUrl('https://u:p@gabi.example', 'a.b')).toBeNull();
    expect(connectUrl('javascript:alert(1)', 'a.b')).toBeNull();
    expect(connectUrl('https://gabi.example', 'bad token')).toBeNull();
    const out = handoffUrl({ ...IN, baseUrl: 'https://gabi.example', secret: GOLDEN_SECRET });
    expect(out).toEqual({ url: 'https://gabi.example/connect/orbit#h=' + GOLDEN_TOKEN, exp: IN.nowSec + 120 });
    expect(handoffUrl({ ...IN, baseUrl: 'http://gabi.example', secret: GOLDEN_SECRET })).toBeNull();
  });

  it('nonce אקראי בפורמט החוזה (22 תווי b64url)', () => {
    const a = newNonce();
    expect(a).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(newNonce()).not.toBe(a);
  });

  it('🛡 הגנות-מקור: מנהל/מייל-על מאומת-שרת, דגל דלוק, סוד מהכספת, בלי לוג של טוקן', () => {
    const src = readFileSync(new URL('./gabiHandoff.js', import.meta.url), 'utf8');
    expect(src).toContain("db.doc('orgSecrets/' + slug)");
    expect(src).toContain('.gabiHandoff');
    expect(src).toContain('verifyIdToken(bearer[1])');
    expect(src).toContain("clean(od.manager).toLowerCase() === el");
    expect(src).toContain('g.enabled !== true');
    expect(src).toContain("res.set('Cache-Control', 'no-store')");
    // המייל בטוקן = מה-ID-token, לא מהבקשה
    expect(src).toMatch(/handoffUrl\(\{[^}]*email: el/);
    expect(src).not.toMatch(/console\.\w+\([^)]*(out\.url|token|secret)/);
    // module.exports — `exports.x =` אחרי החלפת module.exports היה נבלע
    expect(src).toContain('module.exports.gabiHandoff = onRequest(');
    const index = readFileSync(new URL('./index.js', import.meta.url), 'utf8');
    expect(index).toContain("require('./gabiHandoff')");
    expect(index).toContain('exports.gabiHandoff = gabiHandoff');
  });
});

/* ── זכאות (חיוב דרך אורביט, 8.11.2026) — וקטור-זהב משותף TS/Node/Python ───────────── */
const ENT_KEY = 'orbit-gabi-entitlement-golden-key-0123456789';
const GOLDEN_ENT =
  'eyJ2IjoxLCJpc3MiOiJvcmJpdCIsImF1ZCI6ImdhYmkiLCJ0eXAiOiJlbnRpdGxlbWVudCIsIm9yZyI6ImFjbWUtc3R1ZGlvIiwicGxhbiI6InllYXJseSIsInN0YXR1cyI6ImFjdGl2ZSIsInRyaWFsX3N0YXJ0IjoiMjAyNi0xMS0wMSIsInBhaWRfdW50aWwiOiIyMDI3LTExLTE0IiwiYmlsbGluZ191cmwiOiJodHRwczovL29yYml0LWlsLmNvbS8_b3JnPWFjbWUtc3R1ZGlvIiwiaWF0IjoxNzYyNTAwMDAwLCJleHAiOjE3NjI1MDAxMjB9' +
  '.D83L_dTPQUPauaXhDGZiIstycnIBEQTBuTQHXzoK1YU';
const SUB = { plan: 'yearly', status: 'active', trialStart: '2026-11-01', paidUntil: '2027-11-14', payUrl: 'https://pay.example' };

describe('🪙 gabiHandoff — זכאות (חיוב דרך אורביט)', () => {
  it('וקטור-זהב: Node חותם = הערך שגבי (Python) מאמת; TS מאמת אותו', async () => {
    const c = entitlementClaims({ slug: 'acme-studio', sub: SUB, billingUrl: billingUrlFor('https://orbit-il.com/', 'acme-studio'), nowSec: 1762500000 });
    expect(signEntitlement(c, ENT_KEY)).toBe(GOLDEN_ENT);
    expect(await verifyGabiEntitlement(GOLDEN_ENT, ENT_KEY, 1762500001)).toEqual(c);
  });

  it('חיטוי-השרת ≡ חיטוי-הדפדפן (אותה רשומה ⇒ אותה הכרעה)', () => {
    const cases = [
      SUB, { ...SUB, status: 'trial', paidUntil: '' }, { ...SUB, status: 'trial', trialStart: '' }, { ...SUB, status: 'past_due', paidUntil: '' },
      { ...SUB, status: 'cancelled', paidUntil: '' }, { ...SUB, plan: 'weekly' }, { ...SUB, status: 'free' }, { ...SUB, paidUntil: '2026-02-30' },
      null, 'x', [], {},
    ];
    for (const raw of cases) {
      const n = normalizeSubscription(raw);
      const t = normalizeGabiSubscription(raw);
      expect(n === null, JSON.stringify(raw)).toBe(t === null);
      if (n && t) expect(n).toEqual({ plan: t.plan, status: t.status, trialStart: t.trialStart, paidUntil: t.paidUntil });
    }
  });

  it('אין רשומה / רשומה פסולה / מפתח חסר-או-קצר ⇒ אין זכאות ⇒ הכתובת של v1 ביט-זהה', () => {
    const base = { slug: 'acme-studio', billingUrl: '', nowSec: 1762500000 };
    expect(entitlementClaims({ ...base, sub: undefined })).toBeNull();
    expect(entitlementClaims({ ...base, sub: { plan: 'monthly', status: 'active' } })).toBeNull();
    expect(entitlementClaims({ ...base, sub: SUB, slug: 'default' })).toBeNull();
    expect(entitlementClaims({ ...base, sub: SUB, slug: 'demo' })).toBeNull();
    expect(entitlementClaims({ ...base, sub: SUB, billingUrl: 'http://x.example' })).toBeNull();
    expect(entitlementClaims({ ...base, sub: SUB, ttlSec: 301 })).toBeNull();
    const c = entitlementClaims({ ...base, sub: SUB });
    expect(signEntitlement(c, undefined)).toBeNull();
    expect(signEntitlement(c, 'short')).toBeNull();
    expect(signEntitlement(null, ENT_KEY)).toBeNull();
    const v1 = 'https://gabi.example/connect/orbit#h=aaa.bbb';
    expect(withEntitlement(v1, null)).toBe(v1);
    expect(withEntitlement(v1, 'not a token')).toBe(v1);
    expect(withEntitlement(v1, 'ccc.ddd')).toBe(v1 + '&e=ccc.ddd');
  });

  it('קישור-החיוב: https בלבד, ?org= של הארגון', () => {
    expect(billingUrlFor('https://orbit-il.com/', 'acme')).toBe('https://orbit-il.com/?org=acme');
    expect(billingUrlFor('https://orbit-il.com/x?y=1#z', 'acme')).toBe('https://orbit-il.com/x?org=acme');
    expect(billingUrlFor('http://orbit-il.com/', 'acme')).toBe('');
    expect(billingUrlFor('https://orbit-il.com/', 'Bad Slug')).toBe('');
  });

  it('🛡 הגנות-מקור: מפתח-פלטפורמה מה-env (לא סוד-המסירה), רשומה מהמסמך, בלי לוג של הזכאות', () => {
    const src = readFileSync(new URL('./gabiHandoff.js', import.meta.url), 'utf8');
    expect(src).toContain('process.env.GABI_ENTITLEMENT_KEY');
    expect(src).toContain('sub: ((od.billing || {}).gabi)');
    expect(src).not.toMatch(/signEntitlement\([^)]*secret\)/);
    expect(src).toContain('res.json({ ok: true, url: withEntitlement(out.url, ent), exp: out.exp })');
    expect(src).not.toMatch(/console\.\w+\([^)]*\+ ent\b/);
  });
});
