/**
 * 📒 פרנסה׳לע ⇄ 🔌 המרכזייה — ☀ תקציר-היום בלשונית 🏠 טיפול (BUILD-ORDER-SWITCHBOARD-2026-10-13, חיבור ד׳).
 *
 * todaySummary שואל כל יכולת זמינה ("2 הגעות · הנזילה טופלה · שבת נכנסת 17:46") — הכרטיס מוצג **רק** כשכלי נוסף זמין
 * (כלי יחיד ⇒ אין מה לאסוף ⇒ הלשונית ביט-זהה). ⧉ העתקה / 💬 שיתוף — parnasa.export + שער-הייצוא (+ הרחבת-וואטסאפ).
 * קריאה-בלבד; ספירות בלבד מהאירוח (בלי אורחים, בלי כסף).
 */
import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, integrationSetting } from '../../lib/config';
import { guardExport } from '../../lib/exportGate';
import { hasOtherTool, shareWaUrl, summaryHeader, summaryText, todaySummary, voiceIds } from '../../lib/switchboard/summary';
import { NO_ABILITIES, useSwitchCtx } from '../switchboard/useSwitchCtx';
import { useEngineLinks } from '../switchboard/useEngineLink';
import { abilityInfo } from '../../lib/switchboard/registry';
import { hasSummaryLink, linkedSummaryLines } from '../../lib/enginebox/links';
import { Btn } from '../ui';
import type { PrNow } from './hooks';

export function TodayCard(props: { now: PrNow }) {
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  // 🧰 ארגז-המנועים: רק שורות מנותנים שמחוברים ללשונית-האישורים (day.summary); אף אחד לא מחובר ⇒ אין כרטיס
  const stored = useEngineLinks();
  const other = hasOtherTool(config, 'parnasa') && hasSummaryLink(stored, 'pr.care');
  const ids = useMemo(() => (other ? linkedSummaryLines(voiceIds(config).map((id) => ({ ability: id, module: abilityInfo(id)?.module ?? '' })), stored, 'parnasa', 'pr.care').map((v) => v.ability) : NO_ABILITIES), [config, other, stored]);
  const ctx = useSwitchCtx(props.now.nowMs, ids);
  if (!other) return null;
  const lines = linkedSummaryLines(todaySummary(ctx), stored, 'parnasa', 'pr.care');
  if (!lines.length) return null;
  const text = summaryText(lines, summaryHeader(props.now.nowMs));
  const exportOn = featureOn(config, 'parnasa.export');
  const waOn = integrationOn(config, 'whatsapp');
  const app = integrationSetting(config, 'whatsapp', 'mode') === 'app';

  function copy(): void {
    if (!guardExport()) return;
    void navigator.clipboard?.writeText(text).then(
      () => toast('התקציר הועתק ✓'),
      () => toast('ההעתקה נכשלה — סמנו והעתיקו ידנית'),
    );
  }

  return (
    <section className="card" data-switch="today">
      <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>☀ תקציר היום</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13.5, lineHeight: 1.8 }}>
        {lines.map((l, i) => (
          <li key={i + ':' + l.ability}>{l.text}</li>
        ))}
      </ul>
      {exportOn && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <Btn sm onClick={copy}>
            ⧉ העתקה
          </Btn>
          {waOn && (
            <a
              className="btn sm"
              href={shareWaUrl(text, app)}
              {...(app ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              style={{ textDecoration: 'none' }}
              onClick={(e) => {
                if (!guardExport()) e.preventDefault();
              }}
            >
              💬 שיתוף בוואטסאפ
            </a>
          )}
        </div>
      )}
    </section>
  );
}
