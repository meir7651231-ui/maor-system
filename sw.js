/**
 * Service Worker של מאור (PWA) — שמרני במכוון:
 * 1. אונליין = התנהגות זהה להיום: כל מה שאינו asset ממוזער-בגיבוב נטען
 *    network-first (המטמון רק fallback לאופליין) — ריפוי-הגרסאות (version.json)
 *    וטעינת הקונפיג (config.json / c/<slug>/) נשארים טריים תמיד.
 * 2. ‏/assets/ (שמות-קבצים עם hash, אימיוטביליים) = cache-first — מהירות.
 * 3. רק GET ורק same-origin — בקשות Firebase/ענן לא נגעות לעולם.
 * הנתונים עצמם ממילא local-first (localStorage/IndexedDB) — האופליין המלא
 * מגיע ברגע שמעטפת-האפליקציה במטמון.
 */
const CACHE = 'maor-pwa-v1';

// טבעת-assets (21.8): כל build מייצר שמות-hash חדשים — בלי ניקוי המטמון היחיד
// היה תופח לנצח. אחרי put מוצלח גוזמים לתקרה: cache.keys() מוחזר בסדר-הכנסה
// ⇒ מוחקים מהראש (הישנים ביותר). דפנסיבי — כל כשל שקט, לא מפיל את ה-fetch.
const ASSET_KEEP = 80;
async function pruneAssets(cache) {
  try {
    const keys = await cache.keys();
    const assets = keys.filter((k) => new URL(k.url).pathname.includes('/assets/'));
    for (const k of assets.slice(0, Math.max(0, assets.length - ASSET_KEEP))) {
      await cache.delete(k).catch(() => {});
    }
  } catch { /* מטמון לא-זמין — מוותרים על הגיזום בלבד */ }
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('maor-pwa-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase/CDN — לא נוגעים

  // assets מגובבים — אימיוטביליים: מטמון קודם, רשת כגיבוי
  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      (async () => {
        // תחום למטמון שלנו בלבד (caches.match גלובלי מחפש בכל המטמונים ב-origin —
        // כולל שאריות של SW זר) + put עם catch (חריגת-quota לא מפילה את התשובה)
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) {
          cache.put(req, res.clone()).then(() => pruneAssets(cache)).catch(() => {});
        }
        return res;
      })(),
    );
    return;
  }

  // כל השאר (ניווטים, version.json, config.json, פונטים…) — רשת קודם,
  // מטמון רק כשאין רשת. תשובת-רשת תקינה מרעננת את עותק-האופליין.
  e.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        // put לא-ממתין — עם catch, אחרת דחייה (quota מלא וכד׳) הופכת לשגיאה לא-מטופלת.
        // clone() סינכרוני לפני ההחזרה — אחרי שהעמוד מתחיל לצרוך את הגוף clone זורק.
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      } catch {
        const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
        if (cached) return cached;
        throw new Error('offline');
      }
    })(),
  );
});
