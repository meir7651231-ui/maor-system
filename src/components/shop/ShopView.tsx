/**
 * עמודת החנות — מוצרי שירות (מודול shop — BUILD-ORDER-SHOP-2026-07-30).
 *
 * בידוד מלא (הכרעת בעלים 30.7, כמו קופות הצדקה): הכסף, השיוכים והאירועים
 * חיים רק כאן — לא זולגים לתרומות/קבלות/דוחות/לוח הראשי. משרדי בלבד
 * (הכרעה 1) — אין גישת לקוח.
 *
 * 5 טאבים: 🛍 קטלוג (ברירת מחדל) · 👥 מוטבים · 🏠 טיפול ·
 * 📅 לוח (shop.calendar) · 🖼 ראווה (shop.showcase).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Chip, PageHead } from '../ui';
import { CatalogTab } from './CatalogTab';

type ShopTab = 'catalog' | 'beneficiaries' | 'care' | 'calendar' | 'showcase';

export function ShopView() {
  const config = useApp((s) => s.config);
  const [tab, setTab] = useState<ShopTab>('catalog');
  const calendarOn = featureOn(config, 'shop.calendar');
  const showcaseOn = featureOn(config, 'shop.showcase');

  const tabs: { key: ShopTab; label: string; on: boolean }[] = [
    { key: 'catalog', label: '🛍 קטלוג', on: true },
    { key: 'beneficiaries', label: '👥 מוטבים', on: true },
    { key: 'care', label: '🏠 טיפול', on: true },
    { key: 'calendar', label: '📅 לוח', on: calendarOn },
    { key: 'showcase', label: '🖼 ראווה', on: showcaseOn },
  ];
  const active = tabs.find((t) => t.key === tab && t.on) ? tab : 'catalog';

  return (
    <div>
      <PageHead title={'🛍 ' + termOf(config, 'nav.shop', 'חנות')} sub="ניהול משרדי — קטלוג מוצרי שירות, מוטבים ומימושים" />
      <div style={{ display: 'flex', gap: 6, margin: '12px 0', flexWrap: 'wrap' }}>
        {tabs.filter((t) => t.on).map((t) => (
          <Chip key={t.key} on={active === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>
      {/* התוכן נבנה באשכולות 4-7 — placeholder לכל טאב עד אז */}
      {active === 'catalog' && <CatalogTab />}
      {active === 'beneficiaries' && <div className="muted">👥 המוטבים ייבנו באשכול 5</div>}
      {active === 'care' && <div className="muted">🏠 הטיפול ייבנה באשכול 6</div>}
      {active === 'calendar' && <div className="muted">📅 הלוח ייבנה באשכול 7</div>}
      {active === 'showcase' && <div className="muted">🖼 הראווה תיבנה באשכול 7</div>}
    </div>
  );
}
