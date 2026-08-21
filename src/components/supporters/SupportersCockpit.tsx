/**
 * חלון-העבודה (הקוקפיט) — שכבת-ההעצמה של מסך התורמים.
 *
 * תצוגה טהורה מעל מנוע `cockpit.ts`: רצועת-KPI + תור-משימות היום עם סיבה לכל
 * אחת ולחיצה-אחת. אפס נתונים חדשים — הכול נגזר מ-db.supporters הקיים. הפעולות
 * הכבדות (רישום-הו״ק, מכתב-תודה) חיות בכרטיס — כאן מנתבים אליו בלחיצה.
 *
 * מגודר opt-in מפורש (`supporters.cockpit === true`) ⇒ אפס-השפעה על הלקוח-החי.
 */
import { useState } from 'react';
import type { OrgConfig } from '../../types/config';
import type { Supporter } from '../../types/domain';
import { featureOn, integrationOn } from '../../lib/config';
import { WaBtn } from '../WaBtn';
import { Btn } from '../ui';
import {
  cockpitCsvRows,
  cockpitFeed,
  cockpitKpis,
  cockpitProgress,
  cockpitQueue,
  cockpitWorkListText,
  type CockpitSeverity,
  type CockpitTask,
} from './cockpit';
import { segmentCounts, type SegmentKey } from './segments';
import { fmtDate, isoToday } from './lib';
import { downloadCsv } from '../../lib/csvx';
import { guardExport } from '../../lib/exportGate';

const SEV_STYLE: Record<CockpitSeverity, { bg: string; c: string; label: string }> = {
  due: { bg: 'var(--warn-bg, #f9ecd7)', c: 'var(--warn, #b45309)', label: 'לטיפול היום' },
  risk: { bg: 'var(--red-bg, #fdecec)', c: 'var(--red, #b3261e)', label: 'סיכון נטישה' },
  warm: { bg: 'var(--good-bg, #e7f2e8)', c: 'var(--good, #2e7d32)', label: 'תודה' },
};

function ils(n: number): string {
  return '₪' + Math.round(n).toLocaleString('he-IL');
}

function initial(name: string): string {
  return (name || '').trim().charAt(0) || '💛';
}

function KpiCard(props: { label: string; value: string; tone?: 'risk'; onClick?: () => void }) {
  const clickable = !!props.onClick;
  return (
    <div
      className="card"
      onClick={props.onClick}
      title={clickable ? 'סינון לרשימת-הבסיכון' : undefined}
      style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, cursor: clickable ? 'pointer' : 'default', outline: clickable ? '1px solid var(--warn, #b45309)' : undefined }}
    >
      <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 }}>{props.label}{clickable ? ' ↗' : ''}</span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-.5px',
          fontVariantNumeric: 'tabular-nums',
          color: props.tone === 'risk' ? 'var(--warn, #b45309)' : 'var(--ink)',
        }}
      >
        {props.value}
      </span>
    </div>
  );
}

function TaskRow(props: {
  task: CockpitTask;
  config: OrgConfig;
  done: boolean;
  onOpen: (id: string) => void;
  onToggleDone: (id: string) => void;
}) {
  const { task, config } = props;
  const sev = SEV_STYLE[task.severity];
  const callable = task.phone && featureOn(config, 'supporters.click2call');
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        opacity: props.done ? 0.55 : 1,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          background: 'var(--accent-soft, #fbeecb)',
          color: 'var(--accent-deep, #a05008)',
        }}
      >
        {props.done ? '✓' : initial(task.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14.5,
            textDecoration: props.done ? 'line-through' : 'none',
            color: props.done ? 'var(--ink-faint)' : 'var(--ink)',
          }}
        >
          {task.name || 'ללא שם'}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{task.reason}</div>
      </div>
      <span
        style={{
          flex: 'none',
          fontSize: 11.5,
          fontWeight: 700,
          borderRadius: 999,
          padding: '3px 10px',
          background: sev.bg,
          color: sev.c,
        }}
      >
        {sev.label}
      </span>
      <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
        {callable ? (
          <a
            href={'tel:' + task.phone.replace(/\D/g, '')}
            title={'חיוג ל' + task.name}
            aria-label={'חיוג ל' + task.name}
            className="chip"
            style={{ textDecoration: 'none' }}
          >
            📞
          </a>
        ) : null}
        {task.phone && integrationOn(config, 'whatsapp') ? (
          <WaBtn phone={task.phone} title={'וואטסאפ ל' + task.name} />
        ) : null}
        <Btn sm onClick={() => props.onOpen(task.supId)} title="פתיחת כרטיס התורם">
          פתח
        </Btn>
        <Btn
          sm
          kind={props.done ? 'plain' : 'primary'}
          onClick={() => props.onToggleDone(task.id)}
          title={props.done ? 'ביטול סימון' : 'סימון שהמשימה טופלה'}
        >
          {props.done ? '↺' : '✓ בוצע'}
        </Btn>
      </div>
    </div>
  );
}

function TaskGroup(props: {
  title: string;
  icon: string;
  tasks: CockpitTask[];
  config: OrgConfig;
  doneIds: ReadonlySet<string>;
  onOpen: (id: string) => void;
  onToggleDone: (id: string) => void;
}) {
  if (props.tasks.length === 0) return null;
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>
          {props.icon} {props.title}
        </span>
        <span style={{ marginInlineStart: 'auto', fontWeight: 800, fontSize: 13, color: 'var(--accent-deep, #a05008)' }}>
          {props.tasks.length}
        </span>
      </div>
      {props.tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          config={props.config}
          done={props.doneIds.has(t.id)}
          onOpen={props.onOpen}
          onToggleDone={props.onToggleDone}
        />
      ))}
    </section>
  );
}

export function SupportersCockpit(props: {
  supporters: Supporter[];
  config: OrgConfig;
  usdRate: number;
  onOpen: (id: string) => void;
  /** מעבר למסך-הנתונים (לחיצה על סגמנט = חפירה בטבלה המלאה). */
  onExit?: () => void;
  /** קליק על סגמנט — מסנן את הטבלה לפי הסגמנט (לא רק פותח מסך ריק). */
  onSegment?: (key: SegmentKey) => void;
  /** הפעלת החייגן-המונחה על רשימת-מזהים (חיווט מודיעין→חייגן). */
  onDial?: (ids: string[]) => void;
}) {
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(new Set<string>());
  const today = isoToday();
  const rate = props.usdRate || 3.7;

  const kpis = cockpitKpis(props.supporters, today, rate);
  const queue = cockpitQueue(props.supporters, today, rate);
  const prog = cockpitProgress(queue, doneIds);
  const segs = segmentCounts(props.supporters, today, rate).filter((s) => s.count > 0);
  const feed = cockpitFeed(props.supporters, 8);

  const toggleDone = (id: string) =>
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hokLabel = featureOn(props.config, 'supporters.hok');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── רצועת KPI ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        <KpiCard label="סה״כ תורמים" value={String(kpis.total)} />
        <KpiCard label="נגבה החודש" value={ils(kpis.collected)} />
        {hokLabel ? <KpiCard label="צפוי מהו״ק החודש" value={ils(kpis.expectedHok)} /> : null}
        <KpiCard label="בסיכון נטישה" value={String(kpis.atRisk)} tone="risk" onClick={props.onSegment ? () => props.onSegment!('atrisk') : undefined} />
      </div>

      {/* ── כותרת + התקדמות ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>המשימות של היום</h2>
        {queue.total > 0 ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn sm onClick={() => downloadCsv('cockpit-' + today + '.csv', cockpitCsvRows(queue))} title="ייצוא רשימת-המשימות ל-CSV">
              ⬇ CSV
            </Btn>
            {/* 🐛 FLAGMAX: ההעתקה-ללוח עקפה את שער-יציאת-המידע (core.export) —
                עכשיו דרך guardExport, בדיוק כמו כפתור-ה-CSV (downloadCsv) שלצדה. */}
            <Btn sm onClick={() => { if (!guardExport()) return; void navigator.clipboard?.writeText(cockpitWorkListText(queue)); }} title="העתקת רשימת-המשימות ללוח">
              📋 העתקה
            </Btn>
            {/* חייגן-מונחה על תור-השיחות (מודיעין→חייגן) — רק שיחות עם טלפון */}
            {props.onDial ? (() => {
              const callIds = queue.tasks.filter((t) => t.kind === 'call' && t.phone).map((t) => t.supId);
              return callIds.length ? (
                <Btn sm kind="primary" onClick={() => props.onDial!(callIds)} title="חייגן-מונחה על כל השיחות המומלצות — אחת-אחת, עם סימון-תוצאה ואזהרת-שעה">
                  📞 חייגן ({callIds.length})
                </Btn>
              ) : null;
            })() : null}
          </div>
        ) : null}
        {queue.total > 0 ? (
          <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 130,
                height: 8,
                borderRadius: 99,
                background: 'var(--line, #efe8da)',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: (queue.total ? Math.round((prog.done / queue.total) * 100) : 0) + '%',
                  background: 'var(--accent-deep, #a05008)',
                  transition: 'width .25s',
                }}
              />
            </div>
            <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent-deep, #a05008)' }}>
              {prog.done}/{queue.total} טופלו
            </span>
          </div>
        ) : null}
      </div>

      {/* ── התור ── */}
      {queue.total === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>
          אין משימות פתוחות להיום — הכול מטופל 🎉
        </div>
      ) : (
        <>
          <TaskGroup
            title="שיחות מומלצות"
            icon="📞"
            tasks={queue.calls}
            config={props.config}
            doneIds={doneIds}
            onOpen={props.onOpen}
            onToggleDone={toggleDone}
          />
          <TaskGroup
            title="תודות ממתינות"
            icon="💛"
            tasks={queue.thanks}
            config={props.config}
            doneIds={doneIds}
            onOpen={props.onOpen}
            onToggleDone={toggleDone}
          />
          <TaskGroup
            title="הוראות-קבע שטרם נרשמו"
            icon="🔁"
            tasks={queue.hok}
            config={props.config}
            doneIds={doneIds}
            onOpen={props.onOpen}
            onToggleDone={toggleDone}
          />
        </>
      )}

      {/* ── רצועה: סגמנטים שמורים + פעילות חיה ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginTop: 4,
        }}
      >
        {segs.length > 0 ? (
          <div className="card" style={{ padding: '15px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>סגמנטים שמורים</span>
              <span style={{ marginInlineStart: 'auto', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                שליטה מלאה
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {segs.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => (props.onSegment ? props.onSegment(s.key) : props.onExit?.())}
                  title={props.onSegment ? 'סינון הטבלה לסגמנט ' + s.label : 'פתיחת מסך-הנתונים לחפירה'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    border: '1px solid var(--line, #eee3cf)',
                    background: 'var(--panel-2, #faf6ec)',
                    borderRadius: 999,
                    padding: '6px 12px',
                    cursor: props.onExit ? 'pointer' : 'default',
                    font: 'inherit',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ width: 8, height: 8, borderRadius: 99, background: s.dot, flex: 'none' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--accent-deep, #a05008)',
                      background: 'var(--panel, #fff)',
                      border: '1px solid var(--line, #e6d9bd)',
                      borderRadius: 999,
                      padding: '0 7px',
                    }}
                  >
                    {s.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {feed.length > 0 ? (
          <div className="card" style={{ padding: '15px 17px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 9 }}>פעילות חיה</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {feed.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => f.spId && props.onOpen(f.spId)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 9,
                    padding: '8px 2px',
                    borderBottom: '1px solid var(--line-soft, #f2ecdf)',
                    background: 'none',
                    border: 'none',
                    borderBottomStyle: 'solid',
                    textAlign: 'start',
                    cursor: f.spId ? 'pointer' : 'default',
                    font: 'inherit',
                    color: 'inherit',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--accent-deep, #a05008)', marginTop: 7, flex: 'none' }}
                  />
                  <span style={{ flex: 1, fontSize: 13 }}>
                    <b>{f.who || 'תורם'}</b>{' '}
                    <span style={{ color: 'var(--ink-faint)' }}>{f.what}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                    {fmtDate(f.date)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
