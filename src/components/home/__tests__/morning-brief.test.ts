/**
 * 🌅 ratchet — תדרוך-הבוקר (VISION-LIGHT ‏#29, 23.8.2026, Zero-UI).
 *
 * "הבוקר שלך" = אגרגציה-בלבד מעל המנועים הקיימים (קוקפיט · עיתוי-עברי ·
 * מפגשי-היום · אירועי-הלוח) — אפס-חישוב-חדש, אפס-כתיבה, היום/השעה מוזרקים.
 * ‏opt-in מפורש `home.morningbrief === true`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { briefSpeechText, morningBrief } from '../morningBrief';
import { emptyDb } from '../../../types/domain';
import type { OrgConfig } from '../../../types/config';

const CFG = { slug: 't', orgName: 'מאור', modules: {}, features: {}, terms: {} } as unknown as OrgConfig;
const NOW = new Date('2026-08-23T08:00:00');

describe('🌅 תדרוך-הבוקר — המנוע', () => {
  it('בוקר ריק ⇒ empty=true ונוסח-הקראה חיובי', () => {
    const b = morningBrief(emptyDb(), CFG, '2026-08-23', NOW, 3.7);
    expect(b.empty).toBe(true);
    expect(b.sections).toEqual([]);
    expect(briefSpeechText('מאור', b)).toContain('אין משימות פתוחות');
  });

  it('אירוע-היום עולה כמדור 📅 עם קפיצה-ללוח; מחר — לא', () => {
    const db = emptyDb();
    db.events.push(
      { id: 'e1', title: 'מגבית', date: '2026-08-23', time: '19:00', type: 'custom', customType: '', notes: '', price: 0, roomId: '' } as never,
      { id: 'e2', title: 'מחר', date: '2026-08-24', time: '', type: 'custom', customType: '', notes: '', price: 0, roomId: '' } as never,
    );
    const b = morningBrief(db, CFG, '2026-08-23', NOW, 3.7);
    const ev = b.sections.find((s) => s.key === 'events');
    expect(ev?.count).toBe(1);
    expect(ev?.view).toBe('calendar');
    expect(ev?.top[0]).toContain('מגבית');
  });

  it('העונה-העברית נכללת רק כשדגל-העיתוי דלוק (אותו opt-in)', () => {
    const db = emptyDb();
    // הרגל-אלול של שנתיים בלי נתינה השנה (23.8.2026=אלול; עוגני-heb-timing)
    db.supporters.push({
      id: 's1', name: 'רגיל', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
      count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '',
      donations: [
        { rid: 'D-1', date: '2024-09-10', amount: 100, cur: '₪', cat: '', method: '' },
        { rid: 'D-2', date: '2025-09-10', amount: 100, cur: '₪', cat: '', method: '' },
      ],
    } as never);
    const off = morningBrief(db, CFG, '2026-08-23', NOW, 3.7);
    expect(off.sections.find((s) => s.key === 'season')).toBeUndefined();
    const on = morningBrief(db, { ...CFG, features: { 'supporters.hebtiming': true } } as OrgConfig, '2026-08-23', NOW, 3.7);
    expect(on.sections.find((s) => s.key === 'season')?.count).toBe(1);
  });

  it('נוסח-ההקראה בלי שמות (צנעה בקול-רם) — רק מונים', () => {
    const db = emptyDb();
    db.events.push({ id: 'e1', title: 'שם-סודי-של-אירוע', date: '2026-08-23', time: '', type: 'custom', customType: '', notes: '', price: 0, roomId: '' } as never);
    const txt = briefSpeechText('מאור', morningBrief(db, CFG, '2026-08-23', NOW, 3.7));
    expect(txt).toContain('1 אירועים בלוח');
    expect(txt).not.toContain('שם-סודי');
  });

  it('🔒 הגנת-מקור: opt-in מפורש בבית, בשני מסלולי-הרינדור; הקראה נופלת-רך', () => {
    const home = readFileSync('src/components/home/HomeView.tsx', 'utf8');
    expect(home).toContain("config.features?.['home.morningbrief'] === true");
    expect((home.match(/\{briefOn && <MorningBriefCard \/>\}/g) ?? []).length).toBe(2);
    const card = readFileSync('src/components/home/MorningBrief.tsx', 'utf8');
    expect(card).toContain('speechSynthesis');
    expect(card).toContain('לא תומך בהקראה'); // אין תמיכה ⇒ טוסט, לא קריסה
    expect(card).not.toContain('setDb'); // קריאה-בלבד
  });
});
