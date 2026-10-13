/**
 * 📒 פרנסה׳לע — "העסק שלי" של המקור (עיצוב 4, renderMe/renderMeReqs/renderPrev/renderDash): "בקשות בתחום שלך"
 * (14 יום, דחופות ראשונות, "אני זמין" בשם העסק), הכרטיס-המיני החי של הדף עם גלולת-המצב (טיוטה · באוויר · ממתין ·
 * מוסתר) ו"לתצוגה המלאה", הבאנר "כך תופיעו בתוצאות החיפוש", הלוח (טבעת-השלמות עם 3 הצעדים הבאים "+N%", "הקופה
 * שלך", אריחים, "המלצות שקיבלתם"), "המעטפת שלי", והעורך בן 8 החלקים.
 * באורביט הגבאי מנהל את הדפים בשם בעליהם (בהסכמה) — ולכן בורר "הדף שבעריכה" + "➕ הוספת עסק" (תוספת-הפורט);
 * "פניות מהאלפון" (מי פנה) דורש כניסת-תושבים = הכרעת-בעלים (SERVER), ובמקומו "בקשות בתחום" של הפורט.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import type { PrListing } from '../../types/domain';
import { categoryOf } from './lib';
import { usePnContact, usePrBrand } from './hooks';
import { agoText } from './labels';
import { Page } from './Shell';
import { Ic } from './skin';
import { Banner } from './Home';
import { BizBody, Kupa, type BizCtx } from './BizSheet';
import { EnvMap } from './EnvMap';
import { Editor, emptyPrListing, forgetEditorDraft } from './Editor';
import { completeness, type PnSec } from './editor';
import { kupaOf } from './biz';
import { inTradeOf, RespondModal, TradeRows } from './InTrade';

/** מפתח-הדף האחרון שנערך (בין עליות של הלשונית) — להבחנה בין מעבר-לשונית לבחירה מפורשת. */
let lastEdKey = '';

export function MeTab(props: {
  ctx: BizCtx;
  /** הדף שבעריכה (null = עסק חדש). */
  sel: string | null;
  setSel: (id: string | null) => void;
  /** "הצטרפות בחינם" מהבית ⇒ עסק חדש בעורך (נצרך פעם אחת — onAddConsumed). */
  addTick?: number;
  onAddConsumed?: () => void;
  onOpen: ((id: string) => void) | null;
  onPreview: (d: PrListing) => void;
}) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const requests = useApp((s) => s.db.prRequests);
  const brand = usePrBrand();
  const contact = usePnContact();
  const { ctx, setSel } = props;
  const word = termOf(config, 'entity.prListing', 'עסק');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const requestsOn = featureOn(config, 'parnasa.requests');
  const sorted = useMemo(() => [...listings].sort((a, b) => a.name.localeCompare(b.name, 'he') || a.id.localeCompare(b.id)), [listings]);
  const listing = props.sel ? (listings.find((l) => l.id === props.sel) ?? null) : null;
  // עסק חדש: מונה שמאפס את העורך ("➕ הוספת עסק" / "הצטרפות בחינם"); זכור בסשן — מעבר-לשונית לא מאפס טיוטה
  const [newN, setNewN] = useRemembered('parnasa.me.newN', 0);
  const { addTick, onAddConsumed } = props;
  useEffect(() => {
    if (!addTick) return;
    onAddConsumed?.();
    setSel(null);
    setNewN((n) => n + 1);
  }, [addTick, onAddConsumed, setSel, setNewN]);
  // הבחירה נמחקה (מכשיר אחר / הסרה) ⇒ עסק חדש
  useEffect(() => {
    if (props.sel && !listing) setSel(null);
  }, [props.sel, listing, setSel]);
  // הלוח והכרטיס-המיני מציגים את הטיוטה החיה — העורך מדווח בכל עלייה ובכל שינוי
  const [draft, setDraft] = useState<PrListing>(() => listing ?? emptyPrListing());
  const onDraft = useCallback((d: PrListing) => setDraft(d), []);
  // מפתח-הדף לזיכרון-הטיוטה — כולל הארגון (מזהים יכולים לחזור בין ארגונים)
  const edKey = (config.slug || 'default') + ':' + (listing ? listing.id : 'new-' + newN);
  // בחירה מפורשת של דף אחר (בורר · ➕ · "עריכה" מהגיליון · שמירה/מחיקה) ⇒ הטיוטה הקודמת נזרקת; מעבר-לשונית — נשמרת
  useEffect(() => {
    if (lastEdKey && lastEdKey !== edKey) forgetEditorDraft(lastEdKey);
    lastEdKey = edKey;
  }, [edKey]);
  const [focus, setFocus] = useState<{ k: PnSec; n: number } | null>(null);

  const C = completeness(draft);
  const R = 2 * Math.PI * 42;
  const off = R * (1 - C.pct / 100);
  const kupa = useMemo(() => (listing ? kupaOf(listing, requests, ctx.monthStartIso, ctx.now.loc.tz) : null), [listing, requests, ctx.monthStartIso, ctx.now.loc.tz]);
  // "בקשות בתחום שלך" (renderMeReqs): 14 הימים האחרונים, דחופות ראשונות — הגבאי עונה בשם העסק
  const nowMs = ctx.now.nowMs;
  const tradeRows = useMemo(
    () => (listing && requestsOn && listing.status === 'approved' ? inTradeOf(listing, requests, listings, nowMs).filter((v) => nowMs - Date.parse(v.createdAt) < 14 * 864e5) : []),
    [listing, requestsOn, requests, listings, nowMs],
  );
  const inTrade = tradeRows.length;
  const [respondTo, setRespondTo] = useState<{ id: string; quiet: boolean } | null>(null);
  const recs = listing?.recs ?? [];
  const pal = draft.palette || 'velvet';
  const prevL: PrListing = { ...draft, name: draft.name || 'השם שלכם', title: draft.title || 'במה אתם עובדים', phone: draft.phone || '050-000-0000', category: draft.category || 'other', status: 'approved' };
  const pill = !listing ? (
    <span className="pn-livepill pn-draft">
      <i />
      טיוטה · עוד לא נשמר
    </span>
  ) : listing.status === 'approved' ? (
    <span className="pn-livepill pn-on">
      <i />
      באוויר באלפון
    </span>
  ) : listing.status === 'rejected' ? (
    <span className="pn-livepill pn-hid">
      <i />
      {'מוסתר ע״י ה' + gabbai}
    </span>
  ) : (
    <span className="pn-livepill pn-wait">
      <i />
      {'ממתין לאישור ה' + gabbai}
    </span>
  );

  return (
    <Page wide className="pn-mepage" k="לבעלי עסקים" title="העסק שלי" sub="דף עסק מלא בתוך האלפון: לוגו, מחירון, תמונות, שעות והמלצות. אתם עורכים, הקהילה פונה.">
      <div className="pn-mepick">
        <label className="pn-fl">
          <span>
            הדף שבעריכה <small>{'(כל דף נערך בשם בעל ה' + word + ' ובהסכמתו — גם למי שיש לו רק טלפון כשר)'}</small>
          </span>
          <select
            value={props.sel ?? ''}
            onChange={(e) => {
              setSel(e.target.value || null);
              if (!e.target.value) setNewN((n) => n + 1);
            }}
          >
            <option value="">{'➕ ' + word + ' חדש'}</option>
            {sorted.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name + (l.status === 'pending' ? ' · ממתין' : l.status === 'rejected' ? ' · מוסתר' : '') + (l.dialCode ? ' · ☎ ' + l.dialCode : '')}
              </option>
            ))}
          </select>
        </label>
        <button
          className="pn-btn pn-primary"
          type="button"
          onClick={() => {
            setSel(null);
            setNewN((n) => n + 1);
          }}
        >
          ➕ הוספת {termOf(config, 'entity.prListing', 'עסק')}
        </button>
      </div>
      {listing && tradeRows.length ? (
        <section className="pn-hsec pn-mereqs" aria-label="בקשות בתחום שלך">
          <div className="pn-hs">
            <h2>בקשות בתחום שלך</h2>
            <span className="pn-hk">{categoryOf(listing.category).name + ' · מגיעות אליכם לפני כל הקהילה'}</span>
          </div>
          <TradeRows rows={tradeRows} nowMs={nowMs} onRespond={(id, quiet) => setRespondTo({ id, quiet })} />
        </section>
      ) : null}
      {listing && respondTo ? <RespondModal l={listing} target={respondTo} toast={ctx.toastAct} onClose={() => setRespondTo(null)} /> : null}
      <div className="pn-megrid">
        <aside className="pn-meside">
          <div
            className="pn-bpmini"
            role="button"
            tabIndex={0}
            aria-label="תצוגה מלאה של דף העסק"
            onClick={() => props.onPreview(prevL)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                props.onPreview(prevL);
              }
            }}
          >
            {pill}
            <div className="pn-pv" data-pal={pal}>
              <BizBody l={prevL} qtext="" ctx={ctx} prev mini />
            </div>
            <span className="pn-open">
              <Ic n="eye" />
              לתצוגה המלאה
            </span>
          </div>
          <div className="pn-mebn">
            <span className="pn-mebn-k">
              <Ic n="eye" />
              כך תופיעו בתוצאות החיפוש
            </span>
            <div className="pn-bn-list" inert>
              <Banner l={prevL} o={{ i: 0 }} now={ctx.now} brand={brand} contact={contact} reduced={ctx.reduced} onOpen={() => {}} onTouch={() => {}} onCopy={() => {}} />
            </div>
          </div>
        </aside>
        <div className="pn-memain">
          <div className="pn-dash">
            <div className="pn-dhead">
              <div className="pn-ring" role="img" aria-label={'הדף מלא ב־' + C.pct + ' אחוז'}>
                <svg viewBox="0 0 100 100">
                  <circle className="pn-bg" cx="50" cy="50" r="42" />
                  <circle className="pn-fg" cx="50" cy="50" r="42" strokeDasharray={R.toFixed(1)} strokeDashoffset={off.toFixed(1)} />
                </svg>
                <b>
                  {C.pct}
                  <small>%</small>
                </b>
              </div>
              <div style={{ minWidth: 0 }}>
                <h3>{C.pct >= 100 ? 'הדף שלכם מושלם' : C.pct >= 70 ? 'הדף נראה מצוין' : listing ? 'עוד כמה צעדים לדף מלא' : 'בואו נבנה את הדף שלכם'}</h3>
                <p>{C.pct >= 100 ? 'כל החלקים מלאים. עכשיו רק לשתף ולקבל המלצות.' : 'דף מלא מקבל יותר פניות. הצעדים הבאים:'}</p>
                {C.next.length ? (
                  <div className="pn-steps">
                    {C.next.map(([w, k, l]) => (
                      <button key={l} className="pn-stepc" type="button" onClick={() => setFocus((f) => ({ k, n: (f?.n ?? 0) + 1 }))}>
                        {l + ' '}
                        <b>{'+' + w + '%'}</b>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {listing && kupa ? <Kupa k={kupa} own /> : null}
            {listing ? (
              <div className="pn-dtiles">
                <div className="pn-dtile pn-v">
                  <span className="pn-k">
                    <Ic n="tab-board" />
                    בקשות בתחום
                  </span>
                  <b>{inTrade.toLocaleString('he-IL')}</b>
                  <small>{inTrade ? 'פתוחות עכשיו, מגיעות אליכם לפני כל הקהילה' : 'אין כרגע בקשה פתוחה בתחום'}</small>
                </div>
                <div className="pn-dtile">
                  <span className="pn-k">
                    <Ic n="heart" />
                    המלצות
                  </span>
                  <b>{recs.length}</b>
                  <small>{recs.length ? 'מחברי הקהילה שעבדו איתכם' : 'לקוח מרוצה? מילה טובה בדף עוזרת לכולם'}</small>
                </div>
              </div>
            ) : null}
            {listing ? (
              <div className="pn-dcard">
                <h3>
                  <Ic n="heart" />
                  {'המלצות שקיבלתם '}
                  {recs.length ? <span className="pn-n">{recs.length}</span> : null}
                </h3>
                {recs.length ? (
                  <div className="pn-recs">
                    {recs.slice(0, 6).map((r, i) => (
                      <div key={i} className="pn-rec">
                        {r.text}
                        <span className="pn-by">
                          {'— '}
                          <span className="pn-nm">{r.by || 'חבר הקהילה'}</span>
                          {' · ' + agoText(r.at, ctx.now.nowMs)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pn-note">עוד אין המלצות. לקוח מרוצה? בקשו ממנו מילה טובה בדף העסק.</p>
                )}
                <div className="pn-actions">
                  <button className="pn-btn" type="button" disabled={listing.status !== 'approved' || !props.onOpen} onClick={() => props.onOpen?.(listing.id)}>
                    <Ic n="share" />
                    לדף ולשיתוף
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          {listing && listing.status === 'approved' ? (
            <section className="pn-hsec pn-meenv" aria-label="המעטפת שלי">
              <EnvMap
                b={listing}
                listings={listings}
                brand={brand}
                onOpen={(id) => props.onOpen?.(id)}
                onCopy={(t) => {
                  void navigator.clipboard
                    .writeText(t)
                    .then(() => ctx.toastAct('ההזמנה הועתקה. שלחו אותה למי שאתם מכירים'))
                    .catch(() => ctx.toastAct('לא הצלחנו להעתיק'));
                }}
              />
            </section>
          ) : null}
          <Editor
            key={edKey}
            memKey={edKey}
            listing={listing}
            focusSec={focus}
            onDraft={onDraft}
            onSaved={(l) => {
              const wasNew = !listing;
              setSel(l.id);
              if (wasNew) props.onOpen?.(l.id);
            }}
            onPreview={(d) => props.onPreview({ ...d, name: d.name || 'השם שלכם', title: d.title || 'במה אתם עובדים', phone: d.phone || '050-000-0000', category: d.category || 'other', status: 'approved' })}
            onDeleted={() => {
              setSel(null);
              setNewN((n) => n + 1);
            }}
            toast={(m) => ctx.toastAct(m)}
          />
        </div>
      </div>
    </Page>
  );
}
