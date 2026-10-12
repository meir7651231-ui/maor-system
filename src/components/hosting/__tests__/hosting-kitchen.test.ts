/**
 * ratchet — 🏡 אירוח 3: מנוע-המטבח (BUILD-ORDER-HOSTING-2026-10-12) — פורט "צוות מטבח" של המקור:
 * מנוע-זמן (הכנה/התחלה/"להכין עכשיו"/"להזמין חומרים"), מנוע-כמויות, עגלת-קניות, מערך-שולחן, צוות, סנכרון-הכל.
 */
import { describe, expect, it } from 'vitest';
import type { HostBooking, HostDish, HostMeal, HostSupply, HostTableItem } from '../../../types/domain';
import {
  activeDinerTotal,
  countdown,
  dinersFromBooking,
  dinersToPeople,
  dinerTotal,
  dishOf,
  isMealActive,
  mealDueNow,
  mealFactor,
  mealLeadMinutes,
  mealNextStatus,
  mealServeAt,
  mealStartTime,
  minTo,
  orderByDate,
  orderDue,
  parseIng,
  scaleQty,
  shopIcon,
  shoppingList,
  shoppingText,
  staffActiveMeals,
  staffRoleIn,
  stepPerGuest,
  syncAllKitchen,
  tablesetPresetPlan,
  toMin,
} from '../kitchen';

const AT = '2026-10-12T08:00:00.000Z';

function D(over: Partial<HostDish> = {}): HostDish {
  return {
    id: 'hd1',
    kind: 'dish',
    name: 'עוף בתנור',
    type: 'בשרי',
    price: 60,
    allergens: '',
    prepTime: '20',
    cookTime: '90',
    cookTemp: '180',
    baseServings: 4,
    ingredients: ['עוף · 2 ק״ג', 'בצל · 3 יח׳', 'מלח'],
    steps: ['לתבל', 'לאפות'],
    notes: '',
    defBy: 'hs1',
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}
function M(over: Partial<HostMeal> = {}): HostMeal {
  return {
    id: 'hm1',
    kind: 'meal',
    mealName: 'ארוחת ערב שבת',
    bookingId: 'hb1',
    unitId: 'hu1',
    guestId: 'hg1',
    diners: [{ guestId: 'hg1', adults: 2, kids: 2 }],
    dinerCount: 4,
    date: '2026-10-16',
    time: '19:00',
    cook: 'hs2',
    server: 'hs3',
    clearer: '',
    tableSetter: 'hs3',
    items: [
      { name: 'עוף בתנור', dishId: 'hd1', price: 60, qty: 8, alg: '', by: '' },
      { name: 'סלט ירקות', price: 20, qty: 4, alg: '', by: 'hs3' },
    ],
    status: 'new',
    allergens: '',
    notes: '',
    seatPlan: { people: [], tables: [] },
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}

describe('🍳 שרשרת וזמנים', () => {
  it('שרשרת-הסטטוס: חדש⇒בהכנה⇒בקרת איכות⇒מוכן⇒נמסר; פעילה = לא נמסרה/בוטלה', () => {
    expect(['new', 'prep', 'qc', 'ready', 'served', 'cancelled'].map((s) => mealNextStatus(s as HostMeal['status']))).toEqual(['prep', 'qc', 'ready', 'served', null, null]);
    expect([isMealActive(M()), isMealActive(M({ status: 'served' })), isMealActive(M({ status: 'cancelled' }))]).toEqual([true, false, false]);
  });

  it('מנוע-הזמן: זמן-הכנה = max(הכנה+בישול); התחלה = הגשה − הכנה (מעגלי); בלי שעה ⇒ null', () => {
    const dishes = [D(), D({ id: 'hd2', name: 'סלט ירקות', prepTime: '15', cookTime: '' })];
    expect(mealLeadMinutes(M(), dishes)).toBe(110);
    expect(mealStartTime(M(), dishes)).toBe('17:10');
    expect(mealStartTime(M({ time: '01:00' }), dishes)).toBe('23:10');
    expect(mealStartTime(M({ time: '' }), dishes)).toBeNull();
    expect([toMin('19:30'), toMin('x'), minTo(-30), minTo(1450)]).toEqual([1170, null, '23:30', '00:10']);
  });

  it('"🔴 להכין עכשיו": רק חדשה; היום אחרי זמן-ההתחלה · תאריך שעבר ⇒ כן · עתידי ⇒ לא', () => {
    const dishes = [D()];
    expect(mealDueNow(M(), dishes, '2026-10-16', toMin('17:09')!)).toBe(false);
    expect(mealDueNow(M(), dishes, '2026-10-16', toMin('17:10')!)).toBe(true);
    expect(mealDueNow(M(), dishes, '2026-10-17', 0)).toBe(true);
    expect(mealDueNow(M(), dishes, '2026-10-15', 1439)).toBe(false);
    expect(mealDueNow(M({ status: 'prep' }), dishes, '2026-10-16', 1439)).toBe(false);
  });

  it('"🛒 להזמין חומרים עד" = תאריך − ימי-הזמנה; החלון פתוח עד יום-הארוחה', () => {
    expect(orderByDate(M(), 2)).toBe('2026-10-14');
    expect(orderByDate(M({ date: '' }), 2)).toBeNull();
    expect(orderDue(M(), 2, '2026-10-13')).toBe(false);
    expect(orderDue(M(), 2, '2026-10-14')).toBe(true);
    expect(orderDue(M(), 2, '2026-10-16')).toBe(true);
    expect(orderDue(M(), 2, '2026-10-17')).toBe(false);
    expect(orderDue(M({ status: 'prep' }), 2, '2026-10-15')).toBe(false);
  });

  it('טיימר: רגע-ההגשה; ספירה-לאחור ואחרי-הזמן (נוסח המקור)', () => {
    expect(mealServeAt(M())).toBe('2026-10-16T19:00');
    expect(mealServeAt(M({ time: '' }))).toBe('');
    expect(countdown(65_000)).toEqual({ text: '01:05', over: false });
    expect(countdown(3_725_000)).toEqual({ text: '1:02:05', over: false });
    expect(countdown(-7_500_000)).toEqual({ text: '2 שע׳ 5 דק׳', over: true });
  });
});

describe('🍳 סועדים ומנוע-הכמויות', () => {
  it('סועדים מההזמנה · סכום · משתתפי-הושבה "{משפחה} · מבוגר/ילד N"', () => {
    const b = { guestId: 'hg1', adults: 2, kids: 1 } as HostBooking;
    expect(dinersFromBooking(b)).toEqual([{ guestId: 'hg1', adults: 2, kids: 1 }]);
    expect(dinerTotal([{ guestId: 'a', adults: 2, kids: 1 }, { guestId: 'b', adults: 1, kids: 0 }])).toBe(4);
    const ppl = dinersToPeople(M({ diners: [{ guestId: 'hg1', adults: 1, kids: 2 }] }), () => 'כהן');
    expect(ppl.map((p) => [p.id, p.name, p.kind])).toEqual([
      ['sp1', 'כהן · מבוגר 1', 'adult'],
      ['sp2', 'כהן · ילד 1', 'kid'],
      ['sp3', 'כהן · ילד 2', 'kid'],
    ]);
  });

  it('רכיב "שם · כמות" · הכפלת המספר הראשון (עשירית) · מקדם = מנות ÷ מנות-בסיס', () => {
    expect(parseIng('קמח · 1.5 ק״ג')).toEqual({ name: 'קמח', qty: '1.5 ק״ג' });
    expect(parseIng(' מלח ')).toEqual({ name: 'מלח', qty: '' });
    expect(scaleQty('2 כוסות', 1.5)).toBe('3 כוסות');
    expect(scaleQty('1.5 ק״ג', 2)).toBe('3 ק״ג');
    expect(scaleQty('קורט', 3)).toBe('קורט');
    expect(scaleQty('2 כוסות', 1)).toBe('2 כוסות');
    expect(mealFactor(M(), D(), { qty: 8 })).toBe(2);
    expect(mealFactor(M({ dinerCount: 6 }), D({ baseServings: 0 }), { qty: 0 })).toBe(1.5);
    expect(dishOf({ name: 'עוף בתנור' }, [D()])?.id).toBe('hd1');
    expect(dishOf({ name: 'שם אחר', dishId: 'hd1' }, [D()])?.id).toBe('hd1');
  });
});

describe('🛒 עגלת-הקניות ומערך-השולחן', () => {
  const dishes = [D()];
  const table: HostTableItem[] = [{ id: 't1', kind: 'tableItem', name: 'צלחת', perGuest: 2, createdAt: AT, updatedAt: AT }];
  const supplies: HostSupply[] = [{ id: 's1', kind: 'supply', name: 'קולה', cat: 'שתייה', qty: '6 בקבוקים', bought: false, createdAt: AT, updatedAt: AT }];

  it('3 מדפים: רכיבים מוכפלים לפי מנות (×2) · חד-פעמי × סועדים פעילים · נלווים; "לקחתי" ואחוז', () => {
    const meals = [M(), M({ id: 'hm2', status: 'served', dinerCount: 50 })];
    const s = shoppingList(meals, dishes, table, supplies, { 'tbl:t1': true }, { 'sup:s1': '🍾' });
    expect(s.totalDiners).toBe(4);
    expect(s.mealsN).toBe(1);
    expect(s.products.map((p) => [p.key, p.icon, p.qty, p.got])).toEqual([
      ['ing:עוף', '🍗', '4 ק״ג', false],
      ['ing:בצל', '🧅', '6 יח׳', false],
      ['ing:מלח', '🧂', '', false],
      ['tbl:t1', '🍽️', '8 יח׳', true],
      ['sup:s1', '🍾', '6 בקבוקים', false],
    ]);
    expect([s.gotN, s.total, s.pct, s.done]).toEqual([1, 5, 20, false]);
  });

  it('רכיב משותף לשתי ארוחות ⇒ שורה אחת עם הכמויות מחוברות ב-" + "; העתקת-רשימה בנוסח המקור', () => {
    const meals = [M(), M({ id: 'hm2', items: [{ name: 'עוף בתנור', dishId: 'hd1', price: 60, qty: 4, alg: '', by: '' }] })];
    const s = shoppingList(meals, dishes, [], []);
    expect(s.products.find((p) => p.key === 'ing:עוף')?.qty).toBe('4 ק״ג + 2 ק״ג');
    const txt = shoppingText(meals, dishes, table, supplies);
    expect(txt.split('\n')).toEqual(['🥕 רכיבים:', '• עוף 4 ק״ג + 2 ק״ג', '• בצל 6 יח׳ + 3 יח׳', '• מלח ', '', '🍽️ מערך שולחן:', '• צלחת 16', '', '🥤 נלווים:', '• קולה 6 בקבוקים (שתייה)']);
  });

  it('אמוג׳י אוטומטי לפי מילת-מפתח, ונפילה לפי מדף', () => {
    expect([shopIcon('חלה מתוקה', ''), shopIcon('נרות שבת', ''), shopIcon('משהו', 'שתייה'), shopIcon('משהו', 'חד-פעמי'), shopIcon('משהו', 'נלווה'), shopIcon('משהו', 'אחר')]).toEqual(['🍞', '🕯️', '🥤', '🍽️', '🧺', '🛒']);
  });

  it('מערך מוכן: שם קיים ⇒ עדכון; חדש ⇒ הוספה · ± חצי לאורח (לא שלילי) · סועדים פעילים', () => {
    expect(tablesetPresetPlan(table, 'basic')).toEqual({ set: [{ id: 't1', perGuest: 1 }], add: [{ name: 'כוס', perGuest: 1 }, { name: 'מפית', perGuest: 1 }, { name: 'סכו״ם', perGuest: 1 }] });
    expect(tablesetPresetPlan([], 'feast').add.map((x) => x.name)).toEqual(['צלחת', 'כוס', 'מפית', 'סכו״ם', 'קערית']);
    expect([stepPerGuest(1, 1), stepPerGuest(0.5, -1), stepPerGuest(0, -1)]).toEqual([1.5, 0, 0]);
    expect(activeDinerTotal([M(), M({ id: 'x', status: 'cancelled', dinerCount: 9 })])).toBe(4);
  });
});

describe('👨‍🍳 צוות וסנכרון-הכל', () => {
  it('תפקידי איש-צוות בארוחה + הארוחות הפעילות שלו (עומס)', () => {
    expect(staffRoleIn(M(), 'hs3')).toEqual(['🍽️ מגיש', '🪑 שולחן', '🍲 סלט ירקות']);
    expect(staffRoleIn(M(), 'hs2')).toEqual(['👨‍🍳 מכין']);
    expect(staffActiveMeals('hs3', [M(), M({ id: 'hm2', status: 'served' })]).map((m) => m.id)).toEqual(['hm1']);
  });

  it('🔄 סנכרן הכל: סועדים ⇐ משתתפי-ההזמנה (+חיוב), ומנה בלי טבח ⇐ טבח-המנה / המכין-האחראי', () => {
    const b: HostBooking = {
      id: 'hb1', guestId: 'hg1', unitId: 'hu1', roomIds: [], checkIn: '2026-10-16', checkOut: '2026-10-18', adults: 3, kids: 3, status: 'confirmed',
      charges: [], payments: [], notes: '', shabbat: false, createdAt: AT, updatedAt: AT,
    };
    const unlinked = M({ id: 'hm2', bookingId: '', items: [{ name: 'לא בתפריט', price: 10, qty: 1, alg: '', by: '' }] });
    const res = syncAllKitchen([M(), unlinked], [b], [D()], AT);
    expect(res.mealsSynced).toBe(1);
    expect(res.dishesAssigned).toBe(2);
    const m1 = res.meals.find((m) => m.id === 'hm1')!;
    expect(m1.dinerCount).toBe(6);
    expect(m1.items.map((i) => [i.qty, i.by])).toEqual([
      [8, 'hs1'], // 8 שונה ידנית (≠4) ⇒ נשאר; טבח-ברירת-המחדל של המנה
      [6, 'hs3'], // 4 (=הסועדים הקודמים) ⇒ 6; כבר משובץ
    ]);
    expect(res.meals.find((m) => m.id === 'hm2')!.items[0].by).toBe('hs2'); // אין טבח-מנה ⇒ המכין-האחראי
    expect(res.bookings[0].charges).toEqual([{ id: 'meal:hm1', kind: 'meal', label: 'הזמנת מטבח (2 מנות)', amount: 60 * 8 + 20 * 6, mealId: 'hm1' }]);
  });
});
