/**
 * 📒 פרנסה׳לע — לשונית 📣 פרסומות (אשכולות 5+8): ניהול משבצות-הפרסום והחסות —
 *   · פנקס (adsLedger): סה"כ · נגבה · ממתין לגבייה + מד-גבייה.
 *   · היום בתורנות (adRotation — הסבב-היומי של המנוע): שורת-החסות בלוח · חסות לכל אחד מ-15 השערים
 *     (פנוי/בחסות + תור, "שער עמוס שווה יותר") · מודעות-החוברת לפי גודל.
 *   · רשימה לפי משבצת: עריכה, סימון/ביטול-תשלום, 💳 קישור-סליקה (payLink — מגודר-הרחבה), שליחתו
 *     בוואטסאפ, מחיקה בשתי-לחיצות בהרשאה.
 * **רישום בלבד** (הכרעה 4): מחיר + סימון-תשלום ידני; אפס קבלות/מונים/תרומות.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, integrationSetting, termOf } from '../../lib/config';
import type { PrAd, PrAdSlot } from '../../types/domain';
import { Btn, Chip, Empty } from '../ui';
import { useArmed } from '../useArmed';
import { WaBtn } from '../WaBtn';
import { adPayLink, adRotation, adsLedger, categoryOf, PR_CATEGORIES, priceOf, adActiveOn } from './lib';
import { AdForm } from './AdForm';
import { usePrBrand, usePrPerms, type PrNow } from './hooks';
import { ddmm, PR_AD_KIND_LABELS, PR_AD_SLOT_LABELS } from './labels';

const SLOTS: readonly PrAdSlot[] = ['booklet', 'category', 'board'];
const ROW = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 } as const;
const nis = (n: number): string => n.toLocaleString('he-IL') + ' ₪';

export function AdsTab(props: { now: PrNow }) {
  const config = useApp((s) => s.config);
  const ads = useApp((s) => s.db.prAds);
  const listings = useApp((s) => s.db.prListings);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrAd = useApp((s) => s.upsertPrAd);
  const deletePrAd = useApp((s) => s.deletePrAd);
  const toast = useApp((s) => s.toast);
  const brand = usePrBrand();
  const { canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const [form, setForm] = useState<{ ad: PrAd | null; slot?: PrAdSlot; target?: string } | null>(null);

  const today = props.now.todayIso;
  const word = termOf(config, 'entity.prAd', 'פרסומת');
  const payUrl = integrationOn(config, 'payments') ? integrationSetting(config, 'payments', 'payUrl') : '';
  const waOn = integrationOn(config, 'whatsapp');
  const ledger = adsLedger(ads, today);
  const pct = ledger.total > 0 ? Math.round((ledger.paid / ledger.total) * 100) : 0;
  const board = adRotation(ads, 'board', today);
  const counts = new Map<string, number>();
  for (const l of listings) if (l.status === 'approved') counts.set(categoryOf(l.category).key, (counts.get(categoryOf(l.category).key) ?? 0) + 1);
  const bookletLive = ads.filter((a) => a.slot === 'booklet' && a.active !== false && (!a.to || a.to >= today));

  function togglePaid(a: PrAd) {
    const res = upsertPrAd({ ...a, paid: !a.paid });
    if (res.ok) toast(a.paid ? 'סימון התשלום בוטל' : 'התשלום נרשם. תזכו למצוות!');
  }

  function remove(a: PrAd) {
    if (!confirmTwice('pra-' + a.id, 'למחוק את ה' + word + ' של ' + a.advertiser + '?')) {
      toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
      return;
    }
    if (deletePrAd(a.id)) toast('ה' + word + ' נמחקה');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>חסות על שער, שורת-חסות בלוח ומודעות בחוברת — רישום ומעקב-תשלום בלבד.</div>
        <span style={{ marginInlineStart: 'auto' }}>
          <Btn kind="primary" onClick={() => setForm({ ad: null })}>
            ➕ הוספת {termOf(config, 'entity.prAd', 'פרסומת')}
          </Btn>
        </span>
      </div>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13.5 }}>
          <span>
            {'סה״כ: '}
            <b>{nis(ledger.total)}</b>
          </span>
          <span>
            {'נגבה: '}
            <b>{nis(ledger.paid)}</b>
            {' (' + ledger.paidCount + ' מתוך ' + ledger.count + ')'}
          </span>
          <span>
            {'ממתין לגבייה: '}
            <b style={{ color: ledger.due ? '#b91c1c' : undefined }}>{ledger.due ? nis(ledger.due) : 'הכול נגבה, ברוך ה׳'}</b>
          </span>
          {ledger.upcoming > 0 && <span style={{ color: 'var(--ink-faint)' }}>{'עתידי: ' + nis(ledger.upcoming)}</span>}
        </div>
        <div role="meter" aria-label="אחוז הגבייה" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{ height: 8, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: 'var(--accent)' }} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
          {'💳 התשלום — ' + (payUrl ? 'בקישור-הסליקה של הארגון' : 'ישירות לגבאי (הרחבת התשלומים כבויה)') + '; הסימון "שולם" ידני. אין כאן קבלות.'}
        </div>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>היום בתורנות</h2>
        <div style={ROW}>
          <b>📌 שורת החסות בלוח הקהילה</b>
          {board.today ? (
            <span>
              {[board.today.advertiser, board.today.headline, board.today.phone].filter((x) => x && x.trim()).join(' · ')}
              {board.active.length > 1 && <span style={{ color: 'var(--ink-faint)' }}>{' · ' + board.active.length + ' בסבב — מתחלף כל יום'}</span>}
            </span>
          ) : (
            <span style={{ color: 'var(--ink-faint)' }}>{'פנוי · ' + nis(priceOf(prefs, 'board')) + ' לחודש'}</span>
          )}
          <span style={{ marginInlineStart: 'auto' }}>
            <Btn sm onClick={() => setForm({ ad: null, slot: 'board' })}>
              ➕
            </Btn>
          </span>
        </div>
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <b>📖 מודעות בחוברת</b>
          <span>
            {(['full', 'half', 'small'] as const).map((k) => PR_AD_KIND_LABELS[k] + ' ' + bookletLive.filter((a) => a.kind === k).length).join(' · ') +
              ' · שולמו ' +
              bookletLive.filter((a) => a.paid).length +
              ' מתוך ' +
              bookletLive.length}
          </span>
        </div>
        <h3 style={{ fontSize: 13.5, fontWeight: 800, marginTop: 6 }}>👑 חסות על השערים</h3>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>שם נותן-החסות בראש השער במדריך ובחוברת · שער עמוס שווה יותר</div>
        {PR_CATEGORIES.map((c) => {
          const rot = adRotation(ads, 'category', today, c.key);
          return (
            <div key={c.key} style={ROW}>
              <span>{c.num + ' · ' + c.icon + ' ' + c.name}</span>
              <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>{(counts.get(c.key) ?? 0) + ' כרטיסים'}</span>
              {rot.today ? (
                <span>
                  {'בחסות ' + rot.today.advertiser}
                  {rot.active.length > 1 && <span style={{ color: 'var(--ink-faint)' }}>{' · ' + rot.active.length + ' בסבב'}</span>}
                </span>
              ) : (
                <span style={{ color: '#12803c' }}>{'פנוי לחסות · ' + nis(priceOf(prefs, 'sponsor')) + ' לחודש'}</span>
              )}
              <span style={{ marginInlineStart: 'auto' }}>
                <Btn sm onClick={() => setForm({ ad: null, slot: 'category', target: c.key })}>
                  {rot.today ? '➕ לתור' : 'הגדרה'}
                </Btn>
              </span>
            </div>
          );
        })}
      </section>

      {ads.length === 0 && <Empty>{'עוד אין אף ' + word + '. חסות על שער מופיעה בראש השער ובחוברת; מודעות — בדפי-המודעות של החוברת.'}</Empty>}

      {SLOTS.map((slot) => {
        const items = ads.filter((a) => a.slot === slot).sort((a, b) => a.advertiser.localeCompare(b.advertiser, 'he') || a.id.localeCompare(b.id));
        if (!items.length) return null;
        return (
          <section key={slot} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>{PR_AD_SLOT_LABELS[slot] + ' (' + items.length + ')'}</h2>
              <span style={{ marginInlineStart: 'auto' }}>
                <Btn sm onClick={() => setForm({ ad: null, slot })}>
                  ➕
                </Btn>
              </span>
            </div>
            {items.map((a) => {
              const live = adActiveOn(a, today);
              const href = payUrl && !a.paid && a.price > 0 ? adPayLink(a, payUrl) : null;
              return (
                <div key={a.id} style={ROW}>
                  <b>{a.advertiser}</b>
                  {a.headline && <span>{a.headline}</span>}
                  <span style={{ color: 'var(--ink-faint)' }}>
                    {(slot === 'booklet' ? PR_AD_KIND_LABELS[a.kind] : slot === 'category' ? 'שער ' + categoryOf(a.target).short : 'שורה') +
                      ' · ' +
                      (a.from || a.to ? (a.from ? ddmm(a.from) : '…') + '–' + (a.to ? ddmm(a.to) : '…') : 'ללא תאריך')}
                  </span>
                  <Chip on={live}>{live ? 'פעילה' : a.active === false ? 'מושהית' : 'לא בתקופה'}</Chip>
                  <span style={{ fontWeight: 700 }}>{nis(a.price)}</span>
                  <Chip on={a.paid}>{a.paid ? 'שולם' + (a.paidAt ? ' ' + ddmm(a.paidAt) : '') : 'לא שולם'}</Chip>
                  <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={'קישור-תשלום ל' + a.advertiser + ' — עמוד-הסליקה של הארגון'}
                        title="קישור-תשלום לעמוד-הסליקה (אינו מנפיק קבלה)"
                        style={{ textDecoration: 'none', fontSize: 12, fontWeight: 700, border: '1px solid var(--line)', borderRadius: 8, padding: '2px 8px', whiteSpace: 'nowrap' }}
                      >
                        💳 קישור-תשלום
                      </a>
                    )}
                    {href && waOn && a.phone ? <WaBtn phone={a.phone} text={'שלום, לתשלום עבור הפרסום ב' + brand + ' (' + nis(a.price) + '): ' + href} title="שליחת קישור-התשלום בוואטסאפ" /> : null}
                    <Btn sm onClick={() => togglePaid(a)}>
                      {a.paid ? 'ביטול סימון התשלום' : '✓ סימון כשולם'}
                    </Btn>
                    <Btn sm onClick={() => setForm({ ad: a })} title="עריכה">
                      ✎
                    </Btn>
                    {canDelete && (
                      <Btn sm kind="danger" onClick={() => remove(a)}>
                        {armed === 'pra-' + a.id ? 'בטוח?' : '🗑'}
                      </Btn>
                    )}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}

      {form && <AdForm ad={form.ad} slot={form.slot} target={form.target} onClose={() => setForm(null)} />}
    </div>
  );
}
