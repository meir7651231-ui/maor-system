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
import { ORG_SECRET_KEYS, readOrgSecretsMeta, writeOrgSecrets, type OrgSecretKey } from '../../lib/cloudConfig';
import { Btn, Field, TextInput } from '../ui';
import { Section, SectionNote } from './lib';

const FIELDS: { key: OrgSecretKey; label: string; ltr?: boolean }[] = [
  { key: 'yemotToken', label: '📞 טוקן ימות-המשיח', ltr: true },
  { key: 'nedarimMosad', label: '💳 נדרים-פלוס — מספר מוסד', ltr: true },
  { key: 'nedarimApiPass', label: '💳 נדרים-פלוס — סיסמת API', ltr: true },
  { key: 'smsApiKey', label: '📱 מפתח ספק-SMS', ltr: true },
  { key: 'smtpUrl', label: '📧 חשבון-מייל לשליחה (smtps://user:pass@host)', ltr: true },
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

  useEffect(() => {
    if (canEdit) void readOrgSecretsMeta(slug).then(setMeta);
  }, [canEdit, slug]);

  if (!canEdit) return null;

  async function save() {
    const patch: Partial<Record<OrgSecretKey, string>> = {};
    for (const k of ORG_SECRET_KEYS) {
      const v = (vals[k] ?? '').trim();
      if (v) patch[k] = v;
    }
    if (!Object.keys(patch).length) return toast('הקלידו מפתח לפני השמירה');
    setBusy(true);
    try {
      await writeOrgSecrets(slug, patch);
      setVals({});
      setMeta(await readOrgSecretsMeta(slug));
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
      await writeOrgSecrets(slug, { [k]: '' });
      setMeta(await readOrgSecretsMeta(slug));
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
