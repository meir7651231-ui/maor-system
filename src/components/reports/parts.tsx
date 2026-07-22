/**
 * רכיבי תצוגה משותפים לדוחות — עטיפת סעיף (הדפסה + CSV) וטבלת דוח גנרית
 * עם מיון בלחיצה על כותרת, שורת סינון פר-עמודה (מוסתרת בהדפסה) ושורות
 * לחיצות (Row.open) שפותחות את כרטיס הישות.
 */

import { useState, type ReactNode } from 'react';
import { Btn } from '../ui';
import { normSearch } from '../../lib/validate';
import { numMatch } from '../families/lib';
import { downloadCsv, type Cell } from './csv';

/** שורת דוח — תאים + דגל אזהרה + פתיחת כרטיס בלחיצה (אופציונלי). */
export interface Row {
  cells: Cell[];
  warn?: boolean;
  open?: () => void;
}

/** מפתח מיון לתא — מספר כשאפשר (כולל "85%", "₪120"), תאריך dd/mm/yyyy כ-ISO. */
function sortKeyOf(c: Cell): { n: number | null; s: string } {
  if (typeof c === 'number') return { n: c, s: '' };
  const t = String(c).trim();
  const dm = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dm) return { n: null, s: dm[3] + '-' + dm[2].padStart(2, '0') + '-' + dm[1].padStart(2, '0') };
  const nm = t.match(/-?\d+(\.\d+)?/);
  if (nm && /^[-\d.,%/\s₪$]*$/.test(t)) return { n: parseFloat(nm[0]), s: '' };
  return { n: null, s: t };
}

/** התאמת סינון לתא — תחביר מספרים (3 / 3+ / 2-4) על תא מספרי, אחרת הכלה טקסטואלית. */
function cellMatch(c: Cell, q: string): boolean {
  q = q.trim();
  if (!q) return true;
  if (/^\d+\s*(\+|-\s*\d+)?$/.test(q)) {
    const k = sortKeyOf(c);
    if (k.n !== null) return numMatch(q, k.n);
  }
  return normSearch(String(c)).includes(normSearch(q));
}

export function ReportTable(props: { head: string[]; rows: Row[]; foot?: Cell[] }) {
  const [sort, setSort] = useState<{ i: number; dir: 1 | -1 } | null>(null);
  const [filterOn, setFilterOn] = useState(false);
  const [filters, setFilters] = useState<Record<number, string>>({});

  if (!props.rows.length) return <div className="empty">אין נתונים להצגה</div>;

  const active = Object.entries(filters).filter(([, v]) => v.trim());
  const filtered = active.length
    ? props.rows.filter((r) => active.every(([i, q]) => cellMatch(r.cells[+i] ?? '', q)))
    : props.rows;

  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const ka = sortKeyOf(a.cells[sort.i] ?? '');
        const kb = sortKeyOf(b.cells[sort.i] ?? '');
        const c =
          ka.n !== null && kb.n !== null ? ka.n - kb.n : (ka.s || String(ka.n)).localeCompare(kb.s || String(kb.n), 'he');
        return c * sort.dir;
      })
    : filtered;

  const clickSort = (i: number) =>
    setSort((s) => (s?.i === i ? { i, dir: s.dir === 1 ? -1 : 1 } : { i, dir: 1 }));

  const clickable = sorted.some((r) => r.open);

  return (
    <div style={{ overflowX: 'auto' }}>
      {props.rows.length > 3 && (
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <button
            type="button"
            className={'chip' + (filterOn || active.length ? ' on' : '')}
            onClick={() => setFilterOn(!filterOn)}
            title="שורת סינון מתחת לכל עמודה — גם תחביר מספרים: 3 / 3+ / 2-4"
          >
            ⏷ סינון{active.length ? ' · ' + active.length : ''}
          </button>
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            {props.head.map((h, i) => (
              <th
                key={i}
                onClick={() => clickSort(i)}
                title="מיון לפי העמודה — לחיצה נוספת הופכת כיוון"
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                {h}{' '}
                <span className="no-print" style={{ fontSize: 10, opacity: sort?.i === i ? 1 : 0.35 }}>
                  {sort?.i === i ? (sort.dir === 1 ? '▲' : '▼') : '↕'}
                </span>
              </th>
            ))}
          </tr>
          {filterOn && (
            <tr className="no-print">
              {props.head.map((_, i) => (
                <th key={i} style={{ padding: '4px 6px' }}>
                  <input
                    value={filters[i] ?? ''}
                    onChange={(e) => setFilters({ ...filters, [i]: e.target.value })}
                    placeholder="סינון…"
                    style={{ width: '100%', minWidth: 56, padding: '4px 8px', fontSize: 12 }}
                  />
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={i}
              onClick={r.open}
              onKeyDown={
                r.open &&
                ((e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    r.open!();
                  }
                })
              }
              tabIndex={r.open ? 0 : undefined}
              title={r.open ? 'פתיחת הכרטיס' : undefined}
              style={{
                ...(r.warn ? { color: 'var(--red)', fontWeight: 600 } : undefined),
                ...(r.open ? { cursor: 'pointer' } : undefined),
              }}
            >
              {r.cells.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {props.foot && (
          <tfoot>
            <tr style={{ fontWeight: 700 }}>
              {props.foot.map((c, j) => (
                <td key={j} style={{ borderTop: '2px solid var(--line)' }}>
                  {c}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
      {clickable && (
        <div className="no-print" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 6 }}>
          לחיצה על שורה פותחת את הכרטיס המלא
        </div>
      )}
    </div>
  );
}

/**
 * עטיפת סעיף דוח: כותרת, תת-כותרת, כפתורי הדפסה/CSV (מוסתרים בהדפסה),
 * ו-hidden — הסתרת הסעיף כשמדפיסים סעיף אחר (מקבל no-print).
 */
export function Section(props: {
  title: string;
  sub?: string;
  hidden?: boolean;
  onPrint: () => void;
  csvName: string;
  csvRows: () => Cell[][];
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={'card' + (props.hidden ? ' no-print' : '')} style={{ marginTop: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <div>
          <h2 style={{ fontSize: 17, marginBottom: 2 }}>{props.title}</h2>
          {props.sub && <div style={{ color: 'var(--ink-faint)', fontSize: 13 }}>{props.sub}</div>}
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {props.extra}
          <Btn sm onClick={() => downloadCsv(props.csvName, props.csvRows())} title="ייצוא לאקסל — עברית תקינה">
            ⬇ CSV
          </Btn>
          <Btn sm onClick={props.onPrint} title="הדפסת הסעיף בלבד">
            🖨 הדפסה
          </Btn>
        </div>
      </div>
      {props.children}
    </section>
  );
}
