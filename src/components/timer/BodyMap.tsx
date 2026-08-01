/**
 * מפת אזורי טיפול — מעקב טיפולים לפי אזורי גוף (נאמן לאפליקציית הייחוס:
 * פנים/בית שחי/ידיים/חזה ובטן/ביקיני/רגליים/גב/ישבן + תת-אזורים). לכל אזור
 * מונה "בוצע" ויעד; לחיצה +1 (ימנית −1). בחירת לקוח מתוך רשימת המשפחות, או שם
 * חופשי. מסכם התקדמות כוללת (בוצע/יעד).
 *
 * עצמאי לחלוטין: הנתונים נשמרים ב-localStorage ייעודי (maor_bodymap) לפי מפתח
 * לקוח — לא נוגע בסכמת ה-db ולא ברשומות הקיימות.
 *
 * גייט: core.bodymap. השם ניתן לתיוג דרך nav.bodymap.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { nsLsKey } from '../../store/persist';
import { termOf } from '../../lib/config';
import { Btn, Modal, Select } from '../ui';

// ממורחב-שמות (באג-3): נתוני אזורי-הטיפול הם פר-ארגון, לא משותפים בין ארגונים.
const LS_KEY = 'maor_bodymap';

/** אזורי הגוף ותת-האזורים — מתוך אפליקציית הייחוס. */
const REGIONS: { key: string; label: string; zones: string[] }[] = [
  { key: 'face', label: 'פנים', zones: ['מצח', 'גבות', 'שפם', 'סנטר', 'לחיים', 'פאות'] },
  { key: 'armpit', label: 'בית שחי', zones: ['ימין', 'שמאל'] },
  { key: 'hands', label: 'ידיים', zones: ['זרועות', 'אמות', 'כפות ידיים'] },
  { key: 'chest', label: 'חזה ובטן', zones: ['חזה', 'בטן', 'קו טבור'] },
  { key: 'bikini', label: 'ביקיני', zones: ['קו ביקיני', 'ברזילאי מלא'] },
  { key: 'legs', label: 'רגליים', zones: ['ירכיים', 'ברכיים', 'שוקיים'] },
  { key: 'back', label: 'גב', zones: ['כתפיים', 'גב עליון', 'גב תחתון'] },
  { key: 'buttocks', label: 'ישבן', zones: ['ירכיים אחורי', 'שוקיים אחורי'] },
];

/** מצב לכל אזור: בוצע + יעד. */
interface ZoneState {
  done: number;
  target: number;
}
type ClientMap = Record<string, ZoneState>; // zoneId → state
type Store = Record<string, ClientMap>; // clientKey → zones

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(nsLsKey(LS_KEY));
    const o = raw ? (JSON.parse(raw) as unknown) : {};
    return o && typeof o === 'object' && !Array.isArray(o) ? (o as Store) : {};
  } catch {
    return {};
  }
}

function saveStore(s: Store): void {
  try {
    localStorage.setItem(nsLsKey(LS_KEY), JSON.stringify(s));
  } catch {
    /* חסום */
  }
}

export function BodyMap({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const families = useApp((s) => s.db.families);
  const label = termOf(config, 'nav.bodymap', 'אזורי טיפול');
  const clientWord = termOf(config, 'entity.family', 'לקוח');

  const [store, setStore] = useState<Store>(() => loadStore());
  // מפתח לקוח: id מהמשפחות, או '__free__' לשם חופשי.
  const [clientKey, setClientKey] = useState<string>(() => {
    try {
      const v = sessionStorage.getItem(nsLsKey('maor_bodymap_client'));
      if (v) {
        sessionStorage.removeItem(nsLsKey('maor_bodymap_client'));
        return 'free:' + v;
      }
    } catch {
      /* חסום */
    }
    return families[0] ? 'fam:' + families[0].id : 'free:';
  });

  const clientLabel =
    clientKey.startsWith('fam:')
      ? families.find((f) => 'fam:' + f.id === clientKey)?.name ?? '—'
      : clientKey.slice('free:'.length) || 'ללא שם';

  const zones = store[clientKey] ?? {};

  const bump = (zoneId: string, by: number) => {
    setStore((s) => {
      const cm = { ...s[clientKey] };
      const cur = cm[zoneId] ?? { done: 0, target: 0 };
      cm[zoneId] = { ...cur, done: Math.max(0, cur.done + by) };
      const next = { ...s, [clientKey]: cm };
      saveStore(next);
      return next;
    });
  };
  const setTarget = (zoneId: string, target: number) => {
    setStore((s) => {
      const cm = { ...s[clientKey] };
      const cur = cm[zoneId] ?? { done: 0, target: 0 };
      cm[zoneId] = { ...cur, target: Math.max(0, target) };
      const next = { ...s, [clientKey]: cm };
      saveStore(next);
      return next;
    });
  };

  // סיכום כולל — חישוב זול ישיר (אין צורך ב-memo).
  const totals = { done: 0, target: 0 };
  for (const z of Object.values(zones)) {
    totals.done += z.done;
    totals.target += z.target;
  }

  const clientOptions = [
    ...families.map((f) => ({ value: 'fam:' + f.id, label: f.name })),
    { value: 'free:', label: '— שם חופשי —' },
  ];

  return (
    <Modal title={'🧍 ' + label} onClose={onClose}>
      {/* בורר לקוח */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{clientWord}:</span>
        <div style={{ minWidth: 180 }}>
          <Select value={clientKey.startsWith('fam:') ? clientKey : 'free:'} onChange={setClientKey} options={clientOptions} />
        </div>
        {!clientKey.startsWith('fam:') && (
          <input
            value={clientKey.slice('free:'.length)}
            onChange={(e) => setClientKey('free:' + e.target.value)}
            placeholder="שם"
            style={{ flex: 1, minWidth: 120 }}
          />
        )}
      </div>

      {/* סיכום התקדמות */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '8px 12px',
          borderRadius: 10,
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          marginBottom: 12,
          fontSize: 14,
        }}
      >
        <span style={{ fontWeight: 700 }}>{clientLabel} · טיפולים שבוצעו</span>
        <span style={{ fontWeight: 800, direction: 'ltr' }}>
          {totals.done}
          {totals.target > 0 && <span style={{ color: 'var(--ink-faint)' }}> / {totals.target} יעד</span>}
        </span>
      </div>

      {/* אזורים */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '52vh', overflowY: 'auto' }}>
        {REGIONS.map((r) => (
          <div key={r.key}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{r.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {r.zones.map((z) => {
                const zoneId = r.key + '/' + z;
                const st = zones[zoneId] ?? { done: 0, target: 0 };
                const reached = st.target > 0 && st.done >= st.target;
                return (
                  <div
                    key={zoneId}
                    style={{
                      border: '1px solid ' + (st.done > 0 ? 'var(--accent)' : 'var(--line)'),
                      borderRadius: 10,
                      padding: '6px 8px',
                      minWidth: 96,
                      background: reached ? '#e4f5ea' : 'var(--panel)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{z}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Btn sm onClick={() => bump(zoneId, -1)} aria-label="הפחת">−</Btn>
                      <span style={{ fontWeight: 800, minWidth: 34, textAlign: 'center', direction: 'ltr' }}>
                        {st.done}
                        {st.target > 0 && <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>/{st.target}</span>}
                      </span>
                      <Btn sm kind="primary" onClick={() => bump(zoneId, 1)} aria-label="הוסף">+</Btn>
                      <input
                        type="number"
                        dir="ltr"
                        value={st.target || ''}
                        onChange={(e) => setTarget(zoneId, Number(e.target.value) || 0)}
                        placeholder="יעד"
                        title="יעד טיפולים"
                        style={{ width: 46, fontSize: 12, padding: '2px 4px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Btn kind="primary" onClick={onClose}>שמור וסגור</Btn>
      </div>
    </Modal>
  );
}
