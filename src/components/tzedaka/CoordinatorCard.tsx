/**
 * הכרטיס הפנימי של הרכז/ת (קופות 4, דפוס CourseDetail) — פרטים, ניקוד
 * והיסטוריה (tzedaka.score), והקופות מקוננות עם פעולות פר-קופה.
 * הקישור לבן-המשפחה מוצג בשם בלבד — לא ניווט (בידוד).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, moduleOn, termOf } from '../../lib/config';
import type { TzBox, TzCoordinator } from '../../types/domain';
import { Btn, Chip, Empty, Field, Modal, Select, TextInput } from '../ui';
import { useArmed } from '../useArmed';
import { boxTotal, coordinatorBoxes, coordinatorPrintLines, coordinatorTotal, filterCollections, lastCollectionIso } from './lib';
import { downloadText } from '../reports/csv';
import { BoxForm } from './BoxForm';
import { CollectModal } from './CollectModal';
import { CoordinatorForm } from './CoordinatorForm';

const STATUS_LABEL: Record<TzBox['status'], string> = {
  home: '🏠 אצל המשפחה',
  office: '🏢 במשרד',
  lost: '⚠ אבדה',
  retired: '📦 הוצאה משימוש',
};

export function CoordinatorCard(props: { coordinator: TzCoordinator; onBack: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertTzBox = useApp((s) => s.upsertTzBox);
  const deleteTzBox = useApp((s) => s.deleteTzBox);
  const addTzScore = useApp((s) => s.addTzScore);
  const toast = useApp((s) => s.toast);
  const scoreOn = featureOn(config, 'tzedaka.score');
  const histOn = featureOn(config, 'tzedaka.history');
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));

  const c = props.coordinator;
  const boxes = coordinatorBoxes(db.tzBoxes, c.id);
  const fam = db.families.find((x) => x.id === c.famId);
  const member = fam?.members.find((m) => m.id === c.memberId);

  const [editOpen, setEditOpen] = useState(false);
  const [boxForm, setBoxForm] = useState<{ box: TzBox | null } | null>(null);
  const [collectFor, setCollectFor] = useState<TzBox | null>(null);
  const [openHist, setOpenHist] = useState<string | null>(null);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [tune, setTune] = useState({ delta: '', reason: '' });
  // סינון היסטוריית הריקונים (UX סינון 1) — מוצג רק כשיש >5 ריקונים
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');
  const [histCamp, setHistCamp] = useState('');
  const go = useApp((s) => s.go);
  const selectFamily = useApp((s) => s.selectFamily);
  const familiesOn = moduleOn(config, 'families');

  const holderLabel = (b: TzBox) => {
    const holder = db.families.find((x) => x.id === b.famId);
    if (!holder) return '—';
    return (
      (b.holderKind === 'supported' ? '🤲 ' : b.holderKind === 'donor' ? '💛 ' : '') +
      termOf(config, 'entity.familyOf', 'משפחת') + ' ' + holder.name
    );
  };

  function applyTune() {
    const d = Math.round(+tune.delta);
    if (!Number.isFinite(d) || !d || !tune.reason.trim()) {
      toast('כוונון דורש מספר (חיובי/שלילי) ונימוק');
      return;
    }
    addTzScore(c.id, d, tune.reason.trim());
    toast('הניקוד עודכן: ' + (d > 0 ? '+' : '') + d + ' נק׳');
    setTuneOpen(false);
    setTune({ delta: '', reason: '' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn onClick={props.onBack}>{'→ כל ה' + termOf(config, 'entity.tzCoordinator', 'רכז') + 'ים'}</Btn>
        {/* תדפיס שטח (CONNECT חיבור 6) — שורות טהורות מ-lib, הורדה בדפוס הקיים */}
        {featureOn(config, 'tzedaka.export') && (
          <Btn onClick={() => downloadText('coordinator-' + c.name + '.txt', coordinatorPrintLines(db, c.id, config))} title="רשימת הקופות לסבב שטח">
            🖨 תדפיס {termOf(config, 'entity.tzCoordinator', 'רכז')}
          </Btn>
        )}
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          aria-hidden
          style={{ width: 52, height: 52, borderRadius: 99, background: 'var(--dark)', color: 'var(--amber)', fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
        >
          {c.name ? c.name[0] : '🪙'}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 19 }}>{c.name}</span>
            <Chip on={c.active}>{c.active ? 'פעיל/ה' : 'לא פעיל/ה'}</Chip>
            {scoreOn && <Chip on>{'🏆 ' + c.score + ' נק׳'}</Chip>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3 }}>
            {(c.phone || 'ללא טלפון') +
              (fam ? ' · ' + termOf(config, 'entity.familyOf', 'משפחת') + ' ' + fam.name + (member ? ' — ' + member.first : '') : '') +
              (c.startDate ? ' · מאז ' + c.startDate : '')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {scoreOn && <Btn onClick={() => setTuneOpen(true)}>± כוונון ניקוד</Btn>}
          <Btn onClick={() => setEditOpen(true)}>✎ עריכה</Btn>
        </div>
      </div>

      {/* הקופות המקוננות — דפוס שורות החוגים */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800 }}>
            {termOf(config, 'entity.tzBox', 'קופה') + 'ות (' + boxes.length + ') · ' + coordinatorTotal(db.tzBoxes, c.id).toLocaleString('he-IL') + ' ₪'}
          </h2>
          <Btn kind="primary" sm onClick={() => setBoxForm({ box: null })}>
            ➕ הוספת {termOf(config, 'entity.tzBox', 'קופה')}
          </Btn>
        </div>
        {boxes.length === 0 && <Empty>עדיין אין קופות לרכז/ת — הוסיפו עם "➕ הוספת {termOf(config, 'entity.tzBox', 'קופה')}"</Empty>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {boxes.map((b) => (
            <div key={b.id} style={{ border: '1px solid var(--line)', borderRadius: 11, padding: '9px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800 }}>{'#' + b.num}</span>
                {/* קישור-צולב לכרטיס המשפחה (UX סינון 1) — מגודר moduleOn */}
                {b.famId && familiesOn ? (
                  <Btn sm onClick={() => { selectFamily(b.famId); go('families'); }} title={'לכרטיס ה' + termOf(config, 'entity.family', 'משפחה')}>
                    {holderLabel(b) + ' ←'}
                  </Btn>
                ) : (
                  <span style={{ fontSize: 13, minWidth: 0 }}>{holderLabel(b)}</span>
                )}
                <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{STATUS_LABEL[b.status]}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                  {'ריקון אחרון: ' + (lastCollectionIso(b) || '—') + ' · סה"כ ' + boxTotal(b).toLocaleString('he-IL') + ' ₪'}
                </span>
                <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Btn sm onClick={() => setCollectFor(b)} title="רישום ריקון">💰 ריקון</Btn>
                  <Btn sm onClick={() => setBoxForm({ box: b })} title="עריכת הקופה">✏️</Btn>
                  {featureOn(config, 'tzedaka.boxstatus') && b.status === 'home' && (
                    <Btn
                      sm
                      onClick={() => {
                        // ההיסטוריה נשארת (famId לא מנוקה) — רק הסטטוס משתנה
                        upsertTzBox({ ...b, status: 'office' });
                        toast('קופה ' + b.num + ' חזרה למשרד');
                      }}
                      title="החזרה למשרד"
                    >
                      ⤵ למשרד
                    </Btn>
                  )}
                  {featureOn(config, 'tzedaka.boxstatus') && b.status !== 'lost' && b.status !== 'retired' && (
                    <Btn
                      sm
                      onClick={() => {
                        upsertTzBox({ ...b, status: 'lost' });
                        toast('קופה ' + b.num + ' סומנה כאבודה — מופיעה בטיפול');
                      }}
                      title="סימון כאבודה"
                    >
                      ⚠ אבדה
                    </Btn>
                  )}
                  <Btn
                    sm
                    kind="danger"
                    onClick={() => {
                      if (!confirmTwice('tzb-' + b.id, 'למחוק את קופה ' + b.num + '? כל הריקונים שלה יימחקו.')) {
                        toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
                        return;
                      }
                      deleteTzBox(b.id);
                      toast('הקופה נמחקה');
                    }}
                  >
                    {armed === 'tzb-' + b.id ? 'בטוח?' : '🗑'}
                  </Btn>
                  {histOn && (
                    <Btn sm onClick={() => setOpenHist(openHist === b.id ? null : b.id)}>
                      {openHist === b.id ? '▲' : '▼ היסטוריה'}
                    </Btn>
                  )}
                </span>
              </div>
              {histOn && openHist === b.id && (
                <div style={{ marginTop: 8, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                  {b.collections.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>עדיין אין ריקונים</div>}
                  {/* סינון ההיסטוריה (UX סינון 1) — טווח + מבצע, רק כשיש >5 ריקונים */}
                  {featureOn(config, 'tzedaka.histfilter') && b.collections.length > 5 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center', fontSize: 12.5 }}>
                      <span>מ-</span>
                      <input type="date" dir="ltr" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} />
                      <span>עד</span>
                      <input type="date" dir="ltr" value={histTo} onChange={(e) => setHistTo(e.target.value)} />
                      {db.tzCampaigns.length > 0 && (
                        <Select
                          value={histCamp}
                          onChange={setHistCamp}
                          options={[
                            { value: '', label: 'כל ה' + termOf(config, 'entity.tzCampaign', 'מבצע') + 'ים' },
                            ...db.tzCampaigns.map((p) => ({ value: p.id, label: p.name })),
                          ]}
                        />
                      )}
                    </div>
                  )}
                  {filterCollections(b, histFrom, histTo, histCamp).map((l) => (
                    <div key={l.id} style={{ display: 'flex', gap: 10, fontSize: 12.5, padding: '3px 0' }}>
                      <span style={{ color: 'var(--ink-faint)' }}>{l.date}</span>
                      <span style={{ fontWeight: 700 }}>{l.amount.toLocaleString('he-IL') + ' ₪'}</span>
                      {l.campaignId && (
                        <span>{db.tzCampaigns.find((p) => p.id === l.campaignId)?.name ?? ''}</span>
                      )}
                      <span style={{ color: 'var(--ink-faint)', minWidth: 0 }}>{l.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ניקוד — היסטוריה (tzedaka.score) */}
      {scoreOn && (
        <section className="card">
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🏆 היסטוריית ניקוד</h2>
          {c.scoreLog.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>עדיין אין רישומי ניקוד — הריקון הראשון יזכה בנקודות</div>
          ) : (
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {c.scoreLog.slice(0, 12).map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{l.date}</span>
                  <span style={{ fontWeight: 800, color: l.delta > 0 ? '#12803c' : '#b91c1c', direction: 'ltr' }}>
                    {(l.delta > 0 ? '+' : '') + l.delta}
                  </span>
                  <span style={{ flex: 1 }}>{l.reason}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {editOpen && <CoordinatorForm coordinator={c} onClose={() => setEditOpen(false)} />}
      {boxForm && <BoxForm box={boxForm.box} coordinatorId={c.id} onClose={() => setBoxForm(null)} />}
      {collectFor && <CollectModal box={collectFor} onClose={() => setCollectFor(null)} />}
      {tuneOpen && (
        <Modal title="± כוונון ניקוד ידני" onClose={() => setTuneOpen(false)}>
          <div className="form-grid">
            <Field label="דלתא (חיובי/שלילי) *">
              <TextInput value={tune.delta} onChange={(v) => setTune({ ...tune, delta: v })} type="number" dir="ltr" placeholder="10 / -5" />
            </Field>
            <Field label="נימוק *">
              <TextInput value={tune.reason} onChange={(v) => setTune({ ...tune, reason: v })} placeholder="לדוגמה: עזרה במיון הקופות" />
            </Field>
          </div>
          <div className="modal-actions">
            <Btn kind="primary" onClick={applyTune}>עדכון</Btn>
            <Btn onClick={() => setTuneOpen(false)}>ביטול</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
