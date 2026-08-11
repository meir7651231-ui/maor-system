/**
 * 🩺 מאבחן-חסימות (11.8, לקח בנייה-חכמה: גם דומיין עצמאי נחסם — הסננים
 * עובדים default-deny) — בודק מהדפדפן של הלקוח אילו נקודות-קצה נגישות,
 * ומייצר טקסט מדויק להקראה למוקד חברת-הסינון. הופך שיחת "לא עובד לי"
 * לצילום-מסך אחד עם רשימת-פתיחה מדויקת.
 *
 * ההיוריסטיקה: כל תשובת-HTTP (גם 4xx מ-googleapis) = הרשת פתוחה; כשל-רשת
 * (TypeError / timeout) = חסימה. דף-חסימה של סנן מחזיר תשובה בלי CORS ⇒
 * ‏fetch חוצה-מקור נכשל ⇒ נספר כחסום — וזה בדיוק מה שרוצים למדוד.
 */

export interface NetCheckTarget {
  key: string;
  /** תווית ידידותית ("כניסה לחשבון"). */
  label: string;
  url: string;
  /** הדומיין להקראה למוקד-הסינון. */
  domain: string;
}

export interface NetCheckResult extends NetCheckTarget {
  ok: boolean;
  /** משך הבדיקה במילישניות. */
  ms: number;
}

/** יעדי-הבדיקה — googleapis רק כשלארגון יש ענן (מקומי-בלבד לא תלוי בהם). */
export function netCheckTargets(origin: string, hasCloud: boolean): NetCheckTarget[] {
  const bust = 'netcheck=' + Math.random().toString(36).slice(2);
  return [
    { key: 'site', label: 'האתר עצמו', url: origin + '/version.json?' + bust, domain: new URL(origin).host },
    ...(hasCloud
      ? [
          { key: 'auth', label: 'כניסה לחשבון (Auth)', url: 'https://identitytoolkit.googleapis.com/v1/recaptchaParams?' + bust, domain: 'identitytoolkit.googleapis.com' },
          { key: 'token', label: 'חידוש-חיבור (Token)', url: 'https://securetoken.googleapis.com/securetoken/robots.txt?' + bust, domain: 'securetoken.googleapis.com' },
          { key: 'db', label: 'סנכרון נתונים (Firestore)', url: 'https://firestore.googleapis.com/robots.txt?' + bust, domain: 'firestore.googleapis.com' },
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
    await fetch(t.url, { signal: ctrl.signal, cache: 'no-store' });
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
