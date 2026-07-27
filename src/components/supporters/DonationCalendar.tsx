/**
 * לוח-חודש של תרומות התורם/ת — heatmap חזותי: כל יום עם תרומה מציג סכום ומספר
 * תרומות, ויום יעד-הקשר מסומן ב-🎯. ניווט חודש קודם/הבא + הצגת התאריך העברי
 * לכל יום. קריאה-בלבד — אינו משנה נתונים.
 *
 * גייט: supporters.doncal.
 */
import { useMemo, useState } from 'react';
import type { Supporter } from '../../types/domain';
import { hebParts, gem } from '../../lib/hebrew';

const DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/** ISO של תאריך מקומי (בלי הסטת אזור-זמן). */
function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DonationCalendar({ supporter }: { supporter: Supporter }) {
  // חודש מוצג — מאותחל לחודש התרומה האחרונה, אחרת החודש הנוכחי.
  const [offset, setOffset] = useState(0);

  // מפת יום→סכום/מספר תרומות (בכל המטבעות, מסומן פר-מטבע).
  const byDay = useMemo(() => {
    const m = new Map<string, { ils: number; usd: number; n: number }>();
    for (const d of supporter.donations) {
      const cur = m.get(d.date) ?? { ils: 0, usd: 0, n: 0 };
      if (d.cur === '$') cur.usd += d.amount;
      else cur.ils += d.amount;
      cur.n += 1;
      m.set(d.date, cur);
    }
    return m;
  }, [supporter.donations]);

  // חודש הבסיס — של התרומה האחרונה (או היום).
  const baseMonth = useMemo(() => {
    const last = supporter.donations.reduce((a, d) => (d.date > a ? d.date : a), '');
    const d = last ? new Date(last + 'T12:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [supporter.donations]);

  const shown = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + offset, 1);
  const sy = shown.getFullYear();
  const sm = shown.getMonth();
  const monthLabel = MONTHS[sm] + ' ' + sy;

  // רשת 42 תאים (6 שבועות), ראשון עד שבת.
  const cells = useMemo(() => {
    const first = new Date(sy, sm, 1);
    const start = new Date(sy, sm, 1 - first.getDay());
    const out: { iso: string; day: number; inMonth: boolean; heb: string }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = localIso(d);
      let heb = '';
      try {
        heb = gem(hebParts(d).day);
      } catch {
        heb = '';
      }
      out.push({ iso, day: d.getDate(), inMonth: d.getMonth() === sm, heb });
    }
    return out;
  }, [sy, sm]);

  const money = (n: number, sym: string) => sym + Math.round(n).toLocaleString('he-IL');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button type="button" className="chip" onClick={() => setOffset((o) => o - 1)} aria-label="חודש קודם">
          ›
        </button>
        <span style={{ fontWeight: 700, fontSize: 13, minWidth: 120, textAlign: 'center' }}>{monthLabel}</span>
        <button type="button" className="chip" onClick={() => setOffset((o) => o + 1)} aria-label="חודש הבא">
          ‹
        </button>
        {offset !== 0 && (
          <button type="button" className="chip" onClick={() => setOffset(0)}>
            חזרה
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DOW.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', padding: '2px 0' }}>
            {d}
          </div>
        ))}
        {cells.map((c) => {
          const don = byDay.get(c.iso);
          const isTarget = supporter.nextDate === c.iso;
          return (
            <div
              key={c.iso}
              title={don ? c.iso + ' · ' + don.n + ' תרומות' : c.iso}
              style={{
                minHeight: 44,
                borderRadius: 8,
                border: '1px solid var(--line)',
                padding: '3px 4px',
                fontSize: 10.5,
                background: don ? 'var(--accent)' : isTarget ? '#fdeaea' : 'var(--panel)',
                color: don ? 'var(--dark)' : 'var(--ink)',
                opacity: c.inMonth ? 1 : 0.4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', direction: 'ltr' }}>
                <span style={{ fontWeight: 700 }}>{c.day}</span>
                <span style={{ color: 'var(--ink-faint)' }}>{c.heb}</span>
              </div>
              {don ? (
                <div style={{ fontWeight: 800, direction: 'ltr', lineHeight: 1.1 }}>
                  {don.ils > 0 && <div>{money(don.ils, '₪')}</div>}
                  {don.usd > 0 && <div>{money(don.usd, '$')}</div>}
                </div>
              ) : isTarget ? (
                <div style={{ textAlign: 'center' }}>🎯</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
