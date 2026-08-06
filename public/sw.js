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
        const cached = await caches.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
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
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch {
        const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
        if (cached) return cached;
        throw new Error('offline');
      }
    })(),
  );
});
