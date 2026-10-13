/**
 * 🔧 תחזוקה, מתקנים ובטיחות (viewMaint של המקור): באנר-חירום P0/P1 + 4 KPI, ＋ קריאה · ＋ ציוד · ＋ תחזוקה מונעת,
 * טבלת-קריאות לפי עדיפות (⚠ בטיחות, יחידה, קטגוריה, סטטוס, בטיפול/סגור/שחרר-יחידה — סגירה לא משחררת יחידה שעליה
 * קריאת-חירום נוספת, F13), ציוד ("דווח תקלה" ממולא), תחזוקה-מונעת. + קריאה חדשה (15 קטגוריות, P0–P4, בטיחות;
 * P0/P1 ⇒ חסימת-יחידה), ציוד, תוכנית, ויומן-הטמפרטורה (חריגה ⇒ קריאה כללית — F7). hosting.maint.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { isoToday } from '../../lib/date-util';
import type { HostAsset, HostPlan } from '../../types/domain';
import { useHostData, useHostEnv } from './hooks';
import { FCheck, FInput, FSelect, HModal, Kpi, Pill, h, useHostUi } from './hui';
import { nextFaultStatus } from './lib';
import { CRITS, MP, M_CAT, M_ST, PM_FREQS, TEMP_DEVICES } from './labels';
import { useFindProOn } from './SwitchPanels';
import { faultNeed } from './switchLinks';

export function MaintTab() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const advance = useApp((s) => s.advanceHostFault);
  const release = useApp((s) => s.releaseHostFaultUnit);
  const del = useApp((s) => s.deleteHostRecord);
  // 🔌 המרכזייה (חיבור ב׳): "🔧 מצא בעל מקצוע" רק כשהמדריך זמין (שער סינכרוני — לא טוען דבר)
  const proOn = useFindProOn();
  const open = d.faults.filter((r) => r.status !== 'done');
  const p0 = open.filter((r) => r.priority <= 1).length;
  const sorted = d.faults.slice().sort((a, b) => a.priority - b.priority);
  const assetName = (id: string) => d.assets.find((a) => a.id === id)?.name ?? '—';
  return (
    <>
      <h1 className="h-vh">🔧 תחזוקה, מתקנים ובטיחות</h1>
      <div className="h-vsub">{open.length} קריאות פתוחות</div>
      {p0 > 0 && <div className="h-warnbox">🚨 {p0} קריאות חירום פתוחות (P0/P1) — טיפול מיידי</div>}
      <div className="h-kpis">
        <Kpi kc="var(--h-crit)" lab="חירום P0/P1" val={p0} sub={'סכנה/' + env.terms.unit + ' חסומה'} />
        <Kpi kc="var(--h-warn)" lab="קריאות פתוחות" val={open.length} sub="סה״כ" />
        <Kpi kc="var(--h-info)" lab="ציוד רשום" val={d.assets.length} sub="נכסים" />
        <Kpi kc="var(--h-violet)" lab="תחזוקה מונעת" val={d.plans.length} sub="תוכניות" />
      </div>
      <div className="h-rowbtn">
        <button type="button" className={h('btn')} onClick={() => ui.open({ k: 'fault' })}>
          ＋ קריאת תחזוקה
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'asset' })}>
          ＋ ציוד
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'plan' })}>
          ＋ תחזוקה מונעת
        </button>
      </div>
      <div className="h-panel">
        <h2>📋 קריאות תחזוקה</h2>
        <div className="h-tblwrap">
          <table className="h-tbl">
            <thead>
              <tr>
                <th>עדיפות</th>
                <th>תיאור</th>
                <th>{env.terms.unit}</th>
                <th>קטגוריה</th>
                <th>סטטוס</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.length ? (
                sorted.map((r) => {
                  const p = MP[r.priority] ?? MP[3];
                  const st = M_ST[r.status];
                  const nx = nextFaultStatus(r.status);
                  return (
                    <tr key={r.id}>
                      <td>
                        <Pill color={p[2]}>{p[0]}</Pill>
                      </td>
                      <td>
                        <b>{r.desc}</b>
                        {r.safety && <span style={{ color: 'var(--h-crit)' }}> ⚠</span>}
                      </td>
                      <td>{r.unitId ? d.unitName(r.unitId) : '— כללי —'}</td>
                      <td>{r.category}</td>
                      <td>
                        <Pill color={st[1]}>{st[0]}</Pill>
                      </td>
                      <td>
                        {nx ? (
                          <button type="button" className={h('btn sm')} onClick={() => advance(r.id)}>
                            {nx === 'done' ? 'סגור' : 'בטיפול'}
                          </button>
                        ) : r.blocked ? (
                          <button type="button" className={h('btn sm')} onClick={() => release(r.id)}>
                            שחרר {env.terms.unit}
                          </button>
                        ) : (
                          '✓'
                        )}
                        {proOn && r.status !== 'done' && (
                          <>
                            {' '}
                            <button
                              type="button"
                              className={h('btn ghost sm')}
                              onClick={() => ui.open({ k: 'findPro', text: faultNeed(r), title: r.desc.trim() || r.category, urgent: r.priority <= 1 || r.safety })}
                            >
                              🔧 מצא בעל מקצוע
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="h-empty">
                    אין קריאות
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="h-two" style={{ marginTop: 16 }}>
        <div className="h-panel">
          <h2>🛠️ ציוד ונכסים</h2>
          <div className="h-tblwrap">
            <table className="h-tbl">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>קטגוריה</th>
                  <th>{env.terms.unit}</th>
                  <th>קריטיות</th>
                  <th>טיפול הבא</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.assets.length ? (
                  d.assets.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <b>{a.name}</b>
                      </td>
                      <td>{a.category}</td>
                      <td>{a.unitId ? d.unitName(a.unitId) : '—'}</td>
                      <td>{a.crit || 'רגיל'}</td>
                      <td className="h-mono">{a.next || '—'}</td>
                      <td style={{ display: 'flex', gap: 5 }}>
                        <button type="button" className={h('btn ghost sm')} onClick={() => ui.open({ k: 'fault', assetId: a.id })}>
                          דווח תקלה
                        </button>
                        {env.canDelete && (
                          <button type="button" className={h('btn ghost sm danger')} aria-label={'מחיקת ' + a.name} onClick={() => ui.confirm('למחוק את הציוד "' + a.name + '"?', () => del(a.id))}>
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="h-empty">
                      אין ציוד
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="h-panel">
          <h2>🔁 תחזוקה מונעת</h2>
          <div className="h-tblwrap">
            <table className="h-tbl">
              <thead>
                <tr>
                  <th>משימה</th>
                  <th>ציוד</th>
                  <th>תדירות</th>
                  <th>יעד</th>
                  {env.canDelete && <th />}
                </tr>
              </thead>
              <tbody>
                {d.plans.length ? (
                  d.plans.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <b>{p.task}</b>
                      </td>
                      <td>{p.assetId ? assetName(p.assetId) : '—'}</td>
                      <td>{p.freq}</td>
                      <td className="h-mono">{p.due || '—'}</td>
                      {env.canDelete && (
                        <td>
                          <button type="button" className={h('btn ghost sm danger')} aria-label={'מחיקת ' + p.task} onClick={() => ui.confirm('למחוק את התוכנית "' + p.task + '"?', () => del(p.id))}>
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={env.canDelete ? 5 : 4} className="h-empty">
                      אין תוכניות
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/** קריאת תחזוקה (mreqModal) — "דווח תקלה" מהציוד ממלא תיאור/יחידה/קטגוריה. */
export function FaultDialog(props: { assetId?: string }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const add = useApp((s) => s.addHostFault);
  const a = props.assetId ? d.assets.find((x) => x.id === props.assetId) : undefined;
  const [desc, setDesc] = useState(a ? 'תקלה ב' + a.name : '');
  // מהציוד ⇒ היחידה שלו (גם "כללי"); בלי ציוד — הראשונה, כמו במקור
  const [unitId, setUnitId] = useState(a ? a.unitId : (d.units[0]?.id ?? ''));
  const [cat, setCat] = useState<string>(a?.category && (M_CAT as readonly string[]).includes(a.category) ? a.category : M_CAT[0]);
  // ברירת-מחדל P3 (במקור — האפשרות הראשונה, P0, שחסמה יחידה בטעות כשלא שינו)
  const [pri, setPri] = useState('3');
  const [safety, setSafety] = useState(false);
  return (
    <HModal
      title="קריאת תחזוקה"
      onClose={ui.close}
      footer={
        <button
          type="button"
          className={h('btn')}
          onClick={() => {
            if (add({ unitId, assetId: a?.id ?? '', category: cat, priority: Number(pri), desc, safety }).ok) ui.close();
          }}
        >
          פתח קריאה
        </button>
      }
    >
      <FInput label="תיאור התקלה" value={desc} onChange={setDesc} placeholder="דוד לא מחמם / נזילה..." />
      <div className="h-frow">
        <FSelect label={env.terms.unit} value={unitId} onChange={setUnitId} options={[...d.units.map((u) => [u.id, u.name] as const), ['', '— כללי —'] as const]} />
        <FSelect label="קטגוריה" value={cat} onChange={setCat} options={M_CAT} />
      </div>
      <FSelect label="עדיפות" value={pri} onChange={setPri} options={MP.map((p, i) => [String(i), p[0] + ' · ' + p[1]] as const)} />
      <FCheck label="סכנת בטיחות" checked={safety} onChange={setSafety} />
      <div className="h-hint">P0/P1 יחסמו אוטומטית את ה{env.terms.unit} (חירום).</div>
    </HModal>
  );
}

/** ציוד חדש (assetModal). */
export function AssetDialog() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const upsert = useApp((s) => s.upsertHostRecord);
  const [f, setF] = useState({ name: '', category: M_CAT[0] as string, unitId: '', crit: CRITS[0] as string, next: '' });
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  return (
    <HModal
      title="ציוד חדש"
      onClose={ui.close}
      footer={
        <button
          type="button"
          className={h('btn')}
          onClick={() => {
            const rec: HostAsset = { id: '', kind: 'asset', name: f.name, category: f.category, unitId: f.unitId, crit: f.crit, next: f.next, createdAt: '', updatedAt: '' };
            if (upsert(rec).ok) ui.close();
          }}
        >
          שמור
        </button>
      }
    >
      <div className="h-frow">
        <FInput label="שם הציוד" value={f.name} onChange={(v) => set({ name: v })} />
        <FSelect label="קטגוריה" value={f.category} onChange={(v) => set({ category: v })} options={M_CAT} />
      </div>
      <div className="h-frow">
        <FSelect label={env.terms.unit} value={f.unitId} onChange={(v) => set({ unitId: v })} options={[['', '— כללי —'] as const, ...d.units.map((u) => [u.id, u.name] as const)]} />
        <FSelect label="קריטיות" value={f.crit} onChange={(v) => set({ crit: v })} options={CRITS} />
      </div>
      <FInput label="טיפול הבא (תאריך)" type="date" value={f.next} onChange={(v) => set({ next: v })} />
    </HModal>
  );
}

/** תחזוקה מונעת (pmModal). */
export function PlanDialog() {
  const d = useHostData();
  const ui = useHostUi();
  const upsert = useApp((s) => s.upsertHostRecord);
  const [f, setF] = useState({ task: '', assetId: d.assets[0]?.id ?? '', freq: PM_FREQS[0] as string, due: '' });
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  return (
    <HModal
      title="תחזוקה מונעת"
      onClose={ui.close}
      footer={
        <button
          type="button"
          className={h('btn')}
          onClick={() => {
            const rec: HostPlan = { id: '', kind: 'plan', task: f.task, assetId: f.assetId, freq: f.freq, due: f.due, createdAt: '', updatedAt: '' };
            if (upsert(rec).ok) ui.close();
          }}
        >
          שמור
        </button>
      }
    >
      <FInput label="משימה" value={f.task} onChange={(v) => set({ task: v })} placeholder="ניקוי מסנני-מזגן..." />
      <div className="h-frow">
        <FSelect label="ציוד" value={f.assetId} onChange={(v) => set({ assetId: v })} options={d.assets.length ? d.assets.map((a) => [a.id, a.name] as const) : [['', '— אין ציוד —'] as const]} />
        <FSelect label="תדירות" value={f.freq} onChange={(v) => set({ freq: v })} options={PM_FREQS} />
      </div>
      <FInput label="תאריך יעד" type="date" value={f.due} onChange={(v) => set({ due: v })} />
    </HModal>
  );
}

const fmtAt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

/** 🌡️ יומן טמפרטורה · בטיחות מזון (tempModal) — 20 המדידות האחרונות, חותמת-שעה מלאה. */
export function TempDialog() {
  const d = useHostData();
  const ui = useHostUi();
  const add = useApp((s) => s.addHostTempReading);
  const [dev, setDev] = useState(TEMP_DEVICES[0][0]);
  const [temp, setTemp] = useState('4');
  const rows = d.temps.slice().reverse().slice(0, 20);
  const at = (iso: string) => {
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? iso : fmtAt.format(ms);
  };
  return (
    <HModal
      title="🌡️ יומן טמפרטורה · בטיחות מזון"
      onClose={ui.close}
      footer={
        <button type="button" className={h('btn ghost')} onClick={ui.close}>
          סגור
        </button>
      }
    >
      <div className="h-frow">
        <FSelect label="נקודת מדידה" value={dev} onChange={setDev} options={TEMP_DEVICES} />
        <FInput label="טמפרטורה °C" type="number" value={temp} onChange={setTemp} />
      </div>
      <button type="button" className={h('btn sm')} style={{ marginBottom: 12 }} onClick={() => add(dev, Number(temp))}>
        ＋ רשום מדידה
      </button>
      <div className="h-tblwrap">
        <table className="h-tbl">
          <thead>
            <tr>
              <th>נקודה</th>
              <th>טמפ׳</th>
              <th>סטטוס</th>
              <th>מתי</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.device}</td>
                  <td className="h-mono">{t.temp}°</td>
                  <td>
                    {t.ok ? (
                      <Pill cls="u-free" color="var(--h-good)">
                        תקין
                      </Pill>
                    ) : (
                      <Pill cls="u-blocked" color="var(--h-crit)">
                        חריגה
                      </Pill>
                    )}
                  </td>
                  <td className="h-mono">{at(t.at || isoToday())}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="h-empty">
                  אין מדידות
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </HModal>
  );
}
