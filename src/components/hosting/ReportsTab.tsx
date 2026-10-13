/**
 * 📈 מרכז הדוחות (viewReports של המקור): 6 דוחות (הכנסות · תפוסה · אורחים · מטבח · גבייה · סיכום מנהלים) × טווחים
 * (החודש · חודש שעבר · 30 יום · השנה · הכל · טווח מותאם) ⇒ KPI + עמודות + טבלה; 5 יציאות — 🖨️ הדפסה/PDF · ⧉ העתק ·
 * 📄 CSV · 💬 וואטסאפ (הרחבה) · ⬇️ הורדה — כולן hosting.export + שער-הייצוא, נרשמות ביומן-הגישה; ⬇️ גיבוי · ⤵️ שחזור
 * (גם מגיבוי האפליקציה המקורית). hosting.reports.
 */
import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import { useRemembered } from '../../lib/filterMemory';
import { downloadCsv } from '../../lib/csvx';
import { exportAllowed, guardExport } from '../../lib/exportGate';
import { isoToday } from '../../lib/date-util';
import { useHostData, useHostEnv, useToday } from './hooks';
import { Kpi, cssVar, h, useHostUi } from './hui';
import { REP_PRESETS, REP_TYPES, buildReport, repRange, reportCsvRows, reportHtmlDoc, reportPlainText, type HostRepPreset, type HostRepType } from './reports';
import { addDaysIso, waShareHref } from './lib';
import { copyText, downloadFile, printHtmlDoc } from './exportDoc';
import { downloadBackup, pickRestore } from './backup';

export function ReportsTab(props: { biz: string }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const today = useToday();
  const toast = useApp((s) => s.toast);
  const logAccess = useApp((s) => s.logAccess);
  const [type, setType] = useRemembered<HostRepType>('hosting.rep.t', 'revenue');
  const [preset, setPreset] = useRemembered<HostRepPreset>('hosting.rep.p', 'month');
  const [from, setFrom] = useRemembered<string>('hosting.rep.from', '');
  const [to, setTo] = useRemembered<string>('hosting.rep.to', '');
  const t = env.terms;
  const rr = useMemo(() => repRange(preset, from, to, today), [preset, from, to, today]);
  const rep = useMemo(
    () =>
      buildReport(type, rr.from, rr.to, {
        units: d.units,
        bookings: d.bookings,
        meals: d.meals,
        guestName: d.guestName,
        unitName: d.unitName,
        guestWord: t.guest,
        guestsWord: t.guests,
        unitWord: t.unit,
        unitsWord: t.units,
        bookingWord: t.booking,
        bookingsWord: t.bookings,
      }),
    [type, rr, d.units, d.bookings, d.meals, d.guestName, d.unitName, t],
  );
  const text = () => reportPlainText(rep, rr.label, props.biz);
  const html = () => reportHtmlDoc(rep, rr.label, props.biz, new Date().toLocaleString('he-IL'));
  const logged = (how: string) => logAccess('📈 ייצוא דוח ' + t.nav + ' (' + how + ')', rep.title + ' · ' + rr.label);

  return (
    <>
      <h1 className="h-vh">📈 מרכז הדוחות</h1>
      <div className="h-hint" style={{ marginBottom: 14 }}>
        בחרו דוח · קבעו תקופה · ייצאו. חמש דרכי-ייצוא: הדפסה/PDF · העתקה · CSV לאקסל · וואטסאפ · הורדת HTML.
      </div>
      <div className="h-repgal">
        {REP_TYPES.map(([k, ic, ti, de, color]) => (
          <button key={k} type="button" className={'h-repcard' + (type === k ? ' h-on' : '')} style={cssVar('rc', color, { textAlign: 'start', font: 'inherit', color: 'inherit' })} aria-pressed={type === k} onClick={() => setType(k)}>
            <div className="h-ic">{ic}</div>
            <div className="h-ti">{k === 'guests' ? t.guests : ti}</div>
            <div className="h-de">{de}</div>
          </button>
        ))}
      </div>
      <div className="h-repchips">
        {REP_PRESETS.map(([k, lab]) => (
          <button key={k} type="button" className={'h-repchip' + (preset === k ? ' h-on' : '')} onClick={() => setPreset(k)}>
            {lab}
          </button>
        ))}
        {preset === 'custom' && (
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginInlineStart: 4 }}>
            <input type="date" aria-label="מתאריך" value={from || addDaysIso(isoToday(), -30)} onChange={(e) => setFrom(e.target.value)} style={{ padding: '6px 9px', border: '1px solid var(--h-line2)', borderRadius: 9, background: 'var(--h-panel)', color: 'var(--h-ink)' }} />
            <span style={{ color: 'var(--h-dim)' }}>–</span>
            <input type="date" aria-label="עד תאריך" value={to || isoToday()} onChange={(e) => setTo(e.target.value)} style={{ padding: '6px 9px', border: '1px solid var(--h-line2)', borderRadius: 9, background: 'var(--h-panel)', color: 'var(--h-ink)' }} />
          </span>
        )}
      </div>
      <div>
        <div className="h-rephead" style={cssVar('rc', rep.kc)}>
          <div>
            <div className="h-rh-t">{rep.title}</div>
            <div className="h-rh-s">
              {rr.label} · {rep.sub}
            </div>
          </div>
          {env.on.export && (
            <div className="h-rh-exp">
              <button
                type="button"
                className={h('tb p')}
                onClick={() => {
                  if (printHtmlDoc(html())) logged('הדפסה');
                }}
              >
                🖨️ הדפסה / PDF
              </button>
              <button
                type="button"
                className="h-tb"
                onClick={async () => {
                  if (await copyText(text())) {
                    logged('העתקה');
                    toast('הדוח הועתק ✓');
                  }
                }}
              >
                ⧉ העתק
              </button>
              <button
                type="button"
                className="h-tb"
                onClick={() => {
                  const ok = exportAllowed();
                  downloadCsv(rep.key + '-' + isoToday() + '.csv', reportCsvRows(rep));
                  if (ok) logged('CSV');
                }}
              >
                📄 CSV
              </button>
              {env.wa && (
                <a className="h-tb" href={waShareHref(text(), env.waApp)} {...(env.waApp ? {} : { target: '_blank', rel: 'noopener noreferrer' })} style={{ textDecoration: 'none' }}
                  onClick={(e) => {
                    if (!guardExport()) {
                      e.preventDefault();
                      return;
                    }
                    logged('וואטסאפ');
                  }}
                >
                  💬 וואטסאפ
                </a>
              )}
              <button
                type="button"
                className="h-tb"
                onClick={() => {
                  if (downloadFile(rep.key + '-' + isoToday() + '.html', html(), 'text/html;charset=utf-8')) logged('HTML');
                }}
              >
                ⬇️ הורדה
              </button>
            </div>
          )}
        </div>
        <div className="h-kpis">
          {rep.kpis.map((k) => (
            <Kpi key={k.lab} kc={k.kc} lab={k.lab} val={k.val} sub={k.sub} />
          ))}
        </div>
        {rep.viz.items.length > 0 && (
          <div className="h-repbars">
            {rep.viz.items.map((it) => (
              <div key={it.name} className="h-repbar" style={cssVar('rc', rep.kc)}>
                <span className="h-nm" title={it.name}>
                  {it.name}
                </span>
                <span className="h-tk">
                  <i style={{ width: Math.round((it.val / (rep.viz.max || 1)) * 100) + '%' }} />
                </span>
                <span className="h-vv">{it.disp}</span>
              </div>
            ))}
          </div>
        )}
        {rep.rows.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="h-tbl">
              <thead>
                <tr>
                  {rep.cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rep.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} className={j > 0 ? 'h-mono' : undefined}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-repempty">
            אין נתונים בתקופה זו 📭
            <br />
            <span style={{ fontSize: 12.5 }}>נסו טווח רחב יותר או הוסיפו {t.bookings}.</span>
          </div>
        )}
      </div>
      <div className="h-rowbtn" style={{ marginTop: 20 }}>
        {env.on.export && (
          <button type="button" className={h('btn ghost')} onClick={() => downloadBackup(d, t)}>
            ⬇️ גיבוי כל הנתונים (JSON)
          </button>
        )}
        {env.canManage && (
          <button type="button" className={h('btn ghost')} onClick={() => pickRestore(ui, t)}>
            ⤵️ שחזור מקובץ
          </button>
        )}
      </div>
    </>
  );
}
