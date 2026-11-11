// ratchet · לילה 11.11.2026 — גאדג'טים ומודאלים-לפי-פעולה מחוץ לבנדל-הכניסה.
//
// הרקע: בנדל-הכניסה עמד על 89% מתקרת ה-gzip. קיר-ההשפעה, טיימר-הכסף, הקופה הרושמת,
// מפת-הטיפול, איחוד-כפולים, פלטת-הפקודות וצ׳אט-התמיכה/צוות יובאו סטטית ב-App — ~150KB
// גולמי שכל לקוח הוריד למרות שהם נפתחים רק בלחיצה/hash. עכשיו React.lazy + Suspense.
// הבדיקה נועלת: (1) אין import סטטי שלהם ב-App · (2) כל אחד lazy · (3) כל שימוש עטוף Suspense.
import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';

const LAZY: Array<[string, string]> = [
  ['ImpactWall', 'components/wall/ImpactWall'],
  ['MoneyTimer', 'components/timer/MoneyTimer'],
  ['CashRegister', 'components/timer/CashRegister'],
  ['BodyMap', 'components/timer/BodyMap'],
  ['DedupModal', 'components/families/DedupModal'],
  ['CommandPalette', 'components/palette/CommandPalette'],
  ['SupportChatModal', 'components/support/SupportChat'],
  ['SupportInbox', 'components/support/SupportChat'],
  ['TeamChatModal', 'components/support/SupportChat'],
];

describe('lazy-gadgets — מודאלים-לפי-פעולה נטענים עצל', () => {
  it.each(LAZY)('%s — בלי import סטטי, מוגדר lazy', (name, path) => {
    expect(appSrc).not.toMatch(new RegExp(`^import [^;]*from '\\./${path}';`, 'm'));
    expect(appSrc).toMatch(new RegExp(`^const ${name} = lazy\\(`, 'm'));
  });

  it.each(LAZY)('%s — כל רינדור עטוף ב-<Suspense>', (name) => {
    const uses = [...appSrc.matchAll(new RegExp(`<${name}[\\s/>]`, 'g'))];
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) {
      const before = appSrc.slice(Math.max(0, (u.index ?? 0) - 60), u.index);
      expect(before).toContain('<Suspense fallback={null}>');
    }
  });

  it('החימום-ב-idle מוריד את הגאדג׳טים הדלוקים (פתיחה מיידית — אין מצב "לחצתי ולא קרה כלום")', () => {
    expect(appSrc).toMatch(/for \(const g of Object\.values\(GADGET_LOADERS\)\)/);
    expect(appSrc).toContain('if (featureOn(st.config, g.flag)) void g.load()');
  });
});
