/**
 * ratchet — באג-3 (המשך): מפתחות היום והגאדג'טים ממורחבי-שמות.
 *
 * הבאג: שער-היום (maor_day/maor_dayend), הגיבוי האוטומטי (maor_autoexp),
 * מפת אזורי-הטיפול (maor_bodymap) וטיימר-הכסף (maor_timer_collections) כתבו
 * למפתח localStorage גלובלי — כך ששני ארגונים על אותו host חלקו נתונים
 * (כולל נתוני-כסף וקליני). כולם עוברים עכשיו דרך nsLsKey (default = מפתח ישן,
 * ‏אחרת `base:slug`) ⇒ בידוד פר-ארגון. הלקוח הקיים (root/default) לא זז.
 *
 * a11y (maor_ui_scale/maor_acc) נשארים גלובליים **במכוון** — העדפות-נגישות הן
 * פר-אדם. נעילת ה-PIN (maor_lock) עברה לפר-ארגון (הכרעת בעלים "5.3 פר ארגון").
 */
import { describe, expect, it } from 'vitest';
import { nsLsKey, setPersistNamespace } from '../../store/persist';
import { lockKey } from '../../lib/lock';
import lockSrc from '../../lib/lock.ts?raw';
import dayGateSrc from '../wheel/DayGate.tsx?raw';
import bodyMapSrc from '../timer/BodyMap.tsx?raw';
import moneyTimerSrc from '../timer/MoneyTimer.tsx?raw';
import appSrc from '../../App.tsx?raw';
import famDetailSrc from '../families/FamilyDetail.tsx?raw';

describe('🔌 ratchet — באג-3: מפתחות יום/גאדג׳טים ממורחבי-שמות', () => {
  it('nsLsKey על מפתחות היום/הגאדג׳טים — default ללא סיומת, slug עם סיומת', () => {
    setPersistNamespace('default');
    for (const k of ['maor_day', 'maor_dayend', 'maor_autoexp', 'maor_bodymap', 'maor_timer_collections']) {
      expect(nsLsKey(k)).toBe(k);
    }
    setPersistNamespace('org-b');
    expect(nsLsKey('maor_bodymap')).toBe('maor_bodymap:org-b');
    expect(nsLsKey('maor_timer_collections')).toBe('maor_timer_collections:org-b');
    expect(nsLsKey('maor_day')).toBe('maor_day:org-b');
  });

  it('שער-היום (DayGate) ניגש למפתחות רק דרך nsLsKey', () => {
    expect(dayGateSrc).toContain('nsLsKey(DAY_KEY)');
    expect(dayGateSrc).toContain('nsLsKey(DAY_END_KEY)');
    // אין גישה ישירה למפתח בלי העטיפה
    expect(dayGateSrc).not.toMatch(/getItem\(DAY_KEY\)/);
    expect(dayGateSrc).not.toMatch(/setItem\(DAY_KEY,/);
    expect(dayGateSrc).not.toMatch(/setItem\(DAY_END_KEY,/);
  });

  it('הגיבוי האוטומטי (App) קורא/כותב maor_autoexp+maor_dayend דרך nsLsKey', () => {
    expect(appSrc).toContain("nsLsKey('maor_autoexp')");
    expect(appSrc).toContain("nsLsKey('maor_dayend')");
    expect(appSrc).not.toMatch(/getItem\('maor_autoexp'\)/);
    expect(appSrc).not.toMatch(/setItem\('maor_autoexp',/);
  });

  it("מפת אזורי-הטיפול (BodyMap) — LS_KEY והעברת-הלקוח דרך nsLsKey", () => {
    expect(bodyMapSrc).toContain('nsLsKey(LS_KEY)');
    expect(bodyMapSrc).toContain("nsLsKey('maor_bodymap_client')");
    expect(bodyMapSrc).not.toMatch(/getItem\(LS_KEY\)/);
    expect(bodyMapSrc).not.toMatch(/getItem\('maor_bodymap_client'\)/);
  });

  it('טיימר-הכסף (MoneyTimer) — LS_KEY והעברת-הלקוח דרך nsLsKey', () => {
    expect(moneyTimerSrc).toContain('nsLsKey(LS_KEY)');
    expect(moneyTimerSrc).toContain("nsLsKey('maor_timer_client')");
    expect(moneyTimerSrc).not.toMatch(/getItem\(LS_KEY\)/);
    expect(moneyTimerSrc).not.toMatch(/getItem\('maor_timer_client'\)/);
  });

  it('שני צדי ההעברה (כרטיס המשפחה כותב · הגאדג׳ט קורא) משתמשים באותו מפתח ממורחב', () => {
    // כרטיס המשפחה כותב דרך nsLsKey — חייב להתאים לקריאה בגאדג׳ט
    expect(famDetailSrc).toContain("nsLsKey('maor_timer_client')");
    expect(famDetailSrc).toContain("nsLsKey('maor_bodymap_client')");
    expect(famDetailSrc).not.toMatch(/setItem\('maor_timer_client',/);
    expect(famDetailSrc).not.toMatch(/setItem\('maor_bodymap_client',/);
  });
});

// באג 5.3 (הכרעת בעלים "פר ארגון") — נעילת ה-PIN מבודדת פר-ארגון + מיגרציה רכה.
describe('🔒 ratchet — נעילת-PIN פר-ארגון (5.3)', () => {
  it('lockKey: default ⇒ מפתח ישן (ביט-זהה); ארגון ⇒ מפתח ממורחב; חזרה ל-default מאפסת', () => {
    setPersistNamespace('default');
    expect(lockKey()).toBe('maor_lock');
    setPersistNamespace('org-x');
    expect(lockKey()).toBe('maor_lock:org-x');
    setPersistNamespace('default'); // באג-לוואי שתוקן: 'default' מאפס את התחום
    expect(lockKey()).toBe('maor_lock');
  });

  it('הגנת-מקור: readLock/writeLock ניגשים דרך lockKey (פר-ארגון) + מיגרציה רכה ל-bare', () => {
    // כתיבה/קריאה דרך lockKey() — לא מפתח קשיח
    expect(lockSrc).toContain('const key = lockKey()');
    expect(lockSrc).toMatch(/localStorage\.setItem\(key,/);
    expect(lockSrc).toMatch(/localStorage\.removeItem\(key\)/);
    // מיגרציה רכה: ארגון בלי נעילה משלו נופל חזרה ל-bare LOCK_BASE (לא מאבד PIN)
    expect(lockSrc).toContain('key !== LOCK_BASE');
    expect(lockSrc).toContain('localStorage.getItem(LOCK_BASE)');
    // אין גישה ישירה למפתח קשיח 'maor_lock' (רק דרך LOCK_BASE/lockKey)
    expect(lockSrc).not.toMatch(/getItem\('maor_lock'\)/);
    expect(lockSrc).not.toMatch(/setItem\('maor_lock',/);
  });
});
