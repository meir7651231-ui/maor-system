/**
 * חייגן-מונחה (assisted dialer) — קמפיין-שיחות downstream על הטלפונים הקיימים:
 * המערכת מציגה תומך-אחר-תומך, לוחצים 📞 (הטלפון מחייג דרך tel:), מסמנים תוצאה
 * (תרם / לא-ענה / סירב / חזרה / טופל / דלג) — והמערכת מתקדמת, מחזירה-לתור את
 * מי-שלא-ענה, וקובעת "לדבר שוב" ל-callback. מנוע: lib/dialer; נהג: telephony/driver
 * (כרגע ידני; קופסת-GSM עתידית = החלפת-נהג). כל התוויות דרך termOf.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf, integrationOn } from '../../lib/config';
import { currentId, progress } from '../../lib/dialer';
import { activeDriver } from '../../lib/telephony/driver';
import type { DialOutcome } from '../../types/domain';
import { Modal, Btn, Empty } from '../ui';
import { WaBtn } from '../WaBtn';
import { CallBtn } from '../CallBtn';
import { HebDateInput } from '../HebDateInput';
import { supIls, supLast, supCount, fmtDate } from '../supporters/lib';
import { stageLabel } from '../../lib/ayin';

export function DialerModal({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const dialer = useApp((s) => s.db.ui.dialer);
  const supporters = useApp((s) => s.db.supporters);
  const outcome = useApp((s) => s.dialerOutcome);
  const stop = useApp((s) => s.dialerStop);

  const [note, setNote] = useState('');
  const [cbOpen, setCbOpen] = useState(false);
  const [cbDate, setCbDate] = useState('');
  const [armEnd, setArmEnd] = useState(false); // מגן דו-שלבי לסיום (בלי confirm ילידי)

  const supWord = termOf(config, 'entity.supporter', 'תומך/ת');
  const waOn = integrationOn(config, 'whatsapp');
  const drv = activeDriver();

  if (!dialer) {
    return (
      <Modal title="📞 חייגן" onClose={onClose}>
        <Empty>אין קמפיין פעיל — התחילו חייגן מרשימת ה{termOf(config, 'nav.supporters', 'תורמים')}.</Empty>
      </Modal>
    );
  }

  const prog = progress(dialer);
  const id = currentId(dialer);
  const sp = id ? supporters.find((s) => s.id === id) : null;

  const act = (o: DialOutcome, cbIso?: string) => {
    outcome(o, note, cbIso);
    setNote('');
    setCbOpen(false);
    setCbDate('');
  };

  const pct = prog.total ? Math.round((prog.finalized / prog.total) * 100) : 0;

  return (
    <Modal title={'📞 חייגן ' + termOf(config, 'nav.supporters', 'תורמים')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 'min(400px, 82vw)' }}>
        {/* התקדמות */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 4 }}>
            <span>{prog.finalized} / {prog.total} טופלו</span>
            <span>נותרו {prog.remaining}</span>
          </div>
          <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: 'var(--accent)', transition: 'width .2s' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11.5, marginTop: 6, color: 'var(--ink-soft)' }}>
            <span>💰 {prog.counts.donated}</span>
            <span>📵 {prog.counts.noanswer}</span>
            <span>🚫 {prog.counts.refused}</span>
            <span>🔁 {prog.counts.callback}</span>
          </div>
        </div>

        {!sp ? (
          /* סיום הקמפיין */
          <div style={{ textAlign: 'center', padding: '18px 8px' }}>
            <div style={{ fontSize: 34 }} aria-hidden>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>הקמפיין הושלם</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
              {prog.total} {supWord} · 💰 {prog.counts.donated} תרמו · 🔁 {prog.counts.callback} לחזרה
            </div>
            <div style={{ marginTop: 14 }}>
              <Btn kind="primary" onClick={() => { stop(); onClose(); }}>סגירה</Btn>
            </div>
          </div>
        ) : (
          <>
            {/* כרטיס המתקשר הנוכחי */}
            <div style={{ border: '1px solid var(--accent)', borderRadius: 12, padding: 14, background: 'var(--accent-soft, var(--panel))', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.15 }}>{sp.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                    {[sp.cat, sp.forWho].filter(Boolean).join(' · ')}
                    {sp.phone && <span dir="ltr"> · {sp.phone}</span>}
                  </div>
                </div>
                {drv.callHref(sp.phone) && <CallBtn phone={sp.phone} title={'חיוג אל ' + sp.name} />}
                {waOn && sp.phone && <WaBtn phone={sp.phone} title={'וואטסאפ ל' + sp.name} />}
              </div>
              {/* הקשר-תרומות מהיר */}
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', borderTop: '1px solid var(--line-soft, var(--line))', paddingTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>סה"כ: <b style={{ direction: 'ltr', display: 'inline-block' }}>₪{Math.round(supIls(sp)).toLocaleString('en-US')}</b></span>
                <span>{supCount(sp)} {termOf(config, 'entity.donations', 'תרומות')}</span>
                {supLast(sp) && <span>אחרונה: {fmtDate(supLast(sp))}</span>}
                {sp.ayin && <span>· {stageLabel(config, sp.ayin.stage)}</span>}
              </div>
              {sp.ayin?.nextTalk && (
                <div style={{ fontSize: 12, color: 'var(--accent-deep, #a05008)' }}>🔁 לדבר שוב: {fmtDate(sp.ayin.nextTalk)}</div>
              )}
            </div>

            {/* הערת-שיחה */}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הערה מהשיחה (אופציונלי)…"
              style={{ fontSize: 13, padding: '7px 10px' }}
            />

            {/* קביעת חזרה — בורר-תאריך */}
            {cbOpen ? (
              <div style={{ border: '1px dashed var(--line)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>מתי לחזור?</div>
                <HebDateInput value={cbDate} onChange={setCbDate} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn sm kind="primary" disabled={!cbDate} onClick={() => act('callback', cbDate)}>🔁 קבע חזרה</Btn>
                  <Btn sm onClick={() => setCbOpen(false)}>ביטול</Btn>
                </div>
              </div>
            ) : (
              /* כפתורי-סיווג */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                <Btn kind="primary" onClick={() => act('donated')}>💰 תרם/ה</Btn>
                <Btn onClick={() => act('noanswer')}>📵 לא ענה</Btn>
                <Btn onClick={() => act('refused')}>🚫 סירב</Btn>
                <Btn onClick={() => setCbOpen(true)}>🔁 חזרה</Btn>
                <Btn onClick={() => act('done')}>✓ טופל</Btn>
                <Btn onClick={() => act('skip')}>⏭ דלג</Btn>
              </div>
            )}
          </>
        )}

        {/* סרגל-תחתון */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <Btn sm onClick={onClose}>מזעור</Btn>
          {armEnd ? (
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>למחוק?</span>
              <Btn sm onClick={() => { stop(); onClose(); }}>כן, סיום</Btn>
              <Btn sm onClick={() => setArmEnd(false)}>ביטול</Btn>
            </span>
          ) : (
            <Btn sm onClick={() => setArmEnd(true)}>🗑 סיום קמפיין</Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}
