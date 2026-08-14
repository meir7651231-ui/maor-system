/**
 * דו"ח מותאם — מודאל לשימוש חוזר: טווח תאריכים + בחירת שדות → CSV של העמודות
 * הנבחרות בלבד, בטווח. משמש בכותרות חוגים / לוח שנה / תורמים.
 * שדות המתייחסים למעקב הטיפול נעלמים כשהפיצ'ר supporters.ayin כבוי.
 * הדוח המלא (P2 פער 23, feature reports.custom.full): 14/17 שדות מהלגאסי,
 * תאריך עברי חי ליד הטווח, "בחר הכל"/"נקה", ותצוגה מקדימה שבה עמודת
 * ההערות נערכת inline — לייצוא בלבד, ה-DB לא משתנה.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { buildCustomExport, expFieldDefs, overrideColumn, type ExportTarget } from '../../lib/customExport';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Field, Modal } from '../ui';
import { downloadCsv } from './csv';
import { isoToday } from './lib';

const TARGET_LABEL: Record<ExportTarget, string> = {
  courses: 'חוגים',
  events: 'אירועים',
  supporters: 'תורמים',
};

const PREVIEW_MAX = 30;

export function CustomExport(props: { target: ExportTarget; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const cfg = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const fullOn = featureOn(cfg, 'reports.custom.full');

  const defs = useMemo(() => expFieldDefs(cfg, props.target), [cfg, props.target]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sel, setSel] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(defs.map((f) => [f.key, true])),
  );
  const [preview, setPreview] = useState(false);
  // דריסות הערות מהתצוגה המקדימה — אינדקס שורת-נתונים → טקסט (לייצוא בלבד)
  const [notesEdit, setNotesEdit] = useState<Record<number, string>>({});

  const label =
    props.target === 'supporters'
      ? termOf(cfg, 'nav.supporters', 'תורמים')
      : props.target === 'courses'
        ? termOf(cfg, 'nav.courses', 'חוגים')
        : TARGET_LABEL[props.target];

  const keys = useMemo(() => defs.filter((f) => sel[f.key]).map((f) => f.key), [defs, sel]);
  const rows = useMemo(
    () => (preview && keys.length ? buildCustomExport(cfg, db, props.target, { from, to }, keys) : null),
    [preview, keys, cfg, db, props.target, from, to],
  );
  // ציד-באגים 3.8.2026 (🟡): notesEdit ממופתח לפי אינדקס-שורה; שינוי טווח/שדות
  // מזיז את הישויות בשורות ⇒ הערה שנערכה שויכה לישות אחרת בייצוא. מאפסים על שינוי.
  useEffect(() => {
    setNotesEdit({});
  }, [from, to, keys]);
  const notesIdx = rows ? (rows[0] as string[]).indexOf('הערות') : -1;

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
    // 🔐 מאסטר-מתג הוצאת-מידע (13.8): עובד חסום לא מייצא דו"ח מותאם.
    if (!featureOn(cfg, 'core.export')) {
      toast('⛔ הוצאת מידע חסומה עבורך על-ידי מנהל הארגון');
      return;
    }
    if (!keys.length) {
      toast('בחרו לפחות נתון אחד לייצוא');
      return;
    }
    const built = rows ?? buildCustomExport(cfg, db, props.target, { from, to }, keys);
    if (built.length <= 1) {
      toast('אין נתונים בטווח שנבחר');
      return;
    }
    const out = overrideColumn(built, (built[0] as string[]).indexOf('הערות'), notesEdit);
    downloadCsv(`custom-${props.target}-${from || 'all'}_${to || 'all'}.csv`, out);
    toast('הדו"ח המותאם ירד — ' + (out.length - 1) + ' שורות');
    props.onClose();
  }

  return (
    <Modal title={'📊 דו"ח מותאם — ' + label} onClose={props.onClose} wide={preview}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {/* תאריך עברי חי ליד הטווח (פער 23) — תצוגה בלבד */}
        <Field label={'מתאריך' + (fullOn && from ? ' · ' + hebDateFull(from) : '')}>
          <input type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={'עד תאריך' + (fullOn && to ? ' · ' + hebDateFull(to) : '')}>
          <input type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <Btn sm onClick={() => preset('month')}>החודש</Btn>
        <Btn sm onClick={() => preset('year')}>השנה</Btn>
        <Btn sm onClick={() => preset('all')}>כל התאריכים</Btn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>נתונים לייצוא</span>
        {fullOn && (
          <>
            <Btn sm onClick={() => setSel(Object.fromEntries(defs.map((f) => [f.key, true])))}>
              בחר הכל
            </Btn>
            <Btn sm onClick={() => setSel({})}>נקה</Btn>
          </>
        )}
      </div>
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

      {fullOn && preview && rows && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 4 }}>
            {rows.length - 1 + ' שורות'}
            {notesIdx >= 0 ? ' · עמודת ההערות נערכת כאן — לקובץ בלבד, לא לנתונים' : ''}
            {rows.length - 1 > PREVIEW_MAX ? ' · מוצגות ' + PREVIEW_MAX + ' הראשונות' : ''}
          </div>
          <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
            <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {(rows[0] as string[]).map((h, i) => (
                    <th key={i} style={{ padding: '4px 8px', textAlign: 'right', position: 'sticky', top: 0, background: 'var(--panel)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1, PREVIEW_MAX + 1).map((r, ri) => (
                  <tr key={ri}>
                    {r.map((cell, ci) => (
                      <td key={ci} style={{ padding: '3px 8px', borderTop: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
                        {ci === notesIdx ? (
                          <input
                            value={notesEdit[ri + 1] ?? String(cell ?? '')}
                            onChange={(e) => setNotesEdit((m) => ({ ...m, [ri + 1]: e.target.value }))}
                            style={{ fontSize: 12, minWidth: 120 }}
                            aria-label="עריכת הערה לייצוא"
                          />
                        ) : (
                          String(cell ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="modal-actions">
        <Btn kind="primary" onClick={run}>
          ⬇ הורדת הדו"ח
        </Btn>
        {fullOn && !preview && (
          <Btn onClick={() => setPreview(true)}>תצוגה מקדימה</Btn>
        )}
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
