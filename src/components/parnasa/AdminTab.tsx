/**
 * 📒 פרנסה׳לע — "ניהול" של המקור (עיצוב 1): עמוד גבאי-האלפון עם פס-האזורים (div.seg) — אישורים · הכנסות ·
 * חסויות · מודעות וחוברת · הגדרות — ובתוכם כל לשוניות-הניהול של הפורט, בלי לאבד אף אחת:
 *   אישורים = 🏠 טיפול ואישורים (ממתינים + "דורש טיפול") · הכנסות = הפנקס וכל רשימות-הפרסום · חסויות = שורת-הלוח
 *   ו-15 השערים · מודעות וחוברת = מודעות-החוברת + "חוברת להדפסה" (תת-האזור book של המקור) · 📞 הקו (תוספת-הפורט,
 *   סימולטור) · הגדרות (גבאי בלבד). כל אזור מגודר בתת-הדגל שלו — אותו חוזה כמו הלשוניות הקודמות.
 * המונים על האזורים (‎.sc במקור): אישורים = ממתינים + דורש-טיפול · מודעות = לא-שולמו.
 */
import type { OrgConfig } from '../../types/config';
import { featureOn } from '../../lib/config';
import { Page } from './Shell';
import { CareTab, type CareJump } from './CareTab';
import { AdsTab } from './AdsTab';
import { BookletTab } from './BookletTab';
import { PhoneTab } from './PhoneTab';
import { SettingsTab } from './SettingsTab';
import type { PrNow } from './hooks';

export type AdminSeg = 'appr' | 'rev' | 'spon' | 'ads' | 'phone' | 'set';

export interface AdminSegDef {
  key: AdminSeg;
  label: string;
  on: boolean;
}

/** אזורי-הניהול והגידור שלהם (טהור — גם הניווט שואל אותו אם להציג את "ניהול"). */
export function adminSegsOf(config: OrgConfig, canApprove: boolean): AdminSegDef[] {
  const adsOn = featureOn(config, 'parnasa.ads');
  return [
    { key: 'appr', label: 'אישורים', on: featureOn(config, 'parnasa.care') },
    { key: 'rev', label: 'הכנסות', on: adsOn },
    { key: 'spon', label: 'חסויות', on: adsOn },
    { key: 'ads', label: 'מודעות וחוברת', on: adsOn || featureOn(config, 'parnasa.booklet') },
    { key: 'phone', label: '📞 הקו', on: featureOn(config, 'parnasa.phone') },
    { key: 'set', label: 'הגדרות', on: canApprove },
  ];
}

export function AdminTab(props: {
  now: PrNow;
  segs: AdminSegDef[];
  seg: AdminSeg;
  setSeg: (s: AdminSeg) => void;
  counts: Partial<Record<AdminSeg, number>>;
  onJump: (j: CareJump) => void;
  canJump: (tab: CareJump['tab']) => boolean;
  bookletOn: boolean;
  adsOn: boolean;
}) {
  const on = props.segs.filter((s) => s.on);
  const active: AdminSeg | null = on.some((s) => s.key === props.seg) ? props.seg : (on[0]?.key ?? null);
  return (
    <Page wide k="גבאי האלפון" title="ניהול">
      <div className="pn-seg" role="tablist" aria-label="אזורי ניהול">
        {on.map((s) => (
          <button key={s.key} role="tab" type="button" data-seg={s.key} aria-selected={active === s.key} onClick={() => props.setSeg(s.key)}>
            {s.label}
            <span className="pn-sc">{props.counts[s.key] ? String(props.counts[s.key]) : ''}</span>
          </button>
        ))}
      </div>
      {active === 'appr' && (
        <div className="pn-apanel pn-orbit" data-panel="appr">
          <CareTab now={props.now} onJump={props.onJump} canJump={props.canJump} />
        </div>
      )}
      {(active === 'rev' || active === 'spon') && (
        <div className="pn-apanel pn-orbit" data-panel={active}>
          <AdsTab now={props.now} section={active} />
        </div>
      )}
      {active === 'ads' && props.adsOn && (
        <div className="pn-apanel pn-orbit" data-panel="ads">
          <AdsTab now={props.now} section="ads" />
        </div>
      )}
      {active === 'ads' && props.bookletOn && (
        <div className="pn-apanel pn-orbit" data-panel="ads" data-sub="book">
          <BookletTab now={props.now} />
        </div>
      )}
      {active === 'phone' && (
        <div className="pn-apanel pn-orbit" data-panel="phone">
          <PhoneTab now={props.now} />
        </div>
      )}
      {active === 'set' && (
        <div className="pn-apanel pn-orbit" data-panel="set">
          <SettingsTab />
        </div>
      )}
    </Page>
  );
}
