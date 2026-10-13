/**
 * ratchet — 📒 פרנסה׳לע · עיצוב 1: הסקין המקורי בתוך אורביט (שלד + יסודות).
 *  (א) הסקין מוגבל-שורש: כל כלל ב-parnasa.css תחת ‎.pn (הדף) או ‎.pl (הלוח) — שאר אורביט לא זז; אפס CDN/@import
 *      (גופנים מאורחים-עצמית בתיקיית המודול, קיימים בדיסק); אפס ‎-webkit-backdrop-filter (המכווץ משאיר רק אחד
 *      מהזוג — הזכוכית הייתה נעלמת); איפוס-הטפסים בספציפיות 0,1,0 שמחריג את אזור-אורביט.
 *  (ב) HTML גולמי רק דרך RawHtml ב-skin.tsx (מחרוזות-SVG ממחוללי-המקור) — אף רכיב אחר לא מזריק HTML.
 *  (ג) מנוע-השלד הטהור (shell.ts): תקופות-השנה, הפושקע, ספירת-העזרה של החודש העברי (באזור-הזמן של הקהילה),
 *      התאריך העברי שמתחלף בשקיעה, גוון ערב-שבת, ההקדשה ות.נ.צ.ב.ה.; ★/אחרונים טהורים עם תקרות.
 *  (ד) השלד מתרנדר: הפס (ב״ה · תאריך · פושקע · סימן-המילה עם יהלום-הגרש · כלי-התצוגה), ההקדשה, באנר-השבת,
 *      הקולופון (נוסח-המקור), פס-הלשוניות עם מחוון ומונים; ערכה = בחירת-הצופה ⇐ "היכל" של אורביט ⇐ המכשיר.
 *  (ה) העדפות-הצופה: פר-אדם (maor_pn_*) — ★/אחרונים פר-ארגון (nsLsKey); אף אחד מהם לא ב-DB.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrListing, type PrRequest } from '../../../types/domain';
import { ParnasaView } from '../ParnasaView';
import { Band, CalmBanner, Colophon, TabBar, Wordmark } from '../Shell';
import { dedicationOf, eveOf, hebMonthStartIso, hebNow, helpCount, periodOf, pushkeFill, pushkeText, PN_TAGLINE } from '../shell';
import { FAV_CAP, RECENT_CAP, toggledFavs, touchedRecents } from '../skinPrefs';
import { clockAt, dayTimes, hmToMin, resolveZmanimLoc } from '../zmanimBoard';
import { PN_ICON_IDS, PN_SVG_DEFS } from '../svgDefs';
import skinPrefsSrc from '../skinPrefs.ts?raw';

/** ‎?raw של ‎.css מוחזר ריק ב-vitest (עיבוד-CSS כבוי) — קוראים מהדיסק. */
const css = readFileSync(fileURLToPath(new URL('../parnasa.css', import.meta.url)), 'utf8');

const UI_SRC = import.meta.glob(['../*.tsx', '../*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/* ═══════════════ (א) הסקין מוגבל-שורש ═══════════════ */

/** סורק-CSS זעיר: כל selector של כלל-סגנון (מחוץ ל-@keyframes/@font-face), עם עומק-הקינון של @media. */
function selectorsOf(text: string): { sels: string[]; atRules: string[] } {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const sels: string[] = [];
  const atRules: string[] = [];
  const stack: string[] = []; // 'at:<name>' | 'rule'
  let buf = '';
  let q = '';
  let paren = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      buf += c;
      if (c === '\\') {
        buf += src[++i] ?? '';
        continue;
      }
      if (c === q) q = '';
      continue;
    }
    if (c === '"' || c === "'") {
      q = c;
      buf += c;
      continue;
    }
    if (c === '(') paren++;
    if (c === ')') paren--;
    if (c === '{' && paren === 0) {
      const pre = buf.trim();
      buf = '';
      if (pre.startsWith('@')) {
        const name = /^@([\w-]+)/.exec(pre)?.[1] ?? '';
        atRules.push(pre);
        stack.push('at:' + name);
      } else {
        const inKf = stack.some((x) => /^at:(-\w+-)?keyframes$/.test(x));
        const inFace = stack.includes('at:font-face');
        if (!inKf && !inFace) sels.push(pre);
        stack.push('rule');
      }
      continue;
    }
    if (c === '}' && paren === 0) {
      stack.pop();
      buf = '';
      continue;
    }
    if (c === ';' && paren === 0 && stack.length === 0) {
      // @charset/@import ברמת-השורש
      const pre = buf.trim();
      if (pre.startsWith('@')) atRules.push(pre);
      buf = '';
      continue;
    }
    buf += c;
  }
  return { sels, atRules };
}

/** פיצול רשימת-בוררים בפסיקים ברמה העליונה. */
function splitList(sel: string): string[] {
  const out: string[] = [];
  let cur = '';
  let depth = 0;
  for (const c of sel) {
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

describe('📒 (א) parnasa.css — מוגבל-שורש, בלי CDN, בלי זוג-הזכוכית', () => {
  const { sels, atRules } = selectorsOf(css);

  it('כל בורר מתחיל ב-‎.pn / ‎.pl (או נעילת-הגלילה html.pn-scroll-lock) — אף כלל לא דולף לשאר אורביט', () => {
    expect(sels.length, 'הסורק חי').toBeGreaterThan(1500);
    const bad: string[] = [];
    for (const s of sels) for (const one of splitList(s)) if (!/^\.(pn|pl)(?![\w-])/.test(one) && one !== 'html.pn-scroll-lock') bad.push(one);
    expect(bad.slice(0, 8), 'בוררים שלא תחת ‎.pn/.pl').toEqual([]);
  });

  it('כל מחלקה בקידומת pn-/pl- (שמות-המחלקות של אורביט — ‎.btn/.card/.chip — לא נתפסים)', () => {
    const bad = new Set<string>();
    for (const s of sels) {
      const noAttr = s.replace(/\[[^\]]*\]/g, '');
      for (const m of noAttr.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) {
        const cls = m[1];
        if (!/^(pn|pl)(-|$)/.test(cls) && !/^\d/.test(cls)) bad.add(cls);
      }
    }
    // ‎.pn-orbit … .btn/.chip — אזור-אורביט (במכוון: משחזר את מראה-אורביט לרכיבי אורביט בתוך המודול)
    for (const k of ['btn', 'primary', 'danger', 'sm', 'chip', 'on']) bad.delete(k);
    expect([...bad].slice(0, 10)).toEqual([]);
    expect(css).toMatch(/\.pn \.pn-orbit \.btn\{/);
  });

  it('אפס CDN: אין @import, אין url(http…) — הגופנים מאורחים-עצמית וקיימים בתיקיית-המודול', () => {
    expect(atRules.filter((a) => a.startsWith('@import'))).toEqual([]);
    expect(css).not.toMatch(/url\(\s*['"]?(https?:)?\/\//);
    const fonts = [...css.matchAll(/url\('\.\/fonts\/([\w.-]+\.woff2)'\)/g)].map((m) => m[1]);
    expect(fonts.length).toBeGreaterThanOrEqual(6);
    for (const f of new Set(fonts)) expect(existsSync(fileURLToPath(new URL('../fonts/' + f, import.meta.url))), f).toBe(true);
    expect(existsSync(fileURLToPath(new URL('../fonts/OFL.txt', import.meta.url))), 'רישיון OFL').toBe(true);
  });

  it('אין ‎-webkit-backdrop-filter (המכווץ היה משאיר רק אחד מהזוג); הזכוכית התקנית נשארת', () => {
    expect(css).not.toContain('-webkit-backdrop-filter');
    expect(css).toMatch(/backdrop-filter:blur/);
  });

  it('משתנים/keyframes בקידומת: אין var(--x) של אורביט בתוך כללי-המקור (רק באזור-אורביט)', () => {
    const outside = css.replace(/\.pn \.pn-orbit[^{]*\{[^}]*\}/g, '');
    const bare = [...outside.matchAll(/var\(--([\w-]+)/g)].map((m) => m[1]).filter((n) => !/^(pn|pl)-/.test(n));
    expect([...new Set(bare)]).toEqual([]);
    const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    expect(kf.length).toBeGreaterThan(20);
    for (const k of kf) expect(k, k).toMatch(/^(pn|pl)-/);
  });

  it('איפוס-הטפסים: ספציפיות 0,1,0 (‎:where), לפני כללי-המקור, ומחריג את אזור-אורביט', () => {
    const reset = '.pn :where(button,input,select,textarea,ul,ol,menu,fieldset,legend,summary):where(:not(.pn-orbit *)){all:revert}';
    expect(css).toContain(reset);
    expect(css.indexOf(reset)).toBeLessThan(css.indexOf('.pn *,'));
  });

  it('"אותיות גדולות" מגדיל רק את המודול: rem ⇒ calc(N*var(--pn-rem)) (אין rem חשוף בכללי-המקור)', () => {
    const noData = css.replace(/url\("data:[^"]*"\)/g, '').replace(/url\('data:[^']*'\)/g, '');
    const bareRem = noData.match(/[\s:(,/*+-]-?\d*\.?\d+rem\b/g) ?? [];
    expect(bareRem.filter((x) => !x.startsWith('.pn{--pn-rem')).length).toBeLessThanOrEqual(2); // רק ההגדרה של ‎--pn-rem עצמה
    expect(css).toContain('.pn.pn-big{--pn-rem:1.15625rem}');
  });
});

/* ═══════════════ (ב) HTML גולמי — רק RawHtml ═══════════════ */

describe('📒 (ב) הזרקת-HTML רק דרך RawHtml (מחוללי-המקור)', () => {
  it('dangerouslySetInnerHTML מופיע רק ב-skin.tsx', () => {
    for (const [path, s] of Object.entries(UI_SRC)) {
      if (path.endsWith('/skin.tsx')) continue;
      expect(s, path).not.toContain('dangerouslySetInnerHTML');
    }
  });
  it('ה-defs של המקור: מזהים בקידומת pn- (אין התנגשות עם אורביט), אפס סקריפט/מאזינים', () => {
    expect(PN_SVG_DEFS).not.toMatch(/<script|\son[a-z]+\s*=|javascript:/i);
    const ids = [...PN_SVG_DEFS.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(80);
    for (const id of ids) expect(id, id).toMatch(/^pn-/);
    for (const n of ['search', 'tab-alfon', 'tab-board', 'tab-luach', 'tab-card', 'tab-admin', 'dots', 'moon', 'sun']) expect(PN_ICON_IDS).toContain(n);
  });
});

/* ═══════════════ (ג) מנוע-השלד הטהור ═══════════════ */

describe('📒 (ג) shell.ts — תקופות, פושקע, עזרת-החודש, תאריך, ערב-שבת', () => {
  const loc = resolveZmanimLoc();

  it('periodOf (המקור): ספירת-העומר 1–49 · בין המצרים / תשעת הימים · אלול · אחרת ריק', () => {
    expect(periodOf(7, 15).k).toBe('');
    expect(periodOf(7, 16)).toEqual({ k: 'omer', n: 1, t: 'היום יום אחד לעומר' });
    expect(periodOf(8, 18)).toEqual({ k: 'omer', n: 33, t: 'היום 33 ימים לעומר' });
    expect(periodOf(9, 5)).toMatchObject({ k: 'omer', n: 49 });
    expect(periodOf(9, 6).k).toBe('');
    expect(periodOf(10, 16).k).toBe('');
    expect(periodOf(10, 17)).toEqual({ k: 'bh', t: 'בין המצרים' });
    expect(periodOf(11, 1)).toEqual({ k: 'bh', t: 'תשעת הימים' });
    expect(periodOf(11, 10).k).toBe('');
    expect(periodOf(12, 1)).toEqual({ k: 'elul', t: 'חודש אלול · ימי רחמים ותשובה' });
    expect(periodOf(5.5, 14).k).toBe('');
  });

  it('pushkeFill: מטרה = max(30, 2×עסקים); לפחות 2 כשיש עזרה; תקרה 32', () => {
    expect(pushkeFill(0, 10)).toBe(0);
    expect(pushkeFill(1, 0)).toBe(2);
    expect(pushkeFill(15, 0)).toBe(16);
    expect(pushkeFill(30, 0)).toBe(32);
    expect(pushkeFill(500, 0)).toBe(32);
    expect(pushkeFill(20, 20)).toBe(16);
    expect(pushkeFill(-3, 0)).toBe(0);
    expect(pushkeText(0)).toBe('כל עזרה בקהילה מוסיפה מטבע לפושקע');
    expect(pushkeText(1)).toBe('החודש בקהילה: פעם אחת עזרו אחד לשני');
    expect(pushkeText(7)).toBe('החודש בקהילה: 7 פעמים עזרו אחד לשני');
  });

  it('התאריך העברי מתחלף בשקיעה; ראש-החודש העברי; עזרת-החודש נספרת באזור-הזמן של הקהילה', () => {
    const noon = clockAt(Date.UTC(2026, 9, 14, 9, 0), loc.tz); // ד׳ 14.10.2026 12:00 — ג׳ חשוון תשפ״ז
    const h = hebNow(noon, loc);
    expect(h.m).toBe(2);
    expect(h.d).toBe(3);
    expect(h.text).toMatch(/^ג׳ \S*ש\S*ון תשפ״ז$/);
    expect(h.anchorIso).toBe('2026-10-14');
    const night = clockAt(Date.UTC(2026, 9, 14, 19, 0), loc.tz); // 22:00 — אחרי השקיעה ⇒ ד׳ חשוון
    expect(hebNow(night, loc)).toMatchObject({ d: 4, anchorIso: '2026-10-15' });
    const start = hebMonthStartIso(noon, loc);
    expect(start).toBe('2026-10-12');
    const L = (recs: PrListing['recs']): PrListing => ({ ...({} as PrListing), id: 'l', status: 'approved', recs });
    const R = (over: Partial<PrRequest>): PrRequest => ({ ...({} as PrRequest), status: 'open', responses: [], updatedAt: '', ...over });
    const db = {
      prListings: [L([{ by: '', text: '', at: '2026-10-13T08:00:00.000Z' }, { by: '', text: '', at: '2026-10-01T08:00:00.000Z' }])],
      prRequests: [
        R({ status: 'closed', closedAt: '2026-10-12T05:00:00.000Z' }), // נמצאה החודש
        R({ status: 'closed', closedAt: '2026-10-11T20:00:00.000Z' }), // 23:00 בישראל — עוד תשרי
        R({ responses: [{ listingId: 'l', text: '', at: '2026-10-11T22:30:00.000Z' }] }), // 01:30 בישראל — כבר חשוון
        R({ responses: [{ listingId: 'l', text: '', at: 'פגום' }] }),
      ],
    };
    expect(helpCount(db, start, loc.tz)).toBe(3);
  });

  it('eveOf: יום שישי — 0 בצהריים, 1 בהדלקת-הנרות; ביום אחר — 0', () => {
    const fri = '2026-10-16';
    const candle = hmToMin(dayTimes(fri, loc).candle) as number;
    expect(candle).toBeGreaterThan(900);
    const at = (hhmm: string, dow: number, iso = fri) => ({ iso, hhmm, dow, ms: 0 });
    const hm = (m: number) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    expect(eveOf(at('12:00', 5), loc)).toBe(0);
    expect(eveOf(at(hm(candle), 5), loc)).toBe(1);
    const mid = eveOf(at(hm(Math.round((720 + candle) / 2)), 5), loc);
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
    expect(eveOf(at('17:00', 3, '2026-10-14'), loc)).toBe(0);
  });

  it('dedicationOf: ת.נ.צ.ב.ה. רק כש"נשמ" בנוסח; ריק ⇒ ריק', () => {
    expect(dedicationOf('האלפון החודש מוקדש לעילוי נשמת ר׳ משה')).toEqual({ text: 'האלפון החודש מוקדש לעילוי נשמת ר׳ משה', tnzvh: true });
    expect(dedicationOf(' לרפואת שרה ')).toEqual({ text: 'לרפואת שרה', tnzvh: false });
    expect(dedicationOf(undefined)).toEqual({ text: '', tnzvh: false });
  });

  it('★ מועדפים (≤20, חדש בראש) ואחרונים (≤10, בלי כפילות) — טהורים', () => {
    expect(toggledFavs(['a', 'b'], 'c')).toEqual(['c', 'a', 'b']);
    expect(toggledFavs(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggledFavs(Array.from({ length: 25 }, (_, i) => 'x' + i), 'n').length).toBe(FAV_CAP);
    expect(touchedRecents(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
    expect(touchedRecents(Array.from({ length: 12 }, (_, i) => 'x' + i), 'n').length).toBe(RECENT_CAP);
  });
});

/* ═══════════════ (ד) השלד מתרנדר ═══════════════ */

const INIT = useApp.getInitialState() as unknown as Record<string, unknown>;
const ORIG = { config: INIT.config, db: INIT.db, cloud: INIT.cloud };
const ON = (extra: Partial<OrgConfig> = {}): OrgConfig => ({ ...DEFAULT_CONFIG, modules: { parnasa: true }, features: {}, ...extra });
function setup(cfg: OrgConfig, db: Partial<Db> = {}): void {
  const st = useApp.getState();
  const patch = { config: cfg, db: { ...emptyDb(), ...db }, cloud: { ...st.cloud, user: null, isManager: false } };
  useApp.setState(patch as never);
  Object.assign(INIT, patch);
}
afterEach(() => {
  Object.assign(INIT, ORIG);
  useApp.setState({ config: DEFAULT_CONFIG, db: emptyDb() } as never);
});

const TOOLS = { big: false, dark: false, mute: false, onBig() {}, onTheme() {}, onMute() {} };
const PK = { goldH: 12, title: 'החודש בקהילה: 5 פעמים עזרו אחד לשני', bump: '', onTap() {} };

describe('📒 (ד) השלד של המקור מתרנדר', () => {
  it('הפס: ב״ה + התאריך, הפושקע עם הזהב, סימן-המילה עם יהלום-הגרש, שם-הקהילה, כלי-התצוגה', () => {
    const html = renderToStaticMarkup(
      createElement(Band, { brand: 'פרנסה׳לע', community: 'קהילת בני ברק', hebDate: 'ג׳ חשוון תשפ״ז', dedication: { text: '', tnzvh: false }, calm: false, reducedMotion: false, pushke: PK, tools: TOOLS }),
    );
    expect(html).toContain('<header class="pn-band">');
    expect(html).toContain('<span class="pn-bh">ב״ה</span><span class="pn-hdate">ג׳ חשוון תשפ״ז</span>');
    expect(html).toContain('aria-label="הפושקע של הקהילה"');
    expect(html).toMatch(/class="pn-pkGold" x="28" y="90" width="64" height="12"/);
    expect(html).toContain('<span class="pn-sr">פרנסה׳לע</span>');
    expect(html).toContain('פרנסה<i class="pn-gm"></i>לע');
    expect(html).toContain('<div class="pn-comm">קהילת בני ברק</div>');
    for (const t of ['אותיות גדולות', 'מצב לילה', 'צלילים']) expect(html).toContain('<span class="pn-tl">' + t + '</span>');
    expect(html).toContain('aria-label="הגדרות תצוגה"');
    expect(html).not.toContain('pn-dedic');
    // בלי שם-קהילה ⇒ השורה של המותג
    const plain = renderToStaticMarkup(
      createElement(Band, { brand: 'פרנסה׳לע', community: '', hebDate: '', dedication: { text: '', tnzvh: false }, calm: false, reducedMotion: false, pushke: PK, tools: { ...TOOLS, dark: true } }),
    );
    expect(plain).toContain('<div class="pn-comm">' + PN_TAGLINE + '</div>');
    expect(plain).toContain('<span class="pn-tl">מצב יום</span>');
  });

  it('ההקדשה: שתי עותקים (השני מוסתר מקוראי-מסך) + ת.נ.צ.ב.ה.', () => {
    const html = renderToStaticMarkup(
      createElement(Band, { brand: 'פרנסה׳לע', community: '', hebDate: '', dedication: dedicationOf('לעילוי נשמת ר׳ אברהם'), calm: false, reducedMotion: false, pushke: PK, tools: TOOLS }),
    );
    expect(html).toContain('class="pn-dedic"');
    expect(html.match(/class="pn-tk-c"/g)?.length).toBe(2);
    expect(html).toContain('<small>ת.נ.צ.ב.ה.</small>');
    expect(html).toMatch(/class="pn-tk-c" aria-hidden="true"/);
  });

  it('סימן-המילה: שם מותאם בלי גרש ⇒ טקסט רגיל (בלי יהלום)', () => {
    expect(renderToStaticMarkup(createElement(Wordmark, { name: 'האלפון שלנו' }))).toBe('האלפון שלנו');
  });

  it('באנר-השבת (נוסח המקור) וגרסת-החג', () => {
    const sh = renderToStaticMarkup(createElement(CalmBanner, { kind: 'shabbat', reason: 'שבת', brand: 'פרנסה׳לע' }));
    expect(sh).toContain('<b class="pn-gold-t">שבת שלום</b>');
    expect(sh).toContain('האלפון במנוחה. בעלי המקצוע חוזרים במוצאי שבת קודש. אפשר לשמור מספרים ולחזור אחר כך.');
    expect(sh.match(/class="pn-candle"/g)?.length).toBe(2);
    const yt = renderToStaticMarkup(createElement(CalmBanner, { kind: 'yomtov', reason: 'סוכות', brand: 'פרנסה׳לע' }));
    expect(yt).toContain('חג שמח');
    expect(yt).toContain('במוצאי סוכות');
  });

  it('הקולופון: נוסח המקור + טלפון-הפרסום (כיוון LTR)', () => {
    const html = renderToStaticMarkup(createElement(Colophon, { brand: 'פרנסה׳לע', contactPhone: '03-5555555' }));
    expect(html).toContain('<b>פרנסה׳לע</b> · א פרנסה׳לע פאר יעדן איד');
    expect(html).toContain('נבנה לתועלת הקהילה · לחיזוק הפרנסה של אנשינו');
    expect(html).toContain('לחסות על שער, להקדשה ולפרסום בחוברת השנתית: פנו לגבאי בטלפון <span class="pn-ltr">03-5555555</span>');
    expect(renderToStaticMarkup(createElement(Colophon, { brand: 'פרנסה׳לע', contactPhone: '' }))).not.toContain('בטלפון');
  });

  it('פס-הלשוניות: מחוון עם ‎--pn-n/‎--pn-i, מונים בקטיפה (ריק ⇒ ריק)', () => {
    const html = renderToStaticMarkup(
      createElement(TabBar<'a' | 'b' | 'c'>, {
        tabs: [
          { key: 'a', label: 'אלפון', icon: 'tab-alfon' },
          { key: 'b', label: 'לוח בקשות', icon: 'tab-board', badge: 4 },
          { key: 'c', label: 'ניהול', icon: 'tab-admin', badge: 0 },
        ],
        active: 'b',
        onGo() {},
      }),
    );
    expect(html).toContain('style="--pn-n:3;--pn-i:1"');
    expect(html).toContain('<b class="pn-bdg">4</b>');
    expect(html).toContain('<b class="pn-bdg"></b>');
    expect(html).toMatch(/aria-selected="true" data-tab="b"/);
  });

  it('המסך: שורש ‎.pn.pn-root עם ה-defs; בלי בחירת-צופה — ערכת-המכשיר; "היכל" של אורביט ⇒ לילה', () => {
    setup(ON(), { ui: { ...emptyDb().ui, parnasa: { communityName: 'קהילת מבחן', dedication: 'לעילוי נשמת ר׳ יוסף', contactPhone: '050-1234567' } } });
    const html = renderToStaticMarkup(createElement(ParnasaView));
    expect(html).toMatch(/^<div class="pn pn-root"/);
    expect(html).not.toContain('data-pn-theme');
    expect(html).toContain('id="pn-i-search"');
    expect(html).toContain('<div class="pn-comm">קהילת מבחן</div>');
    expect(html).toContain('ת.נ.צ.ב.ה.');
    expect(html).toContain('<span class="pn-ltr">050-1234567</span>');
    expect(html).toContain('class="pn-dusk"');
    setup(ON({ theme: 'heichal' }));
    expect(renderToStaticMarkup(createElement(ParnasaView))).toMatch(/^<div class="pn pn-root" data-pn-theme="dark"/);
  });
});

/* ═══════════════ (ה) העדפות-הצופה ═══════════════ */

describe('📒 (ה) העדפות-הצופה — במכשיר בלבד', () => {
  it('ערכה/אותיות/צלילים/רמזים — פר-אדם (maor_pn_*); ★/אחרונים — פר-ארגון (nsLsKey); אפס כתיבה ל-DB', () => {
    for (const k of ['maor_pn_theme', 'maor_pn_big', 'maor_pn_mute', 'maor_pn_favs', 'maor_pn_recents']) expect(skinPrefsSrc).toContain("'" + k + "'");
    expect(skinPrefsSrc).toMatch(/nsLsKey\(K\.favs\)/);
    expect(skinPrefsSrc).toMatch(/nsLsKey\(K\.recents\)/);
    expect(skinPrefsSrc).not.toContain('useApp');
    expect(skinPrefsSrc).not.toMatch(/setParnasaPrefs|upsertPr/);
  });
});
