/**
 * חייגן-מונחה (assisted dialer) — קמפיין-שיחות downstream על הטלפונים הקיימים:
 * המערכת מציגה תומך-אחר-תומך, לוחצים 📞 (הטלפון מחייג דרך tel:), מסמנים תוצאה
 * (תרם / לא-ענה / סירב / חזרה / טופל / דלג) — והמערכת מתקדמת, מחזירה-לתור את
 * מי-שלא-ענה, וקובעת "לדבר שוב" ל-callback. מנוע: lib/dialer; נהג: telephony/driver
 * (כרגע ידני; קופסת-GSM עתידית = החלפת-נהג). כל התוויות דרך termOf.
 *
 * שדרוג 20.8 ("תתקן הכל"): 💰 תרם/ה פותח את מודאל-התרומה (קבלה רציפה!) ·
 * מקלדת 1–6 · שם-לחיץ ⇒ כרטיס-מלא · הקשר הו"ק/הערות · וואטסאפ-מתובנת ·
 * חזרה+תזכורת-בלוח · ⬇ סיכום-CSV · ↩ ביטול-אחרון.
 *
 * סבב ב׳ (20.8): 🕯 שמות-לטיפול תוך-שיחה (ayinAddName) + קידום-שלב (ayinAdvance) ·
 * ✎ עריכת-פרטים (SupporterForm בהחלפה) · 💳 קישור-תשלום + שליחה-בוואטסאפ (wa.paylink).
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf, integrationOn, integrationSetting } from '../../lib/config';
import { campaignCsvRows, currentId, progress } from '../../lib/dialer';
import { renderTemplate } from '../../lib/templates';
import { activeDriver } from '../../lib/telephony/driver';
import { downloadCsv, type Cell } from '../../lib/csvx';
import { payLink } from '../../lib/payLink';
import type { DialOutcome } from '../../types/domain';
import { Modal, Btn, Empty } from '../ui';
import { WaBtn } from '../WaBtn';
import { CallBtn } from '../CallBtn';
import { HebDateInput } from '../HebDateInput';
import { supIls, supLast, supCount, fmtDate, hokRecordedThisMonth, isoToday } from '../supporters/lib';
import { ayinAdvanceLabel, featLabel, itemLabel, stageLabel, unitLabel } from '../../lib/ayin';
import { DonationModal } from '../supporters/DonationModal';
import { SupporterForm } from '../supporters/SupporterForm';

export function DialerModal({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const dialer = useApp((s) => s.db.ui.dialer);
  const supporters = useApp((s) => s.db.supporters);
  const outcome = useApp((s) => s.dialerOutcome);
  const undo = useApp((s) => s.dialerUndo);
  const stop = useApp((s) => s.dialerStop);
  const openSupporterCard = useApp((s) => s.openSupporterCard);
  const toast = useApp((s) => s.toast);
  // סבב ב׳: מעקב-טיפול תוך-שיחה — הוספת-שם וקידום-שלב (אותן פעולות כמו בכרטיס)
  const ayinAddName = useApp((s) => s.ayinAddName);
  const ayinAdvance = useApp((s) => s.ayinAdvance);

  const [note, setNote] = useState('');
  const [cbOpen, setCbOpen] = useState(false);
  const [cbDate, setCbDate] = useState('');
  const [cbRemind, setCbRemind] = useState(false);
  const [armEnd, setArmEnd] = useState(false); // מגן דו-שלבי לסיום (בלי confirm ילידי)
  // 💰 תרם/ה ⇒ מודאל-התרומה; שומרים כמה תרומות היו — סגירה עם תרומה-חדשה = נרשם
  const [donFor, setDonFor] = useState<{ id: string; had: number } | null>(null);
  // ✎ עריכת-פרטים תוך-שיחה — SupporterForm מחליף את החייגן (כמו מודאל-התרומה)
  const [editOpen, setEditOpen] = useState(false);
  // 🕯 פאנל שמות-לטיפול — מתקפל; קלט שם+כמות
  const [namesOpen, setNamesOpen] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [eyesVal, setEyesVal] = useState('');

  const supWord = termOf(config, 'entity.supporter', 'תומך/ת');
  const waOn = integrationOn(config, 'whatsapp');
  const drv = activeDriver();

  const prog = dialer ? progress(dialer) : null;
  const id = dialer ? currentId(dialer) : null;
  const sp = id ? supporters.find((s) => s.id === id) : null;

  const act = (o: DialOutcome, cbIso?: string, alsoReminder?: boolean) => {
    outcome(o, note, cbIso, alsoReminder);
    setNote('');
    setCbOpen(false);
    setCbDate('');
    setCbRemind(false);
  };

  /** 💰 תרם/ה — קודם רושמים את התרומה עצמה (קבלה רציפה), ורק אז מסווגים. */
  const startDonation = () => {
    if (!sp) return;
    setDonFor({ id: sp.id, had: sp.donations.length });
  };
  const closeDonation = () => {
    const cur = donFor;
    setDonFor(null);
    if (!cur) return;
    // התרומה נשמרה בפועל (המונה עלה) ⇒ מסווגים "תרם/ה" ומתקדמים; ביטול ⇒ נשארים
    const fresh = useApp.getState().db.supporters.find((s) => s.id === cur.id);
    if (fresh && fresh.donations.length > cur.had) act('donated');
  };

  // ⌨️ קיצורי-מקלדת 1–6 (20.8) — קמפיין של עשרות שיחות בלי עכבר; לא בזמן הקלדה
  useEffect(() => {
    if (!sp || cbOpen || donFor || editOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      const k = e.key;
      if (k === '1') startDonation();
      else if (k === '2') act('noanswer');
      else if (k === '3') act('refused');
      else if (k === '4') setCbOpen(true);
      else if (k === '5') act('done');
      else if (k === '6') act('skip');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp?.id, cbOpen, !!donFor, editOpen, note]);

  if (!dialer || !prog) {
    return (
      <Modal title="📞 חייגן" onClose={onClose}>
        <Empty>אין קמפיין פעיל — התחילו חייגן מרשימת ה{termOf(config, 'nav.supporters', 'תורמים')}.</Empty>
      </Modal>
    );
  }

  // 💰 בזמן רישום-התרומה — מודאל-התרומה מחליף את החייגן (לא מקנן: שני מודאלים
  // מקוננים היו נאבקים על Escape/מלכודת-Tab); בסגירה חוזרים לחייגן ומסווגים.
  if (donFor) {
    const spDon = supporters.find((s) => s.id === donFor.id);
    if (spDon) return <DonationModal supporter={spDon} onClose={closeDonation} />;
  }
  // ✎ עריכת-פרטים תוך-שיחה — אותה החלפה; בסגירה חוזרים לחייגן (הפרטים כבר מעודכנים)
  if (editOpen && sp) {
    return <SupporterForm supporter={sp} onClose={() => setEditOpen(false)} />;
  }

  const pct = prog.total ? Math.round((prog.finalized / prog.total) * 100) : 0;
  const orgName = config.orgName || 'העמותה';
  const exportCsv = () => {
    const nameOf = (sid: string) => supporters.find((s) => s.id === sid)?.name ?? sid;
    downloadCsv('dialer-' + isoToday() + '.csv', campaignCsvRows(dialer, nameOf) as Cell[][]);
  };

  // סבב ב׳: מעקב-טיפול + קישור-תשלום — מגודרים בדיוק כמו במסכי-התורמים
  const ayinOn = featureOn(config, 'supporters.ayin');
  const donateHref = sp && integrationOn(config, 'payments')
    ? payLink(integrationSetting(config, 'payments', 'payUrl'), 0, sp.name)
    : null;
  const addCareName = () => {
    if (!sp || !nameVal.trim()) return;
    const raw = eyesVal.trim();
    const n = Math.max(0, Math.round(Number(raw)));
    ayinAddName(sp.id, nameVal.trim(), raw !== '' && Number.isFinite(n) ? n : '');
    setNameVal('');
    setEyesVal('');
  };

  return (
    <Modal title={'📞 חייגן ' + termOf(config, 'nav.supporters', 'תורמים')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 'min(400px, 82vw)' }}>
        {/* התקדמות */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 4 }}>
            <span>{prog.finalized} / {prog.total} טופלו</span>
            <span>נותרו {prog.remaining}</span>
          </div>
          <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: 'var(--accent)', transition: 'width .2s' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11.5, marginTop: 6, color: 'var(--ink-soft)' }}>
            <span title="תרמו">💰 {prog.counts.donated}</span>
            <span title="לא ענו (אנשים)">📵 {prog.counts.noanswer}</span>
            <span title="סירבו">🚫 {prog.counts.refused}</span>
            <span title="לחזרה">🔁 {prog.counts.callback}</span>
          </div>
        </div>

        {!sp ? (
          /* סיום הקמפיין */
          <div style={{ textAlign: 'center', padding: '18px 8px' }}>
            <div style={{ fontSize: 34 }} aria-hidden>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>הקמפיין הושלם</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
              {prog.total} {supWord} · 💰 {prog.counts.donated} תרמו · 🔁 {prog.counts.callback} לחזרה
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
              {dialer.log.length > 0 && (
                <Btn onClick={exportCsv} title="הורדת יומן-השיחות המלא כ-CSV — לפני שהקמפיין נמחק">
                  ⬇ סיכום CSV
                </Btn>
              )}
              <Btn kind="primary" onClick={() => { stop(); onClose(); }}>סגירה</Btn>
            </div>
          </div>
        ) : (
          <>
            {/* כרטיס המתקשר הנוכחי */}
            <div style={{ border: '1px solid var(--accent)', borderRadius: 12, padding: 14, background: 'var(--accent-soft, var(--panel))', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* שם-לחיץ (20.8) — פתיחת הכרטיס-המלא; הקמפיין נשמר וממשיכים אחר-כך */}
                  <button
                    type="button"
                    onClick={() => { openSupporterCard(sp.id); onClose(); }}
                    title={'לכרטיס המלא של ' + sp.name + ' (הקמפיין נשמר — "המשך חייגן" מחזיר)'}
                    style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.15, padding: 0, textAlign: 'start', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--line)', textUnderlineOffset: 3 }}
                  >
                    {sp.name}
                  </button>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                    {[sp.cat, sp.forWho].filter(Boolean).join(' · ')}
                    {sp.phone && <span dir="ltr"> · {sp.phone}</span>}
                  </div>
                </div>
                {drv.callHref(sp.phone) && <CallBtn phone={sp.phone} title={'חיוג אל ' + sp.name} />}
                {waOn && sp.phone && (
                  <WaBtn
                    phone={sp.phone}
                    text={renderTemplate(config, 'wa.dialer', { name: sp.name, org: orgName })}
                    title={'וואטסאפ ל' + sp.name + ' (נוסח מוכן — נפתח לעריכה לפני שליחה)'}
                  />
                )}
              </div>
              {/* הקשר-תרומות מהיר */}
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', borderTop: '1px solid var(--line-soft, var(--line))', paddingTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>סה"כ: <b style={{ direction: 'ltr', display: 'inline-block' }}>₪{Math.round(supIls(sp)).toLocaleString('en-US')}</b></span>
                <span>{supCount(sp)} {termOf(config, 'entity.donations', 'תרומות')}</span>
                {supLast(sp) && <span>אחרונה: {fmtDate(supLast(sp))}</span>}
                {sp.ayin && <span>· {stageLabel(config, sp.ayin.stage)}</span>}
              </div>
              {/* הקשר הו"ק (20.8) — בדיוק מה שטלפנית צריכה לפני שהיא מדברת */}
              {sp.hok?.active && (
                <div style={{ fontSize: 12 }}>
                  🔁 הו"ק {sp.hok.cur === '$' ? '$' : '₪'}{sp.hok.amount}/חודש —{' '}
                  {hokRecordedThisMonth(sp, isoToday())
                    ? <span style={{ color: 'var(--green)' }}>נרשמה החודש ✓</span>
                    : <b style={{ color: 'var(--accent-deep, #a05008)' }}>טרם נרשמה החודש</b>}
                </div>
              )}
              {sp.ayin?.nextTalk && (
                <div style={{ fontSize: 12, color: 'var(--accent-deep, #a05008)' }}>🔁 לדבר שוב: {fmtDate(sp.ayin.nextTalk)}</div>
              )}
              {/* הערות-הכרטיס (20.8) — כולל רישומי-שיחות קודמים */}
              {(sp.notes || '').trim() && (
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', whiteSpace: 'pre-line', maxHeight: 72, overflowY: 'auto', borderTop: '1px dashed var(--line-soft, var(--line))', paddingTop: 6 }}>
                  {sp.notes.length > 300 ? '…' + sp.notes.slice(-300) : sp.notes}
                </div>
              )}

              {/* סבב ב׳ (20.8): פעולות תוך-שיחה — שמות-לטיפול · עריכה · קישור-תשלום */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--line-soft, var(--line))', paddingTop: 8 }}>
                {ayinOn && (
                  <Btn sm onClick={() => setNamesOpen((v) => !v)} title={featLabel(config) + ' — רישום ' + itemLabel(config) + ' וקידום-שלב תוך-שיחה'}>
                    🕯 {itemLabel(config)} ({sp.ayin?.names.length ?? 0}) {namesOpen ? '▴' : '▾'}
                  </Btn>
                )}
                <Btn sm onClick={() => setEditOpen(true)} title={'עריכת פרטי ' + sp.name + ' — טלפון/כתובת/יעד-קשר בלי לעזוב את הקמפיין'}>
                  ✎ עריכת פרטים
                </Btn>
                {/* 💳 מסלול-הסליקה: התורם משלם בעצמו אונליין — התשלום נקלט אוטומטית
                    מהסליקה (תשלומים-נכנסים, דדופ-txn). מגן-כפילות (20.8): שימוש בקישור
                    ממלא הערת-שיחה ומזהיר לא לרשום גם "תרם/ה" ידנית — אחרת ירשם פעמיים. */}
                {donateHref && (
                  <span
                    style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
                    onClickCapture={() => {
                      if (!note.trim()) setNote('נשלח קישור-תשלום');
                      toast('💳 הקישור נשלח — לא לרשום "תרם/ה" ידנית; התשלום ייקלט מהסליקה אוטומטית');
                    }}
                  >
                    <a
                      href={donateHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chip"
                      title="התורם משלם בעצמו בעמוד-הסליקה — התשלום ייקלט אוטומטית (לא לרשום גם ידנית)"
                    >
                      💳 עמוד-תרומה
                    </a>
                    {waOn && sp.phone && (
                      <WaBtn
                        phone={sp.phone}
                        text={renderTemplate(config, 'wa.paylink', { name: sp.name, org: orgName, link: donateHref })}
                        title={'שליחת קישור-התשלום בוואטסאפ ל' + sp.name + ' — התשלום ייקלט מהסליקה אוטומטית'}
                      />
                    )}
                  </span>
                )}
              </div>

              {/* הסבר שני-המסלולים — מוצג רק כשיש קישור-תשלום (אחרת אין מה לבלבל) */}
              {donateHref && (
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
                  💰 <b>תרם/ה</b> = הכסף התקבל אצלכם עכשיו (מזומן/העברה/אשראי) — רישום + קבלה מיד ·{' '}
                  💳 <b>עמוד-תרומה</b> = התורם משלם אונליין בעצמו — נקלט מהסליקה אוטומטית, בלי רישום ידני
                </div>
              )}

              {/* 🕯 פאנל שמות-לטיפול — רישום תוך-שיחה + קידום-שלב (מעקב-הטיפול המלא בכרטיס) */}
              {ayinOn && namesOpen && (
                <div style={{ border: '1px dashed var(--line)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(sp.ayin?.names ?? []).map((n) => (
                    <div key={n.id} style={{ display: 'flex', gap: 8, fontSize: 12.5, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, minWidth: 0 }}>{n.name}</span>
                      {n.eyes !== '' && <span style={{ color: 'var(--ink-faint)' }}>{unitLabel(config)}: {n.eyes}</span>}
                      {n.done && <span style={{ color: 'var(--green)' }}>✓</span>}
                    </div>
                  ))}
                  {(sp.ayin?.names.length ?? 0) === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>אין {itemLabel(config)} עדיין — הוסיפו תוך-כדי השיחה:</div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addCareName(); }}
                      placeholder={itemLabel(config) + '…'}
                      style={{ fontSize: 13, padding: '6px 9px', flex: 1, minWidth: 0 }}
                    />
                    <input
                      value={eyesVal}
                      onChange={(e) => setEyesVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addCareName(); }}
                      placeholder={unitLabel(config)}
                      inputMode="numeric"
                      style={{ fontSize: 13, padding: '6px 9px', width: 72 }}
                    />
                    <Btn sm kind="primary" disabled={!nameVal.trim()} onClick={addCareName}>➕</Btn>
                  </div>
                  {/* קידום-שלב — הכפתור-החכם של מעקב-הטיפול (אותה מכונת-מצבים כמו בכרטיס) */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
                    <span style={{ color: 'var(--ink-faint)' }}>שלב: {stageLabel(config, sp.ayin?.stage ?? 'new')}</span>
                    {sp.ayin && ayinAdvanceLabel(config, sp.ayin) && (
                      <Btn sm onClick={() => ayinAdvance(sp.id)} title="קידום לשלב הבא במעקב-הטיפול">
                        {ayinAdvanceLabel(config, sp.ayin)}
                      </Btn>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* הערת-שיחה — נשמרת גם בכרטיס-התומך (רישום-עמיד) */}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הערה מהשיחה (נשמרת גם בכרטיס)…"
              style={{ fontSize: 13, padding: '7px 10px' }}
            />

            {/* קביעת חזרה — בורר-תאריך + תזכורת-בלוח */}
            {cbOpen ? (
              <div style={{ border: '1px dashed var(--line)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>מתי לחזור?</div>
                <HebDateInput value={cbDate} onChange={setCbDate} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
                  <input type="checkbox" checked={cbRemind} onChange={(e) => setCbRemind(e.target.checked)} />
                  גם תזכורת בלוח-השנה
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn sm kind="primary" disabled={!cbDate} onClick={() => act('callback', cbDate, cbRemind)}>🔁 קבע חזרה</Btn>
                  <Btn sm onClick={() => setCbOpen(false)}>ביטול</Btn>
                </div>
              </div>
            ) : (
              /* כפתורי-סיווג — מקלדת 1–6 */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  <Btn kind="primary" onClick={startDonation} title="כסף שהתקבל אצלכם עכשיו (מזומן/העברה/אשראי) — רישום + קבלה ואז התקדמות. שילם דרך הקישור? לא לרשום — ייקלט מהסליקה. מקש 1">💰 תרם/ה</Btn>
                  <Btn onClick={() => act('noanswer')} title="חוזר לסוף-התור — מקש 2">📵 לא ענה</Btn>
                  <Btn onClick={() => act('refused')} title="מקש 3">🚫 סירב</Btn>
                  <Btn onClick={() => setCbOpen(true)} title="קביעת מועד-חזרה — מקש 4">🔁 חזרה</Btn>
                  <Btn onClick={() => act('done')} title="מקש 5">✓ טופל</Btn>
                  <Btn onClick={() => act('skip')} title="חוזר לסוף-התור — מקש 6">⏭ דלג</Btn>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center' }}>
                  ⌨️ מקשים 1–6 מסווגים בלי עכבר
                </div>
              </>
            )}
          </>
        )}

        {/* סרגל-תחתון */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <span style={{ display: 'flex', gap: 6 }}>
            <Btn sm onClick={onClose}>מזעור</Btn>
            {dialer.log.length > 0 && (
              <>
                <Btn sm onClick={undo} title="ביטול הסיווג האחרון — המתקשר חוזר לחזית-התור">↩ ביטול אחרון</Btn>
                <Btn sm onClick={exportCsv} title="הורדת יומן-השיחות עד-כה כ-CSV">⬇ CSV</Btn>
              </>
            )}
          </span>
          {armEnd ? (
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>למחוק?</span>
              <Btn sm onClick={() => { stop(); onClose(); }}>כן, סיום</Btn>
              <Btn sm onClick={() => setArmEnd(false)}>ביטול</Btn>
            </span>
          ) : (
            <Btn sm onClick={() => setArmEnd(true)}>🗑 סיום קמפיין</Btn>
          )}
        </div>
      </div>

    </Modal>
  );
}
