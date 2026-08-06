/**
 * PWA — רישום ה-service-worker ומניפסט פר-ארגון (white-label).
 *
 * רישום: רק בדפדפן אמיתי (לא Playwright — navigator.webdriver), רק ב-build
 * פרודקשן (לא נלחמים ב-HMR), ורק כשדגל shell.pwa דלוק. הכיבוי (דגל false)
 * גם מסיר רישום קיים — מתג-חירום אמיתי לבעלים.
 *
 * מניפסט פר-ארגון: המניפסט הסטטי נושא את מיתוג ברירת-המחדל; ארגון-לקוח
 * (slug≠default) מקבל מניפסט-Blob דינמי עם השם שלו ו-start_url שמשמר את
 * ‎?org=<slug>‎ — כתובות אבסולוטיות בלבד (בסיס-blob אטום לא פותר יחסיות).
 */
import type { OrgConfig } from '../types/config';
import { featureOn } from './config';

export function registerPwa(config: OrgConfig): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (navigator.webdriver) return; // סוויטות-הדפדפן — אפס התערבות במטמון
  if (!import.meta.env.PROD) return;
  const swUrl = new URL(import.meta.env.BASE_URL + 'sw.js', window.location.href).href;
  if (!featureOn(config, 'shell.pwa')) {
    // מתג-חירום: הדגל כובה ⇒ מסירים את הרישום שלנו (ורק את שלנו)
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const r of regs) if (r.active?.scriptURL === swUrl) void r.unregister();
    });
    return;
  }
  void navigator.serviceWorker.register(swUrl).catch(() => {
    /* רישום נכשל (דפדפן ישן/מצב-פרטי) — האתר ממשיך כרגיל */
  });
}

/** מניפסט דינמי לארגון-לקוח — שם והתקנה עם ?org כדי שהאפליקציה תיפתח בארגון הנכון. */
export function applyOrgManifest(config: OrgConfig): void {
  if (typeof document === 'undefined') return;
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return;
  const slug = config.slug || 'default';
  const name = (config.orgName || '').trim();
  if (slug === 'default' || !name) return; // אתר-השורש — המניפסט הסטטי כמות-שהוא
  const base = new URL(import.meta.env.BASE_URL, window.location.href).href;
  const manifest = {
    name,
    short_name: name.length > 12 ? name.slice(0, 12) : name,
    lang: 'he',
    dir: 'rtl',
    start_url: base + '?org=' + encodeURIComponent(slug),
    scope: base,
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#211d17',
    background_color: '#faf7f2',
    icons: [
      { src: base + 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: base + 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: base + 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  link.setAttribute('href', URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })));
}
