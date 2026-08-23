/**
 * כרטיס משפחה — פרטי קשר והורים, בני משפחה (הוספה/עריכה/מחיקה),
 * מסמכים, מדד אמינות, שיבוצים ואירועים מקושרים.
 */
import { useState, type ReactNode } from 'react';
import type { Family, Member } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { nsLsKey } from '../../store/persist';
import { canGrantedAction, featureOn, integrationOn, telephonyOn, termOf } from '../../lib/config';
import { mapsSearchUrl } from '../../lib/mapsLink';
import { WaBtn } from '../WaBtn';
import { CallBtn } from '../CallBtn';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty, StickyBackBar } from '../ui';
import { ageOf, chipStyle, fmtDate, STATUS_META } from './lib';
import { FamilyForm } from './FamilyForm';
import { MemberForm, type MemberPrefill } from './MemberForm';
import { CredPanel, DocsPanel, EnrollPanel, EventsPanel } from './FamilyPanels';
// פאנלי העמודות המבודדות (CONNECT חיבור 2) — תצוגה בלבד, חיים בתיקיות המודולים
import { TzFamilyPanel } from '../tzedaka/TzFamilyPanel';
import { ShopFamilyPanel } from '../shop/ShopFamilyPanel';
import { Shop7FamilyPanel } from '../shop7/Shop7FamilyPanel';
import { ReenrollFamilyPanel } from './ReenrollFamilyPanel';
import { useArmed } from '../useArmed';

function InfoRow(props: { k: string; v: string; action?: ReactNode }) {
  // סגנון-flex רק כשיש action — בלי action ה-DOM ביט-זהה לקודם (ביקורת 4.8)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{props.k}</span>
      <span
        style={{
          fontWeight: 600,
          textAlign: 'left',
          overflowWrap: 'anywhere',
          ...(props.action ? { display: 'inline-flex', alignItems: 'center', gap: 6 } : {}),
        }}
      >
        {props.action}
        {props.v}
      </span>
    </div>
  );
}

function maskId(id: string, show: boolean): string {
  if (!id) return '—';
  return show ? id : '•••••' + id.slice(-2);
}

const MEDIA_LABELS: { key: keyof Member; label: string }[] = [
  { key: 'mSefach', label: 'ספח' },
  { key: 'mInvite', label: 'הזמנה' },
  { key: 'mRecommend', label: 'המלצה' },
  { key: 'mPhotos', label: 'תמונות' },
  { key: 'mVideos', label: 'סרטונים' },
];

function MemberCard(props: { m: Member; onEdit: () => void; onDelete: () => void }) {
  const config = useApp((s) => s.config);
  const m = props.m;
  const age = ageOf(m.birth);
  const gLabel = m.isParent ? (m.gender === 'f' ? 'אם' : 'אב') : m.gender === 'f' ? 'בת' : 'בן';
  const gBg = m.isParent ? '#f6ead1' : m.gender === 'f' ? '#fbeef3' : '#e7edf5';
  const gC = m.isParent ? '#9a6414' : m.gender === 'f' ? '#be185d' : '#3a5a86';
  const media = MEDIA_LABELS.filter((x) => m[x.key] === true).map((x) => x.label);
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '11px 12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 99,
          background: '#f6ead1',
          color: '#9a6414',
          fontWeight: 800,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {m.first ? m.first[0] : '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{m.first}</span>
          <span style={chipStyle(gBg, gC)}>{gLabel}</span>
        </div>
        <div style={{ fontSize: 12, color: '#9a6414', fontWeight: 600, marginTop: 2 }}>
          {age != null ? (m.gender === 'f' ? 'בת ' : 'בן ') + age : 'גיל לא ידוע'}
          {m.birth ? ' · ' + hebDateFull(m.birth) : ''}
        </div>
        {m.birth && <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{fmtDate(m.birth)}</div>}
        {(m.school || m.grade) && (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            {[m.school, m.grade ? 'כיתה ' + m.grade : ''].filter(Boolean).join(' · ')}
          </div>
        )}
        {/* ⚕ מידע רפואי (PII) — מוצג רק כשדגל families.health דלוק */}
        {featureOn(config, 'families.health') && m.health && <div style={{ fontSize: 12, color: '#b91c1c' }}>⚕ {m.health}</div>}
        {media.length > 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>🗂 {media.join(' · ')}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
        <Btn sm onClick={props.onEdit} title="עריכה">
          ✎
        </Btn>
        <Btn sm kind="danger" onClick={props.onDelete} title={'הסרה מה' + termOf(config, 'entity.family', 'משפחה')}>
          🗑
        </Btn>
      </div>
    </div>
  );
}

/** כרטיס "אב/אם (להשלמה)" — הורה מטופס המשפחה שטרם מומש כ-Member (P0.3). */
function ParentStubCard(props: { label: string; name: string; onClick: () => void }) {
  const config = useApp((s) => s.config);
  return (
    <button
      type="button"
      onClick={props.onClick}
      title={'השלמת פרטי ' + props.name + ' כ' + termOf(config, 'entity.member', 'בן/בת משפחה')}
      style={{
        border: '1.5px dashed var(--line)',
        borderRadius: 12,
        padding: '11px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'right',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 99,
          background: '#eceae2',
          color: '#8b8474',
          fontWeight: 800,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {props.name ? props.name[0] : '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{props.name}</span>
          <span style={chipStyle('#fdf1d4', '#9a6414')}>{props.label}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
          לחיצה תפתח טופס מאוכלס מראש להשלמת הפרטים
        </div>
      </div>
    </button>
  );
}

export function FamilyDetail(props: { family: Family }) {
  const fam = props.family;
  const selectFamily = useApp((s) => s.selectFamily);
  const deleteFamily = useApp((s) => s.deleteFamily);
  const deleteMember = useApp((s) => s.deleteMember);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  // הרשאה אחידה (בקשת-בעלים 23.8): מחיקת-משפחה למנהל/בעלים תמיד; עובד/ת רק אם הודלק/ה.
  // featureOn נשמר (מכבד כיבוי-ארגוני קיים של families.delete) ⇒ אפס-רגרסיה.
  const cloudEmail = useApp((s) => s.cloud.user?.email);
  const isOrgMgr = useApp((s) => s.cloud.isManager) === true;
  const canDeleteFamily = featureOn(config, 'families.delete') && canGrantedAction(config, cloudEmail, isOrgMgr, 'families.delete');
  const credOn = featureOn(config, 'families.cred');
  const privacyMode = useApp((s) => s.privacyMode);
  // מחיקות בשני קליקים (P3 פריט 19, shell.armdel; כבוי = דיאלוג דפדפן)
  const { confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const docsOn = featureOn(config, 'families.docs');
  const cardOpsOn = featureOn(config, 'families.cardops');

  const [showIds, setShowIds] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  /** undefined=סגור · null=בן משפחה חדש · Member=עריכה */
  const [memberModal, setMemberModal] = useState<Member | null | undefined>(undefined);
  /** אכלוס-מראש לכרטיסי "אב/אם (להשלמה)" — נפתח MemberForm עם שם ההורה מה-Family. */
  const [parentPrefill, setParentPrefill] = useState<MemberPrefill | undefined>(undefined);

  // FamiliesView מרנדר FamilyDetail בלי key, וה-command palette מחליף משפחה בלי
  // unmount — בלי איפוס, טופס עריכה/בן-משפחה שנשאר פתוח היה קשור למשפחה הקודמת.
  // איפוס נגזר בזמן render (כמו ב-CourseDetail) כשמזהה המשפחה משתנה.
  const [prevFamilyId, setPrevFamilyId] = useState(fam.id);
  if (prevFamilyId !== fam.id) {
    setPrevFamilyId(fam.id);
    setEditOpen(false);
    setMemberModal(undefined);
    setParentPrefill(undefined);
  }

  const st = STATUS_META[fam.status];
  const parents = [fam.father, fam.mother].filter(Boolean).join(' ו');
  const addressLine = [fam.address, fam.city].filter(Boolean).join(', ');

  function onDeleteFamily() {
    // מחיקה מדורגת בשני קליקים (P3 פריט 19, לגאסי armDel)
    const msg =
      'למחוק את ' +
      termOf(config, 'entity.familyOf', 'משפחת') +
      ' ' +
      fam.name +
      '? הפעולה תמחק גם את ' +
      termOf(config, 'entity.members', 'בני משפחה') +
      ', ' +
      termOf(config, 'entity.enrollments', 'שיבוצים') +
      ' והאירועים המקושרים.';
    if (!confirmTwice('fam-' + fam.id, msg)) {
      toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
      return;
    }
    deleteFamily(fam.id);
    selectFamily(null);
    toast('מחיקת ' + termOf(config, 'entity.familyOf', 'משפחת') + ' ' + fam.name + ' הושלמה');
  }

  function onDeleteMember(m: Member) {
    const msg =
      'להסיר את ' +
      m.first +
      ' מ' +
      termOf(config, 'entity.familyOf', 'משפחת') +
      ' ' +
      fam.name +
      '? ' +
      termOf(config, 'entity.enrollments', 'שיבוצים') +
      ' שלו/ה יימחקו גם כן.';
    if (!confirmTwice('mem-' + m.id, msg)) {
      toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תסיר את ' + m.first);
      return;
    }
    deleteMember(fam.id, m.id);
    toast(m.first + ' הוסר/ה מה' + termOf(config, 'entity.family', 'משפחה'));
  }

  /** פעולת-קשר לשורת-טלפון: 📞 חיוג (טלפוניה) + 💬 wa.me — כל אחד מגודר בנפרד. */
  const commsAction = (phone: string) => {
    const call = telephonyOn(config);
    const wa = integrationOn(config, 'whatsapp');
    if (!call && !wa) return undefined;
    return (
      <>
        {call && <CallBtn phone={phone} />}
        {call && wa ? ' ' : null}
        {wa && <WaBtn phone={phone} />}
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 60 }}>
      {/* כותרת הכרטיס */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          aria-hidden
          style={{
            width: 52,
            height: 52,
            borderRadius: 99,
            background: 'var(--dark)',
            color: 'var(--amber)',
            fontWeight: 800,
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          {fam.name ? fam.name[0] : '?'}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              {termOf(config, 'entity.familyOf', 'משפחת')} {fam.name}
            </h1>
            <span style={chipStyle(st.bg, st.c)}>{st.label}</span>
            {fam.community && <span style={chipStyle('#eceae2', '#4d463c')}>{fam.community}</span>}
            {fam.discount && <span style={chipStyle('#fdf1d4', '#9a6414')}>🏷 {fam.discount}</span>}
            {!!fam.kidsHome && <span style={chipStyle('#eef7e6', '#3f6212')}>🏠 {fam.kidsHome} ילדים בבית</span>}
            {!!fam.kidsMarried && <span style={chipStyle('#e7edf5', '#3a5a86')}>💍 {fam.kidsMarried} נשואים</span>}
            {fam.createdAt && (
              <span style={chipStyle('#e7edf5', '#3a5a86')}>הצטרפה {hebDateFull(fam.createdAt)}</span>
            )}
          </div>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {[parents, addressLine].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {featureOn(config, 'core.timer') && (
            <Btn
              kind="primary"
              onClick={() => {
                try {
                  sessionStorage.setItem(nsLsKey('maor_timer_client'), fam.name);
                } catch {
                  /* חסום */
                }
                window.location.hash = '#timer';
              }}
              title={termOf(config, 'nav.timer', 'טיימר כסף') + ' — חיוב לפי זמן ל' + fam.name}
            >
              ⏱️ {termOf(config, 'nav.timer', 'טיימר כסף')}
            </Btn>
          )}
          {featureOn(config, 'core.bodymap') && (
            <Btn
              onClick={() => {
                try {
                  sessionStorage.setItem(nsLsKey('maor_bodymap_client'), fam.name);
                } catch {
                  /* חסום */
                }
                window.location.hash = '#bodymap';
              }}
              title={termOf(config, 'nav.bodymap', 'אזורי טיפול') + ' — ' + fam.name}
            >
              🧍 {termOf(config, 'nav.bodymap', 'אזורי טיפול')}
            </Btn>
          )}
          <Btn onClick={() => setEditOpen(true)}>✎ עריכת {termOf(config, 'entity.family', 'משפחה')}</Btn>
          {canDeleteFamily && (
            <Btn kind="danger" onClick={onDeleteFamily}>
              🗑 מחיקת {termOf(config, 'entity.family', 'משפחה')}
            </Btn>
          )}
        </div>
      </div>

      {/* פרטי קשר + פרטים נוספים */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>פרטי קשר והורים</h2>
            {featureOn(config, 'families.showid') && (
              <Btn sm onClick={() => setShowIds((v) => !v)}>
                {showIds ? 'הסתר ת"ז' : 'הצג ת"ז'}
              </Btn>
            )}
          </div>
          <InfoRow k="שם האב" v={fam.father || '—'} />
          <InfoRow k={'ת"ז האב'} v={maskId(fam.fatherId, showIds)} />
          <InfoRow k="שם האם" v={fam.mother || '—'} />
          <InfoRow k={'ת"ז האם'} v={maskId(fam.motherId, showIds)} />
          {/* הרחבות נמכרות: 📞 חיוג (מודול טלפוניה, opt-in) · 💬 wa.me · 🗺️ Maps — חסר=כבוי */}
          <InfoRow k="טלפון ראשי" v={fam.phone || '—'} action={commsAction(fam.phone)} />
          <InfoRow k="טלפון נוסף" v={fam.phone2 || '—'} action={commsAction(fam.phone2)} />
          <InfoRow k="אימייל" v={fam.email || '—'} />
          <InfoRow
            k="כתובת"
            v={addressLine || '—'}
            action={
              integrationOn(config, 'maps') && mapsSearchUrl(fam.address, fam.city) ? (
                <a
                  href={mapsSearchUrl(fam.address, fam.city)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="פתיחה במפות"
                  style={{ textDecoration: 'none', fontSize: 15, lineHeight: 1 }}
                >
                  🗺️
                </a>
              ) : undefined
            }
          />
        </section>
        {featureOn(config, 'families.extradetails') && (
          <section className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>פרטים נוספים</h2>
            <InfoRow k="מצב משפחתי" v={fam.maritalStatus || '—'} />
            <InfoRow k="שפה מדוברת" v={fam.language || '—'} />
            <InfoRow k="תת-קהילה" v={fam.community || '—'} />
            <InfoRow k="קופת צדקה" v={fam.tzedaka || '—'} />
            <InfoRow k="הנחה" v={fam.discount || '—'} />
            <div style={{ margin: '6px 0' }}>
              <span
                style={chipStyle(fam.fullSefach ? '#e4f5ea' : '#fdf1d4', fam.fullSefach ? '#12803c' : '#9a6414')}
              >
                {fam.fullSefach ? 'ספח מלא ✓' : 'חסר ספח מלא'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>
              {fam.notes || 'אין הערות ל' + termOf(config, 'entity.family', 'משפחה') + ' זו.'}
            </div>
          </section>
        )}
      </div>

      {/* בני המשפחה */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{termOf(config, 'entity.members', 'בני משפחה')}</h2>
          <Btn onClick={() => setMemberModal(null)}>➕ הוספת {termOf(config, 'entity.member', 'בן משפחה')}</Btn>
        </div>
        {fam.members.length === 0 && !(cardOpsOn && (fam.father || fam.mother)) ? (
          <Empty>עדיין לא נרשמו {termOf(config, 'entity.members', 'בני משפחה')}</Empty>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {fam.members.map((m) => (
              <MemberCard key={m.id} m={m} onEdit={() => setMemberModal(m)} onDelete={() => onDeleteMember(m)} />
            ))}
            {/* כרטיסי "אב/אם (להשלמה)" — הורה שקיים ב-Family אך טרם מומש כ-Member
                (אותו תנאי כמו ההורים הווירטואליים __pf/__pm ב-JoinModal; עוגן לגאסי:
                כרטיסי ההורים בכרטיס המשפחה). לחיצה פותחת MemberForm מאוכלס מראש. */}
            {cardOpsOn && fam.father && !fam.members.some((x) => x.isParent && x.gender === 'm') && (
              <ParentStubCard
                label="אב (להשלמה)"
                name={fam.father}
                onClick={() => {
                  setParentPrefill({ first: fam.father, gender: 'm', isParent: true });
                  setMemberModal(null);
                }}
              />
            )}
            {cardOpsOn && fam.mother && !fam.members.some((x) => x.isParent && x.gender === 'f') && (
              <ParentStubCard
                label="אם (להשלמה)"
                name={fam.mother}
                onClick={() => {
                  setParentPrefill({ first: fam.mother, gender: 'f', isParent: true });
                  setMemberModal(null);
                }}
              />
            )}
          </div>
        )}
      </section>

      {(credOn || docsOn) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          {credOn && <CredPanel fam={fam} />}
          {docsOn && <DocsPanel fam={fam} />}
        </div>
      )}

      <EnrollPanel fam={fam} />
      {/* רישום-לשנה-הבאה (courses.reenroll.familypanel) — מודול-חוגים, לא צדקה ⇒ מחוץ לצנעה. הפאנל מגדר את עצמו. */}
      <ReenrollFamilyPanel fam={fam} />
      <EventsPanel fam={fam} />
      {/* מצב-צנעה (SHOP10) מסתיר את פאנלי מקבלי-הצדקה מעיון מזדמן */}
      {privacyMode ? (
        <section className="card" style={{ fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center' }}>
          🕶️ מצב צנעה פעיל — מידע על סיוע/צדקה מוסתר
        </section>
      ) : (
        <>
          {featureOn(config, 'tzedaka.familypanel') && <TzFamilyPanel famId={fam.id} />}
          {featureOn(config, 'shop.familypanel') && <ShopFamilyPanel famId={fam.id} />}
          {featureOn(config, 'shop7.familypanel') && <Shop7FamilyPanel famId={fam.id} />}
        </>
      )}

      {editOpen && <FamilyForm family={fam} onClose={() => setEditOpen(false)} />}
      {memberModal !== undefined && (
        <MemberForm
          famId={fam.id}
          member={memberModal}
          prefill={memberModal === null ? parentPrefill : undefined}
          onClose={() => {
            setMemberModal(undefined);
            setParentPrefill(undefined);
          }}
        />
      )}

      {/* כפתור-חזרה מרחף קבוע בתחתית (בקשת-בעלים 19.8) */}
      <StickyBackBar onBack={() => selectFamily(null)} label={'→ כל ' + termOf(config, 'nav.families', 'משפחות')} />
    </div>
  );
}
