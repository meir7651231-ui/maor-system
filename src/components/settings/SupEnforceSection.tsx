/**
 * הגדרות ← אכיפת-תומכים בשרת (15.8, ארגוני-פלטפורמה) — מגודר מייל-על.
 * **מתג-אחד** (בקשת-בעלים "כמו כל כפתור"): הדלקה מריצה את המיגרציה (סימון
 * `skey`=forWho לכל התומכים+אירועים) **ואז** מדליקה `supporterEnforce` בקונפיג-הענן,
 * ברצף אחד. כיבוי מנקה את הדגל+מטמון-הקונפיג. ⚠️ לא-נתמך בלקוח-שורש (cloudRoot).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { isSuperAdmin, supEnforceOn } from '../../lib/config';
import { Section, SectionNote } from './lib';

export function SupEnforceSection() {
  const cloudUser = useApp((s) => s.cloud.user);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const config = useApp((s) => s.config);
  const turnOn = useApp((s) => s.turnOnSupEnforce);
  const turnOff = useApp((s) => s.disableSupEnforce);
  const toast = useApp((s) => s.toast);
  const [busy, setBusy] = useState(false);

  // מגודר למייל-על בלבד.
  if (!isSuperAdmin(cloudUser?.email)) return null;

  const active = supEnforceOn(config);
  const isRoot = config.cloudRoot === true || config.slug === 'default';

  const flip = async (on: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (on) {
        await turnOn(); // מיגרציה + הדלקה ברצף
        toast('✓ אכיפת-התומכים פעילה — עובדת רואה רק את הייעוד שלה');
      } else {
        await turnOff();
        setTimeout(() => window.location.reload(), 400);
      }
    } catch (e) {
      toast(e instanceof Error ? '⚠ ' + e.message : '⚠ הפעולה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      id="sec-sup-enforce"
      title="🔒 אכיפת-תומכים בשרת (פר-ייעוד)"
      sub="עובדת מוגבלת לא יכולה אפילו לקרוא תומכים מחוץ לייעוד שלה — לא רק בממשק (ארגון-פלטפורמה)"
    >
      {isRoot ? (
        <SectionNote>
          ⚠️ אכיפת-השרת אינה נתמכת בלקוח-שורש (מאור) — מודל-ההרשאות שלו הוא allowlist מלא,
          בלי מושג של „עובדת מוגבלת" בשרת. כאן האכיפה ברמת-הממשק (דגל „ייעוד-תרומה"). זמין לארגוני-פלטפורמה.
        </SectionNote>
      ) : !cloudOn ? (
        <SectionNote>זמין רק כשהענן מחובר (התחברו לענן תחילה).</SectionNote>
      ) : (
        <>
          {/* מתג-אחד: הדלקה = מיגרציה+דגל אוטומטית; כיבוי = ניקוי */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: busy ? 'wait' : 'pointer', padding: '6px 2px' }}>
            <input
              type="checkbox"
              checked={active}
              disabled={busy}
              onChange={(e) => void flip(e.target.checked)}
              style={{ width: 'auto', marginTop: 3, accentColor: 'var(--accent-deep)' }}
            />
            <span style={{ lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700, color: active ? 'var(--green)' : 'var(--ink)' }}>
                {busy ? '⏳ מעדכן…' : active ? '✓ אכיפת-שרת פעילה' : 'אכיפת-שרת כבויה'}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                הדלקה מסמנת ייעוד לכל התומכים והאירועים (גיבוי אוטומטי קודם) **ומדליקה** את האכיפה — הכל בקליק.
                הפיך; כיבוי לא מוחק נתונים.
              </span>
            </span>
          </label>
          <SectionNote>⚠️ לאכיפה בפועל בשרת יש לפרסם את כללי-ה-Firestore (פעם אחת, אצל הבעלים).</SectionNote>
        </>
      )}
    </Section>
  );
}
