/**
 * מטא-דאטה של סוגי אירועים — תווית + צבעים — מקור-אמת יחיד לכל המשטחים
 * (לוח הבית, רשת הלוח, כרטיס המשפחה, הדו"ח המותאם). היו 4 עותקים זהים.
 */
import type { EventType, OrgEvent } from '../types/domain';

export const EV_META: Record<EventType, { label: string; bg: string; c: string }> = {
  reminder: { label: 'תזכורת', bg: '#efe7f3', c: '#7c3aed' },
  call: { label: 'טלפון', bg: '#dff0ec', c: '#0f766e' },
  wedding: { label: 'חתונה', bg: '#fdeee0', c: '#b45309' },
  memorial: { label: 'אזכרה', bg: '#eceae2', c: '#4d463c' },
  anniversary: { label: 'יום נישואים', bg: '#fbeef3', c: '#be185d' },
  bday: { label: 'יום הולדת', bg: '#fbeef3', c: '#be185d' },
  org: { label: 'אירוע', bg: '#e7edf5', c: '#3a5a86' },
  custom: { label: 'אירוע', bg: '#e7edf5', c: '#3a5a86' },
};

/** תווית אירוע — סוג 'custom' עם טקסט חופשי מציג אותו, אחרת התווית לפי הסוג. */
export function evLabel(ev: OrgEvent): string {
  return (ev.type === 'custom' && ev.customType) || EV_META[ev.type].label;
}
