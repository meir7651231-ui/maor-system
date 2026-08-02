/**
 * מבט הנהלה (SHOP10 · מדדי הנהלה) — סיכום תפעולי חוצה-מודולים: חלוקה, חנות,
 * קופות צדקה ומשפחות. קריאה בלבד (אגרגציה טהורה), מגודר reports.management.
 * אפס נגיעה בנתונים — תצוגה/ייצוא בלבד.
 */
import type { Db } from '../../types/domain';
import type { Cell } from './csv';
import { ReportTable, Section } from './parts';
import { expiringIntakes, givenValue, collectedPaid, subsidyTotal } from '../shop/lib';
import { isoToday } from '../../lib/date-util';

export interface MetricGroup {
  title: string;
  rows: [string, number | string][];
}

/** אגרגציה טהורה — נבדקת ביחידה. */
export function managementMetrics(db: Db): MetricGroup[] {
  const deliveries = db.deliveries;
  const delivered = deliveries.filter((d) => d.status === 'delivered').length;
  const famReached = new Set(deliveries.map((d) => d.familyId)).size;
  const activeVols = db.volunteers.filter((v) => v.active).length;

  const activeAssign = db.shopAssignments.filter((a) => a.status === 'active').length;
  const redemptions = db.shopAssignments.reduce(
    (a, x) => a + x.redemptions.filter((r) => !r.voidedAt).length,
    0,
  );

  const collections = db.tzBoxes.reduce((a, b) => a + b.collections.length, 0);
  const tzTotal = db.tzBoxes.reduce(
    (a, b) => a + b.collections.reduce((s, c) => s + (c.amount || 0), 0),
    0,
  );

  const activeFams = db.families.filter((f) => f.status === 'active').length;

  // אימוצים (SHOP9 "אמץ חתן") — תרומות מיועדות; קבוצה פר-ייעוד עם סה"כ.
  const sponsor = new Map<string, { n: number; ils: number }>();
  for (const s of db.supporters) {
    for (const d of s.donations) {
      if (!d.designation) continue;
      const g = sponsor.get(d.designation) ?? { n: 0, ils: 0 };
      g.n++;
      if (d.cur !== '$') g.ils += d.amount;
      sponsor.set(d.designation, g);
    }
  }

  const groups: MetricGroup[] = [
    { title: '🚚 חלוקה', rows: [['ימי חלוקה', db.distributionDays.length], ['מסירות סה"כ', deliveries.length], ['נמסרו', delivered], ['משפחות שקיבלו', famReached], ['מתנדבים פעילים', activeVols]] },
    { title: '🛍 חנות', rows: [['שיוכים פעילים', activeAssign], ['מימושים', redemptions], ['אצוות פג/עומד-לפוג', expiringIntakes(db, isoToday()).length]] },
    { title: '🪙 קופות צדקה', rows: [['קופות', db.tzBoxes.length], ['ריקונים', collections], ['סה"כ נאסף (₪)', tzTotal]] },
    { title: '👨‍👩‍👧 משפחות', rows: [['משפחות פעילות', activeFams], ['סה"כ משפחות', db.families.length]] },
  ];

  const sponsorTotal = [...sponsor.values()].reduce((a, g) => a + g.ils, 0);
  if (sponsor.size > 0) {
    const rows: [string, number | string][] = [...sponsor.entries()].map(([name, g]) => [name, `${g.n} תרומות · ₪${g.ils.toLocaleString('he-IL')}`]);
    rows.push(['סה"כ אימוצים (₪)', sponsorTotal]);
    groups.push({ title: '🤝 אימוצים (אמץ חתן)', rows });
  }

  // 💰 התחשבנות (SHOP9 back-office) — תמונת-הכסף של הסיוע, אגרגציה טהורה:
  // שווי שחולק · נגבה מהמוטבים · סבסוד-נטו (מה שהעמותה ספגה) · עלות-מלאי · מימון-אימוצים.
  const given = givenValue(db.shopAssignments);
  const paid = collectedPaid(db.shopAssignments);
  const subsidy = subsidyTotal(db.shopAssignments);
  const intakeCost = db.shopIntakes.reduce((a, x) => a + (x.cost || 0), 0);
  const ils = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');
  groups.push({
    title: '💰 התחשבנות',
    rows: [
      ['שווי שחולק למוטבים', ils(given)],
      ['נגבה מהמוטבים', ils(paid)],
      ['סבסוד נטו (העמותה ספגה)', ils(subsidy)],
      ['עלות רכש מלאי', ils(intakeCost)],
      ['מימון אימוצים (הכנסה מיועדת)', ils(sponsorTotal)],
    ],
  });

  return groups;
}

export function ManagementSection(props: { db: Db; hidden: boolean; onPrint: () => void }) {
  const groups = managementMetrics(props.db);
  const csvRows = (): Cell[][] => [['קבוצה', 'מדד', 'ערך'], ...groups.flatMap((g) => g.rows.map((r) => [g.title, r[0], r[1]] as Cell[]))];

  return (
    <Section
      title="📊 מבט הנהלה"
      sub="סיכום תפעולי חוצה-מודולים — חלוקה, חנות, קופות ומשפחות"
      hidden={props.hidden}
      onPrint={props.onPrint}
      csvName="management"
      csvRows={csvRows}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {groups.map((g) => (
          <div key={g.title}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{g.title}</div>
            <ReportTable head={['מדד', 'ערך']} rows={g.rows.map((r) => ({ cells: [r[0], r[1]] }))} />
          </div>
        ))}
      </div>
    </Section>
  );
}
