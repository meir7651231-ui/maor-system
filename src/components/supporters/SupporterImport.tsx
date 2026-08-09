/**
 * ייבוא תומכות מ-CSV — הצלבה לפי שם (קיימות יעודכנו, חדשות יתווספו).
 * העמודות: שם (חובה), טלפון, אימייל, ת"ז, כתובת, קטגוריה, עבור.
 * רכיב פנימי חסר-מסגרת — נעטף ב-Section (הגדרות) או ב-Modal (מסך התורמים).
 */
import { useState, type ChangeEvent } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { parseAnyDate, parseCsv, readCsvFileText } from '../../lib/csvx';
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
  // קובץ מסוף-הסליקה (ExportHistory, 9.8): עמודות סכום/תאריך-עסקה/מטבע ⇒
  // כל שורה נושאת גם עסקה — נכנסת כהיסטוריה-ללא-קבלה (הכרעת-בעלים).
  const iAmount = find(['סכום']);
  const iTxDate = find(['תאריך']);
  const iCur = find(['מטבע']);
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
    const row: SupporterImportRow = {
      name,
      phone: g(r, iPhone),
      email: g(r, iEmail),
      idNum: g(r, iId),
      address: g(r, iAddr),
      cat: g(r, iCat),
      forWho: g(r, iFor),
    };
    if (iAmount >= 0 && iTxDate >= 0) {
      const amount = Math.round(Number(g(r, iAmount).replace(/[^\d.-]/g, '')) * 100) / 100;
      // 'תאריך עסקה' מגיע עם שעה ("09/08/26 00:36") — התאריך בלבד
      const d = parseAnyDate(g(r, iTxDate).split(' ')[0]);
      if (isFinite(amount) && amount > 0 && d) {
        row.hist = [{ d, a: amount, ...(/דולר|\$|usd/i.test(g(r, iCur)) ? { c: '$' as const } : {}) }];
      }
    }
    out.push(row);
  }
  return out;
}

export function SupporterImport(props: { onDone?: () => void }) {
  const setDb = useApp((s) => s.setDb);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);

  const [csv, setCsv] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  // סיכום-לפני-החלה (P2 פער 33) — כמו הלגאסי (importSummary→applyImport)
  // ובאותו דפוס דו-שלבי של ייבוא הילדים/משפחות-13. דגל supporters.import.preview:
  // חסר/true = דו-שלבי; false = החלה מיידית (ההתנהגות הישנה)
  const [plan, setPlan] = useState<ReturnType<typeof planSupporterImport> | null>(null);
  const previewOn = featureOn(config, 'supporters.import.preview');

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
    // helper משותף (P0.5): UTF-8 עם fallback ל-windows-1255 לקבצים מאקסל ישן
    const txt = await readCsvFileText(file);
    setCsv(txt);
    run(txt);
  }

  /** נקודת הכניסה: דו-שלבי כשהדגל פעיל, אחרת פענוח+החלה מיידית. */
  function run(text = csv) {
    const p = analyze(text);
    if (p && !previewOn) apply(p);
  }

  /** שלב 1 — פענוח והצגת סיכום; לא משנה נתונים. */
  function analyze(text = csv) {
    setError('');
    setSummary('');
    setPlan(null);
    const rows = parseRows(text);
    if (!rows.length) {
      setError('לא נמצאו שורות תקינות — ודאו שיש עמודת "שם" (חובה)');
      return null;
    }
    const p = planSupporterImport(rows, useApp.getState().db.supporters);
    setPlan(p);
    return p;
  }

  /** שלב 2 — החלה בפועל, רק אחרי אישור הסיכום (או מיידית כשהדגל כבוי).
   *  ⚠️ באג-שטח (6.8): onClick={apply} העביר את אירוע-הקליק כ-p ודרס את
   *  ברירת-המחדל p=plan ⇒ p.updates.map קרס וכלום לא יובא — מאז P2-33.
   *  הפרמטר מקבל טיפוס מפורש והכפתור קורא בחץ בלי ארגומנטים. */
  function apply(p: ReturnType<typeof planSupporterImport> | null = plan) {
    if (!p || !Array.isArray(p.updates)) return;
    setDb((db) => {
      let seq = db.seq;
      const updates = new Map(p.updates.map((u) => [u.id, u.row]));
      let supporters = db.supporters.map((sp) =>
        updates.has(sp.id) ? mergeSupporterRow(sp, updates.get(sp.id)!) : sp,
      );
      const inserts = p.inserts.map((r) => newSupporterFromRow('sp' + seq++, r));
      supporters = [...inserts, ...supporters];
      return { seq, supporters };
    });
    setSummary(
      'ההצלבה לפי שם — נוספו ' +
        p.inserts.length +
        ' חדשות · עודכנו ' +
        p.updates.length +
        ' קיימות',
    );
    toast('ייבוא ' + termOf(config, 'nav.supporters', 'תומכים') + ': +' + p.inserts.length + ' · ✎' + p.updates.length);
    setPlan(null);
    setCsv('');
    props.onDone?.();
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
        {'שורה לכל ' + termOf(config, 'entity.supporter', 'תומכ/ת') + ', בסדר: '}
        <b>{HEADERS.join(', ')}</b>. ההצלבה לפי שם — קיימות יעודכנו, חדשות יתווספו.
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
          onChange={(e) => {
            setCsv(e.target.value);
            setPlan(null);
          }}
          placeholder={'שם,טלפון,אימייל,ת"ז,כתובת,קטגוריה,עבור\nישראל ישראלי,050-1234567,donor@example.com,,ירושלים,תורם פרטי,כללי'}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Field>
      <Btn onClick={() => run()} disabled={!csv.trim()}>
        {previewOn ? 'בדיקת הקובץ (שלב 1)' : 'ייבוא'}
      </Btn>
      {plan && (
        <div style={{ marginTop: 12, border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>
            {'זוהו ' + (plan.inserts.length + plan.updates.length) + ' ' + termOf(config, 'nav.supporters', 'תומכות') + ' בקובץ'}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
            {'+' + plan.inserts.length + ' חדשות · ' + plan.updates.length + ' עדכונים לקיימות (הצלבה לפי שם)'}
            {(() => {
              // הכרעת-בעלים 9.8: עסקאות מקובץ-הסליקה ⇒ היסטוריה-ללא-קבלה
              const tx = [...plan.inserts, ...plan.updates.map((u) => u.row)].reduce((n, r) => n + (r.hist?.length ?? 0), 0);
              return tx > 0 ? ' · ' + tx + ' עסקאות ייכנסו כהיסטוריה ללא קבלה ("מהקובץ ההיסטורי")' : '';
            })()}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="primary" onClick={() => apply()} disabled={!plan.inserts.length && !plan.updates.length}>
              {'ייבוא ' + (plan.inserts.length + plan.updates.length) + ' ' + termOf(config, 'nav.supporters', 'תומכות')}
            </Btn>
            <Btn onClick={() => setPlan(null)}>ביטול</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
