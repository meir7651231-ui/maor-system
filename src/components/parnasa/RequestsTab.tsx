/**
 * 📒 פרנסה׳לע — לשונית 🙋 בקשות (אשכול 5): "מה צריך?" של תושבים — לא ציבורי (הכרעה 6).
 * לכל בקשה: שורת-המסלול (routeRequest/routeSummary — המקצוע קודם, 3 שעות / שעה בדחוף, ואז הקהילה;
 * שקטה לעולם לא לקהילה), המענים, ופעולות: רישום מענה · 📤 שליחה לעסקים · נמצא · עריכה · מחיקה.
 * 🛡 פרטיות-שקט: מה שיוצא לעסקים נבנה מ-businessView בלבד (בלי שם/טלפון, טלפון/מייל בטקסט מושחרים);
 * בקשה שקטה מוצגת גם לצוות בלי זהות — חשיפה רק למאשר/ת, בלחיצה, ונרשמת ביומן-הגישה (logAccess).
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, telephonyOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import { smartFilter } from '../../lib/search';
import type { PrListing, PrRequest } from '../../types/domain';
import { Btn, Chip, Empty, Field, Modal, Select, TextInput } from '../ui';
import { useArmed } from '../useArmed';
import { WaBtn } from '../WaBtn';
import { CallBtn } from '../CallBtn';
import { businessView, categoryOf, isUrgent, PR_CATEGORIES, routeRequest, routeSummary, type PrRequestView } from './lib';
import { clockAt, hebDateText, PR_DAY_NAMES } from './zmanimBoard';
import { RequestForm } from './RequestForm';
import { usePrBrand, usePrPerms, type PrNow } from './hooks';
import { agoText } from './labels';

type ReqFilter = 'open' | 'job' | 'all';

/** ההודעה לעסק — מתצוגת-העסקים בלבד (שקטה: בלי זהות, טקסט מושחר). */
export function businessMessage(v: PrRequestView, brand: string, word: string): string {
  const t = v.text.length > 140 ? v.text.slice(0, 139) + '…' : v.text;
  return 'שלום, יש ' + word + ' ב' + brand + (v.quiet ? ' (בשקט — בלי פרטי הפונה)' : '') + ': ״' + t + '״. אם זה מתאים לך — חזור אלינו ונחבר.';
}

export function RequestsTab(props: {
  now: PrNow;
  focusId: string | null;
  onFocusConsumed: () => void;
  draft: Partial<PrRequest> | null;
  onDraftConsumed: () => void;
  onOpenListing: ((id: string) => void) | null;
}) {
  const config = useApp((s) => s.config);
  const requests = useApp((s) => s.db.prRequests);
  const listings = useApp((s) => s.db.prListings);
  const [filter, setFilter] = useRemembered<ReqFilter>('parnasa.req.filter', 'open');
  const [cat, setCat] = useRemembered<string>('parnasa.req.cat', '');
  const [q, setQ] = useRemembered<string>('parnasa.req.q', '');
  const [form, setForm] = useState<{ request: PrRequest | null; draft?: Partial<PrRequest> | null } | null>(() =>
    props.draft ? { request: null, draft: props.draft } : null,
  );
  const [focus] = useState<string | null>(props.focusId);
  useEffect(() => {
    if (props.draft) props.onDraftConsumed();
    if (props.focusId) props.onFocusConsumed();
  }, [props]);

  const word = termOf(config, 'entity.prRequest', 'בקשה');
  const nowMs = props.now.nowMs;
  const shown = useMemo(() => {
    let list = requests.filter((r) => (filter === 'all' ? true : filter === 'job' ? r.job && r.status !== 'closed' : r.status !== 'closed'));
    if (cat) list = list.filter((r) => r.category === cat);
    if (q.trim()) {
      // 🛡 שם-הפונה של בקשה שקטה לא נכנס לחיפוש (אחרת חיפוש-שם חושף אותה)
      const keep = new Set(smartFilter(q, list, (r) => [r.text, r.area, categoryOf(r.category).name, ...(r.quiet ? [] : [r.requester.name])]).map((r) => r.id));
      list = list.filter((r) => keep.has(r.id));
    }
    return list
      .slice()
      .sort(
        (a, b) =>
          Number(b.id === focus) - Number(a.id === focus) ||
          Number(isUrgent(b, nowMs)) - Number(isUrgent(a, nowMs)) ||
          String(b.createdAt).localeCompare(String(a.createdAt)) ||
          a.id.localeCompare(b.id),
      );
  }, [requests, filter, cat, q, focus, nowMs]);

  const groups: Array<{ key: string; title: string; sub: string; items: PrRequest[] }> = [
    { key: 'urgent', title: 'דחוף', sub: 'צריך היום', items: shown.filter((r) => r.status !== 'closed' && isUrgent(r, nowMs)) },
    { key: 'open', title: 'פתוחות', sub: 'מחכות למישהו שיכיר', items: shown.filter((r) => r.status === 'open' && !isUrgent(r, nowMs)) },
    { key: 'answered', title: 'נענו', sub: 'יש בעלי מקצוע זמינים', items: shown.filter((r) => r.status === 'answered' && !isUrgent(r, nowMs)) },
    { key: 'closed', title: 'נמצאו', sub: 'הקהילה עזרה', items: shown.filter((r) => r.status === 'closed') },
  ].filter((g) => g.items.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
        {'לא מצאו במדריך? מחפשים עובד? כאן. כל ' + word + ' מנותבת קודם לבעלי המקצוע בתחום, ואם אף אחד לא ענה בזמן — לכל הקהילה.'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip on={filter === 'open'} onClick={() => setFilter('open')}>
          פתוחות
        </Chip>
        <Chip on={filter === 'job'} onClick={() => setFilter('job')}>
          הצעות עבודה
        </Chip>
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>
          הכול
        </Chip>
        <span style={{ marginInlineStart: 'auto' }}>
          <Btn kind="primary" onClick={() => setForm({ request: null })}>
            ➕ הוספת {termOf(config, 'entity.prRequest', 'בקשה')}
          </Btn>
        </span>
      </div>

      <div className="filterbar">
        <div className="fb-search">
          <TextInput value={q} onChange={setQ} placeholder="חיפוש — טקסט, אזור או תחום" ariaLabel={'חיפוש ' + word} />
        </div>
        <Select
          ariaLabel="תחום"
          value={cat}
          onChange={setCat}
          options={[{ value: '', label: 'כל התחומים' }, ...PR_CATEGORIES.map((c) => ({ value: c.key, label: c.icon + ' ' + c.short }))]}
        />
      </div>

      {groups.length === 0 && (
        <Empty>
          <div style={{ fontWeight: 800 }}>{filter === 'job' ? 'אין כרגע הצעות עבודה' : 'אין כרגע ' + word + ' פתוחה'}</div>
          <div>{word + ' חדשה תופיע כאן, עם המסלול שלה.'}</div>
        </Empty>
      )}
      {groups.map((g) => (
        <section key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800 }}>
            {g.title + ' (' + g.items.length + ')'}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-faint)' }}>{' · ' + g.sub}</span>
          </h2>
          {g.items.map((r) => (
            <RequestCard key={r.id} request={r} listings={listings} now={props.now} focused={r.id === focus} onEdit={() => setForm({ request: r })} onOpenListing={props.onOpenListing} />
          ))}
        </section>
      ))}

      {form && <RequestForm request={form.request} draft={form.draft} onClose={() => setForm(null)} />}
    </div>
  );
}

function RequestCard(props: {
  request: PrRequest;
  listings: PrListing[];
  now: PrNow;
  focused: boolean;
  onEdit: () => void;
  onOpenListing: ((id: string) => void) | null;
}) {
  const config = useApp((s) => s.config);
  const addPrResponse = useApp((s) => s.addPrResponse);
  const closePrRequest = useApp((s) => s.closePrRequest);
  const deletePrRequest = useApp((s) => s.deletePrRequest);
  const logAccess = useApp((s) => s.logAccess);
  const toast = useApp((s) => s.toast);
  const brand = usePrBrand();
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const [revealed, setRevealed] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [resp, setResp] = useState({ listingId: '', text: '' });

  const r = props.request;
  const { nowMs, loc } = props.now;
  const word = termOf(config, 'entity.prRequest', 'בקשה');
  const lWord = termOf(config, 'entity.prListing', 'עסק');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const waOn = integrationOn(config, 'whatsapp');
  const telOn = telephonyOn(config);
  const view = businessView(r, nowMs);
  const route = routeRequest(r, props.listings, nowMs);
  const cat = r.category ? categoryOf(r.category) : null;
  const created = Date.parse(r.createdAt);
  const cl = Number.isFinite(created) ? clockAt(created, loc.tz) : null;
  const closed = r.status === 'closed';
  // מי יכול לענות: מקבלי-הבקשה + רשומות-גבאי מאושרות באותו שער (הגבאי רושם בשמם)
  const responders = r.category ? props.listings.filter((l) => l.status === 'approved' && l.category === r.category) : [];
  const gabbaiOnly = responders.filter((l) => l.source === 'gabbai');
  const nameOf = (id: string) => props.listings.find((l) => l.id === id)?.name ?? (id ? lWord + ' שהוסר' : 'מענה ידני של ה' + gabbai);
  const showText = r.quiet && !revealed ? view.text : r.text;

  function respond() {
    if (r.quiet && !resp.text.trim()) return toast('לבקשה בשקט — כתבו את התשובה (הפונה יראה אותה)');
    if (addPrResponse(r.id, { listingId: resp.listingId, text: resp.text.trim() || 'זמין' })) {
      toast('המענה נרשם');
      setRespondOpen(false);
      setResp({ listingId: '', text: '' });
    }
  }

  function closeIt() {
    if (r.quiet && !confirmTwice('prqc-' + r.id, 'למחוק את ה' + word + ' וכל התשובות?')) {
      toast('בקשה בשקט נמחקת בסגירה — לחיצה נוספת בתוך 3.5 שניות');
      return;
    }
    if (closePrRequest(r.id)) toast(r.quiet ? 'נמצא! ה' + word + ' וכל התשובות נמחקו' : 'סומן שנמצא. בהצלחה!');
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, ...(props.focused ? { outline: '2px solid var(--accent)' } : {}) }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 800 }}>{r.job ? '💼 הצעת עבודה' : cat ? cat.icon + ' ' + cat.short : 'בקשה כללית'}</span>
        {r.quiet && <Chip>🔒 בשקט</Chip>}
        {isUrgent(r, nowMs) && <Chip on>דחוף</Chip>}
        {r.status === 'answered' && <Chip>✓ יש מענה</Chip>}
        {closed && <Chip>נמצא · נסגרה</Chip>}
        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          {cl ? 'יום ' + PR_DAY_NAMES[cl.dow] + ' · ' + hebDateText(cl.iso, loc.tz) + ' · ' + agoText(r.createdAt, nowMs) : ''}
        </span>
      </div>
      <div style={{ whiteSpace: 'pre-line', fontSize: 14 }}>{showText}</div>
      {r.area && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{'📍 ' + r.area}</div>}

      <div style={{ fontSize: 12.5, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {r.quiet && !revealed ? (
          <>
            <span>פונה בשקט · השם לא מוצג</span>
            {canApprove && (
              <Btn
                sm
                onClick={() => {
                  logAccess('👁 חשיפת פרטי פונה — ' + word + ' בשקט', r.id);
                  setRevealed(true);
                }}
              >
                👁 הצגת פרטי הפונה
              </Btn>
            )}
          </>
        ) : (
          <>
            <span>{r.requester.name || 'בלי שם'}</span>
            {r.requester.phone && (
              <span dir="ltr" style={{ fontWeight: 700 }}>
                {r.requester.phone}
              </span>
            )}
            {telOn && r.requester.phone ? <CallBtn phone={r.requester.phone} title="חיוג לפונה" /> : null}
            {waOn && r.requester.phone ? <WaBtn phone={r.requester.phone} text={'שלום, לגבי ה' + word + ' שלך ב' + brand + ':'} title="וואטסאפ לפונה" /> : null}
          </>
        )}
      </div>

      <div style={{ fontSize: 12.5, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 8px' }}>
        {'🧭 ' + routeSummary(route, r)}
        {route.recipients.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {route.recipients.map((l) =>
              props.onOpenListing ? (
                <Btn key={l.id} sm onClick={() => props.onOpenListing?.(l.id)}>
                  {l.name + ' ←'}
                </Btn>
              ) : (
                <Chip key={l.id}>{l.name}</Chip>
              ),
            )}
          </div>
        )}
      </div>

      {r.responses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800 }}>{r.responses.length === 1 ? 'מענה אחד' : r.responses.length + ' מענים'}</div>
          {r.responses.map((x, i) => (
            <div key={i} style={{ fontSize: 12.5 }}>
              {'✋ ' + nameOf(x.listingId) + (x.text ? ' — ' + x.text : '') + ' · ' + agoText(x.at, nowMs)}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {!closed && <Btn sm onClick={() => setRespondOpen(true)}>✋ רישום מענה</Btn>}
        {!closed && responders.length > 0 && <Btn sm onClick={() => setSendOpen(true)}>📤 שליחה לעסקים</Btn>}
        {!closed && (
          <Btn sm kind={r.quiet ? 'danger' : undefined} onClick={closeIt}>
            {r.quiet ? (armed === 'prqc-' + r.id ? 'בטוח? הכול יימחק' : '✓ נמצא — למחוק הכול') : '✓ סמן שנמצא'}
          </Btn>
        )}
        {!closed && <Btn sm onClick={props.onEdit}>✎ עריכה</Btn>}
        {canDelete && (
          <Btn
            sm
            kind="danger"
            onClick={() => {
              if (!confirmTwice('prq-' + r.id, 'למחוק את ה' + word + '?')) {
                toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
                return;
              }
              if (deletePrRequest(r.id)) toast('ה' + word + ' נמחקה');
            }}
          >
            {armed === 'prq-' + r.id ? 'בטוח?' : '🗑'}
          </Btn>
        )}
      </div>

      {respondOpen && (
        <Modal title={'✋ רישום מענה ל' + word} onClose={() => setRespondOpen(false)}>
          <Field label={'מי עונה'}>
            <Select
              value={resp.listingId}
              onChange={(v) => setResp({ ...resp, listingId: v })}
              options={[{ value: '', label: 'מענה ידני של ה' + gabbai }, ...responders.map((l) => ({ value: l.id, label: l.name + (l.source === 'gabbai' ? ' (דרך ה' + gabbai + ')' : '') }))]}
            />
          </Field>
          <Field label={r.quiet ? 'התשובה * (הפונה יראה אותה; ה' + lWord + ' לא יודע מי הפונה)' : 'הערה (רשות)'}>
            <textarea rows={3} value={resp.text} onChange={(e) => setResp({ ...resp, text: e.target.value.slice(0, 500) })} />
          </Field>
          <div className="modal-actions">
            <Btn kind="primary" onClick={respond}>
              רישום
            </Btn>
            <Btn onClick={() => setRespondOpen(false)}>ביטול</Btn>
          </div>
        </Modal>
      )}

      {sendOpen && (
        <Modal title={'📤 שליחה לעסקים בתחום'} onClose={() => setSendOpen(false)}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
            {r.quiet ? '🔒 בקשה בשקט — ההודעה בלי שם ובלי טלפון של הפונה (ופרטי-קשר שהוקלדו בטקסט מושחרים).' : 'ההודעה כוללת רק את תוכן ה' + word + '.'}
          </div>
          <div style={{ fontSize: 13, border: '1px dashed var(--line)', borderRadius: 8, padding: '6px 8px', marginBottom: 8 }}>
            {businessMessage(view, brand, word)}
          </div>
          {responders.map((l) => (
            <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>{l.name}</span>
              {l.source === 'gabbai' && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>טלפון כשר — להתקשר</span>}
              <span style={{ marginInlineStart: 'auto' }}>
                <span dir="ltr">{l.phone}</span>
              </span>
              {telOn && l.phone ? <CallBtn phone={l.phone} title={'חיוג ל' + l.name} /> : null}
              {waOn && l.whatsapp ? <WaBtn phone={l.whatsapp} text={businessMessage(view, brand, word)} title={'וואטסאפ ל' + l.name} /> : null}
            </div>
          ))}
          {gabbaiOnly.length > 0 && !telOn && (
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 6 }}>לרשומות שהוזנו ע״י ה{gabbai} — מתקשרים ומקריאים את ההודעה.</div>
          )}
          <div className="modal-actions">
            <Btn onClick={() => setSendOpen(false)}>סגירה</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
