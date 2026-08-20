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
import { attentionItems, carouselItems, digestLines, eventsOnDate, recentFamilies, todaySessions } from '../homeData';
import { homeStats, monthDonationSum } from '../homeData';
import { suggestions } from '../../shop8/lib';
import widgetsSrc from '../widgets.tsx?raw';
import homeViewSrc from '../HomeView.tsx?raw';
import { FULL_LAYOUTS, THEME_LAYOUTS, THEME_TEMPLATES } from '../widgets';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, emptyFamily, type Db, type OrgEvent, type Supporter } from '../../../types/domain';

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
    // המפתח מגורסן ביעד (19.8) — "טופל" פג כשנקבע יעד-קשר חדש
    const it9 = items.find((x) => x.key === 'supnext:sp9:2026-07-10');
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

describe('אשכול 2 · הכרעת-בעלים 9.8 "לכולל" — צבירת-הבית = קבלות+היסטוריה', () => {
  it('donIls/donUsd בבית כוללים hist (כמו supIls במסך התורמים — מספר אחד בשני המסכים)', () => {
    const db: Db = {
      ...emptyDb(),
      supporters: [
        supporter({
          id: 'h1',
          ils: 100,
          usd: 10,
          donations: [],
          hist: [
            { d: '2020-01-01', a: 50, c: '₪' },
            { d: '2020-01-02', a: 5, c: '$' },
          ],
        } as Partial<Supporter>),
      ],
    };
    const s = homeStats(db, NOW);
    // הבאג ההיסטורי: הבית סכם donations[] בלבד ⇒ 0, בעוד מסך התורמים הראה 150
    expect(s.donIls).toBe(150);
    expect(s.donUsd).toBe(15);
  });

  it('צ׳יפ "החודש" (monthDonationSum) סופר גם רשומת-hist של החודש', () => {
    const db: Db = {
      ...emptyDb(),
      supporters: [
        supporter({
          id: 'h2',
          donations: [{ rid: 'D-1', date: '2026-07-03', amount: 40, cur: '₪', cat: '' }],
          hist: [{ d: '2026-07-15', a: 60, c: '₪' }, { d: '2026-06-15', a: 999, c: '₪' }],
        } as Partial<Supporter>),
      ],
    };
    expect(monthDonationSum(db, NOW)).toBe(100);
  });
});

describe('אשכול 2 · מבנה הפריסות — אפס-סחף בין preset לתבנית', () => {
  it('כל תבנית-ערכה (THEME_TEMPLATES) מכסה בדיוק את ה-preset שלה (THEME_LAYOUTS)', () => {
    // הבאג: suggest היה ב-THEME_LAYOUTS אך נשמט מ-3 תבניות ⇒ הווידג'ט נעלם בתצוגה
    for (const theme of Object.keys(THEME_TEMPLATES)) {
      const t = THEME_TEMPLATES[theme];
      const flat = new Set(['hero', ...t.pre, ...t.colA, ...t.colB, ...t.post]);
      expect(flat, 'ערכה ' + theme).toEqual(new Set(THEME_LAYOUTS[theme]));
    }
  });

  it('לכל ערכה יש פריסה-מלאה (FULL_LAYOUTS) המכילה את ה-preset + 4 ווידג\'טי האנליטיקה', () => {
    // הבאג: רק or-rishon כוסתה — בשאר הערכות home.board:false איבד את האנליטיקה לתמיד
    for (const theme of Object.keys(THEME_LAYOUTS)) {
      const full = FULL_LAYOUTS[theme];
      expect(full, 'ערכה ' + theme).toBeTruthy();
      for (const id of THEME_LAYOUTS[theme]) expect(full, `ערכה ${theme} · ${id}`).toContain(id);
      for (const id of ['carousel', 'community', 'coursemetrics', 'credmetrics'])
        expect(full, `ערכה ${theme} · ${id}`).toContain(id);
    }
  });
});

describe('אשכול 3 · גידור-מודולים במקור-הנתונים (לא רק בניווט)', () => {
  it('מודול לוח-שנה כבוי ⇒ אין פריטי "דחוף" ואין שורות-לוח בתקציר', () => {
    const db: Db = { ...emptyDb(), events: [redEvent({ id: 'e1' })] };
    const items = attentionItems(db, NOW, { calendar: false }, DEFAULT_CONFIG);
    expect(items.find((x) => x.key.startsWith('urgent:'))).toBeUndefined();
    const lines = digestLines(db, NOW, { calendar: false }, DEFAULT_CONFIG);
    expect(lines.find((l) => l.key === 'calls' || l.key === 'specials')).toBeUndefined();
  });

  it('מודול משפחות כבוי ⇒ אין ממתינות/ספח/מדד-אדום ב"דורש טיפול"', () => {
    const db: Db = {
      ...emptyDb(),
      families: [
        { ...emptyFamily(), id: 'f1', status: 'pending', createdAt: '2026-07-01' },
        { ...emptyFamily(), id: 'f2', status: 'active', createdAt: '2026-06-01', fullSefach: false },
      ] as Db['families'],
    };
    const off = attentionItems(db, NOW, { families: false }, DEFAULT_CONFIG);
    expect(off.find((x) => ['pending:families', 'sefach:families', 'redcred:families'].includes(x.key))).toBeUndefined();
    // עם המודול דלוק — הפריטים כן נוצרים (ההיפוך מוכיח שהגידור הוא הסיבה)
    const on = attentionItems(db, NOW, {}, DEFAULT_CONFIG);
    expect(on.find((x) => x.key === 'pending:families')).toBeTruthy();
  });

  it('אירוע דחוף שעבר מקבל "באיחור N ימים"; אתמול = "אתמול"', () => {
    const db: Db = {
      ...emptyDb(),
      events: [redEvent({ id: 'e1', date: '2026-07-20' }), redEvent({ id: 'e2', date: '2026-07-11' })],
    };
    const items = attentionItems(db, NOW, {}, DEFAULT_CONFIG);
    expect(items.find((x) => x.key === 'urgent:e1')!.title).toContain('אתמול');
    expect(items.find((x) => x.key === 'urgent:e2')!.title).toContain('באיחור 10 ימים');
  });

  it('אירוע/מפגש בלי שעה יורד לסוף היום — לא צף מעל המתוזמנים', () => {
    const db: Db = {
      ...emptyDb(),
      events: [
        redEvent({ id: 'no-time', date: '2026-07-21', time: '' }),
        redEvent({ id: 'timed', date: '2026-07-21', time: '09:00' }),
      ],
    };
    const evs = eventsOnDate(db, NOW);
    expect(evs.map((e) => e.id)).toEqual(['timed', 'no-time']);
    expect(todaySessions(emptyDb(), NOW)).toEqual([]);
  });
});

describe('הגנת-מקור · HomeView + ווידג\'טים', () => {
  it('הווידג\'טים מקבלים db מסונן-ייעוד (vdb) — עובדת מוגבלת לא רואה תורמים זרים', () => {
    expect(homeViewSrc).toMatch(/db: vdb,/);
  });

  it('הערכה האפקטיבית אחידה (activeTheme) — פריסה ותבנית מאותו מקור', () => {
    expect(homeViewSrc).toContain('const activeTheme = db.ui.theme ?? config.theme;');
    expect(homeViewSrc).toContain('THEME_TEMPLATES[activeTheme]');
    expect(homeViewSrc).not.toContain('defaultLayoutFor(config.theme)');
  });

  it('שמירת-לוח לא משמיטה ווידג\'טים שמוסתרים זמנית (מודול כבוי בזמן העריכה)', () => {
    expect(homeViewSrc).toMatch(/hidden = savedLayout\.filter\(\(id\) => !HOME_WIDGETS\[id\]\.visible\(config\)\)/);
    expect(homeViewSrc).toContain('[...draft, ...hidden]');
  });

  it('navTo ממוגן-מודול גם למשפחה/חוג (לא רק תומך)', () => {
    expect(homeViewSrc).toMatch(/if \(coursesOn\) selectCourse\(nav\.id\)/);
    expect(homeViewSrc).toMatch(/if \(familiesOn\) selectFamily\(nav\.id\)/);
  });

  it('דופק-דקה — הברכה מתעדכנת והלוח מתגלגל בחצות בלי רענון', () => {
    expect(homeViewSrc).toMatch(/setInterval\(\(\) => setTick\(\(n\) => n \+ 1\), 60_000\)/);
  });

  it('"➕ הוספת משפחה" ב-hero פותח את הטופס עצמו (openFamilyForm), לא רק ניווט', () => {
    expect(widgetsSrc).toMatch(/openFamilyForm = useApp\(\(s\) => s\.openFamilyForm\)/);
    expect(widgetsSrc).toMatch(/onClick=\{openFamilyForm\}/);
  });

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

describe('אשכול 4 (ביקורת-60) · מנוע הבית — כיסוי שהיה חסר', () => {
  it('todaySessions — חוג רב-מפגשי נושא gi/groups; מיון-שעה; יום-לא-תואם מדולג', () => {
    const db: Db = {
      ...emptyDb(),
      courses: [
        {
          id: 'c1', name: 'בלט',
          sessions: [
            { day: 2, time: '17:00', label: '' },
            { day: 2, time: '16:00', label: '' },
            { day: 3, time: '10:00', label: '' },
          ],
        } as Db['courses'][number],
      ],
    };
    const NOW_TUE = new Date('2026-07-21T10:00:00'); // יום שלישי (day=2)
    const out = todaySessions(db, NOW_TUE);
    expect(out).toHaveLength(2);
    expect(out.map((t) => t.session.time)).toEqual(['16:00', '17:00']); // ממוין
    expect(out.every((t) => t.groups === 3)).toBe(true);
    expect(out.map((t) => t.gi).sort()).toEqual([0, 1]);
  });

  it('carouselItems — תקרת 10, סדר כרונולוגי, גידור-מודול לוח-שנה', () => {
    const events = Array.from({ length: 14 }, (_, i) =>
      redEvent({ id: 'ev' + i, date: '2026-07-' + String(22 + (i % 7)).padStart(2, '0'), type: 'org' } as Partial<OrgEvent>),
    );
    const db: Db = { ...emptyDb(), events };
    const items = carouselItems(db, NOW, {}, DEFAULT_CONFIG);
    expect(items.length).toBeLessThanOrEqual(10);
    expect(items.length).toBeGreaterThan(0);
    // מודול לוח-שנה כבוי ⇒ אין פריטי-אירועים כלל
    expect(carouselItems(db, NOW, { calendar: false }, DEFAULT_CONFIG)).toHaveLength(0);
  });

  it('digestLines — שורת-שקט כשריק; דחוף מוחרג לפי attnDone (מפתח-מגורסן)', () => {
    const quiet = digestLines(emptyDb(), NOW, {}, DEFAULT_CONFIG);
    expect(quiet).toHaveLength(1);
    expect(quiet[0].key).toBe('quiet');
    // אירוע דחוף ⇒ שורת "שבוע דחוף"; סימון-טופל במפתח המגורסן מעלים אותה
    const db: Db = { ...emptyDb(), events: [redEvent({ id: 'e1' })] };
    expect(digestLines(db, NOW, {}, DEFAULT_CONFIG).some((l) => l.urgent)).toBe(true);
    const done: Db = { ...db, attnDone: { 'urgent:e1': '2026-07-20' } };
    expect(digestLines(done, NOW, {}, DEFAULT_CONFIG).some((l) => l.urgent)).toBe(false);
  });

  it('recentFamilies — createdAt יורד + תקרה', () => {
    const fams = ['2026-01-01', '2026-03-01', '2026-02-01'].map((d, i) => ({
      ...emptyFamily(), id: 'f' + i, createdAt: d,
    })) as Db['families'];
    const db: Db = { ...emptyDb(), families: fams };
    expect(recentFamilies(db, 2).map((f) => f.createdAt)).toEqual(['2026-03-01', '2026-02-01']);
  });

  it('shop8 — הצעת-חג לא נוצרת כשמודול החנות כבוי; חידוש-כרטיסייה לא כשחוגים כבויים', () => {
    const cfgShopOff = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, shop: false } };
    const cfgCoursesOff = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, courses: false } };
    const db: Db = {
      ...emptyDb(),
      families: [{ ...emptyFamily(), id: 'f1', status: 'active', createdAt: '2026-01-01' }] as Db['families'],
      enrollments: [
        { id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'punch', purchased: 10, used: 9, group: '', absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01' } as Db['enrollments'][number],
      ],
    };
    const all = suggestions(db, NOW.toISOString().slice(0, 10), DEFAULT_CONFIG);
    const shopOff = suggestions(db, NOW.toISOString().slice(0, 10), cfgShopOff);
    const coursesOff = suggestions(db, NOW.toISOString().slice(0, 10), cfgCoursesOff);
    expect(shopOff.some((x) => x.act === 'shop')).toBe(false);
    expect(coursesOff.some((x) => x.act === 'courses')).toBe(false);
    // עם הכל דלוק — חידוש-הכרטיסייה קיים ונושא courseId לעומק
    const renew = all.find((x) => x.key === 'sug:renew:e1');
    expect(renew?.courseId).toBe('c1');
  });

  it('הגנת-מקור — מסלול-התבנית מרנדר גם "עודפים" מהפריסה (ערובת הפריסה-המלאה)', () => {
    // הבאג (HIGH, ביקורת-60): התבנית עקפה את FULL_LAYOUTS — 4 ווידג'טי-האנליטיקה
    // לא עלו כלל ב-home.board:false. העודפים מרונדרים אחרי post.
    expect(homeViewSrc).toContain("const tplIds = new Set<WidgetId>(['hero', ...tpl.pre, ...tpl.colA, ...tpl.colB, ...tpl.post]);");
    expect(homeViewSrc).toContain('const extras = savedLayout.filter((id) => visible(id) && !tplIds.has(id));');
    expect(homeViewSrc).toMatch(/extraGroups\.map\(\(g\) =>/);
  });

  it('הגנת-מקור — "נוכחות ✓" פותח דרך openCourseAttendance (גלילה לשיבוצים)', () => {
    expect(widgetsSrc).toMatch(/openCourseAttendance\(ts\.course\.id\)/);
  });

  it('הגנת-מקור — מרכז-הטיפול המלא (20.8, "הוויג\'דט שווה לטפל"): כפתור, חיפוש, ופעולות זהות', () => {
    // כפתור "המסך המלא ←" על פאנל דורש-טיפול/שווה-לטפל
    expect(widgetsSrc).toContain('המסך המלא ←');
    expect(widgetsSrc).toContain("'🔔 ' + wTitle + ' — המסך המלא'");
    // החיפוש מסנן על כותרת+תגית; הרשימה בלי קיצוץ-8
    expect(widgetsSrc).toContain("fullList = shownAttn.filter((a) => !fq.trim() || (a.title + ' ' + a.tag).includes(fq.trim()))");
    // אותן פעולות בדיוק: ניווט-עומק וסימון-טופל — לא עותק-לוגיקה
    expect(widgetsSrc).toMatch(/setFullOpen\(false\);\s*navTo\(a\.nav\);/);
  });
});
