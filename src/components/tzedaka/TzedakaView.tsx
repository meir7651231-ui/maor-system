/**
 * עמודת קופות הצדקה (מודול tzedaka — BUILD-ORDER-TZEDAKA-2026-07-30).
 *
 * בידוד מלא (הכרעת בעלים 30.7): הכסף, האירועים והניקוד חיים רק כאן —
 * לא זולגים לתרומות/קבלות/דוחות/לוח הראשי. מצב נבחר-רכז ב-state מקומי
 * (לא ב-store — אין ניווט חוצה-מסכים).
 *
 * 4 טאבים: 🏠 טיפול · 🧑‍🤝‍🧑 רכזים (ברירת מחדל) · 📅 לוח (tzedaka.calendar) ·
 * 🏆 ראווה (tzedaka.showcase).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Chip, PageHead } from '../ui';
import { CoordinatorsTab } from './CoordinatorsTab';
import { HomeTab } from './HomeTab';
import { CalendarTab } from './CalendarTab';

type TzTab = 'care' | 'coordinators' | 'calendar' | 'showcase';

export function TzedakaView() {
  const config = useApp((s) => s.config);
  const [tab, setTab] = useState<TzTab>('coordinators');
  // נבחר-רכז — state מקומי בלבד (בידוד: אין ניווט חוצה-מסכים דרך ה-store)
  const [selCoordId, setSelCoordId] = useState<string | null>(null);
  const calendarOn = featureOn(config, 'tzedaka.calendar');
  const showcaseOn = featureOn(config, 'tzedaka.showcase');

  const tabs: { key: TzTab; label: string; on: boolean }[] = [
    { key: 'care', label: '🏠 טיפול', on: true },
    { key: 'coordinators', label: '🧑‍🤝‍🧑 ' + termOf(config, 'entity.tzCoordinator', 'רכז') + 'ים', on: true },
    { key: 'calendar', label: '📅 לוח', on: calendarOn },
    { key: 'showcase', label: '🏆 ראווה', on: showcaseOn },
  ];
  const active = tabs.find((t) => t.key === tab && t.on) ? tab : 'coordinators';

  return (
    <div>
      <PageHead title={'🪙 ' + termOf(config, 'nav.tzedaka', 'קופות צדקה')} sub="ניהול משרדי — רכזים, קופות, ריקונים ומבצעים" />
      <div style={{ display: 'flex', gap: 6, margin: '12px 0', flexWrap: 'wrap' }}>
        {tabs.filter((t) => t.on).map((t) => (
          <Chip key={t.key} on={active === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>
      {/* התוכן נבנה באשכולות 4-7 — placeholder לכל טאב עד אז */}
      {active === 'care' && (
        <HomeTab
          onOpenCoordinator={(id) => {
            setSelCoordId(id);
            setTab('coordinators');
          }}
        />
      )}
      {active === 'coordinators' && <CoordinatorsTab selId={selCoordId} onSelect={setSelCoordId} />}
      {active === 'calendar' && <CalendarTab />}
      {active === 'showcase' && <div className="card">🏆 ראווה — נבנה באשכול 7</div>}
    </div>
  );
}
