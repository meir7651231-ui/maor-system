/**
 * כפתור וואטסאפ (INTEGRATIONS גל א׳) — עוגן 💬 קטן שנפתח לשיחת-וואטסאפ.
 * ‏null-safe: בלי מספר-תקין לא מרונדר כלום. **הגידור באחריות ה-caller** —
 * `integrationOn(config,'whatsapp')` (הרחבה נמכרת: חסר=כבוי, הפוך מדגלים).
 *
 * 📱 מצב-אפליקציה (הכרעת-בעלים 24.8): כשהארגון מגדיר `whatsapp.mode='app'`,
 * הקישור נפתח דרך סכמת whatsapp:// (קריאה-ישירה לאפליקציה) במקום wa.me —
 * לסינון-כשר שחוסם את דומיין wa.me אך מתיר את האפליקציה. חסר ⇒ wa.me (ביט-זהה).
 *
 * 🔒 דמו (22.10.2026): קישור-וואטסאפ מוציא את הרשומה החוצה (הטלפון + הטקסט הממולא — סיכום-הורה,
 * חוב, הודעה-לכיתה). בדמו אין href בכלל, והקשה מציגה את הודעת-השער («בדמו אי אפשר…»).
 * רוב הקוראים ממילא מגודרים integrationOn (כבוי בדמו); זה סוגר גם את מי שלא (הודעה-לכיתה).
 */
import { useApp } from '../store/useApp';
import { integrationSetting } from '../lib/config';
import { isDemoSession } from '../lib/demoLock';
import { guardExport } from '../lib/exportGate';
import { waHref } from '../lib/wa';

export function WaBtn(props: { phone: string; text?: string; title?: string }) {
  const config = useApp((s) => s.config);
  const app = integrationSetting(config, 'whatsapp', 'mode') === 'app';
  const link = waHref(props.phone, props.text ?? '', app);
  if (!link) return null;
  if (isDemoSession(config)) {
    return (
      <a
        role="link"
        tabIndex={0}
        title={props.title ?? 'שליחת וואטסאפ'}
        aria-label={'וואטסאפ אל ' + props.phone}
        style={{ textDecoration: 'none', fontSize: 15, lineHeight: 1, cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          guardExport(); // חסום בדמו ⇒ הודעת-הדמו
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') guardExport();
        }}
      >
        💬
      </a>
    );
  }
  return (
    <a
      href={link.href}
      // סכמת-אפליקציה נפתחת באפליקציה המותקנת — target=_blank היה פותח טאב-רפאים
      {...(link.app ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      title={props.title ?? 'שליחת וואטסאפ'}
      aria-label={'וואטסאפ אל ' + props.phone}
      style={{ textDecoration: 'none', fontSize: 15, lineHeight: 1 }}
      onClick={(e) => e.stopPropagation()}
    >
      💬
    </a>
  );
}
