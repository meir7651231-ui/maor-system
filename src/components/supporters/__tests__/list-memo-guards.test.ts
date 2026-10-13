/**
 * הגנות-מקור — ⚡ ביצועים (12.10.2026): צינור-הרשימה של מסך-התורמים ממומואיז.
 * הבאג: הנגזרת (visibleBase→סינון→מיון→שורות) רצה בגוף-הרכיב **אחרי** ששת ה-return-ים
 * המוקדמים (כרטיס/קוקפיט/מודיעין/גלקסיה/יקום/מחסן) ולכן לא יכלה להיות hook ⇒ חושבה
 * מחדש בכל רינדור, ו-2–4 רינדורים לכל הקשה (useDeferredValue, טוסטים, סטטוס-ענן, db.ui).
 * נמדד: 16,000 תורמים (34MB) · CPU ×4 — הקשה 1.1–1.4 שנ׳, מיון 1.0 שנ׳, פתיחת-טאב 2.1 שנ׳.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import incSrc from '../../incremental.tsx?raw';
import libSrc from '../lib.ts?raw';
import { hebDateFull } from '../../../lib/hebrew';
import hebrewSrc from '../../../lib/hebrew.ts?raw';

const body = (name: string): string => {
  const i = viewSrc.indexOf(name);
  expect(i, name).toBeGreaterThan(-1);
  return viewSrc.slice(i, viewSrc.indexOf('\n});\n', i));
};

describe('🛡 כל ה-hooks לפני ה-return המוקדם הראשון (סדר-hooks קבוע — אין React #300)', () => {
  it('useMemo/useCallback האחרונים יושבים לפני "if (selected) {"', () => {
    const firstReturn = viewSrc.indexOf('  if (selected) {');
    expect(firstReturn).toBeGreaterThan(-1);
    for (const h of ['useMemo(', 'useCallback(', 'useState(', 'useEffect(', 'useRemembered(', 'useIncCap(', 'useDeferredValue(', 'useListScrollRestore(']) {
      const last = viewSrc.lastIndexOf(h);
      expect(last, h).toBeGreaterThan(-1);
      expect(last, h + ' אחרי ה-return המוקדם').toBeLessThan(firstReturn);
    }
    // ששת ה-return-ים נשארו — אחרי ה-hooks
    for (const g of ['if (cockpitOn && workMode) {', 'if (intelOn && intelMode) {', 'if (galaxyOn && galaxyMode) {', 'if (universeOn && universeMode) {', 'if (warehouseOn && warehouseMode) {']) {
      expect(viewSrc.indexOf(g), g).toBeGreaterThan(firstReturn);
    }
    expect(viewSrc).not.toContain('⚠️ לא useMemo — יש return-מוקדם');
  });
});

describe('🛡 הצינור ממומואיז וקורא מספרים מוכנים', () => {
  it('buildSupporterStats · visibleBase · agg · filter · sort — כולם useMemo על התלויות הנכונות', () => {
    expect(viewSrc).toContain('buildSupporterStats(visibleBase, rate, Date.now())');
    // ⚠️ ביקורת (12.10): הציון (R) מתחלף על שעה-עגולה-מצהריים ⇒ דלי-השעה-מצהריים בתלויות (לא רק today)
    expect(viewSrc).toContain("const hourFromNoon = Math.floor((Date.now() - new Date(today + 'T12:00:00').getTime()) / 3600000);");
    expect(viewSrc).toContain('[visibleBase, rate, today, hourFromNoon]);');
    // ⚠️ ביקורת (12.10): קולבקים יציבים לרצועת-ה-KPI — אחרת ה-React.memo שלה מת
    expect(viewSrc).toContain('const onKpiTier = useCallback(');
    expect(viewSrc).toMatch(/onTier=\{onKpiTier\}\s*onHokDue=\{onKpiHokDue\}\s*onRisk=\{onKpiRisk\}/);
    expect(viewSrc).toMatch(/const visibleBase = useMemo\([\s\S]{0,200}\[db\.supporters, desigLimit\]/);
    expect(viewSrc).toMatch(/const stats = useMemo\([\s\S]{0,120}\[visibleBase, rate, today, hourFromNoon\]/);
    expect(viewSrc).toMatch(/const agg = useMemo\(/);
    // 13.10: + סינון שם-משפחה (lastNameF, מושהה דרך useDeferredValue) — גם בקלט וגם בתלויות.
    expect(viewSrc).toMatch(/const matched = useMemo\(\s*\(\) => filterSupporterList\(visibleBase, stats, \{ dq, cat, purposeF, regionF, hokF, tierF, lastF, monthF, gaveYearF, periodMode, acqYearF, colF, nextF, ayinF, lastNameF: lastNameOn \? dLastNameF : '' \}, today, rate, matchSeg\)/);
    expect(viewSrc).toContain('[visibleBase, stats, dq, cat, purposeF, regionF, hokF, tierF, lastF, monthF, gaveYearF, periodMode, acqYearF, colF, nextF, ayinF, lastNameOn, dLastNameF, today, rate, matchSeg]');
    expect(viewSrc).toContain("const list = useMemo(() => (sort ? sortSupporterList(matched, stats, sort.key, sort.dir, rate) : matched), [matched, stats, sort, rate]);");
    expect(viewSrc).toContain('const shownRows = incSlice(list, inc.cap)');
    // הרשימה-הישנה (סינון אינליין + sortVal) נעלמה מהמסך
    expect(viewSrc).not.toContain('function sortVal(');
    expect(viewSrc).not.toContain('let list = visibleBase.filter(');
    expect(viewSrc).not.toContain('const nq = normSearch(dq)');
  });

  it('מפתח-האיפוס של useIncCap — כמו היום (regionF/lastF לא במפתח; ביקורת 12.10: שינוי-התנהגות מחוץ למנדט)', () => {
    expect(viewSrc).toContain('useIncCap(JSON.stringify([dq, cat, purposeF, tierF, colF, ayinF, nextF, hokF, segF, monthF, acqYearF, gaveYearF, periodMode, sort]))');
    expect(incSrc).toContain('export function useIncCap(resetKey: string');
  });

  it('השורות — רכיבי memo עם callbacks יציבים; בלי supScore/supIls/supLast בתוך השורה', () => {
    expect(viewSrc).toContain('const SupporterRow = memo(function SupporterRow(props: RowProps) {');
    expect(viewSrc).toContain('const SupporterGridCard = memo(function SupporterGridCard(');
    for (const comp of ['const SupporterRow = memo(', 'const SupporterGridCard = memo(']) {
      const src = body(comp);
      for (const bad of ['supScore(', 'supIls(', 'supUsd(', 'supCount(', 'supLast(', 'supTotalIls(', 'totalLabel(sp)', 'isoToday(']) {
        expect(src, comp + ' מכיל ' + bad).not.toContain(bad);
      }
      expect(src).toContain('st.');
    }
    expect(viewSrc).toContain('const openSupporter = useCallback((id: string) => setSelId(id), []);');
    expect(viewSrc).toMatch(/const toggleSel = useCallback\(/);
    expect(viewSrc).toContain('onOpen={openSupporter}');
    expect(viewSrc).toContain('onToggle={toggleSel}');
    expect(viewSrc).toContain('<TierChip score={st.score} />');
    expect(viewSrc).not.toContain('<TierChip sp={sp}');
    // דגלי-שורה פעם-אחת לרינדור (לא featureOn/integrationOn פר-שורה)
    expect(viewSrc).toContain("const click2call = featureOn(config, 'supporters.click2call');");
    expect(viewSrc).toContain("const waOn = integrationOn(config, 'whatsapp');");
  });

  it('מצברי-הכותרת (tierCounts/tIls/tUsd/yearOptions/catOptions/purposeOptions/dueCount/ayin*) בתוך agg', () => {
    const agg = viewSrc.slice(viewSrc.indexOf('const agg = useMemo('), viewSrc.indexOf('}, [visibleBase, stats, today, rate]);'));
    for (const k of ['ayinActiveCount', 'ayinTodayCount', 'dueCount', 'catOptions', 'purposeOptions', 'tierCounts', 'tIls', 'tUsd', 'yearOptions']) {
      expect(agg, k).toMatch(new RegExp('\\b(const|let) ' + k + '\\b'));
    }
    expect(agg).toContain('tierCounts[st.tier.label]++');
    expect(viewSrc).toContain('const rfmStats = useMemo(() => ({ in12m: sup12m(db.supporters, today), avg: supAvgDon(db.supporters, rate) }), [db.supporters, today, rate]);');
    expect(viewSrc).not.toContain('donationYears(visibleBase)');
  });

  it('search/phoneDigits עצלים ב-lib (לא בבנייה — פתיחת-טאב לא משלמת regex×16k)', () => {
    const build = libSrc.slice(libSrc.indexOf('export function supporterStats('), libSrc.indexOf('export function buildSupporterStats('));
    expect(build).not.toContain('normSearch(');
    expect(build).not.toContain('allSupPhones(');
    expect(libSrc).toContain('return st.search ?? (st.search = normSearch(');
    expect(libSrc).toContain('phoneDigitsOf(st, sp).some((n) => n.includes(qd))');
    expect(libSrc).toContain('searchTextOf(st, sp).includes(nq)');
  });
});

describe('🛡 hebDateFull — מטמון מוגבל (אותו טקסט; כותרת-הריחוף פר-שורה בלי 3 פורמטי-ICU)', () => {
  it('אותה תוצאה בקריאה חוזרת, ריק/לא-חוקי יציבים, והקריאות עקביות עם הפורמט-הישיר', () => {
    const a = hebDateFull('2026-10-12');
    expect(a).toBe(hebDateFull('2026-10-12'));
    expect(a).toMatch(/^[א-ת״׳]+ [א-ת ]+ [א-ת״׳]+$/);
    expect(hebDateFull('')).toBe('');
    expect(hebDateFull('לא-תאריך')).toBe('');
    expect(hebDateFull('לא-תאריך')).toBe('');
    // 6k תאריכים שונים — המטמון (5k) מתפנה בלי לשבור נכונות
    const seen = new Map<string, string>();
    for (let i = 0; i < 6000; i++) {
      const d = new Date(Date.UTC(2000, 0, 1 + i));
      const iso = d.toISOString().slice(0, 10);
      seen.set(iso, hebDateFull(iso));
    }
    for (const [iso, v] of [...seen].slice(0, 50)) expect(hebDateFull(iso)).toBe(v);
  });

  it('⚠️ ביקורת (12.10): המטמון באמת קיים (הגנת-מקור) — הסרתו החזירה 3 פורמטי-ICU פר-שורה בלי שהבדיקה תיפול', () => {
    expect(hebrewSrc).toContain('const hit = hdfCache.get(iso);');
    expect(hebrewSrc).toContain('hdfCache.set(iso, out);');
    expect(hebrewSrc).toMatch(/const hit = hdfCache\.get\(iso\);\s*\n\s*if \(hit !== undefined\) return hit;/);
  });
});
