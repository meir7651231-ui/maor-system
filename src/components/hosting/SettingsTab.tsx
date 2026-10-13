/**
 * ⚙️ הגדרות (viewSet של המקור) — hosting.manage: שם-העסק · שעות צ׳ק-אין/אאוט · דמי-ניקיון · מע״מ % · ימי-הזמנת-חומרים ·
 * "שנה אורח ⇒ משפחה מתארחת" (מונח-האשף גובר); נתונים — ⧉ ייצוא גיבוי (העתקה) · ⬇️ הורדה · ⬆ שחזור (גם מגיבוי
 * האפליקציה המקורית) · 🗑 אפס הכל — **נתוני-המודול בלבד** (hosting.delete); מודולי-הצוות — מצב + הפניה לאשף
 * (hosting.kitchen/shabbat/maint; כיבוי מסתיר ושומר נתונים).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import type { HostingPrefs } from '../../types/domain';
import { useHostData, useHostEnv } from './hooks';
import { FCheck, FInput, h, useHostUi } from './hui';
import { HOST_DEFAULTS } from './model';
import { copyBackup, downloadBackup, pickRestore } from './backup';

export function SettingsTab() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const cfgOrgName = useApp((s) => s.config.orgName);
  const dbOrgName = useApp((s) => s.db.orgName);
  const setPrefs = useApp((s) => s.setHostingPrefs);
  const reset = useApp((s) => s.resetHosting);
  const toast = useApp((s) => s.toast);
  const p = d.prefs;
  const [f, setF] = useState(() => ({
    businessName: p.businessName ?? '',
    cleaningFee: String(p.cleaningFee ?? HOST_DEFAULTS.cleaningFee),
    taxPct: String(p.taxPct ?? HOST_DEFAULTS.taxPct),
    orderLeadDays: String(p.orderLeadDays ?? HOST_DEFAULTS.orderLeadDays),
  }));
  const t = env.terms;
  /** שמירה בעזיבת-שדה (במקור — בכל הקשה; כאן פעם אחת לשינוי, עם רישום ביומן). */
  function commit(patch: Partial<HostingPrefs>) {
    const k = Object.keys(patch)[0] as keyof HostingPrefs;
    if (p[k] === patch[k]) return;
    if (setPrefs(patch)) toast('נשמר ✓');
  }
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const flagCard = (on: boolean, title: string, sub: string, key: string) => (
    <div className="h-card" key={key}>
      <h3>{title}</h3>
      <div className="h-meta">{sub}</div>
      <div className="h-rowbtn" style={{ margin: '11px 0 0' }}>
        <span className={h(on ? 'btn sm' : 'btn ghost sm')} style={{ cursor: 'default' }}>
          {on ? '✓ פעיל' : 'כבוי'}
        </span>
        <span className="h-hint" style={{ margin: 0 }}>
          {key}
        </span>
      </div>
    </div>
  );
  return (
    <>
      <h1 className="h-vh">הגדרות</h1>
      <div className="h-vsub">ארגון · תמחור · מונחים · נתונים</div>
      <div className="h-two">
        <div className="h-panel">
          <h2>🏢 פרטי הארגון</h2>
          <FInput
            label="שם העסק"
            value={f.businessName}
            placeholder={cfgOrgName?.trim() || dbOrgName?.trim() || t.nav}
            onChange={(v) => setF((x) => ({ ...x, businessName: v }))}
            onBlur={() => commit({ businessName: f.businessName.trim() || undefined })}
          />
          <div className="h-frow">
            <FInput label="שעת צ׳ק-אין" type="time" value={p.checkin ?? HOST_DEFAULTS.checkin} onChange={(v) => commit({ checkin: v || undefined })} />
            <FInput label="שעת צ׳ק-אאוט" type="time" value={p.checkout ?? HOST_DEFAULTS.checkout} onChange={(v) => commit({ checkout: v || undefined })} />
          </div>
          <div className="h-frow">
            <FInput label="דמי ניקיון (₪)" type="number" min={0} value={f.cleaningFee} onChange={(v) => setF((x) => ({ ...x, cleaningFee: v }))} onBlur={() => commit({ cleaningFee: num(f.cleaningFee) })} />
            <FInput label="מע״מ (%)" type="number" min={0} max={100} value={f.taxPct} onChange={(v) => setF((x) => ({ ...x, taxPct: v }))} onBlur={() => commit({ taxPct: num(f.taxPct) })} />
          </div>
          <div className="h-frow">
            <FInput
              label="🛒 להזמין חומרים · ימים לפני הארוחה"
              type="number"
              min={0}
              max={60}
              value={f.orderLeadDays}
              onChange={(v) => setF((x) => ({ ...x, orderLeadDays: v }))}
              onBlur={() => commit({ orderLeadDays: num(f.orderLeadDays) })}
            />
            <div className="h-field" />
          </div>
          <FCheck
            label={'שנה "אורח" ל"משפחה מתארחת" בכל המערכת'}
            checked={p.familyTerm === true}
            onChange={(v) => {
              if (setPrefs({ familyTerm: v ? true : undefined })) toast('המונח עודכן בכל המערכת');
            }}
          />
          <div className="h-hint">מע״מ — שורת-חישוב בתיק-השהייה (פנקס), לא חשבונית.</div>
        </div>
        <div className="h-panel">
          <h2>💾 נתונים · גיבוי ושחזור</h2>
          <p style={{ color: 'var(--h-dim)', fontSize: 13, marginBottom: 12 }}>
            נתוני-המודול נשמרים יחד עם שאר אורביט (במכשיר, ובענן כשהוגדר). גבו לקובץ, שחזרו (גם מגיבוי האפליקציה המקורית), או אפסו את המודול.
          </p>
          <div className="h-rowbtn">
            {env.on.export && (
              <>
                <button type="button" className={h('btn')} onClick={() => void copyBackup(d, t)}>
                  ⧉ ייצוא גיבוי (העתק JSON)
                </button>
                <button type="button" className={h('btn ghost')} onClick={() => downloadBackup(d, t)}>
                  ⬇️ הורדת גיבוי
                </button>
              </>
            )}
            <button type="button" className={h('btn ghost')} onClick={() => pickRestore(ui, t)}>
              ⬆ שחזור מקובץ
            </button>
          </div>
          {env.canDelete && (
            <div className="h-rowbtn">
              <button
                type="button"
                className={h('btn ghost danger')}
                onClick={() =>
                  ui.confirm(
                    'למחוק את כל נתוני ' + t.nav + ' ולהתחיל מחדש? (שאר אורביט לא משתנה)',
                    () => {
                      if (reset()) {
                        toast('הכל נמחק');
                        ui.go('dash');
                      }
                    },
                    'אפס הכל',
                  )
                }
              >
                🗑 אפס הכל (מחיקת כל נתוני-המודול)
              </button>
            </div>
          )}
          <div className="h-hint">ייצוא מוריד/מעתיק קובץ; שחזור טוען אותו ומחליף את נתוני-המודול הנוכחיים.</div>
        </div>
      </div>
      <div className="h-panel" style={{ marginTop: 16 }}>
        <h2>🧩 מודולי-צוות · הפעלה/כיבוי</h2>
        <div className="h-hint" style={{ marginBottom: 12 }}>
          כיבוי מסתיר את המסך אך <b>שומר את כל הנתונים</b> — הפעלה מחזירה אותם. ההפעלה והכיבוי — באשף אורביט (מנהל/ת), בדגלי-המודול.
        </div>
        <div className="h-cards">
          {flagCard(env.on.kitchen, '🍳 צוות מטבח', 'הזמנות · תפריט · בטיחות-מזון', 'hosting.kitchen')}
          {flagCard(env.on.shabbat, '🕯️ צוות שבת וכשרות', 'מצב-שבת · זמנים · חבילות', 'hosting.shabbat')}
          {flagCard(env.on.maint, '🔧 צוות תחזוקה', 'קריאות · ציוד · תחזוקה-מונעת', 'hosting.maint')}
        </div>
      </div>
    </>
  );
}
