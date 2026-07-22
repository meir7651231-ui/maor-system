/**
 * מסך ההגדרות — מרכז ניהול המערכת:
 * ארגון · מורים · חדרים · התראות · גיבוי ושחזור · ייצוא נתונים · ייבוא נתונים · נגישות · איפוס.
 */
import { useEffect, useState } from 'react';
import type { NotifPrefs } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { Btn, Chip, Field, FormError, PageHead, TextInput } from '../ui';
import { Section, SectionNote, Toggle } from './lib';
import { TeachersSection } from './TeachersSection';
import { RoomsSection } from './RoomsSection';
import { BackupSection } from './BackupSection';
import { ExportSection } from './ExportSection';
import { ImportSection } from './ImportSection';
import { AccessSection } from './AccessSection';
import { ThemeSection } from './ThemeSection';

/** feature key פר-סעיף — סעיף בלי מפתח (ארגון/ערכה/התראות/גיבוי/נגישות) לעולם אינו מוסתר. */
const SECTIONS: { id: string; label: string; feature?: string }[] = [
  { id: 'sec-org', label: 'ארגון' },
  { id: 'sec-theme', label: 'ערכת נושא' },
  { id: 'sec-teachers', label: 'מורים', feature: 'settings.teachers' },
  { id: 'sec-rooms', label: 'חדרים', feature: 'settings.rooms' },
  { id: 'sec-notif', label: 'התראות' },
  { id: 'sec-backup', label: 'גיבוי ושחזור' },
  { id: 'sec-export', label: 'ייצוא נתונים', feature: 'settings.export' },
  { id: 'sec-import', label: 'ייבוא נתונים', feature: 'settings.import' },
  { id: 'sec-access', label: 'נגישות' },
  { id: 'sec-reset', label: 'איפוס', feature: 'settings.reset' },
];

export function SettingsView() {
  const config = useApp((s) => s.config);
  const sections = SECTIONS.filter((s) => !s.feature || featureOn(config, s.feature));
  const secOn = (id: string) => sections.some((s) => s.id === id);

  return (
    <div>
      <PageHead title="הגדרות" sub="ניהול המערכת, התראות ומשתמשים" />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }} className="no-print">
        {sections.map((s) => (
          <Chip key={s.id} onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}>
            {s.label}
          </Chip>
        ))}
      </div>

      <OrgSection />
      <ThemeSection />
      {secOn('sec-teachers') && <TeachersSection />}
      {secOn('sec-rooms') && <RoomsSection />}
      <NotifSection />
      {/* גיבוי ושחזור לעולם אינו מוסתר — בטיחות נתונים */}
      <BackupSection />
      {secOn('sec-export') && <ExportSection />}
      {secOn('sec-import') && <ImportSection />}
      <AccessSection />
      {secOn('sec-reset') && <ResetSection />}
    </div>
  );
}

/** (1) פרטי הארגון — שם, אתר, עמוד תרומות ויעד גיוס שנתי (קיר ההשפעה). */
function OrgSection() {
  const orgName = useApp((s) => s.db.orgName);
  const orgSite = useApp((s) => s.db.orgSite);
  const orgDonate = useApp((s) => s.db.orgDonate);
  const orgGoal = useApp((s) => s.db.orgGoal);
  const setDb = useApp((s) => s.setDb);
  const toast = useApp((s) => s.toast);

  const [f, setF] = useState({
    name: orgName,
    site: orgSite,
    donate: orgDonate,
    goal: orgGoal > 0 ? String(orgGoal) : '',
  });
  const [error, setError] = useState('');

  // סנכרון אחרי שחזור מגיבוי / ייבוא
  useEffect(() => {
    setF({ name: orgName, site: orgSite, donate: orgDonate, goal: orgGoal > 0 ? String(orgGoal) : '' });
  }, [orgName, orgSite, orgDonate, orgGoal]);

  function save() {
    const name = f.name.trim();
    if (!name) return setError('שם הארגון הוא שדה חובה');
    const goalNum = Number(f.goal.trim() || 0);
    if (!Number.isFinite(goalNum) || goalNum < 0) return setError('יעד הגיוס חייב להיות מספר חיובי (או ריק)');
    setError('');
    setDb({
      orgName: name,
      orgSite: f.site.trim(),
      orgDonate: f.donate.trim(),
      orgGoal: Math.round(goalNum),
    });
    toast('פרטי הארגון נשמרו ✓');
  }

  return (
    <Section id="sec-org" title="✦ פרטי הארגון" sub="הקישורים יופיעו בתחתית מיילים והודעות שנשלחות להורים">
      <FormError error={error} />
      <div className="form-grid">
        <Field label="שם הארגון *">
          <TextInput value={f.name} onChange={(v) => setF((p) => ({ ...p, name: v }))} />
        </Field>
        <Field label="אתר הארגון (https://)">
          <TextInput
            value={f.site}
            onChange={(v) => setF((p) => ({ ...p, site: v }))}
            dir="ltr"
            placeholder="https://"
          />
        </Field>
        <Field label="עמוד תרומות (קישור)">
          <TextInput
            value={f.donate}
            onChange={(v) => setF((p) => ({ ...p, donate: v }))}
            dir="ltr"
            placeholder="https://"
          />
        </Field>
        <Field label="יעד גיוס שנתי (₪)">
          <TextInput
            type="number"
            value={f.goal}
            onChange={(v) => setF((p) => ({ ...p, goal: v }))}
            dir="ltr"
            placeholder="0 = ללא יעד — קיר ההשפעה יציג את הסכום בלבד"
          />
        </Field>
      </div>
      <Btn kind="primary" onClick={save}>
        שמירת פרטי הארגון
      </Btn>
    </Section>
  );
}

/** (4) ערוצי התראות — העדפות בלבד, נשמרות בנתונים ונכללות בגיבוי. */
function NotifSection() {
  const notif = useApp((s) => s.db.notif);
  const setDb = useApp((s) => s.setDb);

  const toggle = (key: keyof NotifPrefs) => setDb({ notif: { ...notif, [key]: !notif[key] } });

  return (
    <Section id="sec-notif" title="🔔 ערוצי התראות" sub="העדפות בלבד — ערוצי השליחה יחוברו בגרסה המחוברת">
      <Toggle
        on={notif.email}
        onToggle={() => toggle('email')}
        label="אימייל"
        desc="סיכומים שבועיים, קבלות ותזכורות"
      />
      <Toggle
        on={notif.push}
        onToggle={() => toggle('push')}
        label="התראות פוש"
        desc="עדכונים מיידיים לאפליקציית הצוות"
      />
      <Toggle
        on={notif.sms}
        onToggle={() => toggle('sms')}
        label="SMS"
        desc="תזכורת יום לפני מפגש וביטולים"
      />
      <Toggle
        on={notif.strong}
        onToggle={() => toggle('strong')}
        label="דחיפה חזקה"
        desc="עוקפת מצב שקט — לשימוש חירום בלבד"
        onColor="var(--amber-deep)"
      />
      <SectionNote>ההעדפות נשמרות אוטומטית ונכללות בקובץ הגיבוי.</SectionNote>
    </Section>
  );
}

/** (8) איפוס מלא — אישור בהקלדה, ללא דרך חזרה. */
function ResetSection() {
  const resetAll = useApp((s) => s.resetAll);
  const exportBackup = useApp((s) => s.exportBackup);
  const [confirmText, setConfirmText] = useState('');
  const armed = confirmText.trim() === 'מחיקה';

  return (
    <Section id="sec-reset" title="🗑 איפוס נתונים מקומיים" sub="אזור מסוכן — פעולה בלתי הפיכה">
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 12, lineHeight: 1.6 }}>
        איפוס מוחק את <b>כל</b> הנתונים במחשב זה — משפחות, בני משפחה, חוגים, שיבוצים, תשלומים,
        אירועים, תורמים, מורים, חדרים והגדרות. אין דרך לשחזר בלי קובץ גיבוי. מומלץ מאוד להוריד
        גיבוי מלא לפני.
      </p>
      <div style={{ marginBottom: 12 }}>
        <Btn sm onClick={exportBackup}>
          ⬇ הורדת גיבוי מלא לפני האיפוס
        </Btn>
      </div>
      <div style={{ maxWidth: 320 }}>
        <Field label="הקלידו מחיקה לאישור">
          <TextInput value={confirmText} onChange={setConfirmText} placeholder="מחיקה" />
        </Field>
      </div>
      <Btn
        kind="danger"
        disabled={!armed}
        onClick={() => {
          resetAll();
          setConfirmText('');
        }}
      >
        איפוס נתונים מקומיים
      </Btn>
      {!armed && confirmText.trim() !== '' && (
        <SectionNote>יש להקליד בדיוק את המילה "מחיקה" כדי לאפשר את הכפתור.</SectionNote>
      )}
    </Section>
  );
}
