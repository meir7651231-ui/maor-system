/**
 * 📒 פרנסה׳לע — חוברת A5 להדפסה / "שמירה כ-PDF" (אשכול 3 · טהור: מחזיר מחרוזת בלבד, כמו
 * receiptHtml; ההדפסה/ההורדה — דרך iframe נסתר / downloadTextFile עם guardExport אצל הקורא).
 *
 * המבנה (מהמקור, §6): כריכה · הקדשה (אופציונלית) · מפתח-המקצועות · מדריך בשני טורים לפי שער
 * (מודגשים ראשונים, **קוד-חיוג בן 3 ספרות ליד כל עסק** — הפער שהמקור סימן) · דף מספרי-חירום ·
 * זמני השבוע · דפי-מודעות (עמוד/חצי/קטנה + "מקום פנוי") · סוף-דבר.
 * 🛡 כל טקסט-משתמש עובר escHtml (גם " ו-') — אין סקריפט, אין קישור חיצוני, אין גופן-רשת.
 * רק עסקים **מאושרים**; הערה-פנימית ובקשות-תושבים לעולם לא נכנסות לחוברת.
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
  return { gates, listings, ads: { full, half, small }, hasDedication, hasZmanim, pages, spareFullPages: (4 - (pages % 4)) % 4 };
}

const CSS = [
  '@page{size:A5;margin:14mm 12mm 16mm;@bottom-center{content:counter(page,hebrew);font-size:9pt;color:#555}}',
  '@page plain{@bottom-center{content:none}}',
  '*{box-sizing:border-box}',
  'body{margin:0;direction:rtl;color:#1b1b1b;font-family:"Assistant","Arial","Noto Sans Hebrew",sans-serif;font-size:10pt;line-height:1.45}',
  'h1,h2,h3,.serif{font-family:"Frank Ruhl Libre","David","Times New Roman",serif}',
  '.bar{position:sticky;top:0;z-index:2;background:#fff8e1;border-bottom:1px solid #e0c97a;padding:6px 12px;font-size:12px}',
  '@media print{.bar{display:none}}',
  '.page{break-after:page;page-break-after:always}',
  '.plain{page:plain}',
  '.cover{min-height:180mm;text-align:center;padding:20mm 8mm;background:#4d0a1c;color:#f3e3b5;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
  'body.ink .cover{background:#fff;color:#111;border:1px solid #111}',
  '.cover .bh{text-align:right;font-size:10pt}.cover .eyebrow{letter-spacing:.06em;font-size:10pt;margin-top:14mm}',
  '.cover h1{font-size:30pt;margin:6mm 0 2mm}.cover .tag{font-size:11pt;opacity:.9}.cover .comm{font-size:16pt;margin:10mm 0 4mm}',
  '.cover .verse{font-size:12pt;margin-top:14mm}.cover .src{font-size:9pt;opacity:.85}.cover .year{margin-top:8mm;font-size:12pt}',
  '.rule{border:0;border-top:1px solid currentColor;width:40%;margin:6mm auto;opacity:.6}',
  '.dedication{text-align:center;padding-top:40mm;font-size:14pt}.dedication .crown{font-size:22pt}',
  '.index table,.zmanim table{width:100%;border-collapse:collapse}',
  '.index td{padding:1.4mm 0;border-bottom:1px dotted #999}.index td.n{width:12mm;font-weight:700}.index td.c{width:16mm;text-align:left}',
  '.index .sp{font-size:8.5pt;color:#7a5b12}',
  '.dir{column-count:2;column-gap:6mm;column-rule:1px solid #ccc}',
  '.gate-h{break-after:avoid;margin:3mm 0 2mm;padding:1mm 2mm;background:#f1e6cc;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
  '.sponsor{break-inside:avoid;font-size:8.5pt;border:1px dashed #b08d2e;padding:1mm 2mm;margin-bottom:2mm}',
  '.entry{break-inside:avoid;margin:0 0 3mm}.entry.feat{border:1px solid #b08d2e;padding:1.5mm 2mm}',
  '.entry .nm{font-weight:700}.entry .seal{font-size:8pt;color:#7a5b12;margin-inline-start:2mm}',
  '.entry .ti{font-size:9pt}.entry .ph{font-size:11.5pt;font-weight:700}.entry .code{font-size:8.5pt;font-weight:400;border:1px solid #999;border-radius:3px;padding:0 1mm;margin-inline-start:2mm}',
  '.entry .meta,.entry .marks{font-size:8.5pt;color:#444}',
  '.empty{text-align:center;color:#666;padding:10mm 0}',
  '.emergency li{font-size:12pt;margin:2mm 0}.emergency .ph{font-weight:700}',
  '.zmanim th,.zmanim td{border-bottom:1px solid #ddd;padding:1mm .5mm;text-align:center;font-size:8.5pt}.zmanim .note{font-size:8pt;color:#555;margin-top:3mm}',
  '.adpage{display:grid;gap:4mm;min-height:170mm}.adpage.full{grid-template-rows:1fr}.adpage.half{grid-template-rows:1fr 1fr}.adpage.small{grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr)}',
  '.ad{border:1px solid #888;padding:3mm;overflow:hidden}.ad h3{margin:0 0 2mm}.ad .body{white-space:pre-line}.ad .by{font-size:8pt;color:#555;margin-top:2mm}',
  '.ad.vacant{border-style:dashed;color:#777;text-align:center;display:flex;flex-direction:column;justify-content:center}',
  '.end{text-align:center;padding-top:30mm}.end .disc{font-size:8.5pt;color:#555;margin-top:10mm}',
].join('\n');

const ltr = (s: string): string => '<span dir="ltr">' + escHtml(s) + '</span>';

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
  return (
    '<div class="entry' + (feat ? ' feat' : '') + '">' +
    '<div class="nm">' + escHtml(l.name) + (feat ? '<span class="seal">👑 מומלץ</span>' : '') + '</div>' +
    (l.title ? '<div class="ti">' + escHtml(l.title) + '</div>' : '') +
    '<div class="ph">' + ltr(l.phone) + (l.dialCode ? '<span class="code">☎ קוד ' + escHtml(l.dialCode) + '</span>' : '') + '</div>' +
    (meta ? '<div class="meta">' + meta + '</div>' : '') +
    (marks.length ? '<div class="marks">' + escHtml(marks.join(' · ')) + '</div>' : '') +
    '</div>'
  );
}

function adHtml(a: PrAd): string {
  return (
    '<div class="ad ' + escHtml(a.kind) + '">' +
    '<h3>' + escHtml(a.headline || a.advertiser) + '</h3>' +
    (a.body ? '<div class="body">' + escHtml(a.body) + '</div>' : '') +
    (a.phone ? '<div class="ph">' + ltr(a.phone) + '</div>' : '') +
    '<div class="by">' + escHtml(a.advertiser) + '</div>' +
    '</div>'
  );
}

function vacantHtml(contactPhone: string): string {
  return (
    '<div class="ad vacant"><div>מקום זה שמור לפרסום</div><div>בחוברת הבאה</div>' +
    (contactPhone ? '<div>לפרטים: ' + ltr(contactPhone) + '</div>' : '') +
    '</div>'
  );
}

/** דפי-המודעות: עמוד-שלם = דף; חצי = 2 לדף; קטנה = 6 לדף (2×3); משבצות-חסר = "מקום פנוי". */
function adPagesHtml(plan: PrBookletPlan, contactPhone: string): string {
  const pages: string[] = [];
  for (const a of plan.ads.full) pages.push('<section class="page adpage full" data-sec="ads">' + adHtml(a) + '</section>');
  for (let i = 0; i < plan.ads.half.length; i += 2) {
    const two = plan.ads.half.slice(i, i + 2).map(adHtml);
    while (two.length < 2) two.push(vacantHtml(contactPhone));
    pages.push('<section class="page adpage half" data-sec="ads">' + two.join('') + '</section>');
  }
  for (let i = 0; i < plan.ads.small.length; i += 6) {
    const six = plan.ads.small.slice(i, i + 6).map(adHtml);
    while (six.length < 6) six.push(vacantHtml(contactPhone));
    pages.push('<section class="page adpage small" data-sec="ads">' + six.join('') + '</section>');
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
  const out: string[] = [];

  out.push(
    '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + escHtml(brand + ' · ' + (community ? community + ' ' : '') + yearHe) + '</title>' +
      '<style>' + CSS + '</style></head><body' + (opts.ink ? ' class="ink"' : '') + '>',
  );
  out.push('<div class="bar">להדפסה: Ctrl+P · גודל נייר A5 · לסמן ״גרפיקת רקע״ · או ״שמירה כ־PDF״ לבית הדפוס</div>');

  // ── כריכה ──
  out.push(
    '<section class="page plain cover" data-sec="cover">' +
      '<div class="bh">ב״ה</div>' +
      '<div class="eyebrow">ספר המקצועות של הקהילה</div>' +
      '<h1>' + escHtml(brand) + '</h1>' +
      '<div class="tag">א פרנסה׳לע פאר יעדן איד</div>' +
      '<div class="comm">' + escHtml(community || 'אנשי המקצוע שלנו') + '</div>' +
      '<hr class="rule">' +
      '<div class="verse serif">וּבֵרַכְךָ ה׳ אֱלֹקֶיךָ בְּכֹל אֲשֶׁר תַּעֲשֶׂה</div><div class="src">דברים ט״ו, י״ח</div>' +
      '<div class="year">שנת ' + escHtml(yearHe) + '</div>' +
      '</section>',
  );

  // ── הקדשה (אופציונלית) ──
  if (dedication) {
    out.push(
      '<section class="page plain dedication" data-sec="dedication"><div class="crown">👑</div>' +
        '<div class="serif">' + escHtml(dedication) + '</div>' +
        (dedication.includes('נשמ') ? '<div>ת.נ.צ.ב.ה.</div>' : '') +
        '<hr class="rule"></section>',
    );
  }

  // ── מפתח המקצועות ──
  const indexRows = plan.gates
    .map(
      (g) =>
        '<tr><td class="n">' + escHtml(g.num) + '</td><td>' + escHtml(g.name) +
        (g.sponsor ? ' <span class="sp">· בחסות ' + escHtml(g.sponsor) + '</span>' : '') +
        '</td><td class="c">' + g.count + '</td></tr>',
    )
    .join('');
  const adCount = plan.ads.full.length + plan.ads.half.length + plan.ads.small.length;
  out.push(
    '<section class="page index" data-sec="index"><h2>מפתח המקצועות</h2>' +
      '<div class="serif">שער · תחום · מספר אנשי המקצוע</div>' +
      (indexRows ? '<table>' + indexRows + '</table>' : '<div class="empty">המדריך עדיין ריק.</div>') +
      (adCount ? '<p>◆ מודעות ' + adCount + '</p>' : '') +
      '</section>',
  );

  // ── המדריך (שני טורים) ──
  const dir: string[] = [];
  for (const g of gates) {
    dir.push('<div class="gate-h">שער ' + escHtml(g.cat.num) + ' · ' + escHtml(g.cat.name) + ' · ' + g.items.length + '</div>');
    const sp = activeAds(snap.ads, 'category', today, g.cat.key)[0];
    if (sp) dir.push('<div class="sponsor">השער בחסות ' + escHtml([sp.advertiser, sp.headline, sp.phone].filter((x) => x && x.trim()).join(' · ')) + '</div>');
    for (const l of g.items) dir.push(entryHtml(l, today));
  }
  out.push('<section class="page dir" data-sec="directory">' + (dir.length ? dir.join('') : '<div class="empty">המדריך עדיין ריק.</div>') + '</section>');

  // ── מספרי חירום ──
  const emergency = emergencyNumbers(snap.posts, today);
  const emergencyBiz = approvedListings(snap.listings)
    .filter((l) => l.emergency)
    .sort((a, b) => a.name.localeCompare(b.name, 'he') || a.id.localeCompare(b.id));
  out.push(
    '<section class="page emergency" data-sec="emergency"><h2>מספרי חירום</h2><ul>' +
      emergency.map((e) => '<li><strong>' + escHtml(e.label) + '</strong> — <span class="ph">' + ltr(e.phone) + '</span>' + (e.note ? ' · ' + escHtml(e.note) : '') + '</li>').join('') +
      '</ul>' +
      (emergencyBiz.length
        ? '<h3>בעלי מקצוע לקריאות חירום</h3><ul>' +
          emergencyBiz
            .map((l) => '<li>' + escHtml(l.name) + ' · ' + escHtml(categoryOf(l.category).short) + ' — ' + ltr(l.phone) + (l.dialCode ? ' · קוד ' + escHtml(l.dialCode) : '') + '</li>')
            .join('') +
          '</ul>'
        : '') +
      '</section>',
  );

  // ── זמני השבוע ──
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
      '<section class="page zmanim" data-sec="zmanim"><h2>זמני השבוע</h2>' +
        '<table><tr><th>יום</th><th>תאריך</th><th>עלות</th><th>נץ</th><th>סוף ק״ש (גר״א)</th><th>חצות</th><th>שקיעה</th><th>צאת</th><th>הערות</th></tr>' +
        trs +
        '</table><div class="note">' + escHtml(locNote(loc) + ' · ' + PR_ZMANIM_NOTE) + '</div></section>',
    );
  }

  // ── מודעות ──
  if (adCount) out.push(adPagesHtml(plan, contactPhone));

  // ── סוף דבר ──
  out.push(
    '<section class="page plain end" data-sec="end"><div class="serif">תם ונשלם · שבח לא־ל בורא עולם</div><hr class="rule">' +
      '<div>להצטרפות ל' + escHtml(brand) + ', לעדכון פרטים, לחסות על שער, להקדשה או לפרסום בחוברת הבאה' +
      (contactPhone ? ': ' + ltr(contactPhone) : ', פנו לגבאי הקהילה.') + '</div>' +
      '<div class="disc">הפרטים נמסרו על ידי בעלי המקצוע עצמם. אין בהופעה בחוברת המלצה או אחריות, ויש לבדוק כל התקשרות לפני תחילת עבודה.</div>' +
      '<div>' + escHtml((community ? community + ' · ' : '') + hebDateText(today, loc.tz)) + '</div>' +
      '<div class="serif">' + escHtml(brand) + ' · א פרנסה׳לע פאר יעדן איד</div>' +
      '</section>',
  );
  out.push('</body></html>');
  return out.join('\n');
}
