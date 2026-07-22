/** סעיפי דוח: תרומות, מבט-על משפחות וכרטיסיות ניקוב. */

import type { Db, Donation } from '../../types/domain';
import { useApp } from '../../store/useApp';
import type { Cell } from './csv';
import { ReportTable, Section, type Row } from './parts';
import {
  countBy,
  inRange,
  monthKey,
  monthLabel,
  nameIndex,
  STATUS_LABEL,
  type DateRange,
} from './lib';

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
  if (d.cur === '$') s.usd += d.amount;
  else s.ils += d.amount;
  map.set(key, s);
}

/** 3. סיכום תרומות — לפי חודש ולפי קטגוריה, בטווח התאריכים. */
export function DonationsSection(props: SectionProps & { range: DateRange; rangeText: string }) {
  const { db, range } = props;

  const byMonth = new Map<string, Sums>();
  const byCat = new Map<string, Sums>();
  let total: Sums = { n: 0, ils: 0, usd: 0 };
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
  }

  const monthHead = ['חודש', 'תרומות', 'סה"כ ₪', 'סה"כ $'];
  const monthRows: Row[] = [...byMonth.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([k, s]) => ({ cells: [monthLabel(k), s.n, s.ils, s.usd] }));
  const monthFoot: Cell[] = ['סה"כ', total.n, total.ils, total.usd];

  const catHead = ['קטגוריה', 'תרומות', 'סה"כ ₪', 'סה"כ $'];
  const catRows: Row[] = [...byCat.entries()]
    .sort((a, b) => b[1].ils + b[1].usd - (a[1].ils + a[1].usd))
    .map(([k, s]) => ({ cells: [k, s.n, s.ils, s.usd] }));

  return (
    <Section
      title="💛 סיכום תרומות"
      sub={'טווח: ' + props.rangeText + ' · ' + total.n + ' תרומות'}
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
      <h3 style={{ fontSize: 14.5, margin: '14px 0 6px' }}>לפי קטגוריה</h3>
      <ReportTable head={catHead} rows={catRows} />
    </Section>
  );
}

/** 4. מבט-על משפחות — ספירות לפי סטטוס, עיר וקהילה. */
export function FamiliesSection(props: SectionProps) {
  const { db } = props;

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
      title="👨‍👩‍👧‍👦 מבט-על משפחות"
      sub={db.families.length + ' משפחות · ' + children + ' ילדים'}
      hidden={props.hidden}
      onPrint={props.onPrint}
      csvName="maor-families-overview.csv"
      csvRows={() => [
        ['קבוצה', 'ערך', 'משפחות'],
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
        <ReportTable head={['סטטוס', 'משפחות']} rows={statusRows} />
        <ReportTable head={['עיר', 'משפחות']} rows={cityRows} />
        <ReportTable head={['קהילה', 'משפחות']} rows={communityRows} />
      </div>
    </Section>
  );
}

/** 5. מצב כרטיסיות ניקוב — יתרה נמוכה (≤2) מודגשת באדום, כמו במקור. */
export function PunchSection(props: SectionProps) {
  const { db } = props;
  const selectFamily = useApp((s) => s.selectFamily);
  const idx = nameIndex(db);

  const head = ['תלמיד/ה', 'משפחה', 'חוג', 'נרכשו', 'נוצלו', 'יתרה', 'מצב'];
  const punch = db.enrollments.filter((e) => e.plan === 'punch');
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
