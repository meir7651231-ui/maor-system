/**
 * 🧹 ניקיון ומשק בית (viewClean של המקור): 3 KPI (פתוחות · הושלמו · מלוכלכות), ＋ משימת ניקיון (יחידה + 5 סוגים),
 * כרטיסים — פתוחות ואחריהן שהושלמו; "✓ סיום ← יחידה זמינה" משחרר רק כשאין ליחידה משימה פתוחה נוספת (F10).
 * צ׳ק-אאוט פותח "ניקיון אחרי עזיבה" אוטומטית (store). hosting.housekeeping.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { useHostData, useHostEnv, useToday } from './hooks';
import { BigEmpty, FSelect, HModal, Kpi, cssVar, h, useHostUi } from './hui';
import { cleanTasksOf, fmtDM, unitLiveStatus } from './lib';
import { CLEAN_TYPES, tint } from './labels';
import { useFindProOn } from './SwitchPanels';
import { cleanNeed } from './switchLinks';

export function CleanTab() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const today = useToday();
  const finish = useApp((s) => s.finishHostCleanTask);
  // 🔌 המרכזייה (חיבור ב׳): עזרה בניקיון מהמדריך — רק כשהמדריך זמין
  const proOn = useFindProOn();
  const { open, done } = useMemo(() => cleanTasksOf(d.records), [d.records]);
  const dirty = useMemo(() => d.units.filter((u) => unitLiveStatus(u, d.bookings, today) === 'dirty').length, [d.units, d.bookings, today]);
  const list = [...open, ...done.slice().reverse()];
  return (
    <>
      <h1 className="h-vh">🧹 ניקיון ומשק בית</h1>
      <div className="h-vsub">{open.length} משימות פתוחות</div>
      <div className="h-kpis">
        <Kpi kc="var(--h-warn)" lab="🧹 משימות פתוחות" val={open.length} />
        <Kpi kc="var(--h-good)" lab="✓ הושלמו" val={done.length} />
        <Kpi kc="var(--h-amber)" lab={'🏠 ' + env.terms.units + ' מלוכלכות'} val={dirty} sub="ממתינות" />
      </div>
      <div className="h-fbar">
        <span style={{ flex: 1 }} />
        <button type="button" className={h('btn')} onClick={() => ui.open({ k: 'task' })} disabled={!d.units.length}>
          ＋ משימת ניקיון
        </button>
      </div>
      {list.length ? (
        <div className="h-crmgrid">
          {list.map((tk) => {
            const o = tk.status === 'open';
            const sc = o ? 'var(--h-warn)' : 'var(--h-faint)';
            return (
              <div key={tk.id} className="h-crmc" style={cssVar('sc', sc, { cursor: 'default' })}>
                <div className="h-crm-top">
                  <div className="h-crm-av" style={cssVar('sc', sc, { fontSize: 20 })}>
                    🧹
                  </div>
                  <div>
                    <div className="h-crm-nm">{d.unitName(tk.unitId)}</div>
                    <div className="h-crm-sub">
                      {tk.type || 'ניקיון'}
                      {tk.date ? ' · ' + fmtDM(tk.date) : ''}
                    </div>
                  </div>
                  <span className="h-crm-rib" style={{ color: sc, background: tint(sc, 15) }}>
                    {o ? 'פתוחה' : 'הושלמה'}
                  </span>
                </div>
                {o ? (
                  <div className="h-crm-acts">
                    <button type="button" className={h('crm-ab g')} onClick={() => finish(tk.id)}>
                      ✓ סיום ← {env.terms.unit} זמינה
                    </button>
                    {proOn && (
                      <button type="button" className={h('crm-ab')} onClick={() => ui.open({ k: 'findPro', text: cleanNeed(tk), title: (tk.type || 'ניקיון') + ' · ' + d.unitName(tk.unitId) })}>
                        🔧 מצא בעל מקצוע
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="h-crm-meta" style={{ color: 'var(--h-good)' }}>
                    <span>✓ הושלם</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <BigEmpty icon="✨" title="אין משימות ניקיון" sub={'כל ה' + env.terms.units + ' מסודרות'} />
      )}
    </>
  );
}

/** משימת ניקיון חדשה (taskModal): יחידה + סוג. */
export function TaskDialog() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const add = useApp((s) => s.addHostCleanTask);
  const toast = useApp((s) => s.toast);
  const [unitId, setUnitId] = useState(() => d.units[0]?.id ?? '');
  const [type, setType] = useState<string>(CLEAN_TYPES[0]);
  return (
    <HModal
      title="משימת ניקיון חדשה"
      onClose={ui.close}
      footer={
        <button
          type="button"
          className={h('btn')}
          onClick={() => {
            if (add(unitId, type)) {
              ui.close();
              toast('משימה נוצרה');
            }
          }}
        >
          צור משימה
        </button>
      }
    >
      <FSelect label={env.terms.unit} value={unitId} onChange={setUnitId} options={d.units.map((u) => [u.id, u.name] as const)} />
      <FSelect label="סוג משימה" value={type} onChange={setType} options={CLEAN_TYPES} />
    </HModal>
  );
}
