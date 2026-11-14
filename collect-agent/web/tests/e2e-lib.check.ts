// הפעלה 189: ניסיון חוזר אחד ל-route.fetch של GET שנפל ב«socket hang up» (מרוץ keep-alive), ורק לו.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
// @ts-expect-error — מודול JS בלי טיפוסים
import { retryingRoute, makeInject } from '../e2e/lib.mjs';

function fakeRoute(method: string, fails: string[]) {
  let calls = 0;
  const r = {
    calls: () => calls,
    request: () => ({ method: () => method }),
    async fetch() { calls++; const f = fails.shift(); if (f) throw new Error(f); return { ok: true, n: calls }; },
    async continue() { /* noop */ },
    tag: 'x',
  };
  return r;
}

test('GET: socket hang up ⇒ ניסיון חוזר אחד שמצליח', async () => {
  const r = fakeRoute('GET', ['Error: route.fetch: socket hang up']);
  const res = await retryingRoute(r).fetch();
  assert.deepEqual(res, { ok: true, n: 2 }); assert.equal(r.calls(), 2);
});

test('GET: נפילה כפולה עולה (ניסיון חוזר אחד בלבד)', async () => {
  const r = fakeRoute('GET', ['socket hang up', 'socket hang up']);
  await assert.rejects(retryingRoute(r).fetch(), /socket hang up/); assert.equal(r.calls(), 2);
});

test('POST לא חוזר (אישור כפול)', async () => {
  const r = fakeRoute('POST', ['socket hang up']);
  await assert.rejects(retryingRoute(r).fetch(), /socket hang up/); assert.equal(r.calls(), 1);
  const g = fakeRoute('GET', ['socket hang up']);
  await assert.rejects(retryingRoute(g).fetch({ method: 'POST' }), /socket hang up/); assert.equal(g.calls(), 1);
});

test('שגיאה אחרת לא חוזרת', async () => {
  const r = fakeRoute('GET', ['Error: 500 boom']);
  await assert.rejects(retryingRoute(r).fetch(), /boom/); assert.equal(r.calls(), 1);
});

test('שאר המתודות והשדות עוברים כרגיל; makeInject מעביר route עוטף', async () => {
  const r = fakeRoute('GET', ['ECONNRESET']);
  const w = retryingRoute(r);
  assert.equal(w.tag, 'x'); assert.equal(w.request().method(), 'GET');
  const errs: string[] = [];
  let handler: ((route: unknown) => Promise<void>) | undefined;
  const pg = { route: (_p: string, h: typeof handler) => { handler = h; } };
  let got: unknown;
  makeInject(errs)(pg, '**/x', async (route: { fetch: () => Promise<unknown> }) => { got = await route.fetch(); });
  await handler!(r);
  assert.deepEqual(got, { ok: true, n: 2 }); assert.deepEqual(errs, []);
});

/** הפעלה 190: ui.mjs (שלב 149) יירט /preview ב-page.route ישיר עם route.fetch — עקף את retryingRoute של 189
 *  (אותו מרוץ keep-alive). מגן-מקור: ב-e2e, כל קריאת ‎.route(…)‎ ישירה שה-callback שלה קורא ל-fetch — אסורה;
 *  יירוט שמביא את התשובה האמיתית עובר דרך makeInject. (fulfill מוק בלי fetch — מותר, כמו shots.mjs.) */
export function directRouteFetches(src: string): number[] {
  const hits: number[] = [];
  const re = /\.route\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 1;
    while (i < src.length && depth > 0) { const c = src[i++]; if (c === '(') depth++; else if (c === ')') depth--; }
    if (/\.fetch\(/.test(src.slice(m.index, i))) hits.push(src.slice(0, m.index).split('\n').length);
  }
  return hits;
}

test('מגן-מקור: אין page.route ישיר עם route.fetch ב-e2e (רק דרך makeInject)', () => {
  const dir = new URL('../e2e/', import.meta.url);
  const bad: string[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.mjs') || f === 'lib.mjs') continue;
    for (const line of directRouteFetches(readFileSync(new URL(f, dir), 'utf8'))) bad.push(`${f}:${line}`);
  }
  assert.deepEqual(bad, []);
});

test('המגן תופס יירוט ישיר עם fetch, ולא fulfill/unroute/inject', () => {
  assert.deepEqual(directRouteFetches("x;\nawait p.route('**/a', async r => { const res = await r.fetch(); await r.fulfill({ response: res }); });"), [2]);
  assert.deepEqual(directRouteFetches("await pp.route('**/api/pay/**', r => r.fulfill({ json: view }));"), []);
  assert.deepEqual(directRouteFetches("await p.unroute('**/a'); await inject(p, '**/b', async r => { await r.fetch(); });"), []);
});
