import { PALETTE } from '../atoms/palette.mjs';
import { WIRING, cssFor } from './theme.mjs';
let f = 0;
const light = cssFor('light'), dark = cssFor('dark');
const roles = Object.keys(WIRING.light).length;
if ((light.match(/--/g) || []).length !== roles) { console.error('✗ חסרים תפקידים ב-CSS'); f = 1; }
if (light === dark ? false : !dark.length) { console.error('✗ מצב-לילה ריק'); f = 1; }
// כפתור-הצבע: מחליפים את הפיגמנט הכי-מחווט ⇒ כל מופעיו מתחלפים, אפס אחרים
const counts = {}; Object.values(WIRING.light).forEach(k => counts[k] = (counts[k] || 0) + 1);
const [busiest, uses] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
const pink = cssFor('light', { [busiest]: 'hotpink' });
const pinkCount = (pink.match(/hotpink/g) || []).length;
if (pinkCount !== uses) { console.error(`✗ כפתור-הצבע: ציפינו ${uses} החלפות, קיבלנו ${pinkCount}`); f = 1; }
const diff = light.split('\n').filter((l, i) => l !== pink.split('\n')[i]).length;
if (diff !== uses) { console.error(`✗ השתנו שורות שלא-קשורות (${diff}≠${uses})`); f = 1; }
try { cssFor('neon'); console.error('✗ מצב-לא-מוכר לא זרק'); f = 1; } catch {}
try { cssFor('light', undefined); } catch { console.error('✗ ברירת-מחדל נשברה'); f = 1; }
if (f) process.exit(1);
console.log(`✓ קופסת-ערכה: ${roles} תפקידים × 2 מצבים · כפתור-הצבע: פיגמנט-אחד ⇒ ${uses} תפקידים התחלפו, אפס זליגה`);
