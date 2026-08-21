/**
 * מסך ההגדרות — מרכז ניהול המערכת:
 * ארגון · מורים · חדרים · התראות · גיבוי ושחזור · ייצוא נתונים · ייבוא נתונים · נגישות · איפוס.
 */
import { useEffect, useState } from 'react';
import type { NotifPrefs } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, isAdminUser, isSuperAdmin, termOf } from '../../lib/config';
import { readAiKey, writeAiKey } from '../../lib/ai';
import { receiptVerifyCode } from '../../lib/receipt';
import { Btn, Chip, Field, FormError, PageHead, TextInput } from '../ui';
import { Section, SectionNote, Toggle, takeSettingsFocus } from './lib';
import { TeachersSection } from './TeachersSection';
import { RoomsSection } from './RoomsSection';
import { BackupSection } from './BackupSection';
import { ExportSection } from './ExportSection';
import { ImportSection } from './ImportSection';
import { AccessSection } from './AccessSection';
import { SecuritySection } from './SecuritySection';
import { EncryptionSection } from './EncryptionSection';
import { CloudEncryptionSection } from './CloudEncryptionSection';
import { DonationSplitSection } from './DonationSplitSection';
import { EmployeeMgmtSection } from './EmployeeMgmtSection';
import { SupEnforceSection } from './SupEnforceSection';
import { ThemeSection } from './ThemeSection';
import { AuditSection } from './AuditSection';
import { OrgSecretsSection } from './OrgSecretsSection';

/** feature key פר-סעיף — הצ'יפ מוצג רק כשהסעיף עצמו מרונדר (אותו דגל בדיוק).
 *  ביקורת 6.8: ערכה/התראות/גיבוי/נגישות היו בלי מפתח ⇒ צ'יפ-מת כשהדגל כבוי;
 *  רק sec-org באמת בלתי-מוסתר. */
const SECTIONS: { id: string; label: string; feature?: string }[] = [
  { id: 'sec-org', label: 'ארגון' },
  { id: 'sec-theme', label: 'ערכת נושא', feature: 'settings.theme' },
  { id: 'sec-teachers', label: 'מורים', feature: 'settings.teachers' },
  { id: 'sec-rooms', label: 'חדרים', feature: 'settings.rooms' },
  { id: 'sec-notif', label: 'התראות', feature: 'settings.notif' },
  { id: 'sec-backup', label: 'גיבוי ושחזור', feature: 'settings.backup' },
  { id: 'sec-export', label: 'ייצוא נתונים', feature: 'settings.export' },
  { id: 'sec-import', label: 'ייבוא נתונים', feature: 'settings.import' },
  { id: 'sec-audit', label: 'בדיקת תקינות', feature: 'settings.audit' },
  { id: 'sec-access', label: 'נגישות', feature: 'settings.access' },
  { id: 'sec-reset', label: 'איפוס', feature: 'settings.reset' },
];

/** UX סבב-ו׳ — 16 כרטיסי-ההגדרות מקובצים ל-4 לשוניות. הקיבוץ תצוגתי בלבד:
 *  כל שערי-הגידור (featureOn / isAdminUser / isSuperAdmin / self-gates) נשארו
 *  כלשונם, וכל סעיף נגיש בדיוק כמו קודם — רק דרך לשונית במקום גלילה אחת ארוכה. */
const GROUPS = [
  { id: 'org', label: '🏷 הארגון שלי' },
  { id: 'data', label: '📚 נתונים' },
  { id: 'security', label: '🔐 אבטחה' },
  { id: 'adv', label: '🧪 מתקדם' },
] as const;
type GroupId = (typeof GROUPS)[number]['id'];
const SECTION_GROUP: Record<string, GroupId> = {
  'sec-org': 'org', 'sec-theme': 'org', 'sec-teachers': 'org', 'sec-rooms': 'org', 'sec-notif': 'org', 'sec-access': 'org',
  'sec-backup': 'data', 'sec-export': 'data', 'sec-import': 'data', 'sec-audit': 'data',
  'sec-security': 'security', 'sec-encryption': 'security', 'sec-cloud-encryption': 'security', 'sec-org-secrets': 'security', 'sec-donation-split': 'security',
  'sec-ai': 'adv', 'sec-audittrail': 'adv', 'sec-verifyreceipt': 'adv', 'sec-reset': 'adv',
};

export function SettingsView() {
  const config = useApp((s) => s.config);
  const cloudUser = useApp((s) => s.cloud.user);
  const isManager = useApp((s) => s.cloud.isManager);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const sections = SECTIONS.filter((s) => !s.feature || featureOn(config, s.feature));
  const secOn = (id: string) => sections.some((s) => s.id === id);
  const isAdmin = isAdminUser(config, cloudUser?.email);
  const canPlatform = isSuperAdmin(cloudUser?.email);

  // בקשת-מיקוד ממסך אחר (קיצורי המשפחות וכד') — נפתחים בקבוצה הנכונה וגוללים
  const [focusId] = useState(() => takeSettingsFocus());
  const [group, setGroup] = useState<GroupId>(() => (focusId && SECTION_GROUP[focusId]) || 'org');
  useEffect(() => {
    if (focusId) {
      const t = setTimeout(() => document.getElementById(focusId)?.scrollIntoView({ behavior: 'smooth' }), 120);
      return () => clearTimeout(t);
    }
  }, [focusId]);

  // לשונית ריקה מוסתרת — אותם תנאי-גידור של הסעיפים עצמם (שכפול מודע לצורך
  // הסתרת-לשונית בלבד; הסעיף עצמו ממשיך להיגדר בעצמו — מקור-האמת לא זז).
  const groupHas: Record<GroupId, boolean> = {
    org: true, // sec-org לעולם אינו מוסתר
    data: featureOn(config, 'settings.backup') || secOn('sec-export') || secOn('sec-import') || secOn('sec-audit'),
    security: featureOn(config, 'shell.lock') || featureOn(config, 'settings.encryption') || canPlatform ||
      // כספת-מפתחות (9.8) — אותו שער של OrgSecretsSection עצמו
      (cloudOn && config.slug !== 'default' && (isManager || canPlatform)),
    adv: (integrationOn(config, 'ai') && isAdmin) || (featureOn(config, 'settings.audittrail') && isAdmin) ||
      featureOn(config, 'core.receipt.verifycode') || secOn('sec-reset'),
  };
  const shownGroup: GroupId = groupHas[group] ? group : 'org';
  // "צ'יפ לכל מה שמרונדר, כלום מת" — גם הסעיפים המגודרים-עצמית (אבטחה/מתקדם)
  // מקבלים צ'יפ-קפיצה, באותם תנאי-גידור בדיוק של הרכיב עצמו.
  const extraChips: { id: string; label: string }[] = [
    ...(featureOn(config, 'shell.lock') ? [{ id: 'sec-security', label: 'נעילת PIN' }] : []),
    ...(featureOn(config, 'settings.encryption') ? [{ id: 'sec-encryption', label: 'הצפנה' }] : []),
    ...(canPlatform ? [{ id: 'sec-cloud-encryption', label: 'הצפנת ענן' }] : []),
    ...(integrationOn(config, 'ai') && isAdmin ? [{ id: 'sec-ai', label: 'עוזר AI' }] : []),
    ...(featureOn(config, 'settings.audittrail') && isAdmin ? [{ id: 'sec-audittrail', label: 'לוג פעולות' }] : []),
    ...(featureOn(config, 'core.receipt.verifycode') ? [{ id: 'sec-verifyreceipt', label: 'אימות קבלה' }] : []),
  ];
  const groupChips = [...sections, ...extraChips].filter((s) => SECTION_GROUP[s.id] === shownGroup);

  return (
    <div>
      <PageHead title="הגדרות" sub="ניהול המערכת, התראות ומשתמשים" />
      {/* 4 קבוצות-הלשונית — הניווט הראשי של המסך */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }} className="no-print">
        {GROUPS.filter((g) => groupHas[g.id]).map((g) => (
          <Chip key={g.id} on={shownGroup === g.id} onClick={() => setGroup(g.id)}>{g.label}</Chip>
        ))}
        {/* כניסה לאשף ההקמה — צ'יפ גלוי למנהל-על בלבד, מחליף את הצורך ב-#builder ידני */}
        {isAdmin && (
          <Chip onClick={() => { window.location.hash = '#builder'; }}>🎛️ אשף ההקמה</Chip>
        )}
        {/* לוח בקרת הפלטפורמה — מייל-על בלבד (במקום להקליד #platform בכתובת) */}
        {canPlatform && (
          <Chip onClick={() => { window.location.hash = '#platform'; }}>🛠 לוח בקרה</Chip>
        )}
        {/* ניהול העובדות — מנהל-ארגון בלבד (ORGADMIN; במקום #manage בכתובת) */}
        {isManager && (
          <Chip onClick={() => { window.location.hash = '#manage'; }}>👥 ניהול העובדות</Chip>
        )}
      </div>
      {/* צ'יפי-הקפיצה של הקבוצה הפעילה — אותה יכולת-ניווט לסעיף, בתוך הלשונית */}
      {groupChips.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }} className="no-print">
          {groupChips.map((s) => (
            <Chip key={s.id} onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}>
              {s.id === 'sec-teachers' ? termOf(config, 'entity.teacher', 'מורה') : s.id === 'sec-rooms' ? termOf(config, 'entity.rooms', 'חדרים') : s.label}
            </Chip>
          ))}
        </div>
      )}

      {shownGroup === 'org' && (
        <>
          <OrgSection />
          {featureOn(config, 'settings.theme') && <ThemeSection />}
          {secOn('sec-teachers') && <TeachersSection />}
          {secOn('sec-rooms') && <RoomsSection />}
          {featureOn(config, 'settings.notif') && <NotifSection />}
          {featureOn(config, 'settings.access') && <AccessSection />}
        </>
      )}
      {shownGroup === 'data' && (
        <>
          {/* גיבוי ושחזור לעולם אינו מוסתר — בטיחות נתונים */}
          {featureOn(config, 'settings.backup') && <BackupSection />}
          {secOn('sec-export') && <ExportSection />}
          {secOn('sec-import') && <ImportSection />}
          {secOn('sec-audit') && <AuditSection />}
        </>
      )}
      {shownGroup === 'security' && (
        <>
          {featureOn(config, 'shell.lock') && <SecuritySection />}
          {featureOn(config, 'settings.encryption') && <EncryptionSection />}
          {/* הצפנת-ענן — הרכיב עצמו מגודר isSuperAdmin (מחזיר null ללא-בעלים) */}
          <CloudEncryptionSection />
          {/* מסלול-B: מיגרציית-פיצול-תרומות — הרכיב מגודר isSuperAdmin (מחזיר null ללא-בעלים) */}
          <DonationSplitSection />
          {/* "חבר את מאור" — הפעלת ניהול-עובדות ללקוח-שורש (מגודר isSuperAdmin בעצמו) */}
          <EmployeeMgmtSection />
          {/* אכיפת-תומכים בשרת (ארגון-פלטפורמה) — הרכיב מגודר isSuperAdmin בעצמו */}
          <SupEnforceSection />
          {/* כספת-מפתחות פר-ארגון (9.8) — הרכיב מגודר בעצמו (ענן+מנהל+לא-שורש) */}
          <OrgSecretsSection />
        </>
      )}
      {shownGroup === 'adv' && (
        <>
          {/* גל ג׳ (ai): מפתח-העוזר — מוצג רק כשההרחבה נמכרה; מקומי-למכשיר בלבד */}
          <AiKeySection />
          {/* לוג-פעולות (#10) — הרכיב מגודר דגל+מנהל בעצמו */}
          <AuditTrailSection />
          {/* 🔍 אימות-קבלה (#11) — מגודר דגל בעצמו */}
          <VerifyReceiptSection />
          {secOn('sec-reset') && <ResetSection />}
        </>
      )}
    </div>
  );
}

/** (1) פרטי הארגון — שם, אתר, עמוד תרומות ויעד גיוס שנתי (קיר ההשפעה). */
function OrgSection() {
  const config = useApp((s) => s.config);
  const orgName = useApp((s) => s.db.orgName);
  const orgSite = useApp((s) => s.db.orgSite);
  const orgDonate = useApp((s) => s.db.orgDonate);
  const orgGoal = useApp((s) => s.db.orgGoal);
  const budget = useApp((s) => s.db.budget);
  const usdRate = useApp((s) => s.db.usdRate);
  const setDb = useApp((s) => s.setDb);
  const toast = useApp((s) => s.toast);

  const [f, setF] = useState({
    name: orgName,
    site: orgSite,
    donate: orgDonate,
    goal: orgGoal > 0 ? String(orgGoal) : '',
    budget: budget > 0 ? String(budget) : '',
    usd: String(usdRate || 3.7),
  });
  const [error, setError] = useState('');

  // סנכרון אחרי שחזור מגיבוי / ייבוא
  useEffect(() => {
    setF({ name: orgName, site: orgSite, donate: orgDonate, goal: orgGoal > 0 ? String(orgGoal) : '', budget: budget > 0 ? String(budget) : '', usd: String(usdRate || 3.7) });
  }, [orgName, orgSite, orgDonate, orgGoal, budget, usdRate]);

  function save() {
    const name = f.name.trim();
    if (!name) return setError('שם הארגון הוא שדה חובה');
    const goalNum = Number(f.goal.trim() || 0);
    if (!Number.isFinite(goalNum) || goalNum < 0) return setError('יעד הגיוס חייב להיות מספר חיובי (או ריק)');
    const budgetNum = Number(f.budget.trim() || 0);
    if (!Number.isFinite(budgetNum) || budgetNum < 0) return setError('יעד התקציב חייב להיות מספר חיובי (או ריק)');
    const usdNum = Number(f.usd.trim() || 0);
    if (!Number.isFinite(usdNum) || usdNum <= 0) return setError('שער הדולר חייב להיות מספר חיובי');
    setError('');
    setDb({
      orgName: name,
      orgSite: f.site.trim(),
      orgDonate: f.donate.trim(),
      orgGoal: Math.round(goalNum),
      budget: Math.round(budgetNum),
      usdRate: usdNum,
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
        <Field label={'עמוד ' + termOf(config, 'entity.donations', 'תרומות') + ' (קישור)'}>
          <TextInput
            value={f.donate}
            onChange={(v) => setF((p) => ({ ...p, donate: v }))}
            dir="ltr"
            placeholder="https://"
          />
        </Field>
        {featureOn(config, 'settings.org.goals') && (
          <>
            <Field label="יעד גיוס שנתי (₪)">
              <TextInput
                type="number"
                value={f.goal}
                onChange={(v) => setF((p) => ({ ...p, goal: v }))}
                dir="ltr"
                placeholder="0 = ללא יעד — קיר ההשפעה יציג את הסכום בלבד"
              />
            </Field>
            <Field label="יעד תקציב סיוע (₪)">
              <TextInput
                type="number"
                value={f.budget}
                onChange={(v) => setF((p) => ({ ...p, budget: v }))}
                dir="ltr"
                placeholder="0 = ללא יעד — מבט-ההנהלה יציג את הסבסוד בלבד"
              />
            </Field>
          </>
        )}
        {featureOn(config, 'supporters.multicur') && (
          <Field label="שער דולר→שקל">
            <TextInput
              type="number"
              value={f.usd}
              onChange={(v) => setF((p) => ({ ...p, usd: v }))}
              dir="ltr"
              placeholder="3.7 — מומר אוטומטית בכל חישובי התורמים"
            />
          </Field>
        )}
      </div>
      <Btn kind="primary" onClick={save}>
        שמירת פרטי הארגון
      </Btn>
      {/* 5.5d (הכרעת-בעלים 9.8 "שיציג בתור כפתור מה הלקוח בוחר"): פורמט הקבלה —
          נשמר ב-db.ui.receiptFmt (מסונכרן), חסר = קובץ-טקסט (ביט-זהה להיום) */}
      {featureOn(config, 'core.receipts') && featureOn(config, 'core.receipt.pdf') && (
        <ReceiptFmtRow />
      )}
    </Section>
  );
}

function ReceiptFmtRow() {
  const ui = useApp((s) => s.db.ui);
  const setDb = useApp((s) => s.setDb);
  const toast = useApp((s) => s.toast);
  const fmt = ui.receiptFmt === 'pdf' ? 'pdf' : 'txt';
  function choose(next: 'txt' | 'pdf') {
    if (next === fmt) return;
    setDb({ ui: { ...useApp.getState().db.ui, receiptFmt: next } });
    toast(next === 'pdf' ? '🖨 קבלות ייפתחו להדפסה/שמירה-כ-PDF' : '📄 קבלות יירדו כקובץ טקסט');
  }
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🧾 פורמט הקבלה</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn sm kind={fmt === 'txt' ? 'primary' : 'plain'} onClick={() => choose('txt')} aria-pressed={fmt === 'txt'}>
          📄 קובץ טקסט
        </Btn>
        <Btn sm kind={fmt === 'pdf' ? 'primary' : 'plain'} onClick={() => choose('pdf')} aria-pressed={fmt === 'pdf'}>
          🖨 PDF / הדפסה
        </Btn>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 6 }}>
        הבחירה חלה על כל הקבלות והאישורים; ב-PDF נפתח חלון-הדפסה ובוחרים "שמירה כ-PDF".
      </div>
    </div>
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
  const cloudOn = useApp((s) => s.cloud.enabled);
  const config = useApp((s) => s.config);
  const teacher = termOf(config, 'entity.teacher', 'מורה');
  const teachersT = teacher === 'מורה' ? 'מורים' : teacher;
  const [confirmText, setConfirmText] = useState('');
  const armed = confirmText.trim() === 'מחיקה';

  return (
    <Section id="sec-reset" title="🗑 איפוס נתונים מקומיים" sub="אזור מסוכן — פעולה בלתי הפיכה">
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 12, lineHeight: 1.6 }}>
        איפוס מוחק את <b>כל</b>{' הנתונים במחשב זה — ' + termOf(config, 'nav.families', 'משפחות') + ', ' + termOf(config, 'entity.members', 'בני משפחה') + ', ' + termOf(config, 'nav.courses', 'חוגים') + ', ' + termOf(config, 'entity.enrollments', 'שיבוצים') + ', תשלומים, אירועים, ' + termOf(config, 'nav.supporters', 'תורמים') + ', ' + teachersT + ', ' + termOf(config, 'entity.rooms', 'חדרים') + ' והגדרות. אין דרך לשחזר בלי קובץ גיבוי. מומלץ מאוד להוריד גיבוי מלא לפני.'}
      </p>
      {cloudOn && (
        <div
          style={{
            border: '1px solid var(--red)',
            background: 'color-mix(in srgb, var(--red) 8%, transparent)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 12,
            fontSize: 13.5,
            lineHeight: 1.6,
            color: 'var(--ink)',
          }}
        >
          ⚠️ <b>הענן מחובר.</b> האיפוס אינו מקומי בלבד — הוא <b>מוחק גם את העותק בענן</b>, וכך
          מוחק את הנתונים <b>בכל המכשירים המחוברים</b> (לא רק במחשב זה). ודאו שיש גיבוי, ושאף אחד
          אינו עובד כרגע.
        </div>
      )}
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

/** גל ג׳ (ai) — מפתח-העוזר: מוצג רק כשהרחבת-ה-AI נמכרה (integrationOn) ולמנהל
 *  בלבד. המפתח **מקומי-למכשיר** (nsLsKey — לא בענן, לא בגיבוי, כמו נעילת-PIN). */
function AiKeySection() {
  const config = useApp((s) => s.config);
  const cloudUser = useApp((s) => s.cloud.user);
  const toast = useApp((s) => s.toast);
  const [key, setKey] = useState(readAiKey());
  if (!integrationOn(config, 'ai') || !isAdminUser(config, cloudUser?.email)) return null;
  return (
    <Section id="sec-ai" title="🤖 עוזר חכם (AI)" sub="מפתח ה-API נשמר במכשיר זה בלבד — לא בענן ולא בגיבוי">
      <Field label="מפתח API (Anthropic)">
        <TextInput value={key} onChange={setKey} dir="ltr" type="password" placeholder="sk-ant-…" />
      </Field>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn
          kind="primary"
          onClick={() => {
            writeAiKey(key);
            toast(key.trim() ? '🤖 המפתח נשמר במכשיר — העוזר פעיל' : 'המפתח נמחק מהמכשיר');
          }}
        >
          שמירה
        </Btn>
      </div>
      <SectionNote>
        השימוש מחויב לחשבון-ה-API של הארגון. הטיוטות נפתחות לעריכה ואינן נשמרות במערכת.
      </SectionNote>
    </Section>
  );
}

/** לוג-פעולות (ROADMAP-100 ‏#10) — מי-שינה-מה-ומתי; מנהל בלבד, דגל settings.audittrail.
 *  הטבעת חצובת-תקרה (AUDIT_CAP) נשמרת ב-Db ומסתנכרנת בענן כמו שאר ה-meta. */
/** 🔍 אימות-קבלה (ROADMAP-100 ‏#11): הקלדת מס'-קבלה + קוד-אימות ⇒ השוואה מול
 *  רישומי-המערכת (תרומות D-, תשלומי-חוגים R- ואישורי-חנות S-). מגודר core.receipt.verifycode. */
function VerifyReceiptSection() {
  const config = useApp((s) => s.config);
  const db = useApp((s) => s.db);
  const [rid, setRid] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  if (!featureOn(config, 'core.receipt.verifycode')) return null;
  function check() {
    const r = rid.trim().toUpperCase();
    const c = code.trim().toUpperCase();
    if (!r || !c) return setResult('הקלידו מס׳-קבלה וקוד-אימות מהקבלה');
    // חיפוש בתרומות (D-), בתשלומי-חוגים (R-) ובאישורי-החנות (S-) — השדות היציבים בלבד
    let found: { amount: number; cur: string; date: string } | null = null;
    for (const sp of db.supporters) {
      const d = sp.donations.find((x) => (x.rid || '').toUpperCase() === r);
      if (d) { found = { amount: d.amount, cur: d.cur || '₪', date: d.date }; break; }
    }
    if (!found) {
      for (const en of db.enrollments) {
        const p = en.payments.find((x) => (x.rid || '').toUpperCase() === r);
        if (p) { found = { amount: p.amount, cur: '₪', date: p.date }; break; }
      }
    }
    if (!found) {
      // תיקון (swarm-audit): גם אישורי S- של החנות נושאים קוד-אימות (AssignmentsTab
      // מעביר verify) — בלי הסריקה כאן, אישור S- אמיתי קיבל '✗ לא נמצאה' (פסק-זיוף).
      // אותם קלטים כמו ההדפסה: rid | r.paid | '₪' (ברירת המחדל) | r.date; מבוטל נשאר
      // ברישומים (voidedAt מסמן, לא מוחק) — האישור המודפס עדיין ניתן לאימות.
      for (const a of db.shopAssignments) {
        const rr = a.redemptions.find((x) => (x.rid || '').toUpperCase() === r);
        if (rr) { found = { amount: rr.paid, cur: '₪', date: rr.date }; break; }
      }
    }
    if (!found) return setResult('✗ קבלה ' + r + ' לא נמצאה ברישומי המערכת');
    const expect = receiptVerifyCode(r, found.amount, found.cur, found.date);
    setResult(
      expect === c
        ? '✓ הקבלה תואמת את רישומי המערכת (סכום ' + (found.cur === '$' ? '$' : '₪') + found.amount.toLocaleString('he-IL') + ' · ' + found.date + ')'
        : '✗ הקוד לא תואם — ייתכן שהקבלה שונתה (הקוד הצפוי לרישום הקיים: ' + expect + ')',
    );
  }
  return (
    <Section id="sec-verifyreceipt" title="🔍 אימות קבלה" sub="בדיקה שקבלה מודפסת תואמת את הרישום במערכת — לפי הקוד המוטבע עליה">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="מס׳ קבלה/אישור (D-/R-/S-)">
          <TextInput value={rid} onChange={setRid} dir="ltr" placeholder="D-123" />
        </Field>
        <Field label="קוד-אימות מהקבלה">
          <TextInput value={code} onChange={setCode} dir="ltr" placeholder="XXX-XXX" />
        </Field>
        <Btn onClick={check}>בדיקה</Btn>
      </div>
      {result && <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>{result}</div>}
    </Section>
  );
}

function AuditTrailSection() {
  const config = useApp((s) => s.config);
  const cloudUser = useApp((s) => s.cloud.user);
  // ⚠️ ברירת-המחדל מחוץ לסלקטור — `?? []` בתוך הסלקטור מייצר מערך חדש בכל
  // getSnapshot כשאין לוג ⇒ לולאת-רינדור אינסופית (React #185, נתפס ב-launch-readiness).
  const audit = useApp((s) => s.db.audit) ?? [];
  if (!featureOn(config, 'settings.audittrail')) return null;
  if (!isAdminUser(config, cloudUser?.email)) return null;
  const rows = [...audit].reverse().slice(0, 100);
  return (
    <Section id="sec-audittrail" title="🧾 לוג פעולות" sub={'מי שינה מה ומתי — ' + audit.length + ' רשומות (נשמרות ' + 500 + ' האחרונות)'}>
      {rows.length === 0 ? (
        <SectionNote>{'עדיין אין רשומות — הלוג מתמלא עם כל פעולה מהותית (' + termOf(config, 'entity.donation', 'תרומה') + ', תשלום, שמירה/מחיקה, שחזור).'}</SectionNote>
      ) : (
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>מתי</th><th>מי</th><th>פעולה</th><th>מה</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td dir="ltr" style={{ fontSize: 12 }}>{r.at.slice(0, 16).replace('T', ' ')}</td>
                  <td style={{ fontSize: 12 }} dir="ltr">{r.who}</td>
                  <td style={{ fontWeight: 600 }}>{r.act}</td>
                  <td>{r.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
