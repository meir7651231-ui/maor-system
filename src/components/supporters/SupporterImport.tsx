/**
 * ייבוא תומכות מ-CSV — הצלבה לפי שם (קיימות יעודכנו, חדשות יתווספו).
 * העמודות: שם (חובה), טלפון, אימייל, ת"ז, כתובת, קטגוריה, עבור.
 * רכיב פנימי חסר-מסגרת — נעטף ב-Section (הגדרות) או ב-Modal (מסך התורמים).
 */
import { useState, type ChangeEvent } from 'react';
import { useApp } from '../../store/useApp';
import { parseCsv } from '../../lib/csvx';
import { downloadCsv } from '../../lib/csvx';
import { Btn, Field, FormError } from '../ui';
import {
  mergeSupporterRow,
  newSupporterFromRow,
  planSupporterImport,
  type SupporterImportRow,
} from './lib';

const HEADERS = ['שם', 'טלפון', 'אימייל', 'ת"ז', 'כתובת', 'קטגוריה', 'עבור'];

/** פענוח טקסט CSV לשורות ייבוא — זיהוי עמודות לפי כותרת, אחרת סדר קבוע. */
function parseRows(text: string): SupporterImportRow[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  const find = (keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  let iName = find(['שם']);
  let iPhone = find(['טלפון', 'נייד']);
  let iEmail = find(['אימייל', 'מייל', 'email']);
  let iId = find(['ת"ז', 'תז', 'זהות']);
  let iAddr = find(['כתובת']);
  let iCat = find(['קטגוריה']);
  let iFor = find(['עבור', 'ייעוד']);
  let start = 1;
  if (iName < 0) {
    // אין שורת כותרות מזוהה — סדר עמודות קבוע
    iName = 0;
    iPhone = 1;
    iEmail = 2;
    iId = 3;
    iAddr = 4;
    iCat = 5;
    iFor = 6;
    start = 0;
  }
  const g = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
  const out: SupporterImportRow[] = [];
  for (const r of rows.slice(start)) {
    const name = g(r, iName);
    if (!name) continue;
    out.push({
      name,
      phone: g(r, iPhone),
      email: g(r, iEmail),
      idNum: g(r, iId),
      address: g(r, iAddr),
      cat: g(r, iCat),
      forWho: g(r, iFor),
    });
  }
  return out;
}

export function SupporterImport(props: { onDone?: () => void }) {
  const setDb = useApp((s) => s.setDb);
  const toast = useApp((s) => s.toast);

  const [csv, setCsv] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');

  function downloadTemplate() {
    downloadCsv('supporters-template.csv', [
      HEADERS,
      ['ישראל ישראלי', '050-1234567', 'donor@example.com', '', 'ירושלים', 'תורם פרטי', 'כללי'],
    ]);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const txt = await file.text();
    setCsv(txt);
    run(txt);
  }

  function run(text = csv) {
    setError('');
    setSummary('');
    const rows = parseRows(text);
    if (!rows.length) {
      setError('לא נמצאו שורות תקינות — ודאו שיש עמודת "שם" (חובה)');
      return;
    }
    const plan = planSupporterImport(rows, useApp.getState().db.supporters);
    setDb((db) => {
      let seq = db.seq;
      const updates = new Map(plan.updates.map((u) => [u.id, u.row]));
      let supporters = db.supporters.map((sp) =>
        updates.has(sp.id) ? mergeSupporterRow(sp, updates.get(sp.id)!) : sp,
      );
      const inserts = plan.inserts.map((r) => newSupporterFromRow('sp' + seq++, r));
      supporters = [...inserts, ...supporters];
      return { seq, supporters };
    });
    setSummary(
      'ההצלבה לפי שם — נוספו ' +
        plan.inserts.length +
        ' חדשות · עודכנו ' +
        plan.updates.length +
        ' קיימות',
    );
    toast('ייבוא תומכות: +' + plan.inserts.length + ' · ✎' + plan.updates.length);
    setCsv('');
    props.onDone?.();
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
        שורה לכל תומכ/ת, בסדר: <b>{HEADERS.join(', ')}</b>. ההצלבה לפי שם — קיימות יעודכנו, חדשות
        יתווספו.
      </p>
      <FormError error={error} />
      {summary && (
        <div
          style={{
            background: '#e4f5ea',
            color: 'var(--green)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          {summary}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex' }}>
          בחירת קובץ CSV…
          <input type="file" accept=".csv,text/csv,text/plain" style={{ display: 'none' }} onChange={(e) => void onFile(e)} />
        </label>
        <Btn sm onClick={downloadTemplate}>
          ⬇ תבנית לדוגמה
        </Btn>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>או הדביקו למטה</span>
      </div>
      <Field label="שורות CSV (עם או בלי שורת כותרות)">
        <textarea
          rows={5}
          dir="rtl"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={'שם,טלפון,אימייל,ת"ז,כתובת,קטגוריה,עבור\nישראל ישראלי,050-1234567,donor@example.com,,ירושלים,תורם פרטי,כללי'}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Field>
      <Btn kind="primary" onClick={() => run()} disabled={!csv.trim()}>
        ייבוא התומכות
      </Btn>
    </div>
  );
}
