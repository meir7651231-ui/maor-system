/** בדיקת-קצה: הכפתור המלא — הרשאה ⇒ הגנה ⇒ קובץ. */
import { exportNames } from './names-export.mjs';
const rows = [['שם', 'הערה'], ['כהן', '=HACK()'], ['לוי', 'א,ב']];
let f = 0;
const ok = exportNames({ rows, userEmail: 'a@b.com', adminEmails: ['a@b.com'] });
if (!ok.allowed || !ok.content.startsWith('﻿')) { console.error('✗ מנהל/BOM'); f = 1; }
if (!ok.content.includes("'=HACK()")) { console.error('✗ הזרקה לא נחסמה'); f = 1; }
if (!ok.content.includes('"א,ב"')) { console.error('✗ ציטוט-פסיק'); f = 1; }
const no = exportNames({ rows, userEmail: 'x@y.com', adminEmails: ['a@b.com'] });
if (no.allowed || no.content) { console.error('✗ לא-מנהל קיבל תוכן'); f = 1; }
const local = exportNames({ rows, userEmail: null, adminEmails: [] });
if (!local.allowed) { console.error('✗ מצב-מקומי'); f = 1; }
if (f) process.exit(1);
console.log('✓ קופסת-הכפתור: הרשאה+הגנת-הזרקה+BOM — 3 תרחישי-קצה ירוקים');
