/**
 * ratchet (20.11.2026) — JWT של googleapis נבנה בבנאי-אובייקט בלבד.
 *
 * הבאג (נמצא בבדיקת Dependabot #410, googleapis 140⇒176): sheetsNightly בנה
 * `new google.auth.JWT(email, undefined, key, scopes)`. מ-googleapis 171 (google-auth-library 10) הבנאי
 * המיקומי מתעלם מהארגומנטים ⇒ אובייקט בלי email ⇒ האימות מול Sheets נכשל בשקט, ו-65 בדיקות-היחידה
 * הקיימות לא תפסו את זה (הן לא בונות JWT). הצורה `JWT({ email, key, scopes })` עובדת ב-9 וב-10
 * (אומת בסקריפט-עשן על 140 ועל 176).
 * ב-CI אין node_modules של functions ⇒ נועלים ברמת-המקור (כמו outbox-claim-guard).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const sources = readdirSync(here).filter((f) => f.endsWith('.js'));

describe('🛡 google.auth.JWT — בנאי-אובייקט בלבד', () => {
  it('אין בנאי-מיקומי new google.auth.JWT(<לא-אובייקט>) באף קובץ functions/*.js', () => {
    const bad = [];
    for (const f of sources) {
      const src = readFileSync(join(here, f), 'utf8');
      for (const m of src.matchAll(/new\s+google\.auth\.JWT\(\s*([^\s)])/g)) if (m[1] !== '{') bad.push(f);
    }
    expect(bad).toEqual([]);
  });

  it('sheetsNightly בונה JWT עם email/key/scopes', () => {
    const index = readFileSync(join(here, 'index.js'), 'utf8');
    expect(index).toMatch(/new google\.auth\.JWT\(\{\s*email:\s*sa\.client_email,\s*key:\s*sa\.private_key,\s*scopes:/);
  });
});
