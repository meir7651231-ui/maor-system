/**
 * עורך "טלפונים נוספים" — משותף לתורמים ולמשפחות (בקשת-בעלים 13.10: "תוסיף אפשרות לעוד מספרים").
 * חולץ כמות-שהוא מ-SupporterForm (אותו markup) — כל שורה: מספר · תווית · ממי זה · וואטסאפ · אזור · הסרה.
 * מבוקר: ההורה מחזיק את המערך ושומר דרך cleanSupPhones.
 */
import type { SupPhone } from '../types/domain';
import { useApp } from '../store/useApp';
import { Btn, TextInput } from './ui';
import { phoneRegion } from './supporters/lib';

export function PhonesEditor(props: { phones: SupPhone[]; onChange: (next: SupPhone[]) => void }) {
  const { phones, onChange } = props;
  const nextIdFn = useApp((s) => s.nextId);
  const addPhone = () => onChange([...phones, { id: nextIdFn('ph'), num: '', label: '', note: '', wa: false }]);
  const setPhone = (i: number, patch: Partial<SupPhone>) => onChange(phones.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const removePhone = (i: number) => onChange(phones.filter((_, j) => j !== i));

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--line, #e6ddce)', paddingTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13.5 }}>📞 טלפונים נוספים</span>
        <Btn sm onClick={addPhone}>➕ הוסף טלפון</Btn>
      </div>
      {phones.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--ink-faint, #8a8378)' }}>אפשר להוסיף וואטסאפ, בית, עבודה — עם הערה ממי המספר.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {phones.map((p, i) => {
            const reg = p.num ? phoneRegion(p.num) : null;
            return (
              <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <div style={{ flex: '1 1 140px', minWidth: 120 }}>
                  <TextInput value={p.num} onChange={(v) => setPhone(i, { num: v })} dir="ltr" placeholder="מספר" ariaLabel="מספר טלפון נוסף" />
                </div>
                <div style={{ flex: '0 1 110px' }}>
                  <TextInput value={p.label ?? ''} onChange={(v) => setPhone(i, { label: v })} placeholder="תווית (בית/עבודה)" ariaLabel="תווית" />
                </div>
                <div style={{ flex: '1 1 130px', minWidth: 110 }}>
                  <TextInput value={p.note ?? ''} onChange={(v) => setPhone(i, { note: v })} placeholder="ממי זה" ariaLabel="ממי המספר" />
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={!!p.wa} onChange={(e) => setPhone(i, { wa: e.target.checked })} /> 💬 וואטסאפ
                </label>
                {reg && (
                  <span style={{ fontSize: 11, color: reg === 'intl' ? '#a5651a' : '#2f7d52', fontWeight: 700 }}>{reg === 'intl' ? '🌍 חו"ל' : '🇮🇱 ישראל'}</span>
                )}
                <button type="button" onClick={() => removePhone(i)} aria-label="הסר מספר" title="הסר" style={{ cursor: 'pointer', border: 0, background: 'transparent', fontSize: 15 }}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
