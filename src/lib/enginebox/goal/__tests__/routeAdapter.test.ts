/**
 * 🎯 ratchets · "להתחיל מהסוף" מעל הקטלוג האמיתי (ENGINEBOX-GOAL, 13.10.2026).
 * המשפט של הבעלים מקצה-לקצה · כל מפתח עובר sanitizeLinks · אין צד מתוכנן במסלול שאפשר להחיל · כנות על החוסר ·
 * דטרמיניזם · והגנת-מקור: שום קובץ בבנדל-הראשי לא מייבא את המתאם (רק עצלות מתוך המסך).
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../../types/config';
import { goalRoutes, routePartsFor, MAX_GOAL_ROUTES, type GoalResult } from '../routeAdapter';
import { catalogFor } from '../../match';
import { DEFAULT_LINKS, parseLink, sanitizeLinks } from '../../links';
import { PARTS, partById } from '../../parts';
import barrelSrc from '../../index.ts?raw';
import adapterSrc from '../routeAdapter.ts?raw';

const BOTH: OrgConfig = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, parnasa: true, hosting: true } };
const ONLY_HOSTING: OrgConfig = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, hosting: true } };
const OWNER = 'אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר';

const SENTENCES = [
  OWNER,
  'בעל מקצוע לתקלה דחופה',
  'זמני שבת ומניינים בכרטיס של האורח',
  'תקציר היום',
  'חוברת להדפסה',
  'תזכורת ותאריך עברי',
  'מקום פנוי בטלפון',
  'קישור לתשלום',
  'סתם משפט בלי שום דבר',
  '',
];
const STARTS = ['hosting', 'parnasa', 'host.maint', 'pr.phone', 'pr.care', '', 'nope'];

const allResults = (config: OrgConfig): GoalResult[] =>
  SENTENCES.flatMap((text) => STARTS.map((start) => goalRoutes({ text, start, config })));

describe('🎯 המשפט של הבעלים — מקצה לקצה על הקטלוג האמיתי', () => {
  it('מתחילים מאירוח משפחתי: מה הובן, הדרך שאפשר לחבר, והחוסר הכן', () => {
    const r = goalRoutes({ text: OWNER, start: 'hosting', config: BOTH });
    // הובנו שלושה דברים: להזמין · שבת · טלפון כשר
    expect(r.plugs).toEqual(['booking', 'times.shabbat', 'voice.menu']);
    expect(r.matched.map((m) => m.word)).toEqual(['להזמין', 'שבת', 'מטלפון כשר']);
    expect(r.matched.map((m) => m.label)).toEqual(['הזמנה', 'זמני שבת', 'שלוחה בקו']);

    expect(r.routes).toHaveLength(1);
    const route = r.routes[0];
    // הדרך: מקום-פנוי מהאירוח לתוך הקו, וזמני-השבת מפרנסה׳לע לתוך כרטיס-השהייה ולשונית-השבת
    expect(route.linkKeys).toContain('host.units>availability>pr.phone');
    expect(route.linkKeys).toContain('pr.zmanim>times.shabbat>host.stay');
    expect(route.linkKeys).toContain('pr.zmanim>times.shabbat>host.shabbat');
    expect(route.steps[0]).toBe('הוסף את 📞 הקו (טלפון כשר)');
    expect(route.steps).toContain('📞 הקו (טלפון כשר) מקבל מקום פנוי מ-🛏️ יחידות ותפוסה');
    expect(route.steps.some((s) => s.startsWith('הוסף את 🕯️ זמני היום והשבת וחבר אותו ל-') && s.endsWith('הוא נותן זמני שבת'))).toBe(true);
    // כל החיבורים האלה חווטו כבר היום (ברירת-המחדל) ⇒ "כבר מחובר"
    expect(route.alreadyLinked).toBe(true);
    // החוסר הכן: הזמנה מהקו ושלוחה בקו — עוד לא בנויים ("בקרוב"), לא "חסר מנוע"
    expect(r.missing.map((m) => [m.plug, m.kind, m.line])).toEqual([
      ['booking', 'planned', 'הזמנה עוד לא זמין · בקרוב'],
      ['voice.menu', 'planned', 'שלוחה בקו עוד לא זמין · בקרוב'],
    ]);
    expect(route.missing.map((m) => m.plug)).toEqual(['booking', 'voice.menu']);
  });

  it('מתחילים מפרנסה׳לע: מוסיפים את יחידות-האירוח ומחברים אותן לקו', () => {
    const r = goalRoutes({ text: OWNER, start: 'parnasa', config: BOTH });
    expect(r.routes[0].steps[0]).toBe('הוסף את 🛏️ יחידות ותפוסה וחבר אותו ל-📞 הקו (טלפון כשר)');
    expect(r.routes[0].linkKeys).toEqual(['host.units>availability>pr.phone']);
  });

  it('ניתוק שמור ⇒ הדרך כבר לא "מחוברת" (והכפתור יופיע)', () => {
    const r = goalRoutes({ text: OWNER, start: 'hosting', config: BOTH, stored: [] });
    expect(r.routes[0].alreadyLinked).toBe(false);
    const kept = goalRoutes({ text: OWNER, start: 'hosting', config: BOTH, stored: [...DEFAULT_LINKS] });
    expect(kept.routes[0].alreadyLinked).toBe(true);
  });

  it('פרנסה׳לע כבויה אצל הארגון ⇒ אין דרך, והחוסר אומר שהכלי לא הודלק', () => {
    const r = goalRoutes({ text: OWNER, start: 'hosting', config: ONLY_HOSTING });
    expect(r.routes).toEqual([]);
    const shab = r.missing.find((m) => m.plug === 'times.shabbat')!;
    expect(shab.kind).toBe('off');
    expect(shab.line).toBe('זמני שבת נמצא ב-🕯️ זמני היום והשבת, שעוד לא הודלק אצלכם');
  });
});

describe('🔒 מה שהמסך מבטיח זה מה שקורה', () => {
  it('כל מפתח בכל מסלול עובר sanitizeLinks של הליבה', () => {
    for (const config of [BOTH, ONLY_HOSTING, DEFAULT_CONFIG]) {
      for (const res of allResults(config)) {
        for (const route of res.routes) {
          expect(sanitizeLinks(route.linkKeys)).toEqual([...route.linkKeys]);
          for (const k of route.linkKeys) expect(parseLink(k), k).toBeDefined();
        }
      }
    }
  });

  it('אין צד מתוכנן במסלול שאפשר להחיל — ולא מנוע שכולו "בקרוב"', () => {
    for (const res of allResults(BOTH)) {
      for (const route of res.routes) {
        for (const k of route.linkKeys) {
          const { giver, plug, needer } = parseLink(k)!;
          expect(partById(giver)!.gives.find((g) => g.plug === plug)!.live, k).toBe(true);
          expect(partById(needer)!.needs.find((n) => n.plug === plug)!.live, k).toBe(true);
        }
        // מנועים שכל צדדיהם מתוכננים (משפחות · חוברת · פרסומות) לעולם לא מוצעים כצעד
        for (const p of PARTS.filter((x) => [...x.gives, ...x.needs].every((s) => !s.live))) {
          for (const s of route.steps) expect(s.includes(p.name), p.id + ' ⇐ ' + s).toBe(false);
        }
      }
    }
    // ובמיפוי עצמו: רק צדדים חיים
    for (const rp of routePartsFor(catalogFor(BOTH))) {
      const p = partById(rp.id)!;
      for (const n of rp.needs) expect(p.needs.some((x) => x.live && n === x.plug + '>' + p.module)).toBe(true);
      for (const g of rp.gives) expect(p.gives.some((x) => x.live && (g === x.plug || g.startsWith(x.plug + '>')))).toBe(true);
    }
  });

  it('יעד שרק מתוכנן ⇒ "בקרוב"; יעד שאין לו מנוע בכלל ⇒ "חסר מנוע שנותן"', () => {
    const booklet = goalRoutes({ text: 'חוברת להדפסה', start: 'hosting', config: BOTH });
    expect(booklet.routes).toEqual([]);
    expect(booklet.missing).toEqual([
      expect.objectContaining({ plug: 'print.page', kind: 'planned', line: 'דף להדפסה עוד לא זמין · בקרוב' }),
    ]);
    const remind = goalRoutes({ text: 'תזכורת', start: 'hosting', config: BOTH });
    expect(remind.routes).toEqual([]);
    expect(remind.missing).toEqual([
      expect.objectContaining({ plug: 'reminder', kind: 'none', line: 'חסר מנוע שנותן תזכורת', partNames: [] }),
    ]);
  });

  it('בעל מקצוע מאירוח: מדריך-העסקים לתוך התחזוקה והניקיון', () => {
    const r = goalRoutes({ text: 'בעל מקצוע לתקלה דחופה', start: 'hosting', config: BOTH });
    expect(r.routes[0].linkKeys).toEqual(['pr.directory>pro.match>host.clean', 'pr.directory>pro.match>host.maint']);
    expect(r.missing).toEqual([]);
  });

  it('כבר יש הכול ⇒ צעד אחד שאומר זאת, בלי מפתחות', () => {
    const r = goalRoutes({ text: 'בעל מקצוע', start: 'parnasa', config: BOTH });
    expect(r.routes[0].steps).toEqual(['כבר יש לך את כל מה שצריך — אין מה להוסיף']);
    expect(r.routes[0].linkKeys).toEqual([]);
  });

  it('לכל היותר 3 מסלולים; משפט בלי התאמה / קלט זבל ⇒ ריק, לעולם לא זורק', () => {
    for (const res of allResults(BOTH)) expect(res.routes.length).toBeLessThanOrEqual(MAX_GOAL_ROUTES);
    expect(goalRoutes({ text: 'סתם משפט', start: 'hosting', config: BOTH })).toEqual({ plugs: [], matched: [], routes: [], missing: [] });
    for (const junk of [null, undefined, 42, {}, { text: 5 }, { text: OWNER, config: null }]) {
      expect(() => goalRoutes(junk as never)).not.toThrow();
    }
  });
});

describe('🔁 דטרמיניזם', () => {
  it('אותו קלט ⇒ אותה תשובה, בכל הרצה', () => {
    const a = JSON.stringify(allResults(BOTH));
    const b = JSON.stringify(allResults(BOTH));
    expect(a).toBe(b);
  });
});

describe('🔒 הגנת-מקור: המתאם לא בבנדל-הראשי', () => {
  const RAW: Record<string, string> = import.meta.glob(['/src/**/*.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const prod = Object.entries(RAW).filter(([p]) => !p.includes('__tests__') && !p.includes('.test.'));

  it('אף קובץ-ייצור לא מייבא את routeAdapter סטטית (רק import type, או import() עצל)', () => {
    expect(prod.length).toBeGreaterThan(100); // הסריקה חיה
    for (const [path, src] of prod) {
      const statics = src.match(/^\s*import\s+(?!type\b)[^;]*?from\s+['"][^'"]*routeAdapter['"]/gm) ?? [];
      expect(statics, path).toEqual([]);
      expect(/export\s+\*\s+from\s+['"][^'"]*routeAdapter['"]/.test(src), path).toBe(false);
    }
  });

  it('טוהר ובידוד של המתאם עצמו (כמו הליבה)', () => {
    expect(adapterSrc).not.toMatch(/Date\.now\(|new Date\(|Math\.random\(/);
    expect(adapterSrc).not.toMatch(/\buseApp\b|\bsetDb\b|from '[^']*store\/|from 'react'/);
    expect(adapterSrc).not.toMatch(/\bdocument\.|\bwindow\.|\blocalStorage\b|\bnavigator\./);
    expect(adapterSrc).not.toMatch(/receipt|donation|OrgEvent|upsertEvent|addPayment|\.events\b|\bdb\.rooms\b/i);
  });

  it('ה-barrel של הליבה לא מייצא את המתאם', () => {
    expect(barrelSrc).not.toMatch(/routeAdapter/);
  });
});
