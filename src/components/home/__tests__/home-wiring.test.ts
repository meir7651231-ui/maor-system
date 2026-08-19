/**
 * ratchet · חיווט-עומק במסך הבית (19.8.2026, לולאת "בית למקסימום"):
 *
 * 1. פריט "דורש טיפול" של תורם-שעבר-יעד מנווט ישר לכרטיס-התומך
 *    (kind:'supporter' → openSupporterCard) — לא לרשימה הכללית.
 * 2. אירוע דחוף (אדום) המקושר למשפחה קופץ ישר לכרטיס-המשפחה; בלי קישור — ללוח.
 * 3. יעדי-קשר (ContactsWidget) — שורה פותחת כרטיס-תומך + חיוג 📞 ווואטסאפ 💬
 *    (מגודרי telephonyOn / integrationOn).
 * 4. באג הקרוסלה: idx צמח בלי-גבול (setIdx(i+1)) והנקודה הפעילה חושבה עם ‎% 8‎
 *    שגוי — מעל 8 פריטים הנקודות "קפאו"; וגם רונדרו רק 8 נקודות ל-10 פריטים.
 */
import { describe, it, expect } from 'vitest';
import { attentionItems } from '../homeData';
import widgetsSrc from '../widgets.tsx?raw';
import homeViewSrc from '../HomeView.tsx?raw';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type Db, type OrgEvent, type Supporter } from '../../../types/domain';

const NOW = new Date('2026-07-21T10:00:00');

function supporter(over: Partial<Supporter>): Supporter {
  return {
    id: 's1',
    name: 'תורם',
    phone: '',
    email: '',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  } as Supporter;
}

function redEvent(over: Partial<OrgEvent>): OrgEvent {
  return {
    id: 'ev1',
    title: 'אירוע דחוף',
    date: '2026-07-21',
    time: '',
    type: 'custom',
    customType: '',
    notes: '',
    price: 0,
    roomId: '',
    famId: '',
    priority: 'red',
    done: false,
    ...over,
  } as OrgEvent;
}

describe('חיווט-עומק · דורש-טיפול (attentionItems)', () => {
  it('תורם שעבר יעד-קשר → nav ישר לכרטיס-התומך (kind:supporter עם id)', () => {
    const db: Db = {
      ...emptyDb(),
      supporters: [supporter({ id: 'sp9', name: 'לוי', nextDate: '2026-07-10' })],
    };
    const items = attentionItems(db, NOW, {}, DEFAULT_CONFIG);
    const it9 = items.find((x) => x.key === 'supnext:sp9');
    expect(it9).toBeTruthy();
    // הבאג ההיסטורי: nav היה {kind:'supporters'} — המשתמש נזרק לרשימה וחיפש ידנית
    expect(it9!.nav).toEqual({ kind: 'supporter', id: 'sp9' });
  });

  it('מעל 3 מאחרים — פריט הצבירה נשאר לרשימה הכללית (kind:supporters)', () => {
    const sups = ['a', 'b', 'c', 'd', 'e'].map((id, i) =>
      supporter({ id, name: 'תורם ' + id, nextDate: '2026-07-0' + (i + 1) }),
    );
    const db: Db = { ...emptyDb(), supporters: sups };
    const items = attentionItems(db, NOW, {}, DEFAULT_CONFIG);
    const more = items.find((x) => x.key === 'supnext:more');
    expect(more).toBeTruthy();
    expect(more!.nav).toEqual({ kind: 'supporters' });
  });

  it('אירוע דחוף מקושר-משפחה → כרטיס-המשפחה; בלי קישור → הלוח', () => {
    const db: Db = {
      ...emptyDb(),
      events: [redEvent({ id: 'e1', famId: 'fam7' }), redEvent({ id: 'e2', famId: '' })],
    };
    const items = attentionItems(db, NOW, {}, DEFAULT_CONFIG);
    expect(items.find((x) => x.key === 'urgent:e1')!.nav).toEqual({ kind: 'family', id: 'fam7' });
    expect(items.find((x) => x.key === 'urgent:e2')!.nav).toEqual({ kind: 'calendar' });
  });
});

describe('הגנת-מקור · HomeView + ווידג\'טים', () => {
  it('navTo מטפל ב-kind:supporter דרך openSupporterCard, מגודר-מודול', () => {
    expect(homeViewSrc).toMatch(/nav\.kind === 'supporter'/);
    expect(homeViewSrc).toMatch(/if \(supportersOn\) openSupporterCard\(nav\.id\)/);
  });

  it('ContactsWidget — שורה פותחת כרטיס-תומך + חיוג ווואטסאפ מגודרים', () => {
    expect(widgetsSrc).toContain("navTo({ kind: 'supporter', id: c.id })");
    expect(widgetsSrc).toMatch(/telephonyOn\(config\) && c\.phone && <CallBtn/);
    expect(widgetsSrc).toMatch(/integrationOn\(config, 'whatsapp'\) && c\.phone && \(\s*<WaBtn/);
  });

  it('קרוסלה — idx חסום במודולו, נקודה לכל פריט, בלי ‎% 8‎ שגוי', () => {
    // גזירת גוף פונקציית הקרוסלה בלבד — של-SuggestWidget יש slice(0,8) לגיטימי משלו
    const start = widgetsSrc.indexOf('function Carousel');
    expect(start).toBeGreaterThan(-1);
    const body = widgetsSrc.slice(start, widgetsSrc.indexOf('\nfunction ', start + 1));
    // הבאג: setIdx((i) => i + 1) צמח בלי-גבול; הנקודה הפעילה (idx % len) % 8 שגויה
    expect(body).toContain('setIdx((i) => (i + 1) % items.length)');
    expect(body).not.toContain('setIdx((i) => i + 1)');
    expect(body).not.toContain('% items.length) % 8');
    // כל הפריטים מקבלים נקודה — אין עוד slice(0, 8) בנקודות הקרוסלה
    expect(body).not.toContain('slice(0, 8)');
    expect(body).toContain('items.map((it, i2)');
  });
});
