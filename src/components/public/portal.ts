/**
 * מנוע שער-ההצטרפות בעמוד-השיווק (פאזה 1) — טהור (בלי store/DOM). בונה את נוסח
 * בקשת-ההרשמה של ההורה ואת קישורי-השליחה **הרב-ערוציים** (WhatsApp/SMS/מייל/טלפון),
 * כולם client-side דרך URI-schemes — אפס-שרת. הערוצים נגזרים מ-config.site.contact.
 */
import type { OrgConfig } from '../../types/config';
import { waLink } from '../../lib/wa';

export interface PortalForm {
  childName: string;
  parentName: string;
  phone: string;
  course: string;
  note: string;
}

export const EMPTY_PORTAL_FORM: PortalForm = { childName: '', parentName: '', phone: '', course: '', note: '' };

/** תקין-לשליחה — שם-ילד/ה (≥2) + טלפון-הורה (≥6 תווים). */
export function portalValid(f: PortalForm): boolean {
  return f.childName.trim().length >= 2 && f.phone.replace(/\D/g, '').length >= 6;
}

/** נוסח-הבקשה המשותף לכל הערוצים. */
export function portalMessage(orgName: string, f: PortalForm): string {
  return [
    'בקשת הרשמה לחוג — ' + (orgName || 'העמותה'),
    'ילד/ה: ' + f.childName.trim(),
    f.parentName.trim() && 'הורה: ' + f.parentName.trim(),
    'טלפון: ' + f.phone.trim(),
    f.course.trim() && 'חוג מבוקש: ' + f.course.trim(),
    f.note.trim() && 'הערה: ' + f.note.trim(),
  ]
    .filter(Boolean)
    .join('\n');
}

export type ChannelKey = 'whatsapp' | 'sms' | 'email' | 'phone';

export interface PortalChannel {
  key: ChannelKey;
  label: string;
  icon: string;
  href: string;
}

/** ספרות טלפון ל-tel:/sms: (שומר מוביל +). */
function telDigits(phone: string): string {
  const d = (phone || '').replace(/[^\d+]/g, '');
  return d.replace(/(?!^)\+/g, '');
}

/**
 * ערוצי-השליחה הזמינים לבקשה — נגזרים מ-config.site.contact, כולם client-side:
 * WhatsApp (wa.me) · SMS (sms:) · מייל (mailto:) · טלפון (tel:). ריק = אין contact מוגדר.
 */
export function portalChannels(config: OrgConfig, orgName: string, f: PortalForm): PortalChannel[] {
  const c = config.site?.contact ?? {};
  const msg = portalMessage(orgName, f);
  const out: PortalChannel[] = [];

  const wa = c.whatsapp ? waLink(c.whatsapp, msg) : null;
  if (wa) out.push({ key: 'whatsapp', label: 'WhatsApp', icon: '💬', href: wa });

  const tel = telDigits((c.phones && c.phones[0]) || c.whatsapp || '');
  if (tel) {
    out.push({ key: 'sms', label: 'SMS', icon: '📱', href: 'sms:' + tel + '?&body=' + encodeURIComponent(msg) });
    out.push({ key: 'phone', label: 'התקשרו', icon: '📞', href: 'tel:' + tel });
  }

  if (c.email) {
    out.push({
      key: 'email',
      label: 'מייל',
      icon: '📧',
      href: 'mailto:' + c.email + '?subject=' + encodeURIComponent('בקשת הרשמה לחוג — ' + (orgName || '')) + '&body=' + encodeURIComponent(msg),
    });
  }
  return out;
}

/** האם יש בכלל ערוץ-קשר מוגדר לארגון (אחרת אין לאן לשלוח בקשה). */
export function portalHasChannels(config: OrgConfig): boolean {
  const c = config.site?.contact ?? {};
  return !!(c.whatsapp || (c.phones && c.phones.length) || c.email);
}
