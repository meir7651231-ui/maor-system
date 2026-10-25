// מייצר את docs/KEYMAP.md מתוך engine/keymap.mjs — הטבלה לא יכולה לסטות מהקוד
import { writeFileSync } from 'node:fs';
import { allKeys } from '../engine/keymap.mjs';
const COLOR = { fn: 'תכלת', pay: 'ירוק', red: 'ורוד', act: 'צהוב', num: 'אפור', quick: 'אפור (שם מוצר)' };
const rows = allKeys().map((x) => `| ${x.phys.replace(/\|/g, '\\|').replace(/`/g, '\\`')} | ${x.cls === 'quick' ? `מוצר מהיר ${x.k.slice(1)}` : x.label} | \`${x.k}\` | ${COLOR[x.cls] || ''} |`);
writeFileSync(new URL('../docs/KEYMAP.md', import.meta.url), `# מיפוי מקשים — PicoCalc ⇒ פעולות הקופה

נוצר אוטומטית מ-\`engine/keymap.mjs\` (\`node tools/keymap-doc.mjs\`) — לא לערוך ידנית.
כל 67 המקשים הפיזיים פעילים. הקוד במכשיר ממפה כל מקש פיזי לשם המקש במנוע (\`engine/register.mjs\` → \`press(st, k)\`).
התמונה: \`docs/customer/img/keyboard.png\` (הדמיה — מדבקות על תמונת היצרן; מקשי המוצרים בדוגמה של חנות בגדים).

| מקש פיזי | מדבקה | \`k\` במנוע | צבע |
|---|---|---|---|
${rows.join('\n')}

- **מקשים מהירים (Q1–Q30):** כל לקוח בוחר מוצר לכל מקש בדף הניהול (⌨ מקשים מהירים) ומדפיס משם מדבקות 12×12 מ"מ.
- **מקשים ישירים (צהוב):** אותן פעולות כמו בתפריט; סגירת יום / מגירה / שעון — עם קוד מנהל. החלפת קוד מנהל — רק מהתפריט (7).

⚠️ לבדוק במכשיר: שה-STM32 של המקלדת מדווח Shift שמאלי/ימני, Ctrl, Alt ו-CapsLK כלחיצות נפרדות (ולא רק כמצב). אם לא — מעבירים את הפעולות למקשים אחרים ב-\`engine/keymap.mjs\` ומייצרים מחדש מדבקות, מדריך ותיעוד.
`);
console.log('docs/KEYMAP.md', allKeys().length, 'keys');
