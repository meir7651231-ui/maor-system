/**
 * 📒 פרנסה׳לע — חלקי "לוח הקהילה" של המקור (עיצוב 5, LU_HTML/luNoteHTML/luOpen/luForm/luSetClock): המנורה על הקיר,
 * הכתר, שעון-הדפים, הפתקים לפי סוג (מזל טוב בזהב · אבלות בשחור · שיעור על דף שורות · לרפואה בכרטיס תהילים · גמ״ח
 * עם חותמת · אבידות/מכירה עם לשוניות-תלישה · מוסדות על נייר-מכתבים עם חותם · קידושא בהזמנה), הפתק הפתוח ("מי בקהילה
 * יכול לעזור" + אישור/הורדה של הגבאי), וטופס "תליית מודעה בלוח". השכבות בפורטל (‎.pn ← ‎.pl) — מעל כרום אורביט,
 * מתחת למודאלים שלו.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { PrPost } from '../../types/domain';
import { useArmed } from '../useArmed';
import { cx, PnPortal } from './skin';
import { usePrPerms } from './hooks';
import { PR_NOTICE_HELP, PR_NOTICE_KIND_LABELS } from './labels';
import { noteRot, type PnNote } from './luach';
import { addDaysIso } from './zmanimBoard';
import { emptyPrPost } from './PostForm';

/* ═══════════════ הקיר: המנורה והכתר ═══════════════ */

export function LampSvg() {
  return (
    <svg className="pl-lampsvg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="pl-lb" x1="0" x2="1">
          <stop offset="0" stopColor="#7a5310" />
          <stop offset=".35" stopColor="#fff0b8" />
          <stop offset=".6" stopColor="#d9a93e" />
          <stop offset="1" stopColor="#6e4a10" />
        </linearGradient>
        <radialGradient id="pl-lg" cx=".5" cy=".2" r=".7">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset=".4" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M60 0 V34" stroke="url(#pl-lb)" strokeWidth="2.4" />
      <circle cx="60" cy="36" r="4" fill="url(#pl-lb)" />
      <path d="M60 40 L28 62 M60 40 L92 62 M60 40 V62" stroke="url(#pl-lb)" strokeWidth="1.4" />
      <ellipse cx="60" cy="74" rx="40" ry="14" fill="url(#pl-lg)" opacity=".9" />
      <path d="M22 62 H98 L90 76 Q60 86 30 76 Z" fill="url(#pl-lb)" />
      <path d="M22 62 H98" stroke="#fff3c4" strokeWidth="1.4" />
      <circle cx="38" cy="80" r="3" fill="#fff6d0" />
      <circle cx="60" cy="84" r="3.4" fill="#fff6d0" />
      <circle cx="82" cy="80" r="3" fill="#fff6d0" />
    </svg>
  );
}

export function CrestCrown() {
  return (
    <svg className="pl-crown" viewBox="0 0 46 30" aria-hidden="true">
      <defs>
        <linearGradient id="pl-cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0b8" />
          <stop offset=".5" stopColor="#e2b75c" />
          <stop offset="1" stopColor="#9a6a1c" />
        </linearGradient>
      </defs>
      <path d="M4 26 L2 8 L13 17 L23 3 L33 17 L44 8 L42 26 Z" fill="url(#pl-cg)" stroke="#5a3a08" strokeWidth="1" />
      <rect x="4" y="25" width="38" height="4" rx="1" fill="url(#pl-cg)" />
      <circle cx="23" cy="3.5" r="2.2" fill="#c0283c" />
      <circle cx="2.5" cy="8" r="1.8" fill="#fff0b8" />
      <circle cx="43.5" cy="8" r="1.8" fill="#fff0b8" />
    </svg>
  );
}

/* ═══════════════ שעון-הדפים (luSetClock) ═══════════════ */

function FlipDigit(props: { v: string }) {
  const [shown, setShown] = useState({ cur: props.v, old: props.v, go: false });
  useEffect(() => {
    if (props.v === shown.cur) return;
    setShown((s) => ({ cur: props.v, old: s.cur, go: true }));
    const t = setTimeout(() => setShown((s) => ({ cur: s.cur, old: s.cur, go: false })), 620);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- הדף מתהפך רק כשהספרה משתנה
  }, [props.v]);
  return (
    <span className={cx('pl-flip', shown.go && 'pl-go')} data-v={shown.cur}>
      <b className="pl-up">{shown.cur}</b>
      <b className="pl-dn">{shown.go ? shown.old : shown.cur}</b>
      <b className="pl-fl">{shown.go ? shown.old : shown.cur}</b>
    </span>
  );
}

export function FlipClock(props: { hhmm: string }) {
  const t = props.hhmm.padStart(5, '0');
  return (
    <div className="pl-clock" aria-label={'השעה ' + t} role="img">
      <FlipDigit v={t[0]} />
      <FlipDigit v={t[1]} />
      <span className="pl-colon" aria-hidden="true">
        :
      </span>
      <FlipDigit v={t[3]} />
      <FlipDigit v={t[4]} />
    </div>
  );
}

/* ═══════════════ הפתקים (luNoteHTML) ═══════════════ */

const PIN = (
  <svg className="pl-i" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11Z" />
    <circle cx="12" cy="10" r="2.2" />
  </svg>
);
const CLOCK = (
  <svg className="pl-i" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
const PHONE = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#555" strokeWidth="2" aria-hidden="true">
    <path d="M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2" />
  </svg>
);

function NoteBody(props: { n: PnNote }) {
  const { n } = props;
  const p = n.b ? <p>{n.b}</p> : null;
  if (n.k === 'simcha')
    return (
      <>
        <span className="pl-orn">✦ ✦ ✦</span>
        <span className="pl-mt">מזל טוב</span>
        <h4>{n.h}</h4>
        {p}
      </>
    );
  if (n.k === 'avel')
    return (
      <>
        <span className="pl-bdh">ברוך דיין האמת</span>
        <h4>{n.h}</h4>
        {p}
      </>
    );
  if (n.k === 'refuah')
    return (
      <>
        <h4>{n.h}</h4>
        {n.nm ? <span className="pl-nm">{n.nm}</span> : null}
        {p}
        <span className="pl-say">אמרתי פרק תהילים</span>
      </>
    );
  if (n.k === 'mosad')
    return (
      <>
        <div className="pl-lh">
          <span>
            <b>{n.org || 'הודעה לציבור'}</b>
            <small>הודעה לציבור</small>
          </span>
          <span className="pl-seal">✦</span>
        </div>
        <h4>{n.h}</h4>
        {p}
      </>
    );
  if (n.k === 'kiddush')
    return (
      <>
        <svg className="pl-wine" viewBox="0 0 24 32" width="26" height="34" aria-hidden="true">
          <path d="M5 2h14c0 9-3 13-7 13S5 11 5 2Z" fill="#8e1a33" stroke="#c9973a" strokeWidth="1.4" />
          <path d="M12 15v11M7 29h10" stroke="#c9973a" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <h4>{n.h}</h4>
        {p}
      </>
    );
  return (
    <>
      <h4>{n.h}</h4>
      {p}
    </>
  );
}

/** לשוניות-התלישה של אבידה/מכירה — נתלשות בנגיעה. */
function TearTabs() {
  const [torn, setTorn] = useState<ReadonlySet<number>>(() => new Set());
  return (
    <div className="pl-tabs">
      {[0, 1, 2, 3, 4].map((j) => (
        <i
          key={j}
          className={torn.has(j) ? 'pl-torn' : undefined}
          onClick={(e) => {
            e.stopPropagation();
            setTorn((s) => new Set([...s, j]));
          }}
        >
          {PHONE}
          לפרטים
        </i>
      ))}
    </div>
  );
}

export function NoteCard(props: { n: PnNote; i: number; big?: boolean; gabbai: string; onOpen?: () => void }) {
  const { n } = props;
  const meta: ReactNode[] = [];
  if (n.place) meta.push(<span key="p">{PIN}{n.place}</span>);
  if (n.time) meta.push(<span key="t">{CLOCK}{n.time}</span>);
  if (n.phone)
    meta.push(
      <span key="ph">
        {PHONE}
        <bdi dir="ltr">{n.phone}</bdi>
      </span>,
    );
  const style = { '--pl-rot': noteRot(n, props.i, props.big) + 'deg' } as CSSProperties;
  const inner = (
    <>
      {n.k === 'kiddush' || n.k === 'mosad' ? (
        <>
          <span className="pl-tape pl-l" />
          <span className="pl-tape pl-r" />
        </>
      ) : (
        <span className="pl-pp" />
      )}
      {n.st === 'pending' ? <span className="pl-pend">{'ממתין לאישור ה' + props.gabbai}</span> : null}
      <div className="pl-pc">
        <NoteBody n={n} />
        {n.k === 'gemach' ? <span className="pl-stamp">גמ״ח</span> : null}
        {meta.length ? <div className="pl-meta">{meta}</div> : null}
        {n.k === 'simcha' ? (
          <div className="pl-act">
            <span className="pl-g">שליחת מזל טוב</span>
          </div>
        ) : n.k === 'avel' ? (
          <div className="pl-act">
            <span>המקום ינחם</span>
          </div>
        ) : null}
        {n.k === 'lost' || n.k === 'sale' ? <TearTabs /> : null}
      </div>
    </>
  );
  const cls = cx('pl-note', n.k && 'pl-' + n.k);
  const label = (PR_NOTICE_KIND_LABELS[n.k] ?? 'מודעה') + ': ' + n.h;
  return props.big ? (
    <div className={cls} style={style} role="article" aria-label={label}>
      {inner}
    </div>
  ) : (
    <button type="button" className={cls} style={style} aria-label={label} onClick={props.onOpen}>
      {inner}
    </button>
  );
}

/* ═══════════════ שכבה (luOpen / luForm) ═══════════════ */

function useLuOverlay(onClose: () => void): void {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('pn-scroll-lock');
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !document.querySelector('.modal-back')) {
        e.stopPropagation();
        close.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      root.classList.remove('pn-scroll-lock');
      document.removeEventListener('keydown', onKey);
    };
  }, []);
}

/** הפתק הפתוח: גדול, "מי בקהילה יכול לעזור" (חיפוש באלפון), ולמאשר — אישור ותלייה / הורדה מהלוח / דחייה. */
export function NoteOverlay(props: { n: PnNote; i: number; onClose: () => void; onSearch: ((q: string) => void) | null; onEdit: (p: PrPost) => void; toast: (m: string) => void }) {
  const config = useApp((s) => s.config);
  const setPrStatus = useApp((s) => s.setPrStatus);
  const deletePrPost = useApp((s) => s.deletePrPost);
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const word = termOf(config, 'entity.prPost', 'מודעה');
  const { n, onClose } = props;
  useLuOverlay(onClose);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus({ preventScroll: true }), []);
  const help = PR_NOTICE_HELP[n.k];
  const post = n.post;
  function decide(status: 'approved' | 'rejected'): void {
    if (post && setPrStatus('post', post.id, status)) {
      props.toast(status === 'approved' ? 'ה' + word + ' נתלתה בלוח' : 'ה' + word + ' הורדה מהלוח');
      onClose();
    }
  }
  return (
    <PnPortal>
      <div className="pl">
        <div className="pl-ov" role="dialog" aria-modal="true" aria-label={PR_NOTICE_KIND_LABELS[n.k] || word} onClick={(e) => e.target === e.currentTarget && onClose()}>
          <button ref={closeRef} className="pl-close" type="button" aria-label="סגירה" onClick={onClose}>
            ✕
          </button>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <NoteCard n={n} i={props.i} big gabbai={gabbai} />
            {help && props.onSearch ? (
              <div className="pl-help">
                <b>{help.title}</b>
                <div>
                  {help.chips.map((h) => (
                    <span
                      key={h}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onClose();
                        props.onSearch?.(h);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onClose();
                          props.onSearch?.(h);
                        }
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {post && !n.ex ? (
              <div className="pl-adm">
                {canApprove && n.st !== 'approved' ? (
                  <button className="pl-ok" type="button" onClick={() => decide('approved')}>
                    אישור ותלייה
                  </button>
                ) : null}
                {canApprove ? (
                  <button className="pl-no" type="button" onClick={() => decide('rejected')}>
                    {n.st === 'approved' ? 'הורדה מהלוח' : 'דחייה'}
                  </button>
                ) : null}
                <button className="pl-no" type="button" onClick={() => props.onEdit(post)}>
                  עריכה
                </button>
                {canDelete ? (
                  <button
                    className="pl-no"
                    type="button"
                    onClick={() => {
                      if (!confirmTwice('prp-' + post.id, 'למחוק את "' + post.title + '"?')) {
                        props.toast('ללחוץ שוב כדי למחוק את ה' + word);
                        return;
                      }
                      if (deletePrPost(post.id)) {
                        props.toast('ה' + word + ' נמחקה');
                        onClose();
                      }
                    }}
                  >
                    {armed === 'prp-' + post.id ? 'ללחוץ שוב למחיקה' : 'מחיקה'}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PnPortal>
  );
}

/** "תליית מודעה בלוח" (luForm): סוג · כותרת · פרטים · מקום · מתי · יורד מהלוח (שבוע כברירת-מחדל); + טלפון ונעיצה (הפורט). */
export function NoticeForm(props: { base: PrPost | null; todayIso: string; onClose: () => void; toast: (m: string) => void }) {
  const config = useApp((s) => s.config);
  const upsertPrPost = useApp((s) => s.upsertPrPost);
  const { canApprove } = usePrPerms();
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const word = termOf(config, 'entity.prPost', 'מודעה');
  const { base, onClose } = props;
  useLuOverlay(onClose);
  const [kind, setKind] = useState<string>(base ? base.noticeKind : 'simcha');
  const [f, setF] = useState(() => ({
    title: base?.title ?? '',
    text: base?.text ?? '',
    place: base?.place ?? '',
    time: base?.time ?? '',
    phone: base?.phone ?? '',
    until: base ? base.until : addDaysIso(props.todayIso, 7),
    pinned: base?.pinned ?? false,
  }));
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => titleRef.current?.focus({ preventScroll: true }), []);
  function save(): void {
    if (!f.title.trim()) {
      titleRef.current?.focus();
      return;
    }
    const res = upsertPrPost({
      ...(base ?? emptyPrPost('notice')),
      kind: 'notice',
      noticeKind: kind,
      title: f.title.trim(),
      text: f.text.trim(),
      place: f.place.trim(),
      time: f.time.trim(),
      phone: f.phone.trim(),
      until: f.until,
      pinned: canApprove ? f.pinned : (base?.pinned ?? false),
    });
    if (!res.ok || !res.post) return;
    props.toast(res.post.approved ? 'ה' + word + ' נתלתה בלוח' : 'ה' + word + ' נשלחה ל' + gabbai + '. היא תיתלה אחרי אישור');
    onClose();
  }
  return (
    <PnPortal>
      <div className="pl">
        <div className="pl-ov" role="dialog" aria-modal="true" aria-label={'תליית ' + word} onClick={(e) => e.target === e.currentTarget && onClose()}>
          <form
            className="pl-frm"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <h3>{base ? 'עריכת ה' + word : 'תליית ' + word + ' בלוח'}</h3>
            <small>{'ה' + gabbai + ' מאשר כל ' + word + ' לפני שהיא נתלית'}</small>
            <div className="pl-kinds" role="group" aria-label={'סוג ה' + word}>
              {Object.entries(PR_NOTICE_KIND_LABELS).map(([k, l]) => (
                <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>
                  {l}
                </button>
              ))}
            </div>
            <label>
              כותרת
              <input ref={titleRef} required maxLength={80} placeholder="למשל: לרגל הולדת הבן" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </label>
            <label>
              פרטים
              <textarea maxLength={400} placeholder="מה, למי, ומה מבקשים מהקהילה" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
            </label>
            <div className="pl-row2">
              <label>
                מקום
                <input maxLength={60} value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} />
              </label>
              <label>
                מתי
                <input maxLength={40} placeholder="ליל ש״ק / 15:00" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
              </label>
            </div>
            <div className="pl-row2">
              <label>
                טלפון לפרטים
                <input type="tel" inputMode="tel" dir="ltr" maxLength={20} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              </label>
              <label>
                יורד מהלוח בתאריך
                <input type="date" value={f.until} onChange={(e) => setF({ ...f, until: e.target.value })} />
              </label>
            </div>
            {canApprove ? (
              <label className="pl-pinl">
                <input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} /> נעוצה בראש הלוח
              </label>
            ) : null}
            <div className="pl-acts">
              <button className="pl-ok" type="submit">
                {base ? 'שמירה' : 'שליחה ל' + gabbai}
              </button>
              <button className="pl-no" type="button" onClick={onClose}>
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </PnPortal>
  );
}
