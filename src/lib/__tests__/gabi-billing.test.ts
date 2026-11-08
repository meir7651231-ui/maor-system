/**
 * ratchet — 🪙 מנוי גבי **דרך אורביט** (הכרעת-בעלים 8.11.2026: העסקים משלמים על גבי דרך אורביט;
 * גבי לא מנהל חיוב משלו). דורמנטי: `gabi` עדיין 'roadmap'.
 *
 * מה ננעל כאן:
 *  (1) דורמנטיות — שני קונפיגי-הלקוח-החי לא מזכירים gabi/billing; GabiSection ב-SSR ריק; הכרטיס
 *      מרונדר רק בתוך הסעיף המגודר; ההרחבה לא נמכרת ולא מתומחרת באורביט.
 *  (2) הרשומה — סכמה סגורה, ערך פסול ⇒ null (לא "מתקנים" מצב-חיוב בשקט); כתיבה = updateDoc+FieldPath
 *      ל-billing.gabi בלבד (לא merge:true על מפה — לקח 5.10); עריכה בממשק = מייל-על בלבד.
 *  (3) החיוב — קישור-תשלום (payLink) לעמוד-הסליקה של אורביט; אין כרטיס/סליקה/רשת בקוד.
 *  (4) ההערכה — אותה טבלת-מקרים כמו collect-agent/tests/test_orbit_entitlement.py (ניסיון 14 ·
 *      active עד paidUntil · חסד 7 · cancelled ⇒ עצירה).
 *  (5) הזכאות — וקטור-זהב משותף TS/Node/Python; הדפדפן לא חותם (אין מפתח בדפדפן).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  gabiBillingLine, gabiBillingPayLink, gabiBillingState, gabiEntitlementJson, gabiPlanLabel, gabiPlanPrice,
  normalizeGabiSubscription, verifyGabiEntitlement, GABI_GRACE_DAYS, type GabiSubscription,
} from '../gabiBilling';
import { gabiServerUrlOk } from '../gabi';
import { integrationOn, normalizeConfig } from '../config';
import { DEFAULT_PRICES } from '../pricing';
import type { OrgConfig } from '../../types/config';
import { INTEGRATION_STATUS, liveAddons } from '../../components/builder/handoff';
import { GabiSection } from '../../components/settings/GabiSection';
import billingSrc from '../gabiBilling.ts?raw';
import cloudCfgSrc from '../cloudConfig.ts?raw';
import sectionSrc from '../../components/settings/GabiSection.tsx?raw';

const root = (f: string) => readFileSync(new URL('../../../' + f, import.meta.url), 'utf8');

// וקטור-זהב משותף — זהה ל-functions/gabiHandoff.test.mjs ול-collect-agent/tests/test_orbit_entitlement.py
const GOLDEN_KEY = 'orbit-gabi-entitlement-golden-key-0123456789';
const GOLDEN_ENT =
  'eyJ2IjoxLCJpc3MiOiJvcmJpdCIsImF1ZCI6ImdhYmkiLCJ0eXAiOiJlbnRpdGxlbWVudCIsIm9yZyI6ImFjbWUtc3R1ZGlvIiwicGxhbiI6InllYXJseSIsInN0YXR1cyI6ImFjdGl2ZSIsInRyaWFsX3N0YXJ0IjoiMjAyNi0xMS0wMSIsInBhaWRfdW50aWwiOiIyMDI3LTExLTE0IiwiYmlsbGluZ191cmwiOiJodHRwczovL29yYml0LWlsLmNvbS8_b3JnPWFjbWUtc3R1ZGlvIiwiaWF0IjoxNzYyNTAwMDAwLCJleHAiOjE3NjI1MDAxMjB9' +
  '.D83L_dTPQUPauaXhDGZiIstycnIBEQTBuTQHXzoK1YU';

const sub = (over: Partial<GabiSubscription>): GabiSubscription => ({ plan: 'monthly', status: 'active', trialStart: '2026-11-01', paidUntil: '2026-12-08', payUrl: '', ...over });

describe('🪙 מנוי גבי — דורמנטיות (הלקוח-החי ביט-זהה)', () => {
  it('שני קונפיגי-החי: אין gabi ואין billing ⇒ ההרחבה כבויה', () => {
    for (const f of ['public/config.json', 'public/c/maor-hachesed/config.json']) {
      const raw = root(f);
      expect(raw, f).not.toContain('gabi');
      expect(raw, f).not.toContain('billing');
      expect(integrationOn(normalizeConfig(JSON.parse(raw)) as OrgConfig, 'gabi'), f).toBe(false);
    }
  });

  it("כנות: gabi נשאר 'roadmap' — לא נמכר ולא מתומחר באורביט (המחיר = של גבי, מוצג כמידע)", () => {
    expect(INTEGRATION_STATUS.gabi).toBe('roadmap');
    expect(liveAddons({ integrations: { gabi: { enabled: true } } })).toEqual([]);
    expect(DEFAULT_PRICES.integrations.gabi).toBeUndefined();
  });

  it('GabiSection בקונפיג-ברירת-המחדל ⇒ ריק; הכרטיס רק בתוך הסעיף המגודר', () => {
    expect(renderToStaticMarkup(createElement(GabiSection))).toBe('');
    const gate = sectionSrc.indexOf('if (!gabiSectionVisible(config, cloudUser?.email, isManager)) return null;');
    const card = sectionSrc.indexOf('<GabiBillingCard ');
    expect(gate).toBeGreaterThan(0);
    expect(card).toBeGreaterThan(gate);
    expect(sectionSrc.match(/<GabiBillingCard /g)).toHaveLength(1);
  });

  it('🛡 הגנות-מקור: אפס-רשת במודול; הענן רק בייבוא-דינמי; עריכה = מייל-על; כתיבה נקודתית', () => {
    expect(billingSrc).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|firebase|localStorage/);
    // הדפדפן לא חותם זכאות (אין מפתח בדפדפן) — רק מאמת-ייחוס
    expect(billingSrc).not.toMatch(/export (async )?function signGabiEntitlement/);
    expect(sectionSrc).toContain("void import('../../lib/cloudConfig')");
    expect(sectionSrc).toContain('{cloud && loaded && su && (');
    expect(sectionSrc).toContain('const su = isSuperAdmin(email);');
    // אין טיפול-בכרטיס: החיוב = קישור לעמוד-הסליקה (payLink)
    for (const src of [billingSrc, sectionSrc]) expect(src).not.toMatch(/cvv|cardNumber|creditCard|<input[^>]*cc-/i);
    expect(billingSrc).toContain("import { payLink } from './payLink';");
    const w = cloudCfgSrc.slice(cloudCfgSrc.indexOf('export async function writeOrgGabiBilling'));
    const body = w.slice(0, w.indexOf('\n}\n'));
    expect(body).toContain("new FieldPath('billing', 'gabi')");
    expect(body).toContain('updateDoc(');
    expect(body).not.toContain('merge: true');
    expect(body).toContain('normalizeGabiSubscription(');
  });
});

describe('🪙 מנוי גבי — הרשומה', () => {
  it('סכמה סגורה + נרמול; שדות זרים נזרקים; payUrl רק https', () => {
    expect(normalizeGabiSubscription({ plan: 'yearly', status: 'trial', trialStart: ' 2026-11-08 ', paidUntil: '', payUrl: 'https://pay.example/x', evil: 1 }))
      .toEqual({ plan: 'yearly', status: 'trial', trialStart: '2026-11-08', paidUntil: '', payUrl: 'https://pay.example/x' });
    expect(normalizeGabiSubscription(sub({ payUrl: 'javascript:alert(1)' }))?.payUrl).toBe('');
    expect(normalizeGabiSubscription(sub({ payUrl: 'http://pay.example' }))?.payUrl).toBe('');
  });

  it('פסול ⇒ null (לא מתקנים מצב-חיוב בשקט)', () => {
    for (const bad of [
      null, 'x', [], {}, sub({ plan: 'weekly' as never }), sub({ status: 'free' as never }),
      sub({ status: 'trial', trialStart: '' }), sub({ status: 'active', paidUntil: '' }), sub({ status: 'past_due', paidUntil: '' }),
      sub({ paidUntil: '2026-02-30' }), sub({ trialStart: '8.11.2026' }),
    ]) expect(normalizeGabiSubscription(bad), JSON.stringify(bad)).toBeNull();
    expect(normalizeGabiSubscription(sub({ status: 'cancelled', paidUntil: '' }))).not.toBeNull();
  });

  it('המחיר היחיד: ₪119/חודש · ₪1,190/שנה', () => {
    expect(gabiPlanPrice('monthly')).toBe(119);
    expect(gabiPlanPrice('yearly')).toBe(1190);
    expect(gabiPlanLabel('yearly')).toBe('שנתי · ₪1,190/שנה');
  });
});

describe('🪙 מנוי גבי — כללי-ההערכה (זהים לגבי)', () => {
  // טבלה משותפת עם collect-agent/tests/test_orbit_entitlement.py::CASES — לשנות בשני המקומות
  const CASES: Array<[Partial<GabiSubscription>, string, string, boolean]> = [
    [{ status: 'trial', trialStart: '2026-11-01' }, '2026-11-01', 'trial', true],
    [{ status: 'trial', trialStart: '2026-11-01' }, '2026-11-14', 'trial', true],
    [{ status: 'trial', trialStart: '2026-11-01' }, '2026-11-15', 'trial_expired', false],
    [{ status: 'active', paidUntil: '2026-12-08' }, '2026-12-08', 'active', true],
    [{ status: 'active', paidUntil: '2026-12-08' }, '2026-12-09', 'grace', true],
    [{ status: 'active', paidUntil: '2026-12-08' }, '2026-12-15', 'grace', true],
    [{ status: 'active', paidUntil: '2026-12-08' }, '2026-12-16', 'expired', false],
    [{ status: 'past_due', paidUntil: '2026-12-08' }, '2026-12-01', 'grace', true],
    [{ status: 'past_due', paidUntil: '2026-12-08' }, '2026-12-16', 'expired', false],
    [{ status: 'cancelled', paidUntil: '2027-01-01' }, '2026-12-01', 'cancelled', false],
    [{ status: 'cancelled', paidUntil: '' }, '2026-12-01', 'cancelled', false],
  ];
  it.each(CASES)('%j @ %s ⇒ %s', (over, today, state, active) => {
    const st = gabiBillingState(sub(over), today);
    expect(st.state).toBe(state);
    expect(st.active).toBe(active);
    expect(gabiBillingLine(st)).toBeTruthy();
  });

  it('ניסיון: 14 יום מ-trialStart; התראה 3 ימים לפני; חסד = 7 ימים', () => {
    expect(gabiBillingState(sub({ status: 'trial', trialStart: '2026-11-01' }), '2026-11-12')).toMatchObject({ ends: '2026-11-15', daysLeft: 3, endingSoon: true });
    expect(gabiBillingState(sub({ status: 'trial', trialStart: '2026-11-01' }), '2026-11-11').endingSoon).toBe(false);
    expect(GABI_GRACE_DAYS).toBe(7);
    expect(gabiBillingState(sub({ status: 'past_due' }), '2026-12-10')).toMatchObject({ graceUntil: '2026-12-15', daysLeft: 5 });
  });

  it('קישור-תשלום: payLink עם מחיר-המסלול; אין payUrl/בוטל/פעיל-רחוק ⇒ אין כפתור', () => {
    const s = sub({ status: 'past_due', payUrl: 'https://pay.orbit.example/gabi' });
    const url = gabiBillingPayLink(s, gabiBillingState(s, '2026-12-10'), 'acme');
    expect(url).toBe('https://pay.orbit.example/gabi?amount=119&name=' + encodeURIComponent('גבי · acme · חודשי').replace(/%20/g, '+'));
    const y = sub({ plan: 'yearly', status: 'trial', trialStart: '2026-11-01', payUrl: 'https://pay.example/{amount}' });
    expect(gabiBillingPayLink(y, gabiBillingState(y, '2026-11-05'), 'acme')).toBe('https://pay.example/1190');
    expect(gabiBillingPayLink(sub({}), gabiBillingState(sub({}), '2026-12-01'), 'acme')).toBeNull(); // אין payUrl
    const far = sub({ payUrl: 'https://pay.example' });
    expect(gabiBillingPayLink(far, gabiBillingState(far, '2026-11-20'), 'acme')).toBeNull(); // פעיל, רחוק מהחידוש
    expect(gabiBillingPayLink(far, gabiBillingState(far, '2026-12-06'), 'acme')).not.toBeNull(); // 2 ימים לחידוש
    const c = sub({ status: 'cancelled', payUrl: 'https://pay.example' });
    expect(gabiBillingPayLink(c, gabiBillingState(c, '2026-12-01'), 'acme')).toBeNull();
  });
});

describe('🪙 טוקן-הזכאות (Orbit → Gabi)', () => {
  it('וקטור-זהב: TS מאמת את מה שהשרת (Node) חתם; JSON קנוני זהה', async () => {
    const c = await verifyGabiEntitlement(GOLDEN_ENT, GOLDEN_KEY, 1762500010);
    expect(c).toEqual({ v: 1, iss: 'orbit', aud: 'gabi', typ: 'entitlement', org: 'acme-studio', plan: 'yearly', status: 'active',
      trial_start: '2026-11-01', paid_until: '2027-11-14', billing_url: 'https://orbit-il.com/?org=acme-studio', iat: 1762500000, exp: 1762500120 });
    const payload = btoa(gabiEntitlementJson(c!)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(payload).toBe(GOLDEN_ENT.split('.')[0]);
  });

  it('דחיות: מפתח אחר · פג-תוקף · זיוף-payload · סוד-המסירה אינו מפתח-הזכאות', async () => {
    expect(await verifyGabiEntitlement(GOLDEN_ENT, 'z'.repeat(44), 1762500010)).toBeNull();
    expect(await verifyGabiEntitlement(GOLDEN_ENT, GOLDEN_KEY, 1762500120)).toBeNull();
    expect(await verifyGabiEntitlement(GOLDEN_ENT, GOLDEN_KEY, 1762499900)).toBeNull();
    const forged = btoa(gabiEntitlementJson({ ...(await verifyGabiEntitlement(GOLDEN_ENT, GOLDEN_KEY, 1762500010))!, paid_until: '2099-12-31' }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(await verifyGabiEntitlement(forged + '.' + GOLDEN_ENT.split('.')[1], GOLDEN_KEY, 1762500010)).toBeNull();
    expect(await verifyGabiEntitlement(GOLDEN_ENT, 'orbit-gabi-golden-vector-secret-0123456789', 1762500010)).toBeNull();
  });

  it('🛡 כתובת-השרת: מותרת סיומת &e={זכאות} בפורמט-טוקן בלבד; v1 ביט-זהה', () => {
    const base = 'https://gabi.example';
    expect(gabiServerUrlOk(base, 'https://gabi.example/connect/orbit#h=aaa.bbb')).toBe('https://gabi.example/connect/orbit#h=aaa.bbb');
    expect(gabiServerUrlOk(base, 'https://gabi.example/connect/orbit#h=aaa.bbb&e=ccc.ddd')).toBe('https://gabi.example/connect/orbit#h=aaa.bbb&e=ccc.ddd');
    expect(gabiServerUrlOk(base, 'https://gabi.example/connect/orbit#h=aaa.bbb&e=ccc')).toBeNull();
    expect(gabiServerUrlOk(base, 'https://gabi.example/connect/orbit#h=aaa.bbb&e=ccc.ddd&x=1')).toBeNull();
    expect(gabiServerUrlOk(base, 'https://evil.example/connect/orbit#h=aaa.bbb&e=ccc.ddd')).toBeNull();
    expect(gabiServerUrlOk(base, 'https://gabi.example/connect/orbit#e=ccc.ddd&h=aaa.bbb')).toBeNull();
  });
});
