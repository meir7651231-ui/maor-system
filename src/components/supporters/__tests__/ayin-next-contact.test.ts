/**
 * ratchet — «קשר הבא» אחרי «הושלם» במעקב-הטיפול (בקשת-בעלים 5.10.2026).
 * מנגנון אחד (store.setSupporterNext) לכרטיס ולמעקב: תאריך על התומך/ת + אירוע-שיחה **מקושר** בלוח-השנה הראשי —
 * יוצר פעם אחת · מעדכן את אותו אירוע · '' מנקה ומוחק (אין אירוע יתום — באג ידוע #6).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { useApp } from '../../../store/useApp';
import { emptyDb } from '../../../types/domain';
import type { Supporter } from '../../../types/domain';

const sup = (id: string): Supporter => ({
  id, name: 'רות לוי', phone: '0501234567', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
  count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
} as unknown as Supporter);

describe('setSupporterNext · מנגנון אחד ללוח-השנה', () => {
  beforeEach(() => { useApp.getState().setDb({ ...emptyDb(), supporters: [sup('s1')], events: [] }); });
  it('יוצר אירוע-שיחה מקושר, מעדכן את אותו אירוע, ומנקה בלי יתום', () => {
    const st = () => useApp.getState();
    st().setSupporterNext('s1', '2026-10-20', 'אחרי סיום טיפול');
    const sp1 = st().db.supporters[0];
    expect(sp1.nextDate).toBe('2026-10-20');
    expect(sp1.nextEventId).toBeTruthy();
    const ev = st().db.events.find((e) => e.id === sp1.nextEventId)!;
    expect(ev.type).toBe('call');
    expect(ev.date).toBe('2026-10-20');
    expect(ev.title).toContain('יעד קשר');
    expect(ev.notes).toContain('📝 אחרי סיום טיפול');
    st().setSupporterNext('s1', '2026-11-01');
    expect(st().db.events.length).toBe(1);
    expect(st().db.events[0].id).toBe(sp1.nextEventId);
    expect(st().db.events[0].date).toBe('2026-11-01');
    st().setSupporterNext('s1', '');
    expect(st().db.supporters[0].nextDate).toBe('');
    expect(st().db.supporters[0].nextEventId).toBeUndefined();
    expect(st().db.events.length).toBe(0);
  });
});

describe('חיווט', () => {
  const ayin = readFileSync(new URL('../AyinCard.tsx', import.meta.url), 'utf8');
  const card = readFileSync(new URL('../SupporterDetail.tsx', import.meta.url), 'utf8');
  it('במעקב-הטיפול: הבלוק מופיע רק ב-done, מגודר supporters.nextdate, וכותב דרך setSupporterNext', () => {
    expect(ayin).toContain("{a.stage === 'done' && featureOn(cfg, 'supporters.nextdate') && (");
    expect(ayin).toContain("setSupporterNext(sp.id, iso, 'אחרי סיום ' + feat)");
    expect(ayin).toContain('קשר הבא 🎯 — אחרי שהטיפול הושלם');
  });
  it('הכרטיס משתמש באותו מנגנון (אין עותק שני של יצירת-האירוע)', () => {
    expect(card).toContain('setSupporterNext(sp.id, v, nextNoteDraft)');
    expect(card).not.toMatch(/type: 'call',\s*\n\s*customType: '',\s*\n\s*notes: nextEventNotes/);
  });
});
