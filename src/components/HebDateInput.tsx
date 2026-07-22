/**
 * קלט תאריך דו-לוחי — עברי (ברירת מחדל) / לועזי, בהחלפת צ'יפים.
 * הערך כלפי חוץ הוא תמיד ISO לועזי (YYYY-MM-DD); העברי הוא שכבת קלט ותצוגה בלבד.
 * מצב עברי: שלושה select-ים (יום בגימטריה · חודש מודע-עיבור · שנה בגימטריה);
 * צירוף שלא קיים בשנה הנבחרת מציג רמז אדום ולא יורה onChange.
 * מתחת לשני המצבים: שורת הד חיה של הלוח השני ('כ״ג אב תשפ״ו · 06/08/2026').
 */
import { useEffect, useState, type JSX } from 'react';
import { gem, gemYear, hebDateFull } from '../lib/hebrew';
import { hebMonthsOf, hebToIso, hebYearNow, isoToHebParts } from '../lib/hebdate';
import { Chip, Select } from './ui';

function fmtGreg(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function HebDateInput(props: { value: string; onChange: (iso: string) => void }): JSX.Element {
  const [mode, setMode] = useState<'heb' | 'greg'>('heb');
  const [init] = useState(() => (props.value ? isoToHebParts(props.value) : null));
  const [d, setD] = useState(init ? String(init.day) : '');
  const [m, setM] = useState(init ? init.monthHe : '');
  const [y, setY] = useState(init ? String(init.year) : '');
  const [invalid, setInvalid] = useState(false);

  // סנכרון מהערך החיצוני — אתחול, בחירה במצב לועזי, או שינוי מבחוץ.
  useEffect(() => {
    if (!props.value) return;
    const p = isoToHebParts(props.value);
    if (!p) return;
    setD(String(p.day));
    setM(p.monthHe);
    setY(String(p.year));
    setInvalid(false);
  }, [props.value]);

  const nowY = hebYearNow();
  const months = hebMonthsOf(+y || nowY);
  const monthVal = months.includes(m) ? m : '';

  /** עדכון בחירה: כשכל שלושת החלקים מלאים — ממירים; צירוף לא קיים ⇒ רמז בלבד. */
  function apply(nd: string, nm: string, ny: string) {
    setD(nd);
    setM(nm);
    setY(ny);
    if (nd && nm && ny) {
      const iso = hebToIso(+nd, nm, +ny);
      if (iso) {
        setInvalid(false);
        props.onChange(iso);
      } else {
        setInvalid(true);
      }
    } else {
      setInvalid(false);
    }
  }

  const dayOpts = [
    { value: '', label: 'יום' },
    ...Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: gem(i + 1) })),
  ];
  const monthOpts = [{ value: '', label: 'חודש' }, ...months.map((mm) => ({ value: mm, label: mm }))];
  const yearOpts = [
    { value: '', label: 'שנה' },
    ...Array.from({ length: 104 }, (_, i) => {
      const yy = nowY + 3 - i;
      return { value: String(yy), label: gemYear(yy) + ' (' + yy + ')' };
    }),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <Chip on={mode === 'heb'} onClick={() => setMode('heb')}>
          עברי
        </Chip>
        <Chip on={mode === 'greg'} onClick={() => setMode('greg')}>
          לועזי
        </Chip>
      </div>
      {mode === 'heb' ? (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: '0 0 72px' }}>
              <Select value={d} onChange={(v) => apply(v, monthVal, y)} options={dayOpts} />
            </div>
            <div style={{ flex: 1, minWidth: 86 }}>
              <Select value={monthVal} onChange={(v) => apply(d, v, y)} options={monthOpts} />
            </div>
            <div style={{ flex: 1, minWidth: 104 }}>
              <Select
                value={y}
                onChange={(v) => {
                  // בשינוי שנה ייתכן שהחודש שנבחר לא קיים (אדר ↔ אדר א׳/ב׳) — מנקים אותו
                  const ms = hebMonthsOf(+v || nowY);
                  apply(d, ms.includes(m) ? m : '', v);
                }}
                options={yearOpts}
              />
            </div>
          </div>
          {invalid && (
            <div style={{ color: 'var(--red)', fontSize: 12.5, fontWeight: 600 }}>התאריך לא קיים בשנה זו</div>
          )}
        </>
      ) : (
        <input type="date" dir="ltr" value={props.value} onChange={(e) => props.onChange(e.target.value)} />
      )}
      {props.value && !invalid && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 600 }}>
          {hebDateFull(props.value)} · {fmtGreg(props.value)}
        </div>
      )}
    </div>
  );
}
