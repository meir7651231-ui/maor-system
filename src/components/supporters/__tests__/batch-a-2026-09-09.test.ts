/**
 * ratchet — בקשות-בעלים 9.9 (חבילה א׳ · תורמים):
 * (8) "כפתור 40 יום עדיין לא קיים מצידי — כפתור ענק שיראו אותו": הכפתור ישב בתוך סעיף
 *     קשר-הבא (תלוי ב-supporters.nextdate) ⇒ עכשיו סעיף עצמאי בראש-הכרטיס, ברוחב-מלא.
 * (2) "עריכה בשמות בכתיבה שלהם": ayinSetNameText + EditableText בכרטיס ובמסך-השמות.
 * (1) "חיפוש לפי 4 ספרות": מסך-השמות מחפש רצף-ספרות בתוך הטלפון.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ayinBoardItems, filterAyinBoard } from '../../../lib/ayin';
import { emptyAyin, emptyDb } from '../../../types/domain';
import type { Db, Supporter } from '../../../types/domain';
import { useApp } from '../../../store/useApp';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const sup = (id: string, phone: string, names: { id: string; name: string }[]): Supporter =>
  ({ id, name: 'תורם ' + id, phone, email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', nextNote: '', donations: [],
    ayin: { ...emptyAyin(), stage: 'lead', names: names.map((n) => ({ ...n, eyes: '', done: false })) } }) as unknown as Supporter;

describe('(8) כפתור-40 ענק בראש-הכרטיס — לא תלוי בקשר-הבא', () => {
  const src = read('../SupporterDetail.tsx');
  it('הסעיף יושב מיד אחרי כותרת-הכרטיס, לפני קשר-הבא, ומגודר segulaOn בלבד', () => {
    const hdr = src.indexOf('{/* כותרת הכרטיס */}');
    const sec = src.indexOf('{segulaOn && (');
    const next = src.indexOf('{nextOn && (');
    expect(sec).toBeGreaterThan(hdr);
    expect(sec).toBeLessThan(next);
    // הכפתור לא נמצא עוד בתוך בלוק nextOn
    expect(src.indexOf('🕯 40 ימים — התחלת סגולה')).toBeLessThan(next);
  });
  it('גם במצב "סגולה פעילה" יש פס ענק באותו גודל עם התווית "40 ימים" (בקשת-בעלים 10.9)', () => {
    expect(src).toContain("{'🕯 40 ימים — סגולה פעילה · יום ' + segula.day + ' מתוך ' + segula.target + ' · סיום ' + fmtDate(segula.end)}");
    expect((src.match(/minHeight: 64, fontSize: 20, fontWeight: 800/g) || []).length).toBe(2);
  });
  it('כפתור ענק: רוחב-מלא, גובה ≥64, פונט 20', () => {
    expect(src).toContain("style={{ width: '100%', minHeight: 64, fontSize: 20, fontWeight: 800");
    expect(src).toContain('🕯 40 ימים — התחלת סגולה לזיווג מהיום');
  });
});

describe('(2) עריכת-שם במעקב-הטיפול', () => {
  beforeEach(() => {
    const db: Db = { ...emptyDb(), supporters: [sup('a', '053-2919417', [{ id: 'n1', name: 'שרה בת רבקה' }])] };
    useApp.getState().setDb(() => db);
  });
  it('ayinSetNameText משנה כתיב; ריק לא נשמר; שאר השדות נשמרים', () => {
    useApp.getState().ayinSetNameText('a', 'n1', 'שרה בת רחל');
    expect(useApp.getState().db.supporters[0].ayin!.names[0].name).toBe('שרה בת רחל');
    useApp.getState().ayinSetNameText('a', 'n1', '   ');
    expect(useApp.getState().db.supporters[0].ayin!.names[0].name).toBe('שרה בת רחל');
    expect(useApp.getState().db.supporters[0].ayin!.names[0].id).toBe('n1');
  });
  it('הגנת-מקור: EditableText בכרטיס (שתי הרשימות) ובמסך-השמות; nameId על פריט-הלוח', () => {
    const card = read('../AyinCard.tsx');
    const board = read('../AyinNamesBoard.tsx');
    expect((card.match(/<EditableText value=\{n\.name\} onSave=\{\(v\) => setNameText\(sp\.id, n\.id, v\)\}/g) || []).length).toBe(2);
    expect(board).toContain('<EditableText value={it.name} onSave={(v) => setNameText(it.supporterId, it.nameId, v)} />');
    expect(ayinBoardItems([sup('a', '', [{ id: 'n9', name: 'x' }])])[0].nameId).toBe('n9');
  });
});

describe('(1) חיפוש-ספרות במסך-השמות', () => {
  const items = ayinBoardItems([sup('a', '053-2919417', [{ id: 'n1', name: 'שרה' }]), sup('b', '050-1234567', [{ id: 'n2', name: 'לאה' }])]);
  it('4 ספרות מהסוף/מהאמצע מוצאות את הטלפון; טקסט רגיל לא נשבר', () => {
    expect(filterAyinBoard(items, '9417', null, null).map((i) => i.supporterId)).toEqual(['a']);
    expect(filterAyinBoard(items, '2919', null, null).map((i) => i.supporterId)).toEqual(['a']);
    expect(filterAyinBoard(items, '4567', null, null).map((i) => i.supporterId)).toEqual(['b']);
    expect(filterAyinBoard(items, 'לאה', null, null).map((i) => i.supporterId)).toEqual(['b']);
    expect(filterAyinBoard(items, '99', null, null)).toEqual([]);
  });
});
