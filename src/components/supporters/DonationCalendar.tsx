/**
 * לוח התרומות (feature supporters.doncal) — גריד חודשי משותף לשני מצבים:
 * - הלוח האישי בכרטיס התומכת (DonationCalendar) — תרומות + 🎯 יעד + אירועי מעקב.
 * - הלוח הכלל-ארגוני במסך התומכים (OrgDonationCalendar) — כל התומכות (P1.4,
 *   legacy supCalAll), עם ניווט לכרטיס התומכת מתוך רשימת-היום.
 * שניהם עם מצב עברי (חודש עברי מלא א׳–ל׳) ורשימת-יום בלחיצה — legacy supCalData
 * (legacy-main-script.js:1496-1537). קריאה-בלבד — אינו משנה נתונים.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Supporter } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { hebParts, gem, gemYear, hebDateFull } from '../../lib/hebrew';
import { useApp } from '../../store/useApp';
import { Btn } from '../ui';
import { personalCalEntries, orgCalEntries, donCalMonthLine, type SupCalEntry } from './lib';

const DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const fmtMonthYear = new Intl.DateTimeFormat('he', { month: 'long', year: 'numeric' });
const fmtHebMonth = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
const fmtHebYear = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });

/** ISO של תאריך מקומי (בלי הסטת אזור-זמן). */
function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface GridCell {
  iso: string;
  day: number;
  heb: string;
  inMonth: boolean;
  entries: SupCalEntry[];
}

/**
 * הגריד המשותף — לועזי (42 תאים) או עברי מלא (א׳–ל׳ סביב עוגן, כמו legacy
 * supCalData: הליכה אחורה עד יום א׳ בחודש העברי).
 */
function DonCalGrid(props: {
  entries: SupCalEntry[];
  /** ברירת החודש הראשוני — תאריך העוגן (ISO). */
  anchorIso: string;
  /** ניווט לתומכת מרשימת-היום (לוח כלל-ארגוני). */
  onGo?: (spId: string) => void;
  /** סימון יום מבחוץ (P3 פריט 11) — לחיצה על תרומה בהיסטוריה מקפיצה לחודשה. */
  focusIso?: string;
  /** קונפיג הארגון — לתרגום מונח "תרומות" בשורת-הסיכום (termOf). */
  config?: OrgConfig;
}) {
  const [heb, setHeb] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dayIso, setDayIso] = useState<string | null>(null);

  // מיקוד חיצוני: קפיצה לחודש של היום המבוקש (בגריד הלועזי) + פתיחת רשימת-היום
  useEffect(() => {
    if (!props.focusIso) return;
    const f = new Date(props.focusIso + 'T12:00:00');
    const a = new Date(props.anchorIso + 'T12:00:00');
    setHeb(false);
    setOffset((f.getFullYear() - a.getFullYear()) * 12 + (f.getMonth() - a.getMonth()));
    setDayIso(props.focusIso);
  }, [props.focusIso, props.anchorIso]);

  const byDay = useMemo(() => {
    const m = new Map<string, SupCalEntry[]>();
    for (const e of props.entries) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [props.entries]);

  const anchor = useMemo(() => new Date(props.anchorIso + 'T12:00:00'), [props.anchorIso]);

  const view = useMemo(() => {
    const todayIso = localIso(new Date());
    if (!heb) {
      const base = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
      const sy = base.getFullYear();
      const sm = base.getMonth();
      const start = new Date(sy, sm, 1 - base.getDay());
      const cells: GridCell[] = [];
      for (let i = 0; i < 42; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        cells.push({
          iso: localIso(d),
          day: d.getDate(),
          heb: safeGem(d),
          inMonth: d.getMonth() === sm,
          entries: byDay.get(localIso(d)) ?? [],
        });
      }
      const last = new Date(sy, sm + 1, 0);
      const m1 = fmtHebMonth.format(base);
      const m2 = fmtHebMonth.format(last);
      return {
        cells,
        label: fmtMonthYear.format(base),
        subLabel: (m1 === m2 ? m1 : m1 + '–' + m2) + ' ' + gemYear(fmtHebYear.format(last)),
        todayIso,
      };
    }
    // מצב עברי — עוגן זז ~29/30 יום פר-חודש; הליכה אחורה עד א׳ בחודש (legacy:1504)
    const ref = new Date(anchor);
    ref.setDate(ref.getDate() + Math.round(offset * 29.5));
    const first = new Date(ref);
    for (let k = 0; k < 32 && hebParts(first).day !== 1; k++) first.setDate(first.getDate() - 1);
    const hp0 = hebParts(first);
    const y0 = fmtHebYear.format(first);
    const d30 = new Date(first);
    d30.setDate(d30.getDate() + 29);
    const dim = hebParts(d30).month === hp0.month && fmtHebYear.format(d30) === y0 ? 30 : 29;
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());
    const count = Math.ceil((first.getDay() + dim) / 7) * 7;
    const lastH = new Date(first);
    lastH.setDate(lastH.getDate() + dim - 1);
    const inMonth = (d: Date) => {
      const hp = hebParts(d);
      return hp.month === hp0.month && fmtHebYear.format(d) === y0;
    };
    const cells: GridCell[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      cells.push({
        iso: localIso(d),
        day: d.getDate(),
        heb: safeGem(d),
        inMonth: inMonth(d),
        entries: byDay.get(localIso(d)) ?? [],
      });
    }
    return {
      cells,
      label: fmtHebMonth.format(first) + ' ' + gemYear(y0),
      subLabel: fmtMonthYear.format(first) + ' – ' + fmtMonthYear.format(lastH),
      todayIso,
    };
  }, [heb, offset, anchor, byDay]);

  const inShownMonth = (iso: string) => view.cells.some((c) => c.iso === iso && c.inMonth);
  const monthLine = donCalMonthLine(props.entries, inShownMonth, props.config);
  const dayList = dayIso ? byDay.get(dayIso) ?? [] : [];

  const money = (n: number, sym: string) => sym + Math.round(n).toLocaleString('he-IL');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <button type="button" className="chip" onClick={() => { setOffset((o) => o - 1); setDayIso(null); }} aria-label="חודש קודם">
          ›
        </button>
        <span style={{ fontWeight: 700, fontSize: 13, minWidth: 120, textAlign: 'center' }}>
          {view.label}
          <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--ink-faint)' }}>{view.subLabel}</span>
        </span>
        <button type="button" className="chip" onClick={() => { setOffset((o) => o + 1); setDayIso(null); }} aria-label="חודש הבא">
          ‹
        </button>
        {offset !== 0 && (
          <button type="button" className="chip" onClick={() => { setOffset(0); setDayIso(null); }}>
            חזרה
          </button>
        )}
        <button
          type="button"
          className="chip"
          onClick={() => { setHeb((v) => !v); setOffset(0); setDayIso(null); }}
          title="מעבר בין חודש עברי מלא לחודש לועזי"
          style={heb ? { background: 'var(--dark)', color: 'var(--amber)' } : undefined}
        >
          {heb ? 'לוח עברי ✓' : 'לוח עברי'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>{monthLine}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DOW.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', padding: '2px 0' }}>
            {d}
          </div>
        ))}
        {view.cells.map((c) => {
          const dons = c.entries.filter((e) => e.amount);
          const marks = c.entries.filter((e) => !e.amount);
          const ils = dons.filter((e) => e.cur !== '$').reduce((t, e) => t + e.amount, 0);
          const usd = dons.filter((e) => e.cur === '$').reduce((t, e) => t + e.amount, 0);
          const has = c.entries.length > 0;
          return (
            <button
              key={c.iso}
              type="button"
              onClick={() => has && setDayIso((v) => (v === c.iso ? null : c.iso))}
              title={has ? c.iso + ' · ' + c.entries.length + ' רשומות' : c.iso}
              style={{
                minHeight: 44,
                borderRadius: 8,
                border: dayIso === c.iso ? '2px solid #b45309' : '1px solid var(--line)',
                padding: '3px 4px',
                fontSize: 10.5,
                textAlign: 'right',
                background:
                  c.iso === view.todayIso
                    ? 'rgba(243,199,107,.3)'
                    : dons.length
                      ? 'var(--accent)'
                      : marks.length
                        ? '#fdeaea'
                        : 'var(--panel)',
                color: dons.length ? 'var(--dark)' : 'var(--ink)',
                opacity: c.inMonth ? 1 : 0.45,
                cursor: has ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', direction: 'ltr', width: '100%' }}>
                <span style={{ fontWeight: 700 }}>{c.day}</span>
                <span style={{ color: 'var(--ink-faint)' }}>{c.heb}</span>
              </div>
              {dons.length > 0 ? (
                <div style={{ fontWeight: 800, direction: 'ltr', lineHeight: 1.1 }}>
                  {ils > 0 && <div>{money(ils, '₪')}</div>}
                  {usd > 0 && <div>{money(usd, '$')}</div>}
                </div>
              ) : marks.length > 0 ? (
                <div style={{ textAlign: 'center' }}>{marks[0].src.slice(0, 2)}</div>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* רשימת-היום (legacy dayList) — כל הרשומות של היום הנבחר, עם ניווט לתומכת */}
      {dayIso && dayList.length > 0 && (
        <div style={{ marginTop: 8, border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}>
            {hebDateFull(dayIso)} · {dayIso.split('-').reverse().join('/')}
          </div>
          {dayList.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12.5 }}>
              <span style={{ flex: 1 }}>
                {(e.name ? e.name + ' · ' : '') + (e.amount ? (e.cur === '$' ? '$' : '₪') + e.amount : '') + (e.src ? (e.amount || e.name ? ' · ' : '') + e.src : '')}
              </span>
              {props.onGo && e.spId && (
                <Btn sm onClick={() => props.onGo!(e.spId!)}>
                  ← לכרטיס
                </Btn>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function safeGem(d: Date): string {
  try {
    return gem(hebParts(d).day);
  } catch {
    return '';
  }
}

/** הלוח האישי בכרטיס התומכת — תרומות + 🎯 יעד + אירועי מעקב (legacy supCalMine). */
export function DonationCalendar({ supporter, focusIso }: { supporter: Supporter; focusIso?: string }) {
  const entries = useMemo(() => personalCalEntries(supporter), [supporter]);
  const config = useApp((s) => s.config);
  // עוגן — התרומה האחרונה (או היום), כמו קודם
  const last = supporter.donations.reduce((a, d) => (d.date > a ? d.date : a), '');
  return <DonCalGrid entries={entries} anchorIso={last || localIso(new Date())} focusIso={focusIso} config={config} />;
}

/** הלוח הכלל-ארגוני — כל התומכות (P1.4, legacy supCalAll); ניווט לכרטיס מהרשימה. */
export function OrgDonationCalendar(props: { onOpen: (spId: string) => void }) {
  const supporters = useApp((s) => s.db.supporters);
  const config = useApp((s) => s.config);
  const entries = useMemo(() => orgCalEntries(supporters), [supporters]);
  return <DonCalGrid entries={entries} anchorIso={localIso(new Date())} onGo={props.onOpen} config={config} />;
}
