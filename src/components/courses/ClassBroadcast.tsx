/**
 * 📢 הודעה-לכיתה (פאזה 6) — הודעת-WhatsApp מרוכזת לרוסטר-החוג. אפס-שרת: וואטסאפ
 * נפתח פר-נמען (wa.me) עם הטקסט שהוקלד; לוחצים "שלח" בכל צ'אט. נגזרת טהורה.
 */
import { useState } from 'react';
import type { Course } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { Btn, Empty, Field, Modal } from '../ui';
import { WaBtn } from '../WaBtn';
import { classContacts, classPhonesText, defaultClassMessage } from './broadcast';

export function ClassBroadcast(props: { course: Course; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);

  const orgName = config.orgName || db.orgName || '';
  const contacts = classContacts(db, props.course.id);
  const withPhone = contacts.filter((c) => c.phone);
  const [msg, setMsg] = useState(defaultClassMessage(props.course.name, orgName));

  return (
    <Modal title={'📢 הודעה לכיתה — ' + props.course.name} onClose={props.onClose} wide>
      <Field label="תוכן ההודעה">
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.currentTarget.value)}
          rows={3}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }}
        />
      </Field>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '4px 0 12px' }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{withPhone.length} נמענים עם טלפון (מתוך {contacts.length})</span>
        <div style={{ flex: 1 }} />
        <Btn
          sm
          disabled={!withPhone.length}
          onClick={() => {
            void navigator.clipboard?.writeText(classPhonesText(contacts));
            toast('רשימת-הטלפונים הועתקה');
          }}
        >
          📋 העתק טלפונים
        </Btn>
      </div>

      {contacts.length === 0 ? (
        <Empty>אין נמענים בחוג</Empty>
      ) : (
        contacts.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
            <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13.5 }}>{c.name}</span>
            {c.phone ? (
              <WaBtn phone={c.phone} text={msg} title="שליחה בוואטסאפ" />
            ) : (
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>אין טלפון</span>
            )}
          </div>
        ))
      )}

      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
        וואטסאפ נפתח פר-נמען (wa.me) — לוחצים "שלח" בכל צ'אט. אין שליחה-אוטומטית משרת.
      </div>
    </Modal>
  );
}
