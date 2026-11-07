/**
 * בדיקות-יחידה · gabiHandoff (חתימת המסירה לגבי בשרת, v2 של הסוד).
 * הליבה הטהורה חייבת להפיק **בדיוק** את אותו טוקן כמו src/lib/gabi.ts (חוזה v1) — וקטור-הזהב
 * כאן זהה לזה של collect-agent/tests/test_orbit_connect.py (שם גבי מאמת אותו בפייתון).
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { buildGabiHandoffClaims, signGabiHandoff, gabiConnectUrl, verifyGabiHandoff } from '../src/lib/gabi';

const require = createRequire(import.meta.url);
const { buildClaims, signToken, connectUrl, handoffUrl, newNonce } = require('./gabiHandoff.js');

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
