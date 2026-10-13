/**
 * 🛒 חוויית-הקנייה (shoppingListModal של המקור): עגלה + אחוז, 3 מדפים (רכיבים מוכפלים לפי סועדים · חד-פעמי × סועדים ·
 * נלווים), "👆 לקחתי", ✕, הוספת מוצר עם אמוג׳י, בורר-אמוג׳י (10 קבוצות + חזרה-לאוטומטי), ⧉ העתק רשימה (שער-הייצוא);
 * ו-🍽️ מערך-שולחן (tablesetModal): צלחת עם מסלול-אמוג׳י, מערך בסיסי/חגיגי, ± חצי לאורח, מחיקה.
 */
import { useRef, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import type { HostSupply, HostTableItem } from '../../types/domain';
import { useHostData } from './hooks';
import { FInput, HModal, h, useHostUi } from './hui';
import { EMOJI_SETS, TS_PRESETS, activeDinerTotal, shopIcon, shoppingList, shoppingText, stepPerGuest, type ShopProduct, type ShopSection } from './kitchen';
import { copyText } from './exportDoc';
import { SUP_CATS } from './labels';

const NO_GOT: Readonly<Record<string, true>> = {};
const NO_EMOJI: Readonly<Record<string, string>> = {};

export function ShopDialog() {
  const d = useHostData();
  const ui = useHostUi();
  const setShop = useApp((s) => s.setHostShop);
  const upsert = useApp((s) => s.upsertHostRecord);
  const del = useApp((s) => s.deleteHostRecord);
  const toast = useApp((s) => s.toast);
  const [pick, setPick] = useState<{ key: string | null } | null>(null);
  const [addEmoji, setAddEmoji] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cat, setCat] = useState<string>(SUP_CATS[0]);
  const [qty, setQty] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const list = shoppingList(d.meals, d.dishes, d.tableItems, d.supplies, d.prefs.shopGot ?? NO_GOT, d.prefs.shopEmoji ?? NO_EMOJI);

  const tile = (p: ShopProduct) => (
    <div
      key={p.key}
      className={'h-prod' + (p.got ? ' h-got' : '')}
      role="button"
      tabIndex={0}
      aria-pressed={p.got}
      onClick={() => setShop({ got: [p.key, !p.got] })}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setShop({ got: [p.key, !p.got] });
        }
      }}
    >
      <div className="h-gb">✓</div>
      {p.supplyId && (
        <button
          type="button"
          className="h-pdel"
          title="הסר"
          aria-label={'הסרת ' + p.name}
          onClick={(e) => {
            e.stopPropagation();
            del(p.supplyId!);
          }}
        >
          ✕
        </button>
      )}
      <div
        className="h-pic"
        data-emojiedit={p.key}
        title="🎨 לחצו לשינוי האמוג׳י"
        onClick={(e) => {
          e.stopPropagation();
          setPick({ key: p.key });
        }}
      >
        {p.icon}
      </div>
      <div className="h-pn">{p.name}</div>
      {p.qty && <span className="h-pq">{p.qty}</span>}
      <div className="h-tap">{p.got ? '✓ בעגלה' : '👆 לקחתי'}</div>
    </div>
  );
  const shelf = (emoji: string, ttl: string, sec: ShopSection, extra?: ReactNode) => {
    const li = list.products.filter((p) => p.sec === sec);
    const g = li.filter((p) => p.got).length;
    return (
      <>
        <div className="h-aisle-h">
          {emoji} {ttl}{' '}
          <span className="h-an">
            {g}/{li.length}
          </span>
        </div>
        <div className="h-shelf">
          {li.length ? (
            li.map(tile)
          ) : (
            <div className="h-prod" style={{ cursor: 'default', opacity: 0.6 }}>
              <div className="h-pic">🕳️</div>
              <div className="h-pn" style={{ minHeight: 'auto' }}>
                ריק
              </div>
            </div>
          )}
          {extra}
        </div>
      </>
    );
  };
  function addSupply() {
    const base: HostSupply = { id: '', kind: 'supply', name, cat, qty, bought: false, createdAt: '', updatedAt: '' };
    const r = upsert(base);
    if (!r.ok || !r.record) return;
    if (addEmoji) setShop({ emoji: ['sup:' + r.record.id, addEmoji] });
    setAddEmoji(null);
    setName('');
    setQty('');
  }
  async function copy() {
    if (await copyText(shoppingText(d.meals, d.dishes, d.tableItems, d.supplies))) toast('הרשימה הועתקה ✓');
  }
  const curEmoji = pick ? (pick.key === null ? (addEmoji ?? '') : (d.prefs.shopEmoji?.[pick.key] ?? '')) : '';

  return (
    <>
      <HModal
        title="🛒 חוויית הקנייה"
        maxWidth={680}
        onClose={ui.close}
        footer={
          <>
            <button type="button" className={h('btn')} onClick={copy}>
              ⧉ העתק רשימה
            </button>
            <button type="button" className={h('btn ghost')} onClick={ui.close}>
              סגור
            </button>
          </>
        }
      >
        <div className="h-dashfx">
          <div className={'h-cartbar' + (list.done ? ' h-done' : '')}>
            <div className="h-cb-top">
              <span className="h-cb-cart">🛒</span>
              <div className="h-cb-txt">
                <b>{list.done ? 'הכל בעגלה! 🎉' : 'עגלת הקניות'}</b>
                <span>
                  {list.gotN} מתוך {list.total} פריטים נאספו · {list.mealsN} ארוחות · {list.totalDiners} סועדים
                </span>
              </div>
              <span className="h-cb-pct">{list.pct}%</span>
            </div>
            <div className="h-cb-bar">
              <i style={{ width: list.pct + '%' }} />
            </div>
          </div>
          {shelf('🥫', 'מזווה · רכיבים', 'ing')}
          {shelf('🍽️', 'חד-פעמי · שולחן', 'tbl')}
          {shelf(
            '🥤',
            'משקאות ונלווים',
            'sup',
            <div className="h-addprod" role="button" tabIndex={0} onClick={() => nameRef.current?.focus()} onKeyDown={(e) => e.key === 'Enter' && nameRef.current?.focus()}>
              <div className="h-plus">＋</div>
              הוסף מוצר
            </div>,
          )}
          <div style={{ marginTop: 8, padding: 12, border: '1px solid var(--h-line)', borderRadius: 14, background: 'color-mix(in srgb,var(--h-panel) 40%,transparent)' }}>
            <div style={{ fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>🛍️ הוספת מוצר לעגלה</div>
            <div className="h-frow" style={{ gridTemplateColumns: '44px 2fr 1fr 1fr' }}>
              <div className="h-field" style={{ margin: 0 }}>
                <label>אמוג׳י</label>
                <button type="button" className="h-addemoji-btn" title="בחרו אמוג׳י" aria-label="בחירת אמוג׳י למוצר" onClick={() => setPick({ key: null })}>
                  {addEmoji || '🛒'}
                </button>
              </div>
              <div className="h-field" style={{ margin: 0 }}>
                <label htmlFor="hst-sup-name">שם</label>
                <input id="hst-sup-name" ref={nameRef} value={name} placeholder="קולה / צלחות / מפיות" onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="h-field" style={{ margin: 0 }}>
                <label htmlFor="hst-sup-cat">מדף</label>
                <select id="hst-sup-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
                  {SUP_CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="h-field" style={{ margin: 0 }}>
                <label htmlFor="hst-sup-qty">כמות</label>
                <input id="hst-sup-qty" value={qty} placeholder="12 בקבוקים" onChange={(e) => setQty(e.target.value)} />
              </div>
            </div>
            <button type="button" className={h('btn sm')} style={{ marginTop: 9 }} onClick={addSupply}>
              ＋ הוסף לעגלה
            </button>
          </div>
        </div>
      </HModal>
      {pick && (
        <EmojiPicker
          cur={curEmoji}
          onPick={(e) => {
            if (pick.key === null) setAddEmoji(e || null);
            else setShop({ emoji: [pick.key, e || null] });
            setPick(null);
          }}
          onClose={() => setPick(null)}
        />
      )}
    </>
  );
}

/** בורר-אמוג׳י ידני (emojiPicker) — '' = חזרה לאוטומטי. */
function EmojiPicker(props: { cur: string; onPick: (e: string) => void; onClose: () => void }) {
  return (
    <HModal
      title="🎨 בחרו אמוג׳י"
      z={130}
      maxWidth={420}
      onClose={props.onClose}
      footer={
        <button type="button" className={h('btn ghost')} onClick={() => props.onPick('')}>
          🔄 חזרה לאוטומטי
        </button>
      }
    >
      <div className="h-epick">
        {EMOJI_SETS.map(([title, list]) => (
          <div key={title}>
            <div className="h-epick-cat">{title}</div>
            <div className="h-epick-grid">
              {list.map((e) => (
                <button key={e} type="button" className={'h-epick-e' + (e === props.cur ? ' h-on' : '')} aria-label={e} onClick={() => props.onPick(e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </HModal>
  );
}

/** 🍽️ מערך שולחן · חד-פעמי (tablesetModal). */
export function TablesetDialog() {
  const d = useHostData();
  const ui = useHostUi();
  const setItems = useApp((s) => s.setHostTableItems);
  const upsert = useApp((s) => s.upsertHostRecord);
  const del = useApp((s) => s.deleteHostRecord);
  const toast = useApp((s) => s.toast);
  const [name, setName] = useState('');
  const [per, setPer] = useState('1');
  const total = activeDinerTotal(d.meals);
  const items = d.tableItems;
  const N = Math.min(7, Math.max(1, items.length));
  const setPerOf = (t: HostTableItem, v: number) => upsert({ ...t, perGuest: v });
  return (
    <HModal
      title="🍽️ מערך שולחן · חד-פעמי"
      maxWidth={660}
      onClose={ui.close}
      footer={
        <button type="button" className={h('btn ghost')} onClick={ui.close}>
          סגור
        </button>
      }
    >
      <div className="h-tsset">
        <div className="h-tsplate" style={{ position: 'relative' }}>
          🍽️
          {items.slice(0, 7).map((t, i) => {
            const a = ((-90 + (i * 360) / N) * Math.PI) / 180;
            return (
              <span key={t.id} className="h-ts-orbit" style={{ left: 48 + 56 * Math.cos(a) - 10, top: 48 + 56 * Math.sin(a) - 10 }}>
                {shopIcon(t.name, 'חד-פעמי')}
              </span>
            );
          })}
        </div>
        <div className="h-ts-legend">
          <b>מערך לאורח</b>
          <span>הכמות הכוללת מחושבת אוטומטית · {total} סועדים פעילים</span>
          <div className="h-ts-emos">
            {items.length ? (
              items.map((t) => (
                <i key={t.id}>
                  {shopIcon(t.name, 'חד-פעמי')} {t.name} ×{t.perGuest || 0}
                </i>
              ))
            ) : (
              <i style={{ color: 'var(--h-dim)' }}>הוסיפו פריטים למערך</i>
            )}
          </div>
        </div>
      </div>
      <div className="h-rowbtn">
        {(['basic', 'feast'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={h('btn ghost sm')}
            onClick={() => {
              if (setItems(TS_PRESETS[k].map(([n, p]) => ({ name: n, perGuest: p })))) toast('נטען מערך ' + (k === 'feast' ? 'חגיגי' : 'בסיסי') + ' ✓');
            }}
          >
            {k === 'feast' ? '🎉 מערך חגיגי' : '🍽️ מערך בסיסי'}
          </button>
        ))}
      </div>
      <div className="h-frow" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <FInput label="פריט חדש" value={name} onChange={setName} placeholder="צלחת / כוס / מפית / סכו״ם" style={{ margin: 0 }} />
        <FInput label="כמות לאורח" type="number" step={0.5} min={0} value={per} onChange={setPer} style={{ margin: 0 }} />
      </div>
      <button
        type="button"
        className={h('btn sm')}
        style={{ margin: '9px 0 14px' }}
        onClick={() => {
          if (setItems([{ name, perGuest: Number(per) || 0 }])) setName('');
        }}
      >
        ＋ הוסף למערך
      </button>
      {items.length ? (
        <div className="h-tsgrid h-dashfx">
          {items.map((t) => {
            const p = t.perGuest || 0;
            return (
              <div key={t.id} className="h-tscard">
                <span className="h-tsc-emo">{shopIcon(t.name, 'חד-פעמי')}</span>
                <div className="h-tsc-id">
                  <div className="h-tsc-nm">{t.name}</div>
                  <div className="h-tsc-tot">
                    סה״כ {p * total} יח׳ · {p} לאורח
                  </div>
                </div>
                <div className="h-tsc-step">
                  <button type="button" aria-label={'פחות ' + t.name} onClick={() => setPerOf(t, stepPerGuest(p, -1))}>
                    −
                  </button>
                  <span className="h-tsc-n">{p}</span>
                  <button type="button" aria-label={'יותר ' + t.name} onClick={() => setPerOf(t, stepPerGuest(p, 1))}>
                    ＋
                  </button>
                </div>
                <button type="button" className={h('de-mini danger')} title="הסר" aria-label={'הסרת ' + t.name} onClick={() => del(t.id)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-panel">
          <div className="h-empty">אין פריטים — התחילו ממערך מוכן או הוסיפו ידנית 🍽️</div>
        </div>
      )}
    </HModal>
  );
}
