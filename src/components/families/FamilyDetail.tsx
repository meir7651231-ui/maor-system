/**
 * כרטיס משפחה — פרטי קשר והורים, בני משפחה (הוספה/עריכה/מחיקה),
 * מסמכים, מדד אמינות, שיבוצים ואירועים מקושרים.
 */
import { useState } from 'react';
import type { Family, Member } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty } from '../ui';
import { ageOf, chipStyle, fmtDate, STATUS_META } from './lib';
import { FamilyForm } from './FamilyForm';
import { MemberForm } from './MemberForm';
import { CredPanel, DocsPanel, EnrollPanel, EventsPanel } from './FamilyPanels';

function InfoRow(props: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{props.k}</span>
      <span style={{ fontWeight: 600, textAlign: 'left', overflowWrap: 'anywhere' }}>{props.v}</span>
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
        {m.health && <div style={{ fontSize: 12, color: '#b91c1c' }}>⚕ {m.health}</div>}
        {media.length > 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>🗂 {media.join(' · ')}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
        <Btn sm onClick={props.onEdit} title="עריכה">
          ✎
        </Btn>
        <Btn sm kind="danger" onClick={props.onDelete} title="הסרה מהמשפחה">
          🗑
        </Btn>
      </div>
    </div>
  );
}

export function FamilyDetail(props: { family: Family }) {
  const fam = props.family;
  const selectFamily = useApp((s) => s.selectFamily);
  const deleteFamily = useApp((s) => s.deleteFamily);
  const deleteMember = useApp((s) => s.deleteMember);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const credOn = featureOn(config, 'families.cred');
  const docsOn = featureOn(config, 'families.docs');

  const [showIds, setShowIds] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  /** undefined=סגור · null=בן משפחה חדש · Member=עריכה */
  const [memberModal, setMemberModal] = useState<Member | null | undefined>(undefined);

  const st = STATUS_META[fam.status];
  const parents = [fam.father, fam.mother].filter(Boolean).join(' ו');
  const addressLine = [fam.address, fam.city].filter(Boolean).join(', ');

  function onDeleteFamily() {
    const ok = window.confirm(
      'למחוק את משפחת ' + fam.name + '? הפעולה תמחק גם את בני המשפחה, השיבוצים והאירועים המקושרים.',
    );
    if (!ok) return;
    deleteFamily(fam.id);
    selectFamily(null);
    toast('משפחת ' + fam.name + ' נמחקה מהמערכת');
  }

  function onDeleteMember(m: Member) {
    const ok = window.confirm('להסיר את ' + m.first + ' ממשפחת ' + fam.name + '? השיבוצים שלו/ה יימחקו גם כן.');
    if (!ok) return;
    deleteMember(fam.id, m.id);
    toast(m.first + ' הוסר/ה מהמשפחה');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <Btn onClick={() => selectFamily(null)}>→ כל המשפחות</Btn>
      </div>

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
              משפחת {fam.name}
            </h1>
            <span style={chipStyle(st.bg, st.c)}>{st.label}</span>
            {fam.community && <span style={chipStyle('#eceae2', '#4d463c')}>{fam.community}</span>}
            {fam.discount && <span style={chipStyle('#fdf1d4', '#9a6414')}>🏷 {fam.discount}</span>}
            {fam.createdAt && (
              <span style={chipStyle('#e7edf5', '#3a5a86')}>הצטרפה {hebDateFull(fam.createdAt)}</span>
            )}
          </div>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {[parents, addressLine].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => setEditOpen(true)}>✎ עריכת משפחה</Btn>
          <Btn kind="danger" onClick={onDeleteFamily}>
            🗑 מחיקת משפחה
          </Btn>
        </div>
      </div>

      {/* פרטי קשר + פרטים נוספים */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>פרטי קשר והורים</h2>
            <Btn sm onClick={() => setShowIds((v) => !v)}>
              {showIds ? 'הסתר ת"ז' : 'הצג ת"ז'}
            </Btn>
          </div>
          <InfoRow k="שם האב" v={fam.father || '—'} />
          <InfoRow k={'ת"ז האב'} v={maskId(fam.fatherId, showIds)} />
          <InfoRow k="שם האם" v={fam.mother || '—'} />
          <InfoRow k={'ת"ז האם'} v={maskId(fam.motherId, showIds)} />
          <InfoRow k="טלפון ראשי" v={fam.phone || '—'} />
          <InfoRow k="טלפון נוסף" v={fam.phone2 || '—'} />
          <InfoRow k="אימייל" v={fam.email || '—'} />
          <InfoRow k="כתובת" v={addressLine || '—'} />
        </section>
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
            {fam.notes || 'אין הערות למשפחה זו.'}
          </div>
        </section>
      </div>

      {/* בני המשפחה */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>בני המשפחה</h2>
          <Btn onClick={() => setMemberModal(null)}>+ הוספת בן משפחה</Btn>
        </div>
        {fam.members.length === 0 ? (
          <Empty>עדיין לא נרשמו בני משפחה</Empty>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {fam.members.map((m) => (
              <MemberCard key={m.id} m={m} onEdit={() => setMemberModal(m)} onDelete={() => onDeleteMember(m)} />
            ))}
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
      <EventsPanel fam={fam} />

      {editOpen && <FamilyForm family={fam} onClose={() => setEditOpen(false)} />}
      {memberModal !== undefined && (
        <MemberForm famId={fam.id} member={memberModal} onClose={() => setMemberModal(undefined)} />
      )}
    </div>
  );
}
