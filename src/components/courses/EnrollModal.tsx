/**
 * שיבוץ תלמיד/ה לקורס — בוחר תלמיד עם חיפוש חכם על כל בני המשפחות,
 * בדיקת תפוסה (maxStudents), כפילות, ניקובים בכרטיסייה ושיוך קבוצה.
 */
import { useMemo, useState } from 'react';
import type { Course, Enrollment } from '../../types/domain';
import { allMembers, useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { smartFilter } from '../../lib/search';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { enrollCount, groupOptionsOf, isoToday } from './lib';

export function EnrollModal(props: { course: Course; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const cfg = useApp((s) => s.config);

  const punchOn = featureOn(cfg, 'courses.punch');
  const groupsOn = featureOn(cfg, 'courses.groups');

  const c = props.course;
  const [q, setQ] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [purchased, setPurchased] = useState(c.size ? String(c.size) : '12');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');

  const groups = groupsOn ? groupOptionsOf(c) : [];

  /** מועמדים לשיבוץ — כל בני המשפחות שעדיין לא משובצים לקורס הזה. */
  const options = useMemo(() => {
    const enrolledIds = new Set(db.enrollments.filter((e) => e.courseId === c.id).map((e) => e.memberId));
    return allMembers(db)
      .filter((m) => !enrolledIds.has(m.id))
      .map((m) => ({
        id: m.id,
        label: (m.isParent ? (m.gender === 'f' ? 'אמא — ' : 'אבא — ') : '') + m.first + ' · משפחת ' + m.famName,
        terms: [m.first, m.famName, (m.phone || '').replace(/\D/g, ''), m.idNum].filter(Boolean),
      }));
  }, [db, c.id]);

  // חיפוש חכם — סבלני לשגיאות הקלדה ולתעתיק, לפי שם/משפחה/טלפון/ת"ז
  const matches = useMemo(() => {
    if (!q.trim()) return options.slice(0, 7);
    return smartFilter(q, options, (o) => o.terms, 7);
  }, [q, options]);

  function pick(id: string, label: string) {
    setMemberId(id);
    setQ(label);
    setListOpen(false);
    setError('');
  }

  function save() {
    if (!memberId) return setError('יש לבחור תלמיד/ה');
    if (db.enrollments.some((e) => e.memberId === memberId && e.courseId === c.id))
      return setError('כבר משובץ/ת לחוג הזה');
    if (enrollCount(db, c.id) >= (c.maxStudents || 999))
      return setError('הקורס מלא — הגעתם למקסימום התלמידים שהוגדר');
    const isPunch = c.model === 'punch';
    const bought = isPunch ? +(purchased || c.size || 12) : 0;
    if (isPunch && (isNaN(bought) || bought <= 0)) return setError('מספר ניקובים חייב להיות גדול מ-0');

    const enrollment: Enrollment = {
      id: nextId('e'),
      memberId,
      courseId: c.id,
      plan: c.model,
      purchased: bought,
      used: 0,
      group,
      absences: [],
      payments: [],
      totalDue: 0,
      dueDate: '',
      status: 'active',
      note: '',
      enrolledAt: isoToday(),
    };
    upsertEnrollment(enrollment);
    toast('התלמיד/ה שובצ/ה לקורס');
    props.onClose();
  }

  return (
    <Modal title="שיבוץ תלמיד/ה לקורס" onClose={props.onClose}>
      <Field label="תלמיד/ה * (הקלדה חכמה — שם או משפחה)">
        <TextInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setListOpen(true);
            setMemberId('');
          }}
          placeholder="הקלידו שם — חיזוי חכם ותיקון שגיאות…"
        />
      </Field>
      {listOpen && (
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 10,
            marginTop: -8,
            marginBottom: 12,
            overflow: 'hidden',
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {matches.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o.id, o.label)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'right',
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 700,
                borderBottom: '1px solid #f2efe8',
              }}
            >
              {o.label}
            </button>
          ))}
          {matches.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--ink-faint)' }}>
              לא נמצאו תלמידים פנויים — בדקו את האיות או הוסיפו בן משפחה במסך המשפחות
            </div>
          )}
        </div>
      )}
      {groups.length > 0 && (
        <Field label="קבוצה — מסונכרן לקבוצות החוג">
          <Select
            value={group}
            onChange={setGroup}
            options={[{ value: '', label: 'ללא שיוך' }, ...groups.map((g) => ({ value: g.v, label: g.t }))]}
          />
        </Field>
      )}
      {punchOn && c.model === 'punch' && (
        <Field label="ניקובים בכרטיסייה">
          <TextInput value={purchased} onChange={setPurchased} placeholder="12" dir="ltr" />
        </Field>
      )}
      <FormError error={error} />
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שיבוץ
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
