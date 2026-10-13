/**
 * 📒 פרנסה׳לע — "לוח הקהילה" של המקור (עיצוב 5, renderLuach): קיר בית-מדרש מעץ אגוז עם מנורת-נחושת, "בית המדרש ·
 * {שם}", "לוח הקהילה", ומתג "לוח הזמנים | לוח המודעות" (זכור).
 *   · לוח הזמנים — הכתר, "זמני היום", התאריך העברי והלועזי, שעון-הדפים, "לפי אופק …"; נורות "המניין הבא" עם
 *     הספירה; לוחיות-הנחושת של זמני-היום (עבר מעומעם, הבא מסומן); "מניינים בשכונה" (שבבים: עבר / הבא); "שבת
 *     קודש" (בשבת — הנוכחית); "בקהילה השבוע". כשאין — הדוגמאות של המקור "(דוגמה)".
 *   · לוח המודעות — לבד ירוק במסגרת נחושת, השלט, סינון לפי סוג, הפתקים לפי סוג (נעיצה/סלוטייפ, "ממתין לאישור
 *     הגבאי"), הפתק הפתוח ("מי בקהילה יכול לעזור" ⇒ האלפון; אישור/הורדה), "תליית מודעה" (חסום בשבת).
 * תוספות-הפורט בשפת-המקור: מספרי-חירום, זמני-השבוע, שורת-החסות, "⚙ עריכת הגבאי" (מיקום-הזמנים, בתי-כנסת
 * ומניינים, אירועים, מספרי-חירום — למקור לא היה ממשק), ההגבלה בשבת/חג (closure), התאריך העברי שמתחלף בשקיעה.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, telephonyOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import { mapsSearchUrl } from '../../lib/mapsLink';
import type { PrPost, PrPostKind } from '../../types/domain';
import { Btn } from '../ui';
import { useArmed } from '../useArmed';
import { buildZmanimBoard, dayZmanim, emergencyDrafts, hebDayMonth, locNote, markZmanim, postActiveOn, PR_ZMANIM_NOTE, weekZmanim } from './zmanimBoard';
import { adRotation } from './lib';
import { PostForm } from './PostForm';
import { ZmanimLocationEditor } from './ZmanimLocationEditor';
import { usePrPerms, type PrNow } from './hooks';
import { ddmm, pluralOf, PR_NOTICE_KIND_LABELS, PR_POST_KIND_LABELS } from './labels';
import { LU_EX_EVENTS, LU_EX_SHULS, luachNotes, luachZmanim, minsUntil, noticeFoot, shulRows } from './luach';
import { CrestCrown, FlipClock, LampSvg, NoteCard, NoteOverlay, NoticeForm } from './Luach';
import { cx } from './skin';

type Seg = 'zmanim' | 'notices' | 'edit';

const WD_LONG = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;
const WD_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] as const;

export function BoardTab(props: { now: PrNow; onSearch: ((q: string) => void) | null; toast?: (m: string) => void; calm?: boolean }) {
  const config = useApp((s) => s.config);
  const posts = useApp((s) => s.db.prPosts);
  const ads = useApp((s) => s.db.prAds);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const setPrStatus = useApp((s) => s.setPrStatus);
  const deletePrPost = useApp((s) => s.deletePrPost);
  const upsertPrPost = useApp((s) => s.upsertPrPost);
  const orbitToast = useApp((s) => s.toast);
  const toast = props.toast ?? orbitToast;
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const zmanimOn = featureOn(config, 'parnasa.zmanim');
  const [seg, setSeg] = useRemembered<Seg>('parnasa.board.seg', zmanimOn ? 'zmanim' : 'notices');
  const [kindFilter, setKindFilter] = useRemembered<string>('parnasa.board.kind', '');
  const [week, setWeek] = useRemembered<boolean>('parnasa.board.week', false);
  const [form, setForm] = useState<{ post: PrPost | null; kind: PrPostKind } | null>(null);
  const [noticeForm, setNoticeForm] = useState<{ post: PrPost | null } | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);

  const { now } = props;
  const today = now.todayIso;
  // בלי מניינים אמיתיים — בתי-הכנסת לדוגמה של המקור (גם "המניין הבא" מחושב מהם)
  const exShuls = !posts.some((p) => p.kind === 'minyan' && postActiveOn(p, today));
  const board = useMemo(() => buildZmanimBoard(now.clock, now.loc, exShuls ? [...posts, ...LU_EX_SHULS] : posts), [now.clock, now.loc, posts, exShuls]);
  const weekRows = useMemo(() => (week ? weekZmanim(now.clock.iso, now.loc, 7) : []), [week, now.clock.iso, now.loc]);
  // 12 הלוחיות של המקור: זמני-המנוע + "זמן ציצית ותפילין · משיכיר" (רק בלוח)
  const plates = useMemo(() => markZmanim(luachZmanim(dayZmanim(now.clock.iso, now.loc), now.clock.iso, now.loc), now.clock), [now.clock, now.loc]);

  const word = termOf(config, 'entity.prPost', 'מודעה');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const mapsOn = integrationOn(config, 'maps');
  const telOn = telephonyOn(config);
  const active: Seg = seg === 'zmanim' && !zmanimOn ? 'notices' : seg === 'edit' && !canApprove ? 'notices' : seg;
  // שורת-החסות של הלוח — התורנית של היום (סבב-יומי מהמנוע); רק כשמשבצות-הפרסום דלוקות
  const sponsor = featureOn(config, 'parnasa.ads') ? adRotation(ads, 'board', today).today : null;

  const notes = luachNotes(posts, today, canApprove);
  const used = [...new Set(notes.xs.map((n) => n.k).filter((k) => PR_NOTICE_KIND_LABELS[k]))];
  const filt = kindFilter && used.includes(kindFilter) ? kindFilter : '';
  const pendingNotices = posts.filter((p) => p.kind === 'notice' && !p.approved && (!p.until || p.until >= today)).length;
  const eventsWeek = posts
    .filter((p) => p.kind === 'event' && postActiveOn(p, today) && (!p.date || p.date >= today))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title, 'he'));
  const exEvents = !eventsWeek.length;
  const shuls = shulRows(
    board.minyanim,
    board.nextMinyan,
    now.clock.hhmm,
    (exShuls ? [...posts, ...LU_EX_SHULS] : posts).filter((p) => p.kind === 'minyan').map((p) => p.id),
  );
  const nm = board.nextMinyan;
  const nz = plates.find((z) => z.next) ?? null;
  const left = nm ? minsUntil(nm.time, now.clock.hhmm) : null;
  const night = board.hebDate.night;
  const hd = (night ? 'ליל ' + WD_LONG[(now.clock.dow + 1) % 7] : 'יום ' + WD_LONG[now.clock.dow]) + ', ' + board.hebDate.text;
  const gd = new Date(now.clock.iso + 'T12:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const customLoc = !!(prefs?.zmanim && (prefs.zmanim.city || prefs.zmanim.lat !== undefined));
  const openN = openNote !== null ? notes.xs.findIndex((n) => n.id === openNote) : -1;

  function decide(p: PrPost, status: 'approved' | 'rejected'): void {
    if (setPrStatus('post', p.id, status)) toast(status === 'approved' ? 'נתלה בלוח' : 'ירד מהלוח');
  }
  function remove(p: PrPost): void {
    if (!confirmTwice('prp-' + p.id, 'למחוק את "' + p.title + '"?')) {
      toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
      return;
    }
    if (deletePrPost(p.id)) toast('נמחק');
  }
  function seedEmergency(): void {
    let n = 0;
    for (const d of emergencyDrafts()) {
      const res = upsertPrPost({ id: '', kind: 'emergency', title: d.title, text: d.text, place: '', phone: d.phone, noticeKind: '', prayers: [], days: [], date: '', time: '', until: '', approved: false, pinned: false, createdAt: '', updatedAt: '' });
      if (res.ok) n++;
    }
    toast(n + ' מספרי-חירום נוצרו לעריכה');
  }
  function addNotice(): void {
    // שבת קודש — "אפשר לתלות מודעה במוצאי שבת" (luForm במקור)
    if (props.calm) return toast('שבת קודש. אפשר לתלות ' + word + ' במוצאי שבת');
    setNoticeForm({ post: null });
  }

  /** שורת-ניהול לפריט בעריכת-הגבאי (עריכה / אישור / הורדה / מחיקה). */
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
  const place = (s: string) => {
    const url = mapsOn && s ? mapsSearchUrl(s) : null;
    return url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" title="פתיחה במפות">
        {s}
      </a>
    ) : (
      s
    );
  };

  return (
    <div className="pn-luwrap">
      <div className="pn-luHost pl">
        <div className="pl-lw">
          <div className="pl-wrap">
            <header className="pl-top">
              <LampSvg />
              <span className="pl-lightcone" aria-hidden="true" />
              <span className="pl-k">{'בית המדרש · ' + termOf(config, 'nav.parnasa', 'פרנסה׳לע')}</span>
              <h1>לוח הקהילה</h1>
              <p>הזמנים, המניינים, והמודעות של השכונה, במקום אחד</p>
              {zmanimOn ? (
                <div className="pl-seg" role="tablist" aria-label="לוח">
                  <button role="tab" type="button" id="pl-tZ" aria-selected={active === 'zmanim'} aria-controls="pl-pZ" onClick={() => setSeg('zmanim')}>
                    לוח הזמנים
                  </button>
                  <button role="tab" type="button" id="pl-tN" aria-selected={active === 'notices'} aria-controls="pl-pN" onClick={() => setSeg('notices')}>
                    {'לוח ה' + pluralOf(word) + (canApprove && pendingNotices ? ' (' + pendingNotices + ')' : '')}
                  </button>
                </div>
              ) : null}
              {canApprove ? (
                <button className="pl-gab" type="button" aria-pressed={active === 'edit'} onClick={() => setSeg(active === 'edit' ? (zmanimOn ? 'zmanim' : 'notices') : 'edit')}>
                  {'⚙ עריכת ה' + gabbai}
                </button>
              ) : null}
              {sponsor ? (
                <p className="pl-spon">
                  {'📌 הלוח בחסות '}
                  <b>{sponsor.advertiser}</b>
                  {[sponsor.headline, sponsor.phone].filter((x) => x && x.trim()).map((x) => ' · ' + x).join('')}
                </p>
              ) : null}
            </header>

            {active === 'zmanim' ? (
              <section id="pl-pZ" role="tabpanel" aria-labelledby="pl-tZ">
                <div className="pl-board">
                  <div className="pl-crest">
                    <CrestCrown />
                    <h2>זמני היום</h2>
                    <span className="pl-hd">{hd}</span>
                    <span className="pl-gd">{gd + (board.dayName ? ' · ' + board.dayName : '')}</span>
                    <FlipClock hhmm={now.clock.hhmm} />
                    <span className="pl-gd">{locNote(now.loc) + (customLoc ? '' : ' · ה' + gabbai + ' יכול לשנות')}</span>
                    {board.closure.closed ? <span className="pl-gd">{'🕯 ' + board.closure.reason + ' · עד צאת ' + board.closure.endTime}</span> : null}
                  </div>
                  <div className="pl-marq">
                    <div className="pl-next">
                      <span className="pl-bulb" aria-hidden="true" />
                      {nm && left ? (
                        <>
                          <span>
                            <small>המניין הבא</small>
                            <b>{nm.prayer + ' · ' + nm.shul}</b>
                            <small>{nm.time + (nz ? ' · ' + nz.label + (nz.sub ? ' ' + nz.sub : '') + ' ב־' + nz.time : '')}</small>
                          </span>
                          <span className="pl-in">
                            {left.n}
                            <small>{left.unit}</small>
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            <b>אין עוד מניינים היום</b>
                            <small>{nz ? nz.label + ' ב־' + nz.time : ''}</small>
                          </span>
                          <span />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="pl-cols">
                    <div className="pl-panel">
                      <h3>זמני היום</h3>
                      <div className="pl-zl">
                        {plates.map((z) => (
                          <div key={z.key} className={cx('pl-z', z.past && 'pl-past', z.next && 'pl-now')}>
                            <span className="pl-n">
                              {z.label}
                              {z.sub ? <small>{z.sub}</small> : null}
                            </span>
                            <span className="pl-t">{z.time || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pl-panel">
                      <h3>מניינים בשכונה</h3>
                      <div className="pl-mn">
                        {shuls.map((s) => (
                          <div key={s.id} className="pl-shul">
                            <div className="pl-sh">
                              <b>{s.shul}</b>
                              <small>
                                {place(s.place)}
                                {exShuls ? ' (דוגמה)' : ''}
                              </small>
                            </div>
                            <div className="pl-tf">
                              {s.prayers.map((p) => [
                                <span key={'n' + p.prayer}>{p.prayer}</span>,
                                <div key={'t' + p.prayer}>
                                  {p.times.map((t, i) => (
                                    <b key={i} className={cx('pl-chip', t.past && 'pl-past', t.next && 'pl-nx')}>
                                      {t.time}
                                    </b>
                                  ))}
                                </div>,
                              ])}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pl-panel pl-shab">
                      <h3>שבת קודש</h3>
                      <div className="pl-parsha">
                        <small>{board.shabbat.current ? 'השבת' : 'השבת הקרובה'}</small>
                        <b>{board.shabbat.holiday || 'שבת קודש'}</b>
                        <span>{hebDayMonth(board.shabbat.satIso, now.loc.tz) + (board.shabbat.mevarchim ? ' · שבת מברכים' : '')}</span>
                      </div>
                      <div className="pl-zl">
                        {(
                          [
                            ['הדלקת נרות', board.shabbat.candle, 'ערש״ק'],
                            ['צאת השבת', board.shabbat.end, ''],
                            ['רבנו תם', board.shabbat.rabbeinuTam, ''],
                          ] as const
                        ).map(([l, t, s]) => (
                          <div key={l} className="pl-z">
                            <span className="pl-n">
                              {l}
                              {s ? <small>{s}</small> : null}
                            </span>
                            <span className="pl-t">{t || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pl-panel">
                      <h3>בקהילה השבוע</h3>
                      <div className="pl-ev">
                        {exEvents
                          ? LU_EX_EVENTS.map((e) => (
                              <div key={e.t} className="pl-e">
                                <span className="pl-d">
                                  <b>{e.d.split(' ')[0]}</b>
                                  <small>{e.d.split(' ').slice(1).join(' ')}</small>
                                </span>
                                <span className="pl-x">
                                  <b>{e.t}</b>
                                  <small>{e.s + ' (דוגמה)'}</small>
                                </span>
                              </div>
                            ))
                          : eventsWeek.map((e) => (
                              <div key={e.id} className="pl-e">
                                <span className="pl-d">
                                  <b>{e.date ? WD_SHORT[new Date(e.date + 'T12:00:00').getDay()] : '·'}</b>
                                  <small>{e.date ? ddmm(e.date) : ''}</small>
                                </span>
                                <span className="pl-x">
                                  <b>{e.title}</b>
                                  <small>
                                    {[e.time, e.text].filter(Boolean).join(' · ')}
                                    {e.place ? (
                                      <>
                                        {e.time || e.text ? ' · ' : ''}
                                        {place(e.place)}
                                      </>
                                    ) : null}
                                  </small>
                                </span>
                              </div>
                            ))}
                      </div>
                    </div>
                    <div className="pl-panel pl-emg">
                      <h3>מספרי חירום</h3>
                      <div className="pl-zl">
                        {board.emergency.map((e) => (
                          <div key={e.label + e.phone} className="pl-z">
                            <span className="pl-n">
                              {e.label}
                              {e.note ? <small>{e.note}</small> : null}
                            </span>
                            <span className="pl-t">{telOn ? <a href={'tel:' + e.phone.replace(/[^\d+*#]/g, '')}>{e.phone}</a> : e.phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pl-wk">
                    <button type="button" aria-pressed={week} onClick={() => setWeek(!week)}>
                      זמני השבוע
                    </button>
                  </div>
                  {week ? (
                    <div className="pl-panel pl-week">
                      <h3>זמני השבוע</h3>
                      <div className="pl-tblw">
                        <table className="pl-tbl">
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
                                <td>{r.alot}</td>
                                <td>{r.sunrise}</td>
                                <td>{r.shmaGra}</td>
                                <td>{r.chatzot}</td>
                                <td>{r.sunset}</td>
                                <td>{r.tzeis}</td>
                                <td>{[r.candle ? 'הדלקה ' + r.candle : '', r.end ? (r.dow === 6 ? 'צאת השבת ' : 'צאת החג ') + r.end : '', r.holiday].filter(Boolean).join(' · ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {active === 'notices' ? (
              <section id="pl-pN" role="tabpanel" aria-labelledby="pl-tN">
                <div className="pl-nb">
                  <div className="pl-felt">
                    <div className="pl-plaque">{'לוח ה' + pluralOf(word) + ' · קהילת השכונה'}</div>
                    <div className="pl-filters" role="group" aria-label={'סוג ' + word}>
                      <button type="button" aria-pressed={!filt} onClick={() => setKindFilter('')}>
                        הכול
                      </button>
                      {used.map((k) => (
                        <button key={k} type="button" aria-pressed={filt === k} onClick={() => setKindFilter(k)}>
                          {PR_NOTICE_KIND_LABELS[k]}
                        </button>
                      ))}
                    </div>
                    <div className="pl-notes">
                      {notes.ex ? <p className="pl-exb">{'כך ייראה הלוח. אלה ' + pluralOf(word) + ' לדוגמה, עד שתיתלה ה' + word + ' הראשונה'}</p> : null}
                      {notes.xs.map((n, i) => (!filt || n.k === filt ? <NoteCard key={n.id} n={n} i={i} gabbai={gabbai} onOpen={() => setOpenNote(n.id)} /> : null))}
                    </div>
                  </div>
                  <button className="pl-add" type="button" onClick={addNotice}>
                    ➕ הוספת {termOf(config, 'entity.prPost', 'מודעה')}
                  </button>
                </div>
                <p className="pl-foot" style={{ marginTop: 40 }}>
                  {noticeFoot(pendingNotices, canApprove, gabbai, word)}
                </p>
              </section>
            ) : null}

            {active === 'edit' ? (
              <section className="pl-edit pn-orbit" aria-label={'עריכת ה' + gabbai}>
                <section className="card">
                  <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>📍 מיקום הזמנים</h2>
                  <ZmanimLocationEditor />
                </section>
                {(['minyan', 'event', 'emergency'] as const).map((k) => {
                  const items = posts.filter((p) => p.kind === k).sort((a, b) => a.title.localeCompare(b.title, 'he'));
                  return (
                    <section key={k} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
              </section>
            ) : null}

            <p className="pl-foot">{(exShuls || exEvents ? 'המניינים והאירועים כאן לדוגמה. ה' + gabbai + ' מעדכן אותם ב״עריכת ה' + gabbai + '״. ' : '') + PR_ZMANIM_NOTE}</p>
          </div>
        </div>
      </div>
      {openN >= 0 ? (
        <NoteOverlay
          n={notes.xs[openN]}
          i={openN}
          toast={toast}
          onClose={() => setOpenNote(null)}
          onSearch={props.onSearch}
          onEdit={(p) => {
            setOpenNote(null);
            setNoticeForm({ post: p });
          }}
        />
      ) : null}
      {noticeForm ? <NoticeForm base={noticeForm.post} todayIso={today} toast={toast} onClose={() => setNoticeForm(null)} /> : null}
      {form ? <PostForm post={form.post} kind={form.kind} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
