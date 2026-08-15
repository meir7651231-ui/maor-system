/**
 * כפתור חיוג (מודול הטלפוניה) — עוגן 📞 קטן שנפתח ל-`tel:` של המספר (המכשיר/
 * הסופטפון של הארגון מחייג — downstream, בלי ספק/API). null-safe: בלי מספר-תקין
 * לא מרונדר כלום. **הגידור באחריות ה-caller** — `telephonyOn(config)` (המודול
 * opt-in, חסר/false=כבוי), אחות ל-WaBtn.
 */
import { telHref } from '../lib/tel';

export function CallBtn(props: { phone: string; title?: string }) {
  const href = telHref(props.phone);
  if (!href) return null;
  return (
    <a
      href={href}
      title={props.title ?? 'חיוג'}
      aria-label={'חיוג אל ' + props.phone}
      style={{ textDecoration: 'none', fontSize: 15, lineHeight: 1 }}
      onClick={(e) => e.stopPropagation()}
    >
      📞
    </a>
  );
}
