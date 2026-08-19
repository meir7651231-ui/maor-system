/**
 * 💰 תשלומים נכנסים (גל ד׳ "עד-השרת", הרחבת payments) — הרשומות ש-paymentsWebhook
 * כתב אחרי חיוב אצל חברת-הסליקה. המזכירה רואה, ו:
 *  · **🔗 מזג לכרטיס** (19.8) — משייך את העסקה ל-hist של כרטיס-תומך, **בסגנון בדיקת-
 *    הכפילויות** (מועמדים לפי מפתחות + השוואת-שדות תשלום↔כרטיס). לחיובים שהסנכרון
 *    האוטומטי לא התאים (שם שונה/חסר).
 *  · **נרשם ✓** — סימון-טופל בלבד (בלי שיוך), לזרימות הידניות.
 * בלי Functions פרוסות: הרשימה ריקה — המסך ישר אומר זאת.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn, Empty, Modal } from '../ui';
import type { IncomingPayment } from '../../store/cloudSync';
import { autoMatchCharges, candidateSupportersForCharge, strongMatchForCharge } from '../../lib/nedarimSync';
import { normId, normPhone } from '../../lib/dedup';
import { normSearch } from '../../lib/validate';
import { termOf } from '../../lib/config';
import { fmtDate, supCount, totalLabel } from './lib';
import type { Supporter } from '../../types/domain';

type CloudMod = typeof import('../../store/cloudSync');

export function IncomingPaymentsModal(props: { onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const supporters = useApp((s) => s.db.supporters);
  const attachBulk = useApp((s) => s.attachIncomingBulk);
  const [mod, setMod] = useState<CloudMod | null>(null);
  const [rows, setRows] = useState<IncomingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergeFor, setMergeFor] = useState<IncomingPayment | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  async function refresh(m: CloudMod) {
    setLoading(true);
    setRows(await m.fetchIncomingPayments());
    setLoading(false);
  }

  useEffect(() => {
    let alive = true;
    void import('../../store/cloudSync').then((m) => {
      if (!alive) return;
      setMod(m);
      void refresh(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function markDone(id: string) {
    if (!mod) return;
    await mod.markIncomingPayment(id).catch(() => toast('⚠ הסימון נכשל — נסו שוב'));
    await refresh(mod);
  }

  // אחרי שיוך-לכרטיס: מסמנים את התשלום כטופל (יוצא מהרשימה) ומרעננים.
  async function afterMerge(p: IncomingPayment) {
    setMergeFor(null);
    await markDone(p.id);
  }

  // ⚠️ תקרת-תצוגה: גיבוי-היסטורי גדול (אלפי ממתינים) ⇒ רינדור כולם מקפיא את
  // הדפדפן (תקרית 19.8). מציגים רק את ה-SHOWN הראשונים; לבּאלק — מסך 🔄 הסנכרון.
  const SHOWN = 300;
  const shown = rows.slice(0, SHOWN);

  const allSelected = shown.length > 0 && shown.every((p) => sel.has(p.id));
  function toggleAll() {
    setSel(allSelected ? new Set() : new Set(shown.map((p) => p.id)));
  }
  function toggle(id: string) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  async function markMany(ids: string[]) {
    if (!mod) return;
    for (let i = 0; i < ids.length; i += 300) {
      await Promise.all(ids.slice(i, i + 300).map((id) => mod.markIncomingPayment(id).catch(() => {})));
    }
  }
  // בחירה-מרובה → סימון-שנרשמו לכל המסומנים (בלי שיוך).
  async function bulkMark() {
    if (!mod) return;
    const ids = shown.filter((p) => sel.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    setBusy(true);
    await markMany(ids);
    setSel(new Set());
    await refresh(mod);
    setBusy(false);
    toast('✓ ' + ids.length + ' תשלומים סומנו כנרשמו');
  }
  // בחירה-מרובה → שיוך-אוטומטי-בטוח: כל מסומן שיש לו התאמה-ודאית (מזהה/ת"ז/טלפון/
  // אימייל) מחובר לכרטיס; שם-בלבד נשאר לשיוך-ידני (מונע התאמת-שווא).
  async function bulkAutoMerge() {
    if (!mod) return;
    const chosen = shown.filter((p) => sel.has(p.id));
    if (!chosen.length) return;
    setBusy(true);
    const items: { supId: string; charge: IncomingPayment }[] = [];
    for (const p of chosen) {
      const m = strongMatchForCharge(p, supporters);
      if (m) items.push({ supId: m.id, charge: p });
    }
    const added = items.length ? attachBulk(items) : 0;
    await markMany(items.map((it) => it.charge.id)); // רק המחוברים מסומנים handled
    setSel(new Set());
    await refresh(mod);
    setBusy(false);
    const skipped = chosen.length - items.length;
    toast('🔗 ' + added + ' חוברו אוטומטית' + (skipped ? ' · ' + skipped + ' ללא-התאמה-ודאית (לשיוך ידני)' : ''));
  }

  // 🔗 מיזוג-כל-הממתינים: עובד על **כל** ה-rows (הערימה המלאה, לא רק 300 המוצגים).
  // כך לא-מתאימים בראש-הרשימה כבר לא חוסמים את השאר — כל בעל-התאמה-ודאית מחובר
  // בבת-אחת (autoMatchCharges O(S+M)), ורק נטולי-ההתאמה נשארים לשיוך-ידני.
  async function autoMergeAllPending() {
    if (!mod) return;
    setBusy(true);
    const items = autoMatchCharges(rows, supporters);
    const added = items.length ? attachBulk(items) : 0;
    await markMany(items.map((it) => it.charge.id).filter((x): x is string => !!x));
    setSel(new Set());
    await refresh(mod);
    setBusy(false);
    const remaining = rows.length - items.length;
    toast('🔗 ' + added + ' חוברו · ' + (remaining ? remaining.toLocaleString('he-IL') + ' נותרו לשיוך ידני' : 'הרשימה רוקנה'));
  }

  if (mergeFor) {
    return <MergeView pay={mergeFor} onBack={() => setMergeFor(null)} onMerged={() => void afterMerge(mergeFor)} onClose={props.onClose} />;
  }

  return (
    <Modal title="💰 תשלומים נכנסים — ממתינים לרישום" onClose={props.onClose}>
      {loading && <div className="empty">טוען…</div>}
      {!loading && rows.length === 0 && (
        <Empty>
          אין תשלומים ממתינים. (הרשימה מתמלאת אוטומטית כשחברת-הסליקה מדווחת —
          דורש את שרת-ההרחבות; ראו RUNBOOK-FUNCTIONS.)
        </Empty>
      )}
      {/* 🔗 מיזוג-אוטומטי של כל הערימה — בקליק אחד, לא רק 300 המוצגים */}
      {!loading && rows.length > 0 && (
        <div style={{ border: '1px solid var(--accent)', borderRadius: 10, padding: 10, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'var(--accent-bg, #f0f6ff)' }}>
          <div style={{ flex: 1, minWidth: 180, fontSize: 12.5 }}>
            <b>{rows.length.toLocaleString('he-IL')}</b> תשלומים ממתינים.
            כפתור זה מחבר <b>את כל</b> בעלי-ההתאמה-הוודאית (מזהה/ת״ז/טלפון/אימייל) לכרטיסים בבת-אחת;
            רק נטולי-התאמה יישארו לשיוך ידני.
          </div>
          <Btn kind="primary" disabled={busy} onClick={() => void autoMergeAllPending()} title="שיוך-אוטומטי של כל הממתינים לכרטיסים לפי התאמה-ודאית">
            🔗 מזג אוטומטית את כל הממתינים ({rows.length.toLocaleString('he-IL')})
          </Btn>
          {busy && <span style={{ fontSize: 12, color: 'var(--accent)' }}>מעבד…</span>}
        </div>
      )}
      {rows.length > SHOWN && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 12.5, color: 'var(--ink-faint)' }}>
          מוצגים {SHOWN} הראשונים בלבד (מתוך {rows.length.toLocaleString('he-IL')}). לשיוך-ידני פרטני —
          גללו ומזגו; לחיבור-המוני השתמשו בכפתור <b>🔗 מזג אוטומטית את כל הממתינים</b> למעלה.
        </div>
      )}
      {/* בחירה-מרובה: בחר-הכל + פעולות-אצווה */}
      {!loading && shown.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', marginBottom: 4, borderBottom: '2px solid var(--line)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer', fontWeight: 700 }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 'auto' }} />
            בחר הכל ({shown.length})
          </label>
          {sel.size > 0 && (
            <>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>· נבחרו {sel.size}</span>
              <Btn sm kind="primary" disabled={busy} onClick={() => void bulkAutoMerge()} title="שיוך-אוטומטי לכרטיסים לפי התאמה-ודאית (מזהה/ת״ז/טלפון/אימייל)">🔗 מזג אוטומטית ({sel.size})</Btn>
              <Btn sm disabled={busy} onClick={() => void bulkMark()} title="סימון-שנרשמו לכל המסומנים (בלי שיוך)">✓ סמן שנרשמו ({sel.size})</Btn>
              <Btn sm disabled={busy} onClick={() => setSel(new Set())}>נקה</Btn>
            </>
          )}
          {busy && <span style={{ fontSize: 12, color: 'var(--accent)' }}>מעבד…</span>}
        </div>
      )}
      {shown.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)', background: sel.has(p.id) ? 'var(--ok-bg, #eaf6ec)' : 'transparent' }}>
          <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} style={{ width: 'auto', flexShrink: 0 }} aria-label="בחירת תשלום" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>
              {p.currency || '₪'}{p.amount.toLocaleString('he-IL')} · {p.name || 'ללא שם'}
              {p.kevaId ? <span style={{ fontSize: 11, color: 'var(--accent)', marginInlineStart: 6 }}>🔁 הו״ק</span> : null}
              {p.category ? <span style={{ fontSize: 11, color: 'var(--ink-faint)', marginInlineStart: 6 }}>· {p.category}</span> : null}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }} dir="ltr">
              {[p.phone, p.email, p.zeout && ('ת"ז ' + p.zeout)].filter(Boolean).join(' · ')}
              {p.reference ? ' · ' + p.reference : ''} · {p.at.slice(0, 10)}
            </div>
          </div>
          <Btn sm kind="primary" onClick={() => setMergeFor(p)} title="שיוך העסקה לכרטיס-תומך (בסגנון בדיקת-כפילויות)">
            🔗 מזג לכרטיס
          </Btn>
          <Btn sm onClick={() => void markDone(p.id)} title="סימון שטופל (בלי שיוך לכרטיס)">
            נרשם ✓
          </Btn>
        </div>
      ))}
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
        <b>🔗 מזג לכרטיס</b> = משייך את העסקה להיסטוריית-החיוב של כרטיס-התומך (כמו הסנכרון, ידנית).
        <b> נרשם ✓</b> = רק סימון שטופל, לזרימות הידניות — כדי ששום תשלום לא ילך לאיבוד.
      </div>
    </Modal>
  );
}

/** מסך שיוך-ידני של תשלום לכרטיס — מועמדים לפי מפתחות + השוואת-שדות תשלום↔כרטיס. */
function MergeView(props: { pay: IncomingPayment; onBack: () => void; onMerged: () => void; onClose: () => void }) {
  const { pay } = props;
  const supporters = useApp((s) => s.db.supporters);
  const config = useApp((s) => s.config);
  const attach = useApp((s) => s.attachIncomingToSupporter);
  const toast = useApp((s) => s.toast);
  const [q, setQ] = useState('');
  const [armed, setArmed] = useState<string | null>(null);

  const candidates = useMemo(() => candidateSupportersForCharge(pay, supporters), [pay, supporters]);
  const qn = normSearch(q);
  const qDigits = q.replace(/\D/g, '');
  const searchResults = useMemo(() => {
    if (qn.length < 2 && qDigits.length < 3) return [];
    return supporters
      .filter((s) => (qn.length >= 2 && normSearch(s.name).includes(qn)) || (qDigits.length >= 3 && normPhone(s.phone).includes(qDigits)))
      .slice(0, 10);
  }, [qn, qDigits, supporters]);
  const list = q.trim() ? searchResults : candidates;

  function doMerge(sp: Supporter) {
    if (armed !== sp.id) { setArmed(sp.id); return; }
    const ok = attach(sp.id, pay);
    toast(ok ? '🔗 העסקה חוברה לכרטיס ' + sp.name : 'העסקה כבר קיימת בכרטיס זה');
    props.onMerged();
  }

  const nav = termOf(config, 'nav.supporters', 'תורם');
  const payDate = pay.d || pay.at.slice(0, 10);

  return (
    <Modal title={'🔗 שיוך תשלום ל' + nav} onClose={props.onClose} wide>
      {/* פרטי-העסקה */}
      <div style={{ border: '1px solid var(--accent)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>
          {pay.currency || '₪'}{pay.amount.toLocaleString('he-IL')} · {pay.name || 'ללא שם'}
          {pay.kevaId ? <span style={{ fontSize: 11, color: 'var(--accent)', marginInlineStart: 6 }}>🔁 הו״ק</span> : null}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }} dir="ltr">
          {[pay.phone, pay.email, pay.zeout && ('ת"ז ' + pay.zeout)].filter(Boolean).join(' · ')}
          {pay.reference ? ' · ' + pay.reference : ''} · {fmtDate(payDate)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={'🔎 חיפוש ' + nav + ' (שם או טלפון)…'}
          style={{ flex: 1, fontSize: 13, padding: '5px 8px' }}
        />
        <Btn sm onClick={props.onBack}>← חזרה</Btn>
      </div>

      {list.length === 0 ? (
        <Empty>
          {q.trim() ? 'לא נמצא כרטיס תואם לחיפוש.' : 'לא נמצאו מועמדים אוטומטיים — חפשו ' + nav + ' לפי שם/טלפון למעלה.'}
        </Empty>
      ) : (
        <>
          {!q.trim() && <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>מועמדים (לפי מזהה-תורם / ת"ז / טלפון / אימייל / שם):</div>}
          {list.map((sp) => (
            <div key={sp.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 800, flex: 1 }}>{sp.name}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{supCount(sp) + ' · ' + totalLabel(sp)}</span>
              </div>
              {/* השוואת-שדות תשלום↔כרטיס (בסגנון בדיקת-כפילויות) */}
              <CmpRow label="שם" a={pay.name} b={sp.name} match={!!pay.name && normSearch(pay.name) === normSearch(sp.name)} />
              <CmpRow label="טלפון" a={pay.phone} b={sp.phone} match={!!normPhone(pay.phone) && normPhone(pay.phone) === normPhone(sp.phone)} />
              <CmpRow label="אימייל" a={pay.email || ''} b={sp.email} match={!!pay.email && pay.email.toLowerCase() === (sp.email || '').toLowerCase()} />
              <CmpRow label={'ת"ז'} a={pay.zeout || ''} b={sp.idNum} match={!!normId(pay.zeout) && normId(pay.zeout) === normId(sp.idNum)} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <Btn sm kind={armed === sp.id ? 'danger' : 'primary'} onClick={() => doMerge(sp)}>
                  {armed === sp.id ? 'לאשר שיוך?' : '🔗 מזג לכאן'}
                </Btn>
                {armed === sp.id && <Btn sm onClick={() => setArmed(null)}>ביטול</Btn>}
              </div>
            </div>
          ))}
        </>
      )}

      <div className="modal-actions">
        <Btn onClick={props.onBack}>← חזרה לרשימה</Btn>
      </div>
    </Modal>
  );
}

/** שורת-השוואה: תווית · ערך-בתשלום · ערך-בכרטיס; רקע ירוק כשהם תואמים. */
function CmpRow(props: { label: string; a: string; b: string; match: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px', fontSize: 12.5, borderRadius: 6, background: props.match ? 'var(--ok-bg, #eaf6ec)' : 'transparent' }}>
      <span style={{ width: 56, flexShrink: 0, color: 'var(--ink-faint)', fontWeight: 600 }}>{props.label}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="auto">{props.a || '—'}</span>
      <span style={{ color: 'var(--ink-faint)' }}>↔</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: props.match ? 700 : 400 }} dir="auto">{props.b || '—'}</span>
      {props.match && <span title="תואם" style={{ color: 'var(--ok, #2e7d32)' }}>✓</span>}
    </div>
  );
}
