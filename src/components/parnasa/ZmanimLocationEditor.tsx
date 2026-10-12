/**
 * 📒 פרנסה׳לע — עריכת מיקום-הזמנים של הקהילה (אשכול 5; תיקון מול המקור — שם zmLat/zmLng/zmCandle/
 * zmTzeit/zmCity נקראו מההגדרות בלי שום ממשק). עיר מטבלת מנוע-הזמנים או נ״צ מותאם; דקות-הדלקה/צאת;
 * אזור-זמן (ברירת Asia/Jerusalem — לא שעון-המכשיר). תצוגה-מקדימה חיה של נץ/שקיעה היום. גבאי בלבד
 * (setParnasaPrefs נאכף ב-store); הערך מחוטא ב-healParnasaPrefs.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import type { ParnasaZmanimPrefs } from '../../types/domain';
import { CITIES } from '../../lib/telephony/engine';
import { Btn, Field, Select, TextInput } from '../ui';
import { dayTimes, locNote, PR_DEFAULT_CITY, PR_TZ, PR_TZEIS_MIN, resolveZmanimLoc } from './zmanimBoard';
import { usePrNow } from './hooks';

const num = (s: string): number | undefined => {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

export function ZmanimLocationEditor() {
  const saved = useApp((s) => s.db.ui.parnasa?.zmanim);
  const setParnasaPrefs = useApp((s) => s.setParnasaPrefs);
  const toast = useApp((s) => s.toast);
  const now = usePrNow();
  const [mode, setMode] = useState<'city' | 'geo'>(() => (saved?.lat !== undefined && saved?.lon !== undefined ? 'geo' : 'city'));
  const [f, setF] = useState(() => ({
    city: saved?.city ?? PR_DEFAULT_CITY,
    lat: saved?.lat !== undefined ? String(saved.lat) : '',
    lon: saved?.lon !== undefined ? String(saved.lon) : '',
    label: saved?.label ?? '',
    candleMin: saved?.candleMin !== undefined ? String(saved.candleMin) : '',
    tzeisMin: saved?.tzeisMin !== undefined ? String(saved.tzeisMin) : '',
    tz: saved?.tz ?? '',
    elevation: saved?.elevation !== undefined ? String(saved.elevation) : '',
  }));

  const draft: ParnasaZmanimPrefs = {
    ...(mode === 'city' ? { city: f.city } : { lat: num(f.lat), lon: num(f.lon) }),
    label: f.label.trim() || undefined,
    candleMin: num(f.candleMin),
    tzeisMin: num(f.tzeisMin),
    tz: f.tz.trim() || undefined,
    elevation: num(f.elevation),
  };
  const preview = resolveZmanimLoc(draft);
  const t = dayTimes(now.todayIso, preview);
  const cityDefault = CITIES[mode === 'city' ? f.city : PR_DEFAULT_CITY];

  function save() {
    if (mode === 'geo' && (draft.lat === undefined || draft.lon === undefined)) {
      toast('נ״צ מותאם — הזינו קו-רוחב וקו-אורך');
      return;
    }
    // מפתחות ריקים לא נשמרים (= ברירת-המחדל של המנוע)
    const clean = Object.fromEntries(Object.entries(draft).filter(([, v]) => v !== undefined)) as ParnasaZmanimPrefs;
    if (setParnasaPrefs({ zmanim: clean })) toast('מיקום הזמנים נשמר — ' + locNote(resolveZmanimLoc(clean)));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="form-grid">
        <Field label="מיקום">
          <Select
            value={mode === 'city' ? f.city : '__geo'}
            onChange={(v) => {
              if (v === '__geo') setMode('geo');
              else {
                setMode('city');
                setF({ ...f, city: v });
              }
            }}
            options={[
              ...Object.entries(CITIES).map(([k, c]) => ({ value: k, label: c.he })),
              { value: '__geo', label: '📍 נ״צ מותאם' },
            ]}
          />
        </Field>
        {mode === 'geo' && (
          <>
            <Field label="קו רוחב (lat)">
              <TextInput value={f.lat} onChange={(v) => setF({ ...f, lat: v })} dir="ltr" placeholder="32.084" />
            </Field>
            <Field label="קו אורך (lon)">
              <TextInput value={f.lon} onChange={(v) => setF({ ...f, lon: v })} dir="ltr" placeholder="34.834" />
            </Field>
          </>
        )}
        <Field label="שם המקום לתצוגה (״לפי אופק …״)">
          <TextInput value={f.label} onChange={(v) => setF({ ...f, label: v.slice(0, 60) })} placeholder={mode === 'city' ? cityDefault?.he ?? '' : 'מיקום מותאם'} />
        </Field>
        <Field label="הדלקת נרות — דקות לפני השקיעה">
          <TextInput value={f.candleMin} onChange={(v) => setF({ ...f, candleMin: v })} dir="ltr" placeholder={'מנהג המקום: ' + preview.candleMin} />
        </Field>
        <Field label="צאת הכוכבים / צאת השבת — דקות אחרי השקיעה">
          <TextInput value={f.tzeisMin} onChange={(v) => setF({ ...f, tzeisMin: v })} dir="ltr" placeholder={String(PR_TZEIS_MIN)} />
        </Field>
        <Field label="אזור זמן">
          <TextInput value={f.tz} onChange={(v) => setF({ ...f, tz: v })} dir="ltr" placeholder={PR_TZ} />
        </Field>
        <Field label="גובה (מ׳) — נשמר; הזמנים מישוריים">
          <TextInput value={f.elevation} onChange={(v) => setF({ ...f, elevation: v })} dir="ltr" placeholder="0" />
        </Field>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
        {locNote(preview) + ' · היום: נץ ' + (t.sunrise || '—') + ' · שקיעה ' + (t.sunset || '—') + ' · הדלקה ' + preview.candleMin + ' דק׳ · צאת ' + preview.tzeisMin + ' דק׳'}
      </div>
      <div>
        <Btn kind="primary" onClick={save}>
          💾 שמירת מיקום הזמנים
        </Btn>
      </div>
    </div>
  );
}
