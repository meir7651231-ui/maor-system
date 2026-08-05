/**
 * מבט הנהלה (SHOP10 · מדדי הנהלה) — סיכום תפעולי חוצה-מודולים: חלוקה, חנות,
 * קופות צדקה ומשפחות. קריאה בלבד (אגרגציה טהורה), מגודר reports.management.
 * אפס נגיעה בנתונים — תצוגה/ייצוא בלבד.
 */
import type { Db } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { featureOn, termOf } from '../../lib/config';
import { useApp } from '../../store/useApp';
import type { Cell } from './csv';
import { ReportTable, Section } from './parts';
import { expiringIntakes, givenValue, collectedPaid, subsidyTotal } from '../shop/lib';
import { hokDue, hokMonthlyTotal } from '../supporters/lib';
import { isoToday } from '../../lib/date-util';

export interface MetricGroup {
  title: string;
  rows: [string, number | string][];
}

/** אגרגציה טהורה — נבדקת ביחידה. */
export function managementMetrics(db: Db, config?: OrgConfig): MetricGroup[] {
  const show = (k: string) => !config || featureOn(config, k); // בלי config (טסטים) = מוצג
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
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
      if (d.cur !== '$') g.ils += Number.isFinite(d.amount) ? d.amount : 0; // הגנת-NaN (גיבוי מושחת)
      sponsor.set(d.designation, g);
    }
  }

  const groups: MetricGroup[] = [
    // מטריצת-ורטיקלים 4.8.2026: כותרות-הקבוצות דרך termOf — היו קשיחות ודלפו
    { title: '🚚 ' + T('nav.shop7', 'חלוקה'), rows: [['ימי חלוקה', db.distributionDays.length], ['מסירות סה"כ', deliveries.length], ['נמסרו', delivered], [T('nav.families', 'משפחות') + ' שקיבלו', famReached], [T('entity.volunteer', 'מתנדב') + 'ים פעילים', activeVols]] },
    { title: '🛍 ' + T('nav.shop', 'חנות'), rows: [['שיוכים פעילים', activeAssign], ['מימושים', redemptions], ['אצוות פג/עומד-לפוג', expiringIntakes(db, isoToday()).length]] },
    { title: '🪙 ' + T('nav.tzedaka', 'קופות צדקה'), rows: [['קופות', db.tzBoxes.length], ['ריקונים', collections], ['סה"כ נאסף (₪)', tzTotal]] },
    { title: '👨‍👩‍👧 ' + T('nav.families', 'משפחות'), rows: [[T('nav.families', 'משפחות') + ' פעילות', activeFams], ['סה"כ ' + T('nav.families', 'משפחות'), db.families.length]] },
  ];

  const sponsorTotal = [...sponsor.values()].reduce((a, g) => a + g.ils, 0);
  if (sponsor.size > 0 && show('reports.management.sponsor')) {
    const rows: [string, number | string][] = [...sponsor.entries()].map(([name, g]) => [name, `${g.n} ${T('entity.donations', 'תרומות')} · ₪${g.ils.toLocaleString('he-IL')}`]);
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
  const reconRows: [string, number | string][] = [
    ['שווי שחולק למוטבים', ils(given)],
    ['נגבה מהמוטבים', ils(paid)],
    ['סבסוד נטו (העמותה ספגה)', ils(subsidy)],
    ['עלות רכש מלאי', ils(intakeCost)],
    ['מימון אימוצים (הכנסה מיועדת)', ils(sponsorTotal)],
  ];
  // יעד-תקציב סיוע (ניתן לעריכה בהגדרות, ניתן לשינוי בכל זמן) — קריאה בלבד כאן.
  // התקציב חוסם את הסבסוד: הסבסוד-נטו הוא ההוצאה האמיתית של העמותה.
  const budget = db.budget || 0;
  if (budget > 0) {
    reconRows.push(['יעד תקציב סיוע', ils(budget)]);
    const remain = budget - subsidy;
    reconRows.push(
      remain >= 0 ? ['נותר מהתקציב', ils(remain)] : ['⚠ חריגה מהתקציב', ils(-remain)],
    );
    reconRows.push(['ניצול התקציב', `${Math.round((subsidy / budget) * 100)}%`]);
  }
  if (show('reports.management.recon')) groups.push({ title: '💰 התחשבנות', rows: reconRows });

  // 🔁 הוראות-קבע (ROADMAP-100 ‏#2) — ההכנסה-הקבועה החודשית + מצב-החודש
  if (show('supporters.hok')) {
    const activeHok = db.supporters.filter((sp) => sp.hok?.active);
    if (activeHok.length) {
      const due = hokDue(db.supporters, isoToday());
      groups.push({
        title: '🔁 הוראות קבע',
        rows: [
          ['הוראות פעילות', activeHok.length],
          ['סה"כ חודשי (₪-שקול)', ils(hokMonthlyTotal(db.supporters, db.usdRate || 3.7))],
          ['טרם נרשמו החודש', due.length ? due.length + ' (' + due.slice(0, 4).map((s) => s.name).join(', ') + (due.length > 4 ? '…' : '') + ')' : '✓ הכול נרשם'],
        ],
      });
    }
  }

  return groups;
}

export function ManagementSection(props: { db: Db; hidden: boolean; onPrint: () => void }) {
  const config = useApp((s) => s.config);
  const groups = managementMetrics(props.db, config);
  const csvRows = (): Cell[][] => [['קבוצה', 'מדד', 'ערך'], ...groups.flatMap((g) => g.rows.map((r) => [g.title, r[0], r[1]] as Cell[]))];

  return (
    <Section
      title="📊 מבט הנהלה"
      sub={'סיכום תפעולי חוצה-מודולים — חלוקה, חנות, קופות ו' + termOf(config, 'nav.families', 'משפחות')}
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
