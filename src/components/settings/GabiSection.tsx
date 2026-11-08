/**
 * 🪙 סעיף «גבי – תזכורות תשלום» (הרחבת gabi, 7.11.2026 · roadmap, דורמנטי).
 *
 * כרטיס-המוצר (לוגו · סלוגן · מחיר · ימי-ניסיון) + כפתור «התחברות לגבי» שפותח את גבי
 * עם מסירה חתומה וקצרת-מועד (lib/gabi.ts — org+email+exp, HMAC-SHA256).
 *
 * שני מסלולים:
 *  • **v2 · שרת (מועדף כשיש ענן):** הסוד נשמר בכספת `orgSecrets/{slug}.gabiHandoff` (Rules
 *    read:false — איש לא קורא אותו מהדפדפן) והחתימה בפונקציה `gabiHandoff` (מייל מה-ID-token,
 *    מנהל-בלבד). הכתובת שחוזרת מאומתת מול הבסיס שבקונפיג (`gabiServerUrlOk`). הרשת — רק דרך
 *    ייבוא דינמי של lib/cloud ו-lib/cloudConfig (כמו GContactsSection), לא בקובץ הזה.
 *  • **v1 · מקומי (נפילה-לאחור):** סוד מקומי-למכשיר (nsLsKey) + חתימה ב-WebCrypto. משמש כשאין
 *    ענן, או כשהפונקציה לא זמינה (טרם נפרסה) ויש סוד-מקומי שמור.
 *
 * גידור: `integrationOn(config,'gabi')` + סמכות-מנהל — חסר ⇒ אינו מרונדר (ביט-זהה לכל
 * ארגון קיים; ratchet gabi-store.test). בלי כתובת/סוד/מייל ⇒ הכפתור כבוי + סיבה.
 *
 * ‏8.11.2026 · **החיוב דרך אורביט** (הכרעת-בעלים): כרטיס «💳 המנוי» — מסלול/מחיר/מצב-ניסיון מתוך
 * `platformOrgs/{slug}.billing.gabi` (lib/gabiBilling, טהור) + קישור-תשלום (payLink — עמוד-הסליקה
 * של אורביט; אין כרטיס בקוד). עריכת-הרשומה — מייל-על בלבד (גם ה-Rules). הקריאה/כתיבה — רק
 * בייבוא-דינמי של lib/cloudConfig (כמו הכספת).
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { nsLsKey } from '../../store/persist';
import { integrationSetting, isSuperAdmin, safeHttpsUrl } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import {
  gabiBillingLine, gabiBillingPayLink, gabiBillingState, gabiPlanLabel, normalizeGabiSubscription,
  GABI_PLANS, GABI_SUB_STATUSES, type GabiSubscription,
} from '../../lib/gabiBilling';
import {
  buildGabiHandoffUrl, gabiConnectBlocker, gabiPreferServer, gabiPriceLine, gabiSectionVisible, gabiServerUrlOk,
  GABI_PRODUCT, GABI_SECRET_MIN_LEN, newGabiNonce,
} from '../../lib/gabi';
import { Btn, Field, Select, TextInput } from '../ui';
import { Section, SectionNote } from './lib';

const SECRET_KEY = 'maor_gabi_handoff_secret';
const HANDOFF_FN = 'https://us-central1-maor-system.cloudfunctions.net/gabiHandoff';

function readSecret(): string {
  try {
    return localStorage.getItem(nsLsKey(SECRET_KEY)) ?? '';
  } catch {
    return '';
  }
}

function writeSecret(v: string): void {
  try {
    const t = v.trim();
    if (t) localStorage.setItem(nsLsKey(SECRET_KEY), t);
    else localStorage.removeItem(nsLsKey(SECRET_KEY));
  } catch {
    /* localStorage חסום */
  }
}

export function GabiSection() {
  const config = useApp((s) => s.config);
  const cloudUser = useApp((s) => s.cloud.user);
  const cloudOn = useApp((s) => !!s.cloud.enabled);
  const isManager = useApp((s) => !!s.cloud.isManager);
  const toast = useApp((s) => s.toast);
  const [secret, setSecret] = useState(readSecret);
  const [saved, setSaved] = useState(readSecret);
  const [vaultSet, setVaultSet] = useState(false);
  const [busy, setBusy] = useState(false);

  const visible = gabiSectionVisible(config, cloudUser?.email, isManager);
  const email = cloudUser?.email ?? '';
  const slug = config.slug || 'default';
  const server = visible && gabiPreferServer(config, cloudOn, email);

  // מדד «מוגדר ✓» בלבד (orgSecretsMeta) — הסוד עצמו לעולם לא נקרא מהדפדפן
  useEffect(() => {
    if (!server) return;
    void import('../../lib/cloudConfig')
      .then((m) => m.readOrgSecretsMeta(slug))
      .then((meta) => setVaultSet(meta.gabiHandoff === true))
      .catch(() => {});
  }, [server, slug]);

  // גידור: ההרחבה הודלקה במפורש (חסר=כבוי) + מנהל-אפקטיבי. אחרת — כלום.
  // (מקור-אמת: gabiSectionVisible ≡ integrationOn(config, 'gabi') && isAdminAuthority(…))
  if (!gabiSectionVisible(config, cloudUser?.email, isManager)) return null;

  const base = safeHttpsUrl(integrationSetting(config, 'gabi', 'baseUrl'));
  const blocker = gabiConnectBlocker(config, email, saved, server && vaultSet);

  async function connectLocal(): Promise<string | null> {
    if (!base || saved.trim().length < GABI_SECRET_MIN_LEN) return null;
    return buildGabiHandoffUrl({
      baseUrl: base, slug, email, secret: saved,
      nowSec: Math.floor(Date.now() / 1000), nonce: newGabiNonce(),
    });
  }

  async function connect() {
    if (busy || blocker || !base) return;
    setBusy(true);
    try {
      let url: string | null = null;
      if (server && vaultSet) {
        try {
          const { requestGabiHandoff } = await import('../../lib/cloud');
          url = gabiServerUrlOk(base, await requestGabiHandoff(HANDOFF_FN));
        } catch {
          url = null; // הפונקציה לא זמינה/נכשלה ⇒ נפילה למסלול-המקומי אם יש סוד
        }
      }
      if (!url) url = await connectLocal();
      if (!url) { toast('לא ניתן לבנות קישור-חיבור — בדקו כתובת וסוד'); return; }
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(false);
    }
  }

  async function saveSecret() {
    const v = secret.trim();
    if (server) {
      if (v && v.length < GABI_SECRET_MIN_LEN) { toast(`הסוד קצר מדי (לפחות ${GABI_SECRET_MIN_LEN} תווים)`); return; }
      setBusy(true);
      try {
        const m = await import('../../lib/cloudConfig');
        await m.writeOrgSecrets(slug, { gabiHandoff: v });
        setVaultSet(!!v);
        // מעבר ל-v2: הסוד כבר לא צריך לשבת במכשיר
        writeSecret('');
        setSaved('');
        setSecret('');
        toast(v ? 'הסוד נשמר בכספת-השרת (לא נקרא מהדפדפן)' : 'הסוד נמחק מהכספת');
      } catch {
        toast('השמירה לכספת נכשלה — בדקו הרשאת-מנהל וחיבור');
      } finally {
        setBusy(false);
      }
      return;
    }
    writeSecret(secret);
    setSaved(v);
    toast(v ? 'הסוד נשמר במכשיר זה' : 'הסוד נמחק מהמכשיר');
  }

  return (
    <Section id="sec-gabi" title={'🪙 ' + GABI_PRODUCT.name} sub="מוצר נפרד · בהשקה בקרוב — החיוב יהיה דרך אורביט">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <img src={GABI_PRODUCT.logoSrc} alt="גבי" width={48} height={48} />
        <div>
          <div style={{ fontWeight: 800 }}>{GABI_PRODUCT.slogan}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{gabiPriceLine()}</div>
        </div>
      </div>
      <Field label={server ? `סוד-חיבור (מונפק ע״י גבי)${vaultSet ? ' · מוגדר ✓' : ''}` : 'סוד-חיבור (מונפק ע״י גבי)'}>
        <TextInput value={secret} onChange={setSecret} dir="ltr" type="password" placeholder="••••" />
      </Field>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn disabled={busy} onClick={() => void saveSecret()}>
          {server ? 'שמירה בכספת' : 'שמירת סוד'}
        </Btn>
        <Btn kind="primary" disabled={!!blocker || busy} onClick={() => void connect()}>
          🔗 התחברות לגבי
        </Btn>
      </div>
      {blocker && <SectionNote>{blocker}</SectionNote>}
      <SectionNote>
        הקישור חתום ותקף לדקות ספורות בלבד; כולל את מזהה-הארגון ואת המייל שלך — לא נתוני-לקוחות.
        {server
          ? ' הסוד נשמר בכספת-השרת ונחתם שם — אינו נקרא מהדפדפן ואינו במכשיר.'
          : ' הסוד נשמר במכשיר זה בלבד — לא בענן ולא בגיבוי.'}
        {' '}בגבי ממשיכים בכניסה הרגילה (סיסמה + קוד אימות).
      </SectionNote>
      <GabiBillingCard slug={slug} cloud={server} email={email} />
    </Section>
  );
}

const STATUS_LABEL: Record<GabiSubscription['status'], string> = {
  trial: 'ניסיון', active: 'פעיל', past_due: 'תשלום באיחור', cancelled: 'בוטל',
};

/**
 * 💳 המנוי לגבי — נגבה דרך אורביט. מוצג רק בתוך הסעיף המגודר (integrationOn+מנהל). הרשומה
 * נקראת בייבוא-דינמי (בלי ענן ⇒ הסבר בלבד); עריכה — מייל-על בלבד (וגם ב-Rules).
 */
function GabiBillingCard({ slug, cloud, email }: { slug: string; cloud: boolean; email: string }) {
  const toast = useApp((s) => s.toast);
  const [sub, setSub] = useState<GabiSubscription | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<GabiSubscription>(() => ({ plan: 'monthly', status: 'trial', trialStart: isoToday(), paidUntil: '', payUrl: '' }));
  const [saving, setSaving] = useState(false);
  const su = isSuperAdmin(email);

  useEffect(() => {
    if (!cloud) return;
    void import('../../lib/cloudConfig')
      .then((m) => m.readOrgGabiBilling(slug))
      .then((r) => {
        setSub(r);
        if (r) setDraft(r);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [cloud, slug]);

  async function save(next: GabiSubscription | null) {
    if (saving) return;
    if (next && !normalizeGabiSubscription(next)) {
      toast('רשומה לא תקינה: ניסיון דורש תאריך-התחלה; פעיל/באיחור — «שולם עד»');
      return;
    }
    setSaving(true);
    try {
      const m = await import('../../lib/cloudConfig');
      await m.writeOrgGabiBilling(slug, next, email);
      setSub(await m.readOrgGabiBilling(slug));
      toast(next ? 'רשומת-המנוי נשמרה' : 'רשומת-המנוי נמחקה');
    } catch {
      toast('השמירה נכשלה — רק מייל-על רשאי לעדכן מנוי');
    } finally {
      setSaving(false);
    }
  }

  const st = sub ? gabiBillingState(sub, isoToday()) : null;
  const pay = sub && st ? gabiBillingPayLink(sub, st, slug) : null;
  const set = (patch: Partial<GabiSubscription>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>💳 המנוי — נגבה דרך אורביט</div>
      {!cloud ? (
        <SectionNote>מצב-המנוי מוצג עם חיבור-ענן כמנהל/ת. החיוב לגבי נעשה דרך אורביט בלבד — לא בגבי.</SectionNote>
      ) : !loaded ? (
        <SectionNote>טוען את מצב-המנוי…</SectionNote>
      ) : sub && st ? (
        <>
          <div style={{ fontSize: 14 }}>
            מסלול: <b>{gabiPlanLabel(sub.plan)}</b> · מצב: <b>{STATUS_LABEL[sub.status]}</b>
          </div>
          <div style={{ fontSize: 14, marginTop: 4, fontWeight: st.active ? 400 : 700 }}>{gabiBillingLine(st)}</div>
          {pay && (
            <a href={pay} target="_blank" rel="noopener noreferrer" className="btn primary" style={{ display: 'inline-block', marginTop: 8 }}>
              💳 תשלום דרך אורביט
            </a>
          )}
          <SectionNote>המצב נמסר לגבי בכל «🔗 התחברות לגבי» (חתום, קצר-מועד). אחרי תשלום — התחברו שוב כדי לרענן אותו בגבי.</SectionNote>
        </>
      ) : (
        <SectionNote>טרם הוגדר מנוי. 14 ימי הניסיון מתחילים כשמנהל-המערכת מפעיל אותם; אין חיוב אוטומטי.</SectionNote>
      )}
      {cloud && loaded && su && (
        <div style={{ marginTop: 10, padding: 10, border: '1px dashed var(--line)', borderRadius: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>🛠 עריכת המנוי (מייל-על בלבד)</div>
          <Field label="מסלול">
            <Select value={draft.plan} onChange={(v) => set({ plan: v as GabiSubscription['plan'] })} options={GABI_PLANS.map((p) => ({ value: p, label: gabiPlanLabel(p) }))} />
          </Field>
          <Field label="מצב">
            <Select value={draft.status} onChange={(v) => set({ status: v as GabiSubscription['status'] })} options={GABI_SUB_STATUSES.map((x) => ({ value: x, label: STATUS_LABEL[x] }))} />
          </Field>
          <Field label="תחילת ניסיון (YYYY-MM-DD)">
            <TextInput value={draft.trialStart} onChange={(v) => set({ trialStart: v })} dir="ltr" placeholder="2026-11-08" />
          </Field>
          <Field label="שולם עד (YYYY-MM-DD, כולל)">
            <TextInput value={draft.paidUntil} onChange={(v) => set({ paidUntil: v })} dir="ltr" placeholder="2026-12-08" />
          </Field>
          <Field label="עמוד-תשלום של אורביט (https)">
            <TextInput value={draft.payUrl} onChange={(v) => set({ payUrl: v })} dir="ltr" placeholder="https://…" />
          </Field>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn kind="primary" disabled={saving} onClick={() => void save(draft)}>
              שמירת מנוי
            </Btn>
            {sub && (
              <Btn disabled={saving} onClick={() => void save(null)}>
                מחיקת רשומה
              </Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
