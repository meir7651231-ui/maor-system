import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store.tsx';
import { api, type AmountCheck } from '../api.ts';
import { fmtIls } from '../lib/format.ts';
import { RULES } from '../lib/domain.ts';
import { diffPatch, explainImportError, explainSettingsError, SOURCE_SYSTEMS, sourceLabel, toForm, validate, type DesignSettings, type PayProvider, type SettingsForm } from '../lib/settings.ts';
import { Button, Card, Field, inputCls } from '../components/ui.tsx';

const PAY: [PayProvider, string][] = [['greeninvoice', 'חשבונית ירוקה (morning)'], ['meshulam', 'משולם'], ['bit', 'ביט']];

/**
 * הגדרות עסק. חי: GET/PUT /settings (השרת שומר; dry-run — שום הודעה לא יוצאת). מוק: מסומן במפורש ולא נשמר.
 * כללי המוצר (3 תזכורות, 08–20, אישור לכל הודעה), הסולם והמחיר — קבועים, מוצגים לקריאה בלבד.
 */
export function Settings() {
  const { mode, business, setBusiness, showToast, reload } = useApp();
  const live = mode === 'live';
  const mockForm: SettingsForm = useMemo(() => ({
    business_name: business.name, owner_name: business.ownerName, vat_id: business.vatId, reply_email: business.email,
    sender: business.smsSender, pay_provider: business.payProvider, pay_url: business.payPageUrl,
    source_system: business.sourceSystem ?? (business.dataSource === 'csv' ? 'csv' : 'greeninvoice'),
  }), [business]);
  const [server, setServer] = useState<DesignSettings | null>(null);
  const [orig, setOrig] = useState<SettingsForm>(mockForm);
  const [f, setF] = useState<SettingsForm>(mockForm);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [csvErr, setCsvErr] = useState<string | null>(null);
  const [csv, setCsv] = useState<{ imported: number; credits?: number; date_order?: string; amount_check?: AmountCheck[]; rejected: { row: number; reason: string }[] } | null>(null);

  useEffect(() => {
    if (!live) { setOrig(mockForm); setF(mockForm); return; }
    api.settings().then(s => { setServer(s); setOrig(toForm(s)); setF(toForm(s)); }).catch(e => setLoadErr((e as Error).message));
  }, [live, mockForm]);

  const errs = validate(f);
  const patch = diffPatch(orig, f);
  const dirty = Object.keys(patch).length > 0;
  const set = <K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) => { setF({ ...f, [k]: v }); setSaveErr(null); };
  const cadence = server?.cadence_days ?? business.cadenceDays;

  async function save() {
    setBusy(true); setSaveErr(null);
    try {
      if (live) {
        const s = await api.saveSettings(patch);
        setServer(s); setOrig(toForm(s)); setF(toForm(s));
        await reload(); // שם העסק בהודעות מתעדכן
        showToast('✓ נשמר בשרת');
      } else {
        setBusiness({ ...business, name: f.business_name, ownerName: f.owner_name, vatId: f.vat_id, email: f.reply_email, smsSender: f.sender, payProvider: f.pay_provider, payPageUrl: f.pay_url, sourceSystem: f.source_system, dataSource: f.source_system === 'csv' ? 'csv' : 'api' });
        setOrig(f);
        showToast('נשמר בלשונית הזו בלבד — לא בשרת (מוק)');
      }
    } catch (e) { setSaveErr(explainSettingsError((e as Error).message)); }
    setBusy(false);
  }

  async function importCsv(file: File) {
    setCsv(null); setCsvErr(null);
    try { const r = await api.importCsv(await file.text()); setCsv(r); await reload(); showToast(`יובאו ${r.imported} חשבוניות`); }
    catch (e) { const m = explainImportError((e as { status?: number }).status, (e as Error).message); setCsvErr(m); showToast(m); }
  }

  const err = (k: keyof SettingsForm) => errs[k] ? `⚠️ ${errs[k]}` : undefined;
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-extrabold">הגדרות עסק</h1>
      {live ? (
        <div role="note" data-testid="settings-live" data-loaded={server ? '1' : '0'} className="rounded-2xl border border-brand/40 bg-brand-50 p-4 text-brand-700">
          <b>✓ מחובר לשרת.</b> שינויים נשמרים בשרת ומשפיעים על התזכורות הבאות (מצב בדיקה — שום הודעה לא יוצאת באמת).
        </div>
      ) : (
        <div role="note" data-testid="settings-mock" className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-amber-900">
          <b>🧪 מוק — ההגדרות לא נשמרות בשרת.</b> אין חיבור לשרת גבי. אפשר לנסות את המסך, אבל שינוי כאן לא משפיע על שום דבר ונמחק ברענון.
        </div>
      )}
      {loadErr && <p role="alert" className="text-critical font-bold">לא הצלחנו לטעון את ההגדרות: {loadErr}</p>}

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">פרטי העסק</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="שם העסק (פותח כל הודעה)" hint={err('business_name')}><input className={inputCls} value={f.business_name} onChange={e => set('business_name', e.target.value)} aria-invalid={!!errs.business_name} /></Field>
          <Field label="שם לחתימה" hint={err('owner_name')}><input className={inputCls} value={f.owner_name} onChange={e => set('owner_name', e.target.value)} /></Field>
          <Field label="ע.מ. / ח.פ." hint={err('vat_id')}><input className={`${inputCls} num text-right`} inputMode="numeric" value={f.vat_id} onChange={e => set('vat_id', e.target.value)} /></Field>
          <Field label="מייל לתשובות לקוחות" hint={err('reply_email')}><input className={`${inputCls} num text-right`} type="email" value={f.reply_email} onChange={e => set('reply_email', e.target.value)} /></Field>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">מאיפה מגיעות החשבוניות</h2>
        <p className="text-sm text-ink-500">גבי <b>רק קורא</b> חשבוניות פתוחות ממערכת החשבוניות שלכם. הוא לא יוצר, לא משנה ולא מבטל מסמכים.</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="מערכת החשבוניות" data-testid="source-systems">
          {SOURCE_SYSTEMS.map(o => (
            <button key={o.key} role="radio" aria-checked={f.source_system === o.key} onClick={() => set('source_system', o.key)}
              data-testid={`source-${o.key}`} title={o.note}
              className={`rounded-full px-4 py-2 text-sm font-bold border cursor-pointer ${f.source_system === o.key ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-ink-50 p-3 text-sm" data-testid="source-status">
          {f.source_system === 'csv' ? (
            <>📄 <b>קובץ CSV</b>: מייבאים קובץ חשבוניות פתוחות (למטה). אין סנכרון אוטומטי, ולכן לפני כל תזכורת תתבקשו לאשר שהסכום עדיין פתוח.</>
          ) : (
            <>
              🔌 <b>{sourceLabel(f.source_system)}</b>{f.source_system === 'greeninvoice' && ' (מומלץ)'}:{' '}
              {!live ? 'מוק'
                : f.source_system !== orig.source_system ? 'יתעדכן אחרי שמירה'
                : server?.source.api_connected ? <span className="text-brand-700 font-bold">מחובר (סביבת בדיקה)</span> : 'לא מחובר'}
              <div className="text-xs text-ink-500 mt-1">חיבור מפתח מהמסך — <b>בקרוב</b>. בשלב הבטא המפתח לא נקלט כאן ולא נשמר (כל עסק יחבר מפתח משלו בגרסה הבאה).</div>
              {f.source_system === 'ezcount' && (
                <div className="text-xs text-amber-900 mt-1" data-testid="source-unverified">⚠️ ממשק הקריאה של EZcount עדיין בבדיקה מול הספק. עד שיאומת, אפשר לייבא גם קובץ CSV.</div>
              )}
            </>
          )}
        </div>
        <Field label="📄 חלופה: ייבוא קובץ CSV של חשבוניות פתוחות" hint="עמודות: מספר חשבונית, שם לקוח, טלפון, מייל, סכום/יתרה, תאריך לתשלום. שורה לא תקינה מדווחת ולא מפילה את הקובץ.">
          {/* קלט קובץ נייטיב מציג טקסט באנגלית ⇒ מוסתר, ותווית-כפתור בעברית במקומו */}
          <span className={`inline-flex items-center gap-2 rounded-xl border px-4 h-11 font-bold ${live ? 'border-ink-200 bg-white cursor-pointer hover:bg-ink-50 focus-within:ring-2 focus-within:ring-brand' : 'border-ink-200 bg-ink-100 text-ink-400'}`}>
            📄 בחירת קובץ CSV…
            <input type="file" accept=".csv,text/csv" className="sr-only" disabled={!live} aria-label="קובץ CSV"
              onChange={e => { const file = e.target.files?.[0]; if (file) void importCsv(file); e.target.value = ''; }} />
          </span>
        </Field>
        {!live && <p className="text-xs text-ink-500">ייבוא CSV זמין בחיבור לשרת.</p>}
        {csvErr && <p role="alert" className="mt-2 text-sm text-critical" data-testid="csv-error">⚠️ {csvErr}</p>}
        {csv && (
          <div className="rounded-xl bg-white border border-ink-200 p-3 text-sm" data-testid="csv-result">
            ✓ יובאו <b className="num">{csv.imported}</b> חשבוניות{csv.rejected.length ? ` · ${csv.rejected.length} שורות נדחו:` : ''}
            {csv.rejected.length > 0 && <ul className="mt-1 text-xs text-critical">{csv.rejected.map(r => <li key={r.row}>שורה <span className="num">{r.row}</span>: {r.reason}</li>)}</ul>}
            {csv.date_order === 'mdy' && <p className="mt-1 text-xs text-amber-700" data-testid="csv-date-order">📅 התאריכים בקובץ זוהו בפורמט אמריקאי (חודש/יום) ונקראו כך. אם זו טעות — ייצאו מחדש בפורמט YYYY-MM-DD.</p>}
            {csv.date_order === 'mixed' && <p className="mt-1 text-xs text-amber-700" data-testid="csv-date-order">📅 בקובץ יש גם יום/חודש וגם חודש/יום — שורות עם תאריך דו-משמעי נדחו.</p>}
            {(csv.amount_check?.length ?? 0) > 0 && <div role="alert" className="mt-1 text-xs text-critical" data-testid="csv-amount-check">⚠️ סכום חריג מאוד מהרגיל ללקוח — אולי הנקודה העשרונית במקום הלא נכון? גבי לא תשלח תזכורת עליו עד שתאשרו במפורש:
              <ul className="mt-1">{csv.amount_check!.map(o => <li key={o.number}>חשבונית <span className="num">{o.number || '(ללא מספר)'}</span>: <span className="num">{fmtIls(o.amount_agorot / 100)}</span> (בדרך כלל <span className="num">{fmtIls(o.usual_agorot / 100)}</span>)</li>)}</ul></div>}
            {!!csv.credits && <p className="mt-1 text-xs text-amber-700" data-testid="csv-credits">⏸️ <span className="num">{csv.credits}</span> שורות ביתרה שלילית (זיכוי) — הלקוחות שלהן הושהו לבדיקתך, בלי תזכורת עד שתאשר/י</p>}
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">ערוצי שליחה</h2>
        <div className="rounded-xl bg-ink-50 p-3 text-sm">
          📱 <b>SMS:</b> ספק ראשי <b>019</b>, גיבוי <b>InforU</b> (קבוע; כרגע מצב בדיקה בלבד).<br />
          ✉️ <b>מייל:</b> נוסח מלא עם קישור לתשלום וקישור הסרה.
        </div>
        <Field label="שם השולח ב-SMS" hint={err('sender') ?? 'עד 11 אותיות לועזיות/ספרות, בלי רווחים. נרשם אצל הספק לפני שליחה ראשונה.'}>
          <input className={`${inputCls} num text-right ${errs.sender ? 'border-critical' : ''}`} value={f.sender} maxLength={11} onChange={e => set('sender', e.target.value)} />
        </Field>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-extrabold">קישור לתשלום</h2>
        <p className="text-sm text-ink-500">גבי לא מחזיק כסף. כל תזכורת מובילה לעמוד התשלום של העסק שלכם, והכסף עובר ישירות אליכם.</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="עמוד תשלום">
          {PAY.map(([k, t]) => (
            <button key={k} role="radio" aria-checked={f.pay_provider === k} onClick={() => set('pay_provider', k)}
              className={`rounded-full px-4 py-2 text-sm font-bold border cursor-pointer ${f.pay_provider === k ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200'}`}>{t}</button>
          ))}
        </div>
        <Field label="כתובת עמוד התשלום" hint={err('pay_url') ?? 'https בלבד, ובדומיין של הספק שנבחר (נבדק בשרת).'}>
          <input className={`${inputCls} num text-left ${errs.pay_url ? 'border-critical' : ''}`} value={f.pay_url} onChange={e => set('pay_url', e.target.value)} aria-label="כתובת עמוד התשלום" />
        </Field>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-extrabold">מתי ואיך שולחים</h2>
        <ul className="space-y-1.5 text-sm" data-testid="settings-rules">
          {RULES.map(r => <li key={r} className="flex gap-2"><span className="text-brand-700">🔒</span>{r}</li>)}
        </ul>
        <p className="text-sm">סולם התזכורות (ימים אחרי מועד התשלום): {cadence.map((d, i) => <span key={i}>{i > 0 && ' · '}<b className="num">+{d}</b></span>)}</p>
        <p className="text-xs text-ink-500">כללים קבועים של המוצר — לא ניתנים לשינוי.</p>
      </Card>

      <div className="flex flex-wrap items-center gap-3 sticky bottom-4 bg-paper/90 backdrop-blur rounded-xl p-2">
        <Button disabled={busy || !dirty || Object.keys(errs).length > 0} onClick={save} data-testid="settings-save">
          {live ? 'שמירה בשרת' : 'שמירה בלשונית בלבד (מוק)'}
        </Button>
        <Button variant="ghost" disabled={!dirty} onClick={() => { setF(orig); setSaveErr(null); }}>ביטול שינויים</Button>
        {dirty && !saveErr && <span className="text-sm text-ink-500">יש שינויים שלא נשמרו</span>}
        {saveErr && <span role="alert" className="text-sm text-critical font-bold" data-testid="settings-error">לא נשמר: {saveErr}</span>}
      </div>
    </div>
  );
}
