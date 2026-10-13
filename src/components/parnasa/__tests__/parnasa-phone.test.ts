/**
 * ratchet — 📒 פרנסה׳לע 6ב: לשונית "📞 הקו" — **סימולטור, לא קו חי** (PhoneTab + phoneSim, מעל מודל-הקו).
 *
 * ננעל:
 *  (א) phoneSim — מקש דרך phoneStep (= walkPhone, מקש-במקש), איסוף קוד-חיוג, צומת סופי לא מקשיב,
 *      🗣 "אמרו משהו" ⇒ resolveSpeech ⇒ **תמיד צומת-אישור / לא-נמצא, לעולם לא חיבור**, מסלול + תקרה,
 *      נוסח טרי מעץ שנבנה מחדש; תצוגת שבת/חול (phonePreviewMs) דטרמיניסטית גם מול TZ; קול עברי.
 *  (ב) הלשונית (רינדור-שרת אמיתי): באנר "הקו עוד לא חי", הנוסח הנוכחי, מקלדת 12 מקשים, תיבת-דיבור,
 *      מסלול + 🔄, ⬇ תסריט רק ב-parnasa.export; בשבת — הודעת-הסגירה, מקלדת מושבתת; קוד כפול — אזהרה;
 *      אפס קישור tel: (אין שיחה).
 *  (ג) הגנות-מקור: ההורדה דרך downloadTextDoc (guardExport) ונרשמת ביומן-הגישה רק אחרי שירדה;
 *      speechSynthesis בזיהוי-יכולת ועטוף try/catch; phoneSim טהור.
 *  (ד) נוסח תוויות-האמון — מקור אחד (PR_MARK_LABELS) לחוברת ולקו, בלי שינוי-פלט.
 *  (ה) הקו ↔ "דורש טיפול": כל קוד שהקו מסרב לו (כפול) מופיע אצל הגבאי — ולהפך.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrListing, type PrPost } from '../../../types/domain';
import { PhoneTab } from '../PhoneTab';
import { duplicateDialCodes, needsCare, PR_MARK_LABELS, type PrSearchCtx } from '../lib';
import { buildPhoneMenu, walkPhone, type PhoneMenu } from '../phoneLine';
import { hebrewVoice, PHONE_TRAIL_MAX, phonePreviewMs, simListening, simNode, simPress, simSay, simStart, type PhoneSimState } from '../phoneSim';
import { bookletHtml } from '../booklet';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import { downloadTextDoc } from '../exportDoc';
import { setExportBlocked } from '../../../lib/exportGate';
import type { PrNow } from '../hooks';
import tabSrc from '../PhoneTab.tsx?raw';
import simSrc from '../phoneSim.ts?raw';
import exportSrc from '../exportDoc.ts?raw';
import bookletSrc from '../booklet.ts?raw';
import phoneSrc from '../phoneLine.ts?raw';

/** epoch של שעה מקומית בישראל בשעון-קיץ (IDT = UTC+3) — אוקטובר 2026 לפני 25.10. */
const idt = (y: number, mo: number, d: number, h: number, mi = 0): number => Date.UTC(y, mo - 1, d, h - 3, mi);
const THU_13 = idt(2026, 10, 15, 13); // חמישי
const SAT_10 = idt(2026, 10, 17, 10); // שבת בבוקר
const LOC = resolveZmanimLoc();

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'x', source: 'owner', name: '', title: '', category: 'other', area: '', city: '', phone: '', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'approved', dialCode: '', featuredUntil: '', recs: [],
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}

const PLUMBER = L({ id: 'b101', name: 'אינסטלציה זילברמן', title: 'נזילות, סתימות ודודים', category: 'elec', area: 'גוש דן', phone: '050-0000101', dialCode: '101' });
const MELAMED = L({ id: 'b106', name: 'הרב קליין', title: 'מלמד ושיעורי גמרא', category: 'edu', phone: '050-0000106', dialCode: '106' });
const LISTINGS = [PLUMBER, MELAMED];
const menuAt = (ms: number, listings: readonly PrListing[] = LISTINGS, posts: readonly PrPost[] = []): PhoneMenu =>
  buildPhoneMenu({ listings, posts, prefs: { communityName: 'קהילת חסידי בעלזא' }, nowMs: ms, loc: LOC });
const ctxAt = (ms: number): PrSearchCtx => {
  const clock = clockAt(ms, LOC.tz);
  return { todayIso: clock.iso, clock, closureAt: makeClosureFn(LOC) };
};
const ids = (st: PhoneSimState): string[] => st.trail.map((s) => s.node.id);
const pressAll = (menu: PhoneMenu, st: PhoneSimState, keys: string): PhoneSimState => [...keys].reduce((acc, k) => simPress(menu, acc, k), st);

/* ═══════════════ (א) phoneSim ═══════════════ */

describe('📞 (א) מצב-הסימולטור — מעל מודל-הקו', () => {
  const MENU = menuAt(THU_13);

  it('התחלה = השורש; מקש ⇒ הצומת הבא עם המקש שהוביל אליו; מקש לא-חוקי ⇒ הקו חוזר על הצומת; תו זר ⇒ כלום', () => {
    const st0 = simStart(MENU);
    expect(ids(st0)).toEqual(['main']);
    const st1 = simPress(MENU, st0, '1');
    expect(ids(st1)).toEqual(['main', 'cats/1']);
    expect(st1.trail[1].via).toBe('1');
    expect(simNode(MENU, st1)?.prompt).toContain('אמרו מה אתם צריכים');
    expect(ids(simPress(MENU, st1, '7'))).toEqual(['main', 'cats/1', 'cats/1']); // לא-חוקי ⇒ חזרה על הצומת
    expect(simPress(MENU, st1, 'x')).toBe(st1);
  });

  it('🛡 אותה הליכה כמו walkPhone — מקש-במקש, על כל רצף (כולל קוד מהחוברת וחיבור)', () => {
    for (const keys of ['121', '1211', '12111', '12112', '*101', '*1011', '*9992', '*1*', '4', '41', '411', '2', '20', '3', '300']) {
      expect(ids(pressAll(MENU, simStart(MENU), keys)), keys).toEqual(walkPhone(MENU, keys).map((n) => n.id));
    }
  });

  it('כוכבית + קוד: הספרות נאספות (הצומת לא מתחלף) ⇒ צומת-אישור עם שם-העסק, בלי פעולה', () => {
    let st = pressAll(MENU, simStart(MENU), '*1');
    expect(ids(st)).toEqual(['main', 'code']);
    expect(st.buf).toBe('1');
    st = pressAll(MENU, st, '01');
    expect(st.buf).toBe('');
    const n = simNode(MENU, st)!;
    expect(n).toMatchObject({ id: 'confirm/code/101', kind: 'confirm', prompt: 'הקשתם אחת אפס אחת: אינסטלציה זילברמן.' });
    expect(n.action).toBeUndefined();
  });

  it('צומת סופי (חיבור) — הקו לא מקשיב: מקשים ודיבור לא משנים כלום', () => {
    const st = pressAll(MENU, simStart(MENU), '12111');
    const n = simNode(MENU, st)!;
    expect(n.kind).toBe('connect');
    expect(simListening(n)).toBe(false);
    expect(simPress(MENU, st, '1')).toBe(st);
    expect(simSay(MENU, st, 'נזילה', LISTINGS, ctxAt(THU_13))).toBe(st);
  });

  it('🛡 🗣 "אמרו משהו" ⇒ צומת-אישור ("שמעתי") — 1 ⇒ כרטיס-העסק; לעולם לא חיבור ישר מדיבור', () => {
    const st = simSay(MENU, simStart(MENU), 'יש לי נזילה בכיור', LISTINGS, ctxAt(THU_13));
    const n = simNode(MENU, st)!;
    expect(st.trail[1].via).toBe('🗣');
    expect(n.kind).toBe('confirm');
    expect(n.action).toBeUndefined();
    expect(n.prompt).toMatch(/^שמעתי: יש לי נזילה בכיור — אינסטלציה\. נמצא: אינסטלציה זילברמן/);
    expect(simNode(MENU, simPress(MENU, st, '1'))).toMatchObject({ id: 'biz/b101', kind: 'listing' });
    // כל תמליל, מכל צומת-שמקשיב — אף פעם לא צומת-חיבור
    for (const at of ['', '1', '12', '121', '1211', '*']) {
      for (const utter of ['נזילה', 'קוד 101', 'זילברמן', 'המספר 050-0000101', 'בלה בלה', '   ', 'מלמד לגמרא']) {
        const before = pressAll(MENU, simStart(MENU), at);
        if (!simListening(simNode(MENU, before))) continue;
        const after = simNode(MENU, simSay(MENU, before, utter, LISTINGS, ctxAt(THU_13)))!;
        expect(after.kind, at + ' / ' + utter).not.toBe('connect');
        expect(after.action, at + ' / ' + utter).toBeUndefined();
      }
    }
  });

  it('דיבור בצומת שאינו מקבל דיבור ⇒ "כאן אפשר רק להקיש" (כמו הקו); 2 ⇒ חזרה לצומת', () => {
    const st = simSay(MENU, simPress(MENU, simStart(MENU), '2'), 'נזילה', LISTINGS, ctxAt(THU_13));
    expect(simNode(MENU, st)?.prompt).toContain('כאן אפשר רק להקיש');
    expect(simNode(MENU, simPress(MENU, st, '2'))?.id).toBe('zmanim');
  });

  it('המסלול מוגבל ל-PHONE_TRAIL_MAX צעדים (הישנים נשמטים)', () => {
    const st = pressAll(MENU, simStart(MENU), '0'.repeat(PHONE_TRAIL_MAX + 25));
    expect(st.trail).toHaveLength(PHONE_TRAIL_MAX);
    expect(simNode(MENU, st)?.id).toBe('main');
  });

  it('העץ נבנה מחדש (נתונים/דקה) ⇒ הנוסח הטרי של הצומת הנוכחי, בלי לאבד את המקום', () => {
    const st = simPress(MENU, simStart(MENU), '1');
    const more = menuAt(THU_13, [...LISTINGS, L({ id: 'z9', name: 'גינון עדן', category: 'home', phone: '050-0000112', dialCode: '112' })]);
    expect(simNode(MENU, st)?.prompt).toContain('במדריך 2 עסקים');
    expect(simNode(more, st)?.prompt).toContain('במדריך 3 עסקים');
  });

  it('תצוגת שבת/חול: מחמישי — "בשבת" ⇒ הקו סגור ("שבת שלום"); משבת — "ביום חול" ⇒ פתוח; עכשיו = כמות-שהוא', () => {
    expect(phonePreviewMs(THU_13, LOC, 'now')).toBe(THU_13);
    const shab = menuAt(phonePreviewMs(THU_13, LOC, 'shabbat'));
    expect(shab).toMatchObject({ root: 'closed', closed: true, asOf: '2026-10-17 12:00' });
    expect(shab.nodes.closed.prompt).toMatch(/^שבת שלום! /);
    expect(simListening(simNode(shab, simStart(shab)))).toBe(false);
    const weekday = menuAt(phonePreviewMs(SAT_10, LOC, 'weekday'));
    expect(weekday).toMatchObject({ root: 'main', closed: false, asOf: '2026-10-18 12:00' });
    expect(menuAt(phonePreviewMs(SAT_10, LOC, 'shabbat')).asOf).toBe('2026-10-17 12:00'); // בשבת עצמה — היום
    // יו״ט: מערב-יום-כיפור — "ביום חול" מדלג על החג
    expect(menuAt(phonePreviewMs(idt(2026, 9, 20, 9), LOC, 'weekday')).asOf).toBe('2026-09-22 12:00');
  });

  it('🛡 תצוגת שבת/חול דטרמיניסטית — גם כשאזור-הזמן של התהליך שונה', () => {
    const orig = process.env.TZ;
    try {
      const base = [phonePreviewMs(THU_13, LOC, 'shabbat'), phonePreviewMs(SAT_10, LOC, 'weekday')];
      process.env.TZ = 'America/New_York';
      expect([phonePreviewMs(THU_13, LOC, 'shabbat'), phonePreviewMs(SAT_10, LOC, 'weekday')]).toEqual(base);
    } finally {
      if (orig === undefined) delete process.env.TZ;
      else process.env.TZ = orig;
    }
  });

  it('קול עברי: he-IL עדיף, גם iw (הקוד הישן); אין ⇒ null (הלשונית מציגה הערה, לא שגיאה)', () => {
    expect(hebrewVoice([{ lang: 'en-US' }, { lang: 'he' }, { lang: 'he-IL' }])).toEqual({ lang: 'he-IL' });
    expect(hebrewVoice([{ lang: 'en-US' }, { lang: 'iw_IL' }])).toEqual({ lang: 'iw_IL' });
    expect(hebrewVoice([{ lang: 'he' }])).toEqual({ lang: 'he' });
    expect(hebrewVoice([{ lang: 'en-US' }, { lang: 'hea' }])).toBeNull();
    expect(hebrewVoice([])).toBeNull();
    expect(hebrewVoice(null)).toBeNull();
  });
});

/* ═══════════════ (ב) הלשונית — רינדור-שרת ═══════════════ */

const INIT = useApp.getInitialState() as unknown as Record<string, unknown>;
const ORIG = { config: INIT.config, db: INIT.db, cloud: INIT.cloud };
const ON = (features: Record<string, boolean> = {}): OrgConfig => ({ ...DEFAULT_CONFIG, modules: { parnasa: true }, features });

function setup(cfg: OrgConfig, db: Partial<Db> = {}): void {
  const st = useApp.getState();
  const patch = { config: cfg, db: { ...emptyDb(), ...db }, cloud: { ...st.cloud, user: null, isManager: false } };
  useApp.setState(patch as never);
  Object.assign(INIT, patch);
}
afterEach(() => {
  Object.assign(INIT, ORIG);
  useApp.setState({ config: DEFAULT_CONFIG, db: emptyDb(), view: 'home' } as never);
});

function nowOf(ms: number): PrNow {
  const clock = clockAt(ms, LOC.tz);
  return { nowMs: ms, loc: LOC, clock, todayIso: clock.iso, closureAt: makeClosureFn(LOC) };
}
const render = (ms: number): string => renderToStaticMarkup(createElement(PhoneTab, { now: nowOf(ms) }));

describe('📞 (ב) הלשונית "📞 הקו" — רינדור-שרת', () => {
  it('באנר "הקו עוד לא חי", הנוסח של השורש, מקלדת 12 מקשים, תיבת-דיבור, מסלול + 🔄, ⬇ תסריט', () => {
    setup(ON(), { prListings: LISTINGS });
    const html = render(THU_13);
    expect(html).toContain('תצוגה בלבד — הקו עוד לא חי');
    expect(html).toContain('שלום וברוכים הבאים לקו של פרנסה׳לע');
    expect(html).toContain('לעסקים הקישו 1 — או פשוט אמרו מה אתם צריכים');
    const keys = [...html.matchAll(/aria-label="מקש ([^"]+)"/g)].map((m) => m[1]);
    expect(keys).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'כוכבית', '0', 'סולמית']);
    expect(html).not.toMatch(/aria-label="מקש [^"]+" disabled/);
    expect(html).toContain('🎙 אמרו משהו');
    expect(html).toContain('המסלול:');
    expect(html).toContain('🔄 מההתחלה');
    expect(html).toContain('⬇ תסריט הקו');
    expect(html).toContain('🟢 פתוח ברגע 2026-10-15 13:00');
    expect(html).not.toMatch(/href="tel:|tel:\/\//); // 🛡 אין שיחה — אין קישור-חיוג
  });

  it('parnasa.export כבוי ⇒ אין הורדת-תסריט (הערה במקום)', () => {
    setup(ON({ 'parnasa.export': false }), { prListings: LISTINGS });
    const html = render(THU_13);
    expect(html).not.toContain('⬇ תסריט הקו');
    expect(html).toContain('הורדת התסריט כבויה באשף');
  });

  it('🕯 בשבת — הודעת-הסגירה, סטטוס "סגור", והמקלדת כולה מושבתת', () => {
    setup(ON(), { prListings: LISTINGS });
    const html = render(SAT_10);
    expect(html).toContain('שבת שלום! הקו של פרנסה׳לע סגור עכשיו בשבת');
    expect(html).toContain('🕯 סגור ברגע 2026-10-17 10:00');
    expect(html).toContain('אין תפריט, אין קוד ואין חיבור');
    expect([...html.matchAll(/aria-label="מקש [^"]+" disabled=""/g)]).toHaveLength(12);
  });

  it('קוד-חיוג כפול ⇒ אזהרה בלשונית (הקו לא עונה לו)', () => {
    setup(ON(), { prListings: [...LISTINGS, L({ id: 'tw', name: 'תאום', category: 'home', phone: '050-0000999', dialCode: '101' })] });
    expect(render(THU_13)).toContain('⚠ קוד-חיוג כפול — הקו לא עונה לו: 101 (אינסטלציה זילברמן · תאום)');
  });

  it('מדריך ריק — הקו עדיין מתרנדר ("עדיין אין עסקים") ובלי קריסה', () => {
    setup(ON());
    const html = render(THU_13);
    expect(html).toContain('תצוגה בלבד — הקו עוד לא חי');
    expect(html).toContain('0 עסקים · 0 קודי-חיוג');
  });
});

/* ═══════════════ (ג) הגנות-מקור + שער יציאת-המידע ═══════════════ */

describe('📞 (ג) הגנות-מקור', () => {
  it('downloadTextDoc: core.export חסום ⇒ אין קישור, false, ההתרעה רצה; מותר ⇒ קובץ-טקסט UTF-8 עם BOM', async () => {
    const created: string[] = [];
    const blobs: Blob[] = [];
    const el = { click() {}, href: '', download: '' };
    vi.stubGlobal('document', { createElement: (t: string) => (created.push(t), el) });
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => (blobs.push(b as Blob), 'blob:x'));
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    try {
      let warned = 0;
      setExportBlocked(true, () => warned++);
      expect(downloadTextDoc('s.txt', 'תסריט')).toBe(false);
      expect(created).toEqual([]);
      expect(warned).toBe(1);
      setExportBlocked(false);
      expect(downloadTextDoc('s.txt', 'תסריט')).toBe(true);
      expect(created).toEqual(['a']);
      expect(el.download).toBe('s.txt');
      expect(blobs[0].type).toBe('text/plain;charset=utf-8');
      expect(new Uint8Array(await blobs[0].arrayBuffer()).slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf])); // BOM
      expect(await blobs[0].text()).toContain('תסריט');
    } finally {
      setExportBlocked(false);
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });

  it('תסריט: דרך downloadTextDoc (שער יציאת-המידע) ⇒ יומן-הגישה רק אחרי שירד בפועל', () => {
    expect(tabSrc).toContain("downloadTextDoc('parnasa-line-script-' + clock.iso + '.txt', phoneScriptText(menu))");
    expect(tabSrc).toMatch(/const ok = downloadTextDoc\([^\n]*\n\s*if \(!ok\) return;[^\n]*\n\s*logAccess\(/);
    expect(tabSrc).toMatch(/exportOn \? \(\s*<Btn onClick=\{downloadScript\}>/);
    expect(exportSrc).toMatch(/export function downloadTextDoc\([^)]*\): boolean \{\s*if \(!guardExport\(\)\) return false;/);
  });

  it('השמעה: זיהוי-יכולת (speechSynthesis in window) + קול עברי בלבד, הכול עטוף try/catch', () => {
    expect(tabSrc).toContain("'speechSynthesis' in window");
    expect(tabSrc).toContain('hebrewVoice(s.getVoices())');
    expect(tabSrc).toMatch(/try \{\s*const synth = window\.speechSynthesis;[\s\S]{0,300}synth\.speak\(u\);\s*\} catch/);
    expect(tabSrc).toContain("{tts.state === 'ready' && (");
  });

  it('הלשונית לא ממציאה הליכה משלה — רק simPress/simSay/simStart מעל המודל; אין tel:/מנוי-DB-מלא', () => {
    expect(tabSrc).toContain('setSim(simPress(menu, sim, k))');
    expect(tabSrc).toContain('simSay(menu, sim, t, listings,');
    // שינוי-נעילה מכוון (13.10, BUILD-ORDER-SWITCHBOARD חיבור ג׳): אותה קריאה אחת למודל, + המרכזייה בהזרקה (ask + ctx
    // של אותו רגע-תצוגה). הלשונית עדיין לא בונה ענפים בעצמה — רק המודל, ורק דרך ask.
    expect(tabSrc).toContain('buildPhoneMenu({ listings, posts, prefs, nowMs: atMs, loc: now.loc, config, switchboard: { ask, ctx: sw } })');
    expect((tabSrc.match(/buildPhoneMenu\(/g) ?? []).length).toBe(1);
    expect(tabSrc).toContain('const sw = useSwitchCtx(atMs, LINE_ABILITIES);');
    expect(tabSrc).not.toMatch(/tel:|href=/);
    expect(tabSrc).not.toMatch(/useApp\(\(s\) => s\.db\)/);
    expect(simSrc).toContain('const r = phoneStep(menu, { node, buf: st.buf }, key);');
  });

  it('phoneSim טהור: בלי store/DOM/רשת/Date.now; מייבא רק מודל-הקו, זמנים וטיפוסים', () => {
    const imports = [...simSrc.matchAll(/from '([^']+)'/g)].map((x) => x[1]).sort();
    expect(imports).toEqual(['../../types/domain', './lib', './phoneLine', './zmanimBoard']);
    expect(simSrc).toMatch(/import type \{ PrSearchCtx \} from '\.\/lib';/); // מ-lib — טיפוס בלבד
    expect(simSrc).not.toMatch(/Date\.now|new Date\b|\bdocument\.|\bwindow\.|localStorage|useApp|fetch\(/);
  });
});

/* ═══════════════ (ד) תוויות-האמון — מקור אחד ═══════════════ */

describe('📞 (ד) נוסח תוויות-האמון — PR_MARK_LABELS לחוברת ולקו', () => {
  it('המקור האחד, והנוסח שלו לא השתנה', () => {
    expect(PR_MARK_LABELS).toEqual({ disc: 'הנחה לקהילה', free: 'גמ״ח', emergency: 'זמינים לקריאות חירום' });
  });

  it('🛡 החוברת והקו לא מחזיקים עותק משלהם — מייבאים מ-lib', () => {
    for (const [name, src] of [['booklet', bookletSrc], ['phoneLine', phoneSrc]] as const) {
      for (const label of ['הנחה לקהילה', 'זמינים לקריאות חירום', "'גמ״ח'"]) expect(src, name + ' — ' + label).not.toContain(label);
      expect(src, name).toMatch(/PR_MARK_LABELS,?[\s\S]*from '\.\/lib'/);
      for (const k of ['disc', 'free', 'emergency']) expect(src, name + ' — ' + k).toContain('PR_MARK_LABELS.' + k);
    }
  });

  it('הפלט לא השתנה: החוברת (הנחה · גמ״ח · מתאים · חירום) והקו (מתאים · הנחה · גמ״ח · חירום), כל אחד בסדרו', () => {
    const full = L({ id: 'm1', name: 'עסק מלא', title: 'חשמלאי', category: 'elec', phone: '050-0000111', dialCode: '111', disc: true, free: true, emergency: true, aud: 'men', kashrut: 'בד״ץ' });
    const html = bookletHtml({ listings: [full], ads: [], posts: [] }, { todayIso: '2026-10-15' });
    expect(html).toContain('<div class="marks">הנחה לקהילה · גמ״ח · לגברים · זמינים לקריאות חירום · השגחה: בד״ץ</div>');
    const m = menuAt(THU_13, [full]);
    expect(m.nodes['biz/m1'].prompt).toContain('לגברים, הנחה לקהילה, גמ״ח, זמינים לקריאות חירום, השגחה: בד״ץ.');
  });
});

/* ═══════════════ (ה) הקו ↔ "דורש טיפול" ═══════════════ */

describe('📞 (ה) כל קוד שהקו מסרב לו — מופיע אצל הגבאי', () => {
  it('קוד כפול: לא ב-menu.codes, לא נענה בקו — ושורת dupDialCode בדיוק לו; ממתין לא נספר', () => {
    const listings = [
      ...LISTINGS,
      L({ id: 'tw1', name: 'תאום א', category: 'home', phone: '050-0000201', dialCode: '150' }),
      L({ id: 'tw2', name: 'תאום ב', category: 'build', phone: '050-0000202', dialCode: '150' }),
      L({ id: 'pd', name: 'ממתין עם קוד תפוס', category: 'home', phone: '050-0000203', dialCode: '106', status: 'pending' }),
    ];
    const menu = menuAt(THU_13, listings);
    const lineCodes = new Set(listings.filter((l) => l.status === 'approved' && /^\d{3}$/.test(l.dialCode)).map((l) => l.dialCode));
    const refused = [...lineCodes].filter((c) => !Object.hasOwn(menu.codes, c)).sort();
    expect(refused).toEqual(['150']);
    expect(walkPhone(menu, '*150').slice(-1)[0].prompt).toBe('הקוד אחת חמש אפס לא נמצא במדריך.');
    const care = needsCare({ prListings: listings, prRequests: [], prAds: [] }, '2026-10-15', THU_13, DEFAULT_CONFIG);
    expect(care.filter((c) => c.kind === 'dupDialCode').map((c) => c.label)).toEqual(['קוד-חיוג 150 כפול — 2 עסקים']);
    expect(duplicateDialCodes(listings, '2026-10-15').map((d) => d.code)).toEqual(refused);
    expect(menu.codes['106']).toBe('biz/b106'); // הממתין לא "מקלקל" את הקוד המאושר
  });
});
