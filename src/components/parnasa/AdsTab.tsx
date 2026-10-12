/**
 * 📒 פרנסה׳לע — לשונית 📣 פרסומות (אשכול 5): משבצות-הפרסום והחסות לפי משבצת (חוברת · חסות-שער ·
 * שורת-לוח) — הוספה/עריכה (AdForm), מחיקה בשתי-לחיצות בהרשאה (parnasa.delete).
 * **רישום בלבד** (הכרעה 4): מחיר + סימון-תשלום ידני; אפס קבלות/מונים/תרומות.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { PrAd, PrAdSlot } from '../../types/domain';
import { Btn, Chip, Empty } from '../ui';
import { useArmed } from '../useArmed';
import { adActiveOn, categoryOf } from './lib';
import { AdForm } from './AdForm';
import { usePrPerms, type PrNow } from './hooks';
import { ddmm, PR_AD_KIND_LABELS, PR_AD_SLOT_LABELS } from './labels';

const SLOTS: readonly PrAdSlot[] = ['booklet', 'category', 'board'];

export function AdsTab(props: { now: PrNow }) {
  const config = useApp((s) => s.config);
  const ads = useApp((s) => s.db.prAds);
  const deletePrAd = useApp((s) => s.deletePrAd);
  const toast = useApp((s) => s.toast);
  const { canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const [form, setForm] = useState<{ ad: PrAd | null; slot?: PrAdSlot } | null>(null);

  const today = props.now.todayIso;
  const word = termOf(config, 'entity.prAd', 'פרסומת');

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

      {ads.length === 0 && <Empty>{'עוד אין ' + word + 'ות. חסות על שער מופיעה בראש השער ובחוברת; מודעות — בדפי-המודעות של החוברת.'}</Empty>}

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
              return (
                <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                  <b>{a.advertiser}</b>
                  {a.headline && <span>{a.headline}</span>}
                  <span style={{ color: 'var(--ink-faint)' }}>
                    {(slot === 'booklet' ? PR_AD_KIND_LABELS[a.kind] : slot === 'category' ? 'שער ' + categoryOf(a.target).short : 'שורה') +
                      ' · ' +
                      (a.from || a.to ? (a.from ? ddmm(a.from) : '…') + '–' + (a.to ? ddmm(a.to) : '…') : 'ללא תאריך')}
                  </span>
                  <Chip on={live}>{live ? 'פעילה' : a.active === false ? 'מושהית' : 'לא בתקופה'}</Chip>
                  <span style={{ fontWeight: 700 }}>{a.price.toLocaleString('he-IL') + ' ₪'}</span>
                  <Chip on={a.paid}>{a.paid ? 'שולם' : 'לא שולם'}</Chip>
                  <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 4 }}>
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

      {form && <AdForm ad={form.ad} slot={form.slot} onClose={() => setForm(null)} />}
    </div>
  );
}
