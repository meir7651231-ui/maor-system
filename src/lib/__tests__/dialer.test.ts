/**
 * רצ'ט — מנוע החייגן-המונחה (lib/dialer) + מתאם-הנהג (telephony/driver).
 * מכונת-המצב: תור לפי-סדר, תוצאה-סופית מסירה, לא-ענה/דלג מחזירים לסוף-התור,
 * מדד-התקדמות. הנהג-הידני = tel: בלבד (downstream, בלי autoDial/record) — כדי
 * שהמעבר לקופסת-GSM עתידית יהיה החלפת-נהג ולא בנייה-מחדש.
 */
import { describe, expect, it } from 'vitest';
import { startCampaign, currentId, applyOutcome, progress, isDone, undoLast, campaignCsvRows, OUTCOME_LABELS, REQUEUE_OUTCOMES, TERMINAL_OUTCOMES } from '../dialer';
import { manualDriver, activeDriver } from '../telephony/driver';
import dialerSrc from '../../components/dialer/DialerModal.tsx?raw';
import supViewSrc from '../../components/supporters/SupportersView.tsx?raw';

const T = '2026-08-16T10:00:00.000Z';

describe('☎️ חייגן-מונחה — מכונת-המצב', () => {
  it('startCampaign: דדופ + שמירת-סדר + total', () => {
    const c = startCampaign('קמפיין', ['a', 'b', '', 'a', 'c'], T);
    expect(c.queue).toEqual(['a', 'b', 'c']);
    expect(c.total).toBe(3);
    expect(c.log).toEqual([]);
    expect(currentId(c)).toBe('a');
  });

  it('תוצאה-סופית (תרם) מסירה מהתור ומקדמת', () => {
    let c = startCampaign('k', ['a', 'b'], T);
    c = applyOutcome(c, 'donated', 'תרם 100', T);
    expect(c.queue).toEqual(['b']);
    expect(currentId(c)).toBe('b');
    expect(c.log[0]).toMatchObject({ id: 'a', outcome: 'donated', note: 'תרם 100' });
  });

  it('לא-ענה/דלג מחזירים את המתקשר לסוף-התור (requeue)', () => {
    let c = startCampaign('k', ['a', 'b'], T);
    c = applyOutcome(c, 'noanswer', '', T);
    expect(c.queue).toEqual(['b', 'a']); // a חזר לסוף
    c = applyOutcome(c, 'skip', '', T);
    expect(c.queue).toEqual(['a', 'b']); // b חזר לסוף
    expect(REQUEUE_OUTCOMES).toContain('noanswer');
    expect(TERMINAL_OUTCOMES).toContain('donated');
  });

  it('progress: finalized/remaining/counts', () => {
    let c = startCampaign('k', ['a', 'b', 'c'], T);
    c = applyOutcome(c, 'donated', '', T); // a נסגר
    c = applyOutcome(c, 'noanswer', '', T); // b חזר לתור
    let p = progress(c);
    expect(p.total).toBe(3);
    expect(p.remaining).toBe(2); // b (חזר) + c
    expect(p.finalized).toBe(1); // רק a
    expect(p.counts.donated).toBe(1);
    expect(p.counts.noanswer).toBe(1);
  });

  it('זרימה מלאה — כולל סגירת מי-שחזר-לתור', () => {
    let c = startCampaign('k', ['a', 'b', 'c'], T);
    c = applyOutcome(c, 'noanswer', '', T); // a→סוף: [b,c,a]
    c = applyOutcome(c, 'donated', '', T); // b נסגר: [c,a]
    c = applyOutcome(c, 'refused', '', T); // c נסגר: [a]
    expect(isDone(c)).toBe(false);
    c = applyOutcome(c, 'callback', '', T); // a נסגר: []
    expect(isDone(c)).toBe(true);
    expect(currentId(c)).toBeNull();
    const p = progress(c);
    expect(p.finalized).toBe(3);
    expect(p.remaining).toBe(0);
  });

  it('applyOutcome בלי מתקשר-נוכחי = no-op', () => {
    const c = startCampaign('k', [], T);
    expect(applyOutcome(c, 'donated', '', T)).toBe(c);
  });
});

describe('☎️ מתאם-הנהג (adapter)', () => {
  it('נהג-ידני: tel: בלבד, בלי autoDial/record (downstream)', () => {
    expect(activeDriver()).toBe(manualDriver);
    expect(manualDriver.capabilities.autoDial).toBe(false);
    expect(manualDriver.capabilities.record).toBe(false);
    expect(manualDriver.capabilities.screenPop).toBe(true);
    expect(manualDriver.callHref('050-1234567')).toMatch(/^tel:/);
    expect(manualDriver.callHref('123')).toBeNull(); // מספר-קצר לא-תקין
  });

  it('🔒 הגנת-מקור: החייגן דרך termOf, מגודר telephonyOn, נהג במתאם', () => {
    // התוויות עוברות מילון-המונחים (לא "תורם" קשיח)
    expect(dialerSrc).toContain("termOf(config, 'entity.supporter'");
    expect(dialerSrc).toContain('activeDriver()');
    expect(dialerSrc).not.toContain('window.confirm'); // בלי דיאלוג ילידי
    // הכניסה מגודרת מודול-הטלפוניה
    expect(supViewSrc).toContain('telephonyOn(config)');
    expect(supViewSrc).toContain('dialerStart(');
  });
});

describe('☎️ שדרוג 20.8 — ביטול-אחרון, ספירה-פר-אדם, סיכום-CSV', () => {
  it('undoLast: תוצאה-סופית ⇒ המזהה חוזר לחזית; היומן מתקצר', () => {
    let c = startCampaign('k', ['a', 'b'], T);
    c = applyOutcome(c, 'donated', 'תרם', T); // a נסגר
    expect(c.queue).toEqual(['b']);
    c = undoLast(c);
    expect(c.queue).toEqual(['a', 'b']); // a חזר לחזית
    expect(c.log).toEqual([]);
  });

  it('undoLast: לא-ענה ⇒ מוסר מסוף-התור וחוזר לחזית', () => {
    let c = startCampaign('k', ['a', 'b'], T);
    c = applyOutcome(c, 'noanswer', '', T); // [b, a]
    c = undoLast(c);
    expect(c.queue).toEqual(['a', 'b']);
    expect(c.log).toEqual([]);
    // בלי יומן — no-op בטוח
    expect(undoLast(c)).toBe(c);
  });

  it('progress: לא-ענה נספר פר-אדם — לא פר-ניסיון (הבאג: "📵 3" על אדם אחד)', () => {
    let c = startCampaign('k', ['a', 'b'], T);
    c = applyOutcome(c, 'noanswer', '', T); // a לא ענה (1)
    c = applyOutcome(c, 'donated', '', T); // b תרם
    c = applyOutcome(c, 'noanswer', '', T); // a לא ענה (2)
    c = applyOutcome(c, 'noanswer', '', T); // a לא ענה (3)
    const p = progress(c);
    expect(p.counts.noanswer).toBe(1); // אדם אחד — לא 3 ניסיונות
    expect(p.counts.donated).toBe(1);
  });

  it('campaignCsvRows: כותרת + שורה פר-ניסיון עם תווית-עברית והערה', () => {
    let c = startCampaign('k', ['a'], T);
    c = applyOutcome(c, 'noanswer', '', T);
    c = applyOutcome(c, 'donated', 'תרם 100', T);
    const rows = campaignCsvRows(c, (id) => ({ a: 'לוי' })[id] ?? id);
    expect(rows[0]).toEqual(['שם', 'תוצאה', 'הערה', 'מתי']);
    expect(rows[1]).toEqual(['לוי', OUTCOME_LABELS.noanswer, '', T]);
    expect(rows[2]).toEqual(['לוי', OUTCOME_LABELS.donated, 'תרם 100', T]);
  });

  it('🔒 הגנת-מקור: הזרימות החדשות מחווטות', () => {
    // 💰 תרם/ה עובר דרך מודאל-התרומה (קבלה רציפה) — לא סיווג-עיוור
    expect(dialerSrc).toContain('DonationModal');
    expect(dialerSrc).toMatch(/fresh\.donations\.length > cur\.had/);
    // מקלדת 1–6 · שם-לחיץ · תבנית-וואטסאפ · תזכורת-בלוח · CSV · ביטול-אחרון
    expect(dialerSrc).toContain("if (k === '1') startDonation()");
    expect(dialerSrc).toMatch(/openSupporterCard\(sp\.id\)/);
    expect(dialerSrc).toContain("renderTemplate(config, 'wa.dialer'");
    expect(dialerSrc).toContain('גם תזכורת בלוח-השנה');
    expect(dialerSrc).toContain('campaignCsvRows');
    expect(dialerSrc).toContain('↩ ביטול אחרון');
    // הקשר הו"ק לטלפנית
    expect(dialerSrc).toContain('hokRecordedThisMonth');
  });

  it('🔒 הגנת-מקור סבב-ב׳: שמות-לטיפול, קידום-שלב, עריכה וקישור-תשלום תוך-שיחה', () => {
    // 🕯 רישום-שם + קידום-שלב — אותן פעולות-store כמו בכרטיס (ayinAddName/ayinAdvance)
    expect(dialerSrc).toContain('ayinAddName(sp.id, nm');
    // סבב ג׳ (בקשת-בעלים 20.8): מונה עריך + הערת-טקסט חופשית פר-שם — כמו AyinCard
    expect(dialerSrc).toContain('ayinSetNameEyes(sp.id, n.id');
    expect(dialerSrc).toContain('ayinSetNameNote(sp.id, n.id, e.target.value)');
    expect(dialerSrc).toContain('ayinSetNameNote(sp.id, added.id, noteTxt)');
    expect(dialerSrc).toMatch(/ayinAdvance\(sp\.id\)/);
    expect(dialerSrc).toContain('ayinAdvanceLabel(config, sp.ayin)');
    // ✎ עריכת-פרטים — SupporterForm בהחלפה (לא בקינון — מאבקי-Escape)
    expect(dialerSrc).toMatch(/if \(editOpen && sp\)/);
    expect(dialerSrc).toContain('<SupporterForm supporter={sp}');
    // 💳 קישור-תשלום — payLink מגודר-payments + שליחה-בוואטסאפ בתבנית wa.paylink
    expect(dialerSrc).toContain("integrationOn(config, 'payments')");
    expect(dialerSrc).toContain("renderTemplate(config, 'wa.paylink'");
    // גידור מעקב-הטיפול — הפאנל רק כשהפיצ'ר דלוק
    expect(dialerSrc).toContain("featureOn(config, 'supporters.ayin')");
  });

  it('🔒 מגן-כפילות קישור-תשלום: שימוש בקישור מזהיר ולא נרשם ידנית', () => {
    // הבלבול (בעלים 20.8): "תרם/ה" = רישום-ידני-מיידי; "עמוד-תרומה" = סליקה-אוטומטית.
    // רישום גם-וגם = תרומה כפולה ⇒ קליק על הקישור ממלא הערה + טוסט-אזהרה + הסבר קבוע.
    expect(dialerSrc).toContain("setNote('נשלח קישור-תשלום')");
    expect(dialerSrc).toContain('לא לרשום "תרם/ה" ידנית');
    expect(dialerSrc).toContain('נקלט מהסליקה אוטומטית, בלי רישום ידני');
  });

  it('🔒 ייצוא-שמות ממוקד-קמפיין (20.8): רק משתתפי-הקמפיין, בפורמט דוח-המנהל', () => {
    // הבקשה: "ייצוא רק את השמות האלה" — תור+יומן ⇒ ayinAllRows על תת-הקבוצה בלבד
    expect(dialerSrc).toContain('ayinAllRows(config, campaignParticipants())');
    expect(dialerSrc).toMatch(/new Set<string>\(\[\.\.\.dialer\.queue, \.\.\.dialer\.log\.map\(\(e\) => e\.id\)\]\)/);
    expect(dialerSrc).toContain("'dialer-names-'");
  });
});
