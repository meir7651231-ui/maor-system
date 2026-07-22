/**
 * מסך דוחות וייצוא — חמישה סעיפים: רישום לחוגים, נוכחות/חיסורים,
 * תרומות, מבט-על משפחות וכרטיסיות ניקוב, ובנוסף הגדרת דוחות תקופתיים.
 * כל סעיף ניתן להדפסה (window.print — הסעיפים האחרים מקבלים no-print)
 * ולייצוא CSV עם BOM לעברית תקינה באקסל.
 */

import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, moduleOn } from '../../lib/config';
import { Btn, Field, FormError, PageHead, TextInput } from '../ui';
import { fmtDate, isoToday, rangeLabel, type DateRange } from './lib';
import { AttendanceSection, EnrollmentSection } from './sections1';
import { DonationsSection, FamiliesSection, PunchSection } from './sections2';
import { ReportPrefsSection } from './prefs';

type SectionId = 'enroll' | 'attend' | 'donations' | 'families' | 'punch';

/** קיצורי טווח נפוצים. */
function presets(): { label: string; range: DateRange }[] {
  const today = isoToday();
  const back30 = new Date();
  back30.setDate(back30.getDate() - 30);
  return [
    { label: 'החודש', range: { from: today.slice(0, 8) + '01', to: today } },
    { label: '30 ימים אחרונים', range: { from: back30.toISOString().slice(0, 10), to: today } },
    { label: 'השנה', range: { from: today.slice(0, 4) + '-01-01', to: today } },
    { label: 'הכול', range: { from: '', to: '' } },
  ];
}

export function ReportsView() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  // סעיפי הדוחות נגזרים מדגלי המודולים: רישום/נוכחות/כרטיסיות ← חוגים · תרומות ← תומכות
  const coursesOn = moduleOn(config, 'courses');
  const supportersOn = moduleOn(config, 'supporters');
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const [printing, setPrinting] = useState<SectionId | 'all' | null>(null);

  // הדפסה: אחרי שה-render מסתיר את שאר הסעיפים — פותחים את דו-שיח ההדפסה
  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 60);
    return () => clearTimeout(t);
  }, [printing]);

  const hide = (id: SectionId) => printing !== null && printing !== 'all' && printing !== id;
  const rangeText = rangeLabel(range);
  const rangeError =
    range.from && range.to && range.from > range.to
      ? 'טווח תאריכים שגוי — תאריך ההתחלה מאוחר מתאריך הסיום'
      : '';

  return (
    <div>
      <PageHead
        title="דוחות"
        sub={'סיכומי רישום, נוכחות, תרומות ומשפחות · הופק: ' + fmtDate(isoToday())}
        actions={
          <span className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {featureOn(config, 'home.impactwall') && (
              <Btn
                onClick={() => {
                  window.location.hash = '#wall';
                }}
                title="קיר ההשפעה — תצוגה חיה למסך גדול"
              >
                🖥️ מצב ראווה
              </Btn>
            )}
            <Btn kind="primary" onClick={() => setPrinting('all')}>
              🖨 הדפסת כל הדוחות
            </Btn>
          </span>
        }
      />

      <div className="card no-print" style={{ marginTop: 4 }}>
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>
          🗓 טווח תאריכים — לדוחות תשלומים ותרומות ({rangeText})
        </h2>
        <FormError error={rangeError} />
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 170 }}>
            <Field label="מתאריך">
              <TextInput type="date" dir="ltr" value={range.from} onChange={(v) => setRange({ ...range, from: v })} />
            </Field>
          </div>
          <div style={{ minWidth: 170 }}>
            <Field label="עד תאריך">
              <TextInput type="date" dir="ltr" value={range.to} onChange={(v) => setRange({ ...range, to: v })} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 12 }}>
            {presets().map((p) => (
              <Btn key={p.label} sm onClick={() => setRange(p.range)}>
                {p.label}
              </Btn>
            ))}
          </div>
        </div>
      </div>

      {coursesOn && (
        <EnrollmentSection
          db={db}
          range={range}
          rangeText={rangeText}
          hidden={hide('enroll')}
          onPrint={() => setPrinting('enroll')}
        />
      )}
      {coursesOn && (
        <AttendanceSection db={db} hidden={hide('attend')} onPrint={() => setPrinting('attend')} />
      )}
      {supportersOn && (
        <DonationsSection
          db={db}
          range={range}
          rangeText={rangeText}
          hidden={hide('donations')}
          onPrint={() => setPrinting('donations')}
        />
      )}
      <FamiliesSection db={db} hidden={hide('families')} onPrint={() => setPrinting('families')} />
      {coursesOn && <PunchSection db={db} hidden={hide('punch')} onPrint={() => setPrinting('punch')} />}

      <ReportPrefsSection />
    </div>
  );
}
