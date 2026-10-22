/**
 * ratchet — נעילת-הדמו + «פתחו אתר משלכם» לשורש-האתר (22.10.2026).
 *
 * דרישת-הבעלים, מילה במילה: «בדמו זה צריך חסום ללא כל אפשרות להורדת מידע ואם רוצים אתר משלך
 * זה שולח אותך למסך הרשמה».
 *
 * הבאגים שנסגרו:
 *  1. בדמו (?org=demo) אפשר היה להוציא מידע: הורדת גיבוי-מלא מהפלטה (Ctrl+K ← «הורדת גיבוי
 *     מלא») ומווידג'ט-הבית, העתקת רשימת-הטלפונים של כיתה, העתקת שמות-לתפילה, פתיחה/שמירה של
 *     קבצים מצורפים בכרטיס-חוג, הדפסת כרטיס-הורה, וכן Ctrl+P/Ctrl+S והעתקה ידנית. שער יציאת-
 *     המידע (lib/exportGate) נחסם רק כש-core.export=false — והדמו לא מכבה אותו.
 *  2. «פתחו אתר משלכם»: מבקר ששיחק באשף בדמו השאיר דריסת-קונפיג (slug=demo) — והשורש הציג לו
 *     שוב את הדמו במקום ההרשמה. (הכרעת-בעלים 22.10: ה-CTA מוביל לשורש-האתר כמו תמיד — מבקר לא-מחובר
 *     מקבל שם את אשף-ההרשמה, ומי שכבר מחובר בדפדפן מקבל את המערכת שלו.)
 *
 * סבב-אימות (אותו יום) — מה שעוד דלף/נשבר אחרי התיקון הראשון:
 *  3. סימון-טקסט לא עבר באירוע-העתקה: Ctrl+A ⇒ גרירה ל-Word/לשונית, «שיתוף/חיפוש» בסרגל-הסימון
 *     בנייד, ותפריט-הלחיצה-הימנית («העתקת כתובת הקישור», «שמירת תמונה בשם») — הכול יצא בלי חסימה.
 *  4. ערוץ-שיתוף: באשף-הדמו אפשר היה להדליק וואטסאפ/מפות/תשלומים — ואז סיכום-ההורה, תזכורות-החוב
 *     (עם סכומים), מסלול-המפות (כתובות-משפחות) וקישור-התשלום (שם+סכום) יצאו ב-URL. גם «הודעה
 *     לכיתה» (לא מגודרת בהרחבה) פתחה wa.me פר-תלמיד.
 *  5. אחרי סירוב-השער הופיעה מיד הודעת-הצלחה («הקבלה ירדה למחשב ✓») — שום קובץ לא ירד, אבל
 *     המבקר (וגם עובד/ת שהמנהל חסם לה ייצוא) קיבל/ה הודעה כוזבת.
 *
 * ביקורת 22.10 (סבב שלישי):
 *  9. השינוי חרג מהדמו: אצל עובד/ת בארגון-פלטפורמה שהמנהל כיבה לה core.export — העתקות/הדפסה שלא
 *     היו בשער (טלפוני-כיתה, כרטיס-הורה, שמות-לתפילה, הצעת-שימור, מכתב-AI, קישור-יומן) נחסמו, קבצים-
 *     מצורפים בכרטיס-החוג איבדו href, וטוסט-ההצלחה שאחרי הסירוב נעלם. החוזה המחמיר לא אושר ⇒ מנעול-
 *     דמו נפרד (setDemoLocked/guardDemo/demoLocked/refusalResult): כל אלה נחסמים **רק בדמו**.
 * 10. בתצוגה-המקדימה של האתר הציבורי בדמו (?site=1) לא היה מגש-הודעות — הסירוב היה שקט; ומגש-ההודעות
 *     (z-index 200) הוסתר מתחת לאשף (300), ל«זרימה-אחת» (260) ולהגדלת-תמונה (1000).
 * 11. תפריט-ההקשר נשאר פתוח בשדות-קלט ממולאים (שם/טלפון/ת"ז של הרשומה) ⇒ «חיפוש ב-Google»/«תרגום».
 * 12. היחיד שחרג מהדמו: נעילת שדה-המזהה באשף נבדקה מה-slug החי. בשורש (בלי ?org=demo), הקלדת 'demo-school'
 *     הפכה את ה-slug ל-'demo' אחרי האות הרביעית ⇒ השדה ננעל לקריאה-בלבד, ההקלדה נעצרה, וכל סשן-השורש נכנס
 *     לנעילת-הדמו. עכשיו הנעילה נקבעת פעם אחת בפתיחת-האשף (demoAtOpen) ⇒ בשורש ההקלדה ממשיכה כמו ב-main.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DEMO_APP_CONTROL_SELECTOR,
  DEMO_DRAG_ALLOWED_SELECTOR,
  DEMO_EDITABLE_SELECTOR,
  DEMO_EXPORT_BLOCKED_MSG,
  DEMO_LOCK_ATTR,
  installDemoLock,
  isDemoSession,
  isPrintOrSaveShortcut,
} from '../../lib/demoLock';
import { setDemoLocked, setExportBlocked } from '../../lib/exportGate';
import { integrationOn, loadOrgConfig } from '../../lib/config';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';
import { downloadCsv as downloadCsvX } from '../../lib/csvx';
import { downloadCsv as downloadCsvR, downloadText } from '../reports/csv';
import { downloadAnnualReport } from '../../lib/annualReport';
import { downloadIcs } from '../../lib/ics';
import { deliverReceipt, downloadReceipt, printReceipt } from '../../lib/receipt';
import { printHtmlDoc } from '../../lib/printDoc';
import { downloadTextFile } from '../builder/handoff';
import waBtnSrc from '../WaBtn.tsx?raw';
import { DialLink } from '../DialLink';
import { ExportLink } from '../ExportLink';
import { useApp } from '../../store/useApp';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BuilderWizard } from '../builder/BuilderWizard';
import { emptyDb } from '../../types/domain';
import appSrc from '../../App.tsx?raw';
import storeSrc from '../../store/useApp.ts?raw';
import configSrc from '../../lib/config.ts?raw';
import ribbonSrc from '../DemoRibbon.tsx?raw';
import wizardSrc from '../builder/BuilderWizard.tsx?raw';

// CSS דרך ?raw חוזר ריק ב-vitest — קוראים מהדיסק
const cssSrc = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8');

/** כל קוד-המקור (בלי בדיקות) — לסריקת נתיבי-יציאה חדשים שלא עוברים בשער. */
const SRC = import.meta.glob(['../../**/*.{ts,tsx}', '!../../**/__tests__/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const file = (suffix: string): string => {
  const hit = Object.entries(SRC).find(([p]) => p.endsWith(suffix));
  if (!hit) throw new Error('missing source ' + suffix);
  return hit[1];
};

/** מיקומי-המופעים של `needle` שאין לפניהם קריאת guardExport()/guardDemo() בחלון של `win` תווים. */
function everyGuarded(src: string, needle: RegExp, win: number): number[] {
  const bad: number[] = [];
  for (const m of src.matchAll(needle)) {
    const i = m.index ?? 0;
    // עם סוגריים — שורת-ה-import לא נחשבת שער. guardDemo = נחסם בדמו (נתיב שלא היה בשער לפני הדמו)
    const before = src.slice(Math.max(0, i - win), i);
    if (!before.includes('guardExport()') && !before.includes('guardDemo()')) bad.push(i);
  }
  return bad;
}

describe('🔒 נעילת-הדמו — שער יציאת-המידע חסום בדמו', () => {
  it('isDemoSession: slug=demo או ?org=demo; לקוח-חי/שורש — לא', () => {
    expect(isDemoSession({ slug: 'demo' }, null)).toBe(true);
    // הגנת-עומק: גם אם המזהה השתנה בתוך האשף, הכתובת ?org=demo עדיין נועלת
    expect(isDemoSession({ slug: 'my-org' }, 'demo')).toBe(true);
    expect(isDemoSession({ slug: 'maor-hachesed' }, 'maor-hachesed')).toBe(false);
    expect(isDemoSession({ slug: 'default' }, null)).toBe(false);
  });

  it('App: השער חסום כש-demo **או** core.export כבוי; הודעת-המנהל מחוץ לדמו לא השתנתה', () => {
    expect(appSrc).toContain('const demo = isDemoSession(config);');
    expect(appSrc).toContain("setExportBlocked(demo || !featureOn(config, 'core.export'), () =>");
    expect(appSrc).toContain("toast(demo ? DEMO_EXPORT_BLOCKED_MSG : '⛔ הוצאת מידע חסומה עבורך על-ידי מנהל הארגון')");
    // מנעול-הדמו הנפרד — נקבע באותו אפקט, מאותו isDemoSession (ביקורת 22.10)
    expect(appSrc).toContain('    setDemoLocked(demo);\n  }, [config]);');
  });

  it('הודעת-הדמו בעברית פשוטה ומזמינה לפתוח אתר משלכם', () => {
    expect(DEMO_EXPORT_BLOCKED_MSG).toContain('בדמו אי אפשר להוריד, להדפיס או להעתיק מידע');
    expect(DEMO_EXPORT_BLOCKED_MSG).toContain('פתחו אתר משלכם');
  });

  it('App מתקין את מנעול-המסמך רק בדמו (Ctrl+P/S, העתקה ידנית, הדפסה מהתפריט)', () => {
    expect(appSrc).toContain('const demoLocked = isDemoSession(config);');
    expect(appSrc).toContain('if (!demoLocked) return;');
    expect(appSrc).toContain('return installDemoLock(() => useApp.getState().toast(DEMO_EXPORT_BLOCKED_MSG));');
    // הדפסה מתפריט-הדפדפן: גיליון-ההדפסה מסתיר את הדף כשהתכונה על ה-root
    expect(cssSrc).toContain(':root[data-demo-lock] body {');
    expect(DEMO_LOCK_ATTR).toBe('data-demo-lock');
  });

  it('קיצורי הדפסה/שמירה מזוהים — גם בפריסה עברית (לפי code); קיצורים אחרים לא', () => {
    expect(isPrintOrSaveShortcut({ key: 'p', ctrlKey: true, metaKey: false })).toBe(true);
    expect(isPrintOrSaveShortcut({ key: 'P', ctrlKey: false, metaKey: true })).toBe(true);
    expect(isPrintOrSaveShortcut({ key: 's', ctrlKey: true, metaKey: false })).toBe(true);
    expect(isPrintOrSaveShortcut({ key: 'פ', code: 'KeyP', ctrlKey: true, metaKey: false })).toBe(true);
    expect(isPrintOrSaveShortcut({ key: 'k', ctrlKey: true, metaKey: false })).toBe(false); // פלטת-הפקודות נשארת
    expect(isPrintOrSaveShortcut({ key: 'p', ctrlKey: false, metaKey: false })).toBe(false);
    expect(isPrintOrSaveShortcut({ key: 'p', ctrlKey: true, metaKey: false, altKey: true })).toBe(false);
  });

  it('installDemoLock: בולע הדפסה/שמירה/העתקה/גזירה, מתריע, ומנקה הכול ביציאה', () => {
    const listeners = new Map<string, (e: unknown) => void>();
    const attrs = new Set<string>();
    const doc = {
      documentElement: { setAttribute: (k: string) => attrs.add(k), removeAttribute: (k: string) => attrs.delete(k) },
      addEventListener: (t: string, fn: (e: unknown) => void) => listeners.set(t, fn),
      removeEventListener: (t: string) => listeners.delete(t),
    } as unknown as Document;
    let blocked = 0;
    const cleanup = installDemoLock(() => blocked++, doc);
    expect(attrs.has(DEMO_LOCK_ATTR)).toBe(true);

    const ev = (extra: Record<string, unknown>) => ({ preventDefault: vi.fn(), stopPropagation: vi.fn(), ctrlKey: false, metaKey: false, key: '', ...extra });
    const print = ev({ key: 'p', ctrlKey: true });
    listeners.get('keydown')!(print);
    expect(print.preventDefault).toHaveBeenCalled();
    const other = ev({ key: 'k', ctrlKey: true });
    listeners.get('keydown')!(other);
    expect(other.preventDefault).not.toHaveBeenCalled();
    const copy = ev({});
    listeners.get('copy')!(copy);
    expect(copy.preventDefault).toHaveBeenCalled();
    const cut = ev({});
    listeners.get('cut')!(cut);
    expect(cut.preventDefault).toHaveBeenCalled();
    expect(blocked).toBe(3);

    cleanup();
    expect(listeners.size).toBe(0);
    expect(attrs.has(DEMO_LOCK_ATTR)).toBe(false);
  });
});

describe('🔒 כל נתיב-יציאה עובר בשער (סגירת העקיפות)', () => {
  afterEach(() => {
    setExportBlocked(false);
    setDemoLocked(false);
  });

  it('גיבוי-מלא: store.exportBackup שואל את מנעול-הדמו לפני כל דבר — מכסה פלטה/ווידג׳ט/הגדרות/איפוס/סוף-יום', () => {
    const body = storeSrc.slice(storeSrc.indexOf('    exportBackup() {'), storeSrc.indexOf('    fixAllPhones() {'));
    const gate = body.indexOf('if (!guardDemo()) return Promise.resolve(false);');
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(body.indexOf('exportBackupFile('));
    expect(gate).toBeLessThan(body.indexOf("logAudit('ייצוא גיבוי מלא'"));
  });

  it('גיבוי-מלא (התנהגות): בדמו ⇒ false, הודעת-הדמו, אפס הורדה/רישום-לוג', async () => {
    useApp.getState().setDb(() => ({ ...emptyDb() }));
    const toasts: string[] = [];
    useApp.setState({ toast: (m: string) => { toasts.push(m); } } as never);
    let notified = 0;
    setExportBlocked(true, () => notified++);
    setDemoLocked(true);
    const before = useApp.getState().db.audit?.length ?? 0;
    const ok = await useApp.getState().exportBackup();
    expect(ok).toBe(false); // ⇒ App לא רושם "גובה היום" (maor_autoexp נכתב רק על ok)
    expect(notified).toBe(1);
    expect(toasts).toEqual([]); // לא הגיע ל-exportBackupFile (שהיה נכשל ומתריע "הגיבוי נכשל")
    expect(useApp.getState().db.audit?.length ?? 0).toBe(before);
  });

  it('גיבוי-מלא מחוץ לדמו (ביקורת 22.10): עובד/ת עם core.export=false — אותו מסלול בדיוק כמו קודם', async () => {
    // 🐛 גרסת-ביניים שאלה את guardExport כאן ⇒ גם מחוץ לדמו ההודעה הגיעה מהשער ולא מהבדיקה הקיימת.
    // עכשיו מנעול-הדמו פתוח ⇒ הבדיקה הקיימת (core.export) היא היחידה: אותה הודעה, אותו false.
    const prevCfg = useApp.getState().config;
    useApp.getState().setDb(() => ({ ...emptyDb() }));
    const toasts: string[] = [];
    useApp.setState({ toast: (m: string) => { toasts.push(m); }, config: { ...DEFAULT_CONFIG, features: { 'core.export': false } } } as never);
    let notified = 0;
    setExportBlocked(true, () => notified++);
    try {
      expect(await useApp.getState().exportBackup()).toBe(false);
      expect(notified).toBe(0); // לא דרך השער
      expect(toasts).toEqual(['⛔ הוצאת מידע חסומה עבורך על-ידי מנהל הארגון']);
    } finally {
      useApp.setState({ config: prevCfg } as never);
    }
  });

  it('גיבוי-סוף-היום ממשיך לדלג על הדמו, והחותמת נכתבת רק כשהקובץ ירד', () => {
    expect(appSrc).toContain("if (useApp.getState().config.slug === 'demo') return; // בדמו אין הורדת-גיבוי אוטומטית למבקר");
    expect(appSrc).toContain("void exportBackup().then((ok) => { if (ok) localStorage.setItem(nsLsKey('maor_autoexp'), today); });");
  });

  it('העתקות שהיו פתוחות: טלפוני-כיתה, שמות-לתפילה, כרטיס-הורה, מכתב-AI, הצעת-שימור, קישור-יומן — נחסמות בדמו בלבד', () => {
    // ביקורת 22.10: guardDemo, לא guardExport — אצל עובד/ת עם core.export=false אלה נשארים כמו קודם
    const cases: [string, string, string][] = [
      ['courses/ClassBroadcast.tsx', 'if (!guardDemo()) return;', 'navigator.clipboard?.writeText(classPhonesText(contacts))'],
      ['supporters/PrayerNames.tsx', 'if (!guardDemo()) return;', 'navigator.clipboard?.writeText(text)'],
      ['courses/ParentCard.tsx', "if (!guardDemo()) return; // 🔒 העתקה", 'navigator.clipboard?.writeText(text)'],
      ['supporters/SupporterDetail.tsx', 'if (!guardDemo()) return; // 🔒 העתקה', '?.writeText(aiDraft)'],
      ['courses/RetentionCenter.tsx', 'if (!guardDemo()) return; // 🔒 העתקה', '?.writeText(draft)'],
      ['calendar/IcsFeedModal.tsx', 'if (!guardDemo()) return;', 'navigator.clipboard.writeText(url)'],
    ];
    for (const [f, guard, copy] of cases) {
      const src = file(f);
      const g = src.indexOf(guard);
      expect(g, f + ': חסר שער').toBeGreaterThan(-1);
      expect(g, f + ': השער אחרי ההעתקה').toBeLessThan(src.indexOf(copy));
      expect(src, f + ': לא היה ב-guardExport לפני הדמו — אסור שיתחיל לשאול את core.export').not.toContain('guardExport');
    }
  });

  it('guardDemo: מחוץ לדמו מתיר תמיד — גם כש-core.export חסום (השער הרגיל לא נוגע בו); בדמו מסרב ומתריע', async () => {
    const { guardDemo, guardExport, demoLocked } = await import('../../lib/exportGate');
    let notified = 0;
    setExportBlocked(true, () => notified++);
    expect(guardDemo()).toBe(true);
    expect(demoLocked()).toBe(false);
    expect(notified).toBe(0);
    expect(guardExport()).toBe(false); // השער הרגיל — כמו תמיד
    expect(notified).toBe(1);
    setDemoLocked(true);
    expect(guardDemo()).toBe(false);
    expect(demoLocked()).toBe(true);
    expect(notified).toBe(2);
  });

  it('הדפסת כרטיס-הורה (iframe משלה) נחסמת בדמו לפני יצירת ה-iframe', () => {
    const src = file('courses/ParentCard.tsx');
    const fn = src.slice(src.indexOf('function printSummary('));
    expect(fn.indexOf('if (!guardDemo()) return;')).toBeGreaterThan(-1);
    expect(fn.indexOf('if (!guardDemo()) return;')).toBeLessThan(fn.indexOf("document.createElement('iframe')"));
  });

  it('קבצים מצורפים בכרטיס-חוג: דרך ExportLink — בלי href בדמו (גם לא לחיצה-אמצעית/שמירה-בשם)', () => {
    expect(file('courses/CourseDetail.tsx')).toContain('<ExportLink');
    const field = file('courses/CourseFilesField.tsx');
    expect(field).toContain('<ExportLink');
    // מחוץ לדמו הטופס שומר את השער ההיסטורי שלו (core.export) — אותו onClick כמו קודם
    expect(field).toContain('<ExportLink href={f.data} onClick={(e) => { if (!guardExport()) e.preventDefault(); }}');
    const link = file('/ExportLink.tsx');
    expect(link).toContain('if (!demoLocked()) {');
    expect(link).toContain('<a href={props.href} target="_blank" rel="noopener noreferrer" title={props.title} onClick={props.onClick} style={props.style}>');
    // אף <a> גולמי לא מצביע על קובץ-שמור (file.data / f.data)
    for (const [p, src] of Object.entries(SRC)) {
      expect(/<a\s[^>]*?href=\{[\w.]+\.data\}/.test(src), p + ': <a href={….data}> בלי שער').toBe(false);
    }
  });

  it('ExportLink (התנהגות): מחוץ לדמו — אותו <a> בדיוק, גם כש-core.export חסום; בדמו — בלי href, הקשה ⇒ הודעה', () => {
    type El = { type: unknown; props: Record<string, unknown> };
    let notified = 0;
    setExportBlocked(true, () => notified++); // עובד/ת שהייצוא חסום לה — לא נוגע ב-ExportLink
    const own = vi.fn();
    const live = ExportLink({ href: 'data:application/pdf;base64,AAA', onClick: own, children: 'f.pdf' }) as unknown as El;
    expect(live.type).toBe('a');
    expect(live.props.href).toBe('data:application/pdf;base64,AAA');
    expect(live.props.target).toBe('_blank');
    expect(live.props.rel).toBe('noopener noreferrer');
    expect(live.props.onClick).toBe(own); // ה-onClick של הקורא בלבד (CourseDetail: אין; הטופס: guardExport)
    expect(live.props.role).toBeUndefined();
    expect(live.props.tabIndex).toBeUndefined();
    expect(live.props.onKeyDown).toBeUndefined();
    expect(live.props.onAuxClick).toBeUndefined();
    const plain = ExportLink({ href: 'https://x.example/f', children: 'f' }) as unknown as El;
    expect(plain.props.onClick).toBeUndefined(); // כרטיס-החוג: קישור גולמי כמו קודם

    setDemoLocked(true);
    const demo = ExportLink({ href: 'data:application/pdf;base64,AAA', onClick: own, children: 'f.pdf' }) as unknown as El;
    expect(demo.props.href).toBeUndefined();
    expect(demo.props.target).toBeUndefined();
    expect(demo.props.role).toBe('link');
    expect(demo.props.tabIndex).toBe(0);
    const click = { preventDefault: vi.fn(), key: 'Enter' };
    (demo.props.onClick as (e: unknown) => void)(click);
    expect(click.preventDefault).toHaveBeenCalled();
    expect(own).not.toHaveBeenCalled(); // בדמו — הודעה אחת, לא גם השער של הקורא
    (demo.props.onKeyDown as (e: unknown) => void)({ ...click, preventDefault: vi.fn() });
    expect(notified).toBe(2);
  });

  it('סריקה: כל העתקה ללוח עוברת בשער — חוץ מרשימה סגורה של פריטים שאינם מידע-ארגוני', () => {
    // לא-רשומות ולא-נגישים בדמו: סקריפט-אבחון-רשת, מפתחות-שחזור (חסימה = סכנת-נעילה), קישורי-הזמנה
    const ALLOW = [
      'cloud/NetCheckModal.tsx',
      'settings/EncryptionSection.tsx',
      'settings/CloudEncryptionSection.tsx',
      'platform/PlatformPanel.tsx',
      'platform/ManagerPanel.tsx',
    ];
    const bad: string[] = [];
    for (const [p, src] of Object.entries(SRC)) {
      if (ALLOW.some((a) => p.endsWith(a))) continue;
      if (everyGuarded(src, /navigator\.clipboard\b/g, 700).length) bad.push(p);
    }
    expect(bad).toEqual([]);
  });

  it('סריקה: כל הדפסה וכל הורדת-קובץ עוברות בשער (הגיבוי — בשער של store.exportBackup)', () => {
    const bad: string[] = [];
    for (const [p, src] of Object.entries(SRC)) {
      if (everyGuarded(src, /\.print\(\)/g, 1500).length) bad.push(p + ' (print)');
      // persist.exportBackupFile: השער יושב בקורא היחיד מה-UI (store.exportBackup, נבדק למעלה);
      // רשתות-הביטחון של מיגרציות-הענן דורשות מודול-ענן שהדמו לעולם לא טוען.
      if (!p.endsWith('store/persist.ts') && everyGuarded(src, /\.download = /g, 700).length) bad.push(p + ' (download)');
    }
    expect(bad).toEqual([]);
  });
});

describe('🚪 «פתחו אתר משלכם» ⇒ שורש-האתר (הכרעת-בעלים 22.10)', () => {
  it('הסרט ומודעת-האשף בדמו מקשרים לשורש-האתר (BASE_URL) — בלי פרמטרים', () => {
    // BASE_URL של ה-build הוא './' ⇒ מתוך ?org=demo מגיעים לשורש-האתר בלי ה-query (גם תחת /maor-system/)
    expect(new URL('./', 'https://orbit-il.com/?org=demo').href).toBe('https://orbit-il.com/');
    expect(new URL('./', 'https://x.github.io/maor-system/?org=demo').href).toBe('https://x.github.io/maor-system/');
    expect(ribbonSrc).toContain('href={import.meta.env.BASE_URL}');
    expect(wizardSrc).toContain('href={import.meta.env.BASE_URL}');
    // כל CTA של «אתר משלכם» ב-JSX מקושר לשורש
    for (const [p, src] of Object.entries(SRC)) {
      if (!p.endsWith('.tsx') || !/>\s*(פתחו אתר משלכם|רוצים אתר משלכם)/.test(src)) continue;
      expect(src, p).toContain('href={import.meta.env.BASE_URL}');
    }
  });

  it('האשף בדמו: מזהה-הלקוח נעול (שינוי שלו היה מוציא את הסשן ממצב-הדמו) — נעילה שנקבעת בפתיחה', () => {
    // 🐛 ביקורת 22.10 (#12): הנעילה נבדקה מה-slug החי (isDemo) ⇒ בשורש, הקלדת 'demo-school' נעצרה ב-'demo'.
    // עכשיו: נקבעת פעם אחת בפתיחת-האשף (useState עם מאתחל, בלי setter ⇒ לא משתנה עד סגירה).
    expect(wizardSrc).toContain('const [demoAtOpen] = useState(() => isDemoSession(config));');
    expect(wizardSrc).toContain('readOnly={demoAtOpen}');
    expect(wizardSrc).toContain('if (demoAtOpen) return;\n                  setSlugTouched(true);');
    expect(wizardSrc).not.toMatch(/setDemoAtOpen/);
    expect(wizardSrc).not.toContain('readOnly={isDemo}');
    expect(wizardSrc).not.toContain('if (isDemo) return;');
  });

  it('האשף שנפתח מחוץ לדמו (שורש): מזהה עם תחילית demo מוקלד עד הסוף — כמו ב-main', () => {
    // בשורש (בלי ?org=demo, slug=default) הנעילה כבויה בפתיחה ⇒ השדה בלי readOnly וההרחבות קיימות —
    // והיא לא נדלקת כשה-slug עובר דרך 'demo' בזמן ההקלדה (demoAtOpen קבוע; onChange בודק רק אותו).
    expect(isDemoSession({ slug: 'default' }, null)).toBe(false);
    const html = renderToStaticMarkup(createElement(BuilderWizard, { onClose: () => {} }));
    const slugInput = html.match(/<label for="[^"]+">מזהה לקוח[^<]*<\/label>(<input[^>]*>)/)?.[1] ?? '';
    expect(slugInput).toContain('value="default"');
    expect(slugInput).not.toMatch(/readonly/i);
    expect(html).toContain('id="wz-integrations"');
    expect(html).toContain('🔌 הרחבות');
    // השדה עצמו: בלי שום בדיקה של ה-slug החי בין ההקשה לכתיבה — 'demo-school' עובר את ה-sanitize כמות-שהוא
    const field = wizardSrc.slice(wizardSrc.indexOf('<Field label="מזהה לקוח (לועזי, לכתובת)">'));
    const onChange = field.slice(field.indexOf('onChange={(v) => {'), field.indexOf('dir="ltr"'));
    expect(onChange).not.toMatch(/isDemo\b|config\.slug/);
    const sanitize = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    expect(onChange).toContain("patch({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') });");
    expect(sanitize('demo-school')).toBe('demo-school');
    expect(sanitize('Demos')).toBe('demos');
  });

  it('האשף שנפתח בדמו (?org=demo): המזהה לקריאה-בלבד ואין מקטע-הרחבות', () => {
    vi.stubGlobal('window', { location: { search: '?org=demo', hash: '' } });
    try {
      const html = renderToStaticMarkup(createElement(BuilderWizard, { onClose: () => {} }));
      const slugInput = html.match(/<label for="[^"]+">מזהה לקוח[^<]*<\/label>(<input[^>]*>)/)?.[1] ?? '';
      expect(slugInput).toMatch(/readonly/i);
      expect(html).not.toContain('id="wz-integrations"');
      expect(html).not.toContain('🔌 הרחבות');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('🚪 loadOrgConfig — דריסת-הדמו לא דולפת לשורש', () => {
  const ROOT = { slug: 'default', orgName: '', theme: 'or-rishon', modules: {}, features: {}, firebase: { apiKey: 'k', authDomain: 'd', projectId: 'p', appId: 'a' } };
  const DEMO_OVERRIDE = { slug: 'demo', orgName: 'מרכז הדגמה', theme: 'kehila', modules: {}, features: {} };
  function stub(search: string, override: unknown) {
    const store = new Map<string, string>([['maor_org_config', JSON.stringify(override)]]);
    vi.stubGlobal('window', { location: { search } });
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ROOT })));
  }
  afterEach(() => vi.unstubAllGlobals());

  it('שורש + דריסה של הדמו (slug=demo) ⇒ קונפיג-השורש (עם הענן ⇒ מסך-ההרשמה)', async () => {
    stub('', DEMO_OVERRIDE);
    const cfg = await loadOrgConfig();
    expect(cfg.slug).toBe('default');
    expect(cfg.firebase?.projectId).toBe('p');
  });

  it('דריסה רגילה בשורש (לא דמו) — ביט-זהה: עדיין גוברת', async () => {
    stub('', { ...DEMO_OVERRIDE, slug: 'default', orgName: 'אשף מקומי' });
    const cfg = await loadOrgConfig();
    expect(cfg.orgName).toBe('אשף מקומי');
    expect(configSrc).toContain("const demoLeak = !slug && override?.slug === 'demo';");
  });
});

describe('🔒 סבב-אימות · סימון-טקסט, גרירה ותפריט-הקשר (יציאה שלא עוברת באירוע-העתקה)', () => {
  /** אלמנט מדומה: closest מחזיר התאמה רק לסלקטורים שברשימה. */
  const el = (...inside: string[]) => ({ closest: (s: string) => (inside.includes(s) ? {} : null) });
  /** יעד בתוך שדה-קלט: closest(שדה) מחזיר את השדה עצמו (value/textContent). */
  const inField = (field: Record<string, unknown>, ...also: string[]) => ({
    closest: (s: string) => (s === DEMO_EDITABLE_SELECTOR ? field : also.includes(s) ? {} : null),
  });

  it('installDemoLock: גרירה מבוטלת (חוץ מידיות [draggable="true"]); תפריט-הקשר נבלע — גם בשדה ממולא', () => {
    const listeners = new Map<string, (e: unknown) => void>();
    const doc = {
      documentElement: { setAttribute: () => {}, removeAttribute: () => {} },
      addEventListener: (t: string, fn: (e: unknown) => void, capture?: boolean) => {
        expect(capture, t + ': חייב capture (לפני כל מאזין של האפליקציה)').toBe(true);
        listeners.set(t, fn);
      },
      removeEventListener: (t: string) => listeners.delete(t),
    } as unknown as Document;
    let blocked = 0;
    const cleanup = installDemoLock(() => blocked++, doc);
    const ev = (target: unknown) => ({ target, preventDefault: vi.fn(), stopPropagation: vi.fn() });

    // גרירת טקסט מסומן (יעד = צומת-טקסט בלי closest) / קישור / תמונה ⇒ מבוטלת + הודעה
    const textDrag = ev({ nodeType: 3 });
    listeners.get('dragstart')!(textDrag);
    expect(textDrag.preventDefault).toHaveBeenCalled();
    const linkDrag = ev(el());
    listeners.get('dragstart')!(linkDrag);
    expect(linkDrag.preventDefault).toHaveBeenCalled();
    // ידית-הגרירה של לוח-הבית (BoardEdit) — ממשיכה לעבוד
    const handle = ev(el(DEMO_DRAG_ALLOWED_SELECTOR));
    listeners.get('dragstart')!(handle);
    expect(handle.preventDefault).not.toHaveBeenCalled();
    expect(blocked).toBe(2);

    // תפריט-הקשר על טקסט/קישור/תמונה ⇒ נבלע + הודעה
    const menu = ev(el());
    listeners.get('contextmenu')!(menu);
    expect(menu.preventDefault).toHaveBeenCalled();
    expect(blocked).toBe(3);
    // 🐛 ביקורת 22.10: בשדה-קלט ממולא (טפסי-העריכה: שם/טלפון/ת"ז של הרשומה) התפריט נפתח ⇒
    // «חיפוש ב-Google»/«תרגום» הוציאו את התוכן בלי אירוע-העתקה. עכשיו נבלע + הודעה.
    const filled = ev(inField({ value: 'ישראל ישראלי 050-1234567' }));
    listeners.get('contextmenu')!(filled);
    expect(filled.preventDefault).toHaveBeenCalled();
    expect(blocked).toBe(4);
    const filledArea = ev(inField({ value: 'הערה רגישה' }));
    listeners.get('contextmenu')!(filledArea);
    expect(filledArea.preventDefault).toHaveBeenCalled();
    const editable = ev(inField({ textContent: 'טקסט עריך' }));
    listeners.get('contextmenu')!(editable);
    expect(editable.preventDefault).toHaveBeenCalled();
    // שדה בתוך כפתור/כרטיס-לחיץ — עדיין שדה ממולא ⇒ הודעה (לא «פעולת-אפליקציה» שקטה)
    const filledInCard = ev(inField({ value: 'x' }, DEMO_APP_CONTROL_SELECTOR));
    listeners.get('contextmenu')!(filledInCard);
    expect(filledInCard.preventDefault).toHaveBeenCalled();
    expect(blocked).toBe(7);
    // שדה ריק — התפריט נשאר (הדבקה; אין מה להוציא)
    const empty = ev(inField({ value: '' }));
    listeners.get('contextmenu')!(empty);
    expect(empty.preventDefault).not.toHaveBeenCalled();
    const emptyEditable = ev(inField({ textContent: '  ' }));
    listeners.get('contextmenu')!(emptyEditable);
    expect(emptyEditable.preventDefault).not.toHaveBeenCalled();
    // שדה לא-מזוהה (בלי value/textContent) — חוסמים (ברירת-מחדל בטוחה)
    const unknownField = ev(el(DEMO_EDITABLE_SELECTOR));
    listeners.get('contextmenu')!(unknownField);
    expect(unknownField.preventDefault).toHaveBeenCalled();
    expect(blocked).toBe(8);
    // על כפתור (הקופה: לחיצה-ימנית = −1) — נבלע, אבל בלי הודעה
    const onBtn = ev(el(DEMO_APP_CONTROL_SELECTOR));
    listeners.get('contextmenu')!(onBtn);
    expect(onBtn.preventDefault).toHaveBeenCalled();
    expect(blocked).toBe(8);

    cleanup();
    expect(listeners.size).toBe(0);
  });

  it('CSS: בדמו אין סימון-טקסט מחוץ לשדות-הקלט (גם במסך — לא רק בהדפסה), ולחיצה-ארוכה ב-iOS בלי תפריט', () => {
    // שורה בעמודה 0 = מחוץ לבלוק @media print (שם הכללים מוזחים)
    expect(cssSrc).toContain('\n:root[data-demo-lock] body {\n  -webkit-user-select: none;\n  user-select: none;\n  -webkit-touch-callout: none;\n}');
    // שדה לקריאה-בלבד מוחרג מכלל-הסימון (ביקורת 22.10) — אחרת :is() עם [contenteditable] (0,4,0) גובר עליו
    expect(cssSrc).toContain("\n:root[data-demo-lock] :is(input:not([readonly]), textarea:not([readonly]), [contenteditable]:not([contenteditable='false'])) {\n  -webkit-user-select: text;\n  user-select: text;");
    expect(cssSrc).toContain('\n:root[data-demo-lock] :is(input[readonly], textarea[readonly]) {\n  -webkit-user-select: none;\n  user-select: none;\n}');
    expect(DEMO_EDITABLE_SELECTOR).toBe('input, textarea, [contenteditable]:not([contenteditable="false"])');
  });
});

describe('🔒 סבב-אימות · ערוצי-שיתוף (וואטסאפ/מפות/תשלום) סגורים בדמו', () => {
  it('integrationOn: בדמו כבוי תמיד — גם אם הודלק; מחוץ לדמו ביט-זהה (רק enabled:true מדליק)', () => {
    const integrations = { whatsapp: { enabled: true }, maps: { enabled: true }, payments: { enabled: true, payUrl: 'https://pay.example' }, gcal: { enabled: true } };
    const demo = { ...DEFAULT_CONFIG, slug: 'demo', integrations } as OrgConfig;
    const live = { ...DEFAULT_CONFIG, slug: 'maor-hachesed', integrations } as OrgConfig;
    for (const k of Object.keys(integrations)) {
      expect(integrationOn(demo, k), 'demo ' + k).toBe(false);
      expect(integrationOn(live, k), 'live ' + k).toBe(true);
    }
    expect(integrationOn({ ...DEFAULT_CONFIG, slug: 'maor-hachesed' } as OrgConfig, 'whatsapp')).toBe(false);
  });

  it('אשף בדמו: אין מקטע-הרחבות ואין צ׳יפ-ניווט אליו', () => {
    // demoAtOpen (נקבע בפתיחה) — בשורש המקטע לא נעלם כשה-slug עובר דרך 'demo' בהקלדה (ביקורת 22.10 #12)
    expect(wizardSrc).toContain("...(demoAtOpen ? [] : [{ domId: 'wz-integrations', key: 'integrations', label: '🔌 הרחבות' }]),");
    expect(wizardSrc).toContain('{!demoAtOpen && (!searching || intMatches.length > 0) && (');
  });

  it('WaBtn בדמו (גם «הודעה לכיתה» שאינה מגודרת בהרחבה): בלי href; הקשה ⇒ הודעת-השער', () => {
    const start = waBtnSrc.indexOf('if (isDemoSession(config)) {');
    const end = waBtnSrc.indexOf('  return (\n    <a\n      href={link.href}');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const demoBranch = waBtnSrc.slice(start, end);
    expect(demoBranch).not.toContain('href');
    expect(demoBranch).toContain('guardExport(); // חסום בדמו ⇒ הודעת-הדמו');
  });
});

describe('🔒 סבב-אימות · אחרי סירוב-השער — בלי הודעת-הצלחה כוזבת', () => {
  afterEach(() => {
    setExportBlocked(false);
    setDemoLocked(false);
  });

  it('כל עזרי-ההורדה/ההדפסה מחזירים false בסירוב-דמו (ולפני כל גישה ל-DOM)', () => {
    let notified = 0;
    setExportBlocked(true, () => notified++);
    setDemoLocked(true);
    const info = { rid: 'D-1', orgName: 'ארגון', payer: 'תורם', amount: 18, date: '2026-10-22', forWhat: 'תרומה' };
    expect(downloadCsvX('a.csv', [['1']])).toBe(false);
    expect(downloadCsvR('a.csv', [['1']])).toBe(false);
    expect(downloadText('a.txt', ['1'])).toBe(false);
    expect(downloadAnnualReport('a.txt', ['1'])).toBe(false);
    expect(downloadIcs('a.ics', 'BEGIN:VCALENDAR')).toBe(false);
    expect(downloadReceipt(info)).toBe(false);
    expect(printReceipt(info)).toBe(false);
    expect(deliverReceipt(info)).toBe(false);
    expect(deliverReceipt(info, 'pdf')).toBe(false);
    expect(printHtmlDoc('<p>x</p>')).toBe(false);
    expect(downloadTextFile('a.html', '<p>x</p>')).toBe(false);
    expect(notified).toBe(11); // הודעת-השער אחת לכל ניסיון — ורק היא
  });

  it('מחוץ לדמו (ביקורת 22.10): עובד/ת עם core.export=false — העזרים מסרבים כמו תמיד אבל מחזירים true ⇒ הקורא ביט-זהה', () => {
    // 🐛 גרסת-ביניים החזירה false גם כאן ⇒ אצל עובד/ת חסום/ה בארגון-פלטפורמה טוסט-ההצלחה נעלם וחבילת-האשף
    // לא ניסתה את הקובץ השני — שינוי מחוץ לדמו שלא אושר. הסירוב עצמו (אפס הורדה + הודעת-המנהל) — כמו קודם.
    let notified = 0;
    setExportBlocked(true, () => notified++);
    const info = { rid: 'D-1', orgName: 'ארגון', payer: 'תורם', amount: 18, date: '2026-10-22', forWhat: 'תרומה' };
    expect(downloadCsvX('a.csv', [['1']])).toBe(true);
    expect(downloadCsvR('a.csv', [['1']])).toBe(true);
    expect(downloadText('a.txt', ['1'])).toBe(true);
    expect(downloadAnnualReport('a.txt', ['1'])).toBe(true);
    expect(downloadIcs('a.ics', 'BEGIN:VCALENDAR')).toBe(true);
    expect(downloadReceipt(info)).toBe(true);
    expect(printReceipt(info)).toBe(true);
    expect(deliverReceipt(info)).toBe(true);
    expect(deliverReceipt(info, 'pdf')).toBe(true);
    expect(downloadTextFile('a.html', '<p>x</p>')).toBe(true);
    // (בסביבת node אין document — אם העזר לא היה עוצר בשער, היה נזרק ReferenceError)
    expect(notified).toBe(10);
    // printHtmlDoc החזיר false בסירוב עוד לפני נעילת-הדמו (13.10) — לא נגענו
    expect(printHtmlDoc('<p>x</p>')).toBe(false);
  });

  it('סריקה: אף קריאת-הורדה "עירומה" לא ממשיכה ישר לטוסט-הצלחה', () => {
    // 🐛 «הקבלה ירדה למחשב ✓» / «הקובץ ירד» הופיעו מיד אחרי הודעת-החסימה. קריאה שתוצאתה לא נבדקת
    // ואחריה ישר toast/flash = הודעה כוזבת כשהשער מסרב.
    const re = /^[ \t]*(?:downloadCsv|downloadText|downloadTextFile|downloadAnnualReport|downloadIcs|deliverReceipt|downloadReceipt|printReceipt)\([^;]*\);[ \t]*\n[ \t]*(?:toast|flash)\(/gm;
    // הערות-שורה מוסרות קודם (';' בתוך הערה בין הארגומנטים לא מסתיר קריאה); '//' של כתובת בתוך
    // מחרוזת לא נפגע — רק הערה שלפניה רווח/תחילת-שורה
    const noComments = (s: string) => s.replace(/(^|[ \t])\/\/[^\n]*/gm, '$1');
    const bad: string[] = [];
    for (const [p, src] of Object.entries(SRC)) for (const m of noComments(src).matchAll(re)) bad.push(p + ': ' + m[0].replace(/\s+/g, ' ').slice(0, 90));
    expect(bad).toEqual([]);
  });

  it('קבלות: «הקבלה ירדה» רק כשנמסרה בפועל (הרישום עצמו נשאר)', () => {
    const don = file('supporters/DonationModal.tsx');
    expect(don).toContain('delivered = deliverReceipt(info, receiptFmt);');
    expect(don).toContain('if (receiptsOn && delivered) toast(');
    const mm = file('courses/ManageModal.tsx');
    expect(mm).toContain('delivered = deliverReceipt({');
    expect(mm).toContain("if (receiptsOn && delivered) toast('הקבלה ירדה למחשב ✓');");
    expect(mm).toContain('if (!ok) return; // 🔒 סירוב-דמו');
    expect(file('supporters/SupporterDetail.tsx')).toContain('if (!deliverReceipt(info, fmt)) return;');
    // דוח-משפחה (ביקורת 22.10): רישום-הגישה **לפני** ההורדה — כמו תמיד. גרסת-ביניים הקדימה את השער
    // לרישום ⇒ ניסיון של עובד/ת חסום/ה נעלם מלוג-הפעולות של המנהל (TRUST). רק טוסט-ההצלחה תלוי בשער.
    const fp = file('families/FamilyPanels.tsx');
    const fn = fp.slice(fp.indexOf('  function exportReport() {'), fp.indexOf('  function exportReport() {') + 1200);
    const log = fn.indexOf("logAccess('הורדת דוח-משפחה', props.fam.name);");
    expect(log).toBeGreaterThan(-1);
    expect(log).toBeLessThan(fn.indexOf("if (!downloadText('family-'"));
    expect(fn).not.toContain('if (!guardExport()) return;');
  });

  it('דוח-משפחה (התנהגות-מקור): אין return לפני logAccess — גם ניסיון חסום נרשם', () => {
    const fp = file('families/FamilyPanels.tsx');
    const fn = fp.slice(fp.indexOf('  function exportReport() {'));
    const beforeLog = fn.slice(0, fn.indexOf("logAccess('הורדת דוח-משפחה'"));
    expect(beforeLog).not.toMatch(/\breturn\b/);
  });

  it('מחוץ לדמו שום דבר לא זז — גם לא אצל עובד/ת שהמנהל חסם לה ייצוא (ביקורת 22.10); הלקוח-החי — שער פתוח', () => {
    const gate = file('lib/exportGate.ts');
    expect(gate).not.toContain('שינויים **מכוונים** שמורגשים מחוץ לדמו');
    expect(gate).toContain('נחסמים **רק');
    expect(gate).toContain('false **רק בדמו**');
    expect(gate).toContain('export function refusalResult(): boolean {\n  return !demo;\n}');
    expect(gate).toContain('רישום-הגישה של דוח-המשפחה (logAccess) נשאר לפני ההורדה');
    // כל עזרי-ההורדה שהיו בשער מחזירים בסירוב את refusalResult — לא false קשיח
    for (const f of ['lib/csvx.ts', 'reports/csv.ts', 'lib/annualReport.ts', 'lib/ics.ts', 'lib/receipt.ts', 'builder/handoff.ts']) {
      const src = file(f);
      expect(src, f).toContain('if (!guardExport()) return refusalResult();');
      expect(src, f).not.toContain('if (!guardExport()) return false;');
    }
    // הלקוח-החי: קונפיג סטטי בלי core.export ⇒ השער פתוח ⇒ כל נתיב ביט-זהה
    for (const f of ['public/config.json', 'public/c/maor-hachesed/config.json']) {
      const cfg = JSON.parse(readFileSync(new URL('../../../' + f, import.meta.url), 'utf8')) as { features?: Record<string, unknown> };
      expect(cfg.features?.['core.export'], f).toBeUndefined();
    }
  });
});

describe('🔒 ביקורת 22.10 · קישורי-חיוג (tel:) סגורים בדמו — אותו ערוץ כמו וואטסאפ, בלי הטקסט', () => {
  afterEach(() => setExportBlocked(false));

  // 🐛 WaBtn נוטרל בדמו («קישור-וואטסאפ מוציא את הרשומה החוצה»), אבל 📞 tel: נשאר פעיל: בכל שורה של
  // טבלת-התורמים בדמו (supporters.click2call דלוק כברירת-מחדל), ב«זרימה-אחת», בקוקפיט וב-CallBtn
  // (טלפוניה שהמבקר מדליק באשף-הדמו) — הטלפון של הרשומה עבר לחייגן/FaceTime/Skype.

  type El = { type: unknown; props: Record<string, unknown> };
  const ev = () => ({ preventDefault: vi.fn(), stopPropagation: vi.fn(), key: 'Enter' });

  it('DialLink מחוץ לדמו (locked=false): אותו <a href="tel:…"> — בלי role/tabIndex/מקלדת (ביט-זהה)', () => {
    const el = DialLink({ href: 'tel:0501234567', locked: false, className: 'tel-link', title: 't', ariaLabel: 'a', children: '📞' }) as unknown as El;
    expect(el.type).toBe('a');
    expect(el.props.href).toBe('tel:0501234567');
    expect(el.props.className).toBe('tel-link');
    expect(el.props['aria-label']).toBe('a');
    expect(el.props.role).toBeUndefined();
    expect(el.props.tabIndex).toBeUndefined();
    expect(el.props.onKeyDown).toBeUndefined();
  });

  it('DialLink בדמו (locked=true): בלי href; הקשה/Enter ⇒ ביטול + הודעת-השער (ו-onClick של הקורא נשמר)', () => {
    let notified = 0;
    setExportBlocked(true, () => notified++);
    const own = vi.fn();
    const el = DialLink({ href: 'tel:0501234567', locked: true, title: 't', onClick: own, children: '📞' }) as unknown as El;
    expect(el.props.href).toBeUndefined();
    expect(el.props.role).toBe('link');
    expect(el.props.tabIndex).toBe(0);
    const click = ev();
    (el.props.onClick as (e: unknown) => void)(click);
    expect(click.preventDefault).toHaveBeenCalled();
    expect(own).toHaveBeenCalled(); // CallBtn: stopPropagation — השורה לא נפתחת
    const key = ev();
    (el.props.onKeyDown as (e: unknown) => void)(key);
    expect(key.preventDefault).toHaveBeenCalled();
    expect(notified).toBe(2);
  });

  it('כל משטחי-החיוג עוברים דרך DialLink עם isDemoSession; ManageModal — טקסט בלבד בדמו', () => {
    const callBtn = file('/CallBtn.tsx');
    expect(callBtn).toContain('<DialLink');
    expect(callBtn).toContain('locked={isDemoSession(config)}');
    const view = file('supporters/SupportersView.tsx');
    expect(view).toContain('const dialLocked = isDemoSession(config);'); // פעם לרינדור, לא פר-שורה
    expect(view).toContain('dialLocked={dialLocked}');
    expect(view).toContain('<DialLink locked={props.dialLocked} className="tel-link"');
    expect(file('supporters/OneFlow.tsx')).toContain('<DialLink locked={isDemoSession(props.config)}');
    expect(file('supporters/SupportersCockpit.tsx')).toContain('locked={isDemoSession(config)}');
    expect(file('courses/ManageModal.tsx')).toContain('const telOn = telephonyOn(cfg) && !isDemoSession(cfg);');
  });

  it('סריקה: אין <a> גולמי עם href של tel: — חוץ ממשטחי-ענן שהדמו (בלי firebase) לא מגיע אליהם', () => {
    // לוח-הבקרה (מייל-על) וצ׳אט-התמיכה דורשים התחברות-ענן — אין בדמו
    const ALLOW = ['platform/PlatformPanel.tsx', 'support/SupportChat.tsx'];
    const raw = /<a\b[^>]*?\bhref=(?:\{\s*['"`]tel:|"tel:)/g;
    // הערות מוסרות קודם (תיעוד כמו «אותו <a href="tel:…">» ב-DialLink אינו קוד)
    const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[ \t])\/\/[^\n]*/gm, '$1');
    const bad: string[] = [];
    for (const [p, src] of Object.entries(SRC)) {
      if (!p.endsWith('.tsx') || ALLOW.some((a) => p.endsWith(a))) continue;
      if (raw.test(code(src))) bad.push(p);
      raw.lastIndex = 0;
    }
    expect(bad).toEqual([]);
  });

  it('e2e/demo-no-export: tel: נספר כקישור-יציאה, ופרופיל-המקסימום מדליק טלפוניה (CallBtn נבדק גם הוא)', () => {
    const e2e = readFileSync(new URL('../../../e2e/demo-no-export.mjs', import.meta.url), 'utf8');
    expect(e2e).toContain('|sms:|mailto:|tel:)/i.test(h)');
    expect(e2e).toContain("telephony: { enabled: true },");
  });
});

describe('🔒 ביקורת 22.10 · הודעת-הסירוב בדמו תמיד גלויה', () => {
  // 🐛 (1) בתצוגה-המקדימה של האתר הציבורי (?org=demo&site=1, «תצוגה מקדימה» מאשף-הדמו) מנעול-המסמך פעיל
  // (ה-hook מעל ה-return המוקדם) אבל מגש-ההודעות לא רונדר — העתקה/לחיצה-ימנית/Ctrl+P נבלעו בשקט.
  // (2) מגש-ההודעות (z-index 200) הוסתר מתחת לאשף (300, 96vw בנייד), «זרימה-אחת» (260) והגדלת-תמונה (1000).
  it('App: מגש-ההודעות מוגדר לפני שער-האתר-הציבורי, ומרונדר בו — בדמו בלבד', () => {
    const toastsDef = appSrc.indexOf('  const toastsEl = (');
    const siteGate = appSrc.indexOf('  if (siteRequested && publicSiteOn(config)) {');
    expect(toastsDef).toBeGreaterThan(-1);
    expect(toastsDef).toBeLessThan(siteGate);
    const branch = appSrc.slice(siteGate, appSrc.indexOf('\n  }\n', siteGate));
    expect(branch).toContain('return demoLocked ? (\n      <>\n        {publicSite}\n        {toastsEl}\n      </>\n    ) : (\n      publicSite\n    );');
    // מנעול-המסמך מותקן לפני כל return מוקדם — גם לפני שער-האתר
    expect(appSrc.indexOf('return installDemoLock(')).toBeLessThan(appSrc.indexOf("  if (!ready) return <div className=\"empty\">טוען…</div>;"));
  });

  it('CSS: בדמו מגש-ההודעות מעל כל שכבה (אשף 300 · זרימה-אחת 260 · הגדלת-תמונה 1000); מחוץ לדמו 200 כמו תמיד', () => {
    expect(cssSrc).toContain('\n:root[data-demo-lock] .toasts {\n  z-index: 1100;\n}');
    expect(cssSrc).toMatch(/\n\.toasts \{[^}]*z-index: 200;/);
    // אף שכבה במקור לא עולה על 1100 (אחרת ההודעה שוב מוסתרת)
    const zs: number[] = [];
    for (const src of [...Object.values(SRC), cssSrc]) {
      for (const m of src.matchAll(/z-?[iI]ndex:\s*'?(\d+)/g)) zs.push(Number(m[1]));
    }
    expect(Math.max(...zs.filter((z) => z !== 1100))).toBeLessThan(1100);
  });
});
