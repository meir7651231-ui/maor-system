/**
 * ratchet — 📒 פרנסה׳לע · עיצוב 2: "מה צריך?" של המקור — הבית, המטבעות, באנרי-התמונה והשדות החדשים.
 *  (א) home.ts טהור: עונות-השנה העברית (6 מטבעות + 5 חיפושים נפוצים לכל עונה), המהדורות, הברכה (שקיעה/נרות/צאת,
 *      צ'יפ-תקופה, מוצאי-שבת), החודש-בקהילה (30 יום), מומלצי-השבוע בסבב-יומי, חדש-באלפון (60 יום), מבקשים-עכשיו
 *      (רק פתוחות-לקהילה, לעולם לא שקטה), חיוג-מהיר, מטבע-הפלטינה מוצמד.
 *  (ב) המטבעה (coins.ts): כל פני-המקור קיימים, מזהים בקידומת pn-, מונוגרמה עוברת esc(), גב עם הספירה.
 *  (ג) באנרי-התמונה (banners.ts): איזו תמונה לובש עסק, התאמת-שם, SMIL נשמט בתנועה-מופחתת; התמונות קיימות ב-public.
 *  (ד) השדות החדשים (additive, DB_VERSION 6): ריפוי בסוג-שגוי ⇒ חסר; תקין ⇒ אותה הפניה; במפתח-התוכן של מכונת-
 *      האישור (לא-מאשר שמשנה לוגו/מבצע ⇒ ממתין); שדות-הקידום = שדות-גבאי; מטבע-הפלטינה לא נכלל בחסות-השער.
 *  (ה) רינדור: הבית, התשובות (באנר + "לא מצאתי"), מטבע-הפלטינה, וואטסאפ/חיוג מגודרי-הרחבה.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrAd, type PrListing, type PrRequest } from '../../../types/domain';
import {
  askingNow,
  coinOfTile,
  editionOf,
  featuredRotation,
  greetingOf,
  isMotzei,
  newJoiners,
  pinnedHits,
  PN_SEASONS,
  pulseOf,
  quickDialList,
  seasonOf,
  shortName,
  tradeIcon,
  weekWaiting,
} from '../home';
import { coinBack, coinFront, coinHTML, monoOf, monoIcon } from '../coins';
import { nameFit, photoOf, photoUrl, PN_PBC, sceneSvg } from '../banners';
import { healPrAd, healPrListing } from '../model';
import { listingContentChanged, saveListing } from '../transitions';
import { adRotation, coinSponsor, searchListings } from '../lib';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import { hebNow } from '../shell';
import { DirectoryTab, type DirCtx } from '../DirectoryTab';
import { Answers, hostOf, safeUrl } from '../Home';
import type { PrNow } from '../hooks';
import homeSrc from '../Home.tsx?raw';
import dirSrc from '../DirectoryTab.tsx?raw';
import viewSrc from '../ParnasaView.tsx?raw';

const loc = resolveZmanimLoc();
const nowAt = (ms: number): PrNow => {
  const clock = clockAt(ms, loc.tz);
  return { nowMs: ms, loc, clock, todayIso: clock.iso, closureAt: makeClosureFn(loc) };
};
const TUE = Date.UTC(2026, 9, 13, 7, 30); // ג׳ 13.10.2026 10:30 בישראל — ב׳ חשוון

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'l1', source: 'owner', name: 'אינסטלציה שטרן', title: 'אינסטלטור מוסמך: נזילות וסתימות', category: 'elec', area: 'גוש דן', city: 'בני ברק',
    phone: '050-7771234', phone2: '', whatsapp: '050-7771234', hours: [], always: true, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false,
    desc: '', notes: '', status: 'approved', dialCode: '101', featuredUntil: '', recs: [], createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
function R(over: Partial<PrRequest>): PrRequest {
  return {
    id: 'r1', text: 'צריך עזרה', category: '', area: '', urgent: false, quiet: false, job: false, requester: { name: '', phone: '' }, status: 'open', responses: [],
    createdAt: '2026-10-13T05:00:00.000Z', updatedAt: '2026-10-13T05:00:00.000Z', ...over,
  };
}
function A(over: Partial<PrAd>): PrAd {
  return {
    id: 'a1', slot: 'category', kind: 'line', target: 'elec', advertiser: 'חומרי חשמל אור', headline: '', body: '', phone: '', from: '', to: '', price: 300, paid: false, paidAt: '',
    active: true, createdAt: '', updatedAt: '', ...over,
  };
}

/* ═══════════════ (א) home.ts ═══════════════ */

describe('📒 (א) מנוע-הבית', () => {
  it('9 עונות × 6 מטבעות + 5 חיפושים נפוצים; העונה לפי החודש העברי (המקור)', () => {
    for (const [k, s] of Object.entries(PN_SEASONS)) {
      expect(s.tiles.length, k).toBe(6);
      expect(s.pop.length, k).toBe(5);
    }
    expect(seasonOf(12, 20)).toMatchObject({ k: 'sukkos', t: 'לקראת סוכות' });
    expect(seasonOf(1, 15)).toMatchObject({ k: 'sukkos', t: 'חג הסוכות' });
    expect(seasonOf(1, 25)).toMatchObject({ k: 'winter', t: 'אחרי החגים' });
    expect(seasonOf(2, 2)).toMatchObject({ k: 'winter', t: 'ימי החורף' });
    expect(seasonOf(3, 26)).toMatchObject({ k: 'chanuka', t: 'ימי חנוכה' });
    expect(seasonOf(6, 14)).toMatchObject({ k: 'purim', t: 'פורים' });
    expect(seasonOf(7, 1)).toMatchObject({ k: 'pesach', t: 'לקראת פסח' });
    expect(seasonOf(8, 1)).toMatchObject({ k: 'spring', t: 'עונת השמחות' });
    expect(seasonOf(11, 9)).toMatchObject({ k: 'summer', t: 'בין הזמנים' });
    expect(seasonOf(12, 3)).toMatchObject({ k: 'elul', t: 'חודש אלול' });
    expect(seasonOf(5.5, 10).k).toBe('winter');
    expect(editionOf('purim')).toBe('purim');
    expect(editionOf('winter')).toBe('regular');
  });

  it('פני-המטבע: לפי האייקון, עם הפנים המיוחדות לחגים (חשמל לסוכה · מסיבת חנוכה · תפילין)', () => {
    expect(coinOfTile({ l: 'נזילה', q: 'נזילה', i: 'drop' })).toBe('leak');
    expect(coinOfTile({ l: 'חשמל לסוכה', q: 'חשמלאי', i: 'bolt' })).toBe('light');
    expect(coinOfTile({ l: 'מסיבת חנוכה', q: 'מסיבה', i: 'spark' })).toBe('dreidel');
    expect(coinOfTile({ l: 'תפילין', q: 'תפילין', i: 'scroll' })).toBe('tefillin');
    expect(coinOfTile({ l: '?', q: '?', i: 'nope' })).toBe('other');
    expect(tradeIcon(L({}))).toBe('drop');
    expect(tradeIcon(L({ title: 'רואה חשבון', name: 'כהן', category: 'fin' }))).toBe('calc');
    expect(shortName('ר׳ משה ברגר')).toBe('משה');
  });

  it('הברכה: בוקר טוב + ב׳ חשוון + שקיעה; שישי — הדלקת נרות (ובעוד…); שבת — שבת שלום + צאת השבת; מוצ״ש — שבוע טוב', () => {
    const n = nowAt(TUE);
    const g = greetingOf(n.clock, loc, n.closureAt(n.clock.iso, n.clock.hhmm), hebNow(n.clock, loc));
    expect(g.g).toBe('בוקר טוב');
    expect(g.hd).toBe('ב׳ חשוון');
    expect(g.notes[0]).toMatchObject({ kind: 'zm', icon: 'sun' });
    expect(g.notes[0].text).toMatch(/^שקיעה \d{1,2}:\d{2}$/);
    const fri = nowAt(Date.UTC(2026, 9, 16, 13, 0)); // שישי 16:00
    const gf = greetingOf(fri.clock, loc, fri.closureAt(fri.clock.iso, fri.clock.hhmm), hebNow(fri.clock, loc));
    expect(gf.notes[0].text).toMatch(/^הדלקת נרות \d{1,2}:\d{2} · בעוד /);
    const sat = nowAt(Date.UTC(2026, 9, 17, 9, 0)); // שבת 12:00
    const gs = greetingOf(sat.clock, loc, sat.closureAt(sat.clock.iso, sat.clock.hhmm), hebNow(sat.clock, loc));
    expect(gs.g).toBe('שבת שלום');
    expect(gs.notes[0].text).toMatch(/^צאת השבת \d{1,2}:\d{2}$/);
    const motz = nowAt(Date.UTC(2026, 9, 17, 18, 30)); // מוצ״ש 21:30
    expect(isMotzei(motz.clock, loc)).toBe(true);
    expect(greetingOf(motz.clock, loc, motz.closureAt(motz.clock.iso, motz.clock.hhmm), hebNow(motz.clock, loc)).g).toBe('שבוע טוב');
    expect(isMotzei(n.clock, loc)).toBe(false);
  });

  it('החודש בקהילה (30 יום): שנמצאו — רק לא-שקטות; תשובות; תודות', () => {
    const p = pulseOf(
      [
        R({ status: 'closed', closedAt: '2026-10-10T10:00:00.000Z' }),
        R({ id: 'q', status: 'closed', quiet: true, closedAt: '2026-10-10T10:00:00.000Z' }),
        R({ id: 'old', status: 'closed', closedAt: '2026-08-01T10:00:00.000Z' }),
        R({ id: 'r', responses: [{ listingId: 'l1', text: '', at: '2026-10-12T10:00:00.000Z' }] }),
      ],
      [L({ recs: [{ by: '', text: 'מעולה', at: '2026-10-11T10:00:00.000Z' }] })],
      TUE,
    );
    expect(p).toEqual({ found: 1, answered: 1, thanks: 1 });
  });

  it('מומלצי-השבוע: רק מודגשים-בתוקף, עד 3 בסבב-יומי (כל משלם מגיע לראש), "עוד N"', () => {
    const feats = ['א', 'ב', 'ג', 'ד', 'ה'].map((n, i) => L({ id: 'f' + i, name: n, featuredUntil: '2026-12-31' }));
    const list = [...feats, L({ id: 'x', name: 'פג', featuredUntil: '2026-01-01' }), L({ id: 'y', name: 'ממתין', featuredUntil: '2026-12-31', status: 'pending' })];
    const d0 = featuredRotation(list, '2026-10-13', 0);
    expect(d0.total).toBe(5);
    expect(d0.shown.map((l) => l.name)).toEqual(['א', 'ב', 'ג']);
    expect(featuredRotation(list, '2026-10-13', 2).shown.map((l) => l.name)).toEqual(['ג', 'ד', 'ה']);
    expect(featuredRotation(list.slice(0, 2), '2026-10-13', 7).shown.length).toBe(2);
  });

  it('חדש באלפון: הצטרפו/עודכנו ב-60 יום (החדש ראשון, עד 6); מבקשים-עכשיו — רק פתוחה-לקהילה, לעולם לא שקטה', () => {
    const nj = newJoiners([L({ id: 'a', updatedAt: '2026-10-12T10:00:00.000Z' }), L({ id: 'b', updatedAt: '2026-05-01T10:00:00.000Z' }), L({ id: 'c', updatedAt: '2026-10-01T10:00:00.000Z' })], TUE);
    expect(nj.map((x) => x.l.id)).toEqual(['a', 'c']);
    const listings = [L({})];
    const job = R({ id: 'job', job: true, text: 'דרוש עובד' });
    const quiet = R({ id: 'quiet', quiet: true, text: 'ייעוץ', category: 'health' });
    const fresh = R({ id: 'fresh', category: 'elec', text: 'נזילה', createdAt: '2026-10-13T07:20:00.000Z' }); // עוד אצל העסקים בתחום
    const urgentOld = R({ id: 'u', text: 'דחוף! צריך מלמד', category: 'edu', createdAt: '2026-10-12T07:00:00.000Z' });
    const ids = askingNow([job, quiet, fresh, urgentOld], listings, TUE).map((r) => r.id);
    expect(ids).toEqual(['u', 'job']);
    expect(ids).not.toContain('quiet');
  });

  it('שבוע טוב: רק במוצאי-שבת — הבקשות מהשבת (בלי שקטות)', () => {
    const motz = nowAt(Date.UTC(2026, 9, 17, 18, 30));
    const reqs = [R({ id: 'w1', createdAt: '2026-10-17T08:00:00.000Z' }), R({ id: 'old', createdAt: '2026-10-14T08:00:00.000Z' }), R({ id: 'q', quiet: true, createdAt: '2026-10-17T08:00:00.000Z' })];
    expect(weekWaiting(reqs, [], motz.clock, loc, motz.nowMs)?.map((r) => r.id)).toEqual(['w1']);
    const tue = nowAt(TUE);
    expect(weekWaiting(reqs, [], tue.clock, loc, tue.nowMs)).toBeNull();
  });

  it('חיוג-מהיר: ★ ואז אחרונים, בלי כפילות, רק מאושרים קיימים, עד 10', () => {
    const ls = [L({ id: 'a' }), L({ id: 'b' }), L({ id: 'c', status: 'pending' })];
    expect(quickDialList(['b'], ['a', 'b', 'c', 'zz'], ls).map((l) => l.id)).toEqual(['b', 'a']);
  });

  it('מטבע-הפלטינה מוצמד: עסקי השער, והעסק של הנותן (לפי טלפון) ראשון; בלי עסק ⇒ matchId null', () => {
    const n = nowAt(TUE);
    const ctx = { todayIso: n.todayIso, clock: n.clock, closureAt: n.closureAt };
    const ls = [L({ id: 'a', name: 'א-חשמל', phone: '052-0000001' }), L({ id: 'b', name: 'ב-חשמל', phone: '052-0000002', featuredUntil: '2026-12-31' }), L({ id: 'c', category: 'home' })];
    const sp = A({ coin: true, target: 'elec', phone: '+972 52-000-0001' });
    const r = pinnedHits(ls, 'elec', sp, ctx);
    expect(r.matchId).toBe('a');
    expect(r.hits.map((h) => h.listing.id)).toEqual(['a', 'b']);
    expect(pinnedHits(ls, 'elec', A({ coin: true, phone: '', advertiser: 'זר' }), ctx).matchId).toBeNull();
  });
});

/* ═══════════════ (ב) המטבעה ═══════════════ */

describe('📒 (ב) המטבעה של המקור', () => {
  it('כל פני-המקור נבנים (40+ פנים), במזהים pn- בלבד, בלי סקריפט', () => {
    for (const key of ['leak', 'seal', 'heat', 'study', 'melamed', 'move', 'sukkah', 'schach', 'species', 'light', 'catering', 'menorah', 'donut', 'camera', 'bus', 'basket', 'mask', 'music', 'clean', 'paint', 'kasher', 'plug', 'gift', 'dreidel', 'cup', 'megillah', 'tefillin', 'ring', 'scissors', 'ac', 'tent', 'mezuzah', 'hammer', 'calc', 'laptop', 'quill', 'health', 'house', 'bag', 'other']) {
      const svg = coinFront(key, 'gold', 'beads');
      expect(svg, key).toMatch(/^<svg viewBox="0 0 100 100"/);
      expect(svg, key).not.toMatch(/url\(#c-|<script/);
    }
    expect(coinFront('menorah', 'silver', 'beads')).toContain('url(#pn-c-gmS)');
    for (const rim of ['weave', 'masks', 'matzah'] as const) expect(coinFront('leak', 'gold', rim).length).toBeGreaterThan(coinFront('leak', 'gold', 'beads').length);
  });

  it('הגב: הספירה האמיתית (1 ⇒ "בעל מקצוע"); null ⇒ "…"; המטבע השלם עם שני הצדדים; מיני — פנים בלבד', () => {
    expect(coinBack('gold', 1)).toContain('>1</text>');
    expect(coinBack('gold', 1)).toContain('בעל מקצוע');
    expect(coinBack('gold', 12)).toContain('בעלי מקצוע');
    expect(coinBack('gold', null)).toContain('>…</text>');
    const full = coinHTML('leak', 'gold', 'beads', { n: 3 });
    expect(full).toContain('class="pn-cn pn-gold"');
    expect(full).toContain('pn-cn-back');
    expect(coinHTML('leak', 'gold', 'beads', { mini: true })).not.toContain('pn-cn-back');
  });

  it('מונוגרמה: שתי אותיות עם גרשיים; מהשם כשחסר; טקסט עובר esc', () => {
    expect(monoOf('', 'אינסטלציה שטרן')).toBe('א״ש');
    expect(monoOf('שמ', 'x')).toBe('ש״מ');
    expect(monoOf('', 'ר׳ משה ברגר')).toBe('מ״ב');
    expect(coinFront(null, 'plat', 'beads', monoIcon('<b>'))).toContain('&lt;b&gt;');
  });
});

/* ═══════════════ (ג) באנרי-התמונה ═══════════════ */

describe('📒 (ג) באנרי-התמונה', () => {
  it('איזו תמונה: לפי השער ומילות-המקצוע (אינסטלציה ⇒ plumb, מזגנים ⇒ ac, צלם ⇒ photog, גינון ⇒ garden)', () => {
    expect(photoOf({ category: 'elec', title: 'אינסטלטור: נזילות' })).toBe('plumb');
    expect(photoOf({ category: 'elec', title: 'טכנאי מזגנים' })).toBe('ac');
    expect(photoOf({ category: 'elec', title: 'חשמלאי' })).toBe('elec');
    expect(photoOf({ category: 'events', title: 'צלם אירועים' })).toBe('photog');
    expect(photoOf({ category: 'events', title: 'קייטרינג' })).toBe('cater');
    expect(photoOf({ category: 'home', title: 'גינון והשקיה' })).toBe('garden');
    expect(photoOf({ category: 'other', title: '' })).toBe('');
  });

  it('כל 18 התמונות קיימות ב-public/parnasa/photos (נטענות לפי דרישה), ולכל אחת מסגור', () => {
    expect(Object.keys(PN_PBC).length).toBe(18);
    for (const k of Object.keys(PN_PBC)) expect(existsSync(fileURLToPath(new URL('../../../../public/parnasa/photos/' + k + '.jpg', import.meta.url))), k).toBe(true);
    expect(photoUrl('plumb')).toBe('./parnasa/photos/plumb.jpg');
  });

  it('שכבת-החיים: התמונה נטענת רק ליד החלון (data-h); תנועה-מופחתת ⇒ בלי <animate>; התאמת-שם', () => {
    const s = sceneSvg(PN_PBC.plumb, photoUrl('plumb'), false);
    expect(s).toContain('data-h="./parnasa/photos/plumb.jpg"');
    expect(s).not.toContain(' href=');
    expect(s).toContain('<animate');
    expect(s).toContain('url(#pn-pbn-lamp)');
    expect(sceneSvg(PN_PBC.plumb, photoUrl('plumb'), true)).not.toContain('<animate');
    expect(nameFit('אבג')).toBe('');
    expect(nameFit('אינסטלציהשטרן')).toBe('xlong');
    expect(nameFit('אבג דהו זחט יכל מנס עפ')).toBe('long');
  });
});

/* ═══════════════ (ד) השדות החדשים ═══════════════ */

describe('📒 (ד) שדות דף-העסק והחסות (additive)', () => {
  it('ריפוי: סוג שגוי ⇒ המפתח חסר; תקין ⇒ אותה הפניה (ביט-זהה)', () => {
    const ok = L({ palette: 'tekhelet', photos: ['data:image/webp;base64,AA=='], offer: { text: 'מבצע', until: '' }, faq: [{ q: 'ש', a: 'ת' }], pay: ['bit'], years: 12, cert: 'מוסמך', seek: true, promoPrice: 45 });
    expect(healPrListing(ok)).toBe(ok);
    const bad = healPrListing({ ...L({}), palette: 7, photos: 'x', offer: 'x', faq: [1], pay: [2], years: -1, seek: 'yes', promoUrl: {} }) as PrListing;
    for (const k of ['palette', 'photos', 'offer', 'faq', 'pay', 'years', 'seek', 'promoUrl'] as const) expect(bad[k], k).toBeUndefined();
    const ad = A({ url: 'or.co.il', coin: true, mono: 'א״ש' });
    expect(healPrAd(ad)).toBe(ad);
    const badAd = healPrAd({ ...A({}), url: 1, coin: 'x', mono: [] }) as PrAd;
    expect([badAd.url, badAd.coin, badAd.mono]).toEqual([undefined, undefined, undefined]);
  });

  it('מכונת-האישור: לוגו/מבצע/תמונות = תוכן (לא-מאשר ⇒ ממתין); ריק ≡ חסר; קידום = שדות-גבאי', () => {
    const prev = L({});
    expect(listingContentChanged(prev, { ...prev, photos: [], offer: undefined, seek: false })).toBe(false);
    expect(listingContentChanged(prev, { ...prev, logo: 'data:image/webp;base64,AA==' })).toBe(true);
    const staff = { canApprove: false, requireApproval: true };
    const saved = saveListing(prev, { ...prev, offer: { text: '10% הנחה', until: '' }, promoLine: 'עשרים שנה', promoPrice: 1 }, staff, '2026-10-13T10:00:00.000Z');
    expect(saved.status).toBe('pending');
    expect(saved.promoLine).toBeUndefined();
    expect(saved.promoPrice).toBeUndefined();
    const gabbai = saveListing(prev, { ...prev, promoLine: 'עשרים שנה' }, { canApprove: true, requireApproval: true }, '2026-10-13T10:00:00.000Z');
    expect(gabbai.promoLine).toBe('עשרים שנה');
    expect(gabbai.status).toBe('approved');
  });

  it('מטבע-הפלטינה: לא נכלל בסבב חסות-השער; coinSponsor מוצא אותו (רק בשער מוכר ובתוקף)', () => {
    const gate = A({ id: 'g' });
    const coin = A({ id: 'c', coin: true, advertiser: 'אינסטלציה שטרן', mono: 'א״ש' });
    expect(adRotation([gate, coin], 'category', '2026-10-13', 'elec').active.map((a) => a.id)).toEqual(['g']);
    expect(coinSponsor([gate, coin], '2026-10-13')?.id).toBe('c');
    expect(coinSponsor([A({ id: 'x', coin: true, target: 'nope' })], '2026-10-13')).toBeNull();
    expect(coinSponsor([A({ id: 'x', coin: true, to: '2026-01-01' })], '2026-10-13')).toBeNull();
  });
});

/* ═══════════════ (ה) רינדור ═══════════════ */

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
function ctxOf(ms = TUE): DirCtx {
  const now = nowAt(ms);
  return {
    now,
    heb: hebNow(now.clock, now.loc),
    closure: now.closureAt(now.clock.iso, now.clock.hhmm),
    reduced: false,
    focusTick: 0,
    quick: { favs: [], recents: [], toggleFav: () => false, touch: () => {} },
    toastAct: () => {},
    goReq: () => {},
    goAdmin: () => {},
    goJoin: () => {},
  };
}
const dir = (q: string, ms = TUE) => renderToStaticMarkup(createElement(DirectoryTab, { ctx: ctxOf(ms), q, setQ: () => {}, selId: null, setSelId: () => {}, onNewRequest: () => {} }));

describe('📒 (ה) הבית והתשובות מתרנדרים בסקין', () => {
  const DATA: Partial<Db> = {
    prListings: [L({ featuredUntil: '2026-12-31', offer: { text: '10% הנחה לקהילה', until: '2026-11-11' }, disc: true }), L({ id: 'l2', name: 'ר׳ משה ברגר', title: 'מלמד לגמרא', category: 'edu', whatsapp: '' })],
    prAds: [A({ id: 'coin', coin: true, advertiser: 'אינסטלציה שטרן', phone: '050-7771234' }), A({ id: 'line', slot: 'board', target: '', advertiser: 'משפחת גולדברג', headline: 'לעילוי נשמת' })],
    prRequests: [R({ id: 'job', job: true, text: 'דרוש/ה עובד/ת למאפייה', category: 'food', requester: { name: '', phone: '058-7003030' } })],
  };

  it('הבית: מטבע-הפלטינה עם המונוגרמה, מומלצי-השבוע כבאנר עם המבצע, שורת-החסות, מבקשים-עכשיו, לבעלי עסקים', () => {
    setup(ON(), DATA);
    const html = dir('');
    expect(html).toContain('class="pn-ct pn-sp"');
    expect(html).toContain('א״ש');
    expect(html).toContain('◆ בחסות אינסטלציה שטרן');
    expect(html).toContain('מומלצי השבוע');
    expect(html).toContain('10% הנחה לקהילה');
    expect(html).toContain('פרנסה׳לע השבוע בחסות');
    expect(html).toContain('משפחת גולדברג');
    expect(html).toContain('מבקשים עכשיו');
    expect(html).toContain('דרוש/ה עובד/ת למאפייה');
    expect(html).toContain('יש לך עסק?');
    expect(html).toContain('כל האלפון');
  });

  it('תשובות: שורת-ההבנה, באנר-התמונה (photo plumb), "רק תוצאה אחת? בקשו מהקהילה"; אין ⇒ "עוד אין לנו תשובה לזה"', () => {
    setup(ON(), DATA);
    const html = dir('נזילה');
    expect(html).toContain('pn-understood');
    expect(html).toContain('data-ph="plumb"');
    expect(html).toContain('רק תוצאה אחת? בקשו מהקהילה');
    const zero = dir('שען לתיקון שעונים');
    expect(zero).toContain('עוד אין לנו');
    expect(zero).toContain('פרסום בלוח הבקשות');
  });

  it('וואטסאפ רק בהרחבה: כבויה ⇒ כפתור-העתקה; דלוקה ⇒ wa.me עם ההודעה של המקור', () => {
    setup(ON(), DATA);
    const off = dir('נזילה');
    expect(off).not.toContain('wa.me');
    expect(off).toContain('העתקת המספר של');
    setup(ON({ integrations: { whatsapp: { enabled: true } } } as Partial<OrgConfig>), DATA);
    const on = dir('נזילה');
    expect(on).toContain('https://wa.me/972507771234?text=');
    expect(on).toContain(encodeURIComponent('שלום, הגעתי אליך דרך פרנסה׳לע. צריך עזרה: נזילה'));
  });

  it('מטבע-הפלטינה מוצמד: בלי הדגשות-שם ובלי צ׳יפ "שם" (המקור לא מדרג — pinRes); הנותן ראשון, "עוד N" לפי המוצמדים', () => {
    setup(ON(), DATA);
    const ls = useApp.getState().db.prListings;
    const now = nowAt(TUE);
    const sctx = { todayIso: now.todayIso, clock: now.clock, closureAt: now.closureAt };
    const coin = A({ id: 'coin', coin: true, advertiser: 'אינסטלציה שטרן', phone: '050-7771234' });
    const pin = pinnedHits(ls, 'elec', coin, sctx);
    const res = searchListings('שטרן', ls, sctx, 12);
    expect(res.words.length).toBeGreaterThan(0);
    const base = {
      res, qtext: 'שטרן', anyListings: true, sel: 0, kb: false, anim: false, edition: 'regular' as const, now, brand: 'פרנסה׳לע',
      contact: { wa: () => null, tel: () => null }, reduced: true, posted: false, canPost: true, boxRef: { current: null },
      onOpen: () => {}, onTouch: () => {}, onCopy: () => {}, onBrowse: () => {}, onPostNow: () => {}, onPrefill: () => {},
    };
    const plain = renderToStaticMarkup(createElement(Answers, { ...base, hits: res.hits, pinnedSponsor: null }));
    expect(plain).toContain('<mark>שטרן</mark>');
    const pinned = renderToStaticMarkup(createElement(Answers, { ...base, hits: pin.hits, pinnedSponsor: { ad: coin, matchId: pin.matchId } }));
    expect(pinned).toContain('בחסות · מוצמד ראשון');
    expect(pinned).not.toContain('<mark>');
    expect(pinned).not.toContain('עוד ');
  });

  it('קישור-אתר בחסות: https בלבד (http משודרג, בלי סכמה ⇒ https, javascript:/data: ⇒ ריק); מוצג כשם-המארח', () => {
    expect(safeUrl('kolel.example.org/x')).toBe('https://kolel.example.org/x');
    expect(safeUrl('http://kolel.example.org')).toBe('https://kolel.example.org/');
    expect(safeUrl('HTTPS://www.kolel.example.org')).toBe('https://www.kolel.example.org/');
    expect(safeUrl('www.kolel.example.org:8443/a')).toBe('https://www.kolel.example.org:8443/a');
    for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,<b>x</b>', 'ftp://x.example.org', 'mailto:a@b.c', '', '   ', null, 7]) expect(safeUrl(bad)).toBe('');
    expect(hostOf('https://www.kolel.example.org/a')).toBe('kolel.example.org');
    setup(ON(), { ...DATA, prAds: [A({ id: 'line', slot: 'board', target: '', advertiser: 'משפחת גולדברג', url: 'http://kolel.example.org' })] });
    const html = dir('');
    expect(html).toContain('href="https://kolel.example.org/"');
    expect(html).not.toContain('href="http://');
  });

  it('מבקשים-עכשיו: הודעת-המקור ("יש לי מישהו בשבילך:"); החלקה רק עם פעולה דלוקה — כבויות ⇒ בלי עטיפה, וואטסאפ ⇒ רק כיוון-וואטסאפ', () => {
    const job = R({ id: 'job', job: true, text: 'דרוש/ה עובד/ת למאפייה', category: 'food', requester: { name: '', phone: '058-7003030' } });
    setup(ON(), { ...DATA, prRequests: [job] });
    const off = dir('');
    expect(off).toContain('מבקשים עכשיו');
    expect(off).not.toContain('pn-rsw');
    expect(off).toContain('pn-rq-b pn-bd');
    setup(ON({ integrations: { whatsapp: { enabled: true } } } as Partial<OrgConfig>), { ...DATA, prRequests: [job] });
    const on = dir('');
    expect(on).toContain('class="pn-rsw"');
    expect(on).toContain('pn-rsw-a pn-wa');
    expect(on).not.toContain('pn-rsw-a pn-call');
    expect(on).toContain(encodeURIComponent('שלום, ראיתי את הבקשה שלך בפרנסה׳לע: ״דרוש/ה עובד/ת למאפייה״. יש לי מישהו בשבילך:'));
    expect(on).not.toContain('058-7003030');
  });

  it('🕯 שבת — הפנייה נחה בעדינות (SHAB_LOCK של המקור): וואטסאפ/חיוג/העתקה/החלקה/פרסום/מילוי; "שעת צורך, להמשיך" ⇒ 15 דקות', () => {
    const lock = (/const LOCK = '([^']+)'/.exec(viewSrc)?.[1] ?? '').split(',');
    for (const sel of ['a[data-act="wa"]', 'a[data-act="call"]', '.pn-bn-wa', '.pn-rsw-a', '[data-act="postNow"]', '[data-act="postPrefill"]', 'a.pn-rq-b']) expect(lock).toContain(sel);
    expect(lock.join(',')).not.toContain(':not(');
    expect(viewSrc).toContain("label: 'שעת צורך, להמשיך'");
    expect(viewSrc).toContain('15 * 60_000');
    expect(viewSrc).toContain("'שבת קודש. האלפון נח עד '");
  });

  it('הגנת-מקור: וואטסאפ דרך usePnContact (מגודר-הרחבה), חיוג מגודר-טלפוניה; אין innerHTML ישיר', () => {
    expect(homeSrc).toContain('contact.wa(');
    expect(homeSrc).toContain('contact.tel(');
    expect(dirSrc).toContain('usePnContact()');
    expect(homeSrc + dirSrc).not.toContain('dangerouslySetInnerHTML');
  });
});
