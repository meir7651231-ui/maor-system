/**
 * ratchet — 🚪 שער-ההצטרפות בעמוד-השיווק (פאזה 1): מנוע-טהור portal.ts (נוסח-בקשה,
 * ולידציה, ערוצים רב-מסלוליים) + חיווט/גידור (PortalEntry + PublicSite מגודר shell.portal,
 * נוסף לצד הכניסה הקיימת — אפס-מחיקה).
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../../types/config';
import type { OrgConfig } from '../../../types/config';
import { EMPTY_PORTAL_FORM, parsePortalChat, portalChannels, portalChatLine, portalHasChannels, portalMessage, portalValid, type PortalForm } from '../portal';
import entrySrc from '../PortalEntry.tsx?raw';
import siteSrc from '../PublicSite.tsx?raw';
import chatSrc from '../../support/SupportChat.tsx?raw';
import famFormSrc from '../../families/FamilyForm.tsx?raw';
import famViewSrc from '../../families/FamiliesView.tsx?raw';

function cfg(contact: Partial<NonNullable<NonNullable<OrgConfig['site']>['contact']>>): OrgConfig {
  return { ...DEFAULT_CONFIG, orgName: 'מאור', site: { contact } } as OrgConfig;
}
const form: PortalForm = { childName: 'דנה', parentName: 'רות', phone: '050-1234567', course: 'ציור', note: '' };

describe('🚪 שער-ההצטרפות — מנוע', () => {
  it('portalValid: שם-ילד/ה (≥2) + טלפון (≥6 ספרות) חובה', () => {
    expect(portalValid(form)).toBe(true);
    expect(portalValid({ ...EMPTY_PORTAL_FORM })).toBe(false);
    expect(portalValid({ ...form, phone: '123' })).toBe(false);
    expect(portalValid({ ...form, childName: 'א' })).toBe(false);
  });

  it('portalMessage: נוסח מסודר עם ילד/טלפון/חוג, מדלג על ריקים', () => {
    const msg = portalMessage('מאור', form);
    expect(msg).toContain('בקשת הרשמה לחוג — מאור');
    expect(msg).toContain('ילד/ה: דנה');
    expect(msg).toContain('טלפון: 050-1234567');
    expect(msg).toContain('חוג מבוקש: ציור');
    expect(msg).not.toContain('הערה:'); // ריק ⇒ מדולג
  });

  // ratchet swarm-b TP-14: הנוסח-החוצה (הורה/ארגון) מכבד entity.course; הפרוטוקול-הפנימי
  // (portalChatLine ↔ parsePortalChat) נשאר על תוויות מילוליות — אחרת מונח מותאם היה שובר את הכרטיס.
  it('portalMessage עם מונח-ארגון (entity.course=פרויקט) — והצ׳אט-הפנימי עדיין round-trip', () => {
    const c = { ...DEFAULT_CONFIG, terms: { 'entity.course': 'פרויקט' } } as OrgConfig;
    const msg = portalMessage('מאור', form, c);
    expect(msg).toContain('בקשת הרשמה לפרויקט — מאור');
    expect(msg).toContain('פרויקט מבוקש: ציור');
    expect(msg).not.toContain('חוג');
    // בלי cfg ⇒ ביט-זהה לנוסח ההיסטורי
    expect(portalMessage('מאור', form)).toContain('בקשת הרשמה לחוג — מאור');
    // הערוצים (mailto-subject) נגזרים מאותו מונח
    const ch = portalChannels({ ...c, site: { contact: { email: 'a@b.org' } } } as OrgConfig, 'מאור', form);
    expect(decodeURIComponent(ch.find((x) => x.key === 'email')!.href)).toContain('subject=בקשת הרשמה לפרויקט — מאור');
    // הפרוטוקול-הפנימי אינו מושפע ממונחים
    const line = portalChatLine(form);
    expect(line).toContain('חוג: ציור');
    expect(parsePortalChat(line)!.course).toBe('ציור');
  });

  it('portalChannels: WhatsApp+SMS+טלפון מטלפון, מייל ממייל — client-side', () => {
    const ch = portalChannels(cfg({ whatsapp: '0501234567', phones: ['025556677'], email: 'a@b.org' }), 'מאור', form);
    const keys = ch.map((c) => c.key);
    expect(keys).toContain('whatsapp');
    expect(keys).toContain('sms');
    expect(keys).toContain('phone');
    expect(keys).toContain('email');
    expect(ch.find((c) => c.key === 'whatsapp')!.href).toContain('wa.me/');
    expect(ch.find((c) => c.key === 'sms')!.href).toMatch(/^sms:/);
    expect(ch.find((c) => c.key === 'phone')!.href).toMatch(/^tel:/);
    expect(ch.find((c) => c.key === 'email')!.href).toMatch(/^mailto:a@b\.org/);
  });

  it('portalHasChannels: false בלי contact, true עם ולו ערוץ-אחד', () => {
    expect(portalHasChannels(DEFAULT_CONFIG)).toBe(false);
    expect(portalHasChannels(cfg({ whatsapp: '0501234567' }))).toBe(true);
  });
});

describe('🛡 הגנות-מקור — שער-ההצטרפות מחווט, מגודר, ונוסף-לצד (אפס-מחיקה)', () => {
  it('PortalEntry: שתי דלתות (הורים→טופס · צוות→onEnter) + שליחה רב-ערוצית', () => {
    expect(entrySrc).toContain('portalChannels(config, orgName, form)');
    expect(entrySrc).toContain('onEnter()'); // דלת-הצוות מובילה לכניסה הקיימת
    expect(entrySrc).toContain('👪');
    expect(entrySrc).toContain('🔑');
  });
  it('PublicSite: מגודר opt-in shell.portal + מרנדר לצד הכניסה הקיימת (onEnter נשמר)', () => {
    expect(siteSrc).toContain("config.features?.['shell.portal'] === true");
    expect(siteSrc).toContain('{portalOn && <PortalEntry onEnter={onEnter} />}');
    // אפס-מחיקה: כפתור-הכניסה הקיים ב-nav נשאר
    expect(siteSrc).toContain('onClick={onEnter}');
  });
});

describe('🚪 פאזה 2 — פנייה בצ׳אט-הצוות', () => {
  const f: PortalForm = { childName: 'דנה', parentName: 'רות', phone: '050-1234567', course: 'ציור', note: 'אלרגיה' };
  it('portalChatLine ↔ parsePortalChat: round-trip של פרטי-הבקשה', () => {
    const line = portalChatLine(f);
    expect(line.startsWith('📥 בקשת-הרשמה')).toBe(true);
    const req = parsePortalChat(line);
    expect(req).not.toBeNull();
    expect(req!.childName).toBe('דנה');
    expect(req!.phone).toBe('050-1234567');
    expect(req!.course).toBe('ציור');
    expect(req!.note).toBe('אלרגיה');
  });
  it('parsePortalChat: הודעה רגילה ⇒ null (לא-כרטיס)', () => {
    expect(parsePortalChat('שלום צוות, מה נשמע?')).toBeNull();
    expect(parsePortalChat('')).toBeNull();
  });
  it('הגנת-מקור — PortalEntry שולח לצ׳אט-הצוות (דורמנטי, נופל-רך)', () => {
    expect(entrySrc).toContain("import('../../store/cloudSync')");
    expect(entrySrc).toContain('m.sendTeamMessage(slug, PORTAL_SENDER, PORTAL_SENDER_NAME, portalChatLine(form))');
    expect(entrySrc).toContain('.catch(() =>'); // נופל-רך בלי ענן/הרשאה
  });
  it('הגנת-מקור — צ׳אט-הצוות מרנדר בקשת-שער ככרטיס-פעולה', () => {
    expect(chatSrc).toContain('parsePortalChat(m.text) ? <PortalReqCard');
    // swarm-b TP-14: הכותרת נגזרת ממונח-הארגון ('חוג' = הנפילה ⇒ ביט-זהה ללקוח-החי)
    expect(chatSrc).toContain("'📥 בקשת הרשמה ל' + ");
    expect(chatSrc).toContain('💬 וואטסאפ');
  });
});

describe('🚪 פאזה 3 — פנייה⇒שיבוץ (➕ שבץ)', () => {
  it('הגנת-מקור — כרטיס-הפנייה פותח טופס-שיבוץ ומאתחל את הצ׳אט', () => {
    expect(chatSrc).toContain('openEnrollDraft(req); onClose();');
    expect(chatSrc).toContain('➕ שבץ');
  });
  it('הגנת-מקור — FamilyForm ממלא טלפון+הערה מהטיוטה (draft)', () => {
    expect(famFormSrc).toContain('function initState(family: Family | null, draft?: FamilyDraft | null)');
    expect(famFormSrc).toContain("phone: draft?.phone?.trim() || ''");
    expect(famFormSrc).toContain('notes: draft ? draftNote(draft) : ');
  });
  it('הגנת-מקור — FamiliesView משחיל את הטיוטה לטופס ומנקה אחרי סגירה', () => {
    expect(famViewSrc).toContain('draft={enrollDraft}');
    expect(famViewSrc).toContain('ackEnrollDraft()');
  });
});
