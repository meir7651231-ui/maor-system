/**
 * טאב הרכזים (קופות 4; שורת-כלים — UX סינון 1) — גריד כרטיסים עם חיפוש
 * (smartFilter), "פעילים בלבד" (ברירת דלוק) ומיון; מתג "📦 כל הקופות"
 * מחליף לטבלת קופות עם חיפוש/סינון-סטטוס/מיון וקישור-צולב למשפחה.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, moduleOn, termOf } from '../../lib/config';
import { WaBtn } from '../WaBtn';
import type { TzBoxStatus } from '../../types/domain';
import { Btn, Chip, Empty, Select, TextInput } from '../ui';
import { boxesOverview, coordinatorBoxes, coordinatorTotal, filterCoordinators } from './lib';
import { CoordinatorForm } from './CoordinatorForm';
import { CoordinatorCard } from './CoordinatorCard';

const STATUS_LABEL: Record<TzBoxStatus, string> = {
  home: '🏠 אצל משפחה',
  office: '🏢 במשרד',
  lost: '⚠ אבדה',
  retired: '📦 הוצאה משימוש',
};

export function CoordinatorsTab(props: { selId: string | null; onSelect: (id: string | null) => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const go = useApp((s) => s.go);
  const selectFamily = useApp((s) => s.selectFamily);
  const scoreOn = featureOn(config, 'tzedaka.score');
  const familiesOn = moduleOn(config, 'families');
  const [formOpen, setFormOpen] = useState(false);
  // שורת הכלים (UX סינון 1) — דפוס SupportersView
  const [q, setQ] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [sort, setSort] = useState<'name' | 'score' | 'total' | 'stale'>('name');
  // מבט "כל הקופות"
  const [boxesView, setBoxesView] = useState(false);
  const [boxQ, setBoxQ] = useState('');
  const [boxStatus, setBoxStatus] = useState<TzBoxStatus | ''>('');
  const [boxSort, setBoxSort] = useState<'num' | 'lastCollection' | 'total'>('num');

  const selected = db.tzCoordinators.find((c) => c.id === props.selId);
  if (selected) return <CoordinatorCard coordinator={selected} onBack={() => props.onSelect(null)} />;

  const shown = filterCoordinators(db.tzCoordinators, db.tzBoxes, q, onlyActive, sort);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip on={boxesView} onClick={() => setBoxesView((v) => !v)}>📦 כל הקופות</Chip>
        {!boxesView ? (
          <>
            <TextInput value={q} onChange={setQ} placeholder={'🔍 חיפוש ' + termOf(config, 'entity.tzCoordinator', 'רכז')} />
            <Chip on={onlyActive} onClick={() => setOnlyActive((v) => !v)}>פעילים בלבד</Chip>
            <Select
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { value: 'name', label: 'מיון: שם' },
                ...(scoreOn ? [{ value: 'score', label: 'מיון: ניקוד' }] : []),
                { value: 'total', label: 'מיון: סה"כ שנאסף' },
                { value: 'stale', label: 'מיון: ריקון ישן קודם' },
              ]}
            />
          </>
        ) : (
          <>
            <TextInput value={boxQ} onChange={setBoxQ} placeholder={'🔍 מספר / רכז / ' + termOf(config, 'entity.family', 'משפחה')} />
            <Select
              value={boxStatus}
              onChange={(v) => setBoxStatus(v as TzBoxStatus | '')}
              options={[
                { value: '', label: 'כל הסטטוסים' },
                ...(Object.keys(STATUS_LABEL) as TzBoxStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
              ]}
            />
            <Select
              value={boxSort}
              onChange={(v) => setBoxSort(v as typeof boxSort)}
              options={[
                { value: 'num', label: 'מיון: מספר' },
                { value: 'lastCollection', label: 'מיון: ריקון ישן קודם' },
                { value: 'total', label: 'מיון: סה"כ' },
              ]}
            />
          </>
        )}
        <span style={{ marginInlineStart: 'auto' }}>
          <Btn kind="primary" onClick={() => setFormOpen(true)}>
            ➕ הוספת {termOf(config, 'entity.tzCoordinator', 'רכז')}
          </Btn>
        </span>
      </div>

      {boxesView ? (
        <div className="card" style={{ padding: 8 }}>
          {db.tzBoxes.length === 0 && <Empty>עדיין אין {termOf(config, 'entity.tzBox', 'קופה')}ות</Empty>}
          {boxesOverview(db, boxQ, boxStatus, boxSort).map((r) => (
            <div key={r.box.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '7px 8px', borderBottom: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => props.onSelect(r.box.coordinatorId)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, padding: 0 }}
                title="פתיחת כרטיס הרכז/ת"
              >
                {'#' + r.box.num}
              </button>
              <span style={{ fontSize: 13 }}>{r.coordName}</span>
              {r.famName &&
                (familiesOn ? (
                  <Btn sm onClick={() => { selectFamily(r.box.famId); go('families'); }} title={'לכרטיס ה' + termOf(config, 'entity.family', 'משפחה')}>
                    {termOf(config, 'entity.familyOf', 'משפחת') + ' ' + r.famName + ' ←'}
                  </Btn>
                ) : (
                  <span style={{ fontSize: 12.5 }}>{termOf(config, 'entity.familyOf', 'משפחת') + ' ' + r.famName}</span>
                ))}
              <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{STATUS_LABEL[r.box.status]}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginInlineStart: 'auto' }}>
                {'ריקון אחרון: ' + (r.last || '—') + ' · ' + r.total.toLocaleString('he-IL') + ' ₪'}
              </span>
            </div>
          ))}
        </div>
      ) : db.tzCoordinators.length === 0 ? (
        <Empty>
          עדיין אין {termOf(config, 'entity.tzCoordinator', 'רכז')}ים — הוסיפו עם "➕ הוספת{' '}
          {termOf(config, 'entity.tzCoordinator', 'רכז')}"
        </Empty>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
          {shown.map((c) => {
            const boxes = coordinatorBoxes(db.tzBoxes, c.id);
            return (
              <button
                key={c.id}
                type="button"
                className="card"
                onClick={() => props.onSelect(c.id)}
                style={{ textAlign: 'right', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                title="פתיחת כרטיס הרכז/ת"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</span>
                  <Chip on={c.active}>{c.active ? 'פעיל/ה' : 'לא פעיל/ה'}</Chip>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                  {/* INTEGRATIONS גל א׳ — 💬 וואטסאפ לרכז/ת; הרווח בתוך הגידור (ביט-זהה) */}
                  {integrationOn(config, 'whatsapp') && c.phone ? <><WaBtn phone={c.phone} title={'וואטסאפ ל' + c.name} />{' '}</> : null}
                  {c.phone || 'ללא טלפון'}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {scoreOn && <span style={{ marginInlineEnd: 8 }}>{'🏆 ' + c.score + ' נק׳'}</span>}
                  {boxes.length + ' קופות · ' + coordinatorTotal(db.tzBoxes, c.id).toLocaleString('he-IL') + ' ₪'}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {formOpen && <CoordinatorForm coordinator={null} onClose={() => setFormOpen(false)} />}
    </div>
  );
}
