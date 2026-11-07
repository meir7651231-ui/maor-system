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
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { nsLsKey } from '../../store/persist';
import { integrationSetting, safeHttpsUrl } from '../../lib/config';
import {
  buildGabiHandoffUrl, gabiConnectBlocker, gabiPreferServer, gabiPriceLine, gabiSectionVisible, gabiServerUrlOk,
  GABI_PRODUCT, GABI_SECRET_MIN_LEN, newGabiNonce,
} from '../../lib/gabi';
import { Btn, Field, TextInput } from '../ui';
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
    <Section id="sec-gabi" title={'🪙 ' + GABI_PRODUCT.name} sub="מוצר נפרד · בהשקה בקרוב — לא נגבה דרך אורביט כרגע">
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
    </Section>
  );
}
