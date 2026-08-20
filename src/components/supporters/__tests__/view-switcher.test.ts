/**
 * ratchet — בורר-המבטים המאוחד. מאגד את מבטי-מסך-התורמים לרכיב-סגמנט אחד, מגודר
 * פר-דגל, ולא-מרונדר כשאין מבטי-על (הלקוח-החי נשאר ביט-זהה).
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import switcherSrc from '../SupportersViewSwitcher.tsx?raw';

describe('💛 ratchet — בורר-מבטים מאוחד', () => {
  it('🛡 הרכיב מחווט במסך-התורמים במקום כפתורים מפוזרים', () => {
    expect(viewSrc).toContain('<SupportersViewSwitcher');
    expect(viewSrc).toContain("key: 'work'");
    expect(viewSrc).toContain("key: 'intel'");
    expect(viewSrc).toContain("key: 'galaxy'");
    // הבחירה מנתבת לסטייטים הקיימים (בלי לשבור את מנגנון ה-early-return)
    expect(viewSrc).toContain('setWorkMode(true)');
    expect(viewSrc).toContain('setIntelMode(true)');
    expect(viewSrc).toContain('setGalaxyMode(true)');
  });

  it('🛡 כל מבט-על מגודר בדגל-ה-opt-in המפורש שלו', () => {
    expect(viewSrc).toContain('cockpitOn ? [{');
    expect(viewSrc).toContain('intelOn ? [{');
    expect(viewSrc).toContain('galaxyOn ? [{');
  });

  it('🛡 בורר עם מבט-יחיד (data בלבד) לא-מרונדר ⇒ אפס-שינוי ללקוח-החי', () => {
    expect(switcherSrc).toContain('props.options.length <= 1');
    expect(switcherSrc).toContain('return null');
  });
});
