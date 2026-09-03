/**
 * ratchet — נחיל ב׳ (3.9.2026) · שכבת-lib: ריפוי-migrate (EC-1/EC-2) · איחוד חיובים-מתוכננים במיזוג
 * (MN-2) · תקציב-תמונות (P4) · smartScore ≡ הגרסה ההיסטורית (P2) · עיגול-CSV (MN-4) · דוח-שנתי
 * ביט-זהה בלי מונחים (TP-15) · הגנות-מקור (A2/A4/A7/A8/P1/P3).
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../../store/persist';
import { mergeSupporterInto } from '../dedup';
import { canAddPhoto, PHOTO_MAX, PHOTO_TOTAL_MAX_LEN } from '../photoGallery';
import { XLAT, expandQuery, scoreTerm, smartFilter, smartScore } from '../search';
import { normSearch } from '../validate';
import { buildCustomExport } from '../customExport';
import { annualAllLines, annualReportLines } from '../annualReport';
import { hokRecordedThisMonth } from '../../components/supporters/lib';
import { DEFAULT_CONFIG } from '../../types/config';
import { emptyDb, emptyFamily, emptyMember, type Db, type PlannedCharge, type Supporter } from '../../types/domain';
import persistSrc from '../../store/persist.ts?raw';
import cloudSyncSrc from '../../store/cloudSync.ts?raw';
import cloudSrc from '../cloud.ts?raw';
import cryptoSrc from '../crypto.ts?raw';
import dedupSrc from '../dedup.ts?raw';

function sp(id: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id, name: 'תומך ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}
function pc(id: string, over: Partial<PlannedCharge> = {}): PlannedCharge {
  return { id, date: '2026-10-01', amount: 100, cur: '₪', method: 'credit', cat: 'כללי', ...over };
}

describe('🩹 EC-1/EC-2 — migrate מרפא תרומה בלי date ולא קורס על איברי null', () => {
  it('EC-1: date חסר ⇒ "" (ה-rid נשמר); null נזרק; תרומה תקינה — אותה הפניה', () => {
    const valid = { rid: 'D-2', date: '2026-01-01', amount: 50, cur: '₪', cat: '' };
    const raw = {
      v: 6,
      supporters: [sp('s1', { donations: [{ rid: 'D-1', amount: 100, cur: '₪', cat: '' }, null, valid] as unknown as Supporter['donations'] })],
    };
    const db = migrate(raw)!;
    const dons = db.supporters[0].donations;
    expect(dons).toHaveLength(2);
    expect(dons[0].rid).toBe('D-1');
    expect(dons[0].date).toBe('');
    expect(dons[1]).toBe(valid);
    // הצרכן שקרס (d.date.startsWith) — לא זורק יותר
    const healed = { ...db.supporters[0], hok: { amount: 100, cur: '₪' as const, day: 1, method: 'bank', note: '', active: true, startedAt: '2026-01-01' } };
    expect(() => hokRecordedThisMonth(healed, '2026-09-03')).not.toThrow();
    // אידמפוטנטי: ריצה שנייה לא משנה כלום
    expect(migrate(db)!.supporters[0].donations).toEqual(dons);
  });

  it('EC-2: null בשיבוצים/חוגים/תומכים ⇒ מסונן, לא TypeError', () => {
    const raw = { v: 6, enrollments: [null], courses: [null], supporters: [null] };
    expect(() => migrate(raw)).not.toThrow();
    const db = migrate(raw)!;
    expect(db.enrollments).toEqual([]);
    expect(db.courses).toEqual([]);
    expect(db.supporters).toEqual([]);
  });
});

describe('🔗 MN-2 — mergeSupporterInto מאחד plannedCharges (לפי id, השומר קודם)', () => {
  it('keep [pcK] + drop [pc1 פתוח, pc2 חויב] ⇒ [pcK, pc1, pc2]', () => {
    const merged = mergeSupporterInto(
      sp('k', { plannedCharges: [pc('pcK')] }),
      sp('d', { plannedCharges: [pc('pc1'), pc('pc2', { chargedRid: 'D-7' })] }),
    );
    expect(merged.plannedCharges!.map((p) => p.id)).toEqual(['pcK', 'pc1', 'pc2']);
    expect(merged.plannedCharges![2].chargedRid).toBe('D-7');
  });
  it('שומר בלי תוכניות + נמחק עם אחת ⇒ אחת; שניהם ריקים ⇒ השדה לא קיים (ביט-זהה)', () => {
    expect(mergeSupporterInto(sp('k'), sp('d', { plannedCharges: [pc('pc1')] })).plannedCharges).toHaveLength(1);
    const none = mergeSupporterInto(sp('k'), sp('d'));
    expect(none.plannedCharges).toBeUndefined();
    expect('plannedCharges' in none).toBe(false);
    // id כפול (הגנתי) ⇒ פעם אחת
    expect(mergeSupporterInto(sp('k', { plannedCharges: [pc('x')] }), sp('d', { plannedCharges: [pc('x')] })).plannedCharges).toHaveLength(1);
  });
  it('🛡 הגנת-מקור', () => {
    expect(dedupSrc).toContain('...(plannedCharges.length ? { plannedCharges } : {}),');
  });
});

describe('📷 P4 — canAddPhoto: תקציב-משקל-כולל (מסמך-ענן < 1MB)', () => {
  it('כמות מתחת לתקרה אך משקל+מועמדת מעל התקציב ⇒ false', () => {
    expect(canAddPhoto(['x'.repeat(300_000), 'x'.repeat(250_000)], 100_000)).toBe(false);
    expect(canAddPhoto(['x'.repeat(300_000), 'x'.repeat(250_000)])).toBe(true); // בלי מועמדת — עדיין בתקציב
    expect(canAddPhoto(['x'.repeat(100)], 100)).toBe(true);
    expect(canAddPhoto(Array(PHOTO_MAX).fill('x'), 1)).toBe(false); // כמות
    expect(canAddPhoto(undefined, PHOTO_TOTAL_MAX_LEN)).toBe(true);
    expect(canAddPhoto(undefined, PHOTO_TOTAL_MAX_LEN + 1)).toBe(false);
  });
  it('תומך עם PHOTO_MAX תמונות בתקציב-מלא ⇒ מסמך JSON < 900k', () => {
    const per = Math.floor(PHOTO_TOTAL_MAX_LEN / PHOTO_MAX);
    const doc = sp('s', { photos: Array(PHOTO_MAX).fill('data:image/jpeg;base64,' + 'A'.repeat(per - 23)) });
    expect(JSON.stringify(doc).length).toBeLessThan(900_000);
  });
});

/* ── P2: הגרסה ההיסטורית של expandQuery/smartScore (הועתקה כלשונה לפני הריפקטור) ── */
function legacyExpand(q: string): string[] {
  const nq = normSearch(q);
  const out = [q];
  if (!nq) return out;
  for (const [heb, aliases] of Object.entries(XLAT)) {
    if (normSearch(heb) === nq) out.push(...aliases);
    else if (aliases.some((a) => normSearch(a) === nq)) out.push(heb);
  }
  return [...new Set(out)];
}
function legacyScore(q: string, terms: string[]): number {
  const toks = normSearch(q).split(/\s+/).filter(Boolean);
  if (!toks.length) return 0;
  let phrase = 0;
  if (toks.length > 1) {
    for (const exp of legacyExpand(q.trim())) {
      for (const term of terms) {
        phrase = Math.max(phrase, scoreTerm(exp, term));
        if (phrase >= 100) break;
      }
      if (phrase >= 100) break;
    }
  }
  let total = 0;
  for (const tok of toks) {
    let best = 0;
    for (const exp of legacyExpand(tok)) {
      for (const term of terms) {
        best = Math.max(best, scoreTerm(exp, term));
        if (best >= 100) break;
      }
      if (best >= 100) break;
    }
    if (!best) {
      total = 0;
      break;
    }
    total += best;
  }
  return Math.max(total, phrase);
}
function legacyFilter<T>(q: string, items: T[], getTerms: (t: T) => string[]): T[] {
  if (!normSearch(q)) return items.slice();
  const scored: { it: T; sc: number }[] = [];
  for (const it of items) {
    const sc = legacyScore(q, getTerms(it));
    if (sc > 0) scored.push({ it, sc });
  }
  scored.sort((a, b) => b.sc - a.sc);
  return scored.map((x) => x.it);
}

describe('🔎 P2 — smartScore ≡ הגרסה ההיסטורית (תוכנית-שאילתה = CSE טהור)', () => {
  const FIXTURES: Array<[string, string[]]> = [
    ['cohen', ['כהן']], ['דוד כהן', ['דוד', 'כהן']], ['דוד גולן', ['דוד', 'כהן']], ['', ['כהן']],
    ['bnei brak', ['בני ברק']], ['petah tikva', ['פתח תקווה']], ['בני ברק', ['bnei brak']],
    ['כהן זזזז', ['כהן']], ['כהאן', ['כהן']], ['חוגים', ['חוג']], ['דויד', ['דוד']], ['12345', ['123456780']],
    ['   ', ['כהן']], ['moshe cohen', ['משה', 'כהן']], ['מוישי', ['משה']],
  ];
  it('קבועי search.test + הרחבה — ציון זהה', () => {
    for (const [q, terms] of FIXTURES) expect(smartScore(q, terms), q).toBe(legacyScore(q, terms));
  });
  it('expandQuery זהה להיסטורי לכל מפתח/כינוי ב-XLAT (ולשאילתה זרה)', () => {
    const all = [...Object.keys(XLAT), ...Object.values(XLAT).flat(), 'xyzzy', '', 'כהנ', 'COHEN'];
    for (const q of all) expect(expandQuery(q), q).toEqual(legacyExpand(q));
  });
  it('200 זוגות (q, terms) מחוללים דטרמיניסטית — ציון זהה וסדר-סינון זהה', () => {
    let seed = 20260903;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const vocab = [
      ...Object.keys(XLAT), ...Object.values(XLAT).flat(),
      'כהנא', 'דודי', 'חוגים', 'קבלות', '123456', '123456780', 'אבגדזח', 'אבגדהו', 'גולן', 'זזזז', 'חיים', 'חיפה', 'x',
    ];
    const pickW = () => vocab[Math.floor(rnd() * vocab.length)];
    const pickQ = () => Array.from({ length: 1 + Math.floor(rnd() * 3) }, pickW).join(' ');
    const items = Array.from({ length: 40 }, (_, i) => ({ i, terms: Array.from({ length: 1 + Math.floor(rnd() * 3) }, pickW) }));
    for (let n = 0; n < 200; n++) {
      const q = pickQ();
      const terms = Array.from({ length: 1 + Math.floor(rnd() * 3) }, pickW);
      expect(smartScore(q, terms), q + ' | ' + terms.join(',')).toBe(legacyScore(q, terms));
      if (n % 10 === 0) {
        expect(smartFilter(q, items, (t) => t.terms).map((t) => t.i), q).toEqual(legacyFilter(q, items, (t) => t.terms).map((t) => t.i));
      }
    }
  });
});

describe('📊 MN-4 — CSV: סכימת-float מעוגלת לאגורות לפני שרשור', () => {
  it('תשלומים 10.1+20.2 על 40 ⇒ "יתרה ₪9.7" (לא 9.699999…); pays/revenue ₪30.3', () => {
    const fam = { ...emptyFamily(), id: 'f1', name: 'כהן', phone: '050-1111111', createdAt: '2026-01-01', members: [{ ...emptyMember(), id: 'm1', first: 'רבקה' }] };
    const db: Db = {
      ...emptyDb(),
      families: [fam],
      courses: [{ id: 'c1', name: 'ריקוד', teacherId: '', roomId: '', model: 'monthly', price: 100, maxStudents: 12, weekday: 2, time: '17:00', sessions: [], notes: '' } as unknown as Db['courses'][number]],
      enrollments: [{
        id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '', absences: [],
        payments: [{ rid: 'R-1', date: '2026-01-15', amount: 10.1, method: 'מזומן' }, { rid: 'R-2', date: '2026-02-15', amount: 20.2, method: 'מזומן' }],
        totalDue: 40, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01',
      } as unknown as Db['enrollments'][number]],
    };
    const rows = buildCustomExport({ ...DEFAULT_CONFIG, features: {} }, db, 'courses', { from: '', to: '' }, ['studentsFull', 'pays', 'revenue']) as string[][];
    expect(rows[1][0]).toContain('יתרה ₪9.7');
    expect(rows[1][0]).not.toContain('9.699');
    expect(rows[1][1]).toBe('2 תשלומים · ₪30.3');
    expect(rows[1][2]).toBe('₪30.3');
  });
});

describe('📄 TP-15 — דוח-שנתי: בלי מונחים ביט-זהה; עם מונחים — רק המילים המסחריות (§46 לא נוגעים)', () => {
  const DONS = [{ date: '2026-01-05', amount: 200, cur: '₪', rid: 'D-3' }, { date: '2025-12-31', amount: 50, cur: '₪', rid: 'D-1' }];
  it('ברירת-מחדל = הליטרלים ההיסטוריים (snapshot שורה-שורה)', () => {
    const lines = annualReportLines({ orgName: 'מאור החסד', orgTaxId: '580123456', supporterName: 'ר׳ כהן', year: '2026', donations: DONS });
    expect(lines[1]).toBe('        דוח תרומות שנתי — שנת 2026');
    expect(lines[6]).toBe('התורם/ת: ר׳ כהן');
    expect(lines).toContain('סה"כ 1 תרומות בשנת 2026');
    expect(annualReportLines({ orgName: 'א', supporterName: 'ב', year: '2020', donations: DONS })).toContain('אין תרומות רשומות בשנת 2020.');
    expect(annualAllLines('א', undefined, '1999', [{ name: 'כהן', donations: DONS }])).toContain('אין תורמים עם תרומות בשנת 1999.');
  });
  it('מונחי-ורטיקל: רכישות/הלקוח — ונוסח-§46 נשאר', () => {
    const terms = { donations: 'רכישות', supporter: 'הלקוח', supporters: 'לקוחות' };
    const lines = annualReportLines({ orgName: 'סטודיו', orgTaxId: '5', supporterName: 'לוי', year: '2026', donations: DONS, terms });
    expect(lines[1]).toBe('        דוח רכישות שנתי — שנת 2026');
    expect(lines[6]).toBe('הלקוח: לוי');
    expect(lines).toContain('סה"כ 1 רכישות בשנת 2026');
    expect(lines.join('\n')).toContain('סעיף 46 לפקודת מס הכנסה');
    expect(annualAllLines('א', undefined, '1999', [{ name: 'כהן', donations: DONS }], undefined, terms)).toContain('אין לקוחות עם רכישות בשנת 1999.');
  });
});

describe('🛡 הגנות-מקור — נחיל ב׳ (A2/A4/A7/A8/P3)', () => {
  it('cloudSync: מונה-כשלונות + backoff מעריכי + invalid-argument קבוע + diff-ריק משחרר pending', () => {
    expect(cloudSyncSrc).toContain('let pushFails = 0;');
    expect(cloudSyncSrc).toContain("'invalid-argument': ");
    expect(cloudSyncSrc).toContain("const fatal = info.perm || code === 'invalid-argument';");
    expect(cloudSyncSrc).toContain('Math.min(5000 * 2 ** (pushFails - 1), 300_000)');
    expect(cloudSyncSrc).toContain("if (active && statusCache === 'pending') setStat(hooks, 'synced');");
    expect(cloudSyncSrc).toMatch(/pushLatest = null;\s*\n\s*pushFails = 0;\s*\n\s*setStat\(hooks, 'idle'\);/); // איפוס ב-stopCloudSync
    expect(cloudSyncSrc).toMatch(/function describeErr/);
  });
  it('persist: גשש-תחילית למעטפת במקום parse מלא (saveDb + flushSaveSync) — ושקילות ל-isEncrypted', () => {
    expect(persistSrc).toContain('const ENC_PROBE = /^\\{[^{}]{0,40}"\\$enc":2/;');
    expect(persistSrc).toContain('const stored = await readStoredEnvelope();');
    expect(persistSrc).not.toContain('const stored = await readRaw();');
    expect(persistSrc).toContain('if (cur && ENC_PROBE.test(cur) && isEncrypted(JSON.parse(cur))) return;');
    // הכותב מציב $enc ראשון (crypto.ts) ⇒ הגשש שקול ל-isEncrypted על כל פלט-כותב
    expect(cryptoSrc).toMatch(/return \{\s*\$enc: 2,/);
    const PROBE = /^\{[^{}]{0,40}"\$enc":2/;
    expect(PROBE.test(JSON.stringify({ $enc: 2, iter: 600000, saltPass: 'a', saltRec: 'b', wrapPass: 'c', wrapRec: 'd', iv: 'e', data: 'f' }))).toBe(true);
    expect(PROBE.test(JSON.stringify(emptyDb()))).toBe(false);
    expect(PROBE.test(JSON.stringify({ ...emptyDb(), orgName: '"$enc":2' }))).toBe(false); // גרשיים מוברחים בתוך מחרוזת
  });
  it('persist.getIdb: promise-דחוי לא נשמר לצמיתות (איפוס בבדיקת-זהות)', () => {
    expect(persistSrc).toMatch(/const p = openDB\(IDB_NAME, 1, \{[\s\S]{0,200}\}\);\s*idb = p;\s*p\.catch\(\(\) => \{\s*if \(idb === p\) idb = null;/);
  });
  it('cloud.subscribeAll: שרשרת-סדר פר-אוסף בנתיב-המוצפן; נתיב dek===null ביט-זהה', () => {
    expect(cloudSrc).toContain('let chain: Promise<void> = Promise.resolve();');
    expect(cloudSrc).toContain('chain = chain');
    expect(cloudSrc).toContain('metaChain = metaChain');
    expect(cloudSrc).not.toContain('void Promise.all(');
    expect(cloudSrc).toContain("onRemote({ col, docs: changes.map((ch) => ({ id: ch.doc.id, data: clean(col, ch.doc.data()), deleted: ch.type === 'removed' })) });");
    expect(cloudSrc).toContain('onRemote({ meta: snap.data() });');
  });
});
