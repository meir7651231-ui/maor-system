/**
 * Cloudflare Worker «meorhachessed-site» — מגיש את האתר-הציבורי של מאור החסד על meorhachessed.com (+www).
 * מקור-אמת לקוד שרץ ב-Cloudflare (חשבון הבעלים); פריסה דרך Cloudflare API (ראו knowledge/CLOSED-PUBLIC-SITE-DOMAIN-2026-10-26.md).
 *
 * 1. proxy שקוף ל-github.io (מתעדכן מיד במיזוג ל-main — לא תלוי ב-cron של orbit-il); Location מתוקן.
 * 2. (26.10.2026) מטא-שיתוף: וואטסאפ/פייסבוק לא מריצים JS ⇒ הכותרת/תיאור/תמונה חייבים להיות ב-HTML עצמו.
 *    HTMLRewriter מחליף את <title> ומזריק description + og:* + twitter:* — רק בדף-ה-HTML.
 * 3. (26.10.2026) אייקונים: ה-HTML הבסיסי נושא את אייקוני-אורביט ⇒ מוחלפים בלוגו של מאור
 *    (גם לפני שה-JS רץ — אייפון/מסך-הבית/תצוגות-קישור).
 * 5. (29.10.2026) ‏<meta name="visitor-country"> — מדינת-הגולש (Cloudflare) ⇒ תרומה מחו״ל לסולה.
 * 4. (26.10.2026) גוגל ומדידה: /sitemap.xml · נתונים-מובנים (schema.org NGO, JSON-LD) · Cloudflare Web Analytics
 *    (בלי עוגיות; site_token ציבורי מטבעו — מוטמע בכל דף).
 */
const ORIGIN = 'https://meir7651231-ui.github.io/maor-system';
const META = {
  title: 'מאור החסד — הבית ליתומים ואלמנות',
  description: 'מאז 1994 · בית פתוח 24/7 ל-600 אלמנות ו-2,000 יתומים · בברכת גדולי ישראל. תרומה מוכרת לפי סעיף 46 (ע״ר 580651719).',
  image: 'https://meorhachessed.com/c/maor-hachesed/og.jpg',
  url: 'https://meorhachessed.com/',
};
const ICONS = '/c/maor-hachesed/icons/';
// מפתח ה-API הציבורי של Firebase (כבר מופיע בקונפיג-הלקוח הציבורי) — זהה ל-publicSiteDocUrl באפליקציה
const CLOUD_SITE_URL = 'https://firestore.googleapis.com/v1/projects/maor-system/databases/(default)/documents/publicSites/maor-hachesed?key=AIzaSyCVvJvJAnTEWSzdtmONXcZyRijHdrvPeIo';
const CF_BEACON_TOKEN = '65ac9d3e461d477e83a9a190e37bb891';
const SITEMAP_LASTMOD = '2026-10-26';
const LD = {
  '@context': 'https://schema.org',
  '@type': 'NGO',
  name: 'מאור החסד',
  alternateName: ['מאור החסד מיסודה של הרבנית לוצקין ע״ה', 'Meor Hachesed Lutzkin'],
  url: 'https://meorhachessed.com/',
  logo: 'https://meorhachessed.com/c/maor-hachesed/icons/icon-512.png',
  image: 'https://meorhachessed.com/c/maor-hachesed/og.jpg',
  description: 'בית פתוח 24/7 ליתומים ולאלמנות — ליווי אישי, הכנסת כלה, שמחות, טיולים וטיפולים. בברכת גדולי ישראל.',
  telephone: '+972-54-853-8794',
  email: 'm0548538794@gmail.com',
  taxID: '580651719',
  address: { '@type': 'PostalAddress', streetAddress: 'אדוניהו הכהן 23', addressLocality: 'ירושלים', postalCode: '9534311', addressCountry: 'IL' },
  sameAs: ['https://www.guidestar.org.il/organization/580651719'],
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default {
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === '/sitemap.xml') {
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${META.url}</loc><lastmod>${SITEMAP_LASTMOD}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>\n`, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
    }
    const target = ORIGIN + (u.pathname === '/' ? '/' : u.pathname) + u.search;
    const res = await fetch(target, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body, redirect: 'manual' });
    const h = new Headers(res.headers);
    const loc = h.get('location');
    if (loc && loc.startsWith(ORIGIN)) h.set('location', loc.slice(ORIGIN.length) || '/');
    const out = new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
    if (!(h.get('content-type') || '').includes('text/html')) return out;
    // 🌍 (29.10.2026, «ברגע שזה חו״ל אז הכפתור יהיה לסולה») — המדינה ש-Cloudflare זיהה; האתר מנתב חו״ל לסליקת-סולה.
    const country = /^[A-Z]{2}$/.test(String(req.cf?.country || '')) ? req.cf.country : '';
    const tags = [
      ...(country ? [`<meta name="visitor-country" content="${country}">`] : []),
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
      `<link rel="sitemap" type="application/xml" href="/sitemap.xml">`,
      // ⚡ (29.10.2026) קונפיג-הארגון נדרש לציור הראשון — מורד במקביל ל-JS (נתיב קבוע; ה-fetch באפליקציה: no-cache ⇒ crossorigin+as=fetch)
      `<link rel="preload" href="/c/maor-hachesed/config.json" as="fetch" crossorigin="anonymous">`,
      // 🌐 (29.10.2026) תוכן-האתר שנערך במשרד (Firestore REST, קריאה ציבורית) — במקביל, כדי שלא יוסיף זמן-טעינה
      `<link rel="preload" href="${CLOUD_SITE_URL}" as="fetch" crossorigin="anonymous">`,
      `<script type="application/ld+json">${JSON.stringify(LD).replace(/</g, '\\u003c')}</script>`,
      `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${CF_BEACON_TOKEN}"}'></script>`,
    ].join('');
    return new HTMLRewriter()
      .on('title', { element(e) { e.setInnerContent(META.title); } })
      .on('meta[name="description"]', { element(e) { e.remove(); } })
      .on('link[rel="icon"]', { element(e) { e.removeAttribute('type'); e.setAttribute('href', ICONS + 'favicon-64.png'); } })
      .on('link[rel="apple-touch-icon"]', { element(e) { e.setAttribute('href', ICONS + 'apple-touch-icon.png'); } })
      .on('head', { element(e) { e.append(tags, { html: true }); } })
      .transform(out);
  },
};
