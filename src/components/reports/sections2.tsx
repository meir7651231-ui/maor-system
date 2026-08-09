/** סעיפי דוח: תרומות, מבט-על משפחות וכרטיסיות ניקוב. */

import type { Db, Donation } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { Cell } from './csv';
import { ReportTable, Section, type Row } from './parts';
import {
  countBy,
  inRange,
  monthKey,
  monthLabel,
  nameIndex,
  round2,
  STATUS_LABEL,
  type DateRange,
} from './lib';
import { stageLabel } from '../../lib/ayin';

interface SectionProps {
  db: Db;
  hidden: boolean;
  onPrint: () => void;
}

interface Sums {
  n: number;
  ils: number;
  usd: number;
}

function addTo(map: Map<string, Sums>, key: string, d: Donation): void {
  const s = map.get(key) ?? { n: 0, ils: 0, usd: 0 };
  s.n++;
  const amt = Number.isFinite(d.amount) ? d.amount : 0; // הגנת-NaN (גיבוי מושחת)
  if (d.cur === '$') s.usd += amt;
  else s.ils += amt;
  map.set(key, s);
}

/** בקשת-בעלים 9.8: פילוח שמות-לטיפול + כמות בדוחות (feature reports.ayin). */
export function AyinNamesSection(props: SectionProps) {
  const { db } = props;
  const config = useApp((s) => s.config);
  const itemT = termOf(config, 'entity.ayinItem', 'שם לטיפול');
  const unitT = termOf(config, 'entity.ayinUnit', 'כמות');
  const rowsData: { name: string; eyes: number | ''; done: boolean; sup: string; stage: string }[] = [];
  for (const sp of db.supporters) {
    for (const n of sp.ayin?.names ?? []) {
      rowsData.push({ name: n.name, eyes: n.eyes, done: n.done, sup: sp.name, stage: stageLabel(config, sp.ayin!.stage) });
    }
  }
  const totalEyes = rowsData.reduce((a, r) => a + (r.eyes === '' ? 0 : +r.eyes), 0);
  const pending = rowsData.filter((r) => r.eyes === '').length;
  const head = [itemT, unitT, 'בוצע', termOf(config, 'entity.supporter', 'תומכ/ת'), 'שלב'];
  const rows: Row[] = rowsData.map((r) => ({
    cells: [r.name, r.eyes === '' ? 'ממתין לרישום' : r.eyes, r.done ? '✓' : '—', r.sup, r.stage],
  }));
  const foot: Cell[] = ['סה"כ ' + rowsData.length, totalEyes + (pending ? ' (+' + pending + ' ממתינים)' : ''), '', '', ''];
  return (
    <Section
      title={'👁 ' + itemT + ' + ' + unitT}
      sub={rowsData.length + ' שמות · ' + unitT + ' רשומה: ' + totalEyes + (pending ? ' · ' + pending + ' ממתינים לרישום' : '')}
      hidden={props.hidden}
      onPrint={props.onPrint}
      csvName="maor-ayin-names.csv"
      csvRows={() => [head, ...rows.map((r) => r.cells), foot]}
    >
      {rowsData.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--ink-faint)' }}>{'עדיין אין ' + itemT + ' — נפתחים מכרטיסי-התומכים או מייבוא קובץ-הסליקה.'}</p>
      ) : (
        <ReportTable head={head} rows={rows} foot={foot} />
      )}
    </Section>
  );
}

/** 3. סיכום תרומות — לפי חודש ולפי קטגוריה, בטווח התאריכים. */
export function DonationsSection(props: SectionProps & { range: DateRange; rangeText: string }) {
  const { db, range } = props;
  const config = useApp((s) => s.config);

  const byMonth = new Map<string, Sums>();
  const byCat = new Map<string, Sums>();
  let total: Sums = { n: 0, ils: 0, usd: 0 };
  let histN = 0;
  for (const sp of db.supporters) {
    for (const d of sp.donations) {
      if (!inRange(d.date, range)) continue;
      addTo(byMonth, monthKey(d.date), d);
      addTo(byCat, d.cat || 'כללי', d);
      total = {
        n: total.n + 1,
        ils: total.ils + (d.cur === '$' ? 0 : d.amount),
        usd: total.usd + (d.cur === '$' ? d.amount : 0),
      };
    }
    // הכרעת 9.8 "לכולל": גם עסקאות הקובץ ההיסטורי (ללא קבלה) נספרות בטווח.
    // קטגוריה: של התורם (בקובץ-הסליקה זו הקטגוריה האמיתית), אחרת תווית-מקור.
    for (const h of sp.hist ?? []) {
      if (!inRange(h.d, range)) continue;
      const hd = { date: h.d, amount: h.a, cur: h.c ?? ('₪' as const), cat: sp.cat || 'מהקובץ ההיסטורי' } as Donation;
      addTo(byMonth, monthKey(h.d), hd);
      addTo(byCat, hd.cat, hd);
      total = {
        n: total.n + 1,
        ils: total.ils + (hd.cur === '$' ? 0 : hd.amount),
        usd: total.usd + (hd.cur === '$' ? hd.amount : 0),
      };
      histN++;
    }
  }

  const monthHead = ['חודש', termOf(config, 'entity.donations', 'תרומות'), 'סה"כ ₪', 'סה"כ $'];
  const monthRows: Row[] = [...byMonth.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([k, s]) => ({ cells: [monthLabel(k), s.n, round2(s.ils), round2(s.usd)] }));
  const monthFoot: Cell[] = ['סה"כ', total.n, round2(total.ils), round2(total.usd)];

  const catHead = ['קטגוריה', termOf(config, 'entity.donations', 'תרומות'), 'סה"כ ₪', 'סה"כ $'];
  const catRows: Row[] = [...byCat.entries()]
    .sort((a, b) => b[1].ils + b[1].usd - (a[1].ils + a[1].usd))
    .map(([k, s]) => ({ cells: [k, s.n, round2(s.ils), round2(s.usd)] }));

  return (
    <Section
      title={'💛 סיכום ' + termOf(config, 'entity.donations', 'תרומות')}
      sub={'טווח: ' + props.rangeText + ' · ' + total.n + ' ' + termOf(config, 'entity.donations', 'תרומות') + (histN ? ' (מהן ' + histN + ' מהקובץ ההיסטורי, ללא קבלה)' : '')}
      hidden={props.hidden}
      onPrint={props.onPrint}
      csvName="maor-donations-summary.csv"
      csvRows={() => [
        ['לפי חודש'],
        monthHead,
        ...monthRows.map((r) => r.cells),
        monthFoot,
        [''],
        ['לפי קטגוריה'],
        catHead,
        ...catRows.map((r) => r.cells),
      ]}
    >
      <h3 style={{ fontSize: 14.5, margin: '6px 0' }}>לפי חודש</h3>
      <ReportTable head={monthHead} rows={monthRows} foot={monthFoot} />
      {featureOn(config, 'reports.donations.bycat') && (
        <>
          <h3 style={{ fontSize: 14.5, margin: '14px 0 6px' }}>לפי קטגוריה</h3>
          <ReportTable head={catHead} rows={catRows} />
        </>
      )}
    </Section>
  );
}

/** 4. מבט-על משפחות — ספירות לפי סטטוס, עיר וקהילה. */
export function FamiliesSection(props: SectionProps) {
  const { db } = props;
  const config = useApp((s) => s.config);

  const statusRows: Row[] = (['active', 'pending', 'inactive'] as const).map((st) => ({
    cells: [STATUS_LABEL[st], db.families.filter((f) => f.status === st).length],
  }));
  const cityRows: Row[] = countBy(db.families, (f) => f.city || 'ללא עיר').map(([k, n]) => ({
    cells: [k, n],
  }));
  const communityRows: Row[] = countBy(db.families, (f) => f.community || 'כללי').map(([k, n]) => ({
    cells: [k, n],
  }));

  const children = db.families.reduce(
    (a, f) => a + f.members.filter((m) => !m.isParent).length,
    0,
  );

  return (
    <Section
      title={'👨‍👩‍👧‍👦 מבט-על ' + termOf(config, 'nav.families', 'משפחות')}
      sub={db.families.length + ' ' + termOf(config, 'nav.families', 'משפחות') + ' · ' + children + ' ילדים'}
      hidden={props.hidden}
      onPrint={props.onPrint}
      csvName="maor-families-overview.csv"
      csvRows={() => [
        ['קבוצה', 'ערך', termOf(config, 'nav.families', 'משפחות')],
        ...statusRows.map((r) => ['סטטוס', ...r.cells]),
        ...cityRows.map((r) => ['עיר', ...r.cells]),
        ...communityRows.map((r) => ['קהילה', ...r.cells]),
      ]}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <ReportTable head={['סטטוס', termOf(config, 'nav.families', 'משפחות')]} rows={statusRows} />
        {featureOn(config, 'reports.families.geo') && <ReportTable head={['עיר', termOf(config, 'nav.families', 'משפחות')]} rows={cityRows} />}
        {featureOn(config, 'reports.families.geo') && <ReportTable head={['קהילה', termOf(config, 'nav.families', 'משפחות')]} rows={communityRows} />}
      </div>
    </Section>
  );
}

/** 5. מצב כרטיסיות ניקוב — יתרה נמוכה (≤2) מודגשת באדום, כמו במקור. */
export function PunchSection(props: SectionProps) {
  const { db } = props;
  const selectFamily = useApp((s) => s.selectFamily);
  const config = useApp((s) => s.config);
  const idx = nameIndex(db);

  const head = [
    termOf(config, 'entity.student', 'תלמיד/ה'),
    termOf(config, 'entity.family', 'משפחה'),
    termOf(config, 'entity.course', 'חוג'),
    'נרכשו',
    'נוצלו',
    'יתרה',
    'מצב',
  ];
  // שיבוץ שהסתיים (תלמיד/ה שעזב/ה) אינו זקוק לחידוש — לא מציגים בדו"ח מצב הכרטיסיות
  const punch = db.enrollments.filter((e) => e.plan === 'punch' && e.status !== 'ended');
  const rows: Row[] = punch
    .map((e) => {
      const m = idx.get(e.memberId);
      const c = db.courses.find((x) => x.id === e.courseId);
      const left = e.purchased - e.used;
      return {
        left,
        row: {
          cells: [
            m?.first ?? '—',
            m?.famName ?? '',
            c?.name ?? '',
            e.purchased,
            e.used,
            left + '/' + e.purchased,
            left <= 0 ? 'נוצלה במלואה' : left <= 2 ? 'יתרה נמוכה' : 'פעילה',
          ],
          warn: left <= 2,
          open: m ? () => selectFamily(m.famId) : undefined,
        } as Row,
      };
    })
    .sort((a, b) => a.left - b.left)
    .map((x) => x.row);
  const lowCount = punch.filter((e) => e.purchased - e.used <= 2).length;

  return (
    <Section
      title="🎟 מצב כרטיסיות ניקוב"
      sub={punch.length + ' כרטיסיות · ' + lowCount + ' ביתרה נמוכה (2 ניקובים או פחות)'}
      hidden={props.hidden}
      onPrint={props.onPrint}
      csvName="maor-punch-cards.csv"
      csvRows={() => [head, ...rows.map((r) => r.cells)]}
    >
      <ReportTable head={head} rows={rows} />
    </Section>
  );
}
