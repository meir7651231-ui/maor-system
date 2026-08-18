/**
 * 🩺 מאבחן-חסימות (11.8, לקח בנייה-חכמה: גם דומיין עצמאי נחסם — הסננים
 * עובדים default-deny) — בודק מהדפדפן של הלקוח אילו נקודות-קצה נגישות,
 * ומייצר טקסט מדויק להקראה למוקד חברת-הסינון. הופך שיחת "לא עובד לי"
 * לצילום-מסך אחד עם רשימת-פתיחה מדויקת.
 *
 * ההיוריסטיקה: fetch במצב-cors לנקודת-קצה **שמחזירה כותרת CORS כשהיא נגישה**.
 * תשובה כלשהי (גם 4xx) עם CORS ⇒ הרשת פתוחה. כשל-רשת/timeout, או דף-חסימה
 * של סנן (שמגיע בלי CORS) ⇒ ה-fetch נדחה ⇒ נספר כחסום — וזה בדיוק מה שרוצים.
 *
 * ⚠️ תיקון 17.8: הבדיקות הקודמות פנו ל-`robots.txt` של securetoken/firestore —
 * אך Google **לא מחזירה כותרת CORS על robots.txt** ⇒ ה-fetch נכשל **בכל רשת,
 * פתוחה או חסומה** ⇒ אזעקת-שווא "חסום" קבועה שהבהילה לקוחות (ובעלים). עכשיו
 * הבדיקות פונות לנקודות-הקצה האמיתיות של ה-API (‏firestore documents · securetoken
 * token · identitytoolkit recaptchaParams), שכולן מחזירות `Access-Control-Allow-Origin`
 * כשהן נגישות — כך שרשת-פתוחה נמדדת כפתוחה, וחסימה-אמיתית עדיין נתפסת.
 */

import type { FirebaseOrgConfig } from '../types/config';

export interface NetCheckTarget {
  key: string;
  /** תווית ידידותית ("כניסה לחשבון"). */
  label: string;
  url: string;
  /** שיטת-הבקשה (ברירת-מחדל GET). securetoken מחזיר CORS רק על POST. */
  method?: 'GET' | 'POST';
  /** גוף-הבקשה (מחרוזת ⇒ text/plain ⇒ בקשה-פשוטה בלי preflight). */
  body?: string;
  /** הדומיין להקראה למוקד-הסינון. */
  domain: string;
}

export interface NetCheckResult extends NetCheckTarget {
  ok: boolean;
  /** משך הבדיקה במילישניות. */
  ms: number;
}

/** יעדי-הבדיקה — googleapis רק כשלארגון יש ענן (מקומי-בלבד לא תלוי בהם). */
export function netCheckTargets(origin: string, firebase?: FirebaseOrgConfig | null): NetCheckTarget[] {
  const bust = 'netcheck=' + Math.random().toString(36).slice(2);
  // מזהה-פרויקט/מפתח מהקונפיג — לבניית נתיב-API אמיתי שמחזיר CORS. חסר ⇒ ערך-בדיקה
  // ניטרלי (התשובה עדיין נושאת CORS — מודדים נגישות-רשת, לא תקינות-הבקשה).
  const projectId = firebase?.projectId || 'netcheck';
  const apiKey = firebase?.apiKey || 'netcheck';
  return [
    { key: 'site', label: 'האתר עצמו', url: origin + '/version.json?' + bust, domain: new URL(origin).host },
    ...(firebase
      ? [
          {
            key: 'auth',
            label: 'כניסה לחשבון (Auth)',
            url: 'https://identitytoolkit.googleapis.com/v1/recaptchaParams?' + bust,
            domain: 'identitytoolkit.googleapis.com',
          },
          {
            key: 'token',
            label: 'חידוש-חיבור (Token)',
            // securetoken מחזיר CORS רק על POST ל-/v1/token (‏robots.txt חסר-CORS).
            // גוף-מחרוזת ⇒ text/plain ⇒ בקשה-פשוטה בלי preflight; התשובה 400 עם CORS.
            url: 'https://securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(apiKey) + '&' + bust,
            method: 'POST' as const,
            body: 'grant_type=refresh_token&refresh_token=netcheck',
            domain: 'securetoken.googleapis.com',
          },
          {
            key: 'db',
            label: 'סנכרון נתונים (Firestore)',
            // נתיב-מסמכים אמיתי מחזיר CORS (‏robots.txt לא). מסמך-דמה שלא-קיים ⇒
            // 4xx עם CORS ⇒ נמדד כפתוח; חסימה ⇒ ה-fetch נדחה ⇒ חסום.
            url:
              'https://firestore.googleapis.com/v1/projects/' +
              encodeURIComponent(projectId) +
              '/databases/(default)/documents/__netcheck__/__probe__?' +
              bust,
            domain: 'firestore.googleapis.com',
          },
        ]
      : []),
  ];
}

/** בדיקת יעד יחיד — תשובה כלשהי = פתוח; כשל/timeout = חסום. */
async function checkOne(t: NetCheckTarget, timeoutMs: number): Promise<NetCheckResult> {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    await fetch(t.url, { method: t.method ?? 'GET', body: t.body, signal: ctrl.signal, cache: 'no-store' });
    return { ...t, ok: true, ms: Date.now() - started };
  } catch {
    return { ...t, ok: false, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

/** הרצת כל הבדיקות במקביל. */
export function runNetCheck(targets: NetCheckTarget[], timeoutMs = 8000): Promise<NetCheckResult[]> {
  return Promise.all(targets.map((t) => checkOne(t, timeoutMs)));
}

/** הטקסט להקראה/שליחה למוקד חברת-הסינון — רק על סמך מה שנחסם בפועל. */
export function netCheckScript(results: NetCheckResult[]): string {
  const blocked = results.filter((r) => !r.ok);
  if (!blocked.length) return '';
  return [
    'שלום, אני משתמש/ת במערכת ניהול לעמותה לצורכי עבודה,',
    'ואבקש לפתוח את הכתובות הבאות (כלי-עבודה, ללא תוכן גולשים):',
    ...blocked.map((r) => '• ' + r.domain),
    'תודה רבה!',
  ].join('\n');
}
