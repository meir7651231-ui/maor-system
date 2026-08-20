/**
 * 📧 בניית כתובת-SMTP מפרטים ידידותיים (בקשת-בעלים 20.8: "רק של הלקוח —
 * תייצר מקום להכניס") — הלקוח מקליד כתובת-מייל + סיסמת-אפליקציה, והמערכת
 * מרכיבה לבד את ה-URL המלא (smtps://user:pass@host:port) שהשרת (mailOutbox)
 * צורך. טהור לחלוטין — נבדק ביחידה.
 *
 * ‏465 = TLS מלא ⇒ smtps:// · ‏587 = STARTTLS ⇒ smtp:// (כך nodemailer מפרש).
 */

/** ספקים מוכרים — דומיין-המייל ⇒ שרת-היציאה שלו. לא מוכר ⇒ שדה-שרת ידני. */
export const SMTP_HOSTS: Record<string, string> = {
  'gmail.com': 'smtp.gmail.com:465',
  'googlemail.com': 'smtp.gmail.com:465',
  'outlook.com': 'smtp-mail.outlook.com:587',
  'hotmail.com': 'smtp-mail.outlook.com:587',
  'yahoo.com': 'smtp.mail.yahoo.com:465',
  'walla.co.il': 'out.walla.co.il:465',
};

/** שרת-היציאה לפי דומיין-הכתובת; '' = ספק לא-מוכר (נדרש שרת ידני). */
export function smtpHostFor(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '';
  const domain = email.slice(at + 1).trim().toLowerCase();
  return SMTP_HOSTS[domain] ?? '';
}

/**
 * הרכבת ה-URL המלא. host בפורמט 'host:port' (מ-smtpHostFor או ידני).
 * מחזיר null כשחסר משהו. שם-משתמש/סיסמה עוברים encodeURIComponent —
 * סיסמת-אפליקציה עם תווים מיוחדים לא שוברת את הכתובת.
 */
export function composeSmtpUrl(email: string, password: string, host: string): string | null {
  const em = email.trim();
  const pw = password.trim();
  const h = host.trim();
  if (!em || !pw || !h || em.indexOf('@') < 1) return null;
  const scheme = /:465$/.test(h) ? 'smtps' : 'smtp';
  return `${scheme}://${encodeURIComponent(em)}:${encodeURIComponent(pw)}@${h}`;
}
