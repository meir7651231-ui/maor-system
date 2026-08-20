/**
 * ratchet — חיווט חלון-העבודה (הקוקפיט) למסך התורמים. הגנות-מקור על שני
 * אינווריאנטים קריטיים:
 *  1. **opt-in מפורש** — הגידור הוא `=== true`, לא featureOn (שברירת-המחדל שלו
 *     'on' ⇒ היה מדליק את הקוקפיט לכל לקוח-חי). זו הנעילה שמבטיחה אפס-השפעה.
 *  2. מתג דו-כיווני + ניתוב-לכרטיס + נהיגה מהמנוע הטהור.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import cockpitSrc from '../SupportersCockpit.tsx?raw';

describe('💛 ratchet — חיווט הקוקפיט (opt-in, אפס-השפעה על החי)', () => {
  it('🛡 הגידור opt-in מפורש: === true, ולא featureOn (שהיה מדליק לכולם)', () => {
    expect(viewSrc).toContain("config.features?.['supporters.cockpit'] === true");
    // אסור: featureOn על הדגל ⇒ ברירת-מחדל 'on' ⇒ נחשף לכל לקוח-חי
    expect(viewSrc).not.toContain("featureOn(config, 'supporters.cockpit')");
  });

  it('🛡 מתג דו-כיווני: כניסה לחלון-העבודה ויציאה למסך-הנתונים', () => {
    expect(viewSrc).toContain('setWorkMode(true)');
    expect(viewSrc).toContain('setWorkMode(false)');
    expect(viewSrc).toContain('🎯 חלון העבודה');
    expect(viewSrc).toContain('☰ מסך הנתונים');
  });

  it('🛡 הקוקפיט נפרס רק כש-opt-in וגם במצב-עבודה, ומנתב לכרטיס דרך setSelId', () => {
    expect(viewSrc).toContain('if (cockpitOn && workMode) {');
    expect(viewSrc).toContain('<SupportersCockpit');
    expect(viewSrc).toContain('onOpen={(id) => setSelId(id)}');
    // הרשימה שמוזנת לקוקפיט מכבדת את הרשאת-הייעוד (אפס-דליפה)
    expect(viewSrc).toContain('visibleSupportersForDesignations(db.supporters, desigLimit)');
  });

  it('🛡 הקוקפיט נהוג מהמנוע הטהור בלבד (cockpitQueue/cockpitKpis)', () => {
    expect(cockpitSrc).toContain('cockpitKpis(');
    expect(cockpitSrc).toContain('cockpitQueue(');
    expect(cockpitSrc).toContain('cockpitProgress(');
  });

  it('🛡 פעולות-הקשר מגודרות כמו בשאר המסך (whatsapp · click2call)', () => {
    expect(cockpitSrc).toContain("integrationOn(config, 'whatsapp')");
    expect(cockpitSrc).toContain("featureOn(config, 'supporters.click2call')");
  });
});
