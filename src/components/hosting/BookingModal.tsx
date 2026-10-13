/**
 * 🏡 כרטיס-הזמנה (resModal של המקור) — חדשה: אורח, יחידה, חדרים (יחידה משותפת), תאריכים, מבוגרים/ילדים, תיק-מחיר חי
 * (לינה · דמי ניקיון · מע״מ · סה״כ), אזהרת-התנגשות / מיטות-פנויות; ⬆ יחידה חסומה נחסמת (F1) ואזהרת צ׳ק-אין/אאוט
 * בשבת/יו״ט. קיימת: סטטוס+לילות+חדרים, עריכה (יחידה נעולה), 📋 תיק-שהייה (חיובים/תשלומים/יתרה), ⬆ 💳 קישור-סליקה
 * ליתרה (הרחבת-תשלומים), ארוחות משויכות; 💾 שמור · אשר · צ׳ק-אין · צ׳ק-אאוט · ＋ תשלום (גם אחרי עזיבה — F6) · בטל ·
 * 🗑 מחק (hosting.delete). התיק = פנקס-שהייה — **לא קבלה**.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { payLink } from '../../lib/payLink';
import { isoToday } from '../../lib/date-util';
import { useHostData, useHostEnv } from './hooks';
import { FInput, FSelect, HModal, Pill, clickable, h, useHostUi } from './hui';
import {
  addDaysIso,
  arrivalWarnings,
  bookBeds,
  bookingBalance,
  bookingParty,
  checkAvailability,
  fmtDM,
  mealTotal,
  money,
  nightsBetween,
  priceQuote,
  roomsLabel,
  unitHasRooms,
} from './lib';
import { KO_ST, RES_ST } from './labels';
import { StayShabbat } from './SwitchPanels';

export function BookingDialog(props: { id: string | null; pre?: { unitId?: string; checkIn?: string } }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const upsert = useApp((s) => s.upsertHostBooking);
  const setStatus = useApp((s) => s.setHostBookingStatus);
  const del = useApp((s) => s.deleteHostBooking);
  const toast = useApp((s) => s.toast);
  const b = props.id ? d.bookingOf(props.id) : undefined;
  const isNew = !b;
  const t = env.terms;

  const [form, setForm] = useState(() => {
    if (b) return { guestId: b.guestId, unitId: b.unitId, roomIds: b.roomIds, checkIn: b.checkIn, checkOut: b.checkOut, adults: String(b.adults), kids: String(b.kids), notes: b.notes };
    const inD = props.pre?.checkIn || isoToday();
    return {
      guestId: d.guests[0]?.id ?? '',
      unitId: props.pre?.unitId || d.units[0]?.id || '',
      roomIds: [] as string[],
      checkIn: inD,
      checkOut: addDaysIso(inD, 2),
      adults: '2',
      kids: '0',
      notes: '',
    };
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const u = d.unitOf(form.unitId);
  const roomed = unitHasRooms(u);
  const nights = nightsBetween(form.checkIn, form.checkOut);
  const check = useMemo(() => {
    if (!u || nights <= 0) return null;
    const rooms = isNew ? form.roomIds : b && b.roomIds.length ? b.roomIds : roomed ? u.subRooms.map((r) => r.id) : [];
    if (roomed && isNew && !form.roomIds.length) return null;
    // עריכה בלי שינוי-תאריכים ביחידה שנחסמה — מותרת (כמו ה-store)
    const sameDates = !!b && b.checkIn === form.checkIn && b.checkOut === form.checkOut;
    return checkAvailability(d.bookings, sameDates && u.status === 'blocked' ? { ...u, status: 'free' } : u, form.checkIn, form.checkOut, rooms, b?.id ?? null);
  }, [u, nights, isNew, form.roomIds, form.checkIn, form.checkOut, b, roomed, d.bookings]);
  const quote = u && nights > 0 ? priceQuote(u, isNew ? form.roomIds : (b?.roomIds ?? []), form.checkIn, form.checkOut, d.settings) : null;
  const warns = nights > 0 ? arrivalWarnings(form.checkIn, form.checkOut) : [];

  if (props.id && !b) {
    return (
      <HModal title={'כרטיס ' + t.booking} onClose={ui.close}>
        <div className="h-empty">ה{t.booking} לא נמצאה (נמחקה?)</div>
      </HModal>
    );
  }

  function save() {
    const base = {
      ...(b ?? { id: '', status: 'pending' as const, charges: [], payments: [], shabbat: false, createdAt: '', updatedAt: '' }),
      guestId: form.guestId,
      unitId: form.unitId,
      roomIds: form.roomIds,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: Number(form.adults),
      kids: Number(form.kids),
      notes: form.notes,
    };
    const r = upsert(base);
    if (!r.ok || !r.booking) return;
    ui.close();
    if (isNew) toast(t.booking + ' נוצרה ✓');
    else toast('נשמר ✓' + (r.mealsSynced ? ' · ' + r.mealsSynced + ' ארוחות סונכרנו ל-' + bookingParty(r.booking) + ' סועדים' : ''));
  }
  function status(s: 'confirmed' | 'in' | 'done') {
    if (!b) return;
    if (setStatus(b.id, s)) ui.close();
  }

  const unitOpts = d.units.map((x) => [x.id, x.name + ' (' + money(x.rate) + ')'] as const);
  const guestOpts = d.guests.map((g) => [g.id, g.name] as const);
  const meals = b ? d.meals.filter((m) => m.bookingId === b.id && m.status !== 'cancelled') : [];
  const bal = b ? bookingBalance(b) : 0;
  const pay = b && env.payUrl && bal > 0 ? payLink(env.payUrl, bal, d.guestName(b.guestId)) : null;
  const st = b ? RES_ST[b.status] : null;
  const rl = b ? roomsLabel(u, b.roomIds) : '';
  const unitWord = t.unit;

  const footer = isNew ? (
    <>
      <button type="button" className={h('btn')} onClick={save}>
        צור {t.booking}
      </button>
      <button type="button" className={h('btn ghost')} onClick={ui.close}>
        ביטול
      </button>
    </>
  ) : (
    <>
      <button type="button" className={h('btn')} onClick={save}>
        💾 שמור
      </button>
      {b!.status === 'pending' && (
        <button type="button" className={h('btn')} onClick={() => status('confirmed')}>
          אשר {t.booking}
        </button>
      )}
      {b!.status === 'confirmed' && (
        <button type="button" className={h('btn')} onClick={() => status('in')}>
          צ׳ק-אין ←
        </button>
      )}
      {b!.status === 'in' && (
        <button type="button" className={h('btn warnb')} onClick={() => status('done')}>
          צ׳ק-אאוט ←
        </button>
      )}
      {b!.status !== 'cancelled' && (
        <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'pay', id: b!.id })}>
          ＋ תשלום
        </button>
      )}
      {b!.status !== 'cancelled' && b!.status !== 'done' && (
        <button
          type="button"
          className={h('btn ghost danger')}
          onClick={() =>
            ui.confirm(
              'לבטל את ה' + t.booking + '? (הנתונים נשמרים)',
              () => {
                if (setStatus(b!.id, 'cancelled')) ui.close();
              },
              'ביטול ' + t.booking,
            )
          }
        >
          בטל
        </button>
      )}
      {env.canDelete && (
        <button
          type="button"
          className={h('btn ghost danger')}
          onClick={() =>
            ui.confirm('למחוק את ה' + t.booking + ' לצמיתות? הפעולה אינה הפיכה (לשמירת היסטוריה — השתמשו ב"בטל").', () => {
              if (del(b!.id)) {
                ui.close();
                toast('ה' + t.booking + ' נמחקה');
              }
            })
          }
        >
          🗑 מחק
        </button>
      )}
    </>
  );

  return (
    <HModal title={isNew ? t.booking + ' חדשה' : 'כרטיס ' + t.booking + ' · ' + d.guestName(b!.guestId)} onClose={ui.close} footer={footer}>
      {b && st && (
        <>
          <div className="h-detailgrid">
            <div className="h-dt">
              <div className="h-l">סטטוס</div>
              <div className="h-v">
                <Pill cls={st[1]} color={st[2]}>
                  {st[0]}
                </Pill>
              </div>
            </div>
            <div className="h-dt">
              <div className="h-l">לילות</div>
              <div className="h-v">{nightsBetween(b.checkIn, b.checkOut)}</div>
            </div>
          </div>
          {rl && (
            <div className="h-dt" style={{ marginBottom: 10 }}>
              <div className="h-l">🚪 חדרים</div>
              <div className="h-v" style={{ fontSize: 13 }}>
                {rl}
              </div>
            </div>
          )}
          {u?.status === 'blocked' && <div className="h-warnbox">⚠ ה{unitWord} חסומה כרגע (תקלה או חסימה ידנית)</div>}
        </>
      )}
      {check && !check.ok && check.reason === 'clash' && (
        <div className="h-warnbox">⚠ התנגשות! {roomed ? 'החדרים שנבחרו תפוסים' : 'ה' + unitWord + ' תפוסה'} בתאריכים אלה</div>
      )}
      {check && !check.ok && check.reason === 'blocked' && <div className="h-warnbox">⚠ ה{unitWord} חסומה (תקלה או חסימה ידנית) — שחררו אותה לפני הזמנה</div>}
      {isNew && check?.ok && roomed && u && <div className="h-okbox">✓ {bookBeds(u, form.roomIds)} מיטות פנויות — משפחות נוספות יכולות לחלוק חדרים אחרים</div>}
      {isNew && roomed && !form.roomIds.length && nights > 0 && <div className="h-warnbox">בחרו לפחות חדר אחד</div>}
      {warns.length > 0 && <div className="h-okbox" style={{ color: 'var(--h-violet)', background: 'color-mix(in srgb,var(--h-violet) 12%,transparent)', borderColor: 'var(--h-violet)' }}>🕯️ {warns.join(' · ')}</div>}
      {b && <StayShabbat b={b} />}
      <FSelect label={t.guest} value={form.guestId} onChange={(v) => set({ guestId: v })} options={guestOpts} />
      <FSelect label={unitWord} value={form.unitId} disabled={!isNew} onChange={(v) => set({ unitId: v, roomIds: [] })} options={unitOpts} />
      {isNew && roomed && u && (
        <div className="h-field">
          <label>🚪 בחירת חדרים · שיתוף לפי חדרים</label>
          <div style={{ border: '1px solid var(--h-line)', borderRadius: 9, padding: '8px 11px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {u.subRooms.map((rm) => (
              <label key={rm.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 2px', margin: 0, fontWeight: 400, color: 'var(--h-ink)' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={form.roomIds.includes(rm.id)}
                  onChange={(e) => set({ roomIds: e.target.checked ? [...form.roomIds, rm.id] : form.roomIds.filter((x) => x !== rm.id) })}
                />
                {rm.name}{' '}
                <span style={{ color: 'var(--h-dim)' }}>
                  ({rm.beds} מיטות · {money(rm.rate)}/לילה)
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="h-frow">
        <FInput label="צ׳ק-אין" type="date" value={form.checkIn} onChange={(v) => set({ checkIn: v })} />
        <FInput label="צ׳ק-אאוט" type="date" value={form.checkOut} onChange={(v) => set({ checkOut: v })} />
      </div>
      <div className="h-frow">
        <FInput label="מבוגרים" type="number" min={1} value={form.adults} onChange={(v) => set({ adults: v })} />
        <FInput label="ילדים" type="number" min={0} value={form.kids} onChange={(v) => set({ kids: v })} />
      </div>
      {isNew && (
        <>
          {nights <= 0 ? (
            <div className="h-warnbox">תאריך יציאה חייב להיות אחרי הכניסה</div>
          ) : (
            quote &&
            (!roomed || form.roomIds.length > 0) && (
              <div className="h-folio">
                <div className="h-fr">
                  <span>{quote.stayLabel}</span>
                  <b className="h-mono">{money(quote.stay)}</b>
                </div>
                <div className="h-fr">
                  <span>דמי ניקיון</span>
                  <b className="h-mono">{money(quote.cleaning)}</b>
                </div>
                <div className="h-fr">
                  <span>מע״מ {quote.taxPct}%</span>
                  <b className="h-mono">{money(quote.tax)}</b>
                </div>
                <div className="h-fr h-tot">
                  <span>סה״כ</span>
                  <b className="h-mono">{money(quote.total)}</b>
                </div>
              </div>
            )
          )}
        </>
      )}
      {b && (
        <>
          <div style={{ fontWeight: 800, fontSize: 13, margin: '14px 0 6px' }}>📋 תיק שהייה</div>
          <div className="h-folio">
            {b.charges.map((c) => (
              <div key={c.id} className="h-fr">
                <span>{c.label}</span>
                <b className="h-mono">{money(c.amount)}</b>
              </div>
            ))}
            {b.payments.map((p) => (
              <div key={p.id} className="h-fr h-pay">
                <span>
                  תשלום · {p.note} ({fmtDM(p.date)})
                </span>
                <b className="h-mono">− {money(p.amount)}</b>
              </div>
            ))}
            <div className="h-fr h-tot">
              <span>יתרה לתשלום</span>
              <b className="h-mono" style={{ color: bal > 0 ? 'var(--h-crit)' : 'var(--h-good)' }}>
                {money(bal)}
              </b>
            </div>
          </div>
          {pay && (
            <a className={h('btn ghost sm')} href={pay} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', textDecoration: 'none' }}>
              💳 קישור-סליקה ליתרה ({money(bal)})
            </a>
          )}
          <div className="h-hint">תיק-השהייה הוא פנקס חיובים/תשלומים — לא קבלה.</div>
          {env.on.kitchen && (
            <>
              <div style={{ fontWeight: 800, fontSize: 13, margin: '14px 0 6px' }}>🍳 ארוחות מטבח משויכות ({meals.length})</div>
              {meals.length ? (
                <div className="h-folio">
                  {meals.map((m) => (
                    <div key={m.id} className="h-fr" style={{ cursor: 'pointer', alignItems: 'center' }} {...clickable(() => ui.open({ k: 'meal', id: m.id }))}>
                      <span>
                        🍽️ <b>{m.mealName || 'ארוחה'}</b>{' '}
                        <span style={{ color: 'var(--h-dim)', fontSize: 12 }}>
                          · {m.date ? fmtDM(m.date) : '—'} · {m.dinerCount} סועדים · {m.items.length} מנות ·{' '}
                          <span style={{ color: KO_ST[m.status][1] }}>{KO_ST[m.status][0]}</span>
                        </span>
                      </span>
                      <b className="h-mono">{money(mealTotal(m))}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-hint" style={{ margin: '0 0 8px' }}>
                  אין ארוחות משויכות עדיין — הזמנת-מטבח שתשויכו כאן תחייב אוטומטית את תיק-השהייה.
                </div>
              )}
              {b.status !== 'cancelled' && (
                <button
                  type="button"
                  className={h('btn ghost sm')}
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    if (!d.dishes.length) {
                      toast('הוסיפו מנות לתפריט קודם');
                      ui.open({ k: 'menu' });
                      return;
                    }
                    ui.open({ k: 'meal', id: null, bookingId: b.id });
                  }}
                >
                  🍳 הוסף ארוחה ל{t.booking} זו
                </button>
              )}
            </>
          )}
        </>
      )}
    </HModal>
  );
}

/** רישום תשלום (payModal) — סכום = היתרה, הערה; אחרי הרישום חוזרים לכרטיס. */
export function PayDialog(props: { id: string }) {
  const d = useHostData();
  const ui = useHostUi();
  const addPay = useApp((s) => s.addHostPayment);
  const b = d.bookingOf(props.id);
  const [amt, setAmt] = useState(() => String(Math.max(0, b ? bookingBalance(b) : 0)));
  const [note, setNote] = useState('');
  if (!b) return null;
  function save() {
    if (addPay(props.id, { amount: Number(amt), note })) ui.open({ k: 'booking', id: props.id });
  }
  return (
    <HModal
      title="רישום תשלום"
      onClose={() => ui.open({ k: 'booking', id: props.id })}
      footer={
        <button type="button" className={h('btn')} onClick={save}>
          רשום תשלום
        </button>
      }
    >
      <FInput label={'סכום התשלום (יתרה: ' + money(bookingBalance(b)) + ')'} type="number" value={amt} onChange={setAmt} />
      <FInput label="הערה" value={note} onChange={setNote} placeholder="מזומן / אשראי / העברה" />
      <div className="h-hint">רישום בפנקס-השהייה בלבד — לא קבלה.</div>
    </HModal>
  );
}
