/**
 * 🔗 איחוד כפולי-תורמים (ROADMAP-100 ‏#13, 5.8.2026 · שודרג 19.8) — אותו דפוס
 * כמו המשפחות, כולל **מיזוג שדה-שדה** (בחירת-ערך פר-שדה או עריכה ידנית) ו-🗑
 * הסרת-רשומה מהקבוצה — פאריטי מלא עם `DedupModal` של המשפחות.
 *
 * מפתחות-הזיהוי: טלפון / אימייל / **ת"ז** / **מזהה-חיצוני (ToremId נדרים)** /
 * שם+עיר — כך שהתאמה מתבצעת גם כששם/טלפון שונים (זיהוי-100% מול הספק).
 *
 * עקרון-בטיחות: כל התרומות (עם ה-rid) וה-hist עוברים — שום רשומה כספית לא נמחקת.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { findSupporterDupGroups, SUP_DUP_FIELDS } from '../../lib/dedup';
import { featureOn, termOf } from '../../lib/config';
import { Btn, Empty, Modal } from '../ui';
import { supCount, totalLabel } from './lib';

export function SupDedupModal(props: { onClose: () => void }) {
  const supporters = useApp((s) => s.db.supporters);
  const config = useApp((s) => s.config);
  const mergeSupportersGroup = useApp((s) => s.mergeSupportersGroup);
  const mergeSupportersFields = useApp((s) => s.mergeSupportersFields);
  const deleteSupporter = useApp((s) => s.deleteSupporter);
  const fieldsOn = featureOn(config, 'settings.dedup.fields');

  const groups = findSupporterDupGroups(supporters);
  // ה"שומר" הנבחר פר-קבוצה — ברירת-מחדל: בעל-התרומות-הרבות (נקבע ברינדור)
  const [keepSel, setKeepSel] = useState<Record<number, string>>({});
  // רשת-ביטחון כמו במשפחות — מיזוג חמוש בשני שלבים
  const [armed, setArmed] = useState<number | null>(null);
  // מיזוג שדה-שדה: קבוצה פתוחה + בחירות/עריכות
  const [fieldsFor, setFieldsFor] = useState<number | null>(null);
  const [pick, setPick] = useState<Record<string, number>>({});
  const [edit, setEdit] = useState<Record<string, string>>({});
  // הסרת רשומה מהקבוצה — שתי לחיצות
  const [dropArmed, setDropArmed] = useState<string | null>(null);

  return (
    <Modal title={'🔗 איחוד כפולי-' + termOf(config, 'nav.supporters', 'תורמים')} onClose={props.onClose} wide>
      {groups.length === 0 ? (
        <Empty>לא נמצאו כפולים 🎉 (החיפוש: טלפון / אימייל / ת"ז / מזהה-חיצוני / שם+עיר זהים)</Empty>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>
            זוהו {groups.length} קבוצות (טלפון / אימייל / ת"ז / מזהה-חיצוני / שם+עיר). בחרו את הכרטיס שנשאר; כל ה
            {termOf(config, 'entity.donations', 'תרומות')} והקבלות של האחרים עוברות אליו — שום רשומה כספית לא נמחקת.
          </div>
          {groups.map((g, gi) => {
            const rows = g
              .map((id) => supporters.find((s) => s.id === id))
              .filter((s): s is NonNullable<typeof s> => !!s)
              .sort((a, b) => supCount(b) - supCount(a));
            if (rows.length < 2) return null;
            const keepId = keepSel[gi] ?? rows[0].id;
            return (
              <div key={gi} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                {rows.map((sp) => (
                  <label key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name={'keep-' + gi}
                      checked={keepId === sp.id}
                      onChange={() => setKeepSel({ ...keepSel, [gi]: sp.id })}
                      style={{ width: 'auto' }}
                    />
                    <span style={{ fontWeight: keepId === sp.id ? 800 : 600, flex: 1 }}>{sp.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)', direction: 'ltr' }}>{sp.phone || sp.email || sp.idNum || '—'}</span>
                    <span style={{ fontSize: 12 }}>{supCount(sp) + ' · ' + totalLabel(sp)}</span>
                    {keepId === sp.id && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-deep, var(--accent))' }}>← שומר</span>}
                    {fieldsOn && (
                      <Btn
                        sm
                        kind={dropArmed === sp.id ? 'danger' : undefined}
                        onClick={() => {
                          if (dropArmed !== sp.id) { setDropArmed(sp.id); return; }
                          deleteSupporter(sp.id);
                          setDropArmed(null);
                        }}
                        title="הסרת הרשומה הזו מהמערכת"
                      >
                        {dropArmed === sp.id ? 'לאשר מחיקה?' : '🗑'}
                      </Btn>
                    )}
                  </label>
                ))}

                {/* מיזוג שדה-שדה: בחירת ערך פר-שדה או עריכה ידנית (הכסף אינו נבחר-ידנית) */}
                {fieldsOn && fieldsFor === gi && (
                  <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 8, margin: '8px 0', maxHeight: 260, overflowY: 'auto' }}>
                    {SUP_DUP_FIELDS.map((def) => (
                      <div key={def.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12.5 }}>
                        <span style={{ width: 72, flexShrink: 0, color: 'var(--ink-faint)', fontWeight: 600 }}>{def.label}</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                          {rows.map((sp, i) => {
                            const v = def.get(sp);
                            const selected = edit[def.key] == null && (pick[def.key] ?? rows.findIndex((x) => def.get(x))) === i;
                            return (
                              <button
                                key={sp.id}
                                onClick={() => { setPick((p) => ({ ...p, [def.key]: i })); setEdit((e) => { const { [def.key]: _drop, ...rest } = e; return rest; }); }}
                                style={{
                                  border: '1px solid ' + (selected ? 'var(--accent-deep, var(--accent))' : 'var(--line)'),
                                  background: selected ? 'var(--bg)' : 'transparent', borderRadius: 6, padding: '2px 8px',
                                  cursor: 'pointer', fontWeight: selected ? 700 : 400, maxWidth: 160, overflow: 'hidden',
                                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}
                                title={v || '(ריק)'}
                              >
                                {v || '—'}
                              </button>
                            );
                          })}
                          <input
                            value={edit[def.key] ?? ''}
                            onChange={(ev) => setEdit((e) => ({ ...e, [def.key]: ev.target.value }))}
                            placeholder="או ערך ידני…"
                            style={{ width: 110, fontSize: 12, padding: '2px 6px' }}
                          />
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <Btn
                        kind="primary"
                        sm
                        onClick={() => {
                          // סדר: השומר הנבחר ראשון (בסיס), אחריו השאר; אינדקסי pick
                          // נבחרו מול סדר-התצוגה (rows) — ממופים לסדר-החדש.
                          const ordered = [keepId, ...rows.map((r) => r.id).filter((id) => id !== keepId)];
                          const remap: Record<string, number> = {};
                          for (const [k, i] of Object.entries(pick)) {
                            const sid = rows[i]?.id;
                            const ni = ordered.indexOf(sid ?? '');
                            if (ni >= 0) remap[k] = ni;
                          }
                          mergeSupportersFields(ordered, remap, edit);
                          setFieldsFor(null); setPick({}); setEdit({});
                        }}
                      >
                        בצע מיזוג לפי הבחירה
                      </Btn>
                      <Btn sm onClick={() => { setFieldsFor(null); setPick({}); setEdit({}); }}>ביטול</Btn>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  <Btn
                    sm
                    kind={armed === gi ? 'danger' : 'primary'}
                    onClick={() => {
                      if (armed !== gi) {
                        setArmed(gi);
                        return;
                      }
                      mergeSupportersGroup(keepId, rows.map((r) => r.id));
                      setArmed(null);
                    }}
                  >
                    {armed === gi ? 'לאשר מיזוג סופי?' : '🔗 מזג את הקבוצה לתוך הנבחר'}
                  </Btn>
                  {armed === gi && <Btn sm onClick={() => setArmed(null)}>ביטול</Btn>}
                  {fieldsOn && fieldsFor !== gi && (
                    <Btn sm onClick={() => { setFieldsFor(gi); setPick({}); setEdit({}); }}>🧩 מיזוג לפי שדות</Btn>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
      <div className="modal-actions">
        <Btn onClick={props.onClose}>סגירה</Btn>
      </div>
    </Modal>
  );
}
