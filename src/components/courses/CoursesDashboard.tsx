/**
 * 📊 דשבורד-חוגים (פאזה 8) — כל מדדי-התפעול במבט-אחד: שורה-פר-חוג (רשומים · תפוסה% ·
 * רשימת-המתנה · חוב · חיסורים · בסיכון), סיכומים, ו"החוגים-המבוקשים". נגזרת טהורה
 * (dashboard.ts) — אפס-סכמה, אפס-נגיעה-בקבלות. ייצוא CSV דרך core.export.
 */
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Btn, Empty, Modal } from '../ui';
import { guardExport } from '../../lib/exportGate';
import { csvEscape, downloadCsv } from '../../lib/csvx';
import { courseDashboard, dashboardCsvRows, type CourseRow } from './dashboard';
import { isoToday } from './lib';

type SortKey = 'name' | 'teacher' | 'enrolled' | 'occupancy' | 'waitlist' | 'debt' | 'absences' | 'atRisk';

/** צבע לפי תפוסה — אדום כשמלא, כתום כשקרוב, אחרת נייטרלי. */
function occColor(r: CourseRow): string {
  if (r.max <= 0) return 'var(--ink-faint)';
  if (r.occupancy >= 100) return '#dc2626';
  if (r.occupancy >= 80) return '#9a6414';
  return '#12803c';
}

/** A-2 (3.9): שורת-הדשבורד נפתחת גם במקלדת (Enter/רווח) — כמו שורות FamiliesView/SupportersView. */
const openRowKey = (fn: () => void) => (e: KeyboardEvent<HTMLElement>) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

export function CoursesDashboard(props: { onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const selectCourse = useApp((s) => s.selectCourse);
  const toast = useApp((s) => s.toast);
  const exportOn = featureOn(config, 'core.export');

  const dash = useMemo(() => courseDashboard(db), [db]);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'occupancy', dir: -1 });

  const rows = useMemo(() => {
    const val = (r: CourseRow): string | number =>
      sort.key === 'name' ? r.name
      : sort.key === 'teacher' ? r.teacher
      : sort.key === 'enrolled' ? r.enrolled
      : sort.key === 'occupancy' ? (r.max > 0 ? r.occupancy : -1)
      : sort.key === 'waitlist' ? r.waitlist
      : sort.key === 'debt' ? r.debt
      : sort.key === 'absences' ? r.absences
      : r.atRisk;
    return [...dash.rows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const cc = typeof va === 'string' ? va.localeCompare(String(vb), 'he') : va - (vb as number);
      return cc * sort.dir;
    });
  }, [dash.rows, sort]);

  const clickSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'name' || key === 'teacher' ? 1 : -1 }));

  const thSort = (key: SortKey, label: string) => (
    <th
      onClick={() => clickSort(key)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickSort(key); } }}
      role="button"
      tabIndex={0}
      aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
      title="מיון לפי העמודה — לחיצה נוספת הופכת כיוון"
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {label}{' '}
      <span style={{ fontSize: 10, opacity: sort.key === key ? 1 : 0.35 }}>
        {sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕'}
      </span>
    </th>
  );

  const kpi = (label: string, value: string, color?: string) => (
    <div style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--panel)', border: '1px solid var(--line)', minWidth: 96 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || 'var(--ink)' }}>{value}</div>
    </div>
  );

  const s = dash.summary;

  return (
    <Modal title={'📊 דשבורד ' + termOf(config, 'nav.courses', 'חוגים') + ' — מבט-על'} onClose={props.onClose} wide>
      {db.courses.length === 0 ? (
        <Empty>עדיין אין {termOf(config, 'nav.courses', 'חוגים')} להצגה בדשבורד.</Empty>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {kpi(termOf(config, 'nav.courses', 'חוגים'), String(s.courses))}
            {kpi('רשומים', String(s.enrolled))}
            {kpi('תפוסה ממוצעת', s.avgOccupancy + '%')}
            {kpi('רשימת-המתנה', String(s.waitlist), s.waitlist > 0 ? '#7c3aed' : undefined)}
            {kpi('חוב פתוח', '₪' + s.debt.toLocaleString('he-IL'), s.debt > 0 ? '#b91c1c' : undefined)}
            {kpi('בסיכון-נשירה', String(s.atRisk), s.atRisk > 0 ? '#b45309' : undefined)}
            <div style={{ flex: 1 }} />
            {exportOn && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Btn sm onClick={() => downloadCsv('courses-dashboard-' + isoToday() + '.csv', dashboardCsvRows(dash, config))} title="ייצוא הדשבורד ל-CSV">
                  ⬇ CSV
                </Btn>
                <Btn
                  sm
                  onClick={() => {
                    if (!guardExport()) return; // 🔐 שער יציאת-מידע
                    void navigator.clipboard?.writeText(dashboardCsvRows(dash, config).map((r) => r.map(csvEscape).join('\t')).join('\n')); // csvEscape: בלי הזרקת-נוסחה בהדבקה לאקסל
                    toast('הדשבורד הועתק');
                  }}
                >
                  📋 העתקה
                </Btn>
              </div>
            )}
          </div>

          {/* 🔥 החוגים-המבוקשים — בעלי רשימת-ההמתנה הארוכה ביותר */}
          {dash.mostWanted.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-faint)' }}>{'🔥 ה' + termOf(config, 'nav.courses', 'חוגים') + ' המבוקשים:'}</span>
              {dash.mostWanted.slice(0, 6).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    props.onClose();
                    selectCourse(r.id);
                  }}
                  title={'פתיחת כרטיס ה' + termOf(config, 'entity.course', 'חוג')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--line)',
                    background: '#efe7f3',
                    color: '#7c3aed',
                    cursor: 'pointer',
                  }}
                >
                  {r.name} · ⏳ {r.waitlist}
                </button>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: 0, overflowX: 'auto', overflowY: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  {thSort('name', termOf(config, 'entity.course', 'חוג'))}
                  {thSort('teacher', termOf(config, 'entity.teacher', 'מורה'))}
                  {thSort('enrolled', 'רשומים')}
                  {thSort('occupancy', 'תפוסה')}
                  {thSort('waitlist', 'המתנה')}
                  {thSort('debt', 'חוב')}
                  {thSort('absences', 'חיסורים')}
                  {thSort('atRisk', 'בסיכון')}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} tabIndex={0} onClick={() => { props.onClose(); selectCourse(r.id); }} onKeyDown={openRowKey(() => { props.onClose(); selectCourse(r.id); })}>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{r.teacher}</td>
                    <td style={{ fontWeight: 700 }}>{r.enrolled + '/' + (r.max || '∞')}</td>
                    <td style={{ fontWeight: 800, color: occColor(r) }}>{r.max > 0 ? r.occupancy + '%' : '—'}</td>
                    <td style={{ fontWeight: 700, color: r.waitlist > 0 ? '#7c3aed' : 'var(--ink-faint)' }}>{r.waitlist || '—'}</td>
                    <td style={{ fontWeight: 700, color: r.debt > 0 ? '#b91c1c' : 'var(--ink-faint)' }}>{r.debt > 0 ? '₪' + r.debt.toLocaleString('he-IL') : '—'}</td>
                    <td style={{ color: 'var(--ink-faint)' }}>{r.absences || '—'}</td>
                    <td style={{ fontWeight: 700, color: r.atRisk > 0 ? '#b45309' : 'var(--ink-faint)' }}>{r.atRisk || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
            {'נגזרת חיה מה' + termOf(config, 'nav.courses', 'חוגים') + ' וה' + termOf(config, 'entity.enrollments', 'שיבוצים') + ' — אפס-נגיעה-בקבלות. לחיצה על שורה פותחת את כרטיס ה' + termOf(config, 'entity.course', 'חוג') + '.'}
          </div>
        </>
      )}
    </Modal>
  );
}
