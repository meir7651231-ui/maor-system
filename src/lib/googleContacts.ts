/**
 * 📇 סנכרון אנשי-קשר ל-Google (הרחבת `gcontacts`, opt-in) — שכבת-הנגזרת הטהורה.
 *
 * הרקע (הכרעת-בעלים 1.9): "סנכרון-חי לגוגל, כל אנשי-הקשר". השרת local-first ⇒
 * הסנכרון האמיתי דרך Google People API רץ בפונקציית-שרת (functions/gcontactsSync)
 * המחזיקה refresh-token פר-ארגון בכספת; **כאן** רק הנגזרת הדטרמיניסטית: איסוף
 * אנשי-הקשר (משפחות + תורמים + מתנדבים) לרשומה אחידה, מפתח-יציב לזיהוי-חוזר
 * (clientData ב-People) שמונע כפילויות, ובניית vCard (גם ל-fallback "ייצוא מיידי").
 *
 * טהור — בלי DOM/רשת/store. כל הלוגיקה נבדקת ביחידה; אין נגיעה בכסף/קבלות.
 */
import type { Family, Supporter, Volunteer } from '../types/domain';

export type ContactKind = 'family' | 'supporter' | 'volunteer';

/** רשומת-קשר אחידה — נגזרת מכל שלושת המקורות. */
export interface OrgContact {
  /** מזהה-מקור (Family/Supporter/Volunteer id). */
  id: string;
  kind: ContactKind;
  name: string;
  /** טלפונים ייחודיים (לאחר ניקוי-ריקים ודדופ), הראשי ראשון. */
  phones: string[];
  emails: string[];
  address: string;
  city: string;
  /** שיוך-ארגוני (שם-הארגון) — לתווית ולקבוצה ב-Google. */
  org: string;
}

const clean = (s: unknown): string => (typeof s === 'string' ? s.trim() : '');

/** דדופ טלפונים לפי ספרות-בלבד (0501234567 == +972-50-1234567), שומר סדר וצורה-מקורית. */
function uniqPhones(raw: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of raw) {
    const v = clean(p);
    if (!v) continue;
    let d = v.replace(/\D/g, '');
    if (d.startsWith('972')) d = d.slice(3);
    d = d.replace(/^0+/, '');
    if (!d || seen.has(d)) continue;
    seen.add(d);
    out.push(v);
  }
  return out;
}

function uniqEmails(raw: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of raw) {
    const v = clean(e);
    if (!v || !v.includes('@')) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

/** איסוף כל אנשי-הקשר לרשומה אחידה. אנשי-קשר בלי שם או בלי שום דרך-קשר מדולגים. */
export function collectOrgContacts(
  families: Family[],
  supporters: Supporter[],
  volunteers: Volunteer[],
  org = '',
): OrgContact[] {
  const out: OrgContact[] = [];
  for (const f of families || []) {
    const name = clean(f.name);
    if (!name) continue;
    const phones = uniqPhones([f.phone, f.phone2, ...(f.members || []).flatMap((m) => [m.phone, m.phone2])]);
    const emails = uniqEmails([f.email]);
    if (!phones.length && !emails.length) continue;
    out.push({ id: f.id, kind: 'family', name, phones, emails, address: clean(f.address), city: clean(f.city), org });
  }
  for (const s of supporters || []) {
    const name = clean(s.name);
    if (!name) continue;
    const phones = uniqPhones([s.phone, ...(s.phones || []).map((p) => p.num)]);
    const emails = uniqEmails([s.email]);
    if (!phones.length && !emails.length) continue;
    out.push({ id: s.id, kind: 'supporter', name, phones, emails, address: clean(s.address), city: clean(s.city), org });
  }
  for (const v of volunteers || []) {
    const name = clean(v.name);
    if (!name) continue;
    const phones = uniqPhones([v.phone]);
    if (!phones.length) continue;
    out.push({ id: v.id, kind: 'volunteer', name, phones, emails: [], address: '', city: clean(v.area), org });
  }
  return out;
}

/** מפתח-יציב לזיהוי-חוזר ב-Google (clientData.key) — מונע כפילויות בסנכרון-חוזר. */
export function contactStableKey(c: Pick<OrgContact, 'kind' | 'id'>): string {
  return 'maor:' + c.kind + ':' + c.id;
}

/** מפתח-הקבוצה של גוגל שאליה מסונכרנים אנשי-הקשר (label). */
export const GCONTACTS_GROUP_DEFAULT = 'מאור — אנשי קשר';

/**
 * People API Person payload — מיפוי OrgContact ל-resource של createContact.
 * clientData נושא את המפתח-היציב לזיהוי-חוזר. אין תלות ב-googleapis (טהור).
 */
export function toPersonResource(c: OrgContact): Record<string, unknown> {
  const person: Record<string, unknown> = {
    names: [{ givenName: c.name }],
    clientData: [{ key: 'maorKey', value: contactStableKey(c) }],
  };
  if (c.phones.length) person.phoneNumbers = c.phones.map((num, i) => ({ value: num, type: i === 0 ? 'main' : 'other' }));
  if (c.emails.length) person.emailAddresses = c.emails.map((value) => ({ value }));
  if (c.address || c.city) person.addresses = [{ streetAddress: c.address, city: c.city }];
  if (c.org) person.organizations = [{ name: c.org }];
  const kindLabel = c.kind === 'family' ? 'משפחה' : c.kind === 'supporter' ? 'תורם/ת' : 'מתנדב/ת';
  person.userDefined = [{ key: 'מאור', value: kindLabel }];
  return person;
}

/** בריחת ערך-שדה ב-vCard (RFC6350: ; , \\ ותו-שורה). */
function vEsc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** vCard יחיד (3.0 — נתמך בייבוא של Google Contacts, iCloud ואנדרואיד). */
export function buildVcard(c: OrgContact): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vEsc(c.name), 'N:' + vEsc(c.name) + ';;;;'];
  for (const p of c.phones) lines.push('TEL;TYPE=CELL:' + vEsc(p));
  for (const e of c.emails) lines.push('EMAIL;TYPE=INTERNET:' + vEsc(e));
  if (c.address || c.city) lines.push('ADR;TYPE=HOME:;;' + vEsc(c.address) + ';' + vEsc(c.city) + ';;;');
  if (c.org) lines.push('ORG:' + vEsc(c.org));
  // הערה-שקטה נושאת את המפתח-היציב — כדי שגם ייבוא-ידני יהיה מזוהה-חוזר.
  lines.push('NOTE:' + vEsc(contactStableKey(c)));
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/** קובץ vCard מלא (ל-fallback "ייצוא מיידי" — הבעלים מייבא ל-contacts.google.com). */
export function contactsVcf(contacts: OrgContact[]): string {
  return contacts.map(buildVcard).join('\r\n') + '\r\n';
}

/** ספירה פר-סוג — לתצוגת-תקציר לפני הסנכרון. */
export function syncStats(contacts: OrgContact[]): { total: number; families: number; supporters: number; volunteers: number } {
  return {
    total: contacts.length,
    families: contacts.filter((c) => c.kind === 'family').length,
    supporters: contacts.filter((c) => c.kind === 'supporter').length,
    volunteers: contacts.filter((c) => c.kind === 'volunteer').length,
  };
}
