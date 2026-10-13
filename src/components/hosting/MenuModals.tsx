/**
 * 📖 התפריט (menuModal של המקור) — גלריית-מנות (סוג/צבע/מחיר/נתונים/אלרגנים/טבח), ＋ מנה, ✕ מחיקה (hosting.delete);
 * ועורך-המנה (dishModal): תצוגה-חיה, שם/סוג×6/מחיר/הכנה/בישול/טמפ׳/מנות-בסיס/אלרגנים, רכיבים (שם · כמות), שלבים ↑↓,
 * טבח-ברירת-מחדל, הערות.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import type { HostDish } from '../../types/domain';
import { useHostData, useHostEnv } from './hooks';
import { FInput, FSelect, HModal, clickable, cssVar, h, useHostUi } from './hui';
import { money } from './lib';
import { parseIng, shopIcon } from './kitchen';
import { KT_TYPES, ktMeta } from './labels';

export function MenuDialog() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const del = useApp((s) => s.deleteHostRecord);
  const toast = useApp((s) => s.toast);
  return (
    <HModal
      title="📖 התפריט"
      maxWidth={760}
      onClose={ui.close}
      footer={
        <button type="button" className={h('btn ghost')} onClick={ui.close}>
          סגור
        </button>
      }
    >
      <div className="h-menuhead">
        <button type="button" className={h('btn')} onClick={() => ui.open({ k: 'dish', id: null })}>
          ＋ מנה חדשה
        </button>
        <span className="h-mcount">{d.dishes.length} מנות בתפריט</span>
      </div>
      {d.dishes.length ? (
        <div className="h-menugrid h-dashfx">
          {d.dishes.map((m) => {
            const meta = ktMeta(m.type);
            const chef = m.defBy ? d.staffName(m.defBy) : '';
            const stats = [
              m.ingredients.length ? '🥕 ' + m.ingredients.length + ' רכיבים' : '',
              m.steps.length ? '👨‍🍳 ' + m.steps.length + ' שלבים' : '',
              m.prepTime ? '⏱ ' + m.prepTime + 'ד׳' : '',
              m.cookTemp ? '🌡 ' + m.cookTemp + '°' : '',
              '🍽️ ' + (m.baseServings || 4),
            ].filter(Boolean);
            return (
              <div key={m.id} className="h-dishcard" style={cssVar('bc', meta[1])} {...clickable(() => ui.open({ k: 'dish', id: m.id }))}>
                <div className="h-dc-top">
                  <span className="h-dc-badge">
                    {meta[0]} {m.type}
                  </span>
                  {env.canDelete && (
                    <button
                      type="button"
                      className={h('iconbtn2 danger dc-del')}
                      title="מחק"
                      aria-label={'מחיקת ' + m.name}
                      onClick={() =>
                        ui.confirm('למחוק את המנה "' + m.name + '"?', () => {
                          if (del(m.id)) {
                            ui.open({ k: 'menu' });
                            toast('נמחק');
                          }
                        })
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="h-dc-name">{m.name}</div>
                <div className="h-dc-price">{money(m.price)}</div>
                <div className="h-dc-stats">
                  {stats.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
                {m.allergens && (
                  <div className="h-dc-alg">
                    {m.allergens
                      .split(' · ')
                      .filter(Boolean)
                      .map((a) => (
                        <span key={a}>⚠ {a}</span>
                      ))}
                  </div>
                )}
                {chef && <div className="h-dc-chef">👨‍🍳 {chef}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-panel">
          <div className="h-empty">התפריט ריק — הוסיפו את המנה הראשונה 🍽️</div>
        </div>
      )}
    </HModal>
  );
}

type IngRow = { name: string; qty: string };

export function DishDialog(props: { id: string | null }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const upsert = useApp((s) => s.upsertHostRecord);
  const del = useApp((s) => s.deleteHostRecord);
  const toast = useApp((s) => s.toast);
  const src = props.id ? d.dishes.find((x) => x.id === props.id) : undefined;
  const [m, setM] = useState(() => ({
    name: src?.name ?? '',
    type: src?.type ?? 'בשרי',
    price: String(src?.price ?? 0),
    prepTime: src?.prepTime ?? '',
    cookTime: src?.cookTime ?? '',
    cookTemp: src?.cookTemp ?? '',
    baseServings: String(src?.baseServings ?? 4),
    allergens: src?.allergens ?? '',
    ingredients: (src?.ingredients ?? []).map(parseIng) as IngRow[],
    steps: src?.steps ?? ([] as string[]),
    notes: src?.notes ?? '',
    defBy: src?.defBy ?? '',
  }));
  const set = (p: Partial<typeof m>) => setM((x) => ({ ...x, ...p }));
  const meta = ktMeta(m.type);
  const icon = shopIcon(m.name, '');
  const emo = icon !== '🛒' ? icon : meta[0];
  const pmeta = [
    m.prepTime ? '⏱ ' + m.prepTime + 'ד׳' : '',
    m.cookTime ? '🔥 ' + m.cookTime + 'ד׳' : '',
    m.cookTemp ? '🌡 ' + m.cookTemp + '°' : '',
    '🍽️ ' + (Number(m.baseServings) || 4),
    '🥕 ' + m.ingredients.length,
    '👨‍🍳 ' + m.steps.length,
  ].filter(Boolean);
  const types: string[] = [...KT_TYPES];
  if (m.type && !types.includes(m.type)) types.push(m.type);
  const staffOpts = [['', '— לא שויך —'] as const, ...d.staff.map((s) => [s.id, s.name + (s.role ? ' · ' + s.role : '')] as const)];

  function save() {
    const base: HostDish = src ?? { id: '', kind: 'dish', name: '', type: '', price: 0, allergens: '', prepTime: '', cookTime: '', cookTemp: '', baseServings: 4, ingredients: [], steps: [], notes: '', defBy: '', createdAt: '', updatedAt: '' };
    const r = upsert({
      ...base,
      name: m.name,
      type: m.type,
      price: Number(m.price) || 0,
      prepTime: m.prepTime,
      cookTime: m.cookTime,
      cookTemp: m.cookTemp,
      baseServings: Number(m.baseServings) || 4,
      allergens: m.allergens,
      ingredients: m.ingredients.map((g) => (g.qty.trim() ? g.name.trim() + ' · ' + g.qty.trim() : g.name.trim())),
      steps: m.steps,
      notes: m.notes,
      defBy: m.defBy,
    });
    if (r.ok) {
      ui.open({ k: 'menu' });
      toast('המנה נשמרה ✓');
    }
  }
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= m.steps.length) return;
    const s = m.steps.slice();
    [s[i], s[j]] = [s[j], s[i]];
    set({ steps: s });
  };

  return (
    <HModal
      title={src ? '✏️ עריכת מנה' : '✨ מנה חדשה'}
      maxWidth={640}
      onClose={() => ui.open({ k: 'menu' })}
      footer={
        <>
          <button type="button" className={h('btn')} onClick={save}>
            💾 שמירה
          </button>
          {src && env.canDelete && (
            <button
              type="button"
              className={h('btn ghost danger')}
              onClick={() =>
                ui.confirm('למחוק את המנה "' + src.name + '"?', () => {
                  if (del(src.id)) {
                    ui.open({ k: 'menu' });
                    toast('נמחק');
                  }
                })
              }
            >
              מחק
            </button>
          )}
        </>
      }
    >
      <div className="h-de-prev" style={cssVar('bc', meta[1])}>
        <div className="h-dp-emo">{emo}</div>
        <div className="h-dp-info">
          <span className="h-dp-badge">
            {meta[0]} {m.type || 'מנה'}
          </span>
          <div className="h-dp-name">{m.name || 'מנה ללא שם'}</div>
          <div className="h-dp-meta">{pmeta.join(' · ')}</div>
        </div>
        <div className="h-dp-price">{money(Number(m.price) || 0)}</div>
      </div>
      <div className="h-frow">
        <FInput label="שם המנה" value={m.name} onChange={(v) => set({ name: v })} placeholder="שם המנה" />
        <FSelect label="סוג" value={m.type} onChange={(v) => set({ type: v })} options={types} />
      </div>
      <div className="h-frow" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <FInput label="מחיר (₪)" type="number" value={m.price} onChange={(v) => set({ price: v })} />
        <FInput label="הכנה (דק׳)" value={m.prepTime} onChange={(v) => set({ prepTime: v })} />
        <FInput label="בישול (דק׳)" value={m.cookTime} onChange={(v) => set({ cookTime: v })} />
      </div>
      <div className="h-frow" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <FInput label="טמפ׳ (°C)" value={m.cookTemp} onChange={(v) => set({ cookTemp: v })} />
        <FInput label="מנות-בסיס" type="number" min={1} value={m.baseServings} onChange={(v) => set({ baseServings: v })} />
        <FInput label="אלרגנים" value={m.allergens} onChange={(v) => set({ allergens: v })} />
      </div>
      <div className="h-de-sec">
        🥕 רכיבים{' '}
        <button type="button" className="h-de-add" onClick={() => set({ ingredients: [...m.ingredients, { name: '', qty: '' }] })}>
          ＋ רכיב
        </button>
      </div>
      {m.ingredients.length ? (
        m.ingredients.map((g, i) => (
          <div key={i} className="h-de-ingrow">
            <input aria-label="שם הרכיב" value={g.name} placeholder="שם הרכיב" onChange={(e) => set({ ingredients: m.ingredients.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
            <input aria-label="כמות" value={g.qty} placeholder="כמות" onChange={(e) => set({ ingredients: m.ingredients.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)) })} />
            <button type="button" className={h('de-mini danger')} title="הסר" aria-label="הסרת רכיב" onClick={() => set({ ingredients: m.ingredients.filter((_, j) => j !== i) })}>
              ✕
            </button>
          </div>
        ))
      ) : (
        <div className="h-de-empty">אין רכיבים עדיין — הוסיפו את הראשון 🥕</div>
      )}
      <div className="h-de-sec">
        👨‍🍳 שלבי הכנה ובישול{' '}
        <button type="button" className="h-de-add" onClick={() => set({ steps: [...m.steps, ''] })}>
          ＋ שלב
        </button>
      </div>
      {m.steps.length ? (
        m.steps.map((s, i) => (
          <div key={i} className="h-de-steprow">
            <span className="h-de-num">{i + 1}</span>
            <textarea rows={1} aria-label={'שלב ' + (i + 1)} placeholder="תיאור השלב" value={s} onChange={(e) => set({ steps: m.steps.map((x, j) => (j === i ? e.target.value : x)) })} />
            <div className="h-de-stepctl">
              <button type="button" className="h-de-mini" title="למעלה" aria-label="שלב למעלה" disabled={i === 0} style={i === 0 ? { opacity: 0.3 } : undefined} onClick={() => moveStep(i, -1)}>
                ↑
              </button>
              <button
                type="button"
                className="h-de-mini"
                title="למטה"
                aria-label="שלב למטה"
                disabled={i === m.steps.length - 1}
                style={i === m.steps.length - 1 ? { opacity: 0.3 } : undefined}
                onClick={() => moveStep(i, 1)}
              >
                ↓
              </button>
              <button type="button" className={h('de-mini danger')} title="הסר" aria-label="הסרת שלב" onClick={() => set({ steps: m.steps.filter((_, j) => j !== i) })}>
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="h-de-empty">אין שלבים עדיין — הוסיפו את הראשון 👨‍🍳</div>
      )}
      <FSelect label="👨‍🍳 טבח אחראי · ברירת-מחדל" value={m.defBy} onChange={(v) => set({ defBy: v })} options={staffOpts} style={{ marginTop: 15 }} />
      <FInput label="📝 הערות" value={m.notes} onChange={(v) => set({ notes: v })} />
    </HModal>
  );
}
