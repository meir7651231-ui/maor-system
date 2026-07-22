/**
 * דו"ח מותאם — מודאל לשימוש חוזר: טווח תאריכים + בחירת שדות → CSV של העמודות
 * הנבחרות בלבד, בטווח. משמש בכותרות חוגים / לוח שנה / תורמים.
 * שדות המתייחסים למעקב הטיפול נעלמים כשהפיצ'ר supporters.ayin כבוי.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { buildCustomExport, expFieldDefs, type ExportTarget } from '../../lib/customExport';
import { Btn, Field, Modal } from '../ui';
import { downloadCsv } from './csv';
import { isoToday } from './lib';

const TARGET_LABEL: Record<ExportTarget, string> = {
  courses: 'חוגים',
  events: 'אירועים',
  supporters: 'תורמים',
};

export function CustomExport(props: { target: ExportTarget; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const cfg = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);

  const defs = useMemo(() => expFieldDefs(cfg, props.target), [cfg, props.target]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sel, setSel] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(defs.map((f) => [f.key, true])),
  );

  const label =
    props.target === 'supporters' ? termOf(cfg, 'nav.supporters', 'תורמים') : TARGET_LABEL[props.target];

  /** קיצור טווח נוח — החודש / השנה / הכול. */
  function preset(kind: 'month' | 'year' | 'all') {
    if (kind === 'all') {
      setFrom('');
      setTo('');
      return;
    }
    const t = isoToday();
    setFrom(kind === 'month' ? t.slice(0, 7) + '-01' : t.slice(0, 4) + '-01-01');
    setTo(t);
  }

  function run() {
    const keys = defs.filter((f) => sel[f.key]).map((f) => f.key);
    if (!keys.length) {
      toast('בחרו לפחות נתון אחד לייצוא');
      return;
    }
    const rows = buildCustomExport(cfg, db, props.target, { from, to }, keys);
    if (rows.length <= 1) {
      toast('אין נתונים בטווח שנבחר');
      return;
    }
    downloadCsv(`custom-${props.target}-${from || 'all'}_${to || 'all'}.csv`, rows);
    toast('הדו"ח המותאם ירד — ' + (rows.length - 1) + ' שורות');
    props.onClose();
  }

  return (
    <Modal title={'📊 דו"ח מותאם — ' + label} onClose={props.onClose}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Field label="מתאריך">
          <input type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="עד תאריך">
          <input type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <Btn sm onClick={() => preset('month')}>החודש</Btn>
        <Btn sm onClick={() => preset('year')}>השנה</Btn>
        <Btn sm onClick={() => preset('all')}>כל התאריכים</Btn>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>נתונים לייצוא</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 6, marginBottom: 12 }}>
        {defs.map((f) => (
          <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sel[f.key] ?? false}
              onChange={() => setSel((s) => ({ ...s, [f.key]: !s[f.key] }))}
              style={{ width: 'auto' }}
            />
            {f.label}
          </label>
        ))}
      </div>

      <div className="modal-actions">
        <Btn kind="primary" onClick={run}>
          ⬇ הורדת הדו"ח
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
