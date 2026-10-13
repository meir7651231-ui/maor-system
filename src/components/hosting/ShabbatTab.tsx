/**
 * 🕯️ אירוח שבת וכשרות (viewShabbat של המקור): מצב-שבת (כבוי/הכנות/שבת/מוצאי שבת — באנר בכל מסך), זמני כניסה/צאת,
 * רמת-כשרות + משגיח, וטבלת חבילות-שבת להזמנות הקרובות — "＋ חבילת שבת" (חיוב 250 + הזמנת-מטבח, אידמפוטנטי — F9) /
 * "מוכן ✓". ⬆ סימון "שוהים בשבת/יו״ט" מהלוח העברי הקיים. hosting.shabbat. "המערכת אינה קובעת הלכה".
 */
import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import type { HostShabbatMode } from '../../types/domain';
import { useHostData, useHostEnv } from './hooks';
import { FInput, Pill, h } from './hui';
import { blocksAvailability, fmtDM, staySacredDays } from './lib';
import { SB_MODE } from './labels';

const MODES: HostShabbatMode[] = ['off', 'prep', 'shabbat', 'motzash'];

export function ShabbatTab() {
  const d = useHostData();
  const env = useHostEnv();
  const setSb = useApp((s) => s.setHostShabbat);
  const addPkg = useApp((s) => s.addHostShabbatPackage);
  const toast = useApp((s) => s.toast);
  const s = d.prefs.shabbat ?? {};
  const mode = s.mode ?? 'off';
  const upcoming = useMemo(() => d.bookings.filter(blocksAvailability).sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1)), [d.bookings]);
  const t = env.terms;
  return (
    <>
      <h1 className="h-vh">🕯️ אירוח שבת וכשרות</h1>
      <div className="h-vsub">ניתן להגדרה פר-ארגון · המערכת אינה קובעת הלכה</div>
      <div className="h-panel">
        <h2>מצב שבת</h2>
        <div className="h-rowbtn">
          {MODES.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={mode === k}
              className={h(mode === k ? 'btn' : 'btn ghost')}
              onClick={() => {
                setSb({ mode: k });
                toast('מצב שבת: ' + SB_MODE[k][0]);
              }}
            >
              {SB_MODE[k][0]}
            </button>
          ))}
        </div>
        <div className="h-hint">במצב "שבת": הודעות/חיובים אוטומטיים/תזכורות מושהים, מוצג מידע-סטטי והוראות-חירום, ופעולות נשמרות לתור למוצאי-שבת.</div>
      </div>
      <div className="h-two" style={{ marginTop: 16 }}>
        <div className="h-panel">
          <h2>🕯️ זמני שבת</h2>
          <FInput label="כניסת שבת" type="time" value={s.candle ?? ''} onChange={(v) => setSb({ candle: v })} />
          <FInput label="צאת שבת" type="time" value={s.havdalah ?? ''} onChange={(v) => setSb({ havdalah: v })} />
        </div>
        <div className="h-panel">
          <h2>✡️ מדיניות כשרות</h2>
          <FInput label="רמת כשרות" value={s.level ?? ''} onChange={(v) => setSb({ level: v })} />
          <FInput label="גוף/שם משגיח" value={s.mashgiach ?? ''} onChange={(v) => setSb({ mashgiach: v })} />
        </div>
      </div>
      <div className="h-panel" style={{ marginTop: 16 }}>
        <h2>📦 חבילות שבת ל{t.bookings}</h2>
        <div className="h-tblwrap">
          <table className="h-tbl">
            <thead>
              <tr>
                <th>{t.guest}</th>
                <th>{t.unit}</th>
                <th>תאריכים</th>
                <th>חבילת שבת</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length ? (
                upcoming.map((b) => {
                  const sacred = staySacredDays(b.checkIn, b.checkOut);
                  return (
                    <tr key={b.id}>
                      <td>
                        <b>{d.guestName(b.guestId)}</b>
                      </td>
                      <td>{d.unitName(b.unitId)}</td>
                      <td className="h-mono">
                        {fmtDM(b.checkIn)}–{fmtDM(b.checkOut)}
                        {sacred.length > 0 && (
                          <div style={{ fontFamily: 'Heebo, sans-serif', fontSize: 11, color: 'var(--h-violet)', fontWeight: 700 }} title={sacred.map((x) => x.name + ' ' + fmtDM(x.iso)).join(' · ')}>
                            🕯️ שוהים ב{sacred.map((x) => (x.name === 'שבת' ? 'שבת' : x.name) + ' ' + fmtDM(x.iso)).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td>
                        {b.shabbat ? (
                          <Pill cls="u-free" color="var(--h-good)">
                            מוכן ✓
                          </Pill>
                        ) : (
                          <button type="button" className={h('btn sm')} onClick={() => addPkg(b.id)}>
                            ＋ חבילת שבת
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="h-empty">
                    אין {t.bookings}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="h-hint">חבילת שבת מוסיפה: נרות · חלות · מיץ ענבים · פלטה · מיחם · ערכת-כלים — כחיוב בתיק-השהייה + הזמנת-מטבח.</div>
      </div>
    </>
  );
}
