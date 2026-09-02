/**
 * 🗝 כספת-מפתחות פר-ארגון (בקשת-בעלים 9.8: "כל מנהל יש את הסודות שלו") —
 * המנהל מזין את הטוקנים של הארגון שלו (ימות/נדרים/SMS/SMTP); הם נכתבים
 * ל-orgSecrets/{slug} ש**איש אינו יכול לקרוא מהדפדפן** (Rules read:false) —
 * רק שרת-ה-functions משתמש בהם. המסך מציג רק "מוגדר ✓" (orgSecretsMeta).
 * השדות לעולם לא מאוכלסים-מראש — אין קריאה-חוזרת של סוד.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { isSuperAdmin } from '../../lib/config';
import type { OrgSecretKey } from '../../lib/cloudConfig';
import { composeSmtpUrl, smtpHostFor } from '../../lib/smtpUrl';
import { Btn, Field, TextInput } from '../ui';
import { Section, SectionNote } from './lib';

// ⚡ VISION-LIGHT ‏#1: ייבוא-ערך סטטי של cloudConfig גורר את כל Firebase
// ‏(‎~340KB gzip) לבנדל של כל לקוח — גם local-first בלי ענן. הכספת היא מסך-מנהל
// נדיר ⇒ ייבוא דינמי בלבד (import type חינם). ננעל ב-ratchet ‏bundle-light.
const cloudCfg = () => import('../../lib/cloudConfig');

const FIELDS: { key: OrgSecretKey; label: string; ltr?: boolean }[] = [
  { key: 'yemotToken', label: '📞 טוקן ימות-המשיח', ltr: true },
  { key: 'nedarimMosad', label: '💳 נדרים-פלוס — מספר מוסד', ltr: true },
  { key: 'nedarimApiPass', label: '💳 נדרים-פלוס — סיסמת API', ltr: true },
  { key: 'smsApiKey', label: '📱 מפתח ספק-SMS', ltr: true },
  // סולה (Cardknox) — ה-xKey מזהה את חשבון-הסליקה; sandbox וייצור = מפתחות שונים.
  { key: 'solaXKey', label: '💳 Sola Payments — xKey', ltr: true },
  { key: 'gcontactsRefresh', label: '📇 Google Contacts — refresh token', ltr: true },
];

export function OrgSecretsSection() {
  const config = useApp((s) => s.config);
  const cloud = useApp((s) => s.cloud);
  const toast = useApp((s) => s.toast);
  const slug = config.slug || 'default';
  const canEdit = cloud.enabled && slug !== 'default' && (cloud.isManager || isSuperAdmin(cloud.user?.email));

  const [vals, setVals] = useState<Partial<Record<OrgSecretKey, string>>>({});
  const [meta, setMeta] = useState<Partial<Record<OrgSecretKey, boolean>>>({});
  const [busy, setBusy] = useState(false);
  // 📧 מייל-ידידותי (20.8, בקשת-בעלים): הלקוח מקליד כתובת+סיסמת-אפליקציה —
  // ה-URL המלא מורכב לבד (composeSmtpUrl); ספק לא-מוכר ⇒ שדה-שרת ידני.
  const [mailUser, setMailUser] = useState('');
  const [mailPass, setMailPass] = useState('');
  const [mailHost, setMailHost] = useState('');
  const knownHost = smtpHostFor(mailUser);

  useEffect(() => {
    if (canEdit) void cloudCfg().then((m) => m.readOrgSecretsMeta(slug)).then(setMeta);
  }, [canEdit, slug]);

  if (!canEdit) return null;

  async function save() {
    const m = await cloudCfg();
    const patch: Partial<Record<OrgSecretKey, string>> = {};
    for (const k of m.ORG_SECRET_KEYS) {
      const v = (vals[k] ?? '').trim();
      if (v) patch[k] = v;
    }
    // הרכבת חשבון-המייל מהשדות הידידותיים (כתובת+סיסמה ⇒ URL מלא)
    if (mailUser.trim() || mailPass.trim()) {
      const url = composeSmtpUrl(mailUser, mailPass, knownHost || mailHost);
      if (!url) {
        return toast(
          knownHost || mailHost
            ? 'מייל: מלאו גם כתובת וגם סיסמת-אפליקציה'
            : 'מייל: הספק לא מוכר — מלאו את שדה שרת-היציאה (host:port)',
        );
      }
      patch.smtpUrl = url;
    }
    if (!Object.keys(patch).length) return toast('הקלידו מפתח לפני השמירה');
    setBusy(true);
    try {
      await m.writeOrgSecrets(slug, patch);
      setVals({});
      setMailUser('');
      setMailPass('');
      setMailHost('');
      setMeta(await m.readOrgSecretsMeta(slug));
      toast('🗝 המפתחות נשמרו בכספת — זמינים לשרת בלבד');
    } catch {
      toast('⚠ השמירה נכשלה — בדקו חיבור/הרשאות');
    } finally {
      setBusy(false);
    }
  }

  async function clearKey(k: OrgSecretKey) {
    setBusy(true);
    try {
      const m = await cloudCfg();
      await m.writeOrgSecrets(slug, { [k]: '' });
      setMeta(await m.readOrgSecretsMeta(slug));
      toast('המפתח נמחק מהכספת');
    } catch {
      toast('⚠ המחיקה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      id="sec-org-secrets"
      title="🗝 מפתחות-ההרחבות של הארגון"
      sub="טוקנים של ימות/נדרים/SMS/מייל — נשמרים בכספת שרק השרת קורא; המסך מציג רק ׳מוגדר׳"
    >
      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label + (meta[f.key] ? ' · מוגדר ✓' : '')}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <TextInput
                value={vals[f.key] ?? ''}
                onChange={(v) => setVals((p) => ({ ...p, [f.key]: v }))}
                type="password"
                dir={f.ltr ? 'ltr' : undefined}
                placeholder={meta[f.key] ? '•••••• (מוגדר — הקלדה מחליפה)' : ''}
              />
            </div>
            {meta[f.key] && (
              <Btn sm onClick={() => void clearKey(f.key)} disabled={busy}>מחיקה</Btn>
            )}
          </div>
        </Field>
      ))}
      {/* 📧 חשבון-המייל של הארגון — מילוי ידידותי: כתובת + סיסמת-אפליקציה בלבד */}
      <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>
          📧 המייל של הארגון — ממנו יישלחו הקבלות והתזכורות{meta.smtpUrl ? ' · מוגדר ✓' : ''}
          {meta.smtpUrl && (
            <Btn sm onClick={() => void clearKey('smtpUrl')} disabled={busy}>
              מחיקה
            </Btn>
          )}
        </div>
        <Field label="כתובת המייל (השולח)">
          <TextInput
            value={mailUser}
            onChange={setMailUser}
            dir="ltr"
            placeholder={meta.smtpUrl ? 'מוגדר — הקלדה מחליפה' : 'למשל receipts@gmail.com'}
          />
        </Field>
        <Field label="סיסמת-אפליקציה (לא הסיסמה הרגילה!)">
          <TextInput value={mailPass} onChange={setMailPass} type="password" dir="ltr" />
        </Field>
        {mailUser.trim() !== '' && !knownHost && (
          <Field label="שרת-היציאה של הספק (host:port) — הספק לא זוהה אוטומטית">
            <TextInput value={mailHost} onChange={setMailHost} dir="ltr" placeholder="smtp.example.com:465" />
          </Field>
        )}
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          בג'ימייל: מייצרים סיסמת-אפליקציה ב-myaccount.google.com/apppasswords (דורש אימות דו-שלבי).
          {knownHost ? ' הספק זוהה — שרת-היציאה יוגדר אוטומטית.' : ''}
        </div>
      </div>
      <div className="modal-actions">
        <Btn kind="primary" onClick={() => void save()} disabled={busy}>
          {busy ? 'שומר…' : 'שמירה לכספת'}
        </Btn>
      </div>
      <SectionNote>
        המפתחות לעולם אינם מוצגים חזרה, אינם בגיבוי ואינם נגישים לאף משתמש — כולל למי שהזין אותם.
        ההרחבות עצמן נכנסות לפעולה כשהשרת של הפלטפורמה פרוס.
      </SectionNote>
    </Section>
  );
}
