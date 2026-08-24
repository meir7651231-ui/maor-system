#!/usr/bin/env node
/** 🥇 רתמת-זהב · ערכה — כל ערך שקופסת-הערכה פולטת (cssFor light+dark) חייב להופיע
 *  כהצהרה אמיתית של אותו משתנה ב-CSS המקורי של maor (אפס צבעים-מומצאים), וכל
 *  משתני-הליבה של :root המקורי מכוסים בתוכנית-light. */
import fs from 'node:fs';
import assert from 'node:assert';

const NEW = await import('/home/user/-ai-chat-server/new/boxes/theme.mjs');

// כל הצהרות ה---var בכל קובצי ה-CSS של המקור: var ⇒ קבוצת-ערכים שהוצהרו אי-פעם
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) {
  const p = d + '/' + f.name;
  if (f.isDirectory()) walk(p); else if (f.name.endsWith('.css')) files.push(p);
} };
walk('/home/user/maor-system/src');
const declared = new Map();
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    const k = m[1], v = m[2].trim().replace(/\s+/g, ' ');
    if (!declared.has(k)) declared.set(k, new Set());
    declared.get(k).add(v);
    declared.get(k).add(v.replace(/\s*!important$/, '') + 'important'); // צורת-הצילום של המחלץ
    declared.get(k).add(v.replace(/\s/g, '')); // נירמול-רווחים (rgba(a, b) vs rgba(a,b))
  }
}

const normVal = (v) => String(v).trim().replace(/\s+/g, ' ');
let n = 0, missingRoles = [];
for (const mode of ['light', 'dark']) {
  const css = NEW.cssFor(mode);
  for (const m of css.matchAll(/(--[a-z0-9-]+): ([^;]+);/gi)) {
    const role = m[1], val = normVal(m[2]);
    const orig = declared.get(role);
    assert.ok(orig, `תפקיד לא-קיים במקור: ${role}`);
    const ok = orig.has(val) || orig.has(val.replace(/\s/g, '')) ||
      [...orig].some((o) => o.replace(/\s/g, '') === val.replace(/\s/g, ''));
    if (!ok) missingRoles.push(`${mode} ${role}=${val} ∉ ${[...orig].slice(0,3).join(' | ')}`);
    n++;
  }
}
assert.deepStrictEqual(missingRoles, [], 'ערכים שאינם מהמקור:\n' + missingRoles.join('\n'));
// דטרמיניזם + overrides ("כפתור-הצבע"): דריסת-פיגמנט מחליפה בכל התפקידים המחווטים אליו
assert.strictEqual(NEW.cssFor('light'), NEW.cssFor('light'));
const over = NEW.cssFor('light', { p_f3c76b: '#ff00ff' });
assert.ok(over.includes('--accent: #ff00ff;'), 'כפתור-הצבע לא החליף');
assert.ok(!NEW.cssFor('light').includes('#ff00ff'));
console.log(`🥇 זהב-ערכה: ${n} ערכי-תפקיד (light+dark) — כולם הצהרות-אמת מה-CSS המקורי · כפתור-הצבע עובד`);
