import { useState } from 'react';
import { useApp } from '../store.tsx';
import { agingBuckets, kpis, needsReminder } from '../lib/stats.ts';
import { AGING_LABEL, daysOverdue, fmtIls, type Aging } from '../lib/format.ts';
import { STEP_LABEL, nextStep } from '../lib/message.ts';
import { demoCollectedByMonth } from '../data/demo.ts';
import { Button, Card, LateBadge } from '../components/ui.tsx';
import { MessagePreview } from '../components/MessagePreview.tsx';
import type { Invoice } from '../lib/domain.ts';

const AGING_COLOR: Record<Aging, string> = { notDue: 'bg-ink-400', d0_30: 'bg-due', d31_60: 'bg-late', d61_90: 'bg-red-500', d90p: 'bg-red-700' };

export function Dashboard() {
  const { invoices, today, customerOf, business } = useApp();
  const k = kpis(invoices, today);
  const queue = needsReminder(invoices, today);
  const aging = agingBuckets(invoices, today);
  const agingTotal = Object.values(aging).reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...demoCollectedByMonth.map(m => m.amount));
  const [open, setOpen] = useState<Invoice | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-ink-500 text-sm">בוקר טוב, {business.ownerName} 👋</p>
          <h1 className="text-3xl font-extrabold">יש לך <span className="text-brand-700 num">{queue.length}</span> תזכורות מוכנות לאישור</h1>
        </div>
        <a href="#/invoices"><Button variant="outline">לכל החשבוניות ←</Button></a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="פתוח לגבייה" value={fmtIls(k.openTotal)} sub={`${k.openCount} חשבוניות`} />
        <Kpi label="באיחור" value={fmtIls(k.overdueTotal)} sub={`${k.overdueCount} חשבוניות`} tone="late" />
        <Kpi label="ממוצע ימי איחור" value={String(k.avgDaysLate)} sub="ימים" />
        <Kpi label="נגבה החודש" value={fmtIls(demoCollectedByMonth.at(-1)!.amount)} sub="מאז 1.11" tone="good" />
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-extrabold mb-1">תור האישורים של היום</h2>
          <p className="text-sm text-ink-500 mb-4">גבי הכין את ההודעות. תסתכל/י, תאשר/י — והוא שולח בשעות המותרות.</p>
          {queue.length === 0 ? <p className="text-ink-500 py-8 text-center">אין מה לאשר — הכול מטופל ✨</p> : (
            <ul className="divide-y divide-ink-200">
              {queue.map(i => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-brand-50 text-brand-700 grid place-items-center font-bold">{customerOf(i.customerId).name.slice(0, 1)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{customerOf(i.customerId).name}</div>
                    <div className="text-sm text-ink-500"><b className="text-ink-900">{fmtIls(i.amount)}</b> · <LateBadge days={daysOverdue(i.dueAt, today)} /> · {STEP_LABEL[nextStep(i)]}</div>
                  </div>
                  <Button size="sm" onClick={() => setOpen(i)}>תצוגה ואישור</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-extrabold mb-3">גיל החוב</h2>
            <div className="flex h-4 rounded-full overflow-hidden bg-ink-100" role="img" aria-label="התפלגות גיל החוב">
              {(Object.keys(aging) as Aging[]).map(a => aging[a] > 0 && <div key={a} className={AGING_COLOR[a]} style={{ width: `${(aging[a] / agingTotal) * 100}%` }} />)}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {(Object.keys(aging) as Aging[]).map(a => (
                <li key={a} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${AGING_COLOR[a]}`} />{AGING_LABEL[a]}<b className="ms-auto">{fmtIls(aging[a])}</b></li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-extrabold mb-3">נגבה לפי חודש</h2>
            <div className="flex items-end gap-2 h-32">
              {demoCollectedByMonth.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full rounded-t-md bg-brand/80 hover:bg-brand" style={{ height: `${(m.amount / max) * 100}%` }} title={fmtIls(m.amount)} />
                  <span className="text-[11px] text-ink-500">{m.month}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {open && <MessagePreview invoice={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'late' | 'good' }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-ink-500">{label}</div>
      <div className={`text-2xl md:text-3xl font-extrabold font-display mt-1 ${tone === 'late' ? 'text-late' : tone === 'good' ? 'text-brand-700' : ''}`}>{value}</div>
      <div className="text-xs text-ink-500 mt-0.5">{sub}</div>
    </Card>
  );
}
