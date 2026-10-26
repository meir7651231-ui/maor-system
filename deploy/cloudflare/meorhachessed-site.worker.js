/**
 * Cloudflare Worker «meorhachessed-site» — מגיש את האתר-הציבורי של מאור החסד על meorhachessed.com (+www).
 * מקור-אמת לקוד שרץ ב-Cloudflare (חשבון הבעלים); פריסה דרך Cloudflare API (ראו knowledge/CLOSED-PUBLIC-SITE-DOMAIN-2026-10-26.md).
 *
 * 1. proxy שקוף ל-github.io (מתעדכן מיד במיזוג ל-main — לא תלוי ב-cron של orbit-il); Location מתוקן.
 * 2. (26.10.2026) מטא-שיתוף: וואטסאפ/פייסבוק לא מריצים JS ⇒ הכותרת/תיאור/תמונה חייבים להיות ב-HTML עצמו.
 *    HTMLRewriter מחליף את <title> ומזריק description + og:* + twitter:* — רק בדף-ה-HTML.
 */
const ORIGIN = 'https://meir7651231-ui.github.io/maor-system';
const META = {
  title: 'מאור החסד — הבית ליתומים ואלמנות',
  description: 'מאז 1994 · בית פתוח 24/7 ל-600 אלמנות ו-2,000 יתומים · בברכת גדולי ישראל. תרומה מוכרת לפי סעיף 46 (ע״ר 580651719).',
  image: 'https://meorhachessed.com/c/maor-hachesed/og.jpg',
  url: 'https://meorhachessed.com/',
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default {
  async fetch(req) {
    const u = new URL(req.url);
    const target = ORIGIN + (u.pathname === '/' ? '/' : u.pathname) + u.search;
    const res = await fetch(target, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body, redirect: 'manual' });
    const h = new Headers(res.headers);
    const loc = h.get('location');
    if (loc && loc.startsWith(ORIGIN)) h.set('location', loc.slice(ORIGIN.length) || '/');
    const out = new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
    if (!(h.get('content-type') || '').includes('text/html')) return out;
    const tags = [
      `<meta name="description" content="${esc(META.description)}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="מאור החסד">`,
      `<meta property="og:locale" content="he_IL">`,
      `<meta property="og:title" content="${esc(META.title)}">`,
      `<meta property="og:description" content="${esc(META.description)}">`,
      `<meta property="og:url" content="${META.url}">`,
      `<meta property="og:image" content="${META.image}">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta name="twitter:card" content="summary_large_image">`,
    ].join('');
    return new HTMLRewriter()
      .on('title', { element(e) { e.setInnerContent(META.title); } })
      .on('meta[name="description"]', { element(e) { e.remove(); } })
      .on('head', { element(e) { e.append(tags, { html: true }); } })
      .transform(out);
  },
};
