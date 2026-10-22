/**
 * כפתור חיוג (מודול הטלפוניה) — עוגן 📞 קטן שנפתח ל-`tel:` של המספר (המכשיר/
 * הסופטפון של הארגון מחייג — downstream, בלי ספק/API). null-safe: בלי מספר-תקין
 * לא מרונדר כלום. **הגידור באחריות ה-caller** — `telephonyOn(config)` (המודול
 * opt-in, חסר/false=כבוי), אחות ל-WaBtn.
 *
 * 🔒 דמו (ביקורת 22.10.2026): מבקר יכול להדליק טלפוניה באשף-הדמו — בדמו העוגן בלי href (DialLink),
 * הקשה ⇒ הודעת-השער. מחוץ לדמו אותו עוגן בדיוק.
 */
import { useApp } from '../store/useApp';
import { isDemoSession } from '../lib/demoLock';
import { telHref } from '../lib/tel';
import { DialLink } from './DialLink';

export function CallBtn(props: { phone: string; title?: string }) {
  const config = useApp((s) => s.config);
  const href = telHref(props.phone);
  if (!href) return null;
  return (
    <DialLink
      href={href}
      locked={isDemoSession(config)}
      title={props.title ?? 'חיוג'}
      ariaLabel={'חיוג אל ' + props.phone}
      style={{ textDecoration: 'none', fontSize: 15, lineHeight: 1 }}
      onClick={(e) => e.stopPropagation()}
    >
      📞
    </DialLink>
  );
}
