/**
 * 📒 פרנסה׳לע — "העסק שלי" של המקור (עיצוב 1, שלב-השלד): עמוד-בעלי-העסקים עם הכותרת של המקור. באורביט הגבאי
 * מנהל את הכרטיסים בשם בעליהם (בהסכמה) — ולכן כאן רשימת-העסקים עם מצב-האישור, ➕ הוספה ו-✎ עריכה (אותו
 * ListingForm, אותה מכונת-אישור ב-store), ו"לכרטיס ←" שפותח את דף-העסק באלפון. העורך המלא בן 8 החלקים — אשכול 4.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import type { PrListing } from '../../types/domain';
import { Btn, Empty } from '../ui';
import { categoryOf } from './lib';
import { ListingForm } from './ListingForm';
import { Page } from './Shell';

const ROW = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 } as const;
const STATUS: Record<PrListing['status'], string> = { approved: 'מופיע באלפון', pending: 'ממתין לאישור', rejected: 'מוסתר' };

export function MeTab(props: { onOpen: ((id: string) => void) | null }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const [form, setForm] = useState<{ listing: PrListing | null } | null>(null);
  const word = termOf(config, 'entity.prListing', 'עסק');
  const sorted = [...listings].sort((a, b) => a.name.localeCompare(b.name, 'he') || a.id.localeCompare(b.id));

  return (
    <Page wide k="לבעלי עסקים" title="העסק שלי" sub="דף עסק מלא בתוך האלפון: לוגו, מחירון, תמונות, שעות והמלצות. אתם עורכים, הקהילה פונה.">
      <div className="pn-orbit" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{'כל כרטיס נערך בשם בעל ה' + word + ' ובהסכמתו — גם למי שיש לו רק טלפון כשר.'}</span>
          <span style={{ marginInlineStart: 'auto' }}>
            <Btn kind="primary" onClick={() => setForm({ listing: null })}>
              ➕ הוספת {termOf(config, 'entity.prListing', 'עסק')}
            </Btn>
          </span>
        </div>
        {sorted.length === 0 ? (
          <Empty>{'האלפון מחכה לכרטיס הראשון — ➕ הוספת ' + word + '.'}</Empty>
        ) : (
          <section className="card">
            {sorted.map((l) => (
              <div key={l.id} style={ROW}>
                <span aria-hidden>{categoryOf(l.category).icon}</span>
                <b>{l.name}</b>
                <span style={{ color: 'var(--ink-faint)' }}>{[l.title, categoryOf(l.category).short].filter(Boolean).join(' · ')}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{STATUS[l.status] + (l.dialCode ? ' · ☎ ' + l.dialCode : '')}</span>
                <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 4 }}>
                  {props.onOpen && (
                    <Btn sm onClick={() => props.onOpen?.(l.id)}>
                      לכרטיס ←
                    </Btn>
                  )}
                  <Btn sm onClick={() => setForm({ listing: l })} title="עריכה">
                    ✎ עריכה
                  </Btn>
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
      {form && <ListingForm listing={form.listing} onClose={() => setForm(null)} />}
    </Page>
  );
}
