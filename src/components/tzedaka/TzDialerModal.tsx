/**
 * 📞 חייגן-הקופות (בקשת-בעלים 22.10) — אותו דפוס כמו חייגן-התורמים: קופה אחר קופה, חיוג
 * למשפחה שהקופה אצלה (📞 / וואטסאפ), סימון תוצאה והמערכת מתקדמת. מי שלא ענה חוזר לסוף-התור.
 * תואם ריקון / לחזור ⇒ תזכורת בלוח הקופות (בתאריך שנבחר) · הקופה לא אצלם ⇒ מסומנת אבודה ·
 * ↩ ביטול האחרון מחזיר הכול · ⬇ סיכום CSV. הקופות כאן כבר מסוננות לייעוד של העובד/ת.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { integrationOn, termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import { downloadCsv, type Cell } from '../../lib/csvx';
import type { TzDialOutcome } from '../../types/domain';
import { Btn, Chip, Empty, Field, Modal, TextInput } from '../ui';
import { CallBtn } from '../CallBtn';
import { WaBtn } from '../WaBtn';
import { HebDateInput } from '../HebDateInput';
import { boxReminders, lastCollectionIso } from './lib';
import { tzBoxPhone, tzCampaignCsvRows, tzCurrentId, TZ_OUTCOME_LABELS, tzProgress } from './dialer';
import { useTzDb } from './useTzDb';

const OUTCOMES: { key: TzDialOutcome; icon: string; needsDate?: boolean }[] = [
  { key: 'scheduled', icon: '✅', needsDate: true },
  { key: 'noanswer', icon: '📵' },
  { key: 'callback', icon: '🔁', needsDate: true },
  { key: 'lost', icon: '⚠' },
  { key: 'done', icon: '✓' },
  { key: 'skip', icon: '⏭' },
];

export function TzDialerModal(props: { onClose: () => void }) {
  const db = useTzDb();
  const config = useApp((s) => s.config);
  const dialer = useApp((s) => s.db.ui.tzDialer);
  const outcome = useApp((s) => s.tzDialerOutcome);
  const undo = useApp((s) => s.tzDialerUndo);
  const stop = useApp((s) => s.tzDialerStop);
  const [note, setNote] = useState('');
  const [dateFor, setDateFor] = useState<TzDialOutcome | null>(null);
  const [date, setDate] = useState(isoToday());
  const [armEnd, setArmEnd] = useState(false);

  const boxWord = termOf(config, 'entity.tzBox', 'קופה');
  const id = dialer ? tzCurrentId(dialer) : null;
  const box = id ? db.tzBoxes.find((b) => b.id === id) : undefined;
  const fam = box ? db.families.find((f) => f.id === box.famId) : undefined;
  const coord = box ? db.tzCoordinators.find((c) => c.id === box.coordinatorId) : undefined;
  const phone = box ? tzBoxPhone(db, box) : '';
  const prog = dialer ? tzProgress(dialer) : null;
  const nextRem = box ? boxReminders(db.tzEvents, box.id, isoToday()).find((r) => r.when) : undefined;

  const act = (o: TzDialOutcome) => {
    const def = OUTCOMES.find((x) => x.key === o);
    if (def?.needsDate && dateFor !== o) {
      setDateFor(o);
      return;
    }
    outcome(o, note, def?.needsDate ? date : undefined);
    setNote('');
    setDateFor(null);
    setDate(isoToday());
  };
  const nameOf = (boxId: string) => {
    const b = db.tzBoxes.find((x) => x.id === boxId);
    const f = b ? db.families.find((x) => x.id === b.famId) : undefined;
    return b ? '#' + b.num + (f ? ' · ' + f.name : '') : boxId;
  };
  const csv = () => dialer && downloadCsv('tz-dialer-' + isoToday() + '.csv', tzCampaignCsvRows(dialer, nameOf) as Cell[][]);

  if (!dialer) {
    return (
      <Modal title={'📞 חייגן ' + termOf(config, 'nav.tzedaka', 'קופות צדקה')} onClose={props.onClose}>
        <Empty>אין חייגן פעיל</Empty>
      </Modal>
    );
  }

  return (
    <Modal title={'📞 חייגן ' + boxWord + ' · ' + dialer.name} onClose={props.onClose} wide>
      {prog && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, fontSize: 12.5 }}>
          <Chip on>{'נותרו ' + prog.remaining + ' מתוך ' + prog.total}</Chip>
          {OUTCOMES.filter((o) => prog.counts[o.key]).map((o) => (
            <Chip key={o.key} on={false}>{o.icon + ' ' + TZ_OUTCOME_LABELS[o.key] + ' · ' + prog.counts[o.key]}</Chip>
          ))}
        </div>
      )}

      {!box ? (
        <div style={{ textAlign: 'center', padding: '18px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🎉 סיימתם את התור</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn onClick={csv}>⬇ סיכום CSV</Btn>
            <Btn kind="primary" onClick={() => { stop(); props.onClose(); }}>סיום</Btn>
          </div>
        </div>
      ) : (
        <>
          <section className="card" style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{'#' + box.num}</span>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{fam ? termOf(config, 'entity.familyOf', 'משפחת') + ' ' + fam.name : '—'}</span>
              {box.designation && <Chip on>{'🔐 ' + box.designation}</Chip>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span dir="ltr" style={{ fontSize: 18, fontWeight: 700 }}>{phone}</span>
              <CallBtn phone={phone} title={'חיוג ל' + (fam?.name ?? '')} />
              {integrationOn(config, 'whatsapp') && (
                <WaBtn phone={phone} text={'שלום, מדברים מ' + config.orgName + ' לגבי ' + boxWord + ' ' + box.num} />
              )}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
              {[
                fam && [fam.address, fam.city].filter(Boolean).join(', '),
                coord && termOf(config, 'entity.tzCoordinator', 'רכז') + ': ' + coord.name,
                'ריקון אחרון: ' + (lastCollectionIso(box) || '—'),
                nextRem ? '🔔 ' + nextRem.when + ' · ' + nextRem.ev.title : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            {box.notes && <div style={{ fontSize: 12.5, whiteSpace: 'pre-line', maxHeight: 70, overflowY: 'auto' }}>{box.notes}</div>}
          </section>

          <Field label="הערה לשיחה">
            <TextInput value={note} onChange={setNote} placeholder="לדוגמה: אפשר לבוא ביום שלישי אחה״צ" />
          </Field>

          {dateFor && (
            <div style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap', margin: '6px 0' }}>
              <Field label={dateFor === 'scheduled' ? 'מתי הריקון?' : 'מתי לחזור?'}>
                <HebDateInput value={date} onChange={setDate} />
              </Field>
              <Btn kind="primary" onClick={() => act(dateFor)}>{'שמירה · ' + TZ_OUTCOME_LABELS[dateFor]}</Btn>
              <Btn onClick={() => setDateFor(null)}>ביטול</Btn>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {OUTCOMES.map((o) => (
              <Btn key={o.key} kind={o.key === 'scheduled' ? 'primary' : undefined} onClick={() => act(o.key)}>
                {o.icon + ' ' + TZ_OUTCOME_LABELS[o.key]}
              </Btn>
            ))}
          </div>
        </>
      )}

      <div className="modal-actions" style={{ marginTop: 12 }}>
        {dialer.log.length > 0 && <Btn onClick={undo}>↩ ביטול האחרון</Btn>}
        {dialer.log.length > 0 && <Btn onClick={csv}>⬇ סיכום CSV</Btn>}
        <Btn onClick={props.onClose}>השהיה</Btn>
        <Btn
          kind="danger"
          onClick={() => {
            if (!armEnd) {
              setArmEnd(true);
              setTimeout(() => setArmEnd(false), 3500);
              return;
            }
            stop();
            props.onClose();
          }}
        >
          {armEnd ? 'בטוח? לסיים' : '⏹ סיום החייגן'}
        </Btn>
      </div>
    </Modal>
  );
}
