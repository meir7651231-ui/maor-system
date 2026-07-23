/**
 * הגדרות ← ייבוא נתונים — קליטת משפחות ובני משפחה מהמערכת הישנה:
 * 1. קובץ גיבוי JSON (אותו פורמט של הגיבוי המלא) — מיזוג משפחות חדשות בלבד.
 * 2. הדבקת CSV — שורה לכל משפחה: שם משפחה, שם האב, שם האם, טלפון, עיר.
 * 3. ילדים (CSV) — קובץ/הדבקה עם שורת כותרות; התאמת הורים חכמה לכל שורה
 *    (ת"ז הורה → טלפון → שם משפחה+שם האם → שם משפחה+עיר) בשני שלבים: תצוגה ← אישור.
 */
import { useState, type ChangeEvent } from 'react';
import { emptyFamily, emptyMember, type Family, type Member } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { parseBackupFile } from '../../store/persist';
import { normalizePhone, normSearch } from '../../lib/validate';
import { parseAnyDate, parseCsv } from '../../lib/csvx';
import { Btn, Field, FormError } from '../ui';
import { isoToday, Section, SectionNote } from './lib';
import { SupporterImport } from '../supporters/SupporterImport';

/** מפתח זיהוי כפילויות: שם מנורמל + טלפון מנורמל. */
function famKey(name: string, phone: string): string {
  return normSearch(name) + '|' + normalizePhone(phone);
}

export function ImportSection() {
  const setDb = useApp((s) => s.setDb);
  const upsertFamily = useApp((s) => s.upsertFamily);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);

  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [csv, setCsv] = useState('');

  /** ייבוא מקובץ גיבוי JSON — מוסיף רק משפחות שאינן קיימות (לפי שם+טלפון). */
  async function onJsonFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setSummary('');
    try {
      const parsed = parseBackupFile(await file.text());
      if (!parsed.families.length) {
        setError('בקובץ הגיבוי אין משפחות לייבוא');
        return;
      }
      const cur = useApp.getState().db;
      const existing = new Set(cur.families.map((f) => famKey(f.name, f.phone)));
      const toAdd = parsed.families.filter((f) => !existing.has(famKey(f.name, f.phone)));
      if (!toAdd.length) {
        setSummary(`בקובץ ${parsed.families.length} משפחות — כולן כבר קיימות במערכת, לא נוסף דבר.`);
        return;
      }
      // עדכון אטומי אחד: מזהים חדשים לכל משפחה ולכל בן משפחה (מונע התנגשות מזהים)
      let added = 0;
      let members = 0;
      setDb((db) => {
        let seq = db.seq;
        const fresh: Family[] = toAdd.map((f) => ({
          ...emptyFamily(),
          ...f,
          id: 'f' + seq++,
          createdAt: f.createdAt || isoToday(),
          members: (f.members ?? []).map((m) => ({ ...m, id: 'm' + seq++ })),
          docs: f.docs ?? [],
          cred: f.cred ?? { score: 500, log: [] },
        }));
        added = fresh.length;
        members = fresh.reduce((n, f) => n + f.members.length, 0);
        return { seq, families: [...db.families, ...fresh] };
      });
      const skipped = parsed.families.length - added;
      setSummary(
        `נוספו ${added} משפחות ו-${members} בני משפחה מהגיבוי` +
          (skipped ? ` · ${skipped} דולגו (כבר קיימות)` : ''),
      );
      toast('נוספו ' + added + ' משפחות');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
    }
  }

  /** ייבוא מהדבקת CSV: שם משפחה, שם האב, שם האם, טלפון, עיר. */
  function importCsv() {
    setError('');
    setSummary('');
    // מנתח CSV אמיתי — תומך בפסיקים/גרשיים/מעברי-שורה בתוך שדה (שם "כהן, בן דוד",
    // עיר עם פסיק). הפיצול הנאיבי הקודם (split(',')) שיבש שמות/ערים כאלה.
    const parsed = parseCsv(csv);
    let skippedNoName = 0;
    let skippedExisting = 0;
    const rows: { name: string; father: string; mother: string; phone: string; city: string }[] = [];
    parsed.forEach((cells, i) => {
      const name = (cells[0] ?? '').trim();
      // דילוג על שורת כותרת אם קיימת
      if (i === 0 && ['name', 'שם', 'שם משפחה', 'משפחה'].includes(name.toLowerCase())) return;
      if (!name) {
        skippedNoName++;
        return;
      }
      rows.push({
        name,
        father: (cells[1] ?? '').trim(),
        mother: (cells[2] ?? '').trim(),
        phone: (cells[3] ?? '').trim(),
        city: (cells[4] ?? '').trim(),
      });
    });
    if (!rows.length) {
      setError('לא נמצאו שורות תקינות — הפורמט: שם משפחה, שם האב, שם האם, טלפון, עיר (שורה לכל משפחה)');
      return;
    }
    const existing = new Set(useApp.getState().db.families.map((f) => famKey(f.name, f.phone)));
    let added = 0;
    for (const r of rows) {
      const key = famKey(r.name, r.phone);
      if (existing.has(key)) {
        skippedExisting++;
        continue;
      }
      existing.add(key);
      upsertFamily({
        ...emptyFamily(),
        id: nextId('f'),
        createdAt: isoToday(),
        name: r.name,
        father: r.father,
        mother: r.mother,
        phone: normalizePhone(r.phone),
        city: r.city,
      });
      added++;
    }
    setSummary(
      `נוספו ${added} משפחות` +
        (skippedExisting ? ` · ${skippedExisting} דולגו (כבר קיימות)` : '') +
        (skippedNoName ? ` · ${skippedNoName} שורות ללא שם דולגו` : ''),
    );
    toast('נוספו ' + added + ' משפחות');
    if (added) setCsv('');
  }

  return (
    <Section
      id="sec-import"
      title="⬆ ייבוא נתונים"
      sub="קליטת משפחות ובני משפחה מהמערכת הישנה — קובץ גיבוי JSON, הדבקת CSV או ייבוא ילדים חכם מ-CSV"
    >
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

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>מקובץ גיבוי (JSON)</h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
        בחרו קובץ גיבוי של המערכת הישנה — משפחות ובני המשפחה שלהן יתווספו למערכת. משפחות שכבר
        קיימות (לפי שם וטלפון) לא ייובאו שוב. הנתונים הקיימים אינם נדרסים — לשחזור מלא השתמשו
        בסקשן "גיבוי ושחזור".
      </p>
      <label className="btn" style={{ cursor: 'pointer', marginBottom: 18, display: 'inline-flex' }}>
        בחירת קובץ JSON…
        <input
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={(e) => void onJsonFile(e)}
        />
      </label>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '10px 0 6px' }}>מהדבקת CSV</h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
        קובץ אקסל? שמרו קודם בתור CSV (קובץ ← שמירה בשם ← CSV), פתחו בפנקס רשימות והדביקו כאן.
        שורה לכל משפחה, בסדר הזה: <b>שם משפחה, שם האב, שם האם, טלפון, עיר</b>.
      </p>
      <Field label="שורות CSV">
        <textarea
          rows={5}
          dir="rtl"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={'כהן, אברהם, שרה, 050-1234567, ירושלים\nלוי, יעקב, רבקה, 052-7654321, בני ברק'}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Field>
      <Btn kind="primary" onClick={importCsv} disabled={!csv.trim()}>
        ייבוא המשפחות מהרשימה
      </Btn>

      <KidsImport />

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '18px 0 6px' }}>תומכות (CSV)</h3>
      <SupporterImport />

      <SectionNote>אחרי הייבוא אפשר להשלים לכל משפחה את שאר הפרטים ובני המשפחה במסך המשפחות.</SectionNote>
    </Section>
  );
}

/* ── ייבוא ילדים (CSV) — התאמת הורים חכמה בשני שלבים ────────────────────── */

type PendMember = Omit<Member, 'id'>;

interface KidRow {
  first: string;
  surname: string;
  city: string;
  phone: string;
  m: PendMember;
}

interface KidsPreview {
  matched: (KidRow & { famId: string; famName: string; how: string })[];
  unmatched: KidRow[];
  ambiguous: { surname: string; first: string; count: number }[];
  /** ספירת התאמות לפי שיטת הזיהוי. */
  hows: Record<string, number>;
}

/** נרמול שם להשוואה — נרמול חיפוש עברי + הסרת רווחים (כמו normName במקור). */
function normName(s: string): string {
  return normSearch(s).replace(/\s/g, '');
}

/** קריאת קובץ טקסט: UTF-8, ואם זוהו תווי החלפה (�) — ניסיון שני ב-windows-1255. */
async function readTextFile(file: File): Promise<string> {
  const txt = await file.text();
  if (!txt.includes('�')) return txt;
  return new Promise<string>((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(String(rd.result));
    rd.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    rd.readAsText(file, 'windows-1255');
  });
}

function KidsImport() {
  const setDb = useApp((s) => s.setDb);
  const toast = useApp((s) => s.toast);

  const [csv, setCsv] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [preview, setPreview] = useState<KidsPreview | null>(null);

  /** שלב 1 — פענוח, זיהוי עמודות והתאמת משפחה לכל שורה. לא משנה נתונים. */
  function analyze(text: string) {
    setError('');
    setSummary('');
    setPreview(null);

    const rows = parseCsv(text);
    if (!rows.length) {
      setError('הטקסט ריק או לא בפורמט CSV');
      return;
    }
    const clean = (x: string | undefined) => (x ?? '').replace(/\s+/g, ' ').trim();
    const digits = (x: string | undefined) => (x ?? '').replace(/\D/g, '');

    // זיהוי עמודות לפי שמות הכותרות — סדר העמודות גמיש
    const header = (rows[0] ?? []).map((h) => clean(h));
    const hIdx = (keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
    const isIdCol = (h: string) => /ת\.?["'״׳]?ז|זהות|מזהה/.test(h);
    let iFam = hIdx(['שם משפחה', 'משפחה']);
    let iFirst = hIdx(['שם פרטי', 'פרטי', 'שם הילד']);
    if (iFirst < 0) iFirst = header.findIndex((h) => h === 'שם');
    const iParentId = header.findIndex((h) => isIdCol(h) && /(הורה|אם|אב|משפחה)/.test(h));
    const iChildId = header.findIndex((h) => isIdCol(h) && !/(הורה|אם|אב|משפחה)/.test(h));
    const iPhone = hIdx(['טלפון']);
    const iMother = hIdx(['שם האם', 'האם']);
    const iCity = hIdx(['עיר']);
    const iBirth = hIdx(['לידה']);
    const iGen = hIdx(['מין', 'מגדר']);
    const iSchool = hIdx(['בית ספר', 'ביה"ס', 'מוסד']);
    const iGrade = hIdx(['כיתה']);

    // אין שורת כותרות מזוהה — הנחת ברירת מחדל: עמודה 0 משפחה, עמודה 1 שם פרטי
    let start = 1;
    if (iFam < 0 && iFirst < 0) {
      iFam = 0;
      iFirst = 1;
      start = 0;
    }
    const data = rows.slice(start);
    if (!data.length) {
      setError('אין שורות נתונים מתחת לשורת הכותרות');
      return;
    }

    const fams = useApp.getState().db.families;
    const out: KidsPreview = { matched: [], unmatched: [], ambiguous: [], hows: {} };

    for (const r of data) {
      const surname = iFam >= 0 ? clean(r[iFam]) : '';
      const first = clean(iFirst >= 0 ? r[iFirst] : r[1]);
      if (!first) continue;

      // התאמת משפחה — לפי סדר עדיפות: ת"ז הורה ← טלפון ← שם משפחה (+שם האם/+עיר)
      let target: Family | null = null;
      let how = '';
      const pid = iParentId >= 0 ? digits(r[iParentId]) : '';
      if (pid.length >= 5) {
        const hits = fams.filter((f) => digits(f.fatherId) === pid || digits(f.motherId) === pid);
        if (hits.length === 1) {
          target = hits[0];
          how = 'ת"ז הורה';
        }
      }
      if (!target && iPhone >= 0) {
        const ph = digits(r[iPhone]);
        if (ph.length >= 7) {
          const hits = fams.filter((f) => digits(f.phone) === ph || digits(f.phone2) === ph);
          if (hits.length === 1) {
            target = hits[0];
            how = 'טלפון';
          }
        }
      }
      const nf = normName(surname);
      if (!target && nf) {
        let hits = fams.filter((f) => normName(f.name) === nf);
        if (hits.length > 1 && iMother >= 0 && clean(r[iMother])) {
          const nm = normName(clean(r[iMother]));
          const h2 = hits.filter((f) => {
            const fm = normName(f.mother);
            return !!fm && !!nm && (fm.includes(nm) || nm.includes(fm));
          });
          if (h2.length) {
            hits = h2;
            how = 'שם משפחה + שם האם';
          }
        }
        if (hits.length > 1 && iCity >= 0 && clean(r[iCity])) {
          const h3 = hits.filter((f) => f.city === clean(r[iCity]));
          if (h3.length) {
            hits = h3;
            how = how || 'שם משפחה + עיר';
          }
        }
        if (hits.length === 1) {
          target = hits[0];
          how = how || 'שם משפחה (יחיד)';
        } else if (hits.length > 1) {
          out.ambiguous.push({ surname, first, count: hits.length });
          continue;
        }
      }

      const gr = clean(iGen >= 0 ? r[iGen] : '');
      const m: PendMember = {
        ...emptyMember(),
        first,
        gender: /בת|נק|f|ילדה/i.test(gr) ? 'f' : 'm',
        birth: parseAnyDate(iBirth >= 0 ? (r[iBirth] ?? '') : ''),
        idNum: iChildId >= 0 ? digits(r[iChildId]) : '',
        school: clean(iSchool >= 0 ? r[iSchool] : ''),
        grade: clean(iGrade >= 0 ? r[iGrade] : ''),
      };
      const row: KidRow = {
        first,
        surname,
        city: clean(iCity >= 0 ? r[iCity] : ''),
        phone: iPhone >= 0 ? clean(r[iPhone]) : '',
        m,
      };
      if (target) {
        out.matched.push({ ...row, famId: target.id, famName: target.name, how });
        out.hows[how] = (out.hows[how] ?? 0) + 1;
      } else {
        out.unmatched.push(row);
      }
    }

    if (!out.matched.length && !out.unmatched.length && !out.ambiguous.length) {
      setError('לא נמצאו שורות ילדים תקינות — ודאו שיש עמודת שם פרטי');
      return;
    }
    setPreview(out);
  }

  async function onCsvFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const txt = await readTextFile(file);
      setCsv(txt);
      analyze(txt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
    }
  }

  /** שלב 2 — החלה: הוספת הילדים למשפחות שנמצאו ויצירת משפחות חדשות לשאר. */
  function apply() {
    if (!preview) return;
    const { matched, unmatched } = preview;
    if (!matched.length && !unmatched.length) return;
    let newFams = 0;
    // עדכון אטומי אחד — מזהים חדשים לכל ילד ולכל משפחה (מונע התנגשות מזהים)
    setDb((db) => {
      let seq = db.seq;
      const byFam = new Map<string, PendMember[]>();
      for (const x of matched) {
        const arr = byFam.get(x.famId) ?? [];
        arr.push(x.m);
        byFam.set(x.famId, arr);
      }
      let families = db.families.map((f) => {
        const add = byFam.get(f.id);
        return add
          ? { ...f, members: [...f.members, ...add.map((m) => ({ ...m, id: 'm' + seq++ }))] }
          : f;
      });
      // ללא התאמה — משפחה חדשה; אחים באותו קובץ (שם+טלפון+עיר) מקובצים למשפחה אחת
      const groups = new Map<string, { surname: string; city: string; phone: string; ms: PendMember[] }>();
      for (const u of unmatched) {
        const key = normName(u.surname) + '|' + normalizePhone(u.phone) + '|' + u.city;
        const g = groups.get(key) ?? { surname: u.surname, city: u.city, phone: u.phone, ms: [] };
        g.ms.push(u.m);
        groups.set(key, g);
      }
      const fresh: Family[] = [...groups.values()].map((g) => ({
        ...emptyFamily(),
        id: 'f' + seq++,
        createdAt: isoToday(),
        name: g.surname || '—',
        city: g.city,
        phone: normalizePhone(g.phone),
        members: g.ms.map((m) => ({ ...m, id: 'm' + seq++ })),
      }));
      newFams = fresh.length;
      families = [...families, ...fresh];
      return { seq, families };
    });
    const total = matched.length + unmatched.length;
    setPreview(null);
    setCsv('');
    setSummary(
      'יובאו ' + total + ' ילדים — ' + matched.length + ' למשפחות קיימות' +
        (newFams ? ' · נוצרו ' + newFams + ' משפחות חדשות' : '') +
        (preview.ambiguous.length ? ' · ' + preview.ambiguous.length + ' דו-משמעיים דולגו' : ''),
    );
    toast('יובאו ' + total + ' ילדים');
  }

  const howLine = preview
    ? Object.entries(preview.hows)
        .map(([k, v]) => k + ': ' + v)
        .join(' · ')
    : '';

  const resultChip = (bg: string, c: string, text: string) => (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 700,
        background: bg,
        color: c,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );

  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '10px 0 6px' }}>ילדים (CSV)</h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
        קובץ CSV עם שורת כותרות — סדר העמודות גמיש, העמודות מזוהות לפי הכותרת:{' '}
        <b>שם / שם פרטי · משפחה / שם משפחה · ת"ז הורה · טלפון · עיר · תאריך לידה · בית ספר · כיתה</b>{' '}
        (וגם: שם האם, מין/מגדר, ת"ז הילד). לכל שורה מאותרת המשפחה לפי ת"ז הורה ← טלפון ← שם
        משפחה+שם האם ← שם משפחה+עיר; ילדים ללא משפחה קיימת יקבלו משפחה חדשה.
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex' }}>
          בחירת קובץ CSV…
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            style={{ display: 'none' }}
            onChange={(e) => void onCsvFile(e)}
          />
        </label>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>או הדביקו למטה</span>
      </div>
      <Field label="שורות CSV (כולל שורת הכותרות)">
        <textarea
          rows={5}
          dir="rtl"
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setPreview(null);
          }}
          placeholder={'שם פרטי,שם משפחה,ת"ז הורה,טלפון,עיר,תאריך לידה,בית ספר,כיתה\nדוד,כהן,012345678,050-1234567,ירושלים,12/03/2018,תלמוד תורה,ב'}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Field>
      <Btn onClick={() => analyze(csv)} disabled={!csv.trim()}>
        בדיקת התאמות (שלב 1)
      </Btn>

      {preview && (
        <div style={{ marginTop: 12, border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>
            {'זוהו ' + (preview.matched.length + preview.unmatched.length + preview.ambiguous.length) + ' שורות ילדים: '}
            {'✓ ' + preview.matched.length + ' נמצאה משפחה · ' +
              preview.unmatched.length + ' לא נמצאה — תיווצר חדשה · ' +
              preview.ambiguous.length + ' דו-משמעי — דלג'}
          </div>
          {howLine && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 6 }}>
              שיטות זיהוי — {howLine}
            </div>
          )}
          <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 10 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ילד/ה</th>
                  <th>משפחה בקובץ</th>
                  <th>תוצאה</th>
                </tr>
              </thead>
              <tbody>
                {preview.matched.map((x, i) => (
                  <tr key={'m' + i}>
                    <td style={{ fontWeight: 600 }}>{x.first}</td>
                    <td>{x.surname || '—'}</td>
                    <td>{resultChip('#e4f5ea', '#12803c', '✓ משפחת ' + x.famName + ' (' + x.how + ')')}</td>
                  </tr>
                ))}
                {preview.unmatched.map((x, i) => (
                  <tr key={'u' + i}>
                    <td style={{ fontWeight: 600 }}>{x.first}</td>
                    <td>{x.surname || '—'}</td>
                    <td>{resultChip('#fdf1d4', '#9a6414', 'לא נמצאה — תיווצר משפחה חדשה')}</td>
                  </tr>
                ))}
                {preview.ambiguous.map((x, i) => (
                  <tr key={'a' + i}>
                    <td style={{ fontWeight: 600 }}>{x.first}</td>
                    <td>{x.surname || '—'}</td>
                    <td>{resultChip('#fdeaea', '#b91c1c', 'דו-משמעי (' + x.count + ' משפחות) — דלג')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.ambiguous.length > 0 && (
            <div style={{ fontSize: 12.5, color: '#b91c1c', marginBottom: 8 }}>
              ⚠ לשורות הדו-משמעיות הוסיפו עמודת ת"ז הורה או טלפון לזיהוי חד-משמעי — הן לא ייובאו.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn
              kind="primary"
              onClick={apply}
              disabled={!preview.matched.length && !preview.unmatched.length}
            >
              {'אישור ייבוא (' + (preview.matched.length + preview.unmatched.length) + ' ילדים)'}
            </Btn>
            <Btn onClick={() => setPreview(null)}>ביטול</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
