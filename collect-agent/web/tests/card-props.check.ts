// מנהל 436: Card בלע data-testid (ב-TS מאפיין עם מקף לא נבדק) ⇒ כרטיס «ייצוא כל הנתונים» (מנהל 429, data-testid="business-export")
// לא הגיע ל-DOM ואי אפשר היה לבדוק אותו ב-e2e. שמירה: Card מעביר מאפיינים ל-div.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/components/ui.tsx', import.meta.url), 'utf8');

test('Card מעביר data-testid ושאר המאפיינים ל-div', () => {
  const m = src.match(/export function Card\(([\s\S]*?)\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(m, 'Card לא נמצא');
  assert.match(m[1], /\.\.\.(\w+)/, 'Card לא אוסף ...rest');
  const rest = m[1].match(/\.\.\.(\w+)/)![1];
  assert.match(m[2], new RegExp(`<div \\{\\.\\.\\.${rest}\\}`), 'Card לא פורס את ה-rest על ה-div');
});

test('כל <Card data-testid> במסכים — הבדיקה הזו היא מה ששומר עליו', () => {
  const settings = readFileSync(new URL('../src/pages/Settings.tsx', import.meta.url), 'utf8');
  assert.match(settings, /<Card [^>]*data-testid="business-export"/);
});
