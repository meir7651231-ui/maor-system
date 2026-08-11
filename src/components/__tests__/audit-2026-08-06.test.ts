/**
 * ratchet — הביקורת המקיפה 6.8.2026 (אחרי לולאת-ה-UX א׳–ז׳, PRs ‏#86–#100):
 * ‏4 סוכני-ביקורת מקבילים (אובדן-יכולת · שבירות · דגלים · תיעוד) — כל ממצא
 * מאומת קיבל תיקון + שימור כאן. הבאג מתועד ליד כל בדיקה.
 */
import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';
import backupSrc from '../settings/BackupSection.tsx?raw';
import securitySrc from '../settings/SecuritySection.tsx?raw';
import encSrc from '../settings/EncryptionSection.tsx?raw';
import eventSrc from '../calendar/EventModal.tsx?raw';
import famFormSrc from '../families/FamilyForm.tsx?raw';
import hebDateSrc from '../HebDateInput.tsx?raw';
import bulkSrc from '../shop/BulkAssignModal.tsx?raw';
import homeViewSrc from '../home/HomeView.tsx?raw';
import widgetsSrc from '../home/widgets.tsx?raw';
import settingsSrc from '../settings/SettingsView.tsx?raw';
import paletteSrc from '../palette/CommandPalette.tsx?raw';

describe('🛡 ביקורת 6.8 — רגרסיית גידור-המורה', () => {
  it('מודאל "כל המסכים" לא מציע הגדרות לתפקיד-מורה (אותו שער של ⚙️)', () => {
    // הבאג: [...nav, NAV[NAV.length-1]] הוסיף את ההגדרות ללא-תנאי — מורה הגיע
    // לייבוא/גיבוי/איפוס דרך "עוד" והניווט-התחתון, עוקף את שלושת השלדים.
    expect(appSrc).toContain('...(isTeacherUser ? [] : [NAV[NAV.length - 1]])');
    expect(appSrc).not.toContain('[...nav, NAV[NAV.length - 1]]');
  });
});

describe('🛡 ביקורת 6.8 — הקשחת מודאל-השחזור', () => {
  it('פענוח עטוף try/catch (חריגת קובץ-פגום מוצגת, לא קופאת) + busy בזמן PBKDF2', () => {
    // הבאג: decryptBackupFile זורק על תוכן-פגום/גרסה-חדשה (הסוד נכון!) —
    // החריגה ברחה מ-tryDecrypt והמודאל קפא בלי שום חיווי.
    expect(backupSrc).toMatch(/try \{[\s\S]{0,700}decryptBackupFile[\s\S]{0,700}\} catch \(err\) \{/);
    expect(backupSrc).toContain("busy ? 'מפענח…' : 'פענוח והמשך'");
    expect(backupSrc).toContain('disabled={!pw.trim() || busy}');
    // הקלדה מנקה כישלון-קודם — כשל-שני נבדל מהראשון
    expect(backupSrc).toContain('if (restore.fail) setRestore({ ...restore, fail: false })');
  });
});

describe('🛡 ביקורת 6.8 — מגן-דאבל-טאפ על הכפתורים החמושים', () => {
  it('הסרת-PIN וכיבוי-הצפנה מתעלמים מאישור <400ms מהחימוש (דפוס EventModal)', () => {
    // הבאג: דאבל-טאפ טבעי חימש וביצע באותה מחווה — ה-confirm הילידי שהוחלף
    // היה דווקא חסין לזה; רגרסיית-בטיחות על שני הכפתורים ההרסניים בהגדרות.
    expect(securitySrc).toMatch(/Date\.now\(\) - removeArmedAt\.current < 400\) return/);
    expect(encSrc).toMatch(/Date\.now\(\) - disArmedAt\.current < 400\) return/);
  });
});

describe('🛡 ביקורת 6.8 — עריכת-אירוע לא מוחקת שדות-קישור', () => {
  it('save פורס את האירוע הקיים לפני הדריסות (spId, mainEventId שורדים)', () => {
    // הבאג (קדם-קיים): next נבנה משדות-הטופס בלבד — עריכת אירוע מהלוח מחקה
    // spId (מעקב-עי"ן) ו-mainEventId (פגישת-חנות ⇒ שחרור-החדר נשבר).
    // ‏11.8: ‏...(ev ?? {}) ⇒ ‏...ev — פריסה זהה (null נבלע), בלי אזהרת lint
    expect(eventSrc).toMatch(/const next: OrgEvent = \{\s*\n\s*\/\/[^\n]*\n\s*\.\.\.ev,/);
  });
});

describe('🛡 ביקורת 6.8 — שדה אחד, פעם אחת (FamilyForm)', () => {
  it('ת"ז-האב ושם-האם מרונדרים בדיוק פעם אחת', () => {
    // הבאג: קיפול סבב-ה׳ השאיר את שניהם גם בליבה וגם בקיפול — שני inputs
    // לאותו state (בלבול + a11y).
    expect(famFormSrc.match(/label=\{'ת"ז האב'\}/g) ?? []).toHaveLength(1);
    expect(famFormSrc.match(/label="שם האם"/g) ?? []).toHaveLength(1);
  });
});

describe('🛡 ביקורת 6.8 — תאריך עברי חלקי לא נשמר בשקט', () => {
  it('HebDateInput מציג רמז כשחודש נוקה (אדר↔אדר א׳/ב׳); חלוקה-המונית דורשת תאריך', () => {
    // הבאג: החלפת-שנה ניקתה את החודש בלי רמז — ההורה שמר את התאריך הקודם;
    // ובחלוקה-המונית save לא בדק תאריך ⇒ date:'' נכתב לכל המימושים.
    expect(hebDateSrc).toContain('setPartial(!!props.value)');
    expect(hebDateSrc).toContain('השלימו יום/חודש/שנה');
    expect(bulkSrc).toContain("if (!date) return setError('בחרו תאריך לחלוקה')");
  });
});

describe('🛡 ביקורת 6.8 — פריסה מלאה כשעריכת-הלוח כבויה', () => {
  it('home.board:false ⇒ הפריסה ההיסטורית (10) — הווידג׳טים מגודרי-הדגל לא אובדים', () => {
    // הבאג (סמוי): ההרזיה 10⇒6 של סבב-ג׳ נשענה על "מוסיפים בקליק"; בלי עריכת-לוח
    // ארבעת הווידג'טים (קרוסלה/קהילה/מדדי-חוגים/מדדי-אמינות) איבדו כל מסלול-הגעה.
    expect(widgetsSrc).toMatch(/FULL_LAYOUTS[\s\S]{0,200}'carousel'[\s\S]{0,120}'community', 'coursemetrics', 'credmetrics'/);
    expect(homeViewSrc).toContain('boardOn ? defaultLayoutFor(config.theme) : noBoardLayoutFor(config.theme)');
  });
});

describe('🛡 ביקורת 6.8 — אפס צ׳יפים-מתים בהגדרות', () => {
  it('כל סעיף מגודר-רינדור נושא feature זהה גם בצ׳יפ (ערכה/התראות/גיבוי/נגישות)', () => {
    for (const pair of [
      "{ id: 'sec-theme', label: 'ערכת נושא', feature: 'settings.theme' }",
      "{ id: 'sec-notif', label: 'התראות', feature: 'settings.notif' }",
      "{ id: 'sec-backup', label: 'גיבוי ושחזור', feature: 'settings.backup' }",
      "{ id: 'sec-access', label: 'נגישות', feature: 'settings.access' }",
    ]) expect(settingsSrc).toContain(pair);
  });
});

describe('🛡 ביקורת 6.8 — שפת-הוספה אחידה גם בפלטה', () => {
  it('פעולות-ההוספה בפלטה בניסוח "➕ הוספת X" והנרדפות נשמרו בחיפוש', () => {
    expect(paletteSrc).toContain("'➕ הוספת אירוע'");
    expect(paletteSrc).toMatch(/'➕ הוספת ' \+ termOf\(config, 'entity\.family'/);
    expect(paletteSrc).toMatch(/'➕ הוספת ' \+ termOf\(config, 'entity\.course'/);
    expect(paletteSrc).toMatch(/'➕ הוספת ' \+ termOf\(config, 'entity\.supporter'/);
    // המונח הישן נשאר כמונח-חיפוש — מי שהתרגל ל"אירוע חדש" עדיין מוצא
    expect(paletteSrc).toContain("'אירוע חדש', 'הוספת אירוע'");
  });
});
