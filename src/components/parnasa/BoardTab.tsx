/**
 * 📒 פרנסה׳לע — לשונית 📌 לוח קהילה (אשכול 5, "לוח הקהילה" של המקור §3.10):
 *   · 🕰 לוח הזמנים (parnasa.zmanim) — buildZmanimBoard: זמני-היום (עבר מעומעם, הבא מודגש), המניין
 *     הבא + ספירה-לאחור, מניינים בשכונה, שבת קודש (בשבת — הנוכחית), בקהילה השבוע, מספרי-חירום;
 *     זמני-השבוע בטבלה. אזור-הזמן של הקהילה, התאריך העברי מתחלף בשקיעה (המנוע).
 *   · 📌 לוח המודעות — מאושרות ושלא פגו (ממתינות — למאשר בלבד, מסומנות), סינון לפי סוג, צ'יפי
 *     "מי בקהילה יכול לעזור" שמחפשים במדריך.
 *   · ⚙ עריכת הגבאי (מאשר/ת בלבד) — מיקום-הזמנים, בתי-כנסת/מניינים, אירועים, מספרי-חירום.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, telephonyOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import { mapsSearchUrl } from '../../lib/mapsLink';
import type { PrPost, PrPostKind } from '../../types/domain';
import { Btn, Chip, Empty } from '../ui';
import { useArmed } from '../useArmed';
import { CallBtn } from '../CallBtn';
import { buildZmanimBoard, emergencyDrafts, hmToMin, postActiveOn, PR_ZMANIM_NOTE, weekZmanim, type PrMinyanTime } from './zmanimBoard';
import { PostForm } from './PostForm';
import { ZmanimLocationEditor } from './ZmanimLocationEditor';
import { usePrPerms, type PrNow } from './hooks';
import { ddmm, PR_NOTICE_HELP, PR_NOTICE_KIND_ICONS, PR_NOTICE_KIND_LABELS, PR_POST_KIND_LABELS } from './labels';

type Seg = 'zmanim' | 'notices' | 'edit';

const PANEL = { display: 'flex', flexDirection: 'column', gap: 4 } as const;

/** ספירה-לאחור עד שעה (אותו יום): "בעוד 25 דקות" / "בעוד 1:40 שעות". */
function countdown(hhmm: string, nowHm: string): string {
  const a = hmToMin(hhmm);
  const b = hmToMin(nowHm);
  if (a === null || b === null) return '';
  const d = a - b;
  if (d <= 0) return 'עכשיו';
  return d < 60 ? 'בעוד ' + d + ' דקות' : 'בעוד ' + Math.floor(d / 60) + ':' + String(d % 60).padStart(2, '0') + ' שעות';
}

/** כתובת ⇒ קישור-מפה (מגודר-הרחבה אצל הקורא). */
function PlaceLink(props: { place: string; mapsOn: boolean }) {
  const url = props.mapsOn ? mapsSearchUrl(props.place) : null;
  if (!props.place) return null;
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }} title="פתיחה במפות">
      {'📍 ' + props.place}
    </a>
  ) : (
    <span style={{ fontSize: 12.5 }}>{'📍 ' + props.place}</span>
  );
}

export function BoardTab(props: { now: PrNow; onSearch: ((q: string) => void) | null }) {
  const config = useApp((s) => s.config);
  const posts = useApp((s) => s.db.prPosts);
  const setPrStatus = useApp((s) => s.setPrStatus);
  const deletePrPost = useApp((s) => s.deletePrPost);
  const upsertPrPost = useApp((s) => s.upsertPrPost);
  const toast = useApp((s) => s.toast);
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const zmanimOn = featureOn(config, 'parnasa.zmanim');
  const [seg, setSeg] = useRemembered<Seg>('parnasa.board.seg', zmanimOn ? 'zmanim' : 'notices');
  const [kindFilter, setKindFilter] = useRemembered<string>('parnasa.board.kind', '');
  const [week, setWeek] = useRemembered<boolean>('parnasa.board.week', false);
  const [form, setForm] = useState<{ post: PrPost | null; kind: PrPostKind } | null>(null);
  const [openNotice, setOpenNotice] = useState<string | null>(null);

  const { now } = props;
  const board = useMemo(() => buildZmanimBoard(now.clock, now.loc, posts), [now.clock, now.loc, posts]);
  const weekRows = useMemo(() => (week ? weekZmanim(now.clock.iso, now.loc, 7) : []), [week, now.clock.iso, now.loc]);

  const word = termOf(config, 'entity.prPost', 'מודעה');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const mapsOn = integrationOn(config, 'maps');
  const telOn = telephonyOn(config);
  const active = seg === 'zmanim' && !zmanimOn ? 'notices' : seg === 'edit' && !canApprove ? 'notices' : seg;
  const today = now.todayIso;

  const notices = posts
    .filter((p) => p.kind === 'notice' && (postActiveOn(p, today) || (canApprove && !p.approved && (!p.until || p.until >= today))))
    .filter((p) => !kindFilter || p.noticeKind === kindFilter)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.createdAt).localeCompare(String(a.createdAt)));
  const kindsPresent = [...new Set(posts.filter((p) => p.kind === 'notice' && postActiveOn(p, today) && p.noticeKind).map((p) => p.noticeKind))];
  const pendingNotices = posts.filter((p) => p.kind === 'notice' && !p.approved && (!p.until || p.until >= today)).length;
  const eventsWeek = posts
    .filter((p) => p.kind === 'event' && postActiveOn(p, today) && (!p.date || p.date >= today))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title, 'he'));
  const byShul = new Map<string, { shul: string; place: string; rows: PrMinyanTime[] }>();
  for (const m of board.minyanim) {
    const cur = byShul.get(m.postId) ?? { shul: m.shul, place: m.place, rows: [] };
    cur.rows.push(m);
    byShul.set(m.postId, cur);
  }

  function decide(p: PrPost, status: 'approved' | 'rejected') {
    if (setPrStatus('post', p.id, status)) toast(status === 'approved' ? 'נתלה בלוח' : 'ירד מהלוח');
  }

  function remove(p: PrPost) {
    if (!confirmTwice('prp-' + p.id, 'למחוק את "' + p.title + '"?')) {
      toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
      return;
    }
    if (deletePrPost(p.id)) toast('נמחק');
  }

  function seedEmergency() {
    let n = 0;
    for (const d of emergencyDrafts()) {
      const res = upsertPrPost({ id: '', kind: 'emergency', title: d.title, text: d.text, place: '', phone: d.phone, noticeKind: '', prayers: [], days: [], date: '', time: '', until: '', approved: false, pinned: false, createdAt: '', updatedAt: '' });
      if (res.ok) n++;
    }
    toast(n + ' מספרי-חירום נוצרו לעריכה');
  }

  /** שורת-ניהול לפריט בלוח (עריכה / אישור / הורדה / מחיקה). */
  function rowActions(p: PrPost) {
    return (
      <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginInlineStart: 'auto' }}>
        <Btn sm onClick={() => setForm({ post: p, kind: p.kind })} title="עריכה">
          ✎
        </Btn>
        {canApprove && !p.approved && (
          <Btn sm kind="primary" onClick={() => decide(p, 'approved')}>
            ✓ אישור ותלייה
          </Btn>
        )}
        {canApprove && p.approved && (
          <Btn sm onClick={() => decide(p, 'rejected')}>
            הורדה מהלוח
          </Btn>
        )}
        {canDelete && (
          <Btn sm kind="danger" onClick={() => remove(p)}>
            {armed === 'prp-' + p.id ? 'בטוח?' : '🗑'}
          </Btn>
        )}
      </span>
    );
  }

  const status = (p: PrPost): string =>
    !p.approved ? (p.until && p.until < today ? ' · ירד מהלוח' : ' · ⏳ ממתין לאישור') : p.until && p.until < today ? ' · פג' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>הזמנים, המניינים והמודעות של השכונה, במקום אחד.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {zmanimOn && (
          <Chip on={active === 'zmanim'} onClick={() => setSeg('zmanim')}>
            🕰 לוח הזמנים
          </Chip>
        )}
        <Chip on={active === 'notices'} onClick={() => setSeg('notices')}>
          {'📌 לוח המודעות' + (canApprove && pendingNotices ? ' (' + pendingNotices + ' ממתינות)' : '')}
        </Chip>
        {canApprove && (
          <Chip on={active === 'edit'} onClick={() => setSeg('edit')}>
            {'⚙ עריכת ה' + gabbai}
          </Chip>
        )}
      </div>

      {active === 'zmanim' && (
        <>
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{'זמני היום · ' + board.hebDate.text}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                {ddmm(now.clock.iso) + '/' + now.clock.iso.slice(0, 4) + (board.dayName ? ' · ' + board.dayName : '') + (board.hebDate.night ? ' · אחרי השקיעה' : '')}
              </div>
            </div>
            <div dir="ltr" aria-label="השעה" style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {now.clock.hhmm}
            </div>
          </div>
          {board.closure.closed && (
            <div className="card" style={{ fontWeight: 700 }}>
              {'🕯 ' + board.closure.reason + ' · עד צאת ' + board.closure.endTime + ' (' + board.closure.motzei + ')'}
            </div>
          )}
          <div className="card" style={{ fontSize: 14 }}>
            <b>המניין הבא: </b>
            {board.nextMinyan
              ? board.nextMinyan.prayer + ' · ' + board.nextMinyan.shul + ' · ' + board.nextMinyan.time + ' · ' + countdown(board.nextMinyan.time, now.clock.hhmm)
              : 'אין עוד מניינים היום'}
            {board.nextZman && (
              <span style={{ color: 'var(--ink-faint)' }}>{' · הזמן הבא: ' + board.nextZman.label + (board.nextZman.sub ? ' (' + board.nextZman.sub + ')' : '') + ' ' + board.nextZman.time}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            <section className="card" style={PANEL}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>זמני היום</h2>
              {board.zmanim.map((z) => (
                <div
                  key={z.key}
                  style={{ display: 'flex', gap: 8, fontSize: 13, opacity: z.past ? 0.45 : 1, fontWeight: z.next ? 800 : 400, color: z.next ? 'var(--accent)' : undefined }}
                >
                  <span>{z.label}</span>
                  {z.sub && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{z.sub}</span>}
                  <span style={{ marginInlineStart: 'auto' }}>
                    <span dir="ltr">{z.time || '—'}</span>
                  </span>
                </div>
              ))}
            </section>

            <section className="card" style={PANEL}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>מניינים בשכונה</h2>
              {byShul.size === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{'אין מניינים היום. ה' + gabbai + ' מוסיף/ה בתי-כנסת ב"⚙ עריכת ה' + gabbai + '".'}</div>}
              {[...byShul.entries()].map(([id, s]) => (
                <div key={id} style={{ borderBottom: '1px dotted var(--line)', paddingBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.shul}</div>
                  <PlaceLink place={s.place} mapsOn={mapsOn} />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                    {s.rows.map((m, i) => {
                      const past = m.time < now.clock.hhmm;
                      const next = board.nextMinyan === m;
                      return (
                        <span
                          key={i}
                          style={{
                            fontSize: 12,
                            border: '1px solid var(--line)',
                            borderRadius: 6,
                            padding: '0 5px',
                            textDecoration: past ? 'line-through' : undefined,
                            opacity: past ? 0.5 : 1,
                            fontWeight: next ? 800 : 400,
                          }}
                        >
                          {m.prayer + ' ' + m.time}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            <section className="card" style={PANEL}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>שבת קודש</h2>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                {(board.shabbat.current ? 'השבת · ' : 'השבת הקרובה · ') + board.shabbat.hebDate + (board.shabbat.mevarchim ? ' · שבת מברכים חודש ' + board.shabbat.mevarchim : '') + (board.shabbat.holiday ? ' · ' + board.shabbat.holiday : '')}
              </div>
              {[
                ['הדלקת נרות (ערש״ק)', board.shabbat.candle],
                ['צאת השבת', board.shabbat.end],
                ['רבנו תם', board.shabbat.rabbeinuTam],
              ].map(([label, time]) => (
                <div key={label} style={{ display: 'flex', fontSize: 13 }}>
                  <span>{label}</span>
                  <span style={{ marginInlineStart: 'auto' }}>
                    <span dir="ltr">{time || '—'}</span>
                  </span>
                </div>
              ))}
            </section>

            <section className="card" style={PANEL}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>בקהילה השבוע</h2>
              {eventsWeek.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין אירועים קרובים.</div>}
              {eventsWeek.map((e) => (
                <div key={e.id} style={{ fontSize: 13 }}>
                  <b>{[e.date ? ddmm(e.date) : '', e.time].filter(Boolean).join(' · ') || '—'}</b>
                  {' · ' + e.title}
                  {e.text && <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{e.text}</div>}
                  <PlaceLink place={e.place} mapsOn={mapsOn} />
                </div>
              ))}
            </section>

            <section className="card" style={PANEL}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>🚑 מספרי חירום</h2>
              {board.emergency.map((e) => (
                <div key={e.label + e.phone} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}>
                  <b>{e.label}</b>
                  {e.note && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{e.note}</span>}
                  <span style={{ marginInlineStart: 'auto', fontWeight: 800 }}>
                    <span dir="ltr">{e.phone}</span>
                  </span>
                  {telOn ? <CallBtn phone={e.phone} title={'חיוג ל' + e.label} /> : null}
                </div>
              ))}
            </section>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip on={week} onClick={() => setWeek(!week)}>
              📅 זמני השבוע
            </Chip>
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{board.note}</span>
          </div>
          {week && (
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    {['יום', 'תאריך', 'עלות', 'נץ', 'סוף ק״ש (גר״א)', 'חצות', 'שקיעה', 'צאת', 'הערות'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekRows.map((r) => (
                    <tr key={r.iso}>
                      <td>{r.dayName}</td>
                      <td>{r.hebDate}</td>
                      <td dir="ltr">{r.alot}</td>
                      <td dir="ltr">{r.sunrise}</td>
                      <td dir="ltr">{r.shmaGra}</td>
                      <td dir="ltr">{r.chatzot}</td>
                      <td dir="ltr">{r.sunset}</td>
                      <td dir="ltr">{r.tzeis}</td>
                      <td>{[r.candle ? 'הדלקה ' + r.candle : '', r.end ? (r.dow === 6 ? 'צאת השבת ' : 'צאת החג ') + r.end : '', r.holiday].filter(Boolean).join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{PR_ZMANIM_NOTE}</div>
            </div>
          )}
        </>
      )}

      {active === 'notices' && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip on={!kindFilter} onClick={() => setKindFilter('')}>
              הכול
            </Chip>
            {kindsPresent.map((k) => (
              <Chip key={k} on={kindFilter === k} onClick={() => setKindFilter(kindFilter === k ? '' : k)}>
                {(PR_NOTICE_KIND_ICONS[k] ?? '') + ' ' + (PR_NOTICE_KIND_LABELS[k] ?? k)}
              </Chip>
            ))}
            <span style={{ marginInlineStart: 'auto' }}>
              <Btn kind="primary" onClick={() => setForm({ post: null, kind: 'notice' })}>
                ➕ הוספת {termOf(config, 'entity.prPost', 'מודעה')}
              </Btn>
            </span>
          </div>
          {notices.length === 0 && (
            <Empty>{'הלוח ריק — ' + word + ' חדשה נתלית אחרי אישור ה' + gabbai + ', ויורדת לבד אחרי האירוע.'}</Empty>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {notices.map((p) => {
              const help = PR_NOTICE_HELP[p.noticeKind];
              return (
                <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4, ...(p.noticeKind === 'avel' ? { borderTop: '3px solid #111' } : {}) }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12 }}>
                    <span>{(PR_NOTICE_KIND_ICONS[p.noticeKind] ?? '📌') + ' ' + (PR_NOTICE_KIND_LABELS[p.noticeKind] ?? 'הודעה')}</span>
                    {p.pinned && <span>📍 נעוץ</span>}
                    {!p.approved && <span style={{ color: '#a16207', fontWeight: 700 }}>{'ממתין לאישור ה' + gabbai}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenNotice(openNotice === p.id ? null : p.id)}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'start', cursor: 'pointer', fontWeight: 800, fontSize: 15, color: 'inherit' }}
                  >
                    {p.title}
                  </button>
                  {p.text && <div style={{ fontSize: 13, whiteSpace: 'pre-line' }}>{p.text}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12.5 }}>
                    <PlaceLink place={p.place} mapsOn={mapsOn} />
                    {p.time && <span>{'🕒 ' + p.time}</span>}
                    {p.phone && <span dir="ltr">{'☎ ' + p.phone}</span>}
                    {p.until && <span style={{ color: 'var(--ink-faint)' }}>{'יורד ב-' + ddmm(p.until)}</span>}
                  </div>
                  {openNotice === p.id && help && props.onSearch && (
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 4 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{help.title}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                        {help.chips.map((c) => (
                          <Chip key={c} onClick={() => props.onSearch?.(c)}>
                            {'🔎 ' + c}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex' }}>{rowActions(p)}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
            {'כל ' + word + ' עוברת אצל ה' + gabbai + ' לפני שהיא נתלית, ויורדת לבד אחרי האירוע.' + (canApprove && pendingNotices ? ' · ' + pendingNotices + ' ממתינות לאישור שלך' : '')}
          </div>
        </>
      )}

      {active === 'edit' && (
        <>
          <section className="card">
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>📍 מיקום הזמנים</h2>
            <ZmanimLocationEditor />
          </section>
          {(['minyan', 'event', 'emergency'] as const).map((k) => {
            const items = posts.filter((p) => p.kind === k).sort((a, b) => a.title.localeCompare(b.title, 'he'));
            return (
              <section key={k} className="card" style={PANEL}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800 }}>{PR_POST_KIND_LABELS[k] + ' (' + items.length + ')'}</h2>
                  <span style={{ marginInlineStart: 'auto' }}>
                    <Btn sm kind="primary" onClick={() => setForm({ post: null, kind: k })}>
                      {'➕ ' + PR_POST_KIND_LABELS[k].replace(/^\S+\s/, '')}
                    </Btn>
                  </span>
                </div>
                {k === 'emergency' && items.length === 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                    {'מוצגים מספרי ברירת-המחדל (' + board.emergency.map((e) => e.label + ' ' + e.phone).join(' · ') + '). '}
                    <Btn sm onClick={seedEmergency}>
                      ✎ עריכה — יצירת רשומות מברירת-המחדל
                    </Btn>
                  </div>
                )}
                {items.map((p) => (
                  <div key={p.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, borderBottom: '1px dotted var(--line)', padding: '3px 0' }}>
                    <b>{p.title}</b>
                    <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
                      {(k === 'minyan' ? p.prayers.map((x) => x.prayer + ' ' + x.times.join('/')).join(' · ') : k === 'emergency' ? p.phone : [p.date ? ddmm(p.date) : '', p.time].filter(Boolean).join(' · ')) + status(p)}
                    </span>
                    {rowActions(p)}
                  </div>
                ))}
              </section>
            );
          })}
        </>
      )}

      {form && <PostForm post={form.post} kind={form.kind} onClose={() => setForm(null)} />}
    </div>
  );
}
