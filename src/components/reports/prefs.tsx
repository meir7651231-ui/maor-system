/**
 * הגדרת דוחות תקופתיים — מתגי daily/weekly/monthly/quarterly (נשמרים ב-db.reports
 * דרך setDb) + "הפק עכשיו" שמוריד דוח טקסט כמו genReport במקור.
 * הערה: אין תזמון אוטומטי — ההפקה ידנית בלבד (בכוונה, ללא הבטחות-שווא).
 */

import type { ReportPrefs } from '../../types/domain';
import { allMembers, useApp } from '../../store/useApp';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Chip } from '../ui';
import { downloadText } from './csv';
import { isoToday } from './lib';

const FREQ: { key: keyof ReportPrefs; label: string }[] = [
  { key: 'daily', label: 'יומי' },
  { key: 'weekly', label: 'שבועי' },
  { key: 'monthly', label: 'חודשי' },
  { key: 'quarterly', label: 'רבעוני' },
];

export function ReportPrefsSection() {
  const db = useApp((s) => s.db);
  const setDb = useApp((s) => s.setDb);
  const toast = useApp((s) => s.toast);

  function toggle(key: keyof ReportPrefs) {
    setDb((d) => ({ reports: { ...d.reports, [key]: !d.reports[key] } }));
  }

  /** דוח טקסט מסכם — נאמן ל-genReport מהמקור (ללא שורת הנמענים הפיקטיבית). */
  function gen(label: string) {
    const allM = allMembers(db);
    const low = db.enrollments.filter((e) => e.plan === 'punch' && e.purchased - e.used <= 2);
    const abs = db.enrollments.reduce((a, e) => a + e.absences.length, 0);
    const L = [
      'דו"ח ' + label + ' — ' + (useApp.getState().config.orgName || db.orgName || 'העמותה'),
      'הופק: ' + hebDateFull(isoToday()) + ' · ' + new Date().toLocaleString('he-IL'),
      '',
      'משפחות: ' +
        db.families.length +
        ' (' +
        db.families.filter((f) => f.status === 'active').length +
        ' פעילות, ' +
        db.families.filter((f) => f.status === 'pending').length +
        ' ממתינות)',
      'תלמידים: ' + allM.length + ' · שיבוצים: ' + db.enrollments.length + ' · חוגים: ' + db.courses.length,
      'חיסורים מתועדים: ' + abs,
      '',
      'יתרות נמוכות (' + low.length + '):',
    ];
    for (const e of low) {
      const m = allM.find((x) => x.id === e.memberId);
      const c = db.courses.find((x) => x.id === e.courseId);
      L.push(
        '  • ' +
          (m?.first ?? '') +
          ' ' +
          (m?.famName ?? '') +
          ' — ' +
          (c?.name ?? '') +
          ': ' +
          (e.purchased - e.used) +
          '/' +
          e.purchased,
      );
    }
    downloadText('maor-report-' + label + '.txt', L);
    toast('הדו"ח ה' + label + ' הופק וירד למחשב');
  }

  return (
    <section className="card no-print" style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 17, marginBottom: 2 }}>⚙ דוחות תקופתיים</h2>
      <div style={{ color: 'var(--ink-faint)', fontSize: 13, marginBottom: 12 }}>
        סימון הדוחות הפעילים נשמר אוטומטית · ההפקה ידנית — קובץ טקסט יורד למחשב
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FREQ.map((f) => (
          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Chip on={db.reports[f.key]} onClick={() => toggle(f.key)}>
              דו"ח {f.label}
            </Chip>
            <Btn sm onClick={() => gen(f.label)}>הפק עכשיו ⬇</Btn>
          </div>
        ))}
      </div>
    </section>
  );
}
