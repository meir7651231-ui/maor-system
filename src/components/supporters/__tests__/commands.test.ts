/**
 * ratchet — מנוע שכבת-הפיקוד (קופיילוט ⌘K). הפקודות עוטפות פעולות קיימות בלבד;
 * המנוע טהור (מתאר בלבד). כיסוי: בנייה-לפי-דגלים, סינון, דירוג, כרטיסי-תורם.
 */
import { describe, expect, it } from 'vitest';
import { buildCommands, filterCommands, type CommandContext } from '../commands';
import viewSrc from '../SupportersView.tsx?raw';
import paletteSrc from '../CommandPalette.tsx?raw';

function ctx(over: Partial<CommandContext> = {}): CommandContext {
  return {
    supporters: [
      { id: 'a', name: 'אברהם כהן', phone: '050-1111111' },
      { id: 'b', name: 'שרה לוי', phone: '052-2222222' },
    ],
    cockpitOn: true,
    importOn: true,
    customReportOn: true,
    dedupCount: 3,
    paymentsOn: true,
    supporterTerm: 'תומך/ת',
    ...over,
  };
}

describe('💛 ratchet — מנוע הפקודות', () => {
  it('buildCommands: פעולות סטטיות לפי דגלים + כרטיס לכל תורם', () => {
    const cmds = buildCommands(ctx());
    const kinds = cmds.map((c) => c.kind);
    expect(kinds).toContain('add');
    expect(kinds).toContain('work');
    expect(kinds).toContain('data');
    expect(kinds).toContain('import');
    expect(kinds).toContain('customreport');
    expect(kinds).toContain('dedup');
    expect(kinds).toContain('incoming');
    expect(kinds).toContain('nedarim');
    // כרטיס לכל תורם
    expect(cmds.filter((c) => c.kind === 'openDonor').map((c) => c.arg)).toEqual(['a', 'b']);
  });

  it('דגלים כבויים ⇒ הפקודה נעדרת', () => {
    const cmds = buildCommands(ctx({ cockpitOn: false, importOn: false, dedupCount: 0, paymentsOn: false, customReportOn: false }));
    const kinds = cmds.map((c) => c.kind);
    expect(kinds).not.toContain('work');
    expect(kinds).not.toContain('import');
    expect(kinds).not.toContain('dedup');
    expect(kinds).not.toContain('incoming');
    expect(kinds).not.toContain('customreport');
    // הוספה תמיד קיימת
    expect(kinds).toContain('add');
  });

  it('add נושא את מונח-הורטיקל', () => {
    const cmds = buildCommands(ctx({ supporterTerm: 'לקוח' }));
    expect(cmds.find((c) => c.kind === 'add')?.label).toBe('➕ הוספת לקוח');
  });

  it('filterCommands: שאילתה ריקה ⇒ פעולות בראש (בלי כרטיסי-תורם)', () => {
    const cmds = buildCommands(ctx());
    const res = filterCommands(cmds, '');
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((c) => c.kind !== 'openDonor')).toBe(true);
  });

  it('filterCommands: חיפוש-שם מוצא את הכרטיס; רב-מילתי דורש את כל האסימונים', () => {
    const cmds = buildCommands(ctx());
    expect(filterCommands(cmds, 'שרה').map((c) => c.arg)).toContain('b');
    expect(filterCommands(cmds, 'אברהם כהן').map((c) => c.arg)).toEqual(['a']);
    // אסימון שלא קיים ⇒ אין תוצאה
    expect(filterCommands(cmds, 'אברהם זזז').length).toBe(0);
  });

  it('filterCommands: חיפוש-טלפון על ספרות מוצא כרטיס', () => {
    const cmds = buildCommands(ctx());
    expect(filterCommands(cmds, '052').map((c) => c.arg)).toContain('b');
  });

  it('filterCommands: דירוג — התאמת-פעולה מדויקת קודמת; מכבד limit', () => {
    const cmds = buildCommands(ctx());
    const res = filterCommands(cmds, 'ייבוא');
    expect(res[0].kind).toBe('import');
    expect(filterCommands(cmds, '', 3).length).toBe(3);
  });
});

describe('💛 ratchet — חיווט הפלטה (⌘K, opt-in)', () => {
  it('🛡 ⌘K פותח את הפלטה, מגודר cockpitOn בלבד', () => {
    expect(viewSrc).toContain("(e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')");
    expect(viewSrc).toContain('if (!cockpitOn) return;');
    // הפלטה נפרסת רק כש-opt-in פעיל
    expect(viewSrc).toContain('cockpitOn && paletteOpen ? (');
  });

  it('🛡 הפלטה מריצה פעולות קיימות דרך runCommand (kind→setter)', () => {
    expect(viewSrc).toContain('const runCommand = (c: Command)');
    expect(viewSrc).toContain("case 'openDonor': if (c.arg) setSelId(c.arg); break;");
    expect(viewSrc).toContain('onRun={runCommand}');
  });

  it('🛡 הפלטה נהוגה מהמנוע הטהור (buildCommands/filterCommands)', () => {
    expect(paletteSrc).toContain('buildCommands(');
    expect(paletteSrc).toContain('filterCommands(');
  });
});
