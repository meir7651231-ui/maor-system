/**
 * 📒 פרנסה׳לע — חוברת A5 להדפסה / "שמירה כ-PDF" (אשכול 3 · טהור: מחזיר מחרוזת בלבד, כמו
 * receiptHtml; ההדפסה/ההורדה — דרך iframe נסתר / downloadTextFile עם guardExport אצל הקורא).
 *
 * עיצוב 6: העיצוב של חוברת המקור (BOOK_CSS / bookletHTML) — כריכת סאטן בורדו עם מסגרת-קשת כפולה מזהב, סמל-הפושקע
 * הווקטורי (opts.mark — נטען עצל), סימן-המילה עם גרש-יהלום, "ספר המקצועות של הקהילה", הפסוק, לוחית "שנת …" ושוליית-
 * זהב · דף-הקדשה עם כתר ומסגרת-קשת · "מפתח המקצועות" בקווי-נקודות · המדריך בשני טורים עם כותרת-שער "שער ב׳",
 * רצועת-חסות, כרטיס מודגש במסגרת כפולה עם "מומלץ" · דפי-מודעות במסגרת כפולה (מקום פנוי מאוחד) · "תם ונשלם".
 * תוספות-הפורט נשמרות באותה שפה: **קוד-חיוג בן 3 ספרות ליד כל עסק**, דף מספרי-חירום, זמני השבוע, השגחה/מתאים.
 * 🛡 כל טקסט-משתמש עובר escHtml (גם " ו-') — אין סקריפט, אין קישור חיצוני, אין גופן-רשת (משפחות-גופן עם נפילה
 * לגופני-המערכת). רק עסקים **מאושרים**; הערה-פנימית ובקשות-תושבים לעולם לא נכנסות לחוברת.
 */
import type { IsoDate, ParnasaPrefs, PrAd, PrListing, PrPost } from '../../types/domain';
import { approvedListings, categoryOf, groupByCategory, hoursText, isFeatured, PR_AUD_NAMES, PR_MARK_LABELS, activeAds } from './lib';
import { emergencyNumbers, hebDateText, isIsoDate, locNote, PR_ZMANIM_NOTE, resolveZmanimLoc, weekZmanim } from './zmanimBoard';
import { hebcalParts } from '../../lib/telephony/engine';
import { gemYear } from '../../lib/hebrew';

/** escaping מלא ל-HTML (טקסט ומאפיינים): & < > " '. */
export function escHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface PrBookletSnapshot {
  listings: readonly PrListing[];
  ads: readonly PrAd[];
  posts: readonly PrPost[];
  prefs?: ParnasaPrefs | null;
}

export interface PrBookletOpts {
  /** יום-ההפקה (מוזרק — דטרמיניסטי). */
  todayIso: IsoDate;
  /** שם-המותג (termOf('nav.parnasa')) — ברירת 'פרנסה׳לע'. */
  brand?: string;
  /** דורס את prefs.communityName. */
  communityName?: string;
  /** נוסח-ההקדשה — דורס את prefs.bookletDedication ?? prefs.dedication; '' = בלי דף-הקדשה. */
  dedication?: string;
  /** לכלול מודעות (ברירת true). */
  includeAds?: boolean;
  /** רק מודעות ששולמו. */
  paidAdsOnly?: boolean;
  /** חיסכון בדיו — כריכה לבנה. */
  ink?: boolean;
  /** ימים בטבלת-הזמנים (ברירת 7; 0 = בלי דף-זמנים). */
  zmanimDays?: number;
  /** תחילת טבלת-הזמנים (ברירת todayIso). */
  zmanimFrom?: IsoDate;
  /** סמל-הפושקע לכריכה (PN_BOOK_MARK — SVG סטטי שנטען עצל); חסר ⇒ כריכה בלי הסמל. */
  mark?: string;
}

export interface PrBookletGate {
  key: string;
  num: string;
  name: string;
  count: number;
  /** נותן-החסות על השער ('' = פנוי). */
  sponsor: string;
}

export interface PrBookletPlan {
  gates: PrBookletGate[];
  listings: number;
  ads: { full: PrAd[]; half: PrAd[]; small: PrAd[] };
  hasDedication: boolean;
  hasZmanim: boolean;
  /** הערכת עמודי-A5 (נוסחת המקור + דף-חירום + דף-זמנים). */
  pages: number;
  /** עמודי-המדריך (שני טורים — הערכת המקור) ועמודי-המודעות (שלם · 2 חצאים · 6 קטנות לעמוד). */
  dirPages: number;
  adPages: number;
  /** כמה עמודי-מודעה שלמים עוד נכנסים עד כפולה של 4 (חוברת מקופלת). */
  spareFullPages: number;
}

/** מודעות-החוברת: פעילות, שלא פגו (תקופה שמתחילה בעתיד — כן: החוברת שנתית), לפי מפרסם. */
function bookletAds(ads: readonly PrAd[], todayIso: IsoDate, paidOnly: boolean): PrAd[] {
  return ads
    .filter((a) => a.slot === 'booklet' && a.active !== false && (!a.to || a.to >= todayIso) && (!paidOnly || a.paid))
    .sort((a, b) => a.advertiser.localeCompare(b.advertiser, 'he') || a.id.localeCompare(b.id));
}

function dedicationOf(snap: PrBookletSnapshot, opts: PrBookletOpts): string {
  if (opts.dedication !== undefined) return opts.dedication.trim();
  const p = snap.prefs ?? {};
  return String(p.bookletDedication ?? p.dedication ?? '').trim();
}

/** תוכן-העניינים החי + הערכת-העמודים (לפאנל-החוברת ולבדיקות). */
export function bookletPlan(snap: PrBookletSnapshot, opts: PrBookletOpts): PrBookletPlan {
  const gates = groupByCategory(snap.listings, opts.todayIso).map((g) => ({
    key: g.cat.key,
    num: g.cat.num,
    name: g.cat.name,
    count: g.items.length,
    sponsor: activeAds(snap.ads, 'category', opts.todayIso, g.cat.key)[0]?.advertiser ?? '',
  }));
  const listings = gates.reduce((n, g) => n + g.count, 0);
  const ads = opts.includeAds === false ? [] : bookletAds(snap.ads, opts.todayIso, opts.paidAdsOnly === true);
  const full = ads.filter((a) => a.kind === 'full');
  const half = ads.filter((a) => a.kind === 'half');
  const small = ads.filter((a) => a.kind === 'small');
  const hasDedication = !!dedicationOf(snap, opts);
  const hasZmanim = (opts.zmanimDays ?? 7) > 0;
  const directory = Math.max(1, Math.ceil((listings * 25 + gates.length * 22) / (2 * 176)));
  const adPages = full.length + Math.ceil(half.length / 2) + Math.ceil(small.length / 6);
  const pages = 1 + (hasDedication ? 1 : 0) + 1 + directory + 1 + (hasZmanim ? 1 : 0) + adPages + 1;
  return { gates, listings, ads: { full, half, small }, hasDedication, hasZmanim, pages, dirPages: directory, adPages, spareFullPages: (4 - (pages % 4)) % 4 };
}

const SERIF = '"Frank Ruhl Libre","David","Times New Roman",serif';
const RASHI = '"Noto Rashi Hebrew","Frank Ruhl Libre","David",serif';
const SANS = 'Assistant,"Noto Sans Hebrew",Arial,sans-serif';

/** BOOK_CSS של המקור (גופני-הרשת הוחלפו בנפילה לגופני-המערכת) + תוספות-הפורט (קוד-חיוג · חירום · זמנים). */
const CSS = [
  '@page{size:A5;margin:14mm 12mm 16mm;@bottom-center{content:counter(page,hebrew);font-family:' + SERIF + ';font-size:9pt;color:#555}}',
  '@page cover{margin:0;@bottom-center{content:none}}',
  '@page bare{@bottom-center{content:none}}',
  '*{box-sizing:border-box}',
  '[hidden]{display:none!important}',
  'html{-webkit-print-color-adjust:exact;print-color-adjust:exact}',
  'body{margin:0;direction:rtl;font-family:' + SANS + ';color:#16161a;font-size:9pt;line-height:1.4}',
  'h1,h2,h3{margin:0;font-family:' + SERIF + '}',
  '.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}',
  '.rule{display:block;width:58mm;height:4mm;color:#b8862e;margin:0 auto}',
  '.cover{page:cover;position:relative;width:148mm;height:209.5mm;overflow:hidden;color:#f6e6c4;background:radial-gradient(90% 55% at 50% 30%,rgba(255,170,120,.2) 0%,transparent 62%),linear-gradient(104deg,transparent 20%,rgba(255,214,226,.07) 32%,transparent 44%,transparent 60%,rgba(255,214,226,.09) 70%,transparent 80%),linear-gradient(180deg,#4d0a1c 0%,#6e1430 46%,#2a050f 100%);break-after:page}',
  '.cover .bh{position:absolute;top:6mm;right:9mm;font:700 10pt ' + SERIF + ';color:#e3c06e}',
  '.cover .frame{position:absolute;inset:13mm 12mm 20mm;border:1.2pt solid #c99536;outline:.6pt solid #c99536;outline-offset:2mm;border-radius:62mm 62mm 3mm 3mm/36mm 36mm 3mm 3mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2.6mm;padding:10mm 7mm 7mm;background:radial-gradient(80% 60% at 50% 40%,rgba(20,2,8,.35),transparent 70%)}',
  '.cover .mk{width:44mm;height:55mm;filter:drop-shadow(0 2mm 3mm rgba(0,0,0,.45))}',
  '.gm{display:inline-block;width:.2em;height:.32em;margin:0 .05em 0 .04em;vertical-align:.42em;fill:#f6d585;filter:drop-shadow(0 0 .6mm rgba(255,200,95,.95))}',
  '.cover .eyebrow{font-weight:700;font-size:8.5pt;letter-spacing:.14em;color:#e3c06e}',
  '.cover h1{font-size:44pt;font-weight:900;line-height:1;white-space:nowrap;background:linear-gradient(180deg,#fff6d6 0%,#f4d27c 40%,#bd8529 64%,#f2d58a 84%,#a06d1e 100%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:1mm}',
  '.cover .tag{font:600 9.5pt ' + SANS + ';letter-spacing:.06em;color:#f3dcae;margin-top:-1.4mm}',
  '.cover .comm{font:700 14pt/1.25 ' + SERIF + ';text-wrap:balance}',
  '.cover .rule{color:#e3c06e}',
  '.cover .verse{font-family:' + RASHI + ';font-size:10.5pt;opacity:.92}',
  '.cover .verse cite{display:block;font:normal 7pt ' + SANS + ';letter-spacing:.04em;color:#e3c06e;margin-top:1mm}',
  '.cover .year{margin-top:3mm;font:700 12pt ' + SERIF + ';color:#e3c06e;letter-spacing:.06em;border-block:.6pt solid #c99536;padding:1mm 7mm}',
  '.cover .fringe{position:absolute;inset-inline:0;bottom:9mm;height:.7mm;background:linear-gradient(90deg,#6b4512,#e2b65a 18%,#fff1c2 50%,#e2b65a 82%,#6b4512);box-shadow:0 0 3mm .6mm rgba(240,186,90,.45)}',
  '.ink .cover{background:#fff;color:#111}',
  '.ink .cover .frame{border-color:#111;outline-color:#111;background:none}',
  '.ink .cover h1{background:none;color:#111}',
  '.ink .cover .mk{filter:grayscale(1) contrast(1.05) brightness(1.15)}',
  '.ink .gm{fill:#111;filter:none}',
  '.ink .cover .eyebrow,.ink .cover .year,.ink .cover .bh,.ink .cover .verse cite,.ink .cover .rule,.ink .cover .tag{color:#111}',
  '.ink .cover .year{border-color:#111}',
  '.ink .cover .fringe{background:#111;box-shadow:none;height:.4mm}',
  '.pg{break-before:page}',
  '.fixed{height:179mm;overflow:hidden;display:flex;flex-direction:column}',
  '.ded,.end{page:bare;justify-content:center;align-items:center;text-align:center}',
  '.ded .dd{width:100%;min-height:150mm;justify-content:center;border:1pt solid #8a6416;outline:.5pt solid #8a6416;outline-offset:1.6mm;border-radius:46mm 46mm 2mm 2mm/26mm 26mm 2mm 2mm;padding:22mm 10mm 16mm;display:flex;flex-direction:column;align-items:center;gap:6mm}',
  '.ded .sc{width:13mm;height:9mm;color:#8a6416}',
  '.ded .dt{font:700 15pt/1.55 ' + SERIF + ';text-wrap:balance}',
  '.ded .tz{font:600 11pt ' + RASHI + ';letter-spacing:.24em;color:#8a6416}',
  '.ttl{text-align:center;margin-bottom:6mm}',
  '.ttl h2{font-size:21pt;font-weight:900;color:#5b0f22}',
  '.ttl .s{font-family:' + RASHI + ';font-size:8.5pt;color:#666;margin-top:1mm}',
  '.ttl .rule{margin-top:2.5mm}',
  '.ti{display:flex;align-items:baseline;gap:2.5mm;padding:1.7mm 0;font-size:10.5pt;break-inside:avoid}',
  '.tl{font:900 11pt ' + SERIF + ';color:#8a6416;min-width:7mm}',
  '.tt{font-weight:700}.tt small{display:block;font-weight:400;font-size:7.5pt;color:#666}',
  '.td{flex:1;border-bottom:1pt dotted #999;transform:translateY(-1mm);min-width:6mm}',
  '.tn{font:700 10.5pt ' + SERIF + ';font-variant-numeric:tabular-nums}',
  '.ti.x .tl{color:#5b0f22}',
  '.dir .sh{display:flex;align-items:baseline;gap:2.5mm;border-bottom:2.4pt double #8a6416;padding-bottom:1.2mm;margin:7mm 0 2.6mm;break-after:avoid}',
  '.dir .sh:first-child{margin-top:0}',
  '.sh .no{font:700 7.5pt ' + SANS + ';letter-spacing:.02em;background:#5b0f22;color:#f6e6c4;padding:.5mm 1.8mm;border-radius:.8mm;white-space:nowrap}',
  '.sh h2{font-size:14pt;font-weight:900;flex:1}',
  '.sh .c{font:700 9pt ' + SERIF + ';color:#8a6416}',
  '.ink .sh .no{background:none;color:#111;border:.6pt solid #111}',
  '.spn{text-align:center;font-size:8pt;padding:1.3mm 2mm;border-block:.5pt solid #b8862e;margin:0 0 2.8mm;break-after:avoid;background:#fbf6e8}',
  '.spn .k{font-family:' + RASHI + ';color:#8a6416}',
  '.spn strong{font-family:' + SERIF + ';font-size:9.5pt}',
  '.ink .spn{background:none}',
  '.cols{column-count:2;column-gap:5mm;column-rule:.4pt solid #d6ccb4}',
  '.e{break-inside:avoid;padding:1.5mm 0 1.7mm;border-bottom:.4pt dotted #b9ae96}',
  '.en{font:900 10.5pt/1.15 ' + SERIF + '}',
  '.et{font-size:8.2pt;color:#333}',
  '.eg{font-family:' + RASHI + ';font-size:8pt;color:#8a6416}',
  '.ep{font:800 11pt ' + SERIF + ';font-variant-numeric:tabular-nums;letter-spacing:.02em}',
  '.code{font:700 7pt ' + SANS + ';letter-spacing:0;color:#5b0f22;border:.5pt solid #8a6416;border-radius:.8mm;padding:0 1mm;margin-inline-start:1.6mm;vertical-align:1pt;white-space:nowrap}',
  '.ink .code{color:#111;border-color:#111}',
  '.em{font-size:7.4pt;color:#555}',
  '.marks,.ek{font-size:7pt;font-weight:700;color:#8a6416;margin-top:.4mm}',
  '.ek .u{direction:ltr;unicode-bidi:isolate;color:#5b0f22}',
  '.e.f{border:1.8pt double #8a6416;padding:1.6mm 2.2mm 1.8mm;margin:.6mm 0 2mm;background:#fbf6e8;border-radius:.6mm}',
  '.ink .e.f{background:none;border-color:#111}',
  '.rec{display:flex;align-items:center;gap:1mm;font:800 7pt ' + SANS + ';letter-spacing:.04em;color:#8a6416}',
  '.rec svg{width:3.6mm;height:2.4mm}',
  '.empty{text-align:center;color:#666;padding:20mm 0}',
  '.adpage{flex:1;display:grid;gap:4mm;min-height:0}',
  '.adpage.two{grid-template-rows:1fr 1fr}',
  '.adpage.six{grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:3mm}',
  '.ad{border:1.3pt solid #5b0f22;padding:1.6mm;min-height:0;overflow:hidden;display:flex}',
  '.ad-in{flex:1;border:.5pt solid #8a6416;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2.6mm;padding:5mm;min-height:0}',
  '.ad h3{font-weight:900;color:#5b0f22;line-height:1.12;text-wrap:balance}',
  '.ad p{margin:0;white-space:pre-wrap;text-wrap:balance;line-height:1.45}',
  '.ad-ph{font-family:' + SERIF + ';font-weight:900;direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums}',
  '.ad-by{font-size:.85em;letter-spacing:.03em;color:#8a6416;font-weight:700}',
  '.full .ad-in{border-width:.8pt;outline:.4pt solid #8a6416;outline-offset:-2.2mm}',
  '.full h3{font-size:28pt}.full p{font-size:13pt}.full .ad-ph{font-size:22pt}.full .ad-by{font-size:10pt}',
  '.half h3{font-size:18pt}.half p{font-size:10pt}.half .ad-ph{font-size:15pt}',
  '.small{padding:1mm}.small .ad-in{padding:2.4mm;gap:1.2mm}.small h3{font-size:11pt}.small p{font-size:7.6pt}.small .ad-ph{font-size:10.5pt}.small .ad-by{font-size:6.5pt}',
  '.vac{border:.8pt dashed #999}.vac .ad-in{border:0;color:#777}.vac h3{color:#777;font-size:12pt}.vac p{font-size:8.5pt}',
  '.end .ee{display:flex;flex-direction:column;align-items:center;gap:5mm;max-width:100mm}',
  '.fin{font:900 17pt/1.4 ' + SERIF + ';color:#5b0f22}',
  '.end p{margin:0;font-size:9.5pt;line-height:1.6;text-wrap:balance}',
  '.end b.ltr{font:900 14pt ' + SERIF + '}',
  '.end .disc{font-size:7.5pt;color:#666}',
  '.end .hd{font-family:' + RASHI + ';font-size:9pt;color:#8a6416}',
  '.end .brand{font:900 13pt ' + SERIF + ';color:#5b0f22}.end .brand .gm{fill:#b8862e;filter:none}.end .brand small{display:block;font:600 8pt ' + SANS + ';letter-spacing:.05em;color:#8a6416;margin-top:.6mm}',
  '.ink .end .brand{color:#111}',
  // תוספות-הפורט בשפת החוברת: מספרי-חירום וזמני-השבוע
  '.emg .tn{font-size:13pt;direction:ltr;unicode-bidi:isolate}',
  '.emg h3{font-size:12pt;color:#5b0f22;margin:7mm 0 2mm;border-bottom:2.4pt double #8a6416;padding-bottom:1.2mm}',
  '.zm table{width:100%;border-collapse:collapse}',
  '.zm th{font:700 7.5pt ' + SANS + ';background:#5b0f22;color:#f6e6c4;padding:1mm .5mm}',
  '.zm td{border-bottom:.4pt dotted #b9ae96;padding:1mm .5mm;text-align:center;font-size:8pt;font-variant-numeric:tabular-nums}',
  '.ink .zm th{background:none;color:#111;border-bottom:.6pt solid #111}',
  '.zm .note{font-size:7.5pt;color:#666;margin-top:3mm;text-align:center}',
  '@media screen{',
  'body{background:#d8d3c6;padding:0 0 20mm}',
  '.cover,.pg{width:148mm;margin:0 auto 8mm;box-shadow:0 2mm 8mm rgba(0,0,0,.25)}',
  '.pg{background:#fff;padding:14mm 12mm 16mm;min-height:210mm}',
  '.pg.fixed{height:210mm}',
  '.bar{position:sticky;top:0;z-index:2;margin:0 0 10mm;padding:3mm 5mm;background:#5b0f22;color:#f6e6c4;display:flex;flex-wrap:wrap;gap:2mm 5mm;align-items:center;justify-content:center;font-size:10.5pt;text-align:center}',
  '}',
  '@media print{.bar{display:none}.cover h1{background:none;-webkit-background-clip:border-box;background-clip:border-box;color:#e3c06e}.ink .cover h1{color:#111}}',
].join('\n');

const ltr = (s: string): string => '<span dir="ltr">' + escHtml(s) + '</span>';

/** קו-הקישוט של המקור (rule). */
const RULE =
  '<svg class="rule" viewBox="0 0 320 12" aria-hidden="true"><path d="M0 6 H130 M190 6 H320" stroke="currentColor" stroke-width="1"/><path d="M160 1 L166 6 L160 11 L154 6Z M140 6 L144 3 L148 6 L144 9Z M172 6 L176 3 L180 6 L176 9Z" fill="currentColor"/></svg>';
/** הכתר של המקור (CROWN). */
const CROWN_SVG = '<svg viewBox="0 0 24 16" aria-hidden="true"><path d="M2 14 L3.4 4.5 L8 9 L12 2 L16 9 L20.6 4.5 L22 14Z" fill="currentColor"/></svg>';
/** גרש-היהלום של סימן-המילה. */
const GM = '<svg class="gm" viewBox="0 0 10 16" aria-hidden="true"><path d="M5 0 10 8 5 16 0 8Z"/></svg>';
const TAGLINE = 'א פרנסה׳לע פאר יעדן איד';

/** סימן-המילה: הגרש (׳) כיהלום; שם בלי גרש ⇒ טקסט. */
function wordmarkHtml(brand: string): string {
  const i = brand.indexOf('׳');
  return i > 0 ? escHtml(brand.slice(0, i)) + GM + escHtml(brand.slice(i + 1)) : escHtml(brand);
}

/** "example.co.il" מכתובת-אתר (בלי פרוטוקול ונתיב — כמו host() במקור; החוברת בלי אף כתובת-רשת מלאה). */
function hostOf(url: string): string {
  return String(url ?? '')
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .split(/[/?#]/)[0]
    .replace(/^www\./i, '');
}

/**
 * טקסט-שעות כ-HTML (אשכול 8): כל טווח "08:00–19:00" בבידוד-LTR. בלי זה, בפסקה RTL מקף-הטווח (ON)
 * מפצל את שני המספרים והטווח מודפס הפוך ("19:00–08:00") לצד טבלת-הזמנים שמוצגת LTR. escaping מלא.
 */
export function hoursHtml(s: string): string {
  return String(s ?? '')
    .split(/(\d{1,2}:\d{2}\s*[–-]\s*(?:\d{1,2}:\d{2}|חצות))/)
    .map((p, i) => (i % 2 ? ltr(p) : escHtml(p)))
    .join('');
}

/** כרטיס במדריך (ent במקור): מודגש ⇒ מסגרת כפולה + "מומלץ" + שורת-הפרסום + האתר; קוד-החיוג ליד הטלפון. */
function entryHtml(l: PrListing, todayIso: IsoDate): string {
  const feat = isFeatured(l, todayIso);
  const marks: string[] = [];
  if (l.disc) marks.push(PR_MARK_LABELS.disc);
  if (l.free) marks.push(PR_MARK_LABELS.free);
  if (l.aud === 'men' || l.aud === 'women') marks.push(PR_AUD_NAMES[l.aud]);
  if (l.emergency) marks.push(PR_MARK_LABELS.emergency);
  if (l.kashrut.trim()) marks.push('השגחה: ' + l.kashrut.trim());
  const hours = hoursText(l);
  const meta = [l.city.trim() ? escHtml(l.city) : '', hours.trim() ? hoursHtml(hours) : ''].filter(Boolean).join(' · ');
  const host = feat && l.promoUrl ? hostOf(l.promoUrl) : '';
  return (
    '<div class="e' + (feat ? ' f' : '') + '">' +
    (feat ? '<div class="rec">' + CROWN_SVG + 'מומלץ</div>' : '') +
    '<div class="en">' + escHtml(l.name) + '</div>' +
    (l.title ? '<div class="et">' + escHtml(l.title) + '</div>' : '') +
    (feat && l.promoLine ? '<div class="eg">' + escHtml(l.promoLine) + '</div>' : '') +
    '<div class="ep">' + ltr(l.phone) + (l.dialCode ? '<span class="code">☎ קוד ' + escHtml(l.dialCode) + '</span>' : '') + '</div>' +
    (meta ? '<div class="em">' + meta + '</div>' : '') +
    (marks.length ? '<div class="marks">' + escHtml(marks.join(' · ')) + '</div>' : '') +
    (host ? '<div class="ek"><span class="u">' + escHtml(host) + '</span></div>' : '') +
    '</div>'
  );
}

/** מודעה (ad(a,z) במקור). */
function adHtml(a: PrAd, z: 'full' | 'half' | 'small'): string {
  const head = a.headline || a.advertiser;
  return (
    '<div class="ad ' + z + '"><div class="ad-in"><h3>' + escHtml(head) + '</h3>' +
    (a.body ? '<p>' + escHtml(a.body) + '</p>' : '') +
    (a.phone ? '<div class="ad-ph">' + escHtml(a.phone) + '</div>' : '') +
    (a.headline && a.advertiser && a.headline !== a.advertiser ? '<div class="ad-by">' + escHtml(a.advertiser) + '</div>' : '') +
    '</div></div>'
  );
}

/** "מקום זה שמור לפרסום" (vac במקור); style = תא מאוחד בדף-הקטנות. */
function vacantHtml(contactPhone: string, style = ''): string {
  return (
    '<div class="ad vac"' + (style ? ' style="' + style + '"' : '') + '><div class="ad-in"><h3>מקום זה שמור לפרסום</h3><p>בחוברת הבאה' +
    (contactPhone ? '<br>לפרטים: <span class="ltr">' + escHtml(contactPhone) + '</span>' : '') +
    '</p></div></div>'
  );
}

/** דפי-המודעות: עמוד-שלם = דף; חצי = 2 לדף; קטנה = 6 לדף (2×3) — המשבצות הפנויות מאוחדות לתא אחד, כמו המקור. */
function adPagesHtml(plan: PrBookletPlan, contactPhone: string): string {
  const pages: string[] = [];
  const page = (cls: string, inner: string): string => '<section class="pg fixed" data-sec="ads"><div class="adpage' + cls + '">' + inner + '</div></section>';
  for (const a of plan.ads.full) pages.push(page('', adHtml(a, 'full')));
  for (let i = 0; i < plan.ads.half.length; i += 2) {
    const two = plan.ads.half.slice(i, i + 2);
    pages.push(page(' two', two.map((a) => adHtml(a, 'half')).join('') + (two.length < 2 ? vacantHtml(contactPhone) : '')));
  }
  for (let i = 0; i < plan.ads.small.length; i += 6) {
    const six = plan.ads.small.slice(i, i + 6);
    let cells = six.map((a) => adHtml(a, 'small')).join('');
    let left = 6 - six.length;
    if (left && six.length % 2) {
      cells += vacantHtml(contactPhone);
      left--;
    }
    if (left) cells += vacantHtml(contactPhone, 'grid-column:1/-1;grid-row:span ' + left / 2);
    pages.push(page(' six', cells));
  }
  return pages.join('\n');
}

/**
 * החוברת כ-HTML מוכן-להדפסה (A5, RTL, מספרי-עמוד בגימטריה). טהור ודטרמיניסטי: אותו קלט ⇒ אותה
 * מחרוזת. "PDF" = "שמירה כ-PDF" בחלון-ההדפסה של הדפדפן.
 */
export function bookletHtml(snap: PrBookletSnapshot, opts: PrBookletOpts): string {
  const today = opts.todayIso;
  const prefs = snap.prefs ?? {};
  const brand = (opts.brand ?? '').trim() || 'פרנסה׳לע';
  const community = (opts.communityName ?? prefs.communityName ?? '').trim();
  const contactPhone = String(prefs.contactPhone ?? '').trim();
  const loc = resolveZmanimLoc(prefs.zmanim);
  const yearHe = isIsoDate(today) ? gemYear(hebcalParts(today, loc.tz).year) : '';
  const plan = bookletPlan(snap, opts);
  const dedication = dedicationOf(snap, opts);
  const gates = groupByCategory(snap.listings, today);
  const wm = wordmarkHtml(brand);
  const out: string[] = [];

  out.push(
    '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + escHtml(brand + ' · ' + (community ? community + ' ' : '') + yearHe) + '</title>' +
      '<style>' + CSS + '</style></head><body' + (opts.ink ? ' class="ink"' : '') + '>',
  );
  out.push('<div class="bar"><span>להדפסה: Ctrl+P · גודל נייר A5 · לסמן ״גרפיקת רקע״ · או ״שמירה כ־PDF״ לבית הדפוס</span></div>');

  // ── כריכה ──
  out.push(
    '<section class="cover" data-sec="cover"><div class="bh">ב״ה</div><div class="frame">' +
      (opts.mark && opts.mark.startsWith('<svg class="mk"') ? opts.mark : '') +
      '<div class="eyebrow">ספר המקצועות של הקהילה</div>' +
      '<h1 aria-label="' + escHtml(brand) + '">' + wm + '</h1>' +
      '<div class="tag">' + escHtml(TAGLINE) + '</div>' +
      '<div class="comm">' + escHtml(community || 'אנשי המקצוע שלנו') + '</div>' +
      RULE +
      '<div class="verse">וּבֵרַכְךָ ה׳ אֱלֹקֶיךָ בְּכֹל אֲשֶׁר תַּעֲשֶׂה<cite>דברים ט״ו, י״ח</cite></div>' +
      (yearHe ? '<div class="year">שנת ' + escHtml(yearHe) + '</div>' : '') +
      '</div><div class="fringe"></div></section>',
  );

  // ── הקדשה (אופציונלית) ──
  if (dedication) {
    out.push(
      '<section class="pg fixed ded" data-sec="dedication"><div class="dd">' +
        '<svg class="sc" viewBox="0 0 24 16" aria-hidden="true"><path d="M2 14 L3.4 4.5 L8 9 L12 2 L16 9 L20.6 4.5 L22 14Z" fill="currentColor"/></svg>' +
        '<div class="dt">' + escHtml(dedication) + '</div>' +
        (dedication.includes('נשמ') ? '<div class="tz">ת.נ.צ.ב.ה.</div>' : '') +
        RULE +
        '</div></section>',
    );
  }

  // ── מפתח המקצועות ──
  const adCount = plan.ads.full.length + plan.ads.half.length + plan.ads.small.length;
  const toc =
    plan.gates
      .map(
        (g) =>
          '<div class="ti"><span class="tl">' + escHtml(g.num) + '</span><span class="tt">' + escHtml(g.name) +
          (g.sponsor ? '<small>בחסות ' + escHtml(g.sponsor) + '</small>' : '') +
          '</span><span class="td"></span><span class="tn">' + g.count + '</span></div>',
      )
      .join('') + (adCount ? '<div class="ti x"><span class="tl">◆</span><span class="tt">מודעות</span><span class="td"></span><span class="tn">' + adCount + '</span></div>' : '');
  out.push(
    '<section class="pg" data-sec="index"><div class="ttl"><h2>מפתח המקצועות</h2><div class="s">שער · תחום · מספר אנשי המקצוע</div>' + RULE + '</div>' +
      (toc || '<div class="empty">האלפון עדיין ריק.</div>') +
      '</section>',
  );

  // ── המדריך (שני טורים, לפי שער) ──
  const dir: string[] = [];
  for (const g of gates) {
    dir.push('<div class="sh"><span class="no">שער ' + escHtml(g.cat.num) + '</span><h2>' + escHtml(g.cat.name) + '</h2><span class="c">' + g.items.length + '</span></div>');
    const sp = activeAds(snap.ads, 'category', today, g.cat.key)[0];
    if (sp)
      dir.push(
        '<div class="spn"><span class="k">השער בחסות</span> <strong>' + escHtml(sp.advertiser) + '</strong>' +
          (sp.headline.trim() ? ' · ' + escHtml(sp.headline) : '') +
          (sp.phone.trim() ? ' · <span class="ltr">' + escHtml(sp.phone) + '</span>' : '') +
          '</div>',
      );
    dir.push('<div class="cols">' + g.items.map((l) => entryHtml(l, today)).join('') + '</div>');
  }
  out.push('<section class="pg dir" data-sec="directory">' + (dir.length ? dir.join('') : '<div class="empty">האלפון עדיין ריק.</div>') + '</section>');

  // ── מספרי חירום (תוספת-הפורט) ──
  const emergency = emergencyNumbers(snap.posts, today);
  const emergencyBiz = approvedListings(snap.listings)
    .filter((l) => l.emergency)
    .sort((a, b) => a.name.localeCompare(b.name, 'he') || a.id.localeCompare(b.id));
  const emRow = (label: string, sub: string, phone: string): string =>
    '<div class="ti"><span class="tt">' + escHtml(label) + (sub ? '<small>' + escHtml(sub) + '</small>' : '') + '</span><span class="td"></span><span class="tn">' + escHtml(phone) + '</span></div>';
  out.push(
    '<section class="pg emg" data-sec="emergency"><div class="ttl"><h2>מספרי חירום</h2><div class="s">לשמור ליד הטלפון</div>' + RULE + '</div>' +
      emergency.map((e) => emRow(e.label, e.note, e.phone)).join('') +
      (emergencyBiz.length
        ? '<h3>בעלי מקצוע לקריאות חירום</h3>' +
          emergencyBiz.map((l) => emRow(l.name, categoryOf(l.category).short + (l.dialCode ? ' · ☎ קוד ' + l.dialCode : ''), l.phone)).join('')
        : '') +
      '</section>',
  );

  // ── זמני השבוע (תוספת-הפורט) ──
  if (plan.hasZmanim) {
    const rows = weekZmanim(isIsoDate(opts.zmanimFrom) ? opts.zmanimFrom : today, loc, opts.zmanimDays ?? 7);
    const trs = rows
      .map(
        (r) =>
          '<tr><td>' + escHtml(r.dayName) + '</td><td>' + escHtml(r.hebDate) + '</td><td>' + escHtml(r.alot) + '</td><td>' + escHtml(r.sunrise) +
          '</td><td>' + escHtml(r.shmaGra) + '</td><td>' + escHtml(r.chatzot) + '</td><td>' + escHtml(r.sunset) + '</td><td>' + escHtml(r.tzeis) +
          '</td><td>' + escHtml([r.candle ? 'הדלקה ' + r.candle : '', r.end && r.dow === 6 ? 'צאת השבת ' + r.end : r.end ? 'צאת החג ' + r.end : '', r.holiday].filter(Boolean).join(' · ')) +
          '</td></tr>',
      )
      .join('');
    out.push(
      '<section class="pg zm" data-sec="zmanim"><div class="ttl"><h2>זמני השבוע</h2>' + RULE + '</div>' +
        '<table><tr><th>יום</th><th>תאריך</th><th>עלות</th><th>נץ</th><th>סוף ק״ש (גר״א)</th><th>חצות</th><th>שקיעה</th><th>צאת</th><th>הערות</th></tr>' +
        trs +
        '</table><div class="note">' + escHtml(locNote(loc) + ' · ' + PR_ZMANIM_NOTE) + '</div></section>',
    );
  }

  // ── מודעות ──
  if (adCount) out.push(adPagesHtml(plan, contactPhone));

  // ── סוף דבר ──
  const hd = hebDateText(today, loc.tz);
  out.push(
    '<section class="pg fixed end" data-sec="end"><div class="ee">' + RULE +
      '<div class="fin">תם ונשלם<br>שבח לא־ל בורא עולם</div>' +
      '<p>להצטרפות לאלפון, לעדכון פרטים, לחסות על שער, להקדשה או לפרסום בחוברת הבאה' +
      (contactPhone ? ':<br><b class="ltr">' + escHtml(contactPhone) + '</b>' : ', פנו לגבאי הקהילה.') + '</p>' +
      '<p class="disc">הפרטים נמסרו על ידי בעלי המקצוע עצמם. אין בהופעה באלפון המלצה או אחריות, ויש לבדוק כל התקשרות לפני תחילת עבודה.</p>' +
      '<div class="hd">' + escHtml(community) + (community && hd ? ' · ' : '') + escHtml(hd) + '</div>' +
      '<div class="brand" aria-label="' + escHtml(brand) + '">' + wm + '<small>' + escHtml(TAGLINE) + '</small></div>' +
      RULE +
      '</div></section>',
  );
  out.push('</body></html>');
  return out.join('\n');
}
