/**
 * 🪑 מפקדת-ההושבה (seatingModal של המקור): טבעת-ניצולת + 4 מדדים, אזהרת חוסר-מקומות, ✨ מילוי · 👪 לפי משפחות ·
 * ⚖️ איזון · 🔀 ערבוב · ⧉ העתק · 💬 וואטסאפ (הרחבה) · 🧹 נקה; משפחות-בלחיצה, ממתינים (בחירה ⇒ לחיצה על כיסא), הוספת
 * אדם / מילוי N; עגול·8 / מלבני·10 / 👑 ראש·12, שולחן מותאם (שם/כיסאות/צורה/כיסא/ראש); אולם עם במה, כיסאות לחיצים,
 * 👑 ✎ 🪑 📝 ⧉ ✕. כל שינוי = updateHostSeatPlan(f) — f מוחל על התוכנית החיה בתוך ה-store (המנוע: seating.ts).
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { guardExport } from '../../lib/exportGate';
import type { HostSeatPlan, HostSeatTable, HostTableShape } from '../../types/domain';
import { useHostData, useHostEnv } from './hooks';
import { HModal, clickable, cssVar, h, useHostUi } from './hui';
import {
  SEAT_CHAIRS,
  SEAT_SHAPES,
  seatAddPerson,
  seatAddTable,
  seatAutoFill,
  seatBalance,
  seatByFamilies,
  seatClear,
  seatColorOf,
  seatDeleteTable,
  seatDupTable,
  seatFamColors,
  seatFamilies,
  seatFillTo,
  seatFromDiners,
  seatOneFamily,
  seatPlace,
  seatPool,
  seatRemovePerson,
  seatRename,
  seatRing,
  seatSetCap,
  seatSetNote,
  seatShuffle,
  seatStats,
  seatText,
  seatToggleHead,
  seatUnseat,
} from './seating';
import { dinerNames } from './kitchen';
import { waShareHref } from './lib';
import { copyText } from './exportDoc';

export function SeatingDialog(props: { id: string }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const update = useApp((s) => s.updateHostSeatPlan);
  const toast = useApp((s) => s.toast);
  const m = d.meals.find((x) => x.id === props.id);
  const [sel, setSel] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [tName, setTName] = useState('');
  const [tCap, setTCap] = useState('8');
  const [tShape, setTShape] = useState<HostTableShape>('round');
  const [tChair, setTChair] = useState('כיסא');
  const [tHead, setTHead] = useState(false);
  const guestName = d.guestName;
  const hasPeople = !!m && m.seatPlan.people.length > 0;
  const hasDiners = !!m && m.diners.length > 0;
  useEffect(() => {
    // כמו המקור: פתיחה ראשונה של ארוחה עם משפחות ⇒ המשתתפים נטענים מהן
    if (m && !hasPeople && hasDiners) update(m.id, (sp) => (sp.people.length ? sp : seatFromDiners(m, sp, guestName)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!m) return null;
  const sp = m.seatPlan;
  const apply = (f: (sp: HostSeatPlan) => HostSeatPlan) => update(m.id, f);
  const needTables = () => {
    if (!sp.tables.length) {
      toast('הוסיפו שולחן קודם');
      return false;
    }
    return true;
  };
  const st = seatStats(sp);
  const fm = seatFamColors(sp);
  const pool = seatPool(sp);
  const fams = seatFamilies(sp, fm, guestName);
  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const doff = CIRC * (1 - Math.min(1, st.util / 100));
  const title = m.mealName || guestName(m.guestId) || 'ארוחה';
  const selName = sel ? (sp.people.find((p) => p.id === sel)?.name ?? '') : '';
  function placeAt(t: HostSeatTable) {
    if (!sel) {
      toast('בחרו קודם משתתף מהרשימה');
      return;
    }
    let err = undefined as 'full' | 'none' | undefined;
    apply((x) => {
      const r = seatPlace(x, sel, t.id);
      err = r.error;
      return r.plan;
    });
    if (err === 'full') toast('השולחן מלא');
    else setSel(null);
  }
  const tool = (lab: string, fn: () => void, primary = false) => (
    <button type="button" className={'h-tb' + (primary ? ' h-p' : '')} onClick={fn}>
      {lab}
    </button>
  );
  async function copy() {
    if (await copyText(seatText(sp, title))) toast('הפריסה הועתקה ✓');
  }
  return (
    <HModal
      title={'🪑 מפקדת ההושבה · ' + title}
      wide
      onClose={ui.close}
      footer={
        <button type="button" className={h('btn ghost')} onClick={ui.close}>
          סגור
        </button>
      }
    >
      <div className="h-seathero">
        <div className="h-sh-ring">
          <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
            <defs>
              <linearGradient id="hst-sgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--h-brand)" />
                <stop offset="1" stopColor="var(--h-a2)" />
              </linearGradient>
            </defs>
            <circle cx="52" cy="52" r="44" fill="none" stroke="var(--h-line2)" strokeWidth="9" />
            <circle
              cx="52"
              cy="52"
              r="44"
              fill="none"
              stroke="url(#hst-sgrad)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRC.toFixed(1)}
              strokeDashoffset={doff.toFixed(1)}
              transform="rotate(-90 52 52)"
              style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,1.2,.5,1)' }}
            />
          </svg>
          <div className="h-pct">
            <b>{st.util}%</b>
            <span>אוישו</span>
          </div>
        </div>
        <div className="h-sh-kpis">
          <div className="h-sh-stat" style={cssVar('sc', 'var(--h-brand)')}>
            <b>{st.totSeats}</b>
            <span>מקומות</span>
          </div>
          <div className="h-sh-stat" style={cssVar('sc', 'var(--h-good)')}>
            <b>{st.seatedN}</b>
            <span>הושבו</span>
          </div>
          <div className="h-sh-stat" style={cssVar('sc', 'var(--h-warn)')}>
            <b>{st.waiting}</b>
            <span>ממתינים</span>
          </div>
          <div className="h-sh-stat" style={cssVar('sc', 'var(--h-info)')}>
            <b>{sp.tables.length}</b>
            <span>שולחנות</span>
          </div>
        </div>
      </div>
      {st.short > 0 && (
        <div className="h-okbox" style={{ color: 'var(--h-crit)', background: 'color-mix(in srgb,var(--h-crit) 12%,transparent)', borderColor: 'color-mix(in srgb,var(--h-crit) 32%,transparent)', marginBottom: 12 }}>
          ⚠️ חסרים {st.short} מקומות ל-{sp.people.length} הסועדים — הוסיפו שולחן
        </div>
      )}
      <div className="h-seattool">
        {tool(
          '✨ מילוי אוטומטי',
          () => {
            if (!needTables()) return;
            apply(seatAutoFill);
            setSel(null);
          },
          true,
        )}
        {tool('👪 לפי משפחות', () => {
          if (!needTables()) return;
          let n = 0;
          apply((x) => {
            const r = seatByFamilies(x);
            n = r.placed;
            return r.plan;
          });
          setSel(null);
          toast('הושבו ' + n + ' לפי משפחות 👪');
        })}
        {tool('⚖️ איזון', () => {
          if (!needTables()) return;
          apply(seatBalance);
          setSel(null);
          toast('אוזן ⚖️');
        })}
        {tool('🔀 ערבוב', () => {
          if (!needTables()) return;
          apply((x) => seatShuffle(x, Math.random));
          setSel(null);
          toast('עורבב 🔀');
        })}
        {tool('⧉ העתק', copy)}
        {env.wa && (
          <a
            className="h-tb"
            href={waShareHref(seatText(sp, title), env.waApp)}
            {...(env.waApp ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            style={{ textDecoration: 'none' }}
            onClick={(e) => {
              // שמות-האורחים יוצאים מהמערכת — אותו שער-ייצוא כמו ⧉ העתק
              if (!guardExport()) e.preventDefault();
            }}
          >
            💬 וואטסאפ
          </a>
        )}
        {tool('🧹 נקה', () => {
          apply(seatClear);
          setSel(null);
        })}
      </div>
      {m.diners.length > 0 && (
        <div className="h-okbox" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          👪 הסועדים: {dinerNames(m, guestName).join(' · ')}
          <button
            type="button"
            className={h('btn sm')}
            style={{ marginInlineStart: 'auto' }}
            onClick={() => {
              const plan = seatFromDiners(m, sp, guestName);
              apply(() => plan);
              setSel(null);
              toast('נטענו ' + plan.people.length + ' סועדים מהמשפחות');
            }}
          >
            🔄 סנכרן מהסועדים
          </button>
        </div>
      )}
      {fams.length > 0 && (
        <>
          <div className="h-seatsub">👪 משפחות · לחיצה מושיבה את כולם יחד</div>
          <div className="h-famrail">
            {fams.map((f) => (
              <span
                key={f.gid}
                className="h-famchip"
                style={cssVar('fc', f.color)}
                title={'הושב את כל ' + f.name}
                {...clickable(() => {
                  if (!needTables()) return;
                  let n = 0;
                  apply((x) => {
                    const r = seatOneFamily(x, f.gid);
                    n = r.placed;
                    return r.plan;
                  });
                  setSel(null);
                  toast(n ? 'הושבו ' + n + ' 👪' : 'כולם כבר יושבים');
                })}
              >
                <span className="h-sw" />
                {f.name}{' '}
                <span className="h-ct">
                  {f.total - f.waiting}/{f.total}
                </span>
              </span>
            ))}
          </div>
        </>
      )}
      {sel && (
        <div className="h-hint" style={{ marginBottom: 8 }}>
          👆 <b>{selName}</b> נבחר — לחצו על כיסא פנוי בשולחן כדי להושיב
        </div>
      )}
      <div className="h-seatsub">
        🪑 ממתינים · {pool.length} מתוך {sp.people.length}
      </div>
      <div className="h-poolwrap">
        {pool.length ? (
          pool.map((p) => (
            <span key={p.id} className={'h-pchip' + (sel === p.id ? ' h-sel' : '')} style={cssVar('pc', seatColorOf(p, fm))} {...clickable(() => setSel(sel === p.id ? null : p.id))}>
              {p.kind === 'kid' ? '🧒' : '👤'} {p.name}
              <b
                className="h-x"
                role="button"
                tabIndex={0}
                aria-label={'הסרת ' + p.name}
                onClick={(e) => {
                  e.stopPropagation();
                  apply((x) => seatRemovePerson(x, p.id));
                  if (sel === p.id) setSel(null);
                }}
              >
                ✕
              </b>
            </span>
          ))
        ) : (
          <span style={{ color: 'var(--h-dim)', fontSize: 13, padding: 6 }}>כולם הושבו 🎉</span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-end', marginBottom: 14 }}>
        <div className="h-field" style={{ flex: 1, minWidth: 120, margin: 0 }}>
          <label htmlFor="hst-seat-p">הוספת אורח ידני</label>
          <input id="hst-seat-p" value={pName} placeholder="שם" onChange={(e) => setPName(e.target.value)} />
        </div>
        <button
          type="button"
          className={h('btn sm')}
          onClick={() => {
            if (!pName.trim()) {
              toast('שם חסר');
              return;
            }
            apply((x) => seatAddPerson(x, pName.trim()));
            setPName('');
          }}
        >
          ＋ אדם
        </button>
        <button type="button" className={h('btn ghost sm')} onClick={() => apply((x) => seatFillTo(x, m.dinerCount))}>
          👥 מלא {m.dinerCount} מקומות
        </button>
      </div>
      <div className="h-seatsub">🏗 בניית האולם</div>
      <div className="h-seattool" style={{ marginBottom: 9 }}>
        {tool('＋ עגול · 8', () => apply((x) => seatAddTable(x, { cap: 8, shape: 'round' })))}
        {tool('＋ מלבני · 10', () => apply((x) => seatAddTable(x, { cap: 10, shape: 'rect' })))}
        {tool('👑 שולחן ראש · 12', () => apply((x) => seatAddTable(x, { name: 'שולחן כבוד', cap: 12, shape: 'round', head: true })))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-end', marginBottom: 12 }}>
        <div className="h-field" style={{ flex: 1, minWidth: 100, margin: 0 }}>
          <label htmlFor="hst-seat-tn">שם שולחן</label>
          <input id="hst-seat-tn" value={tName} placeholder="שולחן ראשי" onChange={(e) => setTName(e.target.value)} />
        </div>
        <div className="h-field" style={{ width: 66, margin: 0 }}>
          <label htmlFor="hst-seat-tc">כיסאות</label>
          <input id="hst-seat-tc" type="number" min={1} value={tCap} onChange={(e) => setTCap(e.target.value)} />
        </div>
        <div className="h-field" style={{ width: 100, margin: 0 }}>
          <label htmlFor="hst-seat-ts">צורה</label>
          <select id="hst-seat-ts" value={tShape} onChange={(e) => setTShape(e.target.value as HostTableShape)}>
            {SEAT_SHAPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="h-field" style={{ width: 108, margin: 0 }}>
          <label htmlFor="hst-seat-tch">כיסא</label>
          <select id="hst-seat-tch" value={tChair} onChange={(e) => setTChair(e.target.value)}>
            {Object.entries(SEAT_CHAIRS).map(([c, em]) => (
              <option key={c} value={c}>
                {em} {c}
              </option>
            ))}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--h-dim)', cursor: 'pointer', paddingBottom: 9 }}>
          <input type="checkbox" checked={tHead} onChange={(e) => setTHead(e.target.checked)} style={{ width: 16, height: 16 }} />
          👑 ראש
        </label>
        <button
          type="button"
          className={h('btn sm')}
          onClick={() => {
            apply((x) => seatAddTable(x, { name: tName, cap: Number(tCap) || 8, shape: tShape, chair: tChair, head: tHead }));
            setTName('');
          }}
        >
          ＋ שולחן
        </button>
      </div>
      <div className="h-hall">
        <div className="h-stage">✦ במה · שולחן כבוד ✦</div>
        <div className="h-tgrid">
          {sp.tables.length ? (
            sp.tables.map((t) => {
              const full = t.seated.length >= t.cap;
              const ring = seatRing(t);
              const shapeLbl = SEAT_SHAPES.find(([v]) => v === t.shape)?.[1] ?? 'עגול';
              return (
                <div key={t.id} className={'h-tpod' + (full ? ' h-full' : '') + (t.head ? ' h-head' : '')}>
                  <div className="h-tpod-top">
                    <b>
                      {t.head ? '👑 ' : ''}
                      {t.name}
                    </b>
                    <span className="h-tpod-cnt">
                      {t.seated.length}/{t.cap}
                    </span>
                  </div>
                  <div className="h-tpod-meta">
                    {shapeLbl} · {SEAT_CHAIRS[t.chair] ?? '🪑'} {t.chair || 'כיסא'}
                  </div>
                  {t.note && <div className="h-tpod-note">📝 {t.note}</div>}
                  <div className="h-sfill">
                    <i style={{ width: Math.round((t.seated.length / Math.max(1, t.cap)) * 100) + '%' }} />
                  </div>
                  <div style={{ position: 'relative', width: ring.W, height: ring.H, margin: '6px auto 2px', maxWidth: '100%' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: ring.surf.left,
                        top: ring.surf.top,
                        width: ring.surf.width,
                        height: ring.surf.height,
                        borderRadius: ring.surf.round ? '50%' : 14,
                        background: t.head ? 'linear-gradient(140deg,color-mix(in srgb,var(--h-amber) 42%,var(--h-sand)),var(--h-sand))' : 'var(--h-sand)',
                        border: '2px solid ' + (t.head ? 'color-mix(in srgb,var(--h-amber) 60%,var(--h-line2))' : 'var(--h-line2)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: 'var(--h-amber)',
                        cursor: 'pointer',
                        padding: 6,
                        lineHeight: 1.15,
                      }}
                      aria-label={'הושבה ב' + t.name}
                      {...clickable(() => placeAt(t))}
                    >
                      {t.head && (
                        <>
                          👑
                          <br />
                        </>
                      )}
                      {t.name}
                    </div>
                    {Array.from({ length: Math.max(1, t.cap) }, (_, i) => {
                      const pt = ring.pts[i] ?? { x: ring.W / 2, y: ring.H / 2 };
                      const pid = t.seated[i];
                      const p = pid ? sp.people.find((z) => z.id === pid) : undefined;
                      const bg = p ? seatColorOf(p, fm) : '';
                      const lab = p ? (p.kind === 'kid' ? '🧒' : p.name.trim().slice(0, 2) || '•') : (SEAT_CHAIRS[t.chair] ?? '🪑');
                      return (
                        <div
                          key={i}
                          className="h-seatdot"
                          title={p ? p.name : (t.chair || 'כיסא') + ' פנוי'}
                          style={{
                            position: 'absolute',
                            left: pt.x - 14,
                            top: pt.y - 14,
                            width: 28,
                            height: 28,
                            borderRadius: t.chair === 'ספסל' ? 5 : '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: p ? 11 : 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                            ...(p
                              ? { background: bg, color: '#fff', border: '2px solid rgba(255,255,255,.5)', boxShadow: '0 2px 9px -2px ' + bg }
                              : { background: 'var(--h-panel)', color: 'var(--h-faint)', border: '2px dashed var(--h-line2)' }),
                          }}
                          {...clickable(() => (p ? apply((x) => seatUnseat(x, p.id)) : placeAt(t)))}
                        >
                          {lab}
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-tpod-acts">
                    <button type="button" className={'h-tpb' + (t.head ? ' h-on' : '')} title="שולחן ראש" aria-label="שולחן ראש" onClick={() => apply((x) => seatToggleHead(x, t.id))}>
                      👑
                    </button>
                    <button type="button" className="h-tpb" title="שם" aria-label="שם השולחן" onClick={() => ui.ask('שם השולחן', t.name, (v) => apply((x) => seatRename(x, t.id, v)), 'שולחן ראשי')}>
                      ✎
                    </button>
                    <button type="button" className="h-tpb" title="כיסאות" aria-label="מספר כיסאות" onClick={() => ui.ask('מספר כיסאות', String(t.cap), (v) => apply((x) => seatSetCap(x, t.id, v)), '8')}>
                      🪑
                    </button>
                    <button type="button" className="h-tpb" title="הערה" aria-label="הערת שולחן" onClick={() => ui.ask('הערת שולחן', t.note, (v) => apply((x) => seatSetNote(x, t.id, v)), 'ליד החלון · נגישות · צמחוני')}>
                      📝
                    </button>
                    <button type="button" className="h-tpb" title="שכפל" aria-label="שכפול שולחן" onClick={() => apply((x) => seatDupTable(x, t.id))}>
                      ⧉
                    </button>
                    <button type="button" className={h('tpb dn')} title="מחק" aria-label="מחיקת שולחן" onClick={() => apply((x) => seatDeleteTable(x, t.id))}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-empty" style={{ gridColumn: '1/-1' }}>
              אין שולחנות — הוסיפו שולחן ראשון ✨
            </div>
          )}
        </div>
      </div>
    </HModal>
  );
}
