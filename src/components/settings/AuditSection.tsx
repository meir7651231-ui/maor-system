/**
 * הגדרות ← בדיקת תקינות נתונים (feature: settings.audit).
 * מריץ את מנוע הביקורת (lib/audit), מציג ממצאים מקובצים לפי קטגוריה עם מונים,
 * כל שורה פותחת את כרטיס המשפחה, וכולל "תיקון טלפונים אוטומטי" ו"ייצוא דוח מלא".
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { runAudit, auditReportLines, AUDIT_CATEGORIES, AUDIT_CAT_COLORS, type AuditIssue } from '../../lib/audit';
import { downloadText } from '../reports/csv';
import { Btn } from '../ui';
import { Section, SectionNote } from './lib';
import { chipStyle } from '../families/lib';

export function AuditSection() {
  const db = useApp((s) => s.db);
  const selectFamily = useApp((s) => s.selectFamily);
  const go = useApp((s) => s.go);
  const fixAllPhones = useApp((s) => s.fixAllPhones);
  const orgName = useApp((s) => s.config.orgName || s.db.orgName);
  const [ran, setRan] = useState(false);

  // הביקורת נגזרת מה-Db — רצה מחדש בכל שינוי אחרי הלחיצה הראשונה
  const issues = useMemo(() => (ran ? runAudit(db) : []), [ran, db]);

  const byCat = useMemo(() => {
    const m = new Map<string, AuditIssue[]>();
    for (const c of AUDIT_CATEGORIES) m.set(c, []);
    for (const it of issues) m.get(it.cat)!.push(it);
    return m;
  }, [issues]);

  const exportReport = () => {
    downloadText(
      'maor-data-audit.txt',
      auditReportLines(orgName, issues, new Date().toLocaleString('he-IL')),
    );
  };

  return (
    <Section id="sec-audit" title="🔍 בדיקת תקינות נתונים">
      <SectionNote>
        סורק כפילויות, תעודות זהות, טלפונים, כתובות וסתירות לוגיות — ומצביע בדיוק על מה לתקן.
        לחיצה על ממצא פותחת את הכרטיס. אין כאן מחיקה אוטומטית — רק איתור.
      </SectionNote>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Btn kind="primary" onClick={() => setRan(true)}>
          {ran ? '↻ רענון הבדיקה' : '▶ הרצת בדיקה'}
        </Btn>
        <Btn onClick={fixAllPhones} title="השלמת ספרת 0 מובילה בכל הטלפונים">
          📞 תיקון טלפונים אוטומטי
        </Btn>
        {ran && issues.length > 0 && (
          <Btn onClick={exportReport} title="הורדת דוח מלא כקובץ טקסט">
            ⬇ ייצוא דוח מלא
          </Btn>
        )}
      </div>

      {ran && issues.length === 0 && (
        <div className="empty">✓ לא נמצאו בעיות — הנתונים תקינים</div>
      )}

      {ran && issues.length > 0 && (
        <>
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 10 }}>
            נמצאו {issues.length} ממצאים
          </div>
          {AUDIT_CATEGORIES.filter((c) => byCat.get(c)!.length > 0).map((cat) => {
            const [bg, c] = AUDIT_CAT_COLORS[cat];
            const rows = byCat.get(cat)!;
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={chipStyle(bg, c)}>{cat}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{rows.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {rows.map((it, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => (it.famId ? selectFamily(it.famId) : it.spId ? go('supporters') : undefined)}
                      title={it.famId || it.spId ? 'פתיחת הכרטיס' : undefined}
                      style={{
                        textAlign: 'right',
                        fontSize: 13,
                        padding: '7px 10px',
                        border: '1px solid var(--line)',
                        borderRadius: 8,
                        background: 'var(--panel)',
                        cursor: it.famId || it.spId ? 'pointer' : 'default',
                        color: 'var(--ink)',
                      }}
                    >
                      {it.title}
                      {(it.famId || it.spId) && <span style={{ color: 'var(--accent)', marginInlineStart: 6 }}>←</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </Section>
  );
}
