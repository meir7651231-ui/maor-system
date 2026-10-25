import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { sha256, hmacSha256, hex, utf8, canon } from '../engine/sign.mjs';

test('SHA-256 זהה למימוש של Node (כולל אורכים על גבול הבלוק)', () => {
  for (const s of ['', 'abc', 'קופה', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(1000)]) {
    assert.equal(hex(sha256(utf8(s))), createHash('sha256').update(s).digest('hex'), s.length + '');
  }
});

test('HMAC-SHA256 זהה למימוש של Node (גם מפתח ארוך מ-64)', () => {
  for (const [k, m] of [['key', 'msg'], ['k'.repeat(64), 'קבלה 1'], ['k'.repeat(100), '']]) {
    assert.equal(hex(hmacSha256(utf8(k), utf8(m))), createHmac('sha256', k).update(m).digest('hex'));
  }
});

test('canon: סדר המפתחות לא משנה', () => {
  assert.equal(canon({ b: 1, a: [2, { d: 3, c: 4 }] }), canon({ a: [2, { c: 4, d: 3 }], b: 1 }));
});
