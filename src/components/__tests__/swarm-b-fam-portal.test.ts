/**
 * ratchet (הגנת-מקור) — נחיל swarm-b (3.9.2026), משפחות + שער-ההצטרפות + אשף-המנהל:
 *  · A-3 FamilyDetail: טלפון/אימייל ב-InfoRow מבודדי-כיווניות (ltr ⇒ span dir="ltr" פנימי,
 *    לא על ה-span החיצוני — היה מהפך את סדר action/ערך ב-inline-flex). בלי ltr — DOM ביט-זהה.
 *  · A-7 FamilyPanels: +5/−5 ו-✕-מסמך קיבלו שם-נגיש (title) בלי לגעת בשורות ה-onClick.
 *  · P6 FamiliesView: צ׳יפי-החיזוי ממואיזים (useMemo על q/db.families/suggestOn) — לא סריקה בכל רנדר.
 *  · A-8 FamiliesView: ariaLabel לחיפוש ולשלושת מסנני ה-Select.
 *  · TP-10 ManagerPanel: שמות-המודולים באשף-המנהל דרך termOf('nav.'+m) — לא MODULE_LABELS גולמי.
 *  · TP-14 SupportChat/PortalEntry/portal.ts: הנוסח-החוצה דרך termOf; פרוטוקול-הצ׳אט נשאר מילולי.
 *  · A-4 global.css: .tel-link = יעד-מגע 40px בתוך @media (pointer: coarse) בלבד (עכבר — בלי שינוי).
 */
import { describe, expect, it } from 'vitest';
import detailSrc from '../families/FamilyDetail.tsx?raw';
import panelsSrc from '../families/FamilyPanels.tsx?raw';
import viewSrc from '../families/FamiliesView.tsx?raw';
import managerSrc from '../platform/ManagerPanel.tsx?raw';
import chatSrc from '../support/SupportChat.tsx?raw';
import entrySrc from '../public/PortalEntry.tsx?raw';
import portalSrc from '../public/portal.ts?raw';
import { readFileSync } from 'node:fs';
// ‏global.css?raw חוזר ריק תחת vitest (עיבוד-CSS של vite) ⇒ קוראים את הקובץ ישירות.
const cssSrc = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8');

describe('swarm-b — משפחות: הגנות-מקור', () => {
  it('A-3 InfoRow: ltr אופציונלי ⇒ span dir="ltr" פנימי; רק טלפון/אימייל מקבלים אותו', () => {
    expect(detailSrc).toContain('function InfoRow(props: { k: string; v: string; action?: ReactNode; ltr?: boolean })');
    expect(detailSrc).toContain(`{props.ltr ? <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{props.v}</span> : props.v}`);
    expect(detailSrc).toContain(`<InfoRow k="טלפון ראשי" v={fam.phone || '—'} action={commsAction(fam.phone)} ltr />`);
    expect(detailSrc).toContain(`<InfoRow k="טלפון נוסף" v={fam.phone2 || '—'} action={commsAction(fam.phone2)} ltr />`);
    expect(detailSrc).toContain(`<InfoRow k="אימייל" v={fam.email || '—'} ltr />`);
    // שאר השורות — בלי ltr (DOM ביט-זהה ללקוח-החי)
    expect(detailSrc).toContain(`<InfoRow k="שם האב" v={fam.father || '—'} />`);
  });

  it('A-7 FamilyPanels: title על +5/−5/✕ — שורות ה-onClick לא השתנו', () => {
    expect(panelsSrc).toContain('title="הוספת 5 נקודות אמינות"');
    expect(panelsSrc).toContain('title="הפחתת 5 נקודות אמינות"');
    expect(panelsSrc).toContain("title={'הסרת המסמך ' + d.name}");
    expect(panelsSrc).toContain("onClick={() => addCred(props.fam.id, 5, 'התאמה ידנית של מנהל')}");
    expect(panelsSrc).toContain("onClick={() => addCred(props.fam.id, -5, 'התאמה ידנית של מנהל')}");
    expect(panelsSrc).toContain('onClick={() => removeDoc(d.id)}');
  });

  it('P6 FamiliesView: suggests ממואיז על q (לא dq — במכוון) + db.families + suggestOn', () => {
    expect(viewSrc).toMatch(/const suggests = useMemo\(\(\) => \{\s*\n\s*if \(!suggestOn\) return \[\];/);
    expect(viewSrc).toContain('}, [q, db.families, suggestOn]);');
    expect(viewSrc).not.toContain('const suggests: string[] = [];');
  });

  it('A-8 FamiliesView: ariaLabel לחיפוש ולמסנני סטטוס/עיר/קהילה', () => {
    expect(viewSrc).toContain('ariaLabel="חיפוש"');
    expect(viewSrc).toContain('ariaLabel="סטטוס"');
    expect(viewSrc).toContain('ariaLabel="עיר"');
    expect(viewSrc).toContain('ariaLabel="קהילה"');
  });
});

describe('swarm-b — מונחים (TP-10/TP-14) + יעד-מגע (A-4)', () => {
  it('TP-10 ManagerPanel: שם-המודול לעובד/ת דרך termOf(nav.*) עם MODULE_LABELS כנפילה', () => {
    expect(managerSrc).toContain("{termOf(config, 'nav.' + m, MODULE_LABELS[m])}");
  });

  it('TP-14 SupportChat: כרטיס-הפנייה (כולל טקסט-הוואטסאפ) דרך termOf; parsePortalChat נשאר מילולי', () => {
    expect(chatSrc).toContain("const course = termOf(config, 'entity.course', 'חוג');");
    expect(chatSrc).toContain("'שלום, בנוגע לבקשת-ההרשמה ל' + course + ' — '");
    expect(chatSrc).toContain("{'📥 בקשת הרשמה ל' + course}");
    expect(chatSrc).toContain('{row(course, req.course)}');
    // פרוטוקול-wire: התוויות המילוליות של portalChatLine/parsePortalChat לא נגעו
    expect(portalSrc).toContain("f.course.trim() && 'חוג: ' + f.course.trim(),");
    expect(portalSrc).toContain("course: get('חוג')");
    // הנוסח-החוצה כן מכבד את המונח (cfg אופציונלי ⇒ 'חוג' ביט-זהה)
    expect(portalSrc).toContain("const course = cfg ? termOf(cfg, 'entity.course', 'חוג') : 'חוג';");
    expect(portalSrc).toContain('const msg = portalMessage(orgName, f, config);');
  });

  it('TP-14 PortalEntry: ארבעת הנוסחים דרך termOf — הנפילות = הליטרלים ההיסטוריים', () => {
    expect(entrySrc).toContain("const courseW = termOf(config, 'entity.course', 'חוג');");
    expect(entrySrc).toContain("const enrollW = termOf(config, 'entity.enrollment', 'שיבוץ');");
    expect(entrySrc).toContain("'👪 הרשמת ילד/ה ל' + courseW");
    expect(entrySrc).toContain("{'הרשמת ילד/ה ל' + courseW}");
    expect(entrySrc).toContain("field(courseW + ' מבוקש', 'course'");
    expect(entrySrc).toContain("enrollW + ' סופי מאושר ע\"י הרכז.'");
  });

  it('A-4 global.css: .tel-link בתוך @media (pointer: coarse) — ולא מחוצה לו', () => {
    // מופע יחיד; ה-@media (pointer: coarse) האחרון שלפניו עדיין פתוח (אין '\n}' בעמודה 0 ביניהם)
    expect((cssSrc.match(/\.tel-link \{/g) ?? []).length).toBe(1);
    const at = cssSrc.indexOf('.tel-link {');
    const open = cssSrc.lastIndexOf('@media (pointer: coarse) {', at);
    expect(open).toBeGreaterThan(-1);
    expect(cssSrc.slice(open, at)).not.toMatch(/\n\}/);
    expect(cssSrc.slice(at, at + 300)).toContain('min-height: 40px;');
  });
});
