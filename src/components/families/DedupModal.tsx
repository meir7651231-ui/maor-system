/**
 * איחוד כפילויות משפחות — מציג קבוצות של משפחות שזוהו ככפולות (טלפון משותף או
 * שם+עיר זהים), מאפשר לבחור את רשומת ה"שומר", מציג תצוגה-מקדימה של המיזוג, ורק
 * לאחר אישור מפורש מבצע. המיזוג בטוח: בני-המשפחה עוברים לשומר עם אותם מזהים
 * (השיבוצים/התשלומים נשמרים), אירועים מופנים לשומר, שאר הרשומות נמחקות.
 *
 * גייט: settings.dedup.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { DUP_FIELDS, findDuplicateGroups, mergeFamilies } from '../../lib/dedup';
import { featureOn } from '../../lib/config';
import { Btn, Empty, Modal } from '../ui';

export function DedupModal({ onClose }: { onClose: () => void }) {
  const families = useApp((s) => s.db.families);
  const enrollments = useApp((s) => s.db.enrollments);
  const mergeFamilyGroup = useApp((s) => s.mergeFamilyGroup);
  const mergeFamilyGroupFields = useApp((s) => s.mergeFamilyGroupFields);
  const deleteFamily = useApp((s) => s.deleteFamily);
  const config = useApp((s) => s.config);
  const fieldsOn = featureOn(config, 'settings.dedup.fields');

  // דחייות בסשן — קבוצות שסומנו "לא כפילות".
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  // בחירת השומר לכל קבוצה (מזהה).
  const [keepers, setKeepers] = useState<Record<string, string>>({});
  // אישור מיזוג ממתין (מפתח-קבוצה) — שתי לחיצות.
  const [armed, setArmed] = useState<string | null>(null);
  // פער 21 — מצב שדה-שדה (לגאסי dupFieldMerge): קבוצה פתוחה + בחירות/עריכות.
  const [fieldsFor, setFieldsFor] = useState<string | null>(null);
  const [pick, setPick] = useState<Record<string, number>>({});
  const [edit, setEdit] = useState<Record<string, string>>({});
  // מחיקת רשומה מהקבוצה (לגאסי dupDrop) — שתי לחיצות.
  const [dropArmed, setDropArmed] = useState<string | null>(null);

  const groups = useMemo(() => findDuplicateGroups(families), [families]);
  const byId = useMemo(() => new Map(families.map((f) => [f.id, f])), [families]);
  const enrollCount = (memberIds: Set<string>) => enrollments.filter((e) => memberIds.has(e.memberId)).length;

  const visible = groups.filter((g) => !dismissed.has(g.join(',')));

  return (
    <Modal title="🔀 איחוד כפילויות" onClose={onClose} wide>
      <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12 }}>
        זוהו {groups.length} קבוצות כפילות (טלפון משותף או שם+עיר זהים). בחרו את הרשומה שתישאר (השומר) — השאר יימוזגו
        לתוכה: כל בני-המשפחה, המסמכים והשיבוצים נשמרים, שדות ריקים יתמלאו. אין מחיקת נתונים כספיים.
      </p>

      {visible.length === 0 ? (
        <Empty>אין כפילויות לטיפול 🎉</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '60vh', overflowY: 'auto' }}>
          {visible.map((g) => {
            const gkey = g.join(',');
            const fams = g.map((id) => byId.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof byId.get>>[];
            const keeperId = keepers[gkey] ?? g[0];
            const keeper = byId.get(keeperId);
            const losers = fams.filter((f) => f.id !== keeperId);
            const preview = keeper ? mergeFamilies(keeper, losers) : null;
            const previewMembers = new Set(preview?.members.map((m) => m.id) ?? []);
            return (
              <div key={gkey} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {fams.map((f) => {
                    const memIds = new Set(f.members.map((m) => m.id));
                    return (
                      <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={'keep-' + gkey}
                          checked={keeperId === f.id}
                          onChange={() => setKeepers((k) => ({ ...k, [gkey]: f.id }))}
                          style={{ width: 'auto', accentColor: 'var(--accent-deep)' }}
                        />
                        <span style={{ fontWeight: keeperId === f.id ? 800 : 600 }}>{f.name}</span>
                        <span style={{ color: 'var(--ink-faint)', fontSize: 12, direction: 'ltr' }}>
                          {[f.phone, f.city].filter(Boolean).join(' · ')}
                        </span>
                        <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>
                          {f.members.length} בני משפחה · {enrollCount(memIds)} שיבוצים
                        </span>
                        {keeperId === f.id && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-deep, var(--accent))' }}>← שומר</span>}
                        {fieldsOn && (
                          <Btn
                            sm
                            kind={dropArmed === f.id ? 'danger' : undefined}
                            onClick={() => {
                              if (dropArmed !== f.id) { setDropArmed(f.id); return; }
                              deleteFamily(f.id);
                              setDropArmed(null);
                            }}
                            title="מחיקת הרשומה הזו מהמערכת (לגאסי dupDrop)"
                          >
                            {dropArmed === f.id ? 'לאשר מחיקה?' : '🗑'}
                          </Btn>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* פער 21 — מיזוג שדה-שדה (לגאסי dupFieldMerge): בחירת ערך פר-שדה או עריכה ידנית */}
                {fieldsOn && fieldsFor === gkey && (
                  <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 8, marginBottom: 8, maxHeight: 260, overflowY: 'auto' }}>
                    {DUP_FIELDS.map((def) => (
                      <div key={def.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12.5 }}>
                        <span style={{ width: 90, flexShrink: 0, color: 'var(--ink-faint)', fontWeight: 600 }}>{def.label}</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                          {fams.map((f, i) => {
                            const v = def.get(f);
                            const selected = edit[def.key] == null && (pick[def.key] ?? fams.findIndex((x) => def.get(x))) === i;
                            return (
                              <button
                                key={f.id}
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
                          // הסדר: השומר הנבחר ראשון (בסיס), אחריו השאר — כמו fs בלגאסי
                          const ordered = [keeperId, ...g.filter((id) => id !== keeperId)];
                          // אינדקסי pick נבחרו מול סדר התצוגה (fams) — ממופים לסדר החדש
                          const remap: Record<string, number> = {};
                          for (const [k, i] of Object.entries(pick)) {
                            const fid = fams[i]?.id;
                            const ni = ordered.indexOf(fid ?? '');
                            if (ni >= 0) remap[k] = ni;
                          }
                          mergeFamilyGroupFields(ordered, remap, edit);
                          setFieldsFor(null); setPick({}); setEdit({});
                        }}
                      >
                        בצע מיזוג לפי הבחירה
                      </Btn>
                      <Btn sm onClick={() => { setFieldsFor(null); setPick({}); setEdit({}); }}>ביטול</Btn>
                    </div>
                  </div>
                )}

                {preview && (
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', background: 'var(--bg)', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                    <b>תצוגה מקדימה לאחר מיזוג:</b> {preview.name} · {previewMembers.size} בני משפחה ·{' '}
                    {enrollCount(previewMembers)} שיבוצים{preview.phone ? ' · ' + preview.phone : ''}
                    {preview.phone2 ? ' / ' + preview.phone2 : ''}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn
                    kind={armed === gkey ? 'danger' : 'primary'}
                    sm
                    onClick={() => {
                      if (armed !== gkey) {
                        setArmed(gkey);
                        return;
                      }
                      mergeFamilyGroup(keeperId, losers.map((l) => l.id));
                      setArmed(null);
                    }}
                  >
                    {armed === gkey ? 'לאשר מיזוג סופי?' : 'מזג ' + losers.length + ' אל השומר'}
                  </Btn>
                  {armed === gkey && <Btn sm onClick={() => setArmed(null)}>ביטול</Btn>}
                  {fieldsOn && fieldsFor !== gkey && (
                    <Btn sm onClick={() => { setFieldsFor(gkey); setPick({}); setEdit({}); }}>🧩 מיזוג לפי שדות</Btn>
                  )}
                  <Btn sm onClick={() => setDismissed((d) => new Set([...d, gkey]))}>לא כפילות</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Btn onClick={onClose}>סגירה</Btn>
      </div>
    </Modal>
  );
}
