/**
 * כפתור וואטסאפ (INTEGRATIONS גל א׳) — עוגן 💬 קטן שנפתח ל-wa.me של המספר.
 * ‏null-safe: בלי מספר-תקין לא מרונדר כלום. **הגידור באחריות ה-caller** —
 * `integrationOn(config,'whatsapp')` (הרחבה נמכרת: חסר=כבוי, הפוך מדגלים).
 */
import { waLink } from '../lib/wa';

export function WaBtn(props: { phone: string; text?: string; title?: string }) {
  const href = waLink(props.phone, props.text ?? '');
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={props.title ?? 'שליחת וואטסאפ'}
      aria-label={'וואטסאפ אל ' + props.phone}
      style={{ textDecoration: 'none', fontSize: 15, lineHeight: 1 }}
      onClick={(e) => e.stopPropagation()}
    >
      💬
    </a>
  );
}
