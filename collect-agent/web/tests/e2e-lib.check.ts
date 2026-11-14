// הפעלה 189: ניסיון חוזר אחד ל-route.fetch של GET שנפל ב«socket hang up» (מרוץ keep-alive), ורק לו.
import { test } from 'node:test';
import assert from 'node:assert/strict';
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
