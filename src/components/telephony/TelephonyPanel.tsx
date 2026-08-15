// ─────────────────────────────────────────────────────────────────────────────
// telephony · Panel — המקטע החי באשף-ההקמה שמחווט את מנוע-הטלפוניה לכפתורים.
//
// המטמיע יושב מול הלקוח, מזין את **ציוד-הלקוח** (מספרים, שעות-משרד, שלוחות,
// מצב-כשר/לוח-עברי), לוחץ "👁️ תצוגה מקדימה" — ורואה **חי בדפדפן** איך עץ-הטלפון
// יתנהג (בשעות/אחרי-שעות/שבת) + **דוח-אמון** (ציון A–F), ולבסוף מפיק את
// קונפיג-המרכזייה להורדה. אין PBX בצד-הלקוח — הכול סימולציה טהורה.
//
// המוֹאט (pure-downstream): כל השדות מתארים ציוד-שהלקוח כבר מחזיק — SIM בשער-GSM,
// הפניית-לקוח, קישור-מכשיר-ווצאפ. אין ספק/API/trunk. אין הנפקת-קבלות. קריאה-בלבד.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { Btn, Chip, Field, Select, TextInput } from '../ui';
import { downloadTextFile } from '../builder/handoff';
import {
  emptyTelephonyConfig,
  previewTelephony,
  toTenantId,
  type TelNumber,
  type TelephonyConfig,
  type TelephonyPreview,
} from './lib';

const DOW_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'];
const KIND_OPTIONS: { value: TelNumber['kind']; label: string }[] = [
  { value: 'sim', label: 'SIM בשער-GSM' },
  { value: 'virtual', label: 'הפניית-לקוח' },
  { value: 'whatsapp', label: 'קישור-ווצאפ' },
];
/** ערי-עוגן לזמנים (מפתחות שהמנוע מכיר); '' = ברירת-מחדל (יום-שלם). */
const CITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'ללא (יום-שלם)' },
  { value: 'jerusalem', label: 'ירושלים' },
  { value: 'telaviv', label: 'תל אביב' },
  { value: 'haifa', label: 'חיפה' },
  { value: 'beersheva', label: 'באר שבע' },
  { value: 'bneibrak', label: 'בני ברק' },
];

const OUTCOME_LABEL: Record<string, string> = {
  office: '📞 מצלצל במשרד',
  manager: '📱 מנהל',
  voicemail: '🔊 תא-קולי',
  afterhours: '🌙 אחרי-שעות',
  closed: '🚫 סגור (חג/שבת)',
  'non-kosher-blocked': '🚫 חסום (לא-כשר)',
  invalid: '⚠️ תצורה לא-תקינה',
};
const outcomeLabel = (o: string) => OUTCOME_LABEL[o] ?? o;

let uidSeq = 0;
const newNumberId = () => `n${Date.now().toString(36)}${(uidSeq++).toString(36)}`;

/** שורת-מספר — טלפון + תווית + טיב + דגל-כשר + הסרה. */
function NumberRow(props: {
  n: TelNumber;
  onChange: (patch: Partial<TelNumber>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { n } = props;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto',
        gap: 6,
        alignItems: 'center',
        border: '1px solid var(--line-soft)',
        borderRadius: 8,
        padding: 8,
        marginBottom: 6,
      }}
    >
      <Field label="מספר (כפי שהלקוח מחזיק)">
        <TextInput value={n.e164} onChange={(v) => props.onChange({ e164: v })} dir="ltr" placeholder="02-5551234" />
      </Field>
      <Field label="תווית">
        <TextInput value={n.label} onChange={(v) => props.onChange({ label: v })} placeholder="קו ראשי" />
      </Field>
      <div style={{ alignSelf: 'end', paddingBottom: 6 }}>
        <Btn sm kind="danger" onClick={props.onRemove} disabled={!props.canRemove} title="הסרת מספר">
          ✕
        </Btn>
      </div>
      <Field label="סוג הקו">
        <Select
          value={n.kind}
          onChange={(v) => props.onChange({ kind: v as TelNumber['kind'] })}
          options={KIND_OPTIONS}
        />
      </Field>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-soft)', alignSelf: 'end', paddingBottom: 8 }}
      >
        <input
          type="checkbox"
          checked={!!n.kosher}
          onChange={(e) => props.onChange({ kosher: e.target.checked })}
          style={{ width: 'auto', accentColor: 'var(--accent-deep)' }}
        />
        קו כשר (יציאה מותרת במצב-כשר)
      </label>
      <span />
    </div>
  );
}

/** מתג-דגל קטן (Chip on/off) עם תווית. */
function Toggle(props: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Chip on={props.on} onClick={props.onClick}>
      {props.children}
    </Chip>
  );
}

export function TelephonyPanel(props: { orgName: string; slug: string }) {
  const [tc, setTc] = useState<TelephonyConfig>(() => emptyTelephonyConfig());
  const [preview, setPreview] = useState<TelephonyPreview | null>(null);
  const [busy, setBusy] = useState(false);

  const tenantId = useMemo(() => toTenantId(props.slug, props.orgName), [props.slug, props.orgName]);
  const orgName = props.orgName || 'ארגון';

  const set = (patch: Partial<TelephonyConfig>) => {
    setTc((cur) => ({ ...cur, ...patch }));
    setPreview(null); // שינוי-תצורה מבטל תצוגה-קודמת (שלא תטעה)
  };
  const patchNumber = (id: string, patch: Partial<TelNumber>) =>
    set({ numbers: tc.numbers.map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  const addNumber = () =>
    set({ numbers: [...tc.numbers, { id: newNumberId(), e164: '', label: 'קו נוסף', kind: 'sim' }] });
  const removeNumber = (id: string) => set({ numbers: tc.numbers.filter((n) => n.id !== id) });
  const toggleDay = (d: number) =>
    set({
      officeDays: tc.officeDays.includes(d)
        ? tc.officeDays.filter((x) => x !== d)
        : [...tc.officeDays, d].sort((a, b) => a - b),
    });

  const runPreview = () => {
    setBusy(true);
    // חישוב סינכרוני (המנוע טהור) — עוטפים ב-try כדי שכשל-לוגי לא ישבור את האשף.
    try {
      setPreview(previewTelephony(tc, orgName, tenantId));
    } catch (err) {
      setPreview({
        ok: false,
        errors: ['שגיאה בחישוב התצוגה: ' + (err instanceof Error ? err.message : String(err))],
        warnings: [],
        rows: [],
        trust: null,
        files: null,
      });
    } finally {
      setBusy(false);
    }
  };

  const generate = () => {
    const p = preview ?? previewTelephony(tc, orgName, tenantId);
    if (!p.ok || !p.files) {
      setPreview(p);
      return;
    }
    // קובץ-מסירה יחיד: מפת path→תוכן (המפעיל מממש דרך `tel.mjs apply`). לא PBX בצד-לקוח.
    const bundle = JSON.stringify({ tenantId, orgName, generatedFor: 'FreeSWITCH/FusionPBX', files: p.files }, null, 2);
    downloadTextFile(`pbx-${tenantId}.json`, bundle, 'application/json');
  };

  const trust = preview?.trust ?? null;
  const gradeColor =
    trust?.grade === 'A' || trust?.grade === 'B'
      ? 'var(--ok, #0e7a6c)'
      : trust?.grade === 'C'
        ? 'var(--warn, #b7791f)'
        : 'var(--danger, #b3362a)';

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '2px 0 10px' }}>
        איחוד-הטלפוניה של הארגון — <b>downstream בלבד</b>: הלקוח שומר את הקווים שלו (SIM בשער / הפניה / ווצאפ),
        והמערכת בונה את עץ-הטלפון מעליהם. בלי ספק חדש, בלי מרכזייה בענן. כאן מזינים, מדמים, ומפיקים קונפיג.
      </div>

      {/* ————— מספרי-הקווים ————— */}
      <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 6px' }}>☎️ קווי הארגון</div>
      {tc.numbers.map((n) => (
        <NumberRow
          key={n.id}
          n={n}
          onChange={(patch) => patchNumber(n.id, patch)}
          onRemove={() => removeNumber(n.id)}
          canRemove={tc.numbers.length > 1}
        />
      ))}
      <Btn sm onClick={addNumber}>➕ הוספת קו</Btn>

      {/* ————— שעות-משרד ————— */}
      <div style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 6px' }}>🕐 שעות המשרד</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {DOW_LABELS.map((lbl, d) => (
          <Toggle key={d} on={tc.officeDays.includes(d)} onClick={() => toggleDay(d)}>
            {lbl}
          </Toggle>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 120px' }}>
          <Field label="פתיחה">
            <TextInput value={tc.officeStart} onChange={(v) => set({ officeStart: v })} dir="ltr" placeholder="09:00" />
          </Field>
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <Field label="סגירה">
            <TextInput value={tc.officeEnd} onChange={(v) => set({ officeEnd: v })} dir="ltr" placeholder="17:00" />
          </Field>
        </div>
      </div>

      {/* ————— שלוחות + עיר ————— */}
      <div style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 6px' }}>📇 שלוחות ותא-קולי</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 100px' }}>
          <Field label="שלוחת-משרד">
            <TextInput value={tc.officeExt} onChange={(v) => set({ officeExt: v })} dir="ltr" placeholder="101" />
          </Field>
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <Field label="שלוחת-מנהל">
            <TextInput value={tc.managerExt} onChange={(v) => set({ managerExt: v })} dir="ltr" placeholder="201" />
          </Field>
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <Field label="תיבת תא-קולי">
            <TextInput value={tc.vmBox} onChange={(v) => set({ vmBox: v })} dir="ltr" placeholder="100" />
          </Field>
        </div>
      </div>
      <Field label="עיר לזמנים (הדלקת-נרות/צאת — לחלונות-חג מדויקים)">
        <Select value={tc.city} onChange={(v) => set({ city: v })} options={CITY_OPTIONS} />
      </Field>

      {/* ————— דגלי-לוח ————— */}
      <div style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 6px' }}>📅 סגירות אוטומטיות</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Toggle on={tc.hebrewCalendar} onClick={() => set({ hebrewCalendar: !tc.hebrewCalendar })}>
          לוח עברי (חגים)
        </Toggle>
        <Toggle on={tc.shabbat} onClick={() => set({ shabbat: !tc.shabbat })}>סגירת שבת</Toggle>
        <Toggle on={tc.fasts} onClick={() => set({ fasts: !tc.fasts })}>סגירת צומות</Toggle>
        <Toggle on={tc.zmanim} onClick={() => set({ zmanim: !tc.zmanim })}>זמנים מדויקים</Toggle>
        <Toggle on={tc.voicemail} onClick={() => set({ voicemail: !tc.voicemail })}>תא-קולי</Toggle>
        <Toggle on={tc.kosherMode} onClick={() => set({ kosherMode: !tc.kosherMode })}>מצב כשר (יציאה)</Toggle>
      </div>

      {/* ————— כפתורים ————— */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        <Btn kind="primary" onClick={runPreview} disabled={busy}>
          👁️ תצוגה מקדימה של עץ-הטלפון
        </Btn>
        <Btn onClick={generate} disabled={busy}>📦 הפק קונפיג-מרכזייה</Btn>
      </div>

      {/* ————— תוצאות ————— */}
      {preview && !preview.ok && (
        <div
          role="alert"
          style={{ marginTop: 12, border: '1px solid var(--danger, #b3362a)', borderRadius: 8, padding: 10, fontSize: 12.5 }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ התצורה לא-תקינה — לא ניתן להפיק:</div>
          <ul style={{ margin: 0, paddingInlineStart: 18 }}>
            {preview.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {preview && preview.ok && (
        <div style={{ marginTop: 12, border: '1px solid var(--line)', borderRadius: 10, padding: 12, background: 'var(--bg)' }}>
          {/* דוח-אמון */}
          {trust && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: gradeColor,
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-hidden
              >
                {trust.grade}
              </div>
              <div style={{ fontSize: 12.5 }}>
                <div style={{ fontWeight: 700 }}>
                  דוח-אמון: {trust.score}/100 · {trust.ready ? '✅ מוכן להפעלה' : '⚠️ דורש תשומת-לב'}
                </div>
                {trust.failing.length > 0 && (
                  <div style={{ color: 'var(--ink-faint)', marginTop: 2 }}>
                    {trust.failing.map((c) => c.label).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* טבלת-תרחישים */}
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>איך זה יתנהג:</div>
          <div style={{ display: 'grid', gap: 4 }}>
            {preview.rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontSize: 12.5,
                  padding: '5px 8px',
                  borderRadius: 6,
                  background: 'var(--panel)',
                }}
              >
                <span style={{ color: 'var(--ink-soft)' }}>{r.when}</span>
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{outcomeLabel(r.outcome)}</span>
              </div>
            ))}
          </div>

          {preview.warnings.length > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
              הערות: {preview.warnings.join(' · ')}
            </div>
          )}
          {preview.files && (
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
              📦 {Object.keys(preview.files).length} קבצי-קונפיג מוכנים · מזהה-דייר <code dir="ltr">{tenantId}</code>
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 12, lineHeight: 1.6 }}>
        קונפיג-המרכזייה מיועד ל-FreeSWITCH/FusionPBX אצל <b>המפעיל</b> (לא בדפדפן). ההתקנה, הסודות
        (סיסמאות-SIM/הקלטה) והפעלת-החומרה מבוצעים בצד-השרת. המערכת אף-פעם לא מנפיקה קבלות-מס.
      </div>
    </div>
  );
}
