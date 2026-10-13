/**
 * 📒 פרנסה׳לע — הכרטיס המלא של עסק (אשכול 5, "דף העסק" של המקור §3.5): פרטים, שעות-פעילות לשבוע
 * (שבת = "שבת קודש"), שירותים ומחירים, המלצות-הקהילה, ובקשות-בתחום **בתצוגת-העסקים** (businessView —
 * בקשה שקטה בלי זהות-המבקש). פעולות-גבאי (אישור/דחייה/מחיקה) — רק בהרשאה (prCan, נאכף גם ב-store).
 */
import { useState, type CSSProperties } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { PrListing } from '../../types/domain';
import { Btn, Chip, Field, Modal, StickyBackBar, TextInput } from '../ui';
import { OrbitLayer } from './skin';
import { useArmed } from '../useArmed';
import { categoryOf, isFeatured, PR_AUD_NAMES, PR_LANG_NAMES, requestsForListing } from './lib';
import { minToHm, hmToMin, PR_DAY_NAMES } from './zmanimBoard';
import { ContactRow, OpenBadge, TimeText } from './ListingCard';
import { ListingForm } from './ListingForm';
import { usePrBrand, usePrPerms, type PrNow } from './hooks';
import { agoText, priceText } from './labels';

const SECTION: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };

/** חלונות-השעות של יום (dow) כטקסט ("08:00–19:00, 20:00–22:00"); אין ⇒ ''. */
function dayWindows(l: PrListing, dow: number): string {
  return l.hours
    .filter((h) => h.dow === dow && hmToMin(h.from) !== null && hmToMin(h.to) !== null)
    .sort((a, b) => (hmToMin(a.from) ?? 0) - (hmToMin(b.from) ?? 0))
    .map((h) => minToHm(hmToMin(h.from) ?? 0) + '–' + (h.to === '24:00' ? 'חצות' : minToHm(hmToMin(h.to) ?? 0)))
    .join(', ');
}

export function ListingDetail(props: { listing: PrListing; now: PrNow; onBack: () => void }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const requests = useApp((s) => s.db.prRequests);
  const setPrStatus = useApp((s) => s.setPrStatus);
  const deletePrListing = useApp((s) => s.deletePrListing);
  const upsertPrListing = useApp((s) => s.upsertPrListing);
  const addPrResponse = useApp((s) => s.addPrResponse);
  const toast = useApp((s) => s.toast);
  const brand = usePrBrand();
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const [editOpen, setEditOpen] = useState(false);
  const [rec, setRec] = useState({ by: '', text: '' });
  const [respondTo, setRespondTo] = useState<{ id: string; quiet: boolean } | null>(null);
  const [respText, setRespText] = useState('');

  const l = props.listing;
  const cat = categoryOf(l.category);
  const word = termOf(config, 'entity.prListing', 'עסק');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const reqWord = termOf(config, 'entity.prRequest', 'בקשה');
  const requestsOn = featureOn(config, 'parnasa.requests');
  const feat = isFeatured(l, props.now.todayIso);
  const inTrade = requestsOn ? requestsForListing(l, requests, listings, props.now.nowMs) : [];

  function decide(status: 'approved' | 'rejected') {
    if (setPrStatus('listing', l.id, status)) toast(status === 'approved' ? 'אושר — מופיע במדריך' : 'הוסתר מהמדריך');
  }

  function addRec() {
    const text = rec.text.trim();
    if (!text) return toast('כתבו את ההמלצה');
    // המלצה = שינוי לא-תוכני ⇒ מכונת-האישור משאירה את הסטטוס כמות-שהוא
    const res = upsertPrListing({ ...l, recs: [{ by: rec.by.trim(), text: text.slice(0, 240), at: new Date().toISOString() }, ...l.recs] });
    if (res.ok) {
      setRec({ by: '', text: '' });
      toast('ההמלצה נוספה — תודה!');
    }
  }

  function removeRec(i: number) {
    upsertPrListing({ ...l, recs: l.recs.filter((_, j) => j !== i) });
  }

  function respond() {
    if (!respondTo) return;
    if (respondTo.quiet && !respText.trim()) return toast('לבקשה בשקט — כתבו תשובה (המבקש יראה אותה, ואתם לא תדעו מי הוא)');
    if (addPrResponse(respondTo.id, { listingId: l.id, text: respText.trim() || 'זמין' })) {
      toast(respondTo.quiet ? 'שלחת תשובה. אתה לא יודע מי ביקש…' : 'נרשם שה' + word + ' זמין/ה');
      setRespondTo(null);
      setRespText('');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', borderInlineStart: '5px solid ' + cat.color }}>
        <div aria-hidden style={{ fontSize: 34 }}>
          {cat.icon}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 20 }}>{l.name}</span>
            {feat && <Chip on>{'👑 מומלץ עד ' + l.featuredUntil}</Chip>}
            {l.status === 'pending' && <Chip>{'⏳ ממתין לאישור ה' + gabbai}</Chip>}
            {l.status === 'rejected' && <Chip>✕ מוסתר מהמדריך</Chip>}
            {l.dialCode && <Chip>{'☎ קוד חיוג ' + l.dialCode}</Chip>}
          </div>
          {l.tagline && <div style={{ fontSize: 13.5, fontStyle: 'italic' }}>{l.tagline}</div>}
          {l.title && <div style={{ fontSize: 14 }}>{l.title}</div>}
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
            {[cat.num + ' · ' + cat.name, l.city, l.area].filter((x) => x && x.trim()).join(' · ')}
            {' · '}
            {l.source === 'gabbai' ? 'הוזן ע״י ה' + gabbai : 'נמסר ע״י בעל ה' + word}
          </div>
          <div style={{ marginTop: 6 }}>
            <ContactRow listing={l} brand={brand} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn onClick={() => setEditOpen(true)}>✎ עריכה</Btn>
          {canApprove && l.status !== 'approved' && (
            <Btn kind="primary" onClick={() => decide('approved')}>
              ✓ אישור
            </Btn>
          )}
          {canApprove && l.status !== 'rejected' && (
            <Btn onClick={() => decide('rejected')}>✕ הסתרה</Btn>
          )}
          {canDelete && (
            <Btn
              kind="danger"
              onClick={() => {
                if (!confirmTwice('prl-' + l.id, 'למחוק את ' + l.name + ' מהמדריך?')) {
                  toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
                  return;
                }
                if (deletePrListing(l.id)) {
                  toast(l.name + ' נמחק/ה מהמדריך');
                  props.onBack();
                }
              }}
            >
              {armed === 'prl-' + l.id ? 'בטוח?' : '🗑 מחיקה'}
            </Btn>
          )}
        </div>
      </div>

      <section className="card" style={SECTION}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>🕒 שעות פעילות</h2>
        <OpenBadge listing={l} now={props.now} />
        {l.always ? (
          <div style={{ fontSize: 13.5 }}>24 שעות — חוץ משבת וחג</div>
        ) : (
          <table className="table" style={{ maxWidth: 420 }}>
            <tbody>
              {[0, 1, 2, 3, 4, 5].map((d) => (
                <tr key={d} style={d === props.now.clock.dow ? { fontWeight: 800 } : undefined}>
                  <td>{'יום ' + PR_DAY_NAMES[d] + (d === props.now.clock.dow ? ' · היום' : '')}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>
                    {dayWindows(l, d) || 'סגור'}
                  </td>
                </tr>
              ))}
              <tr style={props.now.clock.dow === 6 ? { fontWeight: 800 } : undefined}>
                <td>{'שבת' + (props.now.clock.dow === 6 ? ' · היום' : '')}</td>
                <td>{'שבת קודש' + (dayWindows(l, 6) ? ' · מוצ״ש ' + dayWindows(l, 6) : '')}</td>
              </tr>
            </tbody>
          </table>
        )}
        {l.hoursNote.trim() && (
          <div style={{ fontSize: 13 }}>
            <TimeText text={l.hoursNote} />
          </div>
        )}
        {l.emergency && <div style={{ fontSize: 13, fontWeight: 700 }}>🚨 זמינים גם לקריאות חירום, 24/7</div>}
      </section>

      {(l.desc.trim() || l.services.length > 0) && (
        <section className="card" style={SECTION}>
          {l.desc.trim() && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>על העסק</h2>
              <div style={{ fontSize: 13.5, whiteSpace: 'pre-line' }}>{l.desc}</div>
            </>
          )}
          {l.services.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 800, marginTop: 6 }}>שירותים ומחירים</h2>
              {l.services.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13.5, borderBottom: '1px dotted var(--line)', padding: '3px 0' }}>
                  <span style={{ fontWeight: 700 }}>{s.name}</span>
                  {s.note && <span style={{ color: 'var(--ink-faint)' }}>{s.note}</span>}
                  <span style={{ marginInlineStart: 'auto', whiteSpace: 'nowrap' }}>{priceText(s.price)}</span>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>המחירים להמחשה. סופי בתיאום</div>
            </>
          )}
        </section>
      )}

      <section className="card" style={SECTION}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>פרטי העסק</h2>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13 }}>
          <span>{'תחום: ' + cat.name}</span>
          {l.city && <span>{'גר ב: ' + l.city}</span>}
          {l.area && <span>{'אזור שירות: ' + l.area}</span>}
          {l.languages.length > 0 && <span>{'שפות: ' + l.languages.map((x) => PR_LANG_NAMES[x] ?? x).join(', ')}</span>}
          <span>{'מתאים: ' + (PR_AUD_NAMES[l.aud ?? 'all'] ?? 'לכולם')}</span>
          {l.kashrut.trim() && <span>{'השגחה: ' + l.kashrut}</span>}
          {l.disc && <span>🏷 הנחה לקהילה</span>}
          {l.free && <span>🤝 גמ״ח</span>}
        </div>
        {canApprove && l.notes.trim() && (
          <div style={{ fontSize: 12.5, background: 'var(--panel)', border: '1px dashed var(--line)', borderRadius: 8, padding: '6px 8px' }}>
            {'🛡 הערה פנימית: ' + l.notes}
          </div>
        )}
      </section>

      <section className="card" style={SECTION}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>{'💬 המלצות מהקהילה (' + l.recs.length + ')'}</h2>
        {l.recs.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>עוד אין המלצות. עבדתם איתו? מילה טובה עוזרת לכל הקהילה לבחור.</div>}
        {l.recs.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, alignItems: 'baseline' }}>
            <span style={{ flex: 1 }}>{'״' + r.text + '״ — ' + (r.by || 'חבר הקהילה') + ' · ' + agoText(r.at, props.now.nowMs)}</span>
            {canApprove && (
              <Btn sm onClick={() => removeRec(i)} title="הסרת ההמלצה">
                ✕
              </Btn>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextInput value={rec.text} onChange={(v) => setRec({ ...rec, text: v })} placeholder="למשל: הגיע בזמן, עבודה נקייה ומחיר הוגן" ariaLabel="המלצה" />
          <TextInput value={rec.by} onChange={(v) => setRec({ ...rec, by: v })} placeholder="שם הממליץ (רשות)" ariaLabel="שם הממליץ" />
          <Btn sm onClick={addRec}>
            ➕ הוספת המלצה
          </Btn>
        </div>
      </section>

      {requestsOn && l.status === 'approved' && (
        <section className="card" style={SECTION}>
          <h2 style={{ fontSize: 15, fontWeight: 800 }}>{'🙋 מה מבקשים בתחום (' + inTrade.length + ')'}</h2>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
            {l.source === 'gabbai'
              ? 'הוזן ע״י ה' + gabbai + ' — לא מקבל ניתוב אוטומטי (טלפון כשר); ה' + gabbai + ' מתקשר/ת כשמתאים.'
              : 'כך ה' + word + ' רואה כל ' + reqWord + ': ' + reqWord + ' בשקט — בלי שם ובלי טלפון של הפונה.'}
          </div>
          {inTrade.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{'אין כרגע ' + reqWord + ' פתוחה בתחום.'}</div>}
          {inTrade.map((v) => (
            <div key={v.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '7px 10px', fontSize: 13 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {v.quiet && <Chip>🔒 בשקט · בלי פרטי הפונה</Chip>}
                {v.urgent && <Chip on>דחוף</Chip>}
                <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>{agoText(v.createdAt, props.now.nowMs)}</span>
                <span style={{ marginInlineStart: 'auto' }}>
                  <Btn sm onClick={() => setRespondTo({ id: v.id, quiet: v.quiet })}>
                    ✋ זמין
                  </Btn>
                </span>
              </div>
              <div style={{ marginTop: 4, whiteSpace: 'pre-line' }}>{v.text}</div>
              {v.contact && (v.contact.name || v.contact.phone) && (
                <div style={{ fontSize: 12.5, marginTop: 2 }}>
                  {v.contact.name}{' '}
                  <span dir="ltr">{v.contact.phone}</span>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <OrbitLayer>
        <StickyBackBar onBack={props.onBack} label="→ חזרה למדריך" />
      </OrbitLayer>
      {editOpen && <ListingForm listing={l} onClose={() => setEditOpen(false)} />}
      {respondTo && (
        <OrbitLayer>
        <Modal title={respondTo.quiet ? 'שליחת תשובה (בשקט)' : '✋ סימון זמין'} onClose={() => setRespondTo(null)}>
          {respondTo.quiet && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
              המבקש יראה את התשובה ואת הכרטיס שלך. אתה לא תדע מי הוא, עד שהוא יבחר לפנות.
            </div>
          )}
          <Field label={respondTo.quiet ? 'התשובה *' : 'הערה (רשות)'}>
            <textarea
              rows={3}
              value={respText}
              onChange={(e) => setRespText(e.target.value.slice(0, 500))}
              placeholder={respondTo.quiet ? 'למשל: אני מטפלת רגשית מוסמכת, מקבלת בבית, הפגישה הראשונה בחינם. אפשר להתקשר בכל ערב.' : 'זמין מחר בבוקר'}
            />
          </Field>
          <div className="modal-actions">
            <Btn kind="primary" onClick={respond}>
              שליחה
            </Btn>
            <Btn onClick={() => setRespondTo(null)}>ביטול</Btn>
          </div>
        </Modal>
        </OrbitLayer>
      )}
    </div>
  );
}
